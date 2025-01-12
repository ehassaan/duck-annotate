<template>

    <v-form :class="$style.form" @submit.prevent="submit">
        <v-snackbar v-model="showMessage" :text="message" :timeout="6000">
        </v-snackbar>
        <DynamicFields :fields="formOpts" v-model="vmForm"></DynamicFields>

        <v-btn :class="$style.button" type="submit" :loading="loading" block color="primary">Create</v-btn>

    </v-form>

</template>

<script setup lang="ts">

import { onMounted, ref } from 'vue';
import * as md from "@/services/motherduck";
import DynamicFields from './DynamicFields.vue';
import type { DynamicField } from "@/entities/DynamicField";
import type { SubmitEventPromise } from 'vuetify';
import { $fetch } from '@/services/api';

const message = ref("");
const showMessage = ref(false);
const loading = ref(false);

// const vmPostgres = ref({
// name: "MyDataSource",
//     host: "",
//     port: 5432,
//     database: "",
//     username: "",
//     password: "",
//     schema: "public",
//     method: "Xmin"
// });

const emit = defineEmits(["created"]);

const vmForm = ref({
    name: "MyInfoSource",
    repositories: "airbytehq/airbyte",
    branches: "airbyte/main",
    pat: ""
});

const formOpts: DynamicField[] = [
    {
        label: "Name",
        type: "text",
        name: "name",
        required: true,
        rules: [(v: string) => v.length > 0 || 'Field is required']
    },
    {
        label: "Repositories (comma separated)",
        type: "text",
        name: "repositories",
        required: true,
        rules: [(v: string) => v.length > 0 || 'Field is required']
    },
    {
        label: "Branches (comma separated)",
        type: "branches",
        name: "port",
        required: true,
    },
    {
        label: "Personal Access Token",
        type: "text",
        name: "pat",
        required: true,
        rules: [(v: string) => v.length > 0 || 'Field is required']
    },
];

onMounted(async () => {

});

async function disconnect() {
    await md.disconnect();
}


async function submit(ev: SubmitEventPromise) {
    const validation = await ev;
    if (!validation.valid) return;

    loading.value = true;

    try {
        const body = {
            "name": vmForm.value.name,
            "configuration": {
                "sourceType": "github",
                "credentials": {
                    "option_title": "PAT Credentials",
                    "personal_access_token": vmForm.value.pat
                },
                "max_waiting_time": 10,
                "branches": [
                    ...vmForm.value.branches.split(",")
                ],
                "start_date": "2021-03-01T00:00:00Z",
                "repositories": [
                    ...vmForm.value.repositories.split(",")
                ]
            }
        };
        console.log("Creating Source: ", body);
        const res = await $fetch('/api/airbyte/v1/sources', {
            method: 'POST',
            credentials: 'include',
            body: body
        });
        if (res.error) {
            message.value = "Failed to create data source: " + res.error.message;
            showMessage.value = true;
            return;
        }
        message.value = "Created";
        showMessage.value = true;
        emit('created', (res.data as any)?.data);
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