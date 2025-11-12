import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 创建 axios 实例
const request = axios.create({
  baseURL: '/api',
  timeout: 60000
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data

    // 如果响应数据中有 code 字段，根据 code 判断
    if (res && typeof res.code !== 'undefined') {
      const code = res.code

      // 成功的 code（根据后端定义，一般是 0 或 200）
      if (code === 0 || code === 200) {
        return res.data || res
      }

      // 失败的 code，统一错误处理
      const errorMsg = res.message || res.msg || res.detail || '请求失败'

      // 根据不同的 code 做不同处理
      if (code === 401) {
        ElMessage.error(errorMsg || '未授权，请重新登录')
        localStorage.removeItem('token')
        router.push('/login')
      } else if (code === 403) {
        ElMessage.error(errorMsg || '拒绝访问')
      } else {
        ElMessage.error(errorMsg)
      }

      return Promise.reject(new Error(errorMsg))
    }

    // 如果没有 code 字段，直接返回 data（适配 FastAPI 直接返回数据的情况）
    return res
  },
  (error) => {
    console.error('响应错误:', error)

    // 处理 HTTP 错误响应
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 400:
          // 400 错误 - 请求参数错误
          if (data.detail && Array.isArray(data.detail)) {
            const errorMsg = data.detail.map(err => err.msg).join(', ')
            ElMessage.error(errorMsg)
          } else {
            ElMessage.error(data.message || data.detail || '请求参数错误')
          }
          break
        case 401:
          ElMessage.error('未授权，请重新登录')
          localStorage.removeItem('token')
          router.push('/login')
          break
        case 403:
          ElMessage.error('拒绝访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 422:
          // 验证错误
          if (data.detail && Array.isArray(data.detail)) {
            const errorMsg = data.detail.map(err => err.msg).join(', ')
            ElMessage.error(errorMsg)
          } else {
            ElMessage.error(data.message || '验证失败')
          }
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error(data.message || data.detail || `请求失败 (${status})`)
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error('请求配置错误')
    }

    return Promise.reject(error)
  }
)

export default request
