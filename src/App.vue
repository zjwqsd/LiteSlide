<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, provide } from 'vue';
import { parseMarkdownToSlides, type SlideNode } from './core/parser';
import SlideView from './components/SlideView.vue';
import ArticleView from './components/ArticleView.vue';

const fileList = ref<string[]>([]);
const currentFilePath = ref<string>('');
const currentMarkdown = ref(''); // 变成了只读的状态
const slides = ref<SlideNode[]>([]);
const currentIndex = ref(0);

const showSidebar = ref(true); // E 键现在用来开关侧边栏
const viewMode = ref<'slide' | 'article'>('slide');
const isDark = ref(true);

const currentDir = computed(() => {
  if (!currentFilePath.value) return '';
  const parts = currentFilePath.value.split('/');
  parts.pop();
  return parts.join('/');
});

provide('isDark', isDark);
provide('currentDir', currentDir);

const fetchFiles = async () => {
  const res = await fetch('/api/files');
  fileList.value = await res.json();
  if (fileList.value.length > 0 && !currentFilePath.value) {
    loadFile(fileList.value[0]);
  }
};

const loadFile = async (path: string) => {
  currentFilePath.value = path;
  const res = await fetch(`/api/read?path=${encodeURIComponent(path)}`);
  currentMarkdown.value = await res.text();
};

watch(currentMarkdown, (newMd) => {
  slides.value = parseMarkdownToSlides(newMd);
  if (currentIndex.value >= slides.value.length) currentIndex.value = Math.max(0, slides.value.length - 1);
});

// 【核心体验】：无感热更新 (HMR) 监听
if (import.meta.hot) {
  import.meta.hot.on('md-update', (payload) => {
    // 如果在 VS Code 里新建或删除了文件，刷新左侧目录树
    if (payload.type === 'add' || payload.type === 'unlink') {
      fetchFiles();
    }
    // 如果在 VS Code 里保存了当前正在看的文件，无刷新热重载 PPT 内容！
    if (payload.path === currentFilePath.value) {
      loadFile(currentFilePath.value);
    }
  });
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'e' || e.key === 'E') { showSidebar.value = !showSidebar.value; return; }
  if (e.key === 'm' || e.key === 'M') { viewMode.value = viewMode.value === 'slide' ? 'article' : 'slide'; return; }
  if (e.key === 't' || e.key === 'T') { isDark.value = !isDark.value; return; }

  if (viewMode.value === 'slide') {
    if (e.key === 'ArrowRight' || e.key === 'Space' || e.key === 'Enter') {
      if (currentIndex.value < slides.value.length - 1) currentIndex.value++;
    } else if (e.key === 'ArrowLeft') {
      if (currentIndex.value > 0) currentIndex.value--;
    }
  }
};

onMounted(() => {
  fetchFiles();
  window.addEventListener('keydown', handleKeydown);
});
onUnmounted(() => window.removeEventListener('keydown', handleKeydown));
</script>

<template>
  <div :class="{ 'dark': isDark }">
    <div class="w-screen h-screen overflow-hidden bg-gray-200 dark:bg-black flex transition-colors duration-300">
      
      <div v-if="showSidebar" class="w-[280px] h-full bg-white dark:bg-gray-950 border-r border-gray-300 dark:border-gray-800 flex flex-col shrink-0 shadow-xl z-20 transition-colors">
        <div class="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <span class="font-bold text-gray-800 dark:text-gray-200 text-sm">🗂️ 本地组会库</span>
        </div>
        <div class="flex-1 overflow-y-auto p-3">
          <button 
            v-for="file in fileList" :key="file"
            @click="loadFile(file)"
            class="w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1.5 truncate transition-all duration-200 border border-transparent"
            :class="file === currentFilePath ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 font-bold shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'"
            :title="file"
          >
            {{ file.split('/').slice(-2).join(' / ') }}
          </button>
        </div>
      </div>

      <div class="flex-1 h-full flex items-center justify-center relative bg-gray-100 dark:bg-[#09090b] overflow-hidden">
        
        <div v-if="viewMode === 'article'" class="w-full h-full relative">
          <ArticleView :slides="slides" />
        </div>
        
        <div v-else class="relative w-full h-full max-w-[1920px] max-h-[1080px] aspect-video shadow-2xl overflow-hidden bg-white dark:bg-gray-900">
          <Transition name="fade" mode="out-in">
            <SlideView v-if="slides.length > 0" :key="currentIndex" :slide="slides[currentIndex]" />
          </Transition>
        </div>

        <div class="absolute bottom-6 right-8 text-gray-600 dark:text-gray-400 font-mono flex gap-5 items-center z-40 bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-xl backdrop-blur-md shadow-lg border border-gray-200 dark:border-gray-700">
          <div class="flex gap-3 text-xs">
            <span class="flex items-center gap-1"><kbd class="bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700">T</kbd> 主题</span>
            <span class="flex items-center gap-1"><kbd class="bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700">M</kbd> 模式</span>
            <span class="flex items-center gap-1"><kbd class="bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700">E</kbd> 侧边栏</span>
          </div>
          <div class="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
          <span class="font-bold text-blue-600 dark:text-blue-400">{{ viewMode === 'slide' ? 'SLIDE' : 'ARTICLE' }}</span>
          <span v-if="viewMode === 'slide'" class="font-bold text-gray-800 dark:text-gray-200 min-w-[3rem] text-right">
            {{ currentIndex + 1 }}<span class="text-gray-400 mx-1">/</span>{{ slides.length }}
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