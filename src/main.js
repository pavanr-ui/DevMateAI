import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue } from '@ionic/vue'

import App from './App.vue'
import router from './router'
import './styles/main.css'

const app = createApp(App)

app.use(IonicVue) // Ionic components + platform detection (iOS / Android / web)
app.use(createPinia()) // global state stores
app.use(router)

// Ionic needs the first route resolved before mounting, so page
// transitions start from a known state.
router.isReady().then(() => {
  app.mount('#app')
})
