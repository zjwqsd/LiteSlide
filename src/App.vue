<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, provide } from 'vue';
import { parseMarkdownToSlides, type SlideNode } from './core/parser';
import SlideView from './components/SlideView.vue';
import ArticleView from './components/ArticleView.vue';

const rawMarkdown = `
# 日夜模式双轨渲染引擎
**按 T 键一键切换白天/黑夜配色**

## 测试常规排版
这段文字在白天是深灰色，在夜晚是浅灰色。**加粗的字**在白天是黑色，夜晚是纯白色。
行内代码 \`console.log()\` 会有专门的亮/暗底色。

> 引用块在白天会有浅蓝色的背景，而在黑夜则是深邃的暗蓝。

## 代码高亮自动切换
按 T 键时，下面的代码块会瞬间在 \`github-light\` 和 \`tokyo-night\` 之间切换，这是通过 Vue 响应式注入实现的！

\`\`\`javascript
function toggleTheme(isDark) {
  if (isDark) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}
\`\`\`

## 画廊排版不受影响
不论什么配色，多图排版依然完美。

![图1](https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=600&q=80)
![图2](https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&w=600&q=80)
`;

const editableMarkdown = ref(rawMarkdown);
const slides = ref<SlideNode[]>([]);
const currentIndex = ref(0);
const isEditing = ref(false);
const viewMode = ref<'slide' | 'article'>('slide');

// 【新增】：全局主题状态，并下发给所有子组件
const isDark = ref(true);
provide('isDark', isDark);

watch(editableMarkdown, (newMd) => {
  slides.value = parseMarkdownToSlides(newMd);
  if (currentIndex.value >= slides.value.length) {
    currentIndex.value = Math.max(0, slides.value.length - 1);
  }
}, { immediate: true });

const handleKeydown = (e: KeyboardEvent) => {
  if (e.target instanceof HTMLTextAreaElement) {
    if (e.key === 'Escape') {
      isEditing.value = false;
      (e.target as HTMLElement).blur();
    }
    return;
  }

  if (e.key === 'e' || e.key === 'E') {
    isEditing.value = !isEditing.value;
    return;
  }

  if (e.key === 'm' || e.key === 'M') {
    viewMode.value = viewMode.value === 'slide' ? 'article' : 'slide';
    return;
  }

  // 【新增】：按 T 切换主题
  if (e.key === 't' || e.key === 'T') {
    isDark.value = !isDark.value;
    return;
  }

  if (viewMode.value === 'slide') {
    if (e.key === 'ArrowRight' || e.key === 'Space' || e.key === 'Enter') {
      if (currentIndex.value < slides.value.length - 1) currentIndex.value++;
    } else if (e.key === 'ArrowLeft') {
      if (currentIndex.value > 0) currentIndex.value--;
    }
  }
};

onMounted(() => window.addEventListener('keydown', handleKeydown));
onUnmounted(() => window.removeEventListener('keydown', handleKeydown));
</script>

<template>
  <div :class="{ 'dark': isDark }">
    <div class="w-screen h-screen overflow-hidden bg-gray-200 dark:bg-black flex transition-colors duration-300">
      
      <div v-if="isEditing" class="w-[400px] h-full bg-white dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 flex flex-col shadow-2xl z-50 shrink-0 transition-colors">
        <div class="p-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold flex justify-between items-center border-b border-gray-300 dark:border-gray-700 text-sm">
          <span>临时编辑器</span>
          <span class="text-xs bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded border border-blue-200 dark:border-blue-500/30">ESC 退出</span>
        </div>
        <textarea 
          v-model="editableMarkdown"
          class="flex-1 w-full p-6 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-300 font-mono text-sm leading-relaxed outline-none resize-none focus:ring-inset focus:ring-1 focus:ring-blue-500/50 transition-colors"
          spellcheck="false"
        ></textarea>
      </div>

      <div class="flex-1 h-full flex items-center justify-center relative bg-gray-100 dark:bg-gray-950 overflow-hidden transition-colors">
        
        <div v-if="viewMode === 'article'" class="w-full h-full relative">
          <ArticleView :slides="slides" />
        </div>

        <div v-else class="relative w-full h-full max-w-[1920px] max-h-[1080px] aspect-video bg-white dark:bg-gray-900 shadow-2xl overflow-hidden transition-colors">
          <Transition name="fade" mode="out-in">
            <SlideView v-if="slides.length > 0" :key="currentIndex" :slide="slides[currentIndex]" />
          </Transition>
        </div>

        <div class="absolute bottom-4 right-6 text-gray-600 dark:text-gray-400 font-mono flex gap-4 items-center z-40 bg-white/90 dark:bg-gray-900/80 px-3 py-1.5 rounded-lg backdrop-blur shadow-lg border border-gray-200 dark:border-gray-700/50 transition-colors">
          <span class="text-xs">
            <kbd class="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1 rounded border border-gray-300 dark:border-gray-700">T</kbd> 主题
          </span>
          <span class="text-xs">
            <kbd class="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1 rounded border border-gray-300 dark:border-gray-700">M</kbd> 模式
          </span>
          <span class="text-xs" v-if="!isEditing">
            <kbd class="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1 rounded border border-gray-300 dark:border-gray-700">E</kbd> 编辑
          </span>
          <span class="font-bold text-blue-600 dark:text-blue-400 border-l border-gray-300 dark:border-gray-700 pl-4">
            {{ viewMode === 'slide' ? 'Slide' : 'Article' }}
          </span>
          <span v-if="viewMode === 'slide'" class="border-l border-gray-300 dark:border-gray-700 pl-4">
            {{ currentIndex + 1 }} / {{ slides.length }}
          </span>
        </div>

      </div>
    </div>
  </div>
</template>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>