<template>
    <v-form :class="$style.form">

        <v-select label="Select Table" :items="tables" v-model="table"
            @update:model-value="fetchTableSchema"></v-select>

        <v-table fixed-header>
            <thead>
                <th class="text-left">Column Name</th>
                <th class="text-left">Data Type</th>
                <th class="text-left">Existing Comment</th>
            </thead>
            <tbody>
                <tr v-for="column in columns" :key="column.column_name">
                    <td>{{ column.column_name }}</td>
                    <td>{{ column.data_type }}</td>
                    <td>{{ column.comment }}</td>
                </tr>
            </tbody>
        </v-table>
    </v-form>

</template>

<script setup lang="ts">

import { onBeforeMount, onMounted, ref, type PropType } from 'vue';
import { MDConnection } from '@motherduck/wasm-client';
import { cloneRepo } from '@/utils/gitUtil';
import { getAllChunks, scanDirectory, type Chunk } from '@/utils/scanUtil';
import { initializeEngine, search } from '@/utils/embeddingUtil';
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

const message = ref("");
const columns = ref<md.ColumnInfo[]>([]);
const isLoading = ref(false);
const table = ref('');
const tables = ref<string[]>([]);

onMounted(async () => {
    if (!props.token) {
        return;
    }
    await connect();
    tables.value = await md.fetchTables(props.database, props.schema);
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

function annotateTable() {

}

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
