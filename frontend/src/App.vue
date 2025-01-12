<template>
  <v-app :class="$style.app" :full-height="true">
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
<style>
@import url("./styles/index.css");
</style>

<style module>
.app {
  /* background-color: #0000; */
}
</style>