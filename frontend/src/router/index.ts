import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/portfolio', component: () => import('../views/PortfolioView.vue') },
    { path: '/portfolio/:slug', component: () => import('../views/PortfolioItemView.vue') },
    { path: '/articles', component: () => import('../views/ArticlesView.vue') },
    { path: '/articles/:slug', component: () => import('../views/ArticleView.vue') },
    { path: '/job-history', component: () => import('../views/JobHistoryView.vue') },
  ],
})
