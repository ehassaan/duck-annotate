
export interface SchemaField {
    catalog_name: string;
    database_name: string;
    schema_name: string;
    table_name: string;
    column_name: string;
    data_type: string;
    comment: string | null;
    comment_approved: boolean | null;
    created_at?: Date;
}