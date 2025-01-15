<template>

    <v-card :class="[$style.container, 'fill-height']" color="background">

        <v-tabs v-model="tab" grow>
            <v-tab value="datalake">
                Connect Datalake
            </v-tab>
            <v-tab value="schema">
                Fetch Database Schema
            </v-tab>
            <v-tab value="pull_data">
                Replicate Reference Data
            </v-tab>
            <v-tab value="information">
                Prepare LLM Context
            </v-tab>
            <v-tab value="annotate">
                Annotate
            </v-tab>
        </v-tabs>

        <v-window v-model="tab" class="fill-height">
            <v-window-item value="datalake" :class="$style.window">
                <v-card :class="$style.window_card" color="secondary" :elevation="10">

                    <h2 :class="$style.title">Connect Motherduck</h2>

                    <ConnectMotherduck @submit="saveCreds" @disconnect="disconnect">
                    </ConnectMotherduck>
                </v-card>

            </v-window-item>

            <v-window-item value="schema" class="fill-height" color="secondary">
                <v-card :class="$style.window_card" color="secondary" :elevation="10">
                    <v-card-title>Fetch Database Schema</v-card-title>
                    <ManageSchema></ManageSchema>
                </v-card>
            </v-window-item>

            <v-window-item value="pull_data" class="fill-height" color="secondary">
                <v-card :class="$style.window_card" color="secondary" :elevation="10">
                    <v-card-title>Pull Github Issues</v-card-title>
                    <ManageInfoSources></ManageInfoSources>
                </v-card>
            </v-window-item>


            <v-window-item value="information">
                <v-card :class="$style.window_card" color="secondary" :elevation="10">
                    <v-card-title>Available Embeddings</v-card-title>
                    <ConnectRepository @submit="saveCreds"></ConnectRepository>
                </v-card>
            </v-window-item>

            <v-window-item value="annotate">
                <v-card :class="$style.window_card" color="secondary" :elevation="10">
                    <AnnotateTables :database="vmConnInfo?.database" :schema="vmConnInfo?.schema"
                        :token="vmConnInfo?.token"></AnnotateTables>
                </v-card>
            </v-window-item>
        </v-window>

    </v-card>

</template>

<script setup lang="ts">

import { onBeforeMount, onMounted, ref } from 'vue';
import ConnectMotherduck from './ConnectMotherduck.vue';
import ConnectRepository from './ConnectRepository.vue';
import AnnotateTables from './AnnotateTables.vue';
import ManageSources from './ManageSources.vue';
import * as md from "@/services/motherduck";
import ManageInfoSources from './ManageInfoSources.vue';
import FetchSchema from './FetchSchema.vue';
import ManageSchema from './ManageSchema.vue';

const tab = ref("datasource");
const vmConnInfo = ref<{ database: string, token: string; schema: string; destinationId: string; }>();

onBeforeMount(async () => {
    try {
        const conStr = localStorage.getItem("motherduck");
        if (conStr) {
            const connInfo = JSON.parse(conStr);
            vmConnInfo.value = connInfo;
            md.setCreds(connInfo);
            md.connect(connInfo.token);
        }
    }
    catch (err) {
        console.log("Failed to connect to motherduck: ", err);
    }
});

async function saveCreds(data: any) {
    localStorage.setItem("motherduck", JSON.stringify(data));
    tab.value = "schema";
}

async function disconnect() {
    localStorage.removeItem("motherduck");
}

</script>
<style module>
.window_card {
    margin: 15px;
    padding: 15px;
}

.container {
    /* display: flex; */
    /* flex-direction: column; */
    height: 100%;
}

.window {}

.title {
    font-weight: normal;
    font-family: "Open Sans", sans-serif;
}
</style>