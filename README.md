# 智店参谋 - AI商业资讯咨询平台

一款专为小商户打造的智能商业咨询平台，接入 Kimi AI 大模型。

## ✨ 功能特性

-  **AI 智能咨询** - 基于 Kimi 大模型，提供专业商业建议
-  **流式对话** - 实时显示 AI 回复，体验流畅
-  **快捷提示** - 预设常见问题，一键提问
-  **响应式设计** - 完美适配手机、平板、电脑

## 📋 项目结构

```
practise/
├── css/
│   ├── style.css          # 主样式
│   └── ai-chat.css        # AI 对话组件样式
├── js/
│   └── ai-chat.js         # AI 对话逻辑
├── image/                 # 图片资源
├── demo.html              # 主页面
└── README.md              # 本文件
```

## 🔑 配置说明

在 `js/ai-chat.js` 中配置你的 API Key：

```javascript
const CONFIG = {
  API_KEY: 'sk-your-actual-kimi-api-key',
  API_URL: 'https://api.moonshot.cn/v1/chat/completions',
  MODEL: 'moonshot-v1-8k',
  // ...
};
```

## 📝 开源协议

MIT License

##注
仅为课程小组作业水平
