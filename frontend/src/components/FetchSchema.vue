<template>

    <v-form :class="$style.form" @submit.prevent="submit">
        <v-snackbar v-model="showMessage" :text="message" :timeout="6000">
        </v-snackbar>
        <DynamicFields :fields="optsPostgres" v-model="vmForm"></DynamicFields>

        <div>
            <v-btn :disabled="!isMd" :class="$style.button" type="submit" :loading="loading"
                color="primary">Fetch</v-btn>
            <v-btn :class="$style.button" type="button" @click="() => emit('cancel')" color="secondary">Cancel</v-btn>
        </div>

        <label v-if="!isMd">Please connect Motherduck first</label>

    </v-form>

</template>

<script setup lang="ts">

import { computed, onMounted, ref } from 'vue';
import DynamicFields from './DynamicFields.vue';
import type { DynamicField } from "@/entities/DynamicField";
import type { SubmitEventPromise } from 'vuetify';
import { $fetch } from '@/services/api';
import * as md from "@/services/motherduck";
import type { SchemaField } from '@/entities/SchemaField';
import _ from 'lodash';

const message = ref("");
const showMessage = ref(false);
const loading = ref(false);
const isMd = computed(() => md.connInfo != null);

const vmForm = ref({
    name: "MyDataSource",
    host: "",
    port: 5432,
    database: "",
    username: "",
    password: "",
});


const emit = defineEmits(["created", "cancel"]);


const optsPostgres: DynamicField[] = [
    {
        label: "Catalog Name (defaults to database name)",
        type: "text",
        name: "name",
        required: false,
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
];


onMounted(async () => {

});


async function submit(ev: SubmitEventPromise) {
    showMessage.value = false;
    const validation = await ev;
    if (!validation.valid) return;

    try {
        loading.value = true;
        const body = {
            "host": vmForm.value.host,
            "port": vmForm.value.port,
            "database": vmForm.value.database,
            "username": vmForm.value.username,
            "password": vmForm.value.password
        };

        const res = await $fetch('/api/schema/postgres/fetch', {
            method: 'POST',
            credentials: 'include',
            body: body
        });
        console.log("Fetch Response: ", res);
        if (res.error) {
            message.value = "Failed to fetch schema: " + res.error.message;
            showMessage.value = true;
            return;
        }
        if (!md.connInfo || !md.db) throw Error("Motherduck not initialized");

        const data = (res.data as any).data.map((s: any) => ({
            catalog_name: _.isEmpty(vmForm.value.name) ? vmForm.value.database : vmForm.value.name,
            database_name: s.database_name,
            schema_name: s.schema_name,
            table_name: s.table_name,
            column_name: s.column_name,
            data_type: s.data_type,
            comment: s.comment,
            comment_approved: null,
        }) as Omit<SchemaField, 'created_at'>);

        console.log("Data: ", data);

        await md.updateColumnMetadata(md.connInfo.database, md.connInfo.schema, data);
        return emit("created");
    }
    catch (err) {
        console.log("Error: ", err);
        message.value = "Error: " + err;
        showMessage.value = true;
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