<script setup lang="ts">
import { ref, watch, onMounted, inject } from 'vue';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { codeToHtml } from 'shiki';

const props = defineProps<{ node: any; }>();
const highlightedCode = ref<string>('');

// 接收全局状态
const isDark = inject('isDark', ref(true));
const currentDir = inject<string>('currentDir', '');
const assetPrefix = inject<string>('assetPrefix', '');

const renderShiki = async () => {
  if (props.node.type === 'code') {
    const lang = props.node.lang || 'text';
    try {
      highlightedCode.value = await codeToHtml(props.node.value, { 
        lang, 
        theme: isDark.value ? 'tokyo-night' : 'github-light' 
      });
    } catch (error) {
      highlightedCode.value = `<pre class="shiki-fallback">${props.node.value}</pre>`;
    }
  }
};

onMounted(renderShiki);
watch(isDark, renderShiki);

const isVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

const isPureMedia = (node: any) => {
  if (node.type !== 'paragraph') return false;
  const validChildren = node.children.filter((c: any) => c.type !== 'text' || c.value.trim() !== '');
  return validChildren.length > 0 && validChildren.every((c: any) => c.type === 'image');
};

const getMediaChildren = (node: any) => node.children.filter((c: any) => c.type === 'image');

const getGridCols = (count: number) => {
  if (count === 2 || count === 4) return 2;
  if (count >= 3) return 3;
  return 1;
};

// 【核心进化】：支持 CDN/图床前缀的 URL 智能解析器
const resolveUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/')) return url; 

  // 将相对路径与当前文件夹拼接
  if (currentDir) {
    const cleanUrl = url.replace(/^\.\//, ''); // 去掉开头的 ./
    return `/${currentDir}/${cleanUrl}`;
  }
  return url;
};
</script>

<template>
  <template v-if="node.type === 'text'">{{ node.value }}</template>

  <span v-else-if="node.type === 'inlineMath'" class="mx-1 text-orange-600 dark:text-yellow-300" v-html="katex.renderToString(node.value, { throwOnError: false })"></span>
  
  <div v-else-if="node.type === 'math'" class="my-4 flex justify-center text-[2rem] overflow-x-auto py-2 w-full" v-html="katex.renderToString(node.value, { displayMode: true, throwOnError: false })"></div>
  
  <strong v-else-if="node.type === 'strong'" class="font-bold text-gray-900 dark:text-white">
    <AstRenderer v-for="(child, idx) in node.children" :key="idx" :node="child" />
  </strong>
  
  <em v-else-if="node.type === 'emphasis'" class="italic text-gray-600 dark:text-gray-300">
    <AstRenderer v-for="(child, idx) in node.children" :key="idx" :node="child" />
  </em>
  
  <code v-else-if="node.type === 'inlineCode'" class="bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded text-lg font-mono mx-1">{{ node.value }}</code>
  
  <a v-else-if="node.type === 'link'" :href="node.url" class="text-blue-600 dark:text-blue-400 hover:text-blue-500 underline underline-offset-4" target="_blank">
    <AstRenderer v-for="(child, idx) in node.children" :key="idx" :node="child" />
  </a>

  <template v-else-if="node.type === 'paragraph'">
    <div v-if="isPureMedia(node)" class="media-gallery w-full my-4 grid gap-4 place-items-center" :style="{ gridTemplateColumns: `repeat(${getGridCols(getMediaChildren(node).length)}, minmax(0, 1fr))` }">
      <AstRenderer v-for="(child, idx) in getMediaChildren(node)" :key="idx" :node="child" />
    </div>
    <p v-else class="mb-4 text-gray-700 dark:text-gray-300 text-[1.6rem] leading-relaxed tracking-wide">
      <AstRenderer v-for="(child, idx) in node.children" :key="idx" :node="child" />
    </p>
  </template>

  <video v-else-if="node.type === 'image' && isVideo(node.url)" :src="resolveUrl(node.url)" controls class="max-h-[65vh] w-auto max-w-full rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 mx-auto block"></video>
  <img v-else-if="node.type === 'image' && !isVideo(node.url)" :src="resolveUrl(node.url)" :alt="node.alt" :title="node.title" class="max-h-[65vh] w-auto max-w-full object-contain rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 mx-auto block bg-gray-50 dark:bg-gray-800/30" />

  <blockquote v-else-if="node.type === 'blockquote'" class="border-l-4 border-blue-500 pl-6 py-2 my-6 text-gray-600 dark:text-gray-400 italic bg-blue-50 dark:bg-gray-800/30 rounded-r-xl text-2xl">
    <AstRenderer v-for="(child, idx) in node.children" :key="idx" :node="child" />
  </blockquote>
  
  <component :is="node.ordered ? 'ol' : 'ul'" v-else-if="node.type === 'list'" :class="['mb-6 pl-10 text-gray-700 dark:text-gray-300 text-[1.6rem] space-y-2 tracking-wide', node.ordered ? 'list-decimal' : 'list-disc']">
    <AstRenderer v-for="(child, idx) in node.children" :key="idx" :node="child" />
  </component>
  
  <li v-else-if="node.type === 'listItem'" class="pl-2 marker:text-blue-500 leading-snug">
    <AstRenderer v-for="(child, idx) in node.children" :key="idx" :node="child" />
  </li>

  <div v-else-if="node.type === 'code'" class="my-4 rounded-xl p-5 shadow-2xl border border-gray-200 dark:border-gray-800 text-left bg-gray-50 dark:bg-[#1a1b26] relative max-w-full w-full overflow-hidden shrink-0 transition-colors">
    <div v-if="node.lang" class="absolute top-2 right-4 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold select-none">{{ node.lang }}</div>
    <div class="shiki-container text-[1.3rem] font-mono leading-snug [&>pre]:overflow-x-auto [&>pre]:bg-transparent! [&>pre]:pb-2" v-html="highlightedCode"></div>
  </div>
</template>

<style scoped>
li > p { margin-bottom: 0; }
.media-gallery > img, .media-gallery > video {
  width: 100% !important; height: 100% !important; max-height: 40vh !important;
  object-fit: cover !important; aspect-ratio: 16 / 9; margin: 0 !important;
}
.media-gallery:has(> :only-child) > img, .media-gallery:has(> :only-child) > video {
  object-fit: contain !important; max-height: 70vh !important; aspect-ratio: auto;
}
</style>