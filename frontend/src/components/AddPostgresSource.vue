<template>

    <v-form :class="$style.form" @submit.prevent="submit">
        <v-snackbar v-model="showMessage" :text="message" :timeout="6000">
        </v-snackbar>
        <DynamicFields :fields="optsPostgres" v-model="vmPostgres"></DynamicFields>

        <v-btn :class="$style.button" type="submit" :loading="loading" block color="primary">Create</v-btn>

    </v-form>

</template>

<script setup lang="ts">

import { mergeProps, onMounted, ref } from 'vue';
import * as md from "@/utils/mdUtil";
import DynamicFields from './DynamicFields.vue';
import type { DynamicField } from "@/entities/DynamicField";
import type { SubmitEventPromise } from 'vuetify';
import { $fetch } from '@/services/api';

const message = ref("");
const showMessage = ref(false);
const loading = ref(false);

const vmPostgres = ref({
    name: "MyDataSource",
    host: "",
    port: 5432,
    database: "",
    username: "",
    password: "",
    schema: "public",
    method: "Xmin"
});

const emit = defineEmits(["created"]);

const props = defineProps({
    destination: {
        type: Object,
    }
});


const optsPostgres: DynamicField[] = [
    {
        label: "Target Motherduck Schema",
        type: "text",
        name: "target",
        required: true,
        rules: [(v: string) => v.length > 0 || 'Field is required']
    },
    {
        label: "Name",
        type: "text",
        name: "name",
        required: true,
        rules: [(v: string) => v.length > 0 || 'Field is required']
    },
    {
        label: "Host",
        type: "text",
        name: "host",
        required: true,
        rules: [(v: string) => v.length > 0 || 'Field is required']
    },
    {
        label: "Port",
        type: "number",
        name: "port",
        required: true,
    },
    {
        label: "Database",
        type: "text",
        name: "database",
        required: true,
        rules: [(v: string) => v.length > 0 || 'Field is required']
    },
    {
        label: "Schema",
        type: "text",
        name: "schema",
        required: true,
        rules: [(v: string) => v.length > 0 || 'Field is required'],
    },
    {
        label: "Username",
        type: "text",
        name: "username",
        required: true,
        rules: [(v: string) => v.length > 0 || 'Field is required'],
    },
    {
        label: "Password",
        type: "password",
        name: "password",
        required: true,
        rules: [(v: string) => v.length > 0 || 'Field is required'],
    },
    {
        label: "Replication Method",
        type: "text",
        name: "method",
        required: true,
        rules: [(v: string) => v.length > 0 || 'Field is required'],
        options: [{ value: "Xmin", text: "Xmin" }]
    }
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
            "name": vmPostgres.value.name,
            "configuration": {
                "sourceType": "postgres",
                "replication_method": {
                    "method": vmPostgres.value.method
                },
                "ssl_mode": {
                    "mode": "require"
                },
                "host": vmPostgres.value.host,
                "port": vmPostgres.value.port,
                "database": vmPostgres.value.database,
                "schemas": [
                    vmPostgres.value.schema
                ],
                "username": vmPostgres.value.username,
                "password": vmPostgres.value.password
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