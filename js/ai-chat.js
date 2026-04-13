/**
 * AI 对话组件 - 老师傅版
 */

(function() {
  'use strict';

  const CONFIG = {
    API_KEY: 'sk-your-kimi-api-key-here',
    API_URL: 'https://api.moonshot.cn/v1/chat/completions',
    MODEL: 'moonshot-v1-8k',
    STREAMING: true,
    SYSTEM_PROMPT: `【角色】你是老张，小微商户领域20多年经验的老师傅。开过店、赔过钱、也赚过钱，深知小生意的酸甜苦辣。说话直来直去，心里装着商户难处。

【风格】专业不摆架子，直接不伤人的邻家大哥/大姐。一眼看出问题，给实在建议。专业术语要加括号解释。

【语气】开头有称呼（老板您好/哥/姐）；困难时给鼓励（刚开始都不容易/慢慢来有办法的）；方案具体到第一步干什么第二步干什么；提醒易错点。

【回答】咨询建议时参考这个结构（灵活使用）：
- 诊断结论：1-2句话概括
- 问题分析：拆开说，用数据支撑  
- 优化建议：具体措施+执行步骤+预期效果
- 风险提示：可能麻烦及避免方法
- 鼓励的话：根据情况加一句暖心话

【交互】
- 首次咨询：主动问业态、位置、营业额、最头疼的问题
- 追问处理：优先答最关心的，复杂问题分步骤说
- 超范围：建议咨询专业人士
- 结束语：给鼓励或提醒

【原则】不说空话，每句都要有实际价值。`
  };

  let state = { isOpen: false, messages: [], isTyping: false };
  let elements = {};

  function init() {
    createChatModal();
    cacheElements();
    bindEvents();
  }

  function createChatModal() {
    if (document.getElementById('aiChatModal')) return;
    
    document.body.insertAdjacentHTML('beforeend', `
      <div class="ai-modal-overlay" id="aiChatModal">
        <div class="ai-chat-modal">
          <div class="ai-chat-header">
            <div class="ai-header-left">
              <div class="ai-avatar">🧔</div>
              <div class="ai-header-info">
                <h3>老师傅顾问</h3>
                <p>20年店铺经验，实在建议</p>
              </div>
            </div>
            <div class="ai-header-actions">
              <button class="ai-header-btn" id="aiClearBtn">🗑️</button>
              <button class="ai-header-btn" id="aiCloseBtn">✕</button>
            </div>
          </div>
          <div class="ai-quick-tips">
            <span class="ai-quick-tips-label">💡 常见问题：</span>
            <button class="ai-tip-btn" data-tip="我想开家奶茶店，怎么选址？">选址分析</button>
            <button class="ai-tip-btn" data-tip="我的店食材成本太高了怎么办？">成本优化</button>
            <button class="ai-tip-btn" data-tip="店铺生意不好，怎么做营销？">营销策略</button>
            <button class="ai-tip-btn" data-tip="帮我算算这个店能不能赚钱？">盈亏分析</button>
          </div>
          <div class="ai-messages-container" id="aiMessagesContainer">
            <div class="ai-welcome-card">
              <h4>👋 老板您好！</h4>
              <p>我是老张，开过店、赔过钱、也赚过钱。您店里遇到什么问题，跟我说说，我给您支招。</p>
              <p style="margin-top:10px;font-size:0.9em;color:#64748b;">例如：选址、成本、营销、算账，都能问我。</p>
            </div>
          </div>
          <div class="ai-input-container">
            <div class="ai-input-wrapper">
              <textarea class="ai-textarea" id="aiTextarea" placeholder="例如：我想在武林路开家奶茶店，月租1.5万，周边有5家竞品，您觉得能做吗？" rows="1"></textarea>
            </div>
            <button class="ai-send-btn" id="aiSendBtn" disabled>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `);
  }

  function cacheElements() {
    elements = {
      modal: document.getElementById('aiChatModal'),
      closeBtn: document.getElementById('aiCloseBtn'),
      clearBtn: document.getElementById('aiClearBtn'),
      messagesContainer: document.getElementById('aiMessagesContainer'),
      textarea: document.getElementById('aiTextarea'),
      sendBtn: document.getElementById('aiSendBtn'),
      tipBtns: document.querySelectorAll('.ai-tip-btn')
    };
  }

  function bindEvents() {
    elements.closeBtn.addEventListener('click', closeModal);
    elements.modal.addEventListener('click', (e) => {
      if (e.target === elements.modal) closeModal();
    });
    elements.clearBtn.addEventListener('click', clearConversation);
    elements.sendBtn.addEventListener('click', sendMessage);
    elements.textarea.addEventListener('input', handleInput);
    elements.textarea.addEventListener('keydown', handleKeydown);
    elements.tipBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.textarea.value = btn.dataset.tip;
        handleInput();
        sendMessage();
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.isOpen) closeModal();
    });
  }

  function handleInput() {
    elements.sendBtn.disabled = !elements.textarea.value.trim() || state.isTyping;
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!elements.sendBtn.disabled) sendMessage();
    }
  }

  async function sendMessage() {
    const content = elements.textarea.value.trim();
    if (!content || state.isTyping) return;

    if (!CONFIG.API_KEY || CONFIG.API_KEY === 'sk-your-kimi-api-key-here') {
      addMessage('assistant', '⚠️ 请先配置 API Key：编辑 js/ai-chat.js 第10行，填入你的 Kimi API Key');
      return;
    }

    addMessage('user', content);
    elements.textarea.value = '';
    elements.textarea.style.height = 'auto';
    elements.sendBtn.disabled = true;

    showTypingIndicator();
    state.isTyping = true;

    try {
      await callAPI(content);
    } catch (error) {
      hideTypingIndicator();
      let errorMsg = error.message;
      if (error.message.includes('401')) {
        errorMsg = 'API Key 无效，请检查配置';
      }
      addMessage('assistant', `❌ ${errorMsg}`);
    } finally {
      state.isTyping = false;
      elements.sendBtn.disabled = false;
    }
  }

  async function callAPI(userMessage) {
    const messages = [
      { role: 'system', content: CONFIG.SYSTEM_PROMPT },
      ...state.messages.slice(-10),
      { role: 'user', content: userMessage }
    ];

    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`
      },
      body: JSON.stringify({
        model: CONFIG.MODEL,
        messages: messages,
        temperature: 0.7,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let messageEl = null;

    hideTypingIndicator();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            if (!messageEl) {
              messageEl = createMessageElement('assistant', fullContent);
              elements.messagesContainer.appendChild(messageEl);
            } else {
              updateMessageContent(messageEl, fullContent);
            }
            scrollToBottom();
          }
        } catch (e) {}
      }
    }

    if (fullContent) {
      state.messages.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: fullContent }
      );
    }
  }

  function addMessage(role, content) {
    const el = createMessageElement(role, content);
    elements.messagesContainer.appendChild(el);
    scrollToBottom();
    state.messages.push({ role, content });
  }

  function createMessageElement(role, content) {
    const div = document.createElement('div');
    div.className = `ai-message ${role}`;
    const avatar = role === 'assistant' ? '🧔' : '👤';
    div.innerHTML = `
      <div class="ai-message-avatar">${avatar}</div>
      <div class="ai-message-content">${formatContent(content)}</div>
    `;
    return div;
  }

  function updateMessageContent(element, content) {
    element.querySelector('.ai-message-content').innerHTML = formatContent(content);
  }

  function formatContent(content) {
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'ai-message assistant ai-typing';
    indicator.id = 'aiTypingIndicator';
    indicator.innerHTML = `
      <div class="ai-message-avatar">🧔</div>
      <div class="ai-message-content">
        <div class="ai-typing-indicator"><span></span><span></span><span></span></div>
      </div>
    `;
    elements.messagesContainer.appendChild(indicator);
    scrollToBottom();
  }

  function hideTypingIndicator() {
    const indicator = document.getElementById('aiTypingIndicator');
    if (indicator) indicator.remove();
  }

  function scrollToBottom() {
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
  }

  function clearConversation() {
    if (!confirm('清空对话？')) return;
    state.messages = [];
    elements.messagesContainer.innerHTML = `
      <div class="ai-welcome-card">
        <h4>👋 老板您好！</h4>
        <p>我是老张，有什么可以帮您的吗？</p>
      </div>
    `;
  }

  function openModal() {
    elements.modal.classList.add('active');
    state.isOpen = true;
    document.body.style.overflow = 'hidden';
    setTimeout(() => elements.textarea.focus(), 300);
  }

  function closeModal() {
    elements.modal.classList.remove('active');
    state.isOpen = false;
    document.body.style.overflow = '';
  }

  window.AIChat = {
    open: openModal,
    close: closeModal
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
