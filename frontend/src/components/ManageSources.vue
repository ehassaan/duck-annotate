<template>

    <VProgressCircular indeterminate v-if="loading"></VProgressCircular>
    <v-list item-props :items="connections">
        <template v-slot:item="item">
            <v-list-item v-bind=item.props>
                <template v-slot:append>
                    <div :class="$style.sourceActions">
                        <v-btn v-if="item.props.connId" :loading="loadingConn" @click="() => syncNow(item.props)">{{
                            item.props.isSyncing ? 'Syncing...' : 'Sync Now' }}</v-btn>

                        <v-btn :loading="loadingConn" @click="() => createConnection(item.props)"
                            v-if="!item.props.connId">Enable Replication</v-btn>
                        <v-btn color="danger" icon="mdi-trash-can-outline" variant="text"
                            @click="() => deleteSource(item.props)"></v-btn>
                    </div>
                </template>
            </v-list-item>

        </template>
    </v-list>

    <v-btn :class="$style.button" color="primary" @click="() => creatingPg = !creatingPg">{{ creatingPg ? 'Cancel' :
        'Add New' }}</v-btn>

    <AddPostgresSource @created="onCreateNew" v-if="creatingPg"></AddPostgresSource>

</template>

<script setup lang="ts">

import { onMounted, ref } from 'vue';
import { $fetch } from '@/services/api';
import AddPostgresSource from './AddPostgresSource.vue';
import * as md from "@/services/motherduck";

const message = ref("");
const showMessage = ref(false);
const loading = ref(false);
const loadingConn = ref(false);
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
        const resConn = await $fetch('/api/airbyte/v1/connections', { credentials: 'include' });
        let conns = [];
        if (resConn.error) {
            console.error("Error fetching connections: ", resConn.error);
        }
        else {
            conns = (resConn.data as any)?.data?.data ?? [];
            console.log("Connections: ", resConn.data, conns);
        }
        connections.value = ((res.data as any)?.data?.data ?? []).map((item: any) => {
            return {
                title: item.name,
                subtitle: item.sourceId,
                key: item.sourceId,
                prependAvatar: import.meta.env.VITE_BASE_URL + '/logos/postgres.svg',
                connId: conns.find((c: any) => c.sourceId === item.sourceId)?.connectionId,
                isSyncing: false
            };
        });
        connections.value.filter(c => c.connId).map(async (c) => {
            const interval = setInterval(() => checkSyncStatus(c, interval), 10000);
            await checkSyncStatus(c, null);
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

async function checkSyncStatus(conn: any, interval: any) {
    const res = await $fetch('/api/airbyte/v1/jobs', {
        method: 'GET',
        credentials: 'include',
        query: {
            "connectionId": conn.connId,
            "limit": 100
        }
    });
    console.log("Sync Status: ", res);
    if (res.error) {
        conn.isSyncing = false;
        clearInterval(interval);
        return;
    }
    const syncs = (res as any)?.data?.data?.data ?? [];
    if (syncs.length > 0 && syncs[0].status === "running") {
        conn.isSyncing = true;
        return;
    }
    clearInterval(interval);
}

async function syncNow(conn: any) {
    if (conn.isSyncing) return;
    loadingConn.value = true;
    const resConn = await $fetch('/api/airbyte/v1/jobs', {
        method: 'POST',
        credentials: 'include',
        body: {
            "jobType": "sync",
            "connectionId": conn.connId
        }
    });
    loadingConn.value = false;
    conn.isSyncing = true;
    if (resConn.error) {
        message.value = "Failed to trigger sync: " + (resConn as any).data?.message;
        showMessage.value = true;
        return;
    }
    const interval = setInterval(() => checkSyncStatus(conn, interval), 10000);
}

async function createConnection(source: any) {
    loadingConn.value = true;
    const resConn = await $fetch('/api/airbyte/v1/connections', {
        method: 'POST',
        credentials: 'include',
        body: {
            "namespaceDefinition": "destination",
            "nonBreakingSchemaUpdatesBehavior": "propagate_fully",
            "status": "active",
            "dataResidency": "auto",
            "destinationId": md.connInfo.destinationId,
            "sourceId": source.key,
            "name": source.name
        }
    });
    loadingConn.value = false;
    if (resConn.error) {
        message.value = "Failed to create data source: " + (resConn as any).data?.message;
        showMessage.value = true;
        return;
    }
    await fetchSources();
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

.sourceActions {
    display: flex;
    flex-direction: row;
    align-items: center;
}
</style>