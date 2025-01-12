<template>
  <DefaultLayout :items="navItems">
    <ImportWizard v-if="!isLoading"></ImportWizard>
  </DefaultLayout>
</template>

<script lang="ts" setup>
import ImportWizard from '@/components/ImportWizard.vue';
import DefaultLayout from '@/layout/DefaultLayout.vue';
import { authClient } from '@/utils/auth';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

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

const router = useRouter();
const isLoading = ref(true);

onMounted(async () => {
  try {
    isLoading.value = true;
    const session = await authClient.getSession();
    console.debug("Session: ", session);
    if (session.error || !session.data) {
      await router.replace("/login");
    }
  }
  catch (err) {
    console.error("Failed to get session: ", err);
  }
  finally {
    isLoading.value = false;
  }
});


</script>
