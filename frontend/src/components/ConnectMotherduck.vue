<template>
    <v-form>
        <v-text-field required v-model="vmName" label="Database Name"></v-text-field>
        <v-text-field required v-model="vmToken" label="Token"></v-text-field>

        <v-btn :loading="loading" class="button" type="button" @click="connect" block color="primary">Connect</v-btn>

        <v-label class="field">{{ message }}</v-label>

        <v-select v-model="vmSchema" class="field" :items="schemas" @update:model-value="fetchTables"
            label="Select Schema to Annotate"></v-select>

        <v-checkbox label="Annotate all tables" class="field" v-model="vmIsAllTables"></v-checkbox>
        <v-select v-if="!vmIsAllTables" class="field" v-model="vmSelectedTables" :loading="loadingTables"
            :items="tables" multiple label="Select Tables to Annotate"></v-select>

        <v-btn class="button" type="button" @click="submit" block color="primary">Next</v-btn>

    </v-form>

</template>

<script setup lang="ts">

import { ref } from 'vue';
import { MDConnection } from '@motherduck/wasm-client';

const vmName = ref("");
const vmToken = ref("");
const vmSchema = ref<string>();
const emit = defineEmits(["connect", "submit"]);
const message = ref("");
const loading = ref(false);
const schemas = ref<string[]>([]);
const tables = ref<string[]>([]);
const loadingTables = ref(false);
const vmIsAllTables = ref(true);
const vmSelectedTables = ref<string[]>([]);
let connection: MDConnection | null = null;
const connValues: {
    database?: string,
    token?: string,
    schema?: string,
    tables?: string[];
} = {};

async function connect() {
    message.value = "Connecting...";
    loading.value = true;

    try {
        connection = MDConnection.create({
            mdToken: vmToken.value,
        });
        await connection.isInitialized();
        const schemaRes = await connection.evaluatePreparedStatement("select schema_name from information_schema.schemata where catalog_name=?", [vmName.value]);
        console.log('query result', schemaRes);
        message.value = `Connection Successful. ${schemaRes.data.rowCount} schemas found.`;
        schemas.value = schemaRes.data.toRows().map((r: any) => r.schema_name) as string[];

    } catch (err) {
        console.log('query failed', err);
        message.value = `Connection Failed: ${err}`;
        loading.value = false;
        return;
    }
    connValues.database = vmName.value;
    connValues.token = vmToken.value;

    emit('connect', { name: vmName.value, token: vmToken.value });
    loading.value = false;
}

async function fetchTables(schema: string) {
    console.log("Fetching tables: ", schema);
    if (!connection) {
        return;
    }
    connValues.schema = schema;
    loadingTables.value = true;
    const tableRes = await connection.evaluatePreparedStatement("select distinct table_name from information_schema.tables where table_catalog=? and table_schema=?", [vmName.value, schema]);
    console.log('query result', tableRes);
    tables.value = tableRes.data.toRows().map((r: any) => r.table_name) as string[];
    loadingTables.value = false;
}

async function submit() {
    if (vmIsAllTables.value) {
        connValues.tables = { ...tables.value };
    }
    else {
        connValues.tables = { ...vmSelectedTables.value };
    }
    console.log("Submitting: ", connValues);
    emit("submit", connValues);
}

</script>
<style scoped>

.button {
    min-width: 70px;
    margin: 5px 0;
}

.field {
    margin: 5px 0;
}
</style>