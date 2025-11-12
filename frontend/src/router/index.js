import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true },
    redirect: '/products',
    children: [
      {
        path: 'credentials',
        name: 'Credentials',
        component: () => import('@/views/Credentials.vue'),
        meta: { title: 'Reddit凭证管理' }
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/Products.vue'),
        meta: { title: '产品列表' }
      },
      {
        path: 'products/create',
        name: 'ProductCreate',
        component: () => import('@/views/ProductCreate.vue'),
        meta: { title: '创建产品' }
      },
      {
        path: 'products/:id',
        name: 'ProductDetail',
        component: () => import('@/views/ProductDetail.vue'),
        meta: { title: '产品详情' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)

  if (requiresAuth && !userStore.token) {
    // 需要登录但未登录
    next('/login')
  } else if (to.path === '/login' && userStore.token) {
    // 已登录但访问登录页
    next('/')
  } else {
    next()
  }
})

export default router
