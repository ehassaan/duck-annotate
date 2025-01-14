
import type { EmbeddingChunk, EmbeddingStatus } from '@/entities/embedding';
import type { SchemaField } from '@/entities/SchemaField';
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
    db = MDConnection.create({
        mdToken: token,
    });
    if (!await db.isInitialized()) {
        throw new Error('Failed to initialize connection');
    }
}

export async function disconnect() {
    await db?.close();
    connInfo = null;
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

export async function fetchSchemaTables(database: string, schema: string) {
    if (!db) throw Error("Database is not initialized");
    const tableRes = await db.evaluateQuery(`select distinct table_name from "${database}"."${schema}".column_metadata`);
    console.log('query result', tableRes);
    const tables = tableRes.data.toRows().map((r: any) => r.table_name) as string[];
    return tables;
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

export async function updateColumnMetadata(database: string, schema: string, data: SchemaField[]) {
    if (!db) throw Error("Database is not initialized");

    await db.evaluateQuery(`USE "${database}"."${schema}"`);

    await db.evaluateQuery(`CREATE SEQUENCE IF NOT EXISTS '_dl_column_metadata_id_seq';`);

    await db.evaluateQuery(`
        CREATE TABLE IF NOT EXISTS "${database}"."${schema}"."column_metadata" (
        id INTEGER NOT NULL PRIMARY KEY DEFAULT nextval('"${schema}"._dl_column_metadata_id_seq'),
        catalog_name TEXT NOT NULL,
        database_name TEXT NOT NULL,
        schema_name TEXT NOT NULL,
        table_name TEXT NOT NULL,
        column_name TEXT NOT NULL,
        data_type TEXT NOT NULL,
        comment TEXT,
        comment_approved BOOLEAN,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    `);

    await insertData(database, schema, 'column_metadata', data);
}

export async function fetchColumnMetadata(database: string, schema: string, table?: string) {
    if (!db) throw Error("Database is not initialized");
    console.log("Fetching columns for", database, schema, table);
    const query = `
        SELECT * FROM (SELECT *, 
                row_number() over (
                partition by 
                    catalog_name,
                    schema_name,
                    table_name,
                    column_name
                ORDER BY created_at desc) 
                as _rn
            FROM "${database}"."${schema}".column_metadata
            ) info
        WHERE _rn=1 ${table ? `AND info.table_name='${table}'` : ''}
        ORDER BY info.column_name;
        `;
    console.debug("Running query: ", query);
    const columnRes = await db.evaluateQuery(query);
    const columns = columnRes.data.toRows().map(r => ({ ...r } as unknown as SchemaField));
    console.log("Res: ", columns);
    return columns;
}




export async function loadInformationSource(database: string, schema: string, source_id: string, data: EmbeddingChunk[]) {
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


export async function similaritySearch(text: string, database: string, schema: string, maxItems = 10) {

    if (!db || !connInfo) throw Error("Database is not initialized");

    const query = `
        SELECT *,
        array_cosine_similarity(embedding(E${escape(text)}), "vector_embedding") as score 
        FROM "${database}"."${schema}".information_sources 
        ORDER BY score DESC
        LIMIT ${maxItems}
    `;
    console.debug("Running query: ", query);
    const res = await db.evaluateQuery(query);
    return res.data.toRows() as any as (EmbeddingChunk & { score: number; })[];
}


export async function completion(prompt: string) {

    if (!db || !connInfo) throw Error("Database is not initialized");

    const query = `SELECT prompt(E${escape(prompt)}) as data;`;
    console.debug("Running query: ", query);
    const res = await db.evaluateQuery(query);
    const data = res.data.toRows().map((r: any) => r.data) as string[];
    if (data && data.length > 0) {
        console.log(data[0]);
        return JSON.parse(_.trim(data[0].replace('```json', '```'), " \n`"));
    }
    else {
        console.error("Failed to parse LLM response: ", data);
        throw new Error('Failed to parse LLM response');
    }
}

