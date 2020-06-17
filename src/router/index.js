import Vue from 'vue'
import VueRouter from 'vue-router'
import Login from '../components/Login.vue'
import Home from '../components/Home.vue'

Vue.use(VueRouter)

const routes = [
  // 路由重定向
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/home', component: Home }
]

const router = new VueRouter({
  routes
})

// 挂载路由导航守卫，可以理解为拦截器
router.beforeEach((to, from, next) => {
  // to 将要访问的路径
  // from 代表从哪个路径跳转而来
  // next 是一个函数， 表示放行，
  // 1、next()直接放行， 2、next('/login')强制跳转到对应路径页面
  if (to.path === '/login')
    return next();
  const tokenStr = window.sessionStorage.getItem("token");
  if (!tokenStr) //如果是空字符串
    return next('/login')
  next();
})

export default router
