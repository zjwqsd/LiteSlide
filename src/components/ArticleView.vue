<script setup lang="ts">
import type { SlideNode } from '../core/parser';
import AstRenderer from './AstRenderer.vue';

// 严格对应 App.vue 传过来的 :slides 属性
defineProps<{
  slides: SlideNode[];
}>();
</script>

<template>
  <div class="w-full h-full bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 overflow-y-auto custom-scrollbar transition-colors duration-300">
    <div class="max-w-4xl mx-auto py-20 px-8">
      
      <template v-for="(slide, index) in slides" :key="index">
        <h1 
          v-if="slide.type === 'cover'" 
          class="text-6xl font-black mb-12 text-transparent bg-clip-text bg-gradient-to-br from-blue-500 via-teal-400 to-green-500 dark:from-blue-400 dark:via-teal-300 dark:to-green-400 leading-tight mt-8"
        >
          {{ slide.title }}
        </h1>
        <h2 
          v-else 
          class="text-4xl font-bold mb-8 text-blue-600 dark:text-blue-300 border-b border-gray-200 dark:border-gray-800 pb-4 mt-20"
        >
          {{ slide.title }}
        </h2>
        <div class="flex flex-col gap-2">
          <AstRenderer v-for="(el, idx) in slide.elements" :key="idx" :node="el" />
        </div>
      </template>

      <div class="h-32 w-full flex items-end justify-center text-gray-400 dark:text-gray-600 font-mono text-sm">
        - END -
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
</style>