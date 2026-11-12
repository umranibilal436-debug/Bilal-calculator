/**
 * BILAL SCIENTIFIC CALCULATOR - UI & Interaction Controller
 * Connects the UI components to the MathEngine:
 *  - Handles Keypad clicks and keyboard shortcuts
 *  - Real-time expression evaluation and preview
 *  - Sound feedback via Web Audio API
 *  - History drawer management with LocalStorage
 *  - DEG / RAD and 2nd Shift mode toggles
 *  - Theme switching: Light (White bg), Dark, and Night Vision (Tactical Red)
 */

class SoundSystem {
  constructor() {
    this.audioCtx = null;
    this.enabled = true;
  }

  init() {
    if (!this.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  play(type) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'num') {
        // Soft short mechanical transient click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.025);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
        osc.start(now);
        osc.stop(now + 0.025);
      } else if (type === 'op' || type === 'sci') {
        // High-tech pitched blip
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.035);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        osc.start(now);
        osc.stop(now + 0.035);
      } else if (type === 'equals') {
        // Rewarding dual harmonic chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880.00, now + 0.06); // A5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'clear') {
        // Soft low thud
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.04);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'error') {
        // Gentle error warning buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }
}

class BilalCalculatorApp {
  constructor() {
    this.engine = new MathEngine();
    this.sound = new SoundSystem();

    this.expression = '';
    this.currentResult = '0';
    this.isResultState = false;
    this.isShiftActive = false;
    this.history = [];

    this.dom = {
      expressionDisplay: document.getElementById('expressionDisplay'),
      resultDisplay: document.getElementById('resultDisplay'),
      livePreview: document.getElementById('livePreview'),
      angleModeBadge: document.getElementById('angleModeBadge'),
      angleModeText: document.getElementById('angleModeText'),
      keypadDegRadLabel: document.getElementById('keypadDegRadLabel'),
      shiftModeBadge: document.getElementById('shiftModeBadge'),
      memoryModeBadge: document.getElementById('memoryModeBadge'),
      nightVisionBadge: document.getElementById('nightVisionBadge'),
      btn2nd: document.getElementById('btn2nd'),
      btnDegRad: document.getElementById('btnDegRad'),
      keypadGrid: document.getElementById('keypadGrid'),
      historyDrawer: document.getElementById('historyDrawer'),
      drawerBackdrop: document.getElementById('drawerBackdrop'),
      historyList: document.getElementById('historyList'),
      emptyHistoryMsg: document.getElementById('emptyHistoryMsg'),
      historyCountBadge: document.getElementById('historyCountBadge'),
      historyToggle: document.getElementById('historyToggle'),
      closeHistoryBtn: document.getElementById('closeHistoryBtn'),
      clearHistoryBtn: document.getElementById('clearHistoryBtn'),
      exportHistoryBtn: document.getElementById('exportHistoryBtn'),
      soundToggle: document.getElementById('soundToggle'),
      helpModal: document.getElementById('helpModal'),
      helpToggle: document.getElementById('helpToggle'),
      closeHelpBtn: document.getElementById('closeHelpBtn'),
      dismissHelpBtn: document.getElementById('dismissHelpBtn'),
      copyResultBtn: document.getElementById('copyResultBtn'),
      toastNotification: document.getElementById('toastNotification'),
      themeButtons: document.querySelectorAll('.theme-btn'),
      mobileTabButtons: document.querySelectorAll('.tab-btn'),
      keypadButtons: document.querySelectorAll('.calc-btn'),
      memoryButtons: document.querySelectorAll('.mem-btn')
    };

    this.init();
  }

  init() {
    this.loadSettings();
    this.loadHistory();
    this.bindEvents();
    this.updateDisplay();
  }

  // Load user settings from LocalStorage
  loadSettings() {
    const savedTheme = localStorage.getItem('bilal_calc_theme') || 'light';
    this.setTheme(savedTheme);

    const savedSound = localStorage.getItem('bilal_calc_sound');
    if (savedSound !== null) {
      this.sound.enabled = savedSound === 'true';
      this.updateSoundIcon();
    }

    const savedAngle = localStorage.getItem('bilal_calc_angle') || 'DEG';
    this.engine.setAngleMode(savedAngle);
    this.updateAngleModeUI();
  }

  // Bind All UI Events
  bindEvents() {
    // Calculator Keypad button clicks
    this.dom.keypadButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        const val = btn.dataset.val;
        this.handleAction(action, val, btn);
      });
    });

    // Memory buttons
    this.dom.memoryButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.handleMemoryAction(action);
      });
    });

    // Angle mode toggles
    this.dom.angleModeBadge.addEventListener('click', () => this.toggleAngleMode());
    if (this.dom.btnDegRad) {
      this.dom.btnDegRad.addEventListener('click', () => this.toggleAngleMode());
    }

    // 2nd Shift key
    if (this.dom.btn2nd) {
      this.dom.btn2nd.addEventListener('click', () => this.toggleShift());
    }

    // Copy Result
    this.dom.copyResultBtn.addEventListener('click', () => this.copyResult());

    // History Drawer
    this.dom.historyToggle.addEventListener('click', () => this.toggleHistoryDrawer(true));
    this.dom.closeHistoryBtn.addEventListener('click', () => this.toggleHistoryDrawer(false));
    this.dom.drawerBackdrop.addEventListener('click', () => this.toggleHistoryDrawer(false));
    this.dom.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    this.dom.exportHistoryBtn.addEventListener('click', () => this.exportHistory());

    // Sound toggle
    this.dom.soundToggle.addEventListener('click', () => {
      const active = this.sound.toggle();
      localStorage.setItem('bilal_calc_sound', active);
      this.updateSoundIcon();
      this.showToast(active ? 'Sound Effects Enabled' : 'Sound Muted');
    });

    // Help Modal
    this.dom.helpToggle.addEventListener('click', () => this.toggleHelpModal(true));
    this.dom.closeHelpBtn.addEventListener('click', () => this.toggleHelpModal(false));
    this.dom.dismissHelpBtn.addEventListener('click', () => this.toggleHelpModal(false));
    this.dom.helpModal.addEventListener('click', (e) => {
      if (e.target === this.dom.helpModal) this.toggleHelpModal(false);
    });

    // Theme Switchers
    this.dom.themeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.themeChoice;
        this.setTheme(theme);
      });
    });

    // Mobile Tabs
    this.dom.mobileTabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.dom.mobileTabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        this.dom.keypadGrid.dataset.activeTab = tab;
      });
    });

    // Physical Keyboard Listener
    window.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  // Handle Calculator Actions
  handleAction(action, val, triggerBtn = null) {
    if (triggerBtn) {
      this.flashButton(triggerBtn);
    }

    // Play appropriate sound
    if (['num', 'decimal'].includes(action)) {
      this.sound.play('num');
    } else if (['add', 'subtract', 'multiply', 'divide', 'power', 'percent'].includes(action)) {
      this.sound.play('op');
    } else if (action === 'equals') {
      this.sound.play('equals');
    } else if (action === 'clear-all' || action === 'delete') {
      this.sound.play('clear');
    } else {
      this.sound.play('sci');
    }

    // Handle shift state conversion for trig functions
    if (this.isShiftActive) {
      if (action === 'sin') action = 'asin';
      else if (action === 'cos') action = 'acos';
      else if (action === 'tan') action = 'atan';
      else if (action === 'square') action = 'cube';
      else if (action === 'sqrt') action = 'cbrt';
      else if (action === 'log') action = 'pow10';
      else if (action === 'ln') action = 'exp';
      // Reset shift after single use
      this.toggleShift(false);
    }

    switch (action) {
      case 'num':
        this.appendToken(val);
        break;

      case 'decimal':
        this.appendDecimal();
        break;

      case 'add':
        this.appendOperator('+');
        break;

      case 'subtract':
        this.appendOperator('-');
        break;

      case 'multiply':
        this.appendOperator('×');
        break;

      case 'divide':
        this.appendOperator('÷');
        break;

      case 'percent':
        this.appendPostfix('%');
        break;

      case 'power':
        this.appendOperator('^');
        break;

      case 'square':
        this.appendPostfix('²');
        break;

      case 'cube':
        this.appendPostfix('³');
        break;

      case 'sqrt':
        this.appendFunction('√(');
        break;

      case 'cbrt':
        this.appendFunction('∛(');
        break;

      case 'sin':
        this.appendFunction('sin(');
        break;

      case 'cos':
        this.appendFunction('cos(');
        break;

      case 'tan':
        this.appendFunction('tan(');
        break;

      case 'asin':
        this.appendFunction('sin⁻¹(');
        break;

      case 'acos':
        this.appendFunction('cos⁻¹(');
        break;

      case 'atan':
        this.appendFunction('tan⁻¹(');
        break;

      case 'log':
        this.appendFunction('log(');
        break;

      case 'ln':
        this.appendFunction('ln(');
        break;

      case 'exp':
        this.appendFunction('e^(');
        break;

      case 'pow10':
        this.appendFunction('10^(');
        break;

      case 'factorial':
        this.appendPostfix('!');
        break;

      case 'pi':
        this.appendToken('π');
        break;

      case 'euler':
        this.appendToken('e');
        break;

      case 'ans':
        this.appendToken('Ans');
        break;

      case 'open-paren':
        this.appendParen('(');
        break;

      case 'close-paren':
        this.appendParen(')');
        break;

      case 'abs':
        this.appendFunction('abs(');
        break;

      case 'reciprocal':
        this.handleReciprocal();
        break;

      case 'negate':
        this.handleNegate();
        break;

      case 'clear-all':
        this.clearAll();
        break;

      case 'delete':
        this.deleteLast();
        break;

      case 'equals':
        this.calculate();
        break;

      case 'deg-rad':
        this.toggleAngleMode();
        break;

      case '2nd':
        this.toggleShift();
        break;
    }

    this.updateDisplay();
    this.updateLivePreview();
  }

  // Token Appenders
  appendToken(token) {
    if (this.isResultState) {
      // If user typed a number immediately after calculation, start fresh
      this.expression = '';
      this.isResultState = false;
    }
    this.expression += token;
  }

  appendDecimal() {
    if (this.isResultState) {
      this.expression = '0';
      this.isResultState = false;
    }
    // Prevent multiple decimals in the current number segment
    const parts = this.expression.split(/[\+\-×÷\^\(\)]/);
    const lastPart = parts[parts.length - 1];
    if (!lastPart.includes('.')) {
      if (!lastPart || /[^0-9]$/.test(lastPart)) {
        this.expression += '0.';
      } else {
        this.expression += '.';
      }
    }
  }

  appendOperator(op) {
    if (this.isResultState) {
      // Continue chaining with previous answer
      this.expression = this.currentResult;
      this.isResultState = false;
    }
    if (!this.expression) {
      if (op === '-') {
        this.expression = '-';
        return;
      }
      this.expression = '0';
    }

    // Replace last operator if already ending with one
    if (/[+\-×÷^]$/.test(this.expression)) {
      this.expression = this.expression.slice(0, -1) + op;
    } else {
      this.expression += op;
    }
  }

  appendPostfix(symbol) {
    if (this.isResultState) {
      this.expression = this.currentResult;
      this.isResultState = false;
    }
    if (!this.expression) {
      this.expression = '0';
    }
    this.expression += symbol;
  }

  appendFunction(funcPrefix) {
    if (this.isResultState) {
      this.expression = '';
      this.isResultState = false;
    }
    this.expression += funcPrefix;
  }

  appendParen(paren) {
    if (this.isResultState) {
      this.expression = '';
      this.isResultState = false;
    }
    this.expression += paren;
  }

  handleReciprocal() {
    if (this.isResultState) {
      this.expression = `1/(${this.currentResult})`;
      this.isResultState = false;
    } else if (this.expression) {
      this.expression = `1/(${this.expression})`;
    } else {
      this.expression = '1/(';
    }
  }

  handleNegate() {
    if (this.isResultState) {
      const num = Number(this.currentResult);
      if (!isNaN(num)) {
        this.currentResult = String(-num);
        this.expression = this.currentResult;
        return;
      }
    }

    if (!this.expression) {
      this.expression = '-';
      return;
    }

    // Wrap expression in -(...) or toggle if already wrapped
    if (this.expression.startsWith('-(') && this.expression.endsWith(')')) {
      this.expression = this.expression.slice(2, -1);
    } else {
      this.expression = `-(${this.expression})`;
    }
  }

  clearAll() {
    this.expression = '';
    this.currentResult = '0';
    this.isResultState = false;
    this.dom.resultDisplay.classList.remove('error-state');
  }

  deleteLast() {
    if (this.isResultState) {
      this.clearAll();
      return;
    }
    if (!this.expression) return;

    // Check for multi-character tokens like sin⁻¹(, log(, etc.
    const multiTokens = ['sin⁻¹(', 'cos⁻¹(', 'tan⁻¹(', 'asin(', 'acos(', 'atan(', 'log(', 'ln(', 'abs(', '10^(', 'e^(', 'cbrt(', 'sqrt('];
    for (const token of multiTokens) {
      if (this.expression.endsWith(token)) {
        this.expression = this.expression.slice(0, -token.length);
        return;
      }
    }

    this.expression = this.expression.slice(0, -1);
  }

  // Calculate & Save History
  calculate() {
    if (!this.expression) return;

    try {
      const rawExpr = this.expression;
      const resultVal = this.engine.calculate(rawExpr);
      const formatted = this.engine.formatResult(resultVal);

      // Record History
      this.addHistoryItem(rawExpr, formatted);

      this.currentResult = formatted;
      this.isResultState = true;
      this.dom.resultDisplay.classList.remove('error-state');
      this.dom.livePreview.innerText = '';
    } catch (err) {
      this.sound.play('error');
      this.currentResult = err.message || 'Error';
      this.isResultState = true;
      this.dom.resultDisplay.classList.add('error-state');
    }
  }

  // Real-Time Dynamic Live Preview
  updateLivePreview() {
    if (this.isResultState || !this.expression || this.expression.length < 2) {
      this.dom.livePreview.innerText = '';
      return;
    }

    try {
      // Don't evaluate incomplete trailing operators
      if (/[+\-×÷^,]$/.test(this.expression)) {
        return;
      }
      const previewVal = this.engine.calculate(this.expression);
      if (typeof previewVal === 'number' && !isNaN(previewVal) && isFinite(previewVal)) {
        this.dom.livePreview.innerText = `= ${this.engine.formatResult(previewVal, 8)}`;
      } else {
        this.dom.livePreview.innerText = '';
      }
    } catch (e) {
      this.dom.livePreview.innerText = '';
    }
  }

  // Update Display Elements
  updateDisplay() {
    this.dom.expressionDisplay.innerText = this.expression || '0';
    this.dom.resultDisplay.innerText = this.currentResult;

    // Responsive font scaling for long numbers
    const resLen = this.currentResult.length;
    this.dom.resultDisplay.classList.remove('long-number', 'very-long-number');
    if (resLen > 15) {
      this.dom.resultDisplay.classList.add('very-long-number');
    } else if (resLen > 10) {
      this.dom.resultDisplay.classList.add('long-number');
    }

    // Scroll expression to right
    this.dom.expressionDisplay.scrollLeft = this.dom.expressionDisplay.scrollWidth;
  }

  // Angle Mode: DEG / RAD
  toggleAngleMode() {
    const current = this.engine.getAngleMode();
    const next = current === 'DEG' ? 'RAD' : 'DEG';
    this.engine.setAngleMode(next);
    localStorage.setItem('bilal_calc_angle', next);
    this.updateAngleModeUI();
    this.showToast(`Angle Mode: ${next}`);
    this.updateLivePreview();
  }

  updateAngleModeUI() {
    const mode = this.engine.getAngleMode();
    this.dom.angleModeText.innerText = mode;
    if (this.dom.keypadDegRadLabel) {
      this.dom.keypadDegRadLabel.innerText = mode;
    }
  }

  // 2nd Function Shift
  toggleShift(forceState = null) {
    this.isShiftActive = forceState !== null ? forceState : !this.isShiftActive;
    if (this.isShiftActive) {
      document.body.classList.add('shift-active');
      this.dom.shiftModeBadge.classList.remove('hidden');
      if (this.dom.btn2nd) this.dom.btn2nd.classList.add('active');
    } else {
      document.body.classList.remove('shift-active');
      this.dom.shiftModeBadge.classList.add('hidden');
      if (this.dom.btn2nd) this.dom.btn2nd.classList.remove('active');
    }
  }

  // Memory Operations
  handleMemoryAction(action) {
    this.sound.play('sci');
    const currNum = parseFloat(this.currentResult) || 0;

    switch (action) {
      case 'mc':
        this.engine.memoryClear();
        this.showToast('Memory Cleared');
        break;
      case 'mr':
        this.appendToken(String(this.engine.memoryRecall()));
        this.showToast(`Memory Recalled: ${this.engine.memoryRecall()}`);
        break;
      case 'm-add':
        this.engine.memoryAdd(currNum);
        this.showToast(`Added to Memory (${this.engine.memoryRecall()})`);
        break;
      case 'm-sub':
        this.engine.memorySubtract(currNum);
        this.showToast(`Subtracted from Memory (${this.engine.memoryRecall()})`);
        break;
      case 'ms':
        this.engine.memoryStore(currNum);
        this.showToast(`Stored to Memory (${currNum})`);
        break;
    }

    if (this.engine.hasMemory()) {
      this.dom.memoryModeBadge.classList.remove('hidden');
    } else {
      this.dom.memoryModeBadge.classList.add('hidden');
    }
    this.updateDisplay();
  }

  // Theme Management
  setTheme(themeName) {
    if (!['light', 'dark', 'night'].includes(themeName)) {
      themeName = 'light';
    }

    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('bilal_calc_theme', themeName);

    // Update Theme selector buttons
    this.dom.themeButtons.forEach(btn => {
      if (btn.dataset.themeChoice === themeName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Night vision HUD badge
    if (themeName === 'night') {
      this.dom.nightVisionBadge.classList.remove('hidden');
      this.showToast('Night Vision Active: Scotopic Red');
    } else {
      this.dom.nightVisionBadge.classList.add('hidden');
    }
  }

  // Sound Icon State
  updateSoundIcon() {
    const soundOn = this.dom.soundToggle.querySelector('.sound-on');
    const soundOff = this.dom.soundToggle.querySelector('.sound-off');
    if (this.sound.enabled) {
      soundOn.classList.remove('hidden');
      soundOff.classList.add('hidden');
      this.dom.soundToggle.classList.add('active');
    } else {
      soundOn.classList.add('hidden');
      soundOff.classList.remove('hidden');
      this.dom.soundToggle.classList.remove('active');
    }
  }

  // History Drawer Management
  toggleHistoryDrawer(open) {
    if (open) {
      this.dom.historyDrawer.classList.add('open');
      this.dom.drawerBackdrop.classList.add('active');
      this.dom.historyDrawer.setAttribute('aria-hidden', 'false');
    } else {
      this.dom.historyDrawer.classList.remove('open');
      this.dom.drawerBackdrop.classList.remove('active');
      this.dom.historyDrawer.setAttribute('aria-hidden', 'true');
    }
  }

  loadHistory() {
    try {
      const stored = localStorage.getItem('bilal_calc_history');
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch (e) {
      this.history = [];
    }
    this.renderHistory();
  }

  addHistoryItem(expr, result) {
    const item = {
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      expr,
      result
    };
    this.history.unshift(item);
    if (this.history.length > 50) this.history.pop();
    localStorage.setItem('bilal_calc_history', JSON.stringify(this.history));
    this.renderHistory();
  }

  renderHistory() {
    this.dom.historyCountBadge.innerText = this.history.length;
    this.dom.historyList.innerHTML = '';

    if (this.history.length === 0) {
      this.dom.emptyHistoryMsg.classList.remove('hidden');
      return;
    }

    this.dom.emptyHistoryMsg.classList.add('hidden');

    this.history.forEach(item => {
      const li = document.createElement('li');
      li.className = 'history-item';
      li.innerHTML = `
        <div class="history-item-top">
          <span>Calculation</span>
          <span>${item.time}</span>
        </div>
        <div class="history-item-expr">${item.expr}</div>
        <div class="history-item-result">= ${item.result}</div>
        <div class="history-item-actions">
          <button type="button" class="history-act-btn load-btn" title="Load into calculator">Load</button>
          <button type="button" class="history-act-btn copy-btn" title="Copy result">Copy</button>
          <button type="button" class="history-act-btn delete-btn" title="Delete entry">✕</button>
        </div>
      `;

      // Click row to load result
      li.addEventListener('click', (e) => {
        if (e.target.closest('.delete-btn')) {
          this.deleteHistoryItem(item.id);
        } else if (e.target.closest('.copy-btn')) {
          this.copyToClipboard(item.result);
        } else {
          // Load expression or result
          this.expression = item.expr;
          this.currentResult = item.result;
          this.isResultState = true;
          this.updateDisplay();
          this.toggleHistoryDrawer(false);
          this.showToast('Calculation Restored');
        }
      });

      this.dom.historyList.appendChild(li);
    });
  }

  deleteHistoryItem(id) {
    this.history = this.history.filter(i => i.id !== id);
    localStorage.setItem('bilal_calc_history', JSON.stringify(this.history));
    this.renderHistory();
  }

  clearHistory() {
    this.history = [];
    localStorage.removeItem('bilal_calc_history');
    this.renderHistory();
    this.showToast('History Cleared');
  }

  exportHistory() {
    if (this.history.length === 0) {
      this.showToast('No history to export');
      return;
    }
    const lines = [
      '========================================',
      'BILAL SCIENTIFIC CALCULATOR - HISTORY LOG',
      `Exported at: ${new Date().toLocaleString()}`,
      '========================================\n'
    ];
    this.history.forEach((h, idx) => {
      lines.push(`[${idx + 1}] ${h.time}`);
      lines.push(`Formula : ${h.expr}`);
      lines.push(`Result  : ${h.result}`);
      lines.push('----------------------------------------');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bilal_calculator_history_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('History Exported');
  }

  // Keyboard Navigation & Shortcuts
  handleKeyboard(e) {
    // Ignore input if user is focusing an input (e.g. inside a modal or search)
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      return;
    }

    const key = e.key;

    // Modal close with Esc
    if (key === 'Escape' && this.dom.helpModal.classList.contains('open')) {
      this.toggleHelpModal(false);
      return;
    }
    if (key === 'Escape' && this.dom.historyDrawer.classList.contains('open')) {
      this.toggleHistoryDrawer(false);
      return;
    }

    // Number keys
    if (/^[0-9]$/.test(key)) {
      e.preventDefault();
      const btn = document.querySelector(`.calc-btn[data-key="${key}"]`);
      this.handleAction('num', key, btn);
      return;
    }

    // Direct Mappings
    const keyMap = {
      '+': { action: 'add' },
      '-': { action: 'subtract' },
      '*': { action: 'multiply' },
      'x': { action: 'multiply' },
      'X': { action: 'multiply' },
      '/': { action: 'divide' },
      '.': { action: 'decimal' },
      ',': { action: 'decimal' },
      '(': { action: 'open-paren' },
      ')': { action: 'close-paren' },
      '^': { action: 'power' },
      '%': { action: 'percent' },
      '!': { action: 'factorial' },
      'Enter': { action: 'equals' },
      '=': { action: 'equals' },
      'Backspace': { action: 'delete' },
      'Delete': { action: 'clear-all' },
      'Escape': { action: 'clear-all' },
      's': { action: 'sin' },
      'S': { action: 'asin' },
      'c': { action: 'cos' },
      'C': { action: 'acos' },
      't': { action: 'tan' },
      'T': { action: 'atan' },
      'r': { action: 'sqrt' },
      'l': { action: 'log' },
      'n': { action: 'ln' },
      'p': { action: 'pi' },
      'e': { action: 'euler' },
      'd': { action: 'deg-rad' },
      'D': { action: 'deg-rad' },
      'h': { custom: () => this.toggleHistoryDrawer(!this.dom.historyDrawer.classList.contains('open')) },
      'm': { custom: () => this.dom.soundToggle.click() },
      '?': { custom: () => this.toggleHelpModal(true) }
    };

    if (keyMap[key]) {
      e.preventDefault();
      const config = keyMap[key];
      if (config.custom) {
        config.custom();
      } else {
        const btn = document.querySelector(`.calc-btn[data-action="${config.action}"]`) ||
                    document.querySelector(`.calc-btn[data-key="${key}"]`);
        this.handleAction(config.action, null, btn);
      }
    }
  }

  // Visual Key Button Animation
  flashButton(btn) {
    if (!btn) return;
    btn.classList.add('key-pressed');
    setTimeout(() => {
      btn.classList.remove('key-pressed');
    }, 120);
  }

  // Help Modal
  toggleHelpModal(open) {
    if (open) {
      this.dom.helpModal.classList.add('open');
      this.dom.helpModal.setAttribute('aria-hidden', 'false');
    } else {
      this.dom.helpModal.classList.remove('open');
      this.dom.helpModal.setAttribute('aria-hidden', 'true');
    }
  }

  // Copy result to clipboard
  copyResult() {
    if (!this.currentResult || this.currentResult === '0') {
      this.showToast('No result to copy');
      return;
    }
    this.copyToClipboard(this.currentResult);
  }

  copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast(`Copied: ${text}`);
      }).catch(() => {
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  }

  fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      this.showToast(`Copied: ${text}`);
    } catch (e) {
      this.showToast('Failed to copy');
    }
    document.body.removeChild(ta);
  }

  // Toast Notification
  showToast(message) {
    const toast = this.dom.toastNotification;
    toast.innerText = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.bilalApp = new BilalCalculatorApp();
});
