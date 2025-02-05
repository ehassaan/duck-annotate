<template>
    <v-form :class="$style.form">

        <v-label :class="$style.field">{{ message }}</v-label>

        <v-btn v-if="destinationId" :loading="loadingConnect" :class="$style.button" type="button" @click="disconnect"
            block color="primary">Disconnect</v-btn>

        <v-text-field type="password" density="default" :class="$style.field" v-if="!destinationId && !loadingConnect"
            required v-model="vmToken" label="Token"></v-text-field>

        <v-btn v-if="!destinationId" :loading="loadingConnect" :class="$style.button" type="button" @click="connect"
            block color="primary">Connect</v-btn>

        <v-select density="default" v-model="vmDatabase" :class="$style.field" :items="databases"
            @update:model-value="fetchSchemas" label="Select Database"></v-select>

        <v-select :loading="loadingSchemas" density="default" :class="$style.field" v-model="vmSchema"
            item-title="title" item-value="value" :items="schemas" label="Select Schema to store metadata"></v-select>

        <!-- <v-checkbox density="compact" :class="$style.field" label="Annotate all tables"
            v-model="vmIsAllTables"></v-checkbox>

        <v-select density="compact" v-if="!vmIsAllTables" :class="$style.field" v-model="vmSelectedTables"
            :loading="loadingTables" :items="tables" multiple label="Select Tables to Annotate"></v-select> -->

        <v-btn :class="$style.button" :loading="loadingSave" type="button" @click="submit" block
            color="primary">Save</v-btn>

    </v-form>

</template>

<script setup lang="ts">

import { onMounted, ref } from 'vue';
import * as md from "@/services/motherduck";
import { $fetch } from '@/services/api';

const emit = defineEmits(["connect", "submit", "disconnect"]);
const vmToken = ref("");
const vmSchema = ref<string>("duck_annotate");
const vmDatabase = ref("");
const message = ref("");
const loadingConnect = ref(false);
const loadingSave = ref(false);
const loadingSchemas = ref(false);
const databases = ref<string[]>([]);
const schemas = ref<{ title: string; value: string; }[]>([]);
// const tables = ref<string[]>([]);
// const loadingTables = ref(false);
// const vmIsAllTables = ref(true);
// const vmSelectedTables = ref<string[]>([]);
let destinationId = ref<string>();

onMounted(async () => {
    try {
        if (md.connInfo) {
            vmToken.value = md.connInfo.token;
            vmDatabase.value = md.connInfo.database;
            vmSchema.value = md.connInfo.schema;
            destinationId.value = md.connInfo.destinationId;
            await connect(md.connInfo);
            await fetchSchemas();
            // await fetchTables(connInfo.schema);
        }
    }
    catch (err) {
        console.log("Failed to connect to motherduck: ", err);
    }
});


async function disconnect() {
    loadingConnect.value = true;
    try {
        let res = await $fetch('/api/airbyte/v1/destinations/' + destinationId.value,
            {
                method: 'DELETE',
                credentials: 'include',
            });
        if (res.error) {
            message.value = "Failed to delete Airbyte destination: " + res.error.message;
            console.error("Error deleting source: ", res.error);
            return;
        }
        destinationId.value = undefined;
        vmToken.value = "";
        emit("disconnect");
    }
    catch (err) {

    }
    finally {
        loadingConnect.value = false;
    }

}

async function connect(connInfo: any) {
    if (!vmToken.value) {
        message.value = "Error: Token is null";
        return;
    }
    message.value = "Connecting...";
    loadingConnect.value = true;

    try {
        await md.connect(vmToken.value);
        const dbRes = await md.fetchDatabases();
        message.value = `Connection Successful. ${dbRes.length} databases found.`;
        databases.value = dbRes;
    } catch (err) {
        console.log('query failed', err);
        message.value = `Connection Failed: ${err}`;
        return;
    }
    finally {
        loadingConnect.value = false;
    }
}

async function fetchSchemas() {
    if (!md.db) {
        return;
    }
    loadingSchemas.value = true;
    try {
        const schemaRes = await md.fetchSchemas(vmDatabase.value);
        console.log('schemas result', schemaRes, vmDatabase.value);
        schemas.value = schemaRes.map(s => ({ title: s, value: s }));
        if (!schemas.value.find(s => s.value == "duck_annotate")) {
            schemas.value.push({ title: "duck_annotate (new)", value: "duck_annotate" });
        }
    } catch (err) {
        console.log('query failed', err);
    }
    finally {
        loadingSchemas.value = false;
    }
}

// async function fetchTables(schema: string) {
//     console.log("Fetching tables: ", schema);
//     if (!md.db) {
//         return;
//     }
//     loadingTables.value = true;
//     const tableRes = await md.fetchTables(vmDatabase.value, schema);
//     console.log('query result', tableRes);
//     tables.value = tableRes;
//     loadingTables.value = false;
// }

async function submit() {
    // let tableList: string[];
    // if (vmIsAllTables.value) {
    //     tableList = { ...tables.value };
    // }
    // else {
    //     tableList = { ...vmSelectedTables.value };
    // }
    loadingSave.value = true;
    const connValues = {
        database: vmDatabase.value, token: vmToken.value, schema: vmSchema.value,
        // tables: tableList
    };
    try {
        let res: { error: any, data: any; };
        let vals: any;

        if (connValues.schema == "duck_annotate") {
            try {
                await md.createSchema(connValues.database, "duck_annotate", true);
            }
            catch (err) {
                console.log("Failed to create schema: ", err);
                throw Error("Failed to create Motherduck schema");
            }
        }

        if (destinationId.value) {
            let body = {
                "name": `${connValues.database}/${connValues.schema}`,
                "configuration": {
                    "schema": connValues.schema,
                    "motherduck_api_key": connValues.token,
                    "destination_path": `md:${connValues.database}`
                }
            };
            console.log("Request body: ", body);
            res = await $fetch('/api/airbyte/v1/destinations/' + destinationId.value,
                {
                    method: 'PATCH',
                    credentials: 'include',
                    body: body
                });
            vals = { ...connValues, destinationId: destinationId.value };
        }
        else {
            res = await $fetch('/api/airbyte/v1/destinations',
                {
                    method: 'POST',
                    credentials: 'include',
                    body: {
                        "name": `${connValues.database}/${connValues.schema}`,
                        "definitionId": "042ee9b5-eb98-4e99-a4e5-3f0d573bee66",
                        "configuration": {
                            "schema": connValues.schema,
                            "motherduck_api_key": connValues.token,
                            "destination_path": `md:${connValues.database}`
                        }
                    }
                });
            vals = { ...connValues, destinationId: (res.data as any).data.destinationId };
        }
        console.log("Airbyte Response: ", res);
        if (res.error) {
            message.value = 'Failed to create/update Airbyte destination: ' + res.error.message;
            return;
        }
        destinationId.value = vals.destinationId;
        console.log("Submitting: ", vals);
        emit("submit", vals);
    }
    catch (err) {
        console.log("Failed: ", err);
        message.value = 'Error: ' + err;
    }
    finally {
        loadingSave.value = false;
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