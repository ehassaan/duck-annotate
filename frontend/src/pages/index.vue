<template>
  <DefaultLayout :items="navItems">
    <WorkspaceView v-if="!isLoading"></WorkspaceView>
  </DefaultLayout>
</template>

<script lang="ts" setup>
import WorkspaceView from '@/components/WorkspaceView.vue';
import DefaultLayout from '@/layout/DefaultLayout.vue';
import { authClient } from '@/services/auth';
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
