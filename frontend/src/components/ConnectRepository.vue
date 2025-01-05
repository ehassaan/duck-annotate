<template>
    <v-form :class="$style.form">
        <v-select v-on:click="fetchSchemas" :loading="loadingSchemas" v-model="vmSchema" :items="vmAllSchemas"
            label="Select Schema" @update:model-value="fetchRepos" :class="$style.field"
            hint="Selected repository must already be synced to the selected schema using AirByte Github Connector"></v-select>

        <v-select v-model="vmRepo" :items="vmAllRepos" :loading="loadingRepos" label="Select Repository"
            :class="$style.field" hint="Select the repository used to infer the column and table metadata"></v-select>

        <v-select label="Authentication" :class="$style.field" :items="['Public', 'Github SSO']"></v-select>

        <v-btn :class="$style.button" color="primary" :loading="loadingClone" @click="clone" type="button">Scan</v-btn>


        <v-label :class="$style.field">{{ message }}</v-label>

        <v-btn :class="$style.button" color="primary" :loading="loadingClone" @click="testVectors"
            type="button">Vectorize</v-btn>

        <!-- <v-btn :loading="loading" class="mt-2" type="button" @click="connect" block color="primary">Connect</v-btn> -->


        <!-- <v-select v-if="!vmIsAllTables" v-model="vmSelectedTables" :loading="loadingTables" :items="tables" multiple
            label="Select Tables to Annotate"></v-select>

        <v-btn class="mt-2" type="button" @click="submit" block color="primary">Next</v-btn> -->

    </v-form>

</template>

<script setup lang="ts">

import { onBeforeMount, ref, type PropType } from 'vue';
import { MDConnection } from '@motherduck/wasm-client';
import { cloneRepo } from '@/utils/gitUtil';
import { getAllChunks, scanDirectory, type Chunk } from '@/utils/scanUtil';
import * as embed from '@/utils/embeddingUtil';
import * as storage from "@/utils/storageUtil";

const vmMotherduck = ref({
    tables: [],
    token: "",
    schema: "",
    database: "",
});

const vmAllSchemas = ref<string[]>([]);
const vmAllRepos = ref<string[]>([]);
const loadingSchemas = ref(false);
const loadingRepos = ref(false);
const loadingClone = ref(false);
const vmRepo = ref("");
const vmSchema = ref<string>();
const emit = defineEmits(["connect", "submit"]);
const message = ref("");
const tables = ref<string[]>([]);
let connection: MDConnection | null = null;
let engine: any = null;


onBeforeMount(async () => {
    const md = localStorage.getItem("motherduck");
    if (!md) return;

    vmMotherduck.value = JSON.parse(md);
});

async function fetchSchemas() {
    loadingSchemas.value = true;
    try {
        if (!connection) {
            connection = MDConnection.create({
                mdToken: vmMotherduck.value.token,
            });
            await connection.isInitialized();
        }
        const res = await connection.evaluatePreparedStatement("select distinct schema_name from information_schema.schemata where catalog_name=?", [vmMotherduck.value.database]);
        console.log('query result', res);
        vmAllSchemas.value = res.data.toRows().map((r: any) => r.schema_name) as string[];
    }
    catch (err) {
        console.log('query failed', err);
        message.value = "Failed to fetch schemas: " + err;
    }
    finally {
        loadingSchemas.value = false;
    }
}

async function fetchRepos(schema: string) {
    console.log("Fetching repos: ", schema);
    if (!schema) return;

    loadingRepos.value = true;
    try {
        if (!connection) {
            connection = MDConnection.create({
                mdToken: vmRepo.value,
            });
            await connection.isInitialized();
        }
        const res = await connection.evaluateQuery(`select distinct full_name, url from ${vmMotherduck.value.database.replaceAll(" ", "")}.${schema.replaceAll(" ", "")}.repositories`);
        console.log('query result', res);
        vmAllRepos.value = res.data.toRows().map((r: any) => r.full_name) as string[];
    }
    catch (err) {
        console.log('query failed', err);
        message.value = "Failed to fetch repos: " + err;
    }
    finally {
        loadingRepos.value = false;
    }
}

async function clone() {
    loadingClone.value = true;
    try {
        message.value = "Cloning...";
        const dir = await cloneRepo();
        await scanRepo(dir);
    }
    catch (err) {
        console.log("Error while cloning: ", err);
    }
    finally {
        loadingClone.value = false;
        message.value = "";
    }
}

async function scanRepo(dir: FileSystemDirectoryHandle) {
    message.value = "Scanning Repository...";
    const files = await scanDirectory(dir, ".+[.]py");
    message.value = `Analyzing ${files.length} files...`;
    const chunks = await getAllChunks(files, 500);
    console.log("Files: ", files, chunks);
    engine = embed.createEngine();
    await embed.indexDocs(engine, chunks);
    const serialized = embed.serializeEngine(engine)
    await storage.setKey("engine", serialized);
}


async function testVectors() {
    const config = await storage.getKey("engine");
    engine = embed.deserializeEngine(config);
    const results = embed.search(engine, "product");
    console.log("Similar: ", results);
    console.log("Docs: ", engine.getDocs());
}

// async function connect() {
//     message.value = "Connecting...";
//     loading.value = true;

//     try {
//         connection = MDConnection.create({
//             mdToken: vmRepo.value,
//         });
//         await connection.isInitialized();
//         const schemaRes = await connection.evaluatePreparedStatement("select schema_name from information_schema.schemata where catalog_name=?", [vmName.value]);
//         console.log('query result', schemaRes);
//         message.value = `Connection Successful. ${schemaRes.data.rowCount} schemas found.`;
//         vmAllSchemas.value = schemaRes.data.toRows().map((r: any) => r.schema_name) as string[];

//     } catch (err) {
//         console.log('query failed', err);
//         message.value = `Connection Failed: ${err}`;
//         loading.value = false;
//         return;
//     }
//     connValues.database = vmName.value;
//     connValues.token = vmRepo.value;

//     emit('connect', { name: vmName.value, token: vmRepo.value });
//     loading.value = false;
// }

// async function submit() {
//     if (vmIsAllTables.value) {
//         connValues.tables = { ...tables.value };
//     }
//     else {
//         connValues.tables = { ...vmSelectedTables.value };
//     }
//     console.log("Submitting: ", connValues);
//     emit("submit", connValues);
// }

</script>

<style module>
.form {
    display: flex;
    flex-direction: column;
}

.field {
    margin: 5px 0;
}

.button {
    align-self: flex-start;
}
</style>
