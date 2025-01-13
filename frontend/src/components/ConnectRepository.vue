<template>
    <v-form :class="$style.form">

        <v-list :items="vmInfoSources" v-if="vmInfoSources.length > 0"></v-list>

        <div v-if="!addingIssues && !addingSource" :class="$style.source_btn_container">
            <v-btn prepend-icon="mdi-code-tags" @click="addSourceCode" :class="$style.button">Source Code</v-btn>
            <v-btn prepend-icon="mdi-github" @click="addGithubIssues" :class="$style.button">Github Issues</v-btn>
        </div>

        <div v-if="addingIssues" class="mt-4">
            <v-select density="default" v-on:click="fetchSchemas" :loading="loadingSchemas" v-model="vmSchema"
                :items="vmAllSchemas" label="Select Schema" @update:model-value="fetchRepos" :class="$style.field"
                hint="Selected repository must already be synced to the selected schema using AirByte Github Connector"></v-select>

            <v-select density="default" v-model="vmRepo" :items="vmAllRepos" :loading="loadingRepos"
                label="Select Repository" :class="$style.field" item-title="full_name" item-value="url"
                hint="Select the repository used to infer the column and table metadata"></v-select>
        </div>

        <div v-if="addingSource" :class="$style.source_code_container">
            <v-select label="Authentication" hide-details v-model="vmProvider" density="default"
                :class="[$style.field, $style.provider]" :items="['Public', 'Github', 'Local']"></v-select>
            <v-btn v-if="vmProvider === 'Github'" prepend-icon="mdi-github" @click="onLoginGithub"
                :class="$style.button">{{ githubToken ? 'Disconnect Github' : 'Login with Github' }}</v-btn>

            <v-text-field label="Git URL" v-model="vmRepo" :class="$style.field"></v-text-field>

        </div>

        <div v-if="addingIssues || addingSource" class="mb-4">
            <v-btn :loading="loadingClone" :class="$style.button" @click="onAdd" :elevation="4">Add</v-btn>
            <v-btn :class="$style.button" color="secondary" :elevation="4" @click="cancelAdd">Cancel</v-btn>
        </div>

        <v-label :class="$style.field">{{ message }}</v-label>

    </v-form>

</template>

<script setup lang="ts">

import { onBeforeMount, ref, type PropType } from 'vue';
import { MDConnection } from '@motherduck/wasm-client';
import { cloneRepo, readLocal } from '@/utils/gitUtil';
import { getAllChunks, scanDirectory, type Chunk } from '@/utils/scanUtil';
import * as embed from '@/utils/embeddingUtil';
import * as storage from "@/utils/storageUtil";
import * as oauth from "@/utils/oauth";
import * as md from "@/services/motherduck";
import * as auth from '@/services/auth';

const vmMotherduck = ref({
    tables: [],
    token: "",
    schema: "",
    database: "",
});

const vmAllSchemas = ref<string[]>([]);
const vmInfoSources = ref<{ type: string; path: string; }[]>([]);
const vmAllRepos = ref<{ full_name: string; url: string; }[]>([]);
const loadingSchemas = ref(false);
const loadingRepos = ref(false);
const loadingClone = ref(false);
const addingIssues = ref(false);
const addingSource = ref(false);
const vmRepo = ref<string>();
const vmProvider = ref('Public');
const vmSchema = ref<string>();
const emit = defineEmits(["connect", "submit"]);
const message = ref("");
let engine: any = null;
let githubToken = ref<string>();


onBeforeMount(async () => {
    vmMotherduck.value = md.connInfo;
});

async function fetchSchemas() {
    loadingSchemas.value = true;
    try {
        await md.connect(vmMotherduck.value.token);
        vmAllSchemas.value = await md.fetchSchemas(md.connInfo.database);
        // const res = await connection.evaluatePreparedStatement("select distinct schema_name from information_schema.schemata where catalog_name=?", [vmMotherduck.value.database]);
        // console.log('query result', res);
        // vmAllSchemas.value = res.data.toRows().map((r: any) => r.schema_name) as string[];
    }
    catch (err) {
        console.log('query failed', err);
        message.value = "Failed to fetch schemas: " + err;
    }
    finally {
        loadingSchemas.value = false;
    }
}

async function addGithubIssues() {
    addingIssues.value = true;
}

async function addSourceCode() {
    addingSource.value = true;
}

async function onAdd() {
    if (addingIssues.value) {
        if (!vmRepo.value) {
            message.value = "Please select a repository";
            return;
        }
        vmInfoSources.value.push({
            type: "github_issues",
            path: vmRepo.value,
        });
    }
    else if (addingSource.value) {
        if (vmProvider.value === "Local") {
            await readLocalGit();
        }
        else {
            await clone();
        }
    }
}

async function cancelAdd() {
    addingIssues.value = false;
    addingSource.value = false;
}

async function fetchRepos(schema: string) {
    console.log("Fetching repos: ", schema);
    if (!schema) return;

    loadingRepos.value = true;
    try {
        const res = await md.db?.evaluateQuery(`select distinct full_name, url from ${vmMotherduck.value.database.replaceAll(" ", "")}.${schema.replaceAll(" ", "")}.repositories`);
        console.log('query result', res);
        if (!res) throw Error("Did not find any repositories data in selected schema");
        vmAllRepos.value = res?.data.toRows() as any;
    }
    catch (err) {
        console.log('query failed', err);
        message.value = "Failed to fetch repos: " + err;
    }
    finally {
        loadingRepos.value = false;
    }
}

async function onLoginGithub() {
    console.log("On login github");
    // if (githubToken.value) {
    // await oauth.logout("github");
    // }
    try {
        await auth.signinSocial("github");
    }
    catch (err) {
        console.log("Failed to login: ", err);
    }
}

async function readLocalGit() {
    loadingClone.value = true;
    console.log("Reading: ", vmProvider.value, vmRepo.value);
    try {
        message.value = "Loading...";
        const dir = await readLocal();
        await scanRepo(dir);
    }
    catch (err) {
        console.log("Error while reading: ", err);
    }
    finally {
        loadingClone.value = false;
        message.value = "";
    }
}

async function clone() {
    loadingClone.value = true;
    console.log("Cloning: ", vmProvider.value, vmRepo.value);
    try {
        if (!vmRepo.value) {
            message.value = "Please select a repository";
            return;
        }
        if (vmProvider.value === "Github") {
            message.value = "Cloning...";
            const chunks = await cloneRepo(vmRepo.value);
            await saveChunks(chunks);
        }
        else if (vmProvider.value === "Public") {
            message.value = "Cloning...";
            const chunks = await cloneRepo(vmRepo.value);
            await saveChunks(chunks);
        }
    }
    catch (err) {
        console.log("Error while cloning: ", err);
    }
    finally {
        loadingClone.value = false;
        // message.value = "";
    }
}

async function scanRepo(dir: FileSystemDirectoryHandle) {
    message.value = "Scanning Repository...";
    const files = await scanDirectory(dir, ".+[.]py");
    message.value = `Analyzing ${files.length} files...`;
    const chunks = await getAllChunks(files, 500);
    console.log("Files: ", files, chunks);
    await saveChunks(chunks);
}

async function saveChunks(chunks: Chunk[]) {
    engine = embed.createEngine();
    await embed.indexDocs(engine, chunks);
    const serialized = embed.serializeEngine(engine);
    await storage.setKey("engine", serialized);
}


async function testVectors() {
    const config = await storage.getKey("engine");
    engine = embed.deserializeEngine(config);
    const results = embed.search(engine, "product");
    console.log("Similar: ", results);
    console.log("Docs: ", engine.getDocs());
}


</script>

<style module>
.form {
    display: flex;
    flex-direction: column;
}

.source_btn_container {
    display: flex;
    flex-direction: column;
}

.field {
    margin: 8px 8px 0 0;
}

.button {
    max-width: 200px;
    margin-right: 8px;
    margin-top: 8px;
}

.source_code_container {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    max-width: 500px;
    margin-bottom: 15px;
}

.provider {
    max-width: 300px;
    margin-right: 10px;
}
</style>
