<template>
    <v-form :class="$style.form">

        <v-progress-circular v-if="loadingList" style="align-self: center" indeterminate></v-progress-circular>
        <v-list :class="$style.list" v-if="vmInfoSources.length > 0">

            <v-list-item :prepend-icon="item.source_type == 'github_issues' ? 'mdi-github' : 'mdi-code-tags'"
                :class="$style.listitem" elevation="3" v-for="item in vmInfoSources" :key="item.source_id">

                <template v-slot:title>
                    <v-item-title>
                        {{ item.source_id }}
                    </v-item-title>
                </template>

                <template v-slot:default>
                    <p :class="$style.item_subtitle">
                        Embeddings: {{ item.embeddings_generated }} / {{ item.total_chunks }}<br>
                    </p>
                    <p :class="$style.item_subtitle">
                        Empty Chunks: {{ item.total_chunks - item.embeddings_generated - item.embeddings_missing }}
                    </p>
                </template>

                <template v-slot:append>
                    <div :class="$style.sourceActions">

                        <v-btn v-if="item.embeddings_missing" color="surface" :loading="item.loading"
                            @click="() => generateEmbeddings(item)">Generate
                            {{
                                item.embeddings_missing }} Embeddings</v-btn>

                    </div>
                </template>
            </v-list-item>

        </v-list>

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
                :class="$style.button">{{
                    githubToken ? 'Disconnect Github' : 'Login with Github' }}</v-btn>

            <v-text-field label="Git URL" v-model="vmRepo" :class="$style.field"></v-text-field>

        </div>

        <div v-if="addingIssues || addingSource" class="mb-4">
            <v-btn :loading="loadingAdd" :class="$style.button" @click="onAdd" :elevation="4">Add</v-btn>
            <v-btn :class="$style.button" color="secondary" :elevation="4" @click="cancelAdd">Cancel</v-btn>
        </div>

        <v-label :class="$style.field">{{ message }}</v-label>

    </v-form>

</template>

<script setup lang="ts">

import { onMounted, ref, type PropType } from 'vue';
import { cloneRepo, readLocal } from '@/utils/gitUtil';
import { createTextChunks, getAllChunks, scanDirectory, type Chunk } from '@/utils/scanUtil';
import * as embed from '@/utils/embeddingUtil';
import * as storage from "@/utils/storageUtil";
import * as md from "@/services/motherduck";
import * as auth from '@/services/auth';


const vmAllSchemas = ref<string[]>([]);
const vmInfoSources = ref<{
    source_type: string,
    source_id: string,
    embeddings_generated: number,
    embeddings_missing: number,
    total_chunks: number,
    loading?: boolean,
}[]>([]);
const vmAllRepos = ref<{ full_name: string; url: string; }[]>([]);
const loadingList = ref(false);
const loadingSchemas = ref(false);
const loadingRepos = ref(false);
const loadingAdd = ref(false);
const addingIssues = ref(false);
const addingSource = ref(false);
const vmRepo = ref<string>();
const vmProvider = ref('Public');
const vmSchema = ref<string>();
const emit = defineEmits(["connect", "submit"]);
const message = ref("");
let engine: any = null;
let githubToken = ref<string>();


onMounted(async () => {
    loadingList.value = true;
    await md.db?.isInitialized();
    await refreshStatus();
    setInterval(async () => {
        if (!md.connInfo || !md.db) return;
        try {
            vmInfoSources.value = await md.checkEmbeddingStatus(md.connInfo.database, md.connInfo.schema);
        }
        catch (err) {
            console.error("Error: ", err);
        }
    }, 30000);

});

async function refreshStatus() {
    if (!md.connInfo || !md.db) return;
    loadingList.value = true;
    try {
        vmInfoSources.value = await md.checkEmbeddingStatus(md.connInfo.database, md.connInfo.schema);
    }
    catch (err) { }
    finally {
        loadingList.value = false;
    }
}

async function fetchSchemas() {
    loadingSchemas.value = true;
    // console.log("Fetching Schemas: ", vmMotherduck.value.token);
    try {
        if (!md.connInfo || !md.db) throw Error("Connection not initialized");

        vmAllSchemas.value = await md.fetchSchemas(md.connInfo.database);
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
        loadingAdd.value = true;
        try {
            if (!md.connInfo || !md.db) throw Error("Connection not initialized");
            const result = await md.db.evaluateQuery(`
                select title as title,
                body as description,
                repository_url as source_id,
                'github_issues' as source_type
                FROM "${md.connInfo.database}"."${md.connInfo.schema}".issues
                WHERE repository_url = '${vmRepo.value}'
            `);
            let all_chunks: any[] = [];
            for (const row of result?.data.toRows() as any) {
                all_chunks.push(...createTextChunks(row, 1000));
            }
            await md.loadInformationSource(md.connInfo.database, md.connInfo.schema, "github_issues", all_chunks);
            vmInfoSources.value.push({
                source_type: "github_issues",
                source_id: vmRepo.value,
                total_chunks: all_chunks.length,
                embeddings_generated: 0,
                embeddings_missing: all_chunks.length,
            });
            addingIssues.value = false;
        }
        catch (err) {
            console.log("Error: ", err);
            message.value = "Failed to add issues: " + err;
        }
        finally {
            loadingAdd.value = false;
        }

    }
    else if (addingSource.value) {
        if (vmProvider.value === "Local") {
            await readLocalGit();
        }
        else {
            await clone();
        }
    }
    addingSource.value = false;
}

async function cancelAdd() {
    addingIssues.value = false;
    addingSource.value = false;
}

async function fetchRepos(schema: string) {
    console.log("Fetching repos: ", schema);
    if (!schema || !md.db || !md.connInfo) return;

    loadingRepos.value = true;
    try {
        const query = `select distinct full_name, url from "${md.connInfo.database}"."${schema}".repositories`;
        console.log("Query: ", query);
        const res = await md.db.evaluateQuery(query);
        console.log('query result', res);
        if (!res) throw Error("Did not find any repositories data in selected schema");
        vmAllRepos.value = res?.data.toRows() as any;
        console.log("Repos: ", vmAllRepos.value);
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
    loadingAdd.value = true;
    console.log("Reading: ", vmProvider.value, vmRepo.value);
    try {
        if (!md.connInfo || !md.db) throw Error("Connection not initialized");
        message.value = "Loading...";
        const dir = await readLocal();
        await scanRepo(dir);
        vmInfoSources.value = await md.checkEmbeddingStatus(md.connInfo.database, md.connInfo.schema);
    }
    catch (err) {
        console.log("Error while reading: ", err);
    }
    finally {
        loadingAdd.value = false;
        message.value = "";
    }
}

async function clone() {
    loadingAdd.value = true;
    console.log("Cloning: ", vmProvider.value, vmRepo.value);
    try {
        if (!vmRepo.value) {
            message.value = "Please select a repository";
            return;
        }
        if (vmProvider.value === "Github") {
            message.value = "Cloning...";
            const chunks = await cloneRepo(vmRepo.value);
            await saveChunks(vmRepo.value, chunks);
        }
        else if (vmProvider.value === "Public") {
            message.value = "Cloning...";
            const chunks = await cloneRepo(vmRepo.value);
            await saveChunks(vmRepo.value, chunks);
        }
    }
    catch (err) {
        console.log("Error while cloning: ", err);
    }
    finally {
        loadingAdd.value = false;
        // message.value = "";
    }
}

async function scanRepo(dir: FileSystemDirectoryHandle) {
    message.value = "Scanning Repository...";
    const files = await scanDirectory(dir, ".+[.]py");
    message.value = `Analyzing ${files.length} files...`;
    const chunks = await getAllChunks(files, 500);
    console.log("Files: ", files, chunks);
    await saveChunks(`${vmRepo.value}`, chunks);
}

async function saveChunks(source_id: string, chunks: Chunk[]) {
    try {
        if (!md.connInfo) throw Error("Connection not initialized");

        await md.loadInformationSource(md.connInfo.database,
            md.connInfo.schema,
            source_id,
            chunks.map(chunk => {
                return {
                    source_id: source_id,
                    source_type: "code:python",
                    title: chunk.file,
                    description: JSON.parse(JSON.stringify(chunk.text)),
                };
            }));
    }
    catch (err) {
        console.log("Error: ", err);
    }
}

async function generateEmbeddings(item: any) {
    try {
        if (!md.connInfo || !md.db) throw Error("Motherduck connection not initialized");
        item.loading = true;
        await md.generateEmbeddings(md.connInfo.database, md.connInfo.schema, item.source_id);
        await refreshStatus();
    }
    catch (err) {
        console.log("Error: ", err);
        message.value = "Failed to generate embeddings: " + err;
    }
    finally {
        item.loading = false;
    }
}

async function saveChunksLocally(chunks: Chunk[]) {
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

.list {
    background-color: rgb(var(--theme-color-secondary));
    color: black;
}

.listitem {
    margin: 5px;
    background-color: rgb(var(--theme-color-secondary));
}

.item_subtitle {
    font-size: 12px;
    font-weight: lighter
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
