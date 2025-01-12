<template>
    <DefaultLayout :items="navItems">
        <v-card color="background">
            <v-card-title primary-title>
                title
            </v-card-title>
        </v-card>

    </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from '@/layout/DefaultLayout.vue';
import { ref } from 'vue';

const navItems = ref([
    {
        label: 'Home',
        icon: 'mdi-home',
        link: '/'
    },
    {
        label: 'About',
        icon: 'mdi-account',
        link: '/about'
    }
]);

</script>