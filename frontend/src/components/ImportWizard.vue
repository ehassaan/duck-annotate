<template>

    <v-card>
        <v-card-title>Import Wizard</v-card-title>

        <v-tabs v-model="tab" grow>
            <v-tab value="datalake">
                Connect Datalake
            </v-tab>
            <v-tab value="information">
                Select Information Sources
            </v-tab>
            <v-tab value="annotate">
                Annotate
            </v-tab>
        </v-tabs>

        <v-window v-model="tab">
            <v-window-item value="datalake">
                <v-card class="ma-4 pa-4">
                    <v-card-title>Connect Motherduck</v-card-title>
                    <ConnectMotherduck :token="vmConnInfo?.token" :database="vmConnInfo?.database"
                        :schema="vmConnInfo?.schema" @submit="saveCreds" @disconnect="disconnect">
                    </ConnectMotherduck>
                </v-card>
            </v-window-item>

            <v-window-item value="information">
                <v-card class="ma-4 pa-4">
                    <v-card-title>Select Repository</v-card-title>
                    <ConnectRepository @submit="saveCreds"></ConnectRepository>
                </v-card>
            </v-window-item>

            <v-window-item value="annotate">
                <v-card class="ma-4 pa-4">
                    <v-card-title>Annotate</v-card-title>
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

const tab = ref("datasource");
const vmConnInfo = ref<{ database: string, token: string; schema: string; }>();

onMounted(() => {
    try {
        const conStr = localStorage.getItem("motherduck");
        if (conStr) {
            const connInfo = JSON.parse(conStr);
            vmConnInfo.value = connInfo;
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