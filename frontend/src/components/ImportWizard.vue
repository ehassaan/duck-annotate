<template>

    <v-card :class="[$style.card, 'fill-height']">

        <v-tabs v-model="tab" grow>
            <v-tab value="datalake">
                Connect Datalake
            </v-tab>
            <v-tab value="sources">
                Add Sources
            </v-tab>
            <v-tab value="information">
                Select Information Sources
            </v-tab>
            <v-tab value="annotate">
                Annotate
            </v-tab>
        </v-tabs>

        <v-window v-model="tab" class="fill-height">
            <v-window-item value="datalake" class="fill-height">
                <v-card class="ma-4 pa-4 fill-height">
                    <v-card-title>Connect Motherduck</v-card-title>
                    <ConnectMotherduck @submit="saveCreds" @disconnect="disconnect">
                    </ConnectMotherduck>
                </v-card>
            </v-window-item>

            <v-window-item value="sources" class="fill-height">
                <v-card class="ma-4 pa-4 fill-height">
                    <v-card-title>Data Sources</v-card-title>
                    <ManageSources></ManageSources>
                </v-card>
            </v-window-item>


            <v-window-item value="information">
                <v-card class="ma-4 pa-4 fill-height">
                    <v-card-title>Select Repository</v-card-title>
                    <ConnectRepository @submit="saveCreds"></ConnectRepository>
                </v-card>
            </v-window-item>

            <v-window-item value="annotate">
                <v-card class="ma-4 pa-4 fill-height">
                    <AnnotateTables :database="vmConnInfo?.database" :schema="vmConnInfo?.schema"
                        :token="vmConnInfo?.token"></AnnotateTables>
                </v-card>
            </v-window-item>
        </v-window>

    </v-card>

</template>

<script setup lang="ts">

import { onMounted, ref } from 'vue';
import ConnectMotherduck from './ConnectMotherduck.vue';
import ConnectRepository from './ConnectRepository.vue';
import AnnotateTables from './AnnotateTables.vue';
import AddSources from './AddPostgresSource.vue';
import ManageSources from './ManageSources.vue';
import * as md from "@/utils/mdUtil";

const tab = ref("datasource");
const vmConnInfo = ref<{ database: string, token: string; schema: string; destinationId: string; }>();

onMounted(async () => {
    try {
        const conStr = localStorage.getItem("motherduck");
        if (conStr) {
            const connInfo = JSON.parse(conStr);
            vmConnInfo.value = connInfo;
            md.setCreds(connInfo);
        }
    }
    catch (err) {
        console.log("Failed to connect to motherduck: ", err);
    }
});

async function saveCreds(data: any) {
    localStorage.setItem("motherduck", JSON.stringify(data));
    tab.value = "information";
}

async function disconnect() {
    localStorage.removeItem("motherduck");
}

</script>
<style module>
.card {
    display: flex;
    flex-direction: column;
    height: 100%;
}
</style>