<template>
  <v-app>
    <v-main class="height-screen">
      <router-view />
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>

import { configure } from "@/utils/storageUtil";

configure().catch(err => {
  console.log("Error configuring zenfs: ", err);
});
</script>
