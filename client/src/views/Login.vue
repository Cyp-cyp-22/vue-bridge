<template>
  <div class="login-page">
    <div class="login-box">
      <h2>古桥可视化平台</h2>
      <input v-model="form.username" placeholder="账号" type="text" />
      <input v-model="form.password" placeholder="密码" type="password" />
      <button @click="login">登录</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/api'

const router = useRouter()
const form = ref({
  username: '',
  password: ''
})

const login = async () => {
  try {
    const res = await api.loginAPI(form.value)
    localStorage.setItem('token', res.token)
    router.push('/')
  } catch (err) {
    alert('登录失败：' + (err.response?.data?.message || '账号密码错误'))
  }
}
</script>

<style scoped>
.login-page {
  width: 100vw;
  height: 100vh;
  background: #0a1229;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-box {
  background: #151b33;
  padding: 40px;
  border-radius: 10px;
  width: 360px;
  text-align: center;
  border: 1px solid #42b983;
}
.login-box h2 {
  color: #42b983;
  margin-bottom: 20px;
}
input {
  width: 100%;
  padding: 12px;
  margin: 10px 0;
  border-radius: 6px;
  background: #2a3252;
  border: none;
  color: #fff;
  font-size: 14px;
}
button {
  width: 100%;
  padding: 12px;
  background: #42b983;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  margin-top: 10px;
  cursor: pointer;
}
</style>