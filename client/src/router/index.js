import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import MapView from '../views/MapView.vue'
import RoadView from '../views/RoadView.vue'
import Culture from '../views/Culture.vue'
import Achievement from '../views/Achievement.vue'
import Admin from '../views/Admin.vue'  // 新增

const routes = [
  { path: '/login', component: Login },
  {
    path: '/',
    component: Home,
    children: [
      { path: 'map', component: MapView },
      { path: 'road', component: RoadView },
      { path: 'culture', component: Culture },
      { path: 'achievement', component: Achievement },
      { path: '', redirect: '/map' }
    ]
  },
  // 新增后台管理路由
  { path: '/admin', component: Admin }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router