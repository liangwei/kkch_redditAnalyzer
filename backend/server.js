require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 配置 axios 实例用于访问 Reddit API
const redditApi = axios.create({
  baseURL: 'https://www.reddit.com',
  headers: {
    'User-Agent': process.env.REDDIT_USER_AGENT || 'RedditAnalyzer/1.0'
  }
});

/**
 * API: 搜索关键词
 * GET /api/search?keyword=xxx&subreddit=xxx&limit=50
 */
app.get('/api/search', async (req, res) => {
  try {
    const { keyword, subreddit = 'all', limit = 50, sort = 'relevance', time = 'all' } = req.query;

    if (!keyword) {
      return res.status(400).json({ error: '请提供搜索关键词' });
    }

    console.log(`搜索关键词: "${keyword}" 在 r/${subreddit}`);

    // 使用 Reddit JSON API 搜索
    const response = await redditApi.get(`/r/${subreddit}/search.json`, {
      params: {
        q: keyword,
        sort: sort,
        t: time,
        limit: parseInt(limit),
        restrict_sr: subreddit !== 'all' // 限制在指定 subreddit
      }
    });

    // 提取帖子数据
    const posts = response.data.data.children.map(child => {
      const post = child.data;
      return {
        id: post.id,
        title: post.title,
        author: post.author || '[deleted]',
        subreddit: post.subreddit,
        score: post.score || 0,
        upvoteRatio: post.upvote_ratio || 0,
        numComments: post.num_comments || 0,
        created: new Date(post.created_utc * 1000).toISOString(),
        url: post.url || '',
        permalink: `https://reddit.com${post.permalink}`,
        selftext: post.selftext || '',
        thumbnail: post.thumbnail || '',
        isVideo: post.is_video || false
      };
    });

    res.json({
      keyword,
      subreddit,
      count: posts.length,
      posts
    });

  } catch (error) {
    console.error('搜索错误:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * API: 获取帖子详情和评论
 * GET /api/post/:postId?permalink=/r/xxx/comments/xxx
 */
app.get('/api/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { permalink } = req.query;

    if (!permalink) {
      return res.status(400).json({ error: '需要提供 permalink 参数' });
    }

    console.log(`获取帖子详情: ${postId}`);

    // 使用 Reddit JSON API 获取帖子和评论
    const response = await redditApi.get(`${permalink}.json`);

    const postData = response.data[0].data.children[0].data;
    const commentsData = response.data[1].data.children;

    // 递归提取评论
    const extractComments = (commentList, depth = 0) => {
      let comments = [];

      for (const item of commentList) {
        if (item.kind === 't1') { // t1 = comment
          const comment = item.data;

          comments.push({
            id: comment.id,
            author: comment.author || '[deleted]',
            body: comment.body || '[deleted]',
            score: comment.score || 0,
            created: new Date(comment.created_utc * 1000).toISOString(),
            depth: depth,
            isSubmitter: comment.is_submitter || false,
            permalink: `https://reddit.com${comment.permalink}`
          });

          // 递归处理回复
          if (comment.replies && comment.replies.data && comment.replies.data.children) {
            comments = comments.concat(extractComments(comment.replies.data.children, depth + 1));
          }
        }
      }

      return comments;
    };

    const comments = extractComments(commentsData);

    res.json({
      post: {
        id: postData.id,
        title: postData.title,
        author: postData.author || '[deleted]',
        subreddit: postData.subreddit,
        score: postData.score || 0,
        upvoteRatio: postData.upvote_ratio || 0,
        numComments: postData.num_comments || 0,
        created: new Date(postData.created_utc * 1000).toISOString(),
        url: postData.url || '',
        permalink: `https://reddit.com${postData.permalink}`,
        selftext: postData.selftext || ''
      },
      comments,
      commentCount: comments.length
    });

  } catch (error) {
    console.error('获取帖子错误:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * API: 分析帖子和评论
 * GET /api/analyze/:postId?permalink=/r/xxx/comments/xxx
 */
app.get('/api/analyze/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { permalink } = req.query;

    if (!permalink) {
      return res.status(400).json({ error: '需要提供 permalink 参数' });
    }

    console.log(`分析帖子: ${postId}`);

    // 获取帖子和评论
    const response = await redditApi.get(`${permalink}.json?limit=500`);
    const postData = response.data[0].data.children[0].data;
    const commentsData = response.data[1].data.children;

    // 提取所有评论（扁平化）
    const extractComments = (commentList) => {
      let comments = [];

      for (const item of commentList) {
        if (item.kind === 't1') {
          const comment = item.data;
          comments.push(comment);

          if (comment.replies && comment.replies.data && comment.replies.data.children) {
            comments = comments.concat(extractComments(comment.replies.data.children));
          }
        }
      }

      return comments;
    };

    const comments = extractComments(commentsData);

    // 分析数据
    const analysis = {
      totalComments: comments.length,
      totalScore: postData.score || 0,
      upvoteRatio: postData.upvote_ratio || 0,

      commentStats: {
        totalScore: comments.reduce((sum, c) => sum + (c.score || 0), 0),
        avgScore: comments.length > 0
          ? (comments.reduce((sum, c) => sum + (c.score || 0), 0) / comments.length).toFixed(2)
          : 0,
        maxScore: comments.length > 0 ? Math.max(...comments.map(c => c.score || 0)) : 0,
        minScore: comments.length > 0 ? Math.min(...comments.map(c => c.score || 0)) : 0
      },

      authorStats: (() => {
        const authorMap = {};
        comments.forEach(c => {
          const author = c.author || '[deleted]';
          if (!authorMap[author]) {
            authorMap[author] = { count: 0, totalScore: 0 };
          }
          authorMap[author].count++;
          authorMap[author].totalScore += c.score || 0;
        });

        const topAuthors = Object.entries(authorMap)
          .map(([author, stats]) => ({
            author,
            commentCount: stats.count,
            totalScore: stats.totalScore,
            avgScore: (stats.totalScore / stats.count).toFixed(2)
          }))
          .sort((a, b) => b.commentCount - a.commentCount)
          .slice(0, 10);

        return {
          uniqueAuthors: Object.keys(authorMap).length,
          topAuthors
        };
      })(),

      topComments: comments
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 10)
        .map(c => ({
          author: c.author || '[deleted]',
          body: (c.body || '').substring(0, 200) + ((c.body || '').length > 200 ? '...' : ''),
          score: c.score || 0,
          created: new Date(c.created_utc * 1000).toISOString()
        })),

      timeDistribution: (() => {
        const hourMap = {};
        comments.forEach(c => {
          const hour = new Date(c.created_utc * 1000).getHours();
          hourMap[hour] = (hourMap[hour] || 0) + 1;
        });
        return hourMap;
      })(),

      wordFrequency: (() => {
        const words = {};
        const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by', 'that', 'this', 'it', 'from', 'be', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);

        comments.forEach(c => {
          const text = (c.body || '').toLowerCase();
          const wordList = text.match(/\b[a-z]{3,}\b/g) || [];
          wordList.forEach(word => {
            if (!stopWords.has(word)) {
              words[word] = (words[word] || 0) + 1;
            }
          });
        });

        return Object.entries(words)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([word, count]) => ({ word, count }));
      })()
    };

    res.json({
      postId,
      postTitle: postData.title,
      analysis
    });

  } catch (error) {
    console.error('分析错误:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * API: 健康检查
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Reddit Analyzer Backend 运行在 http://localhost:${PORT}`);
  console.log(`📡 API 文档:`);
  console.log(`   - GET /api/search?keyword=xxx&subreddit=all&limit=50`);
  console.log(`   - GET /api/post/:postId`);
  console.log(`   - GET /api/analyze/:postId`);
});
