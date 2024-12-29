<template>
  <DefaultLayout :items="navItems">
    <ImportWizard></ImportWizard>
  </DefaultLayout>
</template>

<script lang="ts" setup>
import ImportWizard from '@/components/ImportWizard.vue';
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
