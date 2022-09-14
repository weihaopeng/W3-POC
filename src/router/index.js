import { createRouter, createWebHashHistory } from 'vue-router'
import Swarm from '@/pages/tech-spike/swarm.vue'
import Libp2p from '@/pages/libp2p/index.vue'
const routes = [
  {
    path: '/benchmark/',
    name: 'benchmark',
    component: Swarm
  },
  {
    path: '/',
    redirect: () => {
      return { name: 'benchmark' }
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'benchmark' }
  },
  {
    path: '/libp2p/',
    name: 'libp2p',
    component: Libp2p
  },
  {
    path: '/simulation/',
    name: 'simulation',
    component: Swarm
  },
  {
    path: '/security/',
    name: 'security',
    component: Swarm
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
