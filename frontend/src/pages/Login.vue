<template>
    <div>
        <button v-if="!session.data" @click="() => signinSocial('github')">
            Continue with github
        </button>
        <div>
            <pre>{{ session.data }}</pre>
            <button v-if="session.data" @click="authClient.signOut()">
                Sign out
            </button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { authClient, signinSocial } from '@/libs/auth';

const session = authClient.useSession();
</script>