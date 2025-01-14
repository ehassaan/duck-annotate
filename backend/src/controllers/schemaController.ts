import Elysia, { t } from 'elysia';
import { Pool } from "pg";


export default new Elysia({ prefix: '/schema/postgres/fetch' })
    .post('/', async ({ body, error }) => {

        try {
            let conn = new Pool({
                host: body.host,
                port: body.port,
                user: body.username,
                password: body.password,
                database: body.database,
                ssl: true
            });

            let res = await conn.query(`
                select 
                    c.table_catalog as database_name,
                    c.table_schema as schema_name,
                    c.table_name,
                    c.column_name, 
                    c.data_type,
                    pgd.description as "comment"
                from pg_catalog.pg_statio_all_tables as st
                inner join information_schema.columns c
                    on c.table_schema = st.schemaname
                    and c.table_name = st.relname
                left join pg_catalog.pg_description pgd
                    on pgd.objoid=st.relid
                    and pgd.objsubid=c.ordinal_position
                where c.table_schema not in ('pg_catalog', 'information_schema')
            `);
            return {
                message: "Success",
                data: res.rows
            };
        }
        catch (err) {
            console.error("Failed to fetch schema: ", err);
            return error(422, {
                message: "Failed to fetch schema",
            })
        }
    }, {
        body: t.Object({
            host: t.String(),
            port: t.Number({ minimum: 1 }),
            username: t.String(),
            password: t.String(),
            database: t.String(),
        })
    });
