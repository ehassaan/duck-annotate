import { Pool } from 'pg';


export function partialUpsert(tableName: string, confictFields: string[], obj: any) {

    const definedFields = Object.entries(obj).filter(([key, value]) => value !== undefined && key !== 'id');

    if (definedFields.length === 0) {
        return null;
    }
    for (const field of confictFields) {
        if (!Object.keys(obj).includes(field)) {
            return null;
        }
    }

    let query = `
        insert into ${tableName}(${definedFields.map(f => '"' + f[0] + '"').join(', ')})
            values(${definedFields.map((f, i) => '$' + (i + 1)).join(', ')})
        on conflict(${confictFields.map(f => '"' + f + '"').join(', ')})
        do update set 
    `;
    const params = [];
    for (const [index, field] of definedFields.entries()) {
        query += `"${field[0]}" = $${index + 1}, `;
        params.push(field[1]);
    }
    query = query.slice(0, -2);
    return { query, params };
}

export function partialUpdate(tableName: string, obj: any) {

    const definedFields = Object.entries(obj).filter(([key, value]) => value !== undefined && key !== 'id');

    if (definedFields.length === 0) {
        return null;
    }

    let query = `UPDATE "${tableName}" SET `;
    const params = [];
    for (const [index, field] of definedFields.entries()) {
        query += `"${field[0]}" = $${index}, `;
        params.push(field[1]);
    }
    query = query.slice(0, -2);
    return { query, params };
}