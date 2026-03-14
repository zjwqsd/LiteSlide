<script setup lang="ts">
import { computed } from 'vue';
import type { SlideNode } from '../core/parser';
import AstRenderer from './AstRenderer.vue';

const props = defineProps<{ slide: SlideNode; }>();

const slideAnalysis = computed(() => {
  const els = props.slide.elements;
  const isPureMedia = (node: any) => {
    if (node.type !== 'paragraph') return false;
    const validChildren = node.children?.filter((c: any) => c.type !== 'text' || c.value.trim() !== '') || [];
    return validChildren.length > 0 && validChildren.every((c: any) => c.type === 'image');
  };
  const isVisualBlock = (node: any) => node.type === 'code' || isPureMedia(node) || node.type === 'image';

  const visualNodes = els.filter(isVisualBlock);
  const textNodes = els.filter(n => !isVisualBlock(n));

  return { visualNodes, textNodes, els };
});

const layoutMode = computed(() => {
  if (props.slide.type === 'cover') return 'cover';
  const { visualNodes, textNodes } = slideAnalysis.value;
  if (visualNodes.length > 0 && textNodes.length > 0) return 'split';
  if (visualNodes.length > 0 && textNodes.length === 0) return 'visual-only';
  return 'text-only';
});

const splitGridClass = computed(() => {
  if (layoutMode.value !== 'split') return '';
  let textLength = 0;
  const countText = (node: any) => {
    if (node.value) textLength += node.value.length;
    if (node.children) node.children.forEach(countText);
  };
  slideAnalysis.value.textNodes.forEach(countText);

  if (textLength > 250) return 'grid-cols-[6.5fr_3.5fr]';
  if (textLength > 120) return 'grid-cols-[5.5fr_4.5fr]';
  return 'grid-cols-[1fr_1fr]';
});
</script>

<template>
  <div class="w-full h-full bg-white dark:bg-gray-950 text-gray-900 dark:text-white p-12 flex flex-col box-border min-h-0 transition-colors duration-300">
    
    <h2 
      v-if="slide.type !== 'cover'" 
      class="text-[40px] font-bold mb-6 text-blue-600 dark:text-blue-300 border-b-2 border-gray-200 dark:border-gray-800 pb-3 shrink-0 tracking-wide"
    >
      {{ slide.title }}
    </h2>

    <div class="flex-1 w-full max-w-[1500px] mx-auto overflow-hidden min-h-0 relative">
      
      <div v-if="layoutMode === 'cover'" class="h-full flex flex-col items-center justify-center text-center">
        <h1 class="text-[80px] leading-tight font-black mb-8 text-transparent bg-clip-text bg-gradient-to-br from-blue-500 via-teal-400 to-green-500 dark:from-blue-400 dark:via-teal-300 dark:to-green-400">
          {{ slide.title }}
        </h1>
        <div class="max-w-4xl mx-auto">
          <AstRenderer v-for="(el, idx) in slideAnalysis.els" :key="idx" :node="el" />
        </div>
      </div>

      <div v-else-if="layoutMode === 'split'" :class="['h-full grid gap-12 pb-4', splitGridClass]">
        <div class="flex flex-col justify-center max-h-full overflow-y-auto pr-6 scrollbar-hide min-w-0 pb-8 border-r border-gray-200 dark:border-gray-800/50">
          <AstRenderer v-for="(el, idx) in slideAnalysis.textNodes" :key="'t'+idx" :node="el" />
        </div>
        <div class="flex flex-col justify-center items-center gap-6 max-h-full overflow-y-auto pr-4 scrollbar-hide min-w-0 pb-8">
          <AstRenderer v-for="(el, idx) in slideAnalysis.visualNodes" :key="'v'+idx" :node="el" />
        </div>
      </div>

      <div v-else-if="layoutMode === 'visual-only'" class="h-full flex flex-col justify-center items-center max-h-full overflow-y-auto scrollbar-hide pb-8">
        <div class="w-full max-w-5xl">
          <AstRenderer v-for="(el, idx) in slideAnalysis.visualNodes" :key="'v'+idx" :node="el" />
        </div>
      </div>

      <div v-else class="h-full flex flex-col justify-center pb-4 max-h-full overflow-y-auto scrollbar-hide pr-4 max-w-5xl mx-auto w-full">
        <AstRenderer v-for="(el, idx) in slideAnalysis.textNodes" :key="idx" :node="el" />
      </div>

    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>