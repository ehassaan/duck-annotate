<template>

    <VProgressCircular indeterminate v-if="loading"></VProgressCircular>
    <v-list item-props :items="connections">
        <template v-slot:item="item">
            <v-list-item v-bind=item.props>
                <template v-slot:prepend>
                    <v-btn color="danger" icon="mdi-trash-can-outline" variant="text"
                        @click="() => deleteSource(item.props)"></v-btn>
                </template>
                <template v-slot:append>
                    <v-btn color="danger" icon="mdi-trash-can-outline" variant="text"
                        @click="() => deleteSource(item.props)"></v-btn>
                </template>
            </v-list-item>

        </template>
    </v-list>

    <v-btn :class="$style.button" color="primary" @click="() => creatingPg = !creatingPg">{{ creatingPg ? 'Cancel' :
        'Add New' }}</v-btn>

    <AddGithubSource @created="onCreateNew" v-if="creatingPg"></AddGithubSource>

</template>

<script setup lang="ts">

import { onMounted, ref } from 'vue';
import type { SubmitEventPromise } from 'vuetify';
import { $fetch } from '@/services/api';
import AddPostgresSource from './AddPostgresSource.vue';
import AddGithubSource from './AddGithubSource.vue';

const message = ref("");
const loading = ref(false);
const creatingPg = ref(false);
const connections = ref<any[]>([]);

onMounted(async () => {
    await fetchSources();
});

async function fetchSources() {
    loading.value = true;
    try {
        const res = await $fetch('/api/airbyte/v1/sources', { credentials: 'include' });
        if (res.error) {
            console.error("Error fetching connections: ", res.error);
            return;
        }
        console.log("Connections: ", res.data);
        connections.value = ((res.data as any)?.data?.data ?? []).map((item: any) => {
            return {
                title: item.name,
                subtitle: item.sourceId,
                key: item.sourceId,
                prependAvatar: import.meta.env.VITE_BASE_URL + '/logos/postgres.svg'
            };
        });
    }
    catch (err) {
        console.log("Error: ", err);
    }
    finally {
        loading.value = false;
    }
}
async function onCreateNew(conn: any) {
    creatingPg.value = false;
    await fetchSources();
}

async function deleteSource(item: any) {
    console.log("Deleting: ", item);
    loading.value = true;
    try {
        const res = await $fetch('/api/airbyte/v1/sources/' + item.key, { method: 'DELETE', credentials: 'include' });
        if (res.error) {
            console.error("Error deleting source: ", res.error);
            return;
        }
        await fetchSources();
    }
    catch (err) {
        console.log("Error: ", err);
    }
    finally {
        loading.value = false;
    }
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