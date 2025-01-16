<template>

    <v-form :class="$style.form" @submit.prevent="submit">
        <v-snackbar v-model="showMessage" :text="message" :timeout="6000">
        </v-snackbar>
        <DynamicFields :fields="formOpts" v-model="vmForm"></DynamicFields>

        <div>
            <v-btn :class="$style.button" type="submit" :loading="loading"
                color="primary">Create</v-btn>
            <v-btn :class="$style.button" type="button" @click="() => emit('cancel')" color="secondary">Cancel</v-btn>
        </div>

    </v-form>

</template>

<script setup lang="ts">

import { computed, onMounted, ref } from 'vue';
import DynamicFields from './DynamicFields.vue';
import type { DynamicField } from "@/entities/DynamicField";
import type { SubmitEventPromise } from 'vuetify';
import { $fetch } from '@/services/api';
import * as md from "@/services/motherduck";

const message = ref("");
const showMessage = ref(false);
const loading = ref(false);
// const destinationId = computed(() => md.connInfo?.destinationId);

const emit = defineEmits(["created", "cancel"]);

const vmForm = ref({
    name: "MyInfoSource",
    repositories: "",
    duration: 30,
    pat: ""
});

const durationOptions = [
    {
        title: "30 days",
        value: 30
    },
    {
        title: "60 days",
        value: 60
    },
    {
        title: "6 months",
        value: 180
    },
    {
        title: "1 year",
        value: 365
    },
    {
        title: "5 years",
        value: 1825
    },
];

const formOpts: DynamicField[] = [
    {
        label: "Name",
        type: "text",
        name: "name",
        required: true,
        rules: [(v: string) => v.length > 0 || 'Field is required']
    },
    {
        label: "Repositories (e.g. org/repo,org/another-repo,org/*,org/a*)",
        type: "text",
        name: "repositories",
        required: true,
        rules: [(v: string) => v.length > 0 || 'Field is required']
    },
    {
        label: "Duration",
        type: "select",
        name: "duration",
        required: true,
        options: durationOptions,
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


async function submit(ev: SubmitEventPromise) {

    if (!md.connInfo?.destinationId) {
        message.value = "Motherduck is not initialized";
        showMessage.value = true;
        return;
    }

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
                "prefix": "",
                "max_waiting_time": 10,
                "start_date": new Date(Date.now() - vmForm.value.duration * 24 * 60 * 60 * 1000).toISOString().split(".")[0] + "Z",
                "repositories": [
                    ...vmForm.value.repositories.split(",").map(r => r.trim())
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