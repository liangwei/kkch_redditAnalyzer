<template>
  <div class="products-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>产品列表</span>
          <el-button type="primary" @click="$router.push('/products/create')">
            <el-icon><Plus /></el-icon>
            创建产品
          </el-button>
        </div>
      </template>

      <el-alert
        v-if="products.length === 0 && !loading"
        title="提示"
        type="info"
        description="您还没有创建产品。创建产品后，系统将自动生成关键词并帮您发现相关的Reddit频道。"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-table v-loading="loading" :data="products" stripe @row-click="handleRowClick">
        <el-table-column prop="name" label="产品名称" min-width="200" />
        <el-table-column prop="description" label="产品描述" min-width="300" show-overflow-tooltip />
        <el-table-column prop="audience" label="目标受众" min-width="200" show-overflow-tooltip />
        <el-table-column label="关键词数量" width="120" align="center">
          <template #default="{ row }">
            <el-tag>{{ row.keywords?.length || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ctime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.ctime) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 1" type="success">正常</el-tag>
            <el-tag v-else type="danger">禁用</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click.stop="handleView(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @current-change="fetchProducts"
        @size-change="fetchProducts"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { getProducts } from '@/api/reddit'

const router = useRouter()
const appStore = useAppStore()

const loading = ref(false)
const products = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const fetchProducts = async () => {
  loading.value = true
  try {
    const res = await getProducts({
      limit: pageSize.value,
      offset: (page.value - 1) * pageSize.value
    })
    products.value = res.items
    total.value = res.total
  } catch (error) {
    console.error('获取产品列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleView = (row) => {
  appStore.setCurrentProduct(row)
  router.push(`/products/${row.id}`)
}

const handleRowClick = (row) => {
  handleView(row)
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchProducts()
})
</script>

<style scoped>
.products-container {
  max-width: 1400px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>
