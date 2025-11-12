import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 当前选中的产品
  const currentProduct = ref(null)

  // 设置当前产品
  const setCurrentProduct = (product) => {
    currentProduct.value = product
    if (product) {
      localStorage.setItem('currentProduct', JSON.stringify(product))
    } else {
      localStorage.removeItem('currentProduct')
    }
  }

  // 从 localStorage 恢复当前产品
  const restoreCurrentProduct = () => {
    const saved = localStorage.getItem('currentProduct')
    if (saved) {
      try {
        currentProduct.value = JSON.parse(saved)
      } catch (e) {
        console.error('恢复产品信息失败:', e)
      }
    }
  }

  return {
    currentProduct,
    setCurrentProduct,
    restoreCurrentProduct
  }
})
