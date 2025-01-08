<template>
    <div></div>
</template>

<script setup lang="ts">
import { onBeforeMount, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();

onBeforeMount(async () => {
    console.log("Routing to home");

    const route = useRoute();
    console.log("Params: ", route.query);
    await router.replace({
        path: `/?token=sometoken&provider=github`,
    });
});
</script>
