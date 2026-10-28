import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker for full offline capability
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[Scribbl PWA] New version available, reloading...');
  },
  onOfflineReady() {
    console.log('[Scribbl PWA] App is cached and ready for offline use.');
  }
});

const target = document.getElementById('app');

if (!target) {
  throw new Error('Could not find #app root element');
}

const app = mount(App, {
  target
});

export default app;
