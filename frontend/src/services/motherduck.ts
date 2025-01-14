
import { MDConnection } from "@motherduck/wasm-client";
import _ from "lodash";
import { escape } from 'sqlstring';

// TODO: There seems to be some bug and limitations in evaluatePreparedStatment in wasm-client. Using evaluateQuery() for now

export let db: MDConnection | null = null;

export interface MDCreds {
    token: string;
    database: string;
    schema: string;
    destinationId: string;
}

export let connInfo: MDCreds | null = null;

export function setCreds(creds: MDCreds) {
    connInfo = creds;
}

export async function connect(token: string) {
    const connection = MDConnection.create({
        mdToken: token,
    });
    if (!await connection.isInitialized()) {
        throw new Error('Failed to initialize connection');
    }
    db = connection;
    connInfo = connInfo;
}

export async function disconnect() {
    await db?.close();
}

export async function createSchema(database: string, name: string, ignoreIfExist: boolean) {
    if (!db) throw Error("Database is not initialized");
    const query = `CREATE SCHEMA ${ignoreIfExist ? 'IF NOT EXISTS ' : ''}"${database}"."${name}"`;
    await db.evaluateQuery(query);
}

export async function fetchDatabases() {
    if (!db) throw Error("Database is not initialized");
    const databaseRes = await db.evaluateQuery("select distinct catalog_name from information_schema.schemata");
    const databases = databaseRes.data.toRows().map((r: any) => r.catalog_name) as string[];
    return databases;
}

export async function fetchSchemas(database: string) {
    if (!db) throw Error("Database is not initialized");
    const schemaRes = await db.evaluatePreparedStatement("select schema_name from information_schema.schemata where catalog_name=?", [database]);
    const schemas = schemaRes.data.toRows().map((r: any) => r.schema_name) as string[];
    return schemas;
}

export async function fetchTables(database: string, schema: string) {
    if (!db) throw Error("Database is not initialized");
    const tableRes = await db.evaluatePreparedStatement("select distinct table_name from information_schema.tables where table_catalog=? and table_schema=?", [database, schema]);
    console.log('query result', tableRes);
    const tables = tableRes.data.toRows().map((r: any) => r.table_name) as string[];
    return tables;
}

export interface ColumnInfo {
    column_name: string;
    data_type: string;
    comment: string;
    comment_approved: boolean | null;
    created_at: Date;
}

export async function fetchColumnMetadata(database: string, schema: string, table: string) {
    if (!db) throw Error("Database is not initialized");
    console.log("Fetching columns for", database, schema, table);
    const columnRes = await db.evaluateQuery(`
        select info.column_name, 
        info.data_type,
        cmeta.comment as comment,
        cmeta.comment_approved as comment_approved,
        cmeta.created_at as created_at
        from duckdb_columns() info
        left join 
            (select *, 
                row_number() over (
                partition by 
                    database_name,
                    table_name,
                    column_name,
                    schema_name 
                order by created_at desc) 
                as _rn
            from "${database}"."${schema}".column_metadata
            ) cmeta
            on cmeta.table_name = info.table_name 
                AND cmeta.column_name = info.column_name 
                AND cmeta.schema_name = info.schema_name 
                AND cmeta.database_name = info.database_name
                AND _rn=1
        where info.database_name='${database}' and info.schema_name='${schema}' and info.table_name='${table}'
        order by info.column_index;
        `);
    //, [database, schema, table]);
    const columns = columnRes.data.toRows().map(r => ({ ...r } as unknown as ColumnInfo));
    return columns;
}

function clean(value: any) {
    if (_.isUndefined(value) || _.isNull(value)) return "null";
    if (typeof value === "string") {
        return `E${escape(value)}`;
    }
    return `${value}`;
}

export async function insertData(database: string, schema: string, table: string, data: any[]) {
    if (!db) throw Error("Database is not initialized");
    const values = data.map(d => `(${Object.values(d).map(clean).join(",")})`).join(", ");
    const query = `INSERT INTO "${database}"."${schema}"."${table}" (${Object.keys(data[0]).join(',')})
        VALUES ${values}`;
    console.log("Query: ", query);
    const result = await db.evaluateQuery(query);
}

export async function updateColumnMetadata(database: string, schema: string, data: {
    schema_name: string,
    table_name: string,
    column_name: string,
    comment: string,
    comment_approved: boolean | null,
}[]) {
    if (!db) throw Error("Database is not initialized");

    await db.evaluateQuery(`USE "${database}"."${schema}"`);

    await db.evaluateQuery(`CREATE SEQUENCE IF NOT EXISTS '_dl_column_metadata_id_seq';`);

    await db.evaluateQuery(`
        CREATE TABLE IF NOT EXISTS "${database}"."${schema}"."column_metadata" ( 
        id INTEGER NOT NULL PRIMARY KEY DEFAULT nextval('"${schema}"._dl_column_metadata_id_seq'),
        database_name TEXT NOT NULL,
        schema_name TEXT NOT NULL,
        table_name TEXT NOT NULL,
        column_name TEXT NOT NULL,
        comment TEXT,
        comment_approved BOOLEAN,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    `);

    await insertData(database, schema, 'column_metadata', data);
}

export async function loadInformationSource(database: string, schema: string, source_id: string, data: {
    source_id: string,
    source_type: string,
    title: string;
    description: string;
}[]) {
    if (!db) throw Error("Database is not initialized");

    const query = `
        CREATE TABLE IF NOT EXISTS "${database}"."${schema}"."information_sources" (
        source_id TEXT NOT NULL,
        source_type TEXT NOT NULL,
        title TEXT,
        description TEXT,
        vector_embedding FLOAT[512],
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    `;

    console.debug("Running query: ", query);
    await db.evaluateQuery(query);

    await db.evaluateQuery(`
    DELETE FROM "${database}"."${schema}"."information_sources"
    WHERE source_id='${source_id}';
    `);

    await insertData(database, schema, 'information_sources', data);

}


export async function generateEmbeddings(database: string, schema: string, source_id: string) {
    if (!db) throw Error("Database is not initialized");

    const query = `
        UPDATE "${database}"."${schema}".information_sources SOURCE 
        SET vector_embedding = embedding(concat(title, '\n  ', description))
        WHERE SOURCE.vector_embedding is null and len(SOURCE.description)>0 and source_id='${source_id}';
    `;

    await db.evaluateQuery(query);
}


export interface EmbeddingStatus {
    source_id: string;
    embeddings_generated: number;
    embeddings_missing: number;
    total_chunks: number;
    source_type: string;
}

export async function checkEmbeddingStatus(database: string, schema: string) {
    if (!db) throw Error("Database is not initialized");
    const query = `
        SELECT source_id,
            source_type,
            count(*) as total_chunks,
            count(*) filter(vector_embedding is not null) as embeddings_generated,
            count(*) filter(vector_embedding is null and len(description)>0) embeddings_missing
        FROM "${database}"."${schema}".information_sources 
        GROUP BY source_id, source_type
        ORDER BY source_id
    `;

    const res = await db.evaluateQuery(query);
    return res.data.toRows() as any as EmbeddingStatus[];
}
