<template>
  <div class="submissions-tab">
    <el-alert
      title="提示"
      type="info"
      :closable="false"
      style="margin-bottom: 20px"
    >
      选择要收集数据的 Subreddit 和时间范围，系统将收集相关的帖子和评论。
    </el-alert>

    <!-- 收集控制面板 -->
    <el-card class="collect-panel" shadow="never">
      <el-form :inline="true" @submit.prevent="handleCollect">
        <el-form-item label="选择频道">
          <el-select
            v-model="selectedSubreddits"
            multiple
            placeholder="请选择 Subreddit"
            style="width: 400px"
            :loading="loadingSubreddits"
          >
            <el-option
              v-for="item in subreddits"
              :key="item.id"
              :label="`r/${item.subreddit_name}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="时间范围">
          <el-select v-model="timeRange" style="width: 150px">
            <el-option label="最近 1 个月" :value="30" />
            <el-option label="最近 3 个月" :value="90" />
            <el-option label="最近 6 个月" :value="180" />
            <el-option label="最近 1 年" :value="365" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="collecting" @click="handleCollect">
            <el-icon><Download /></el-icon>
            开始收集
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 帖子列表 -->
    <el-table
      v-loading="loading"
      :data="submissions"
      stripe
      style="margin-top: 20px"
      @row-click="handleRowClick"
    >
      <el-table-column prop="title" label="标题" min-width="400" show-overflow-tooltip />

      <el-table-column label="Subreddit" width="150">
        <template #default="{ row }">
          <el-tag size="small">r/{{ getSubredditName(row.subreddit_id) }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="author" label="作者" width="150" show-overflow-tooltip />

      <el-table-column label="得分" width="100" sortable>
        <template #default="{ row }">
          <el-tag type="success">{{ row.score }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="created_at" label="发布时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click.stop="viewDetail(row)">
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
      @current-change="fetchSubmissions"
      @size-change="fetchSubmissions"
    />

    <!-- 帖子详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="currentSubmission?.title"
      width="80%"
      top="5vh"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="作者">
          {{ currentSubmission?.author || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="得分">
          <el-tag type="success">{{ currentSubmission?.score }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发布时间" :span="2">
          {{ formatDate(currentSubmission?.created_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="链接" :span="2">
          <a v-if="currentSubmission?.url" :href="currentSubmission.url" target="_blank">
            {{ currentSubmission.url }}
          </a>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="currentSubmission?.content" style="margin-top: 20px">
        <h3>帖子内容：</h3>
        <div class="content-box">{{ currentSubmission.content }}</div>
      </div>

      <el-divider />

      <div v-loading="loadingComments">
        <h3>评论 ({{ comments.length }})</h3>
        <div v-if="comments.length > 0" class="comments-list">
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="comment-item"
          >
            <div class="comment-header">
              <strong>{{ comment.author || '[deleted]' }}</strong>
              <el-tag size="small" type="success">{{ comment.score }}</el-tag>
              <span class="comment-time">{{ formatDate(comment.created_at) }}</span>
            </div>
            <div class="comment-body">{{ comment.content }}</div>
          </div>
        </div>
        <el-empty v-else description="暂无评论" :image-size="60" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  getSubreddits,
  getSubmissions,
  getSubmission,
  collectSubmissions
} from '@/api/reddit'
import { ElMessage } from 'element-plus'

const props = defineProps({
  productId: {
    type: Number,
    required: true
  }
})

const loadingSubreddits = ref(false)
const subreddits = ref([])
const selectedSubreddits = ref([])
const timeRange = ref(90) // 默认3个月
const collecting = ref(false)

const loading = ref(false)
const submissions = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const detailDialogVisible = ref(false)
const currentSubmission = ref(null)
const loadingComments = ref(false)
const comments = ref([])

const fetchSubreddits = async () => {
  loadingSubreddits.value = true
  try {
    const res = await getSubreddits({ product_id: props.productId })
    subreddits.value = res.items
  } catch (error) {
    console.error('获取 Subreddit 列表失败:', error)
  } finally {
    loadingSubreddits.value = false
  }
}

const fetchSubmissions = async () => {
  loading.value = true
  try {
    const res = await getSubmissions({
      product_id: props.productId,
      limit: pageSize.value,
      offset: (page.value - 1) * pageSize.value
    })
    submissions.value = res.items
    total.value = res.total
  } catch (error) {
    console.error('获取帖子列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleCollect = async () => {
  if (selectedSubreddits.value.length === 0) {
    ElMessage.warning('请至少选择一个 Subreddit')
    return
  }

  collecting.value = true
  try {
    await collectSubmissions({
      product_id: props.productId,
      subreddit_ids: selectedSubreddits.value,
      time_range: timeRange.value
    })
    ElMessage.success('数据收集已开始，请稍后刷新查看')
    setTimeout(() => {
      fetchSubmissions()
    }, 2000)
  } catch (error) {
    console.error('收集数据失败:', error)
  } finally {
    collecting.value = false
  }
}

const viewDetail = async (row) => {
  currentSubmission.value = row
  detailDialogVisible.value = true

  loadingComments.value = true
  try {
    const res = await getSubmission(row.id)
    comments.value = res.comments
  } catch (error) {
    console.error('获取评论失败:', error)
  } finally {
    loadingComments.value = false
  }
}

const handleRowClick = (row) => {
  viewDetail(row)
}

const getSubredditName = (subredditId) => {
  const subreddit = subreddits.value.find((s) => s.id === subredditId)
  return subreddit?.subreddit_name || ''
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchSubreddits()
  fetchSubmissions()
})
</script>

<style scoped>
.submissions-tab {
}

.collect-panel {
  background: #f5f7fa;
}

:deep(.el-table__row) {
  cursor: pointer;
}

.content-box {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  white-space: pre-wrap;
  line-height: 1.6;
  max-height: 400px;
  overflow-y: auto;
}

.comments-list {
  max-height: 600px;
  overflow-y: auto;
}

.comment-item {
  border-left: 2px solid #e0e0e0;
  padding: 12px;
  margin-bottom: 12px;
  background: #fafafa;
  border-radius: 4px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.comment-time {
  color: #999;
  font-size: 12px;
}

.comment-body {
  line-height: 1.6;
  white-space: pre-wrap;
  color: #606266;
}
</style>
