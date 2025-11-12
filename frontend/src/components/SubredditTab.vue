<template>
  <div class="subreddit-tab">
    <el-alert
      title="提示"
      type="info"
      :closable="false"
      style="margin-bottom: 20px"
    >
      点击"搜索 Subreddit"按钮，系统将基于产品关键词自动搜索相关的 Reddit 频道。
    </el-alert>

    <div class="actions">
      <el-button type="primary" :loading="searching" @click="handleSearch">
        <el-icon><Search /></el-icon>
        搜索 Subreddit
      </el-button>
      <el-input
        v-model="searchKeyword"
        placeholder="筛选 Subreddit 名称"
        style="width: 300px"
        clearable
        @input="filterSubreddits"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <el-table
      v-loading="loading"
      :data="filteredSubreddits"
      stripe
      style="margin-top: 20px"
    >
      <el-table-column prop="subreddit_name" label="Subreddit" min-width="180">
        <template #default="{ row }">
          <a
            :href="`https://reddit.com/r/${row.subreddit_name}`"
            target="_blank"
            class="subreddit-link"
          >
            r/{{ row.subreddit_name }}
          </a>
        </template>
      </el-table-column>

      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="description" label="描述" min-width="300" show-overflow-tooltip />

      <el-table-column label="订阅数" width="120" sortable>
        <template #default="{ row }">
          {{ formatNumber(row.subscribers) }}
        </template>
      </el-table-column>

      <el-table-column label="相关度" width="100" sortable>
        <template #default="{ row }">
          <el-tag v-if="row.relevance_score" type="success">
            {{ (parseFloat(row.relevance_score) * 100).toFixed(0) }}%
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="created_utc" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.created_utc) }}
        </template>
      </el-table-column>
    </el-table>

    <div v-if="total > 0" class="summary">
      共找到 {{ total }} 个相关 Subreddit
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { searchSubreddits, getSubreddits } from '@/api/reddit'
import { ElMessage } from 'element-plus'

const props = defineProps({
  productId: {
    type: Number,
    required: true
  }
})

const loading = ref(false)
const searching = ref(false)
const subreddits = ref([])
const filteredSubreddits = ref([])
const searchKeyword = ref('')
const total = ref(0)

const fetchSubreddits = async () => {
  loading.value = true
  try {
    const res = await getSubreddits({ product_id: props.productId })
    subreddits.value = res.items
    filteredSubreddits.value = res.items
    total.value = res.total
  } catch (error) {
    console.error('获取 Subreddit 列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  searching.value = true
  try {
    const res = await searchSubreddits({
      product_id: props.productId,
      limit: 25
    })
    ElMessage.success(`搜索完成，找到 ${res.total} 个相关 Subreddit`)
    await fetchSubreddits()
  } catch (error) {
    console.error('搜索 Subreddit 失败:', error)
  } finally {
    searching.value = false
  }
}

const filterSubreddits = () => {
  if (!searchKeyword.value) {
    filteredSubreddits.value = subreddits.value
  } else {
    const keyword = searchKeyword.value.toLowerCase()
    filteredSubreddits.value = subreddits.value.filter(
      (item) =>
        item.subreddit_name.toLowerCase().includes(keyword) ||
        item.title?.toLowerCase().includes(keyword) ||
        item.description?.toLowerCase().includes(keyword)
    )
  }
}

const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchSubreddits()
})
</script>

<style scoped>
.subreddit-tab {
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.subreddit-link {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
}

.subreddit-link:hover {
  text-decoration: underline;
}

.summary {
  margin-top: 15px;
  text-align: right;
  color: #909399;
  font-size: 14px;
}
</style>
