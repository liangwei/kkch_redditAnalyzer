import request from './request'

// ========== Reddit凭证管理 ==========

/**
 * 创建Reddit凭证
 */
export function createCredential(data) {
  return request({
    url: '/reddit/credentials/create',
    method: 'post',
    data
  })
}

/**
 * 获取凭证列表
 */
export function getCredentials() {
  return request({
    url: '/reddit/credentials/info',
    method: 'get'
  })
}

/**
 * 测试凭证
 */
export function testCredential(credentialId) {
  return request({
    url: `/reddit/credentials/${credentialId}/test`,
    method: 'post'
  })
}

/**
 * 设为默认凭证
 */
export function setDefaultCredential(credentialId) {
  return request({
    url: `/reddit/credentials/${credentialId}/set-default`,
    method: 'post'
  })
}

// ========== 产品管理 ==========

/**
 * 创建产品
 */
export function createProduct(data) {
  return request({
    url: '/reddit/products/create',
    method: 'post',
    data
  })
}

/**
 * 获取产品列表
 */
export function getProducts(params) {
  return request({
    url: '/reddit/products/list',
    method: 'get',
    params
  })
}

/**
 * 获取产品详情
 */
export function getProduct(productId) {
  return request({
    url: `/reddit/products/info/${productId}`,
    method: 'get'
  })
}

/**
 * 重新生成关键词
 */
export function regenerateKeywords(productId) {
  return request({
    url: `/reddit/products/${productId}/regenerate-keywords`,
    method: 'post'
  })
}

// ========== Subreddit管理 ==========

/**
 * 搜索Subreddit
 */
export function searchSubreddits(data) {
  return request({
    url: '/reddit/subreddits/search',
    method: 'post',
    data
  })
}

/**
 * 获取产品的Subreddit列表
 */
export function getSubreddits(params) {
  return request({
    url: '/reddit/subreddits/list',
    method: 'get',
    params
  })
}

// ========== Submission管理 ==========

/**
 * 收集submissions和评论
 */
export function collectSubmissions(data) {
  return request({
    url: '/reddit/submissions/collect',
    method: 'post',
    data
  })
}

/**
 * 获取submission列表
 */
export function getSubmissions(params) {
  return request({
    url: '/reddit/submissions/list',
    method: 'get',
    params
  })
}

/**
 * 获取submission详情（含评论）
 */
export function getSubmission(submissionId) {
  return request({
    url: `/reddit/submissions/info/${submissionId}`,
    method: 'get'
  })
}

// ========== 舆情分析 ==========

/**
 * 生成舆情分析
 */
export function generateAnalysis(data) {
  return request({
    url: '/reddit/analysis/generate',
    method: 'post',
    data
  })
}

/**
 * 获取舆情分析列表
 */
export function getAnalysisList(params) {
  return request({
    url: '/reddit/analysis/list',
    method: 'get',
    params
  })
}

/**
 * 获取舆情统计
 */
export function getAnalysisStats(params) {
  return request({
    url: '/reddit/analysis/stats',
    method: 'get',
    params
  })
}

// ========== 监控任务 ==========

/**
 * 创建监控任务
 */
export function createMonitor(data) {
  return request({
    url: '/reddit/monitors',
    method: 'post',
    data
  })
}

/**
 * 获取监控任务列表
 */
export function getMonitors(params) {
  return request({
    url: '/reddit/monitors',
    method: 'get',
    params
  })
}

/**
 * 获取监控任务详情
 */
export function getMonitor(monitorId) {
  return request({
    url: `/reddit/monitors/${monitorId}`,
    method: 'get'
  })
}

/**
 * 启用/暂停监控
 */
export function toggleMonitor(monitorId) {
  return request({
    url: `/reddit/monitors/${monitorId}/toggle`,
    method: 'post'
  })
}

/**
 * 立即执行监控
 */
export function runMonitorNow(monitorId) {
  return request({
    url: `/reddit/monitors/${monitorId}/run-now`,
    method: 'post'
  })
}

/**
 * 获取监控日志
 */
export function getMonitorLogs(monitorId, params) {
  return request({
    url: `/reddit/monitors/${monitorId}/logs`,
    method: 'get',
    params
  })
}
