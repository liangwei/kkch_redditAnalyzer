<template>
  <div class="product-detail-container">
    <!-- 产品信息卡片 -->
    <el-card class="product-info-card">
      <div class="product-info">
        <div class="info-left">
          <h2>{{ product?.name }}</h2>
          <p class="description">{{ product?.description }}</p>
          <div class="meta">
            <el-tag>受众: {{ product?.audience }}</el-tag>
            <el-tag v-if="product?.website" type="info">
              <a :href="product.website" target="_blank">官网</a>
            </el-tag>
          </div>
        </div>
        <div class="info-right">
          <el-button @click="handleRegenerateKeywords" :loading="regenerating">
            <el-icon><Refresh /></el-icon>
            重新生成关键词
          </el-button>
          <el-button type="primary" @click="$router.back()">
            <el-icon><Back /></el-icon>
            返回列表
          </el-button>
        </div>
      </div>

      <!-- 关键词展示 -->
      <el-divider />
      <div class="keywords-section">
        <h3>AI 生成的关键词</h3>
        <div v-if="product?.keywords && product.keywords.length > 0" class="keywords">
          <div v-for="type in ['product', 'competitor', 'industry']" :key="type" class="keyword-group">
            <span class="keyword-type">
              {{ type === 'product' ? '产品' : type === 'competitor' ? '竞品' : '行业' }}:
            </span>
            <el-tag
              v-for="(kw, index) in getKeywordsByType(type)"
              :key="index"
              :type="type === 'product' ? 'primary' : type === 'competitor' ? 'warning' : 'success'"
              style="margin: 4px"
            >
              {{ kw.keyword }}
            </el-tag>
          </div>
        </div>
        <el-empty v-else description="暂无关键词" :image-size="60" />
      </div>
    </el-card>

    <!-- Tab 切换 -->
    <el-card class="tabs-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- Tab 1: Subreddit 发现 -->
        <el-tab-pane label="Subreddit 发现" name="subreddits">
          <SubredditTab :product-id="productId" :key="tabKey" />
        </el-tab-pane>

        <!-- Tab 2: 帖子列表 -->
        <el-tab-pane label="帖子列表" name="submissions">
          <SubmissionsTab :product-id="productId" :key="tabKey" />
        </el-tab-pane>

        <!-- Tab 3: 舆情分析 -->
        <el-tab-pane label="舆情分析" name="analysis">
          <AnalysisTab :product-id="productId" :key="tabKey" />
        </el-tab-pane>

        <!-- Tab 4: 监控任务 -->
        <el-tab-pane label="监控任务" name="monitors">
          <MonitorsTab :product-id="productId" :key="tabKey" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getProduct, regenerateKeywords } from '@/api/reddit'
import { ElMessage } from 'element-plus'
import SubredditTab from '@/components/SubredditTab.vue'
import SubmissionsTab from '@/components/SubmissionsTab.vue'
import AnalysisTab from '@/components/AnalysisTab.vue'
import MonitorsTab from '@/components/MonitorsTab.vue'

const route = useRoute()
const productId = computed(() => parseInt(route.params.id))

const product = ref(null)
const activeTab = ref('subreddits')
const regenerating = ref(false)
const tabKey = ref(0)

const fetchProduct = async () => {
  try {
    product.value = await getProduct(productId.value)
  } catch (error) {
    console.error('获取产品详情失败:', error)
  }
}

const getKeywordsByType = (type) => {
  if (!product.value?.keywords) return []
  return product.value.keywords.filter(kw => kw.type === type)
}

const handleRegenerateKeywords = async () => {
  regenerating.value = true
  try {
    await regenerateKeywords(productId.value)
    ElMessage.success('关键词重新生成成功')
    await fetchProduct()
  } catch (error) {
    console.error('重新生成关键词失败:', error)
  } finally {
    regenerating.value = false
  }
}

const handleTabChange = () => {
  // 刷新子组件
  tabKey.value++
}

onMounted(() => {
  fetchProduct()
})
</script>

<style scoped>
.product-detail-container {
  max-width: 1400px;
  margin: 0 auto;
}

.product-info-card {
  margin-bottom: 20px;
}

.product-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.info-left {
  flex: 1;
}

.info-left h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
  color: #303133;
}

.description {
  margin: 0 0 15px 0;
  color: #606266;
  line-height: 1.6;
}

.meta {
  display: flex;
  gap: 10px;
}

.meta .el-tag a {
  color: inherit;
  text-decoration: none;
}

.info-right {
  display: flex;
  gap: 10px;
}

.keywords-section h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #303133;
}

.keywords {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.keyword-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.keyword-type {
  font-weight: bold;
  margin-right: 10px;
  color: #606266;
  min-width: 60px;
}

.tabs-card {
  min-height: 500px;
}
</style>
