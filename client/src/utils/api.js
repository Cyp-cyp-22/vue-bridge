import axios from 'axios'

const request = axios.create({
  baseURL: 'http://localhost:3000/api'
})

// 请求拦截器：只在有 token 时才携带，不强制
request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = token // 👈 只改这一行！去掉 Bearer
  }
  return config
})

// 响应拦截器：只做错误提示，不跳转
request.interceptors.response.use(
  res => res.data,
  err => {
    console.error('接口错误：', err)
    // 不跳转！不跳转！不跳转！
    return Promise.reject(err)
  }
)

export default {
  loginAPI: (data) => request.post('/login', data),
  getBridgesAPI: () => request.get('/bridges'),
  getRoadsAPI: () => request.get('/roads')
}