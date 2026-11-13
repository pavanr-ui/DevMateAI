import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { IonicVue } from '@ionic/vue'

import App from './App.vue'
import router from './router'
import { useThemeStore } from './stores/theme'
import { useAuthStore } from './stores/auth'

// Self-hosted fonts: bundled with the app, so they work offline on mobile
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(IonicVue) // Ionic components + platform detection (iOS / Android / web)
app.use(pinia) // global state stores
app.use(router)

// Apply the saved theme before the first paint to avoid a light "flash".
useThemeStore(pinia).apply()
// Start listening for the signed-in user right away.
useAuthStore(pinia).init()

// Ionic needs the first route resolved before mounting, so page
// transitions start from a known state.
router.isReady().then(() => {
  app.mount('#app')
})
