<template>
  <v-app-bar :elevation="2">
    <template v-slot:prepend>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
    </template>
    <v-app-bar-title>DuckAnnotate</v-app-bar-title>
  </v-app-bar>

  <v-navigation-drawer v-model="drawer" :location="$vuetify.display.mobile ? 'bottom' : undefined">
    <v-list>

      <v-list-item v-for="(item, i) in items" :key="i" :value="item" :to="item.link" color="primary">
        <template v-slot:prepend>
          <v-icon :icon="item.icon"></v-icon>
        </template>

        <v-list-item-title v-text="item.label"></v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>

  <slot></slot>
</template>
<script setup lang="ts">
import { ref, type PropType } from 'vue';


const drawer = ref(false);
const props = defineProps({
  items: {
    type: Array as PropType<{ label: string, icon: string, link: string; }[]>,
    required: true
  },
});
</script>

<style>
@import url("../styles/index.css");

:root {
  --accent: 136, 58, 234;
  --accent-light: 224, 204, 250;
  --accent-dark: 49, 10, 101;
  --accent-gradient: linear-gradient(45deg,
      rgb(var(--accent)),
      rgb(var(--accent-light)) 30%,
      white 60%);
}

html {
  font-family: "Open Sans", system-ui, sans-serif;
  background: #13151a;
  margin: 0;
  padding: 0;
}

body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: hsla(33, 84%, 68%, 1);

  background-blend-mode: multiply;
  background-size: cover;
  background-image: linear-gradient(130deg,
      hsla(33, 84%, 68%, 1) 0%,
      hsla(184, 51%, 27%, 1) 52%,
      hsla(191, 96%, 18%, 1) 100%),
    url("/public/images/ducklake-bg.jpg");
}
</style>