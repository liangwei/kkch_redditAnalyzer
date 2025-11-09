<template>
  <div id="app">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>
            <el-icon><Search /></el-icon>
            kkch Analyzer
          </h1>
          <p>关键词搜索与分析工具</p>
        </div>
      </el-header>

      <el-main>
        <!-- 搜索表单 -->
        <el-card class="search-card">
          <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
            <el-form-item label="关键词">
              <el-input
                v-model="searchForm.keyword"
                placeholder="输入搜索关键词"
                style="width: 300px"
                clearable
              />
            </el-form-item>

            <el-form-item label="Subreddit">
              <el-input
                v-model="searchForm.subreddit"
                placeholder="all（搜索全部）"
                style="width: 200px"
                clearable
              />
            </el-form-item>

            <el-form-item label="结果数量">
              <el-select v-model="searchForm.limit" style="width: 100px">
                <el-option label="25" :value="25" />
                <el-option label="50" :value="50" />
                <el-option label="100" :value="100" />
              </el-select>
            </el-form-item>

            <el-form-item label="排序">
              <el-select v-model="searchForm.sort" style="width: 120px">
                <el-option label="相关性" value="relevance" />
                <el-option label="热门" value="hot" />
                <el-option label="最新" value="new" />
                <el-option label="评论数" value="comments" />
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="loading" @click="handleSearch">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 搜索结果 -->
        <el-card v-if="searchResults.length > 0" class="results-card">
          <template #header>
            <div class="card-header">
              <span>找到 {{ searchResults.length }} 个结果</span>
            </div>
          </template>

          <el-table :data="searchResults" style="width: 100%" stripe>
            <el-table-column prop="title" label="标题" min-width="300">
              <template #default="{ row }">
                <a :href="row.permalink" target="_blank" class="post-title">
                  {{ row.title }}
                </a>
              </template>
            </el-table-column>

            <el-table-column prop="subreddit" label="Subreddit" width="150">
              <template #default="{ row }">
                <el-tag>r/{{ row.subreddit }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="author" label="作者" width="150" />

            <el-table-column prop="score" label="得分" width="100" sortable>
              <template #default="{ row }">
                <el-tag type="success">{{ row.score }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="numComments" label="评论数" width="100" sortable>
              <template #default="{ row }">
                <el-tag type="info">{{ row.numComments }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="viewPost(row)">
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 帖子详情弹窗 -->
        <el-dialog
          v-model="postDialogVisible"
          :title="currentPost.title"
          width="80%"
          top="5vh"
        >
          <el-tabs v-model="activeTab">
            <!-- 帖子内容 -->
            <el-tab-pane label="帖子内容" name="content">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="作者">{{ currentPost.author }}</el-descriptions-item>
                <el-descriptions-item label="Subreddit">
                  <el-tag>r/{{ currentPost.subreddit }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="得分">
                  <el-tag type="success">{{ currentPost.score }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="点赞率">
                  {{ (currentPost.upvoteRatio * 100).toFixed(1) }}%
                </el-descriptions-item>
                <el-descriptions-item label="评论数">
                  <el-tag type="info">{{ currentPost.numComments }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="发布时间">
                  {{ formatDate(currentPost.created) }}
                </el-descriptions-item>
              </el-descriptions>

              <div v-if="currentPost.selftext" style="margin-top: 20px">
                <h3>正文内容：</h3>
                <div class="post-content">{{ currentPost.selftext }}</div>
              </div>

              <div style="margin-top: 20px">
                <el-button type="primary" :href="currentPost.permalink" target="_blank">
                  在 Reddit 查看
                </el-button>
              </div>
            </el-tab-pane>

            <!-- 评论列表 -->
            <el-tab-pane label="评论列表" name="comments">
              <div v-loading="loadingComments">
                <div v-if="currentComments.length > 0">
                  <p>共 {{ currentComments.length }} 条评论</p>
                  <div
                    v-for="comment in currentComments"
                    :key="comment.id"
                    class="comment-item"
                    :style="{ paddingLeft: comment.depth * 20 + 'px' }"
                  >
                    <div class="comment-header">
                      <strong>{{ comment.author }}</strong>
                      <el-tag size="small" type="success">{{ comment.score }}</el-tag>
                      <span class="comment-time">{{ formatDate(comment.created) }}</span>
                    </div>
                    <div class="comment-body">{{ comment.body }}</div>
                  </div>
                </div>
                <el-empty v-else description="暂无评论" />
              </div>
            </el-tab-pane>

            <!-- 数据分析 -->
            <el-tab-pane label="数据分析" name="analysis">
              <div v-loading="loadingAnalysis">
                <div v-if="currentAnalysis">
                  <!-- 基本统计 -->
                  <el-card class="analysis-section">
                    <template #header>基本统计</template>
                    <el-row :gutter="20">
                      <el-col :span="6">
                        <el-statistic title="总评论数" :value="currentAnalysis.totalComments" />
                      </el-col>
                      <el-col :span="6">
                        <el-statistic title="帖子得分" :value="currentAnalysis.totalScore" />
                      </el-col>
                      <el-col :span="6">
                        <el-statistic
                          title="点赞率"
                          :value="(currentAnalysis.upvoteRatio * 100).toFixed(1)"
                          suffix="%"
                        />
                      </el-col>
                      <el-col :span="6">
                        <el-statistic
                          title="独立作者数"
                          :value="currentAnalysis.authorStats.uniqueAuthors"
                        />
                      </el-col>
                    </el-row>
                  </el-card>

                  <!-- 评论统计 -->
                  <el-card class="analysis-section">
                    <template #header>评论统计</template>
                    <el-row :gutter="20">
                      <el-col :span="6">
                        <el-statistic
                          title="总得分"
                          :value="currentAnalysis.commentStats.totalScore"
                        />
                      </el-col>
                      <el-col :span="6">
                        <el-statistic
                          title="平均得分"
                          :value="currentAnalysis.commentStats.avgScore"
                        />
                      </el-col>
                      <el-col :span="6">
                        <el-statistic
                          title="最高得分"
                          :value="currentAnalysis.commentStats.maxScore"
                        />
                      </el-col>
                      <el-col :span="6">
                        <el-statistic
                          title="最低得分"
                          :value="currentAnalysis.commentStats.minScore"
                        />
                      </el-col>
                    </el-row>
                  </el-card>

                  <!-- Top 作者 -->
                  <el-card class="analysis-section">
                    <template #header>最活跃作者 (Top 10)</template>
                    <el-table :data="currentAnalysis.authorStats.topAuthors" stripe>
                      <el-table-column prop="author" label="作者" />
                      <el-table-column prop="commentCount" label="评论数" sortable />
                      <el-table-column prop="totalScore" label="总得分" sortable />
                      <el-table-column prop="avgScore" label="平均得分" sortable />
                    </el-table>
                  </el-card>

                  <!-- 热门评论 -->
                  <el-card class="analysis-section">
                    <template #header>热门评论 (Top 10)</template>
                    <div
                      v-for="(comment, index) in currentAnalysis.topComments"
                      :key="index"
                      class="top-comment"
                    >
                      <div class="comment-header">
                        <strong>{{ comment.author }}</strong>
                        <el-tag type="success">{{ comment.score }}</el-tag>
                      </div>
                      <div class="comment-body">{{ comment.body }}</div>
                    </div>
                  </el-card>

                  <!-- 词频分析 -->
                  <el-card class="analysis-section">
                    <template #header>高频词汇 (Top 20)</template>
                    <el-table :data="currentAnalysis.wordFrequency" stripe>
                      <el-table-column prop="word" label="词汇" />
                      <el-table-column prop="count" label="出现次数" sortable />
                    </el-table>
                  </el-card>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-dialog>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 搜索表单
const searchForm = reactive({
  keyword: '',
  subreddit: 'all',
  limit: 50,
  sort: 'relevance'
})

// 状态
const loading = ref(false)
const searchResults = ref([])

// 帖子详情
const postDialogVisible = ref(false)
const activeTab = ref('content')
const currentPost = ref({})
const currentComments = ref([])
const currentAnalysis = ref(null)
const loadingComments = ref(false)
const loadingAnalysis = ref(false)

// 搜索
const handleSearch = async () => {
  if (!searchForm.keyword) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  loading.value = true
  try {
    const params = {
      keyword: searchForm.keyword,
      subreddit: searchForm.subreddit || 'all',
      limit: searchForm.limit,
      sort: searchForm.sort
    }

    const response = await axios.get('/api/search', { params })
    searchResults.value = response.data.posts

    ElMessage.success(`找到 ${response.data.count} 个结果`)
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error(error.response?.data?.error || '搜索失败')
  } finally {
    loading.value = false
  }
}

// 查看帖子详情
const viewPost = async (post) => {
  currentPost.value = post
  postDialogVisible.value = true
  activeTab.value = 'content'
  currentComments.value = []
  currentAnalysis.value = null

  // 加载评论（传递 post 对象）
  loadComments(post)
  // 加载分析数据（传递 post 对象）
  loadAnalysis(post)
}

// 加载评论
const loadComments = async (post) => {
  loadingComments.value = true
  try {
    const response = await axios.get(`/api/post/${post.id}`, {
      params: { permalink: post.permalink.replace('https://reddit.com', '') }
    })
    currentComments.value = response.data.comments
  } catch (error) {
    console.error('加载评论失败:', error)
    ElMessage.error('加载评论失败')
  } finally {
    loadingComments.value = false
  }
}

// 加载分析数据
const loadAnalysis = async (post) => {
  loadingAnalysis.value = true
  try {
    const response = await axios.get(`/api/analyze/${post.id}`, {
      params: { permalink: post.permalink.replace('https://reddit.com', '') }
    })
    currentAnalysis.value = response.data.analysis
  } catch (error) {
    console.error('加载分析数据失败:', error)
    ElMessage.error('加载分析数据失败')
  } finally {
    loadingAnalysis.value = false
  }
}

// 格式化日期
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}
</script>

<style scoped>
#app {
  min-height: 100vh;
  background: #f5f5f5;
}

.el-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  height: 90px;
  justify-content: center;
}

.header-content {
  text-align: center;
}

.header-content h1 {
  margin: 0;
  font-size: 32px;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.header-content p {
  margin: 5px 0 0 0;
  opacity: 0.9;
}

.el-main {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.search-card {
  margin-bottom: 20px;
}

.results-card {
  margin-top: 20px;
}

.post-title {
  color: #409eff;
  text-decoration: none;
}

.post-title:hover {
  text-decoration: underline;
}

.post-content {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  white-space: pre-wrap;
  line-height: 1.6;
}

.comment-item {
  border-left: 2px solid #e0e0e0;
  padding: 10px;
  margin-bottom: 10px;
  background: #fafafa;
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
}

.analysis-section {
  margin-bottom: 20px;
}

.top-comment {
  border: 1px solid #e0e0e0;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 4px;
  background: #fafafa;
}
</style>
