<template>
    <div>Hello</div>
</template>

<script setup lang="ts">
import { onBeforeMount, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onBeforeMount(async () => {
    console.log("Routing to home");
    localStorage.setItem("githubToken", "sometoken");
    await router.push({
        path: `/?token=sometoken&provider=github`,
    });
});
</script>
