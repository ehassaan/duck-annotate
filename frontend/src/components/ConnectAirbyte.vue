<template>
    <v-form @submit.prevent="connectAirbyte">
        <v-text-field v-model="clientId" label="Client ID"></v-text-field>
        <v-text-field v-model="clientSecret" label="Client Secret"></v-text-field>
        <v-btn class="mt-2" type="submit" block>Submit</v-btn>
    </v-form>

</template>

<script setup lang="ts">

import axios from 'axios';
import { ref } from 'vue';

const clientId = ref("c926f1a0-66e9-4616-ad8d-959c0c9cba22");
const clientSecret = ref("");

async function connectAirbyte() {
    const res = await axios.post("/api/airbyte/connect", {
        clientId: clientId.value,
        clientSecret: clientSecret.value
    });
    console.log(res);
}

</script>