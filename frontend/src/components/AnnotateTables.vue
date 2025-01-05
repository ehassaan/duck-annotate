<template>
    <div :class="$style.container">

        <div :class="$style.table_selection">
            <v-select hide-details="auto" :class="$style.table_dropdown" density="compact" label="Select Table" :items="tables" v-model="table"
                @update:model-value="fetchTableSchema"></v-select>
            <v-label :class="$style.table_description">Table Description: {{ table_desc }}</v-label>
        </div>

        <v-data-table-virtual sticky height="450" :headers="headers" :items="columns" density="compact"
            item-key="column_name">
        </v-data-table-virtual>

        <v-btn :class="$style.button" color="primary" @click="generateAnnotations">Generate Annotations</v-btn>

    </div>

</template>

<script setup lang="ts">

import { onBeforeMount, onMounted, ref, type PropType } from 'vue';
import * as embed from '@/utils/embeddingUtil';
import * as storage from "@/utils/storageUtil";
import * as md from "@/utils/mdUtil";
import type { Chunk } from '@/utils/scanUtil';
import * as llm from "@/utils/llmUtil";

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

const message = ref("");
const columns = ref<(md.ColumnInfo & { new_comment?: string; })[]>([]);
const isLoading = ref(false);
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
        maxWidth: "150px"
    },
    {
        title: 'Existing Description',
        sortable: true,
        key: 'comment',
        // minWidth: "auto"
    },
    {
        title: 'New Comment',
        sortable: true,
        key: 'new_comment',
    },

]);

onMounted(async () => {
    if (!props.token) {
        return;
    }
    await connect();
    tables.value = await md.fetchTables(props.database, props.schema);
    const config = await storage.getKey("engine");
    engine = embed.deserializeEngine(config);
});

async function connect() {
    if (!props.token) {
        message.value = "Error: Please connect Motherduck first";
        return;
    }
    message.value = "Connecting...";
    isLoading.value = true;

    try {
        await md.connect(props.token);
    } catch (err) {
        console.log('query failed', err);
        message.value = `Connection Failed: ${err}`;
        return;
    }
    finally {
        isLoading.value = false;
    }
}

async function fetchTableSchema() {
    if (!md.db) {
        return;
    }
    columns.value = await md.fetchColumns(props.database, props.schema, table.value);
    console.log("Columns: ", columns.value);
}

async function generateAnnotations() {
    const text = columns.value.map(c => c.column_name).join("\n");
    const matches = await fetchSimilar(`${table.value} - model - ${text}`);
    const prompt = await preparePrompt(matches);
    console.log("Prompt: ", prompt);
    const response = await llm.completion(prompt);
    console.log("LLM Response: ", response);
    table_desc.value = response.table_description;
    for (const column of response.columns) {
        for (const c of columns.value) {
            if (c.column_name === column.column_name) {
                c.new_comment = column.column_description;
            }
        }
    }
}

async function fetchSimilar(text: string) {
    const results = embed.search(engine, text);
    console.log("Matches: ", results);
    return results;
}

async function preparePrompt(matches: embed.SimilarityMatch[]) {
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
        contextPrompt += `# file: ${match.file}\n${match.text}\n\n`;
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
}

</style>
