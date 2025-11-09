# Reddit Analyzer - Reddit 关键词搜索与分析工具

基于 Node.js + Vite + Vue 3 的 Reddit 数据搜索和分析工具。

## 功能特点

✅ **关键词搜索** - 支持在指定 subreddit 中搜索关键词
✅ **帖子详情** - 查看帖子完整内容和所有评论
✅ **数据分析** - 自动分析帖子数据，包括：
  - 评论统计（总数、平均分、最高/最低分）
  - 作者活跃度排行
  - 热门评论 Top 10
  - 高频词汇分析
  - 时间分布统计

✅ **美观的 UI** - 基于 Element Plus 的现代化界面

## 项目结构

```
reddit-analyzer/
├── backend/              # Node.js 后端
│   ├── server.js        # Express 服务器
│   ├── package.json
│   └── .env.example     # 环境变量模板
└── frontend/            # Vite + Vue 前端
    ├── src/
    │   ├── App.vue      # 主应用组件
    │   └── main.js      # 入口文件
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 快速开始

### 1. 获取 Reddit API 凭证

1. 访问 https://www.reddit.com/prefs/apps
2. 点击 "create app" 或 "create another app"
3. 填写信息：
   - **name**: Reddit Analyzer
   - **app type**: 选择 `script`
   - **description**: 随意填写
   - **redirect uri**: `http://localhost:8080`
4. 创建后，获取 `client_id`（在应用名称下方）和 `client_secret`

### 2. 配置后端

```bash
cd backend

# 安装依赖
npm install

# 复制环境变量模板
copy .env.example .env

# 编辑 .env 文件，填入你的 Reddit API 凭证
# REDDIT_CLIENT_ID=你的client_id
# REDDIT_CLIENT_SECRET=你的client_secret
# REDDIT_USER_AGENT=RedditAnalyzer/1.0 by YourUsername
```

### 3. 配置前端

```bash
cd frontend

# 安装依赖
npm install
```

### 4. 启动项目

**启动后端服务器（端口 3000）：**
```bash
cd backend
npm run dev
```

**启动前端开发服务器（端口 5173）：**
```bash
cd frontend
npm run dev
```

### 5. 访问应用

打开浏览器访问：http://localhost:5173

## API 接口文档

### 1. 搜索关键词
```
GET /api/search?keyword=xxx&subreddit=all&limit=50&sort=relevance
```

**参数：**
- `keyword` - 搜索关键词（必填）
- `subreddit` - 目标 subreddit，默认 `all`
- `limit` - 结果数量，默认 50
- `sort` - 排序方式：`relevance`, `hot`, `new`, `comments`
- `time` - 时间范围：`hour`, `day`, `week`, `month`, `year`, `all`

**响应示例：**
```json
{
  "keyword": "javascript",
  "subreddit": "programming",
  "count": 50,
  "posts": [
    {
      "id": "abc123",
      "title": "Post Title",
      "author": "username",
      "subreddit": "programming",
      "score": 1234,
      "numComments": 56,
      "created": "2024-01-01T00:00:00.000Z",
      "permalink": "https://reddit.com/r/...",
      ...
    }
  ]
}
```

### 2. 获取帖子详情和评论
```
GET /api/post/:postId
```

**响应示例：**
```json
{
  "post": { ... },
  "comments": [
    {
      "id": "xyz",
      "author": "username",
      "body": "Comment text",
      "score": 10,
      "depth": 0,
      ...
    }
  ],
  "commentCount": 100
}
```

### 3. 分析帖子数据
```
GET /api/analyze/:postId
```

**响应示例：**
```json
{
  "postId": "abc123",
  "postTitle": "Post Title",
  "analysis": {
    "totalComments": 100,
    "totalScore": 1234,
    "commentStats": { ... },
    "authorStats": { ... },
    "topComments": [ ... ],
    "wordFrequency": [ ... ]
  }
}
```

## 使用示例

### 1. 搜索特定主题的帖子
- 关键词：`artificial intelligence`
- Subreddit：`MachineLearning`
- 结果数量：50
- 排序：相关性

### 2. 监控热门讨论
- 关键词：`ChatGPT`
- Subreddit：`all`
- 排序：热门

### 3. 分析用户反馈
- 搜索产品名称
- 查看评论情感
- 分析高频词汇

## 技术栈

**后端：**
- Node.js + Express
- Snoowrap (Reddit API 封装)
- CORS、dotenv

**前端：**
- Vue 3 (Composition API)
- Vite
- Element Plus (UI 组件库)
- Axios (HTTP 客户端)

## 注意事项

1. **API 速率限制**
   - OAuth 认证：60 请求/分钟
   - 请合理控制请求频率

2. **Reddit 规则**
   - 遵守 Reddit API 使用条款
   - 不要发送垃圾请求
   - 合理的 User-Agent

3. **隐私安全**
   - 不要将 `.env` 文件提交到 Git
   - 妥善保管 API 凭证

## 常见问题

**Q: 搜索失败，提示 401 错误？**
A: 检查 `.env` 文件中的 `REDDIT_CLIENT_ID` 和 `REDDIT_CLIENT_SECRET` 是否正确。

**Q: 为什么有些评论加载不出来？**
A: Reddit API 对嵌套评论有限制，深度过深或数量过多的评论可能需要额外请求。

**Q: 可以搜索中文内容吗？**
A: 可以，但 Reddit 上中文内容较少，建议搜索英文关键词。

## 后续扩展

- [ ] 添加数据可视化图表
- [ ] 支持导出分析报告
- [ ] 添加情感分析功能
- [ ] 支持多关键词组合搜索
- [ ] 添加实时监控和通知功能

## 许可证

MIT License
