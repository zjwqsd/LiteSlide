<script setup lang="ts">
import { ref, watch, provide } from 'vue';
import { parseMarkdownToSlides, type SlideNode } from '../core/parser';
import SlideView from './SlideView.vue';
import ArticleView from './ArticleView.vue';

// 定义对外暴露的 API (Props)
const props = withDefaults(defineProps<{
  markdown: string;
  mode?: 'slide' | 'article';
  theme?: 'light' | 'dark';
}>(), {
  mode: 'article',
  theme: 'light'
});

const slides = ref<SlideNode[]>([]);
const currentIndex = ref(0);

// 提供主题状态给底层的 AstRenderer
const isDark = ref(props.theme === 'dark');
provide('isDark', isDark);

// 监听外部属性的变化
watch(() => props.theme, (newTheme) => {
  isDark.value = newTheme === 'dark';
});

watch(() => props.markdown, (newMd) => {
  slides.value = parseMarkdownToSlides(newMd);
  if (currentIndex.value >= slides.value.length) {
    currentIndex.value = Math.max(0, slides.value.length - 1);
  }
}, { immediate: true });

// 局部键盘事件控制（组件聚焦时才生效）
const handleKeydown = (e: KeyboardEvent) => {
  if (props.mode === 'slide') {
    if (e.key === 'ArrowRight' || e.key === 'Space') {
      e.preventDefault(); // 阻止页面默认滚动
      if (currentIndex.value < slides.value.length - 1) currentIndex.value++;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (currentIndex.value > 0) currentIndex.value--;
    }
  }
};
</script>

<template>
  <div 
    class="lite-slide-container w-full h-full outline-none" 
    :class="{ 'dark': isDark }"
    tabindex="0"
    @keydown="handleKeydown"
  >
    <div class="relative w-full h-full overflow-hidden bg-white dark:bg-gray-950 transition-colors duration-300">
      
      <ArticleView v-if="mode === 'article'" :slides="slides" />
      
      <div v-else class="relative w-full h-full aspect-video">
        <Transition name="fade" mode="out-in">
          <SlideView v-if="slides.length > 0" :key="currentIndex" :slide="slides[currentIndex]" />
        </Transition>
        
        <div class="absolute bottom-4 right-4 flex gap-2 z-50">
          <button @click="currentIndex > 0 ? currentIndex-- : null" class="px-2 py-1 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition disabled:opacity-30" :disabled="currentIndex === 0">◀</button>
          <span class="px-3 py-1 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded font-mono text-sm">{{ currentIndex + 1 }} / {{ slides.length }}</span>
          <button @click="currentIndex < slides.length - 1 ? currentIndex++ : null" class="px-2 py-1 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition disabled:opacity-30" :disabled="currentIndex === slides.length - 1">▶</button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.lite-slide-container {
  /* 当组件作为模块嵌入时，强制重置基础样式以防被宿主污染 */
  text-align: left;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>