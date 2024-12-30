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
                    <ConnectMotherduck @submit="connectMotherduck"></ConnectMotherduck>
                </v-card>
            </v-window-item>
            <v-window-item value="information">
                <v-card class="ma-4 pa-4">
                    <v-card-title>Select Repository</v-card-title>
                    <ConnectRepository @submit="connectMotherduck"></ConnectRepository>
                </v-card>
            </v-window-item>
        </v-window>

        <v-card class="ma-4 pa-4">
            <pre>asd</pre>
        </v-card>
    </v-card>

</template>

<script setup lang="ts">

import { ref } from 'vue';
import ConnectMotherduck from './ConnectMotherduck.vue';
import ConnectRepository from './ConnectRepository.vue';

const tab = ref("datasource");

async function connectMotherduck(data: any) {
    localStorage.setItem("motherduck", JSON.stringify(data));
    tab.value = "information";
}


</script>