/**
 * 经营数据收集表单
 */

(function() {
  'use strict';

  let formElements = {};
  let businessData = {};

  function init() {
    createForm();
    cacheElements();
    bindEvents();
  }

  function createForm() {
    if (document.getElementById('businessFormOverlay')) return;
    
    document.body.insertAdjacentHTML('beforeend', `
      <div class="business-form-overlay" id="businessFormOverlay">
        <div class="business-form-modal">
          <div class="business-form-header">
            <h2>📊 店铺经营数据</h2>
            <p>填写数据，AI帮您分析盈亏</p>
          </div>
          <div class="business-form-body">
            <div class="form-tip">
              <span class="tip-icon">💡</span>
              <p>填写真实数据获得更精准分析。不想填可以点击"跳过"。</p>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label><span class="icon">💰</span>日营业额</label>
                <div class="input-with-suffix">
                  <input type="number" id="inputRevenue" placeholder="2000" min="0">
                  <span class="input-suffix">元</span>
                </div>
              </div>
              <div class="form-group">
                <label><span class="icon">📈</span>毛利率</label>
                <div class="input-with-suffix">
                  <input type="number" id="inputGrossMargin" placeholder="40" min="0" max="100">
                  <span class="input-suffix">%</span>
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label><span class="icon">🏠</span>房租/天</label>
                <div class="input-with-suffix">
                  <input type="number" id="inputRent" placeholder="300" min="0">
                  <span class="input-suffix">元</span>
                </div>
              </div>
              <div class="form-group">
                <label><span class="icon">👥</span>人工/天</label>
                <div class="input-with-suffix">
                  <input type="number" id="inputLabor" placeholder="400" min="0">
                  <span class="input-suffix">元</span>
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label><span class="icon">⚡</span>水电物业/天</label>
                <div class="input-with-suffix">
                  <input type="number" id="inputUtilities" placeholder="100" min="0">
                  <span class="input-suffix">元</span>
                </div>
              </div>
              <div class="form-group">
                <label><span class="icon">📋</span>其他成本/天</label>
                <div class="input-with-suffix">
                  <input type="number" id="inputOtherFixed" placeholder="50" min="0">
                  <span class="input-suffix">元</span>
                </div>
              </div>
            </div>
            <div class="calc-result-card" id="calcResultCard" style="display:none">
              <div class="calc-item">
                <div class="label">日毛利额</div>
                <div class="value" id="displayGrossProfit">0</div>
                <div class="unit">元</div>
              </div>
              <div class="calc-item highlight">
                <div class="label">日纯利润</div>
                <div class="value" id="displayNetProfit">0</div>
                <div class="unit">元/天</div>
              </div>
              <div class="calc-item">
                <div class="label">保本营业额</div>
                <div class="value" id="displayBreakEven">0</div>
                <div class="unit">元/天</div>
              </div>
            </div>
          </div>
          <div class="business-form-footer">
            <button class="btn-secondary" id="btnSkip">跳过，直接咨询</button>
            <button class="btn-primary-large" id="btnAnalyze" disabled>
              <span>🤖</span> 生成AI分析
            </button>
          </div>
        </div>
      </div>
    `);
  }

  function cacheElements() {
    formElements = {
      overlay: document.getElementById('businessFormOverlay'),
      revenue: document.getElementById('inputRevenue'),
      grossMargin: document.getElementById('inputGrossMargin'),
      rent: document.getElementById('inputRent'),
      labor: document.getElementById('inputLabor'),
      utilities: document.getElementById('inputUtilities'),
      otherFixed: document.getElementById('inputOtherFixed'),
      btnSkip: document.getElementById('btnSkip'),
      btnAnalyze: document.getElementById('btnAnalyze'),
      resultCard: document.getElementById('calcResultCard'),
      displayGrossProfit: document.getElementById('displayGrossProfit'),
      displayNetProfit: document.getElementById('displayNetProfit'),
      displayBreakEven: document.getElementById('displayBreakEven')
    };
  }

  function bindEvents() {
    formElements.btnSkip.addEventListener('click', () => {
      formElements.overlay.classList.remove('active');
      document.body.style.overflow = '';
      setTimeout(() => {
        if (window.AIChat) AIChat.open();
      }, 300);
    });

    formElements.btnAnalyze.addEventListener('click', generateAnalysis);

    [formElements.revenue, formElements.grossMargin, formElements.rent, 
     formElements.labor, formElements.utilities, formElements.otherFixed]
      .forEach(input => input.addEventListener('input', calculate));
  }

  function calculate() {
    const revenue = parseFloat(formElements.revenue.value) || 0;
    const grossMargin = parseFloat(formElements.grossMargin.value) || 0;
    const rent = parseFloat(formElements.rent.value) || 0;
    const labor = parseFloat(formElements.labor.value) || 0;
    const utilities = parseFloat(formElements.utilities.value) || 0;
    const otherFixed = parseFloat(formElements.otherFixed.value) || 0;

    const grossProfit = revenue * (grossMargin / 100);
    const totalFixed = rent + labor + utilities + otherFixed;
    const netProfit = grossProfit - totalFixed;
    const breakEven = grossMargin > 0 ? totalFixed / (grossMargin / 100) : 0;

    businessData = { revenue, grossMargin, grossProfit, totalFixed, netProfit, breakEven, rent, labor, utilities, otherFixed };

    if (revenue > 0 && grossMargin > 0) {
      formElements.resultCard.style.display = 'grid';
      formElements.displayGrossProfit.textContent = grossProfit.toFixed(0);
      formElements.displayNetProfit.textContent = netProfit.toFixed(0);
      formElements.displayBreakEven.textContent = breakEven.toFixed(0);
      formElements.displayNetProfit.style.color = netProfit < 0 ? '#ef4444' : '#059669';
      formElements.btnAnalyze.disabled = false;
    } else {
      formElements.resultCard.style.display = 'none';
      formElements.btnAnalyze.disabled = true;
    }
  }

  function generateAnalysis() {
    const data = businessData;
    const prompt = `【店铺经营数据分析】
日营业额：${data.revenue.toFixed(0)}元 | 毛利率：${data.grossMargin.toFixed(1)}% | 日毛利：${data.grossProfit.toFixed(0)}元
固定成本：${data.totalFixed.toFixed(0)}元/天（房租${data.rent.toFixed(0)}+人工${data.labor.toFixed(0)}+水电${data.utilities.toFixed(0)}+其他${data.otherFixed.toFixed(0)}）
日纯利润：${data.netProfit.toFixed(0)}元 | 保本线：${data.breakEven.toFixed(0)}元/天
状态：${data.netProfit >= 0 ? '盈利' : '亏损'}

请分析经营状况并给出3-5条改进建议。`;

    localStorage.setItem('business_analysis', JSON.stringify({
      data: data,
      prompt: prompt,
      time: Date.now()
    }));

    formElements.overlay.classList.remove('active');
    document.body.style.overflow = '';
    
    setTimeout(() => {
      if (window.AIChat) {
        AIChat.open();
        setTimeout(() => {
          const textarea = document.getElementById('aiTextarea');
          if (textarea) {
            textarea.value = prompt;
            textarea.dispatchEvent(new Event('input'));
            document.getElementById('aiSendBtn').click();
          }
        }, 500);
      }
    }, 300);
  }

  function openForm() {
    formElements.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => formElements.revenue.focus(), 300);
  }

  window.BusinessForm = {
    open: openForm
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
