// src/index.ts
import './style.css'; // 确保 Tailwind 和我们的全局样式被打包进去
import LiteSlide from './components/LiteSlide.vue';

// 支持作为 Vue 插件安装
export default {
  install(app: any) {
    app.component('LiteSlide', LiteSlide);
  }
};

// 同时也支持单独按需引入
export { LiteSlide };