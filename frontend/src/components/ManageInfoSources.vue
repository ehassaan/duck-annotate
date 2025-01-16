<template>

    <VProgressCircular :class="$style.loading" indeterminate v-if="loading"></VProgressCircular>
    <v-list :class="$style.list" :items="connections" v-if="connections.length > 0">
        <v-list-item elevation="3" v-for="item in connections" :key="item.key" v-bind="item">

            <template v-slot:title>
                <v-item-title>
                    {{ item.title }}
                </v-item-title>
            </template>

            <template v-slot:subtitle>
                <v-item-subtitle>
                    {{ item.subtitle }}
                </v-item-subtitle>
            </template>
            <template v-slot:default>
                <p :class="$style.sync_status">
                    <v-icon v-if="item.lastSync" size="x-small"
                        :icon="item.lastStatus === 'succeeded' ? 'mdi-check' : 'mdi-close'"
                        :class="[$style.sync_status_icon, item.lastStatus == 'succeeded' ? $style.status_success : $style.status_error]"></v-icon>
                    <span>Last Sync: {{ item.lastSync ?
                        item.lastSync.toISOString() + ` - (${item.rowsSynced} rows synced)`
                        : 'N/A' }}
                    </span>
                </p>

            </template>
            <template v-slot:append>
                <div :class="$style.sourceActions">

                    <v-btn color="primary" v-if="item.connId" :loading="item.loading" @click="() => syncNow(item)">{{
                        item.isSyncing ? 'Syncing...' : 'Sync Now' }}</v-btn>

                    <v-btn color="primary" :loading="item.loading" @click="() => createConnection(item)"
                        v-if="!item.connId">Create
                        Connection</v-btn>
                    <v-btn color="danger" icon="mdi-trash-can-outline" variant="text"
                        @click="() => deleteSource(item)"></v-btn>
                </div>
            </template>
        </v-list-item>

    </v-list>

    <v-btn v-if="!creatingGh" :class="$style.button" color="primary" @click="() => creatingGh = true">Add New</v-btn>

    <AddGithubSource @created="onCreateNew" @cancel="() => creatingGh = false" v-if="creatingGh"></AddGithubSource>

</template>

<script setup lang="ts">

import { onMounted, onUnmounted, ref } from 'vue';
import { $fetch } from '@/services/api';
import * as md from "@/services/motherduck";
import AddGithubSource from './AddGithubSource.vue';

const message = ref("");
const showMessage = ref(false);
const loading = ref(false);
const creatingGh = ref(false);
const connections = ref<any[]>([]);
let interval = null;

onMounted(async () => {
    await fetchSources();
    setInterval(async () => {
        try {
            await refreshSources();
        }
        catch (err) {
            console.log("Error: ", err);
        }
    }, 30000);
});

onUnmounted(() => {
    if (interval) {
        clearInterval(interval);
    }
});


async function refreshSources() {
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
            prependIcon: 'mdi-github',
            connId: conns.find((c: any) => c.sourceId === item.sourceId)?.connectionId,
            isSyncing: false,
            lastSync: null,
            rowsScanned: null,
            lastStatus: null,
            loading: false,
        };
    });
    connections.value.filter(c => c.connId).map(async (c) => {
        await checkSyncStatus(c);
    });
}

async function fetchSources() {
    loading.value = true;
    try {
        await refreshSources();
    }
    catch (err) {
        console.log("Error: ", err);
    }
    finally {
        loading.value = false;
    }
}
async function onCreateNew(conn: any) {
    creatingGh.value = false;
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


async function checkSyncStatus(conn: any) {
    const res = await $fetch('/api/airbyte/v1/jobs', {
        method: 'GET',
        credentials: 'include',
        query: {
            connectionId: conn.connId,
            limit: 10,
            orderBy: "createdAt|DESC"
        }
    });
    console.log("Sync Status: ", res);
    if (res.error) {
        conn.isSyncing = false;
        conn.lastSync = "Error";
        return;
    }
    const syncs = (res as any)?.data?.data?.data ?? [];
    if (syncs.length == 0) return;
    else {
        conn.isSyncing = syncs.find((s: any) => s.status === "running");

        const previous = syncs.find((s: any) => s.status !== "running");
        conn.lastSync = previous ? new Date(previous.lastUpdatedAt) : null;
        conn.rowsSynced = previous ? previous.rowsSynced : null;
        conn.lastStatus = previous ? previous.status : null;
    }

}

async function syncNow(conn: any) {
    if (conn.isSyncing) return;
    conn.loading = true;
    const resConn = await $fetch('/api/airbyte/v1/jobs', {
        method: 'POST',
        credentials: 'include',
        body: {
            "jobType": "sync",
            "connectionId": conn.connId
        }
    });
    conn.loading = false;
    conn.isSyncing = true;
    if (resConn.error) {
        message.value = "Failed to trigger sync: " + (resConn as any).data?.message;
        showMessage.value = true;
        return;
    }
}

async function createConnection(source: any) {
    source.loading = true;
    try {
        const resConn = await $fetch('/api/airbyte/v1/connections', {
            method: 'POST',
            credentials: 'include',
            body: {
                "namespaceDefinition": "destination",
                "nonBreakingSchemaUpdatesBehavior": "propagate_fully",
                "status": "active",
                "dataResidency": "auto",
                "destinationId": md.connInfo?.destinationId,
                "sourceId": source.key,
                "prefix": "",
                "configurations": [
                    {
                        streams: [
                            { name: "issues" },
                            { name: "comments" },
                            { name: "repositories" }
                        ]
                    }
                ],
                "name": source.name
            }
        });
        if (resConn.error) {
            message.value = "Failed to create data source: " + (resConn as any).data?.message;
            showMessage.value = true;
            return;
        }
        await fetchSources();
    }
    catch (err) {
        console.log("Error: ", err);
    }
    finally {
        source.loading = false;
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

.loading {
    margin: 5px auto 10px auto;
    align-self: center;
    display: block;
}

.list {
    background-color: rgb(var(--theme-color-secondary));
    color: black;
}

.listitem {
    background-color: rgb(var(--theme-color-secondary));
}

.sourceActions {
    display: flex;
    flex-direction: row;
    align-items: center;
}

.sync_status {
    margin-top: 5px;
    background-color: rgb(var(--theme-color-secondary));
    align-items: center;
    display: flex;
    flex-direction: row;
}

.sync_status_icon {
    margin: 2px;
    margin-top: 4px;
    border-radius: 50%;
    padding: 2px;
    font-size: 13px;
}

.status_success {
    color: #fff;
    background-color: #0a0;
}

.status_error {
    color: #fff;
    background-color: #d00;
}
</style>