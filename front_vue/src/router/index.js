import { createRouter, createWebHistory } from 'vue-router'
import OpenFluxView from '../views/OpenFluxView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: OpenFluxView
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router 