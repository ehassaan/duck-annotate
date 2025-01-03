
import { MDConnection } from "@motherduck/wasm-client";


export let db: MDConnection | null = null;

export async function connect(token: string) {
    const connection = MDConnection.create({
        mdToken: token,
    });
    if (!await connection.isInitialized()) {
        throw new Error('Failed to initialize connection');
    }
    db = connection;
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
}

export async function fetchColumns(database: string, schema: string, table: string) {
    if (!db) throw Error("Database is not initialized");
    console.log("Fetching columns for", database, schema, table);
    const columnRes = await db.evaluatePreparedStatement("select column_name, data_type, COLUMN_COMMENT as comment from information_schema.columns where table_catalog=? and table_schema=? and table_name=?", [database, schema, table]);
    const columns = columnRes.data.toRows().map(r => ({ ...r } as unknown as ColumnInfo));
    return columns;
}
