<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, provide, nextTick } from 'vue';
import { parseMarkdownToSlides, type SlideNode } from './core/parser';
import SlideView from './components/SlideView.vue';
import ArticleView from './components/ArticleView.vue';

// 利用 Vite 魔法直接将外部 demo.md 读取为初始字符串
import rawDemoMd from './demo.md?raw';

// 核心状态
const editableMarkdown = ref(rawDemoMd);
const slides = ref<SlideNode[]>([]);
const currentIndex = ref(0);

// UI 控制面板状态
const isEditing = ref(false); // 默认收起编辑器，沉浸展示
const viewMode = ref<'slide' | 'article'>('slide');
const isDark = ref(true);

// 注入主题状态给底层的代码高亮和样式系统
provide('isDark', isDark);

// 监听 Markdown 文本修改，实时触发重绘
watch(editableMarkdown, (newMd) => {
  slides.value = parseMarkdownToSlides(newMd);
  // 防止删除了某页导致当前页码越界
  if (currentIndex.value >= slides.value.length) {
    currentIndex.value = Math.max(0, slides.value.length - 1);
  }
}, { immediate: true });

// 【核心体验】：光标与视图的双向同步算法
const syncPosition = (e: Event) => {
  const target = e.target as HTMLTextAreaElement;
  const textBeforeCursor = editableMarkdown.value.substring(0, target.selectionStart);
  
  // 计算光标前面有几个一级或二级标题
  const headingMatches = textBeforeCursor.match(/^#{1,2}\s/gm);
  let targetIndex = headingMatches ? headingMatches.length - 1 : 0;
  targetIndex = Math.max(0, Math.min(targetIndex, slides.value.length - 1));

  if (currentIndex.value !== targetIndex) {
    currentIndex.value = targetIndex;
    
    // 如果是文章模式，平滑滚动到对应锚点
    if (viewMode.value === 'article') {
      nextTick(() => {
        const el = document.getElementById(`slide-${targetIndex}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }
};

// 全局快捷键调度中心
const handleKeydown = (e: KeyboardEvent) => {
  // 如果正在编辑器里打字，拦截翻页快捷键
  if (e.target instanceof HTMLTextAreaElement) {
    if (e.key === 'Escape') {
      isEditing.value = false;
      (e.target as HTMLElement).blur();
    }
    return;
  }

  if (e.key === 'e' || e.key === 'E') { isEditing.value = !isEditing.value; return; }
  if (e.key === 'm' || e.key === 'M') { viewMode.value = viewMode.value === 'slide' ? 'article' : 'slide'; return; }
  if (e.key === 't' || e.key === 'T') { isDark.value = !isDark.value; return; }

  // 幻灯片翻页
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
      
      <div v-if="isEditing" class="w-[450px] h-full bg-white dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 flex flex-col shadow-2xl z-50 shrink-0 transition-colors">
        <div class="p-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold flex justify-between items-center border-b border-gray-300 dark:border-gray-700 text-sm">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-green-500"></span>
            <span>LiteSlide Studio</span>
          </div>
          <span class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded border border-gray-300 dark:border-gray-600">ESC 退出</span>
        </div>
        
        <textarea 
          v-model="editableMarkdown"
          @keyup="syncPosition"
          @click="syncPosition"
          @input="syncPosition"
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

        <div class="absolute bottom-6 right-8 text-gray-600 dark:text-gray-400 font-mono flex gap-5 items-center z-40 bg-white/90 dark:bg-gray-900/80 px-4 py-2 rounded-xl backdrop-blur-md shadow-2xl border border-gray-200 dark:border-gray-700/50 transition-colors">
          <div class="flex gap-3 text-xs">
            <span class="flex items-center gap-1 cursor-help" title="切换白天/黑夜"><kbd class="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700 shadow-sm">T</kbd> 极夜</span>
            <span class="flex items-center gap-1 cursor-help" title="切换 PPT/长文"><kbd class="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700 shadow-sm">M</kbd> 形态</span>
            <span class="flex items-center gap-1 cursor-help" title="打开/关闭编辑器" v-if="!isEditing"><kbd class="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700 shadow-sm">E</kbd> 编辑</span>
          </div>
          
          <div class="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
          
          <span class="font-bold text-blue-600 dark:text-blue-400 tracking-wider">
            {{ viewMode === 'slide' ? 'SLIDE' : 'ARTICLE' }}
          </span>
          
          <span v-if="viewMode === 'slide'" class="font-bold text-gray-800 dark:text-gray-200 min-w-[3rem] text-right">
            {{ currentIndex + 1 }}<span class="text-gray-400 dark:text-gray-600 mx-1">/</span>{{ slides.length }}
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