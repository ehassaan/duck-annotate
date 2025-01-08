<template>
    <div>
        <v-btn prepend-icon="github" v-if="!session.data" @click="() => signinSocial('github')">
            Continue with github
        </v-btn>
        <div>
            <pre>{{ session.data }}</pre>
            <v-btn prepend-icon="github" v-if="session.data" @click="authClient.signOut()">
                Sign out
            </v-btn>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { authClient, signinSocial } from '@/utils/auth';

const session = authClient.useSession();
</script>