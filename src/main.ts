import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/scss/main.scss'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// Initialize auth before mounting to prevent AbortError during navigation
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore(pinia)
authStore.initialize().then(() => {
    app.mount('#app')
}).catch((err) => {
    console.error('Auth initialization failed:', err)
    app.mount('#app')
})
