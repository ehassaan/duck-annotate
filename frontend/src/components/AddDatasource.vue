<template>
    <v-form @submit.prevent="addSource">
        <v-select :items="sourceTypes" v-model="sourceType" label="Source Type"></v-select>
        <DynamicFields v-model="connInfo" :fields="sourceOptions[sourceType]"></DynamicFields>
        <v-btn class="mt-2" type="submit" block>Submit</v-btn>
    </v-form>

</template>

<script setup lang="ts">

import axios from 'axios';
import { ref } from 'vue';
import DynamicFields from './DynamicFields.vue';
import { sourceOptions } from "../utils/sourceOptions";

const sourceTypes = Object.keys(sourceOptions);
const sourceType = ref<keyof typeof sourceOptions>("postgres");
const connectionString = ref("postgres://postgres:postgres@localhost:5432/postgres");
const connInfo = ref({});

async function addSource() {
    const res = await axios.post("/api/airbyte/sources", {
        sourceType: sourceType.value,
        connectionString: connectionString.value
    });
    console.log(res);
}

</script>