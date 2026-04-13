/**
 * Kimi AI API 代理服务
 * 
 * 功能：
 * - 转发前端请求到 Kimi API
 * - 保护 API Key 不被暴露在前端
 * - 添加请求频率限制
 * - 支持流式响应
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const KIMI_API_KEY = process.env.KIMI_API_KEY;
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

// 验证配置
if (!KIMI_API_KEY) {
  console.error('❌ 错误：请在 .env 文件中设置 KIMI_API_KEY');
  process.exit(1);
}

// CORS 配置
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// 请求频率限制
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: parseInt(process.env.RATE_LIMIT_PER_MINUTE) || 30,
  message: {
    error: '请求过于频繁，请稍后再试',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Kimi API 代理接口
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model = 'moonshot-v1-8k', temperature = 0.7, stream = true } = req.body;

    // 验证请求
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: '缺少必要的 messages 参数'
      });
    }

    // 构建请求体
    const requestBody = {
      model,
      messages,
      temperature,
      stream
    };

    // 发送请求到 Kimi API
    const response = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Kimi API 错误:', errorData);
      return res.status(response.status).json({
        error: errorData.error?.message || '调用 Kimi API 失败'
      });
    }

    // 处理流式响应
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
      } catch (error) {
        console.error('流式传输错误:', error);
      } finally {
        res.end();
      }
    } else {
      // 非流式响应
      const data = await response.json();
      res.json(data);
    }

  } catch (error) {
    console.error('服务器错误:', error);
    res.status(500).json({
      error: '服务器内部错误',
      message: error.message
    });
  }
});

// 简单的对话接口（兼容 OpenAI 格式）
app.post('/v1/chat/completions', async (req, res) => {
  // 复用 /api/chat 的逻辑
  req.url = '/api/chat';
  app.handle(req, res);
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('未捕获的错误:', err);
  res.status(500).json({
    error: '服务器内部错误'
  });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`
🚀 Kimi AI 代理服务已启动

📍 服务地址: http://localhost:${PORT}
🔍 健康检查: http://localhost:${PORT}/health
💬 API 端点: http://localhost:${PORT}/api/chat

📋 使用说明:
   POST http://localhost:${PORT}/api/chat
   Content-Type: application/json
   
   {
     "messages": [
       { "role": "user", "content": "你好" }
     ],
     "stream": true
   }
  `);
});
