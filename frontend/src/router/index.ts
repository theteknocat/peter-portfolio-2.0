import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/views/HomeView.vue'),
    meta: { transition: 'page' },
  },
  {
    path: '/portfolio',
    component: () => import('@/views/PortfolioView.vue'),
    meta: { transition: 'page' },
  },
  {
    path: '/portfolio/:slug',
    components: {
      default: () => import('@/views/PortfolioView.vue'),
      modal:   () => import('@/views/PortfolioItemView.vue'),
    },
    meta: { modal: true },
  },
  {
    path: '/articles',
    component: () => import('@/views/ArticlesView.vue'),
    meta: { transition: 'page' },
  },
  {
    path: '/articles/:slug',
    components: {
      default: () => import('@/views/ArticlesView.vue'),
      modal:   () => import('@/views/ArticleView.vue'),
    },
    meta: { modal: true },
  },
  {
    path: '/job-history',
    component: () => import('@/views/JobHistoryView.vue'),
    meta: { transition: 'page' },
  },
]
