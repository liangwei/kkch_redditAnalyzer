<template>
  <div class="monitors-tab">
    <el-alert
      title="提示"
      type="info"
      :closable="false"
      style="margin-bottom: 20px"
    >
      创建监控任务后，系统将定期自动收集新的帖子和评论数据。
    </el-alert>

    <div class="actions">
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon>
        创建监控任务
      </el-button>
    </div>

    <!-- 监控任务列表 -->
    <el-table v-loading="loading" :data="monitors" stripe style="margin-top: 20px">
      <el-table-column prop="name" label="任务名称" min-width="200" />

      <el-table-column label="监控频道" min-width="250">
        <template #default="{ row }">
          <el-tag
            v-for="id in row.subreddit_ids.slice(0, 3)"
            :key="id"
            size="small"
            style="margin-right: 5px"
          >
            r/{{ getSubredditName(id) }}
          </el-tag>
          <span v-if="row.subreddit_ids.length > 3">
            +{{ row.subreddit_ids.length - 3 }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="调度类型" width="120">
        <template #default="{ row }">
          <el-tag type="info">
            {{ getScheduleLabel(row.schedule_type) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="last_run_at" label="上次运行" width="180">
        <template #default="{ row }">
          {{ formatDate(row.last_run_at) }}
        </template>
      </el-table-column>

      <el-table-column prop="next_run_at" label="下次运行" width="180">
        <template #default="{ row }">
          {{ formatDate(row.next_run_at) }}
        </template>
      </el-table-column>

      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.status === 1" type="success">运行中</el-tag>
          <el-tag v-else type="info">已暂停</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="250" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="handleToggle(row)">
            {{ row.status === 1 ? '暂停' : '启用' }}
          </el-button>
          <el-button size="small" type="primary" @click="handleRunNow(row)">
            立即执行
          </el-button>
          <el-button size="small" @click="viewLogs(row)">
            查看日志
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 创建监控对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="创建监控任务"
      width="600px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="form.name" placeholder="为监控任务命名" />
        </el-form-item>

        <el-form-item label="监控频道" prop="subreddit_ids">
          <el-select
            v-model="form.subreddit_ids"
            multiple
            placeholder="选择要监控的 Subreddit"
            style="width: 100%"
          >
            <el-option
              v-for="item in subreddits"
              :key="item.id"
              :label="`r/${item.subreddit_name}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="时间范围" prop="time_range">
          <el-select v-model="form.time_range" style="width: 100%">
            <el-option label="最近 1 天" :value="1" />
            <el-option label="最近 3 天" :value="3" />
            <el-option label="最近 7 天" :value="7" />
            <el-option label="最近 30 天" :value="30" />
          </el-select>
        </el-form-item>

        <el-form-item label="执行频率" prop="schedule_type">
          <el-select v-model="form.schedule_type" style="width: 100%">
            <el-option label="每小时" value="hourly" />
            <el-option label="每天" value="daily" />
            <el-option label="每周" value="weekly" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreate">
          创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 日志对话框 -->
    <el-dialog v-model="logsDialogVisible" title="执行日志" width="800px">
      <el-table v-loading="loadingLogs" :data="logs" stripe>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="
                row.execution_status === 'success'
                  ? 'success'
                  : row.execution_status === 'failed'
                  ? 'danger'
                  : 'info'
              "
            >
              {{ row.execution_status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="新帖子" width="100">
          <template #default="{ row }">
            {{ row.new_submissions_count }}
          </template>
        </el-table-column>

        <el-table-column label="新评论" width="100">
          <template #default="{ row }">
            {{ row.new_comments_count }}
          </template>
        </el-table-column>

        <el-table-column prop="error_message" label="错误信息" min-width="200" show-overflow-tooltip />

        <el-table-column prop="start_time" label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.start_time) }}
          </template>
        </el-table-column>

        <el-table-column prop="end_time" label="结束时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.end_time) }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import {
  getMonitors,
  createMonitor,
  toggleMonitor,
  runMonitorNow,
  getMonitorLogs,
  getSubreddits
} from '@/api/reddit'
import { ElMessage } from 'element-plus'

const props = defineProps({
  productId: {
    type: Number,
    required: true
  }
})

const loading = ref(false)
const monitors = ref([])
const subreddits = ref([])

const createDialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  name: '',
  subreddit_ids: [],
  time_range: 7,
  schedule_type: 'daily'
})

const rules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  subreddit_ids: [
    {
      type: 'array',
      required: true,
      message: '请选择至少一个 Subreddit',
      trigger: 'change'
    }
  ]
}

const logsDialogVisible = ref(false)
const loadingLogs = ref(false)
const logs = ref([])
const currentMonitor = ref(null)

const fetchMonitors = async () => {
  loading.value = true
  try {
    const res = await getMonitors({ product_id: props.productId })
    monitors.value = res.items
  } catch (error) {
    console.error('获取监控任务失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchSubreddits = async () => {
  try {
    const res = await getSubreddits({ product_id: props.productId })
    subreddits.value = res.items
  } catch (error) {
    console.error('获取 Subreddit 列表失败:', error)
  }
}

const showCreateDialog = () => {
  createDialogVisible.value = true
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(form, {
    name: '',
    subreddit_ids: [],
    time_range: 7,
    schedule_type: 'daily'
  })
}

const handleCreate = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    await createMonitor({
      product_id: props.productId,
      ...form
    })

    ElMessage.success('监控任务创建成功')
    createDialogVisible.value = false
    fetchMonitors()
  } catch (error) {
    console.error('创建监控任务失败:', error)
  } finally {
    submitting.value = false
  }
}

const handleToggle = async (row) => {
  try {
    await toggleMonitor(row.id)
    ElMessage.success(row.status === 1 ? '已暂停监控' : '已启用监控')
    fetchMonitors()
  } catch (error) {
    console.error('切换监控状态失败:', error)
  }
}

const handleRunNow = async (row) => {
  try {
    await runMonitorNow(row.id)
    ElMessage.success('监控任务已开始执行')
  } catch (error) {
    console.error('执行监控任务失败:', error)
  }
}

const viewLogs = async (row) => {
  currentMonitor.value = row
  logsDialogVisible.value = true
  loadingLogs.value = true

  try {
    const res = await getMonitorLogs(row.id, { limit: 50 })
    logs.value = res.items
  } catch (error) {
    console.error('获取监控日志失败:', error)
  } finally {
    loadingLogs.value = false
  }
}

const getSubredditName = (id) => {
  const subreddit = subreddits.value.find((s) => s.id === id)
  return subreddit?.subreddit_name || ''
}

const getScheduleLabel = (type) => {
  const map = {
    hourly: '每小时',
    daily: '每天',
    weekly: '每周'
  }
  return map[type] || type
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchMonitors()
  fetchSubreddits()
})
</script>

<style scoped>
.monitors-tab {
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
