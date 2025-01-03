<template>
    <v-form :class="$style.form">

        <v-label :class="$style.field">{{ message }}</v-label>

        <v-btn v-if="props.token" :class="$style.button" type="button" @click="disconnect" block
            color="primary">Disconnect</v-btn>

        <v-text-field density="compact" :class="$style.field" v-if="!props.token" required v-model="vmToken"
            label="Token"></v-text-field>

        <v-btn v-if="!props.token" :loading="loading" :class="$style.button" type="button" @click="connect" block
            color="primary">Connect</v-btn>

        <v-select density="compact" v-model="vmDatabase" :class="$style.field" :items="databases"
            @update:model-value="fetchSchemas" label="Select Database"></v-select>

        <v-select density="compact" :class="$style.field" v-model="vmSchema" :items="schemas"
            @update:model-value="fetchTables" label="Select Schema to Annotate"></v-select>

        <v-checkbox density="compact" :class="$style.field" label="Annotate all tables"
            v-model="vmIsAllTables"></v-checkbox>

        <v-select density="compact" v-if="!vmIsAllTables" :class="$style.field" v-model="vmSelectedTables"
            :loading="loadingTables" :items="tables" multiple label="Select Tables to Annotate"></v-select>

        <v-btn :class="$style.button" type="button" @click="submit" block color="primary">Save</v-btn>

    </v-form>

</template>

<script setup lang="ts">

import { onMounted, ref } from 'vue';
import * as md from "@/utils/mdUtil";

const props = defineProps({
    token: {
        type: String,
        required: false
    },
    database: {
        type: String,
        default: "main"
    },
    schema: {
        type: String,
        default: "main"
    }
});
const emit = defineEmits(["connect", "submit", "disconnect"]);
const vmToken = ref(props.token ?? "");
const vmSchema = ref<string>();
const vmDatabase = ref(props.database);
const message = ref("");
const loading = ref(false);
const databases = ref<string[]>([]);
const schemas = ref<string[]>([]);
const tables = ref<string[]>([]);
const loadingTables = ref(false);
const vmIsAllTables = ref(true);
const vmSelectedTables = ref<string[]>([]);

onMounted(async () => {
    if (!vmToken.value) {
        return;
    }
    await connect();
    await fetchSchemas();
    await fetchTables(props.schema);
    vmDatabase.value = props.database;
    vmSchema.value = props.schema;
});

async function disconnect() {
    await md.disconnect();
    vmToken.value = "";
    emit('disconnect');
}

async function connect() {
    if (!vmToken.value) {
        message.value = "Error: Token is null";
        return;
    }
    message.value = "Connecting...";
    loading.value = true;

    try {
        await md.connect(vmToken.value);
        const dbRes = await md.fetchDatabases();
        message.value = `Connection Successful. ${dbRes.length} databases found.`;
        databases.value = dbRes;
    } catch (err) {
        console.log('query failed', err);
        message.value = `Connection Failed: ${err}`;
        return;
    }
    finally {
        loading.value = false;
    }
}

async function fetchSchemas() {
    if (!md.db) {
        return;
    }
    loading.value = true;
    try {
        const schemaRes = await md.fetchSchemas(vmDatabase.value);
        console.log('query result', schemaRes);
        schemas.value = schemaRes;
    } catch (err) {
        console.log('query failed', err);
    }
    finally {
        loading.value = false;
    }
    loading.value = false;
}

async function fetchTables(schema: string) {
    console.log("Fetching tables: ", schema);
    if (!md.db) {
        return;
    }
    loadingTables.value = true;
    const tableRes = await md.fetchTables(vmDatabase.value, schema);
    console.log('query result', tableRes);
    tables.value = tableRes;
    loadingTables.value = false;
}

async function submit() {
    let tableList: string[];
    if (vmIsAllTables.value) {
        tableList = { ...tables.value };
    }
    else {
        tableList = { ...vmSelectedTables.value };
    }
    const connValues = {
        database: vmDatabase.value, token: vmToken.value, schema: vmSchema.value,
        tables: tableList
    };
    console.log("Submitting: ", connValues);
    emit("submit", connValues);
}

</script>
<style module>
.form {
    display: flex;
    flex-direction: column;
}

.button {
    min-width: 70px;
    margin: 8px 0;
    min-width: 150px !important;
    align-self: flex-start;
}

.field {
    margin-top: 12px;
}
</style>