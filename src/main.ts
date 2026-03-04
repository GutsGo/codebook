import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import './styles/main.less';
import App from './App.vue';
import { useThemeStore } from './stores/useThemeStore';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// 初始化主题 Store，确保首次加载时应用保存的主题偏好
useThemeStore();

app.mount('#app');
