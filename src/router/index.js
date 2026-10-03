import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import { usePokerStore } from '../store'
import { useMarathonPokerStore } from '../store/marathonPoker'
import { useMarathonNumberStore } from '../store/marathonNumber'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/poker/settings', name: 'PokerSettings', component: () => import('../views/poker/Settings.vue') },
  { path: '/poker/memory', name: 'PokerMemory', component: () => import('../views/poker/Memory.vue') },
  { path: '/poker/reconstruct', name: 'PokerReconstruct', component: () => import('../views/poker/Reconstruct.vue') },
  { path: '/poker/result', name: 'PokerResult', component: () => import('../views/poker/Result.vue') },
  { path: '/number-training', name: 'NumberTraining', component: () => import('../views/number/NumberTraining.vue') },

  // 马拉松扑克训练
  { path: '/marathon/poker/settings', name: 'MarathonPokerSettings', component: () => import('../views/marathon/poker/Settings.vue') },
  { path: '/marathon/poker/memory', name: 'MarathonPokerMemory', component: () => import('../views/marathon/poker/Memory.vue') },
  { path: '/marathon/poker/reconstruct', name: 'MarathonPokerReconstruct', component: () => import('../views/marathon/poker/Reconstruct.vue') },
  { path: '/marathon/poker/result', name: 'MarathonPokerResult', component: () => import('../views/marathon/poker/Result.vue') },



  // 马拉松数字训练
  { path: '/marathon/number/settings', name: 'MarathonNumberSettings', component: () => import('../views/marathon/number/Settings.vue') },
  { path: '/marathon/number/memory', name: 'MarathonNumberMemory', component: () => import('../views/marathon/number/Memory.vue') },
  { path: '/marathon/number/reconstruct', name: 'MarathonNumberReconstruct', component: () => import('../views/marathon/number/Reconstruct.vue') },
  { path: '/marathon/number/result', name: 'MarathonNumberResult', component: () => import('../views/marathon/number/Result.vue') }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() { return { top: 0 } }
})

// A browser refresh clears in-memory training state. Return to a usable setup
// screen instead of rendering an empty result or starting an unintended session.
router.beforeEach((to) => {
  if (!to.matched.length) return '/'
  if (/^\/poker\/(reconstruct|result)$/.test(to.path) && !usePokerStore().shuffledCards.length) return '/poker/settings'
  if (/^\/marathon\/poker\/(memory|reconstruct|result)$/.test(to.path) && !useMarathonPokerStore().decks.length) return '/marathon/poker/settings'
  if (/^\/marathon\/number\/(memory|reconstruct|result)$/.test(to.path) && !useMarathonNumberStore().originalSegments.length) return '/marathon/number/settings'
})

export default router
