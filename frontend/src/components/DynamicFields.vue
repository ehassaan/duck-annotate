<template>
  <div v-for="(field, index) in fields" :key="field.name">
    <slot :name="`field-${field.type}`" v-bind="{ field, index }">
      <v-text-field v-if="field.type === 'text'" v-model="formData[field.name]" :label="field.label"
        :rules="field.rules" :required="field.required"></v-text-field>
      <v-select v-else-if="field.type === 'select'" v-model="formData[field.name]" :label="field.label"
        :items="field.options" item-title="title" item-value="value" :rules="field.rules"
        :required="field.required"></v-select>

      <v-text-field v-if="field.type === 'password'" v-model="formData[field.name]" :label="field.label"
        :rules="field.rules" type="password" :required="field.required"></v-text-field>

      <v-text-field v-if="field.type === 'number'" v-model.number="formData[field.name]" :label="field.label"
        :rules="field.rules" type="number" :required="field.required"></v-text-field>

    </slot>
  </div>
</template>

<script setup lang="ts">
import type { DynamicField } from '@/entities/DynamicField';
import { computed } from 'vue';


const props = defineProps<{
  fields: DynamicField[];
}>();

const formData: any = defineModel();

</script>
