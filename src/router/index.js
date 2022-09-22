import { createRouter, createWebHashHistory } from 'vue-router'
// import Swarm from '@/pages/tech-spike/swarm.vue'
import Simulation from '@/pages/simulation/index.vue'
import Network from '@/pages/tech-spike/network.vue'
import Libp2p from '@/pages/libp2p/index.vue'
const routes = [
  {
    path: '/benchmark/',
    name: 'benchmark',
    component: Network
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
    component: Simulation
  },
  {
    path: '/security/',
    name: 'security',
    component: Network
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
