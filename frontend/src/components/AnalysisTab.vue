<template>
  <div class="analysis-tab">
    <el-alert
      title="提示"
      type="info"
      :closable="false"
      style="margin-bottom: 20px"
    >
      系统将使用 AI 分析收集的帖子和评论，识别情感（正面/负面/中性）和意图（Bug报告/功能建议/新手提问等）。
    </el-alert>

    <!-- 操作面板 -->
    <el-card class="action-panel" shadow="never">
      <el-form :inline="true">
        <el-form-item label="时间范围">
          <el-select v-model="timeRange" style="width: 150px">
            <el-option label="最近 1 个月" :value="30" />
            <el-option label="最近 3 个月" :value="90" />
            <el-option label="最近 6 个月" :value="180" />
            <el-option label="最近 1 年" :value="365" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="generating" @click="handleGenerate">
            <el-icon><DataAnalysis /></el-icon>
            生成分析报告
          </el-button>
          <el-button @click="fetchStats">
            <el-icon><Refresh /></el-icon>
            刷新统计
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>情感分布</span>
          </template>
          <div ref="sentimentChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>意图分布</span>
          </template>
          <div ref="intentChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 分析列表 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <span>分析详情</span>
      </template>

      <el-table v-loading="loading" :data="analysisList" stripe>
        <el-table-column label="目标类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">
              {{ row.target_type === 'submission' ? '帖子' : '评论' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="情感" width="100">
          <template #default="{ row }">
            <el-tag
              :type="
                row.sentiment === 'Positive'
                  ? 'success'
                  : row.sentiment === 'Negative'
                  ? 'danger'
                  : 'info'
              "
            >
              {{ getSentimentLabel(row.sentiment) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="意图" width="150">
          <template #default="{ row }">
            <el-tag type="warning" size="small">
              {{ getIntentLabel(row.intent) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="summary" label="摘要" min-width="400" show-overflow-tooltip />

        <el-table-column label="置信度" width="100">
          <template #default="{ row }">
            <span v-if="row.confidence_score">
              {{ (parseFloat(row.confidence_score) * 100).toFixed(0) }}%
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="ctime" label="分析时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.ctime) }}
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 20px; justify-content: flex-end"
        @current-change="fetchAnalysisList"
        @size-change="fetchAnalysisList"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { generateAnalysis, getAnalysisList, getAnalysisStats } from '@/api/reddit'
import { ElMessage } from 'element-plus'

const props = defineProps({
  productId: {
    type: Number,
    required: true
  }
})

const timeRange = ref(90)
const generating = ref(false)
const loading = ref(false)

const sentimentChartRef = ref(null)
const intentChartRef = ref(null)
let sentimentChart = null
let intentChart = null

const stats = ref(null)
const analysisList = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const fetchStats = async () => {
  try {
    const res = await getAnalysisStats({ product_id: props.productId })
    stats.value = res
    renderCharts()
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const fetchAnalysisList = async () => {
  loading.value = true
  try {
    const res = await getAnalysisList({
      product_id: props.productId,
      limit: pageSize.value,
      offset: (page.value - 1) * pageSize.value
    })
    analysisList.value = res.items
    total.value = res.total
  } catch (error) {
    console.error('获取分析列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleGenerate = async () => {
  generating.value = true
  try {
    await generateAnalysis({
      product_id: props.productId,
      time_range: timeRange.value,
      force_reanalyze: false
    })
    ElMessage.success('分析任务已开始，请稍后刷新查看')
    setTimeout(() => {
      fetchStats()
      fetchAnalysisList()
    }, 3000)
  } catch (error) {
    console.error('生成分析失败:', error)
  } finally {
    generating.value = false
  }
}

const renderCharts = () => {
  if (!stats.value) return

  nextTick(() => {
    // 情感分布图
    if (sentimentChartRef.value) {
      if (!sentimentChart) {
        sentimentChart = echarts.init(sentimentChartRef.value)
      }
      const sentimentData = Object.entries(stats.value.sentiment_distribution || {}).map(
        ([key, value]) => ({
          name: getSentimentLabel(key),
          value
        })
      )
      sentimentChart.setOption({
        tooltip: {
          trigger: 'item'
        },
        legend: {
          bottom: '0%',
          left: 'center'
        },
        series: [
          {
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 20,
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: sentimentData,
            color: ['#67C23A', '#F56C6C', '#909399']
          }
        ]
      })
    }

    // 意图分布图
    if (intentChartRef.value) {
      if (!intentChart) {
        intentChart = echarts.init(intentChartRef.value)
      }
      const intentData = Object.entries(stats.value.intent_distribution || {}).map(
        ([key, value]) => ({
          name: getIntentLabel(key),
          value
        })
      )
      intentChart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        xAxis: {
          type: 'category',
          data: intentData.map((item) => item.name),
          axisLabel: {
            interval: 0,
            rotate: 30,
            fontSize: 11
          }
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            type: 'bar',
            data: intentData.map((item) => item.value),
            itemStyle: {
              color: '#409EFF'
            }
          }
        ]
      })
    }
  })
}

const getSentimentLabel = (sentiment) => {
  const map = {
    Positive: '正面',
    Negative: '负面',
    Neutral: '中性'
  }
  return map[sentiment] || sentiment
}

const getIntentLabel = (intent) => {
  const map = {
    'Bug Report': 'Bug报告',
    'Customer Service Issue': '客服问题',
    'Feature Request': '功能建议',
    'Positive Showcase': '正面晒图',
    'Newbie Question': '新手提问',
    'Competitor Comparison': '竞品对比'
  }
  return map[intent] || intent
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchStats()
  fetchAnalysisList()
})
</script>

<style scoped>
.analysis-tab {
}

.action-panel {
  background: #f5f7fa;
}
</style>
