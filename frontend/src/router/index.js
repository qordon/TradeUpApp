import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import TransferFromView from '@/views/TransferFromView.vue'
import TradeUpsView from '@/views/TradeUpsView.vue'
import TransferToView from '@/views/TransferToView.vue'

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
      path: '/transfer-from',
      name: 'transfer-from',
      component: TransferFromView,
    },
    {
      path: '/transfer-to',
      name: 'transfer-to',
      component: TransferToView,
    }
  ],
})

export default router
