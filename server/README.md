# Kimi AI 后端代理服务

## 简介

这是一个可选的 Node.js 后端服务，用于保护您的 Kimi API Key，避免在前端代码中暴露。

**为什么需要后端代理？**
- 🔒 **安全性**：API Key 存储在服务器端，不会被用户看到
- 🛡️ **防滥用**：可以添加请求限制，防止 API 被滥用
- 📊 **日志记录**：可以记录使用情况，便于分析

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入您的 Kimi API Key：

```env
KIMI_API_KEY=your_kimi_api_key_here
PORT=3000
```

### 3. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务将在 http://localhost:3000 启动。

## API 接口

### POST /api/chat

发送消息给 Kimi AI。

**请求体：**

```json
{
  "messages": [
    { "role": "user", "content": "如何优化小店的现金流管理？" }
  ],
  "model": "moonshot-v1-8k",
  "stream": true
}
```

**响应：**

流式响应（SSE）或 JSON 格式，取决于 stream 参数。

## 部署

### 部署到 Vercel

1. 安装 Vercel CLI：
   ```bash
   npm i -g vercel
   ```

2. 部署：
   ```bash
   vercel --prod
   ```

3. 在 Vercel Dashboard 中设置环境变量 `KIMI_API_KEY`

### 部署到服务器

使用 PM2 管理进程：

```bash
npm install -g pm2
pm2 start index.js --name kimi-proxy
pm2 save
pm2 startup
```

## 前端配置

使用后端代理时，需要修改前端配置：

```javascript
// js/ai-chat.js 中的 CONFIG
const CONFIG = {
  API_KEY: '', // 留空，通过后端代理
  API_URL: 'https://your-server.com/api/chat', // 改为您的后端地址
  // ...
};
```

或者使用运行时配置：

```javascript
// 在打开AI聊天窗口前设置
AIChat.setConfig({
  apiUrl: 'https://your-server.com/api/chat',
  apiKey: ''  // 后端代理不需要
});
```
