<template>
    <div :class="$style.container">

        <v-snackbar v-model="isMessage" :timeout="4000" :text="message"></v-snackbar>

        <div :class="$style.table_selection">
            <v-select hide-details="auto" :class="$style.table_dropdown" :loading="isLoadingTblSelect" density="compact"
                label="Select Table" :items="tables" v-model="table" @update:model-value="fetchTableSchema"></v-select>
            <v-label :class="$style.table_description">Table Description: {{ table_desc }}</v-label>
        </div>

        <v-data-table-virtual :loading="isLoadingTable" sticky height="450" :headers="headers" :items="columns"
            density="compact" item-key="column_name">
            <template v-slot:item.new_comment="{ item }">
                <input type="text" :class="$style.editable_field" @update:model-value="() => item.is_modified = true"
                    v-model="item.new_comment">
            </template>
            <template v-slot:item.accept="{ item }">
                <v-tooltip text="Update and approve">
                    <template v-slot:activator="{ props }">
                        <v-btn v-bind="props" icon="mdi-check-all"
                            :color="item.comment_approved === true ? '#0d0' : undefined" size="x-small"
                            @click="() => action(item, true)"></v-btn>
                    </template>
                </v-tooltip>
                <v-tooltip text="Update as unapproved">
                    <template v-slot:activator="{ props }">
                        <v-btn v-bind="props" icon="mdi-check" size="x-small"
                            :color="_.isNull(item.comment_approved) ? '#44f' : undefined"
                            @click="() => action(item, null)"></v-btn>
                    </template>
                </v-tooltip>
                <v-tooltip text="Reject and keep existing description">
                    <template v-slot:activator="{ props }">
                        <v-btn v-bind="props" icon="mdi-close" size="x-small"
                            :color="item.comment_approved === false ? '#d33' : undefined"
                            @click="() => action(item, false)"></v-btn>
                    </template>
                </v-tooltip>

            </template>
        </v-data-table-virtual>

        <div :class="$style.bottom_toolbar">
            <v-btn :loading="isLoadingGenerate" :class="$style.button" color="primary"
                @click="generateAnnotations">Generate
                Annotations</v-btn>
            <v-btn :loading="isLoadingSave" :class="$style.button" color="primary" @click="saveChanges">Save
                Changes</v-btn>
        </div>

    </div>

</template>

<script setup lang="ts">

import { onBeforeMount, onMounted, ref, type PropType } from 'vue';
import * as embed from '@/utils/embeddingUtil';
import * as storage from "@/utils/storageUtil";
import * as md from "@/services/motherduck";
import * as llm from "@/utils/llmUtil";
import _ from 'lodash';
import type { SchemaField } from '@/entities/SchemaField';


type TableColumn = SchemaField & { new_comment?: string; is_modified: boolean; is_generated: boolean; };

const message = ref("");
const columns = ref<TableColumn[]>([]);
const isLoadingTblSelect = ref(false);
const isLoadingGenerate = ref(false);
const isLoadingTable = ref(false);
const isLoadingSave = ref(false);
const isMessage = ref(false);
const table = ref('');
const tables = ref<string[]>([]);
let engine: any = null;
let table_desc = ref("");
const headers = ref([
    {
        title: 'Column',
        sortable: true,
        key: 'column_name',
        minWidth: "100px"
    },
    {
        title: 'Data Type',
        // align: 'start',
        sortable: true,
        key: 'data_type',
        // width: "100px",
        maxWidth: "100px"
    },
    {
        title: 'Existing Description',
        sortable: true,
        key: 'comment',
        maxWidth: "250px"
    },
    {
        title: 'New Description',
        sortable: true,
        key: 'new_comment',
    },
    {
        title: 'Accept',
        sortable: false,
        key: 'accept',
        minWidth: "130px"
    },

]);

onMounted(async () => {
    isLoadingTblSelect.value = true;
    try {
        await connect();
        if (!md.connInfo || !md.db) throw Error("Motherduck not initialized");
        tables.value = await md.fetchSchemaTables(md.connInfo.database, md.connInfo.schema);
        const config = await storage.getKey("engine");
        engine = embed.deserializeEngine(config);
    }
    catch (err) {
        console.log('query failed', err);
        message.value = `Connection Failed: ${err}`;
    }
    finally {
        isLoadingTblSelect.value = false;
    }
});

async function connect() {
    message.value = "Connecting...";
    try {
        if (!md.connInfo || !md.db) throw Error("Motherduck not initialized");

        await md.connect(md.connInfo.token);
    } catch (err) {
        console.log('query failed', err);
        message.value = `Connection Failed: ${err}`;
        isMessage.value = true;
        return;
    }
}

async function fetchTableSchema() {
    if (!md.db) {
        return;
    }
    isLoadingTable.value = true;
    try {
        if (!md.connInfo || !md.db) throw Error("Motherduck not initialized");
        columns.value = (await md.fetchColumnMetadata(md.connInfo.database, md.connInfo.schema, table.value))
            .map(c => ({ ...c, is_modified: false, is_generated: false }));
    }
    catch (err) {
        console.log('query failed', err);
    }
    finally {
        isLoadingTable.value = false;
    }
    console.log("Columns: ", columns.value);
}

async function generateAnnotations() {

    isLoadingGenerate.value = true;

    try {
        const text = columns.value.map(c => c.column_name).join("\n");
        const matches = await fetchSimilarMd(`${table.value} - model - ${text}`);
        console.debug("Similarity matches: ", matches);
        const prompt = await preparePrompt(matches.map(m =>
        ({
            type: m.source_type,
            title: m.title,
            body: m.description
        })
        ));
        console.log("Prompt: ", prompt);
        const response = await md.completion(prompt);
        console.log("LLM Response: ", response);
        table_desc.value = response.table_description;
        for (const column of response.columns) {
            for (const c of columns.value) {
                if (c.column_name === column.column_name) {
                    c.new_comment = column.column_description;
                    c.is_modified = false;
                    c.comment_approved = null;
                    c.is_generated = true;
                }
            }
        }
    }
    catch (err) {
        console.log('Failed to generate Annotations', err);
        message.value = `Failed to generate Annotations: ${err}`;
        isMessage.value = true;
    }
    finally {
        isLoadingGenerate.value = false;
    }
}

async function fetchSimilar(text: string) {
    const results = embed.search(engine, text);
    console.log("Matches: ", results);
    return results;
}

async function fetchSimilarMd(text: string) {
    if (!md.db || !md.connInfo) throw Error("Motherduck not initialized");

    const results = await md.similaritySearch(text, md.connInfo.database, md.connInfo.schema, 10);
    console.log("Matches: ", results);
    return results;
}

function action(item: TableColumn, accept: boolean | null) {
    item.comment_approved = accept;
    item.is_modified = true;
    console.log("Item: ", item);
}

async function saveChanges() {
    const data: SchemaField[] = [];
    isLoadingSave.value = true;

    if (!md.connInfo) {
        message.value = "Motherduck is not initialized";
        isMessage.value = true;
        return;
    }

    for (const c of columns.value) {
        let comment: string | null = "";
        if (!c.is_generated) {
            if (c.is_modified) {
                comment = c.new_comment && !_.isEmpty(c.new_comment) ? c.new_comment as any : c.comment;
            }
            else {
                continue;
            }
        }
        else if (c.is_generated) {
            if (c.comment_approved === false) {
                continue;
            }
            else {
                comment = c.new_comment ?? "";
            }
        }
        data.push({
            catalog_name: c.catalog_name,
            database_name: c.database_name,
            schema_name: c.schema_name,
            table_name: c.table_name,
            column_name: c.column_name,
            comment: comment,
            data_type: c.data_type,
            comment_approved: c.comment_approved,
        });
    }
    console.log("Items to update: ", data);

    try {
        if (data.length === 0) {
            isMessage.value = true;
            message.value = "No changes to save";
            return;
        }

        await md.updateColumnMetadata(md.connInfo.database, md.connInfo.schema, data);
        for (const c of columns.value) {
            const item = data.find(col => col.column_name === c.column_name);
            if (item) {
                c.comment = item.comment;
                c.comment_approved = item.comment_approved;
            }
            c.new_comment = "";
            c.is_generated = false;
            c.is_modified = false;
        }
        message.value = "Changes saved successfully";
        isMessage.value = true;
    }
    catch (err) {
        console.log('Failed to update annotations', err);
        message.value = `Failed to update annotations: ${err}`;
        isMessage.value = true;
    }
    finally {
        isLoadingSave.value = false;
    }
}

async function preparePrompt(matches: { type: string, title: string, body: string; }[]) {
    const colPrompt = columns.value.map(c => `${c.column_name}: ${c.data_type}`).join("\n");
    let actionPrompt = `## Instructions: \nPlease write 1-2 lines of description for the table named '${table.value}' and description for each of its column. Use the relevant source code to generate the descriptions. The columns are given below:\n\n${colPrompt}`;
    const outputFormat = "## Output Format:\nWrite the results in JSON format consisting of fields 'table_description' (string) and 'columns'. columns field should be an array with fields 'column_name' and 'column_description'";
    const exampleOutput = `## Example Output:
{
  "table_description": "This table stores the information related to products",
  "columns": [
        {
            "column_name": "title",
            "column_description": "Title of the product. This is the title shown on the product page."
        }
    ]
}`;

    let contextPrompt = "## Source Code (relevant code from the repository that uses this table):\n\n";

    for (const match of matches) {
        contextPrompt += `# ${match.type} - ${match.title}\n${match.body}\n\n`;
    }

    const prompt = `${actionPrompt}\n\n${contextPrompt}\n\n${outputFormat}\n\n${exampleOutput}`;
    return prompt;
}

</script>

<style module>
.container {
    display: flex;
    flex-direction: column;
}

.field {
    margin: 5px 0;
}

.button {
    margin-top: 12px;
    margin-right: 6px;
    align-self: flex-start;
}

.table_selection {
    display: flex;
    flex-direction: row;
    align-items: center;
}

.table_dropdown {
    margin: 8px 0;
    flex: 0 1 300px;
}

.table_description {
    flex: 1;
    margin-left: 12px;
    display: block;
    text-wrap: wrap;
}

.editable_field {
    composes: field;
    padding: 5px;
    width: 100%;
    flex-grow: 1 0 auto;
    border: 1px solid #ccc;
    color: white;
}

.table_field {
    composes: field;
    padding: 5px;
    width: auto;
    flex-grow: 0;
    white-space: nowrap;
    color: white;
}

.bottom_toolbar {
    display: flex;
    flex-direction: row;
    margin: 5px;
}
</style>
