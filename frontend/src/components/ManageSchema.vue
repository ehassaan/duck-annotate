<template>
    <VProgressCircular :class="$style.loading" indeterminate v-if="loading"></VProgressCircular>

    <v-list :class="$style.list" v-model:opened="open" v-if="schema.length && schema.length > 0 && !addingSource">

        <v-list-group v-for="[db, schemas] in Object.entries(schemaGraph)" :key="db" :title="db" :value="db">

            <template v-slot:activator="{ props }">
                <v-list-item v-bind="props" prepend-icon="mdi-database-outline" :title="db">
                </v-list-item>
            </template>

            <v-list-group v-for="[schema, tables] in Object.entries(schemas as any)">

                <template v-slot:activator="{ props }">
                    <v-list-item v-bind="props" prepend-icon="mdi-sitemap-outline" :title="schema">
                    </v-list-item>
                </template>

                <v-list-group v-for="[table, columns] in Object.entries(tables as any)">
                    <template v-slot:activator="{ props }">
                        <v-list-item v-bind="props" prepend-icon="mdi-table" :title="table">
                        </v-list-item>
                    </template>

                    <v-list-item prepend-icon="mdi-table-column" :title="column.column_name"
                        v-for="column of (columns as SchemaField[])"></v-list-item>

                </v-list-group>

            </v-list-group>

        </v-list-group>

    </v-list>

    <v-btn v-if="!addingSource" :class="$style.button" color="primary" @click="() => addingSource = true">Load Postgres Schema</v-btn>

    <FetchSchema @created="onCreateNew" @cancel="() => addingSource = false" v-if="addingSource"></FetchSchema>

</template>

<script setup lang="ts">

import { computed, onMounted, onUnmounted, ref } from 'vue';
import * as md from "@/services/motherduck";
import _, { set } from 'lodash';
import type { SchemaField } from '@/entities/SchemaField';
import FetchSchema from './FetchSchema.vue';

const message = ref("");
const showMessage = ref(false);
const loading = ref(false);
const addingSource = ref(false);
let interval = null;
const schema = ref<SchemaField[]>([]);
const open = ref(['Users']);


function get_unique(items: SchemaField[], keys: any, map: any) {
    if (keys.length === 0) return items[0];

    const key = keys[0];
    keys = keys.slice(1);

    let unique = _.uniqBy(items, key).map((o: any) => o[key]);
    if (unique.length === 0 || unique[0] === undefined) return map;
    for (let u of unique) {
        let filtered = items.filter((item: any) => item[key] === u);
        if (!(u in map)) map[u] = {};
        map[u] = get_unique(filtered, keys, map[u]);
    }
    return map;
}

const schemaGraph = computed(() => {
    return get_unique(schema.value, ['catalog_name', 'schema_name', 'table_name', 'column_name'], {});
});


onMounted(async () => {
    await fetchSources();
    setInterval(async () => {
        try {
            await refreshSources();
        }
        catch (err) {
            console.log("Error: ", err);
        }
    }, 120000);
});

onUnmounted(() => {
    if (interval) {
        clearInterval(interval);
    }
});


async function fetchSources() {
    try {
        loading.value = true;
        await refreshSources();
    }
    catch (err) {
        console.log("Error: ", err);
        message.value = "Failed to fetch sources: " + err;
    }
    finally {
        loading.value = false;
    }
}

async function refreshSources() {
    if (!md.connInfo || !md.db) throw Error("Motherduck not initialized");
    await md.db.isInitialized();

    schema.value = await md.fetchColumnMetadata(md.connInfo.database, md.connInfo.schema);
    console.log("Schema: ", schema.value, schemaGraph.value);
}

async function onCreateNew() {
    addingSource.value = false;
    await fetchSources();
}

</script>

<style module>
.loading {
    margin: 5px auto 10px auto;
    align-self: center;
    display: block;
}

.list {
    /* background-color: rgb(var(--theme-color-secondary));
    color: black; */
    max-height: 60vh;
}

.listitem {
    background-color: rgb(var(--theme-color-secondary));
}

.button {
    margin-top: 20px;
}
</style>