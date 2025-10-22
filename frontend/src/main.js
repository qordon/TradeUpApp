import './assets/main.css'

import { createApp } from 'vue'
import { MotionPlugin } from '@vueuse/motion'
import Vue3Lottie from 'vue3-lottie'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)
app.use(MotionPlugin)
app.use(Vue3Lottie)
app.mount('#app')
