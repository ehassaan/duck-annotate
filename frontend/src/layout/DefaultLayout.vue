<template>
  <v-app-bar :elevation="2">
    <template v-slot:prepend>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
    </template>
    <v-app-bar-title>ShadowLake</v-app-bar-title>
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
