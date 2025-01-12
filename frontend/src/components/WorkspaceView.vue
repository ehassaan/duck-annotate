<template>

    <v-card :class="[$style.container, 'fill-height']" color="background">

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
            <v-window-item value="datalake" :class="$style.window">
                <v-card :class="$style.window_card" color="secondary" :elevation="10">

                    <h2 :class="$style.title">Connect Motherduck</h2>

                    <ConnectMotherduck @submit="saveCreds" @disconnect="disconnect">
                    </ConnectMotherduck>
                </v-card>

            </v-window-item>

            <v-window-item value="sources" class="fill-height" color="secondary">
                <v-card :class="$style.window_card" color="secondary" :elevation="10">
                    <v-card-title>Data Sources</v-card-title>
                    <ManageSources></ManageSources>
                </v-card>
            </v-window-item>


            <v-window-item value="information">
                <v-card :class="$style.window_card" color="secondary" :elevation="10">
                    <v-card-title>Select Repository</v-card-title>
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

import { onMounted, ref } from 'vue';
import ConnectMotherduck from './ConnectMotherduck.vue';
import ConnectRepository from './ConnectRepository.vue';
import AnnotateTables from './AnnotateTables.vue';
import ManageSources from './ManageSources.vue';
import * as md from "@/services/motherduck";

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
.window_card {
    margin: 15px;
    padding: 15px;
}

.container {
    /* display: flex; */
    /* flex-direction: column; */
    height: 100%;
}

.window {
}

.title {
    font-weight: normal;
    font-family: "Open Sans", sans-serif;
}
</style>