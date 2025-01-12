
import { MDConnection } from "@motherduck/wasm-client";
import _ from "lodash";

// TODO: There seems to be some bug in motherduck wasm client which makes the evaluatePreparedStatment takes foverever. Using evaluateQuery() for now

export let db: MDConnection | null = null;

export let connInfo: any = {};

export function setCreds(creds: any) {
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
            from ${database}._metadata.column_metadata
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
        return `'${value}'`;
    }
    return `${value}`;
}

export async function insertData(database: string, schema: string, table: string, data: any[]) {
    if (!db) throw Error("Database is not initialized");
    const values = data.map(d => `(${Object.values(d).map(clean).join(",")})`).join(", ");
    const query = `INSERT INTO ${database}.${schema}.${table} (${Object.keys(data[0]).join(',')})
        VALUES ${values}`;
    console.log("Query: ", query);
    const result = await db.evaluateQuery(query);
}

export async function updateColumnMetadata(database: string, data: {
    schema_name: string,
    table_name: string,
    column_name: string,
    comment: string,
    comment_approved: boolean | null,
}[]) {
    if (!db) throw Error("Database is not initialized");

    await db.evaluateQuery(`USE ${database}._metadata`);

    await db.evaluateQuery(`CREATE SEQUENCE IF NOT EXISTS '_dl_column_metadata_id_seq';`);

    await db.evaluateQuery(`
        CREATE TABLE IF NOT EXISTS ${database}._metadata.column_metadata ( 
        id INTEGER NOT NULL PRIMARY KEY DEFAULT nextval('_metadata._dl_column_metadata_id_seq'),
        database_name TEXT NOT NULL,
        schema_name TEXT NOT NULL,
        table_name TEXT NOT NULL,
        column_name TEXT NOT NULL,
        comment TEXT,
        comment_approved BOOLEAN,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    `);

    await insertData(database, "_metadata", 'column_metadata', data);
}
