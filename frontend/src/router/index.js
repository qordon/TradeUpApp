import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import InventoryView from '@/views/InventoryView.vue'
import TradeUpsView from '@/views/TradeUpsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/tradeups',
      name: 'tradeups',
      component: TradeUpsView,
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: InventoryView,
    }
  ],
})

export default router
