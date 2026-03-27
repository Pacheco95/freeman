import './assets/base.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { install as VueMonacoEditorPlugin } from '@guolao/vue-monaco-editor'

import App from './App.vue'
import router from './router'
import piniaPluginPersistedState from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedState)

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(VueMonacoEditorPlugin, {
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs',
  },
})

app.mount('#app')
