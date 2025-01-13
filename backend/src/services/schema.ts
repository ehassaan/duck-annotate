


const sqlCols = `
    select c.table_schema, st.relname as "table_name", c.column_name, 
    pgd.description as "comment"
    from pg_catalog.pg_statio_all_tables as st
    inner join information_schema.columns c
    on c.table_schema = st.schemaname
    and c.table_name = st.relname
    left join pg_catalog.pg_description pgd
    on pgd.objoid=st.relid
    and pgd.objsubid=c.ordinal_position
`;

async function fetchSchema() {

}