/**
 * Calculator Pro – Enhanced Logic
 * Features: arithmetic ops, chained calculations, real-time display,
 * calculation history, theme toggle, keyboard support, and rich UX feedback.
 */
(() => {
  'use strict';

  // ── DOM References ──────────────────────────────────────────
  const expressionEl    = document.getElementById('expression');
  const resultEl        = document.getElementById('result');
  const buttonsEl       = document.getElementById('buttons-section');
  const historyPanel    = document.getElementById('history-panel');
  const historyList     = document.getElementById('history-list');
  const btnHistoryToggle = document.getElementById('btn-history-toggle');
  const btnHistoryClear  = document.getElementById('btn-history-clear');
  const btnThemeToggle   = document.getElementById('btn-theme-toggle');

  // ── State ───────────────────────────────────────────────────
  let currentInput  = '0';
  let previousInput = '';
  let operator      = '';
  let shouldReset   = false;
  let lastEquals    = false;
  let history       = [];

  // ── Helpers ─────────────────────────────────────────────────

  /** Format a number for display (commas, max digits). */
  function formatNumber(numStr) {
    if (numStr === '' || numStr === 'Error') return numStr;
    const num = parseFloat(numStr);
    if (isNaN(num)) return numStr;
    if (!isFinite(num)) return 'Error';

    // Preserve trailing decimal / trailing zeros while typing
    if (numStr.endsWith('.') || /\.\d*0+$/.test(numStr)) {
      const [intPart, decPart] = numStr.split('.');
      const formattedInt = Number(intPart).toLocaleString('en-US');
      return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
    }

    if (Math.abs(num) >= 1e12) return num.toExponential(4);
    return num.toLocaleString('en-US', { maximumFractionDigits: 10 });
  }

  /** Evaluate a simple binary operation. */
  function calculate(a, op, b) {
    const left  = parseFloat(a);
    const right = parseFloat(b);
    if (isNaN(left) || isNaN(right)) return 'Error';

    let result;
    switch (op) {
      case '+': result = left + right; break;
      case '−': result = left - right; break;
      case '×': result = left * right; break;
      case '÷':
        if (right === 0) return 'Error';
        result = left / right;
        break;
      default: return 'Error';
    }

    // Round to avoid floating-point weirdness
    result = Math.round(result * 1e12) / 1e12;
    return String(result);
  }

  // ── Display ─────────────────────────────────────────────────

  function updateDisplay() {
    const formatted = formatNumber(currentInput) || '0';
    resultEl.textContent = formatted;

    // Dynamic font size based on content length
    resultEl.classList.remove('shrink-1', 'shrink-2', 'shrink-3', 'error');
    if (currentInput === 'Error') {
      resultEl.classList.add('error');
    } else if (formatted.length > 16) {
      resultEl.classList.add('shrink-3');
    } else if (formatted.length > 12) {
      resultEl.classList.add('shrink-2');
    } else if (formatted.length > 9) {
      resultEl.classList.add('shrink-1');
    }

    // Build expression string
    if (previousInput && operator) {
      expressionEl.textContent = `${formatNumber(previousInput)} ${operator}`;
    } else {
      expressionEl.textContent = '';
    }
  }

  function flashResult() {
    resultEl.classList.remove('flash');
    void resultEl.offsetWidth; // reflow
    resultEl.classList.add('flash');
  }

  // ── Operator highlight ──────────────────────────────────────

  function highlightOperator(op) {
    document.querySelectorAll('.btn--operator').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === op);
    });
  }

  function clearOperatorHighlight() {
    document.querySelectorAll('.btn--operator').forEach(btn => {
      btn.classList.remove('active');
    });
  }

  // ── History ─────────────────────────────────────────────────

  function addToHistory(expr, result) {
    history.unshift({ expr, result });
    if (history.length > 50) history.pop();
    renderHistory();
  }

  function renderHistory() {
    if (history.length === 0) {
      historyList.innerHTML = '<li class="history-panel__empty">No calculations yet</li>';
      return;
    }

    historyList.innerHTML = history
      .map((item, i) =>
        `<li class="history-panel__item" data-index="${i}" tabindex="0" role="button" aria-label="Use result ${item.result}">
          <span class="history-panel__item-expr">${item.expr}</span>
          <span class="history-panel__item-result">= ${formatNumber(item.result)}</span>
        </li>`
      )
      .join('');
  }

  function clearHistory() {
    history = [];
    renderHistory();
  }

  // Click on a history item → load result into display
  historyList.addEventListener('click', (e) => {
    const item = e.target.closest('.history-panel__item');
    if (!item) return;
    const idx = parseInt(item.dataset.index, 10);
    if (history[idx]) {
      currentInput  = history[idx].result;
      previousInput = '';
      operator      = '';
      shouldReset   = true;
      lastEquals    = true;
      clearOperatorHighlight();
      updateDisplay();
      flashResult();
    }
  });

  btnHistoryToggle.addEventListener('click', () => {
    historyPanel.classList.toggle('open');
  });

  btnHistoryClear.addEventListener('click', clearHistory);

  // ── Theme Toggle ────────────────────────────────────────────

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('calc-theme', theme);
  }

  // Load saved theme
  const savedTheme = localStorage.getItem('calc-theme');
  if (savedTheme) setTheme(savedTheme);

  btnThemeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  // ── Actions ─────────────────────────────────────────────────

  function inputNumber(digit) {
    if (lastEquals) {
      currentInput  = digit;
      previousInput = '';
      operator      = '';
      lastEquals    = false;
      clearOperatorHighlight();
      updateDisplay();
      return;
    }

    if (shouldReset) {
      currentInput = digit;
      shouldReset  = false;
    } else {
      if (currentInput === '0' && digit !== '0') {
        currentInput = digit;
      } else if (currentInput === '0' && digit === '0') {
        // Prevent leading zeros
      } else {
        if (currentInput.replace(/[^0-9]/g, '').length >= 15) return;
        currentInput += digit;
      }
    }
    updateDisplay();
  }

  function inputDecimal() {
    if (lastEquals) {
      currentInput  = '0.';
      previousInput = '';
      operator      = '';
      lastEquals    = false;
      clearOperatorHighlight();
      updateDisplay();
      return;
    }

    if (shouldReset) {
      currentInput = '0.';
      shouldReset  = false;
      updateDisplay();
      return;
    }
    if (!currentInput.includes('.')) {
      currentInput += '.';
    }
    updateDisplay();
  }

  function inputOperator(op) {
    lastEquals = false;

    if (previousInput && operator && !shouldReset) {
      const result = calculate(previousInput, operator, currentInput);
      if (result === 'Error') {
        currentInput  = 'Error';
        previousInput = '';
        operator      = '';
        updateDisplay();
        clearOperatorHighlight();
        shouldReset = true;
        return;
      }
      currentInput  = result;
      previousInput = result;
      flashResult();
    } else {
      previousInput = currentInput;
    }

    operator    = op;
    shouldReset = true;
    highlightOperator(op);
    updateDisplay();
  }

  function inputEquals() {
    if (!operator || !previousInput) return;

    const exprString = `${formatNumber(previousInput)} ${operator} ${formatNumber(currentInput)}`;
    const result = calculate(previousInput, operator, currentInput);

    expressionEl.textContent = `${exprString} =`;

    currentInput  = result === 'Error' ? 'Error' : result;
    previousInput = '';
    const finishedOp = operator;
    operator      = '';
    shouldReset   = true;
    lastEquals    = true;

    clearOperatorHighlight();
    resultEl.textContent = formatNumber(currentInput);

    // Dynamic font size for result
    resultEl.classList.remove('shrink-1', 'shrink-2', 'shrink-3', 'error');
    const formatted = formatNumber(currentInput);
    if (currentInput === 'Error') {
      resultEl.classList.add('error');
    } else if (formatted.length > 16) {
      resultEl.classList.add('shrink-3');
    } else if (formatted.length > 12) {
      resultEl.classList.add('shrink-2');
    } else if (formatted.length > 9) {
      resultEl.classList.add('shrink-1');
    }

    flashResult();

    // Add to history (only valid results)
    if (result !== 'Error') {
      addToHistory(exprString, result);
    }
  }

  function inputPercent() {
    if (currentInput === 'Error') return;
    const num = parseFloat(currentInput);
    if (isNaN(num)) return;
    currentInput = String(Math.round((num / 100) * 1e12) / 1e12);
    shouldReset  = true;
    lastEquals   = false;
    updateDisplay();
    flashResult();
  }

  function inputClear() {
    currentInput  = '0';
    previousInput = '';
    operator      = '';
    shouldReset   = false;
    lastEquals    = false;
    clearOperatorHighlight();
    updateDisplay();
  }

  function inputDelete() {
    if (shouldReset || lastEquals || currentInput === 'Error') {
      currentInput = '0';
      shouldReset  = false;
      lastEquals   = false;
      updateDisplay();
      return;
    }
    currentInput = currentInput.slice(0, -1) || '0';
    updateDisplay();
  }

  // ── Click Handler (delegation) ──────────────────────────────

  buttonsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;

    const action = btn.dataset.action;
    const value  = btn.dataset.value;

    switch (action) {
      case 'number':   inputNumber(value);   break;
      case 'decimal':  inputDecimal();       break;
      case 'operator': inputOperator(value); break;
      case 'equals':   inputEquals();        break;
      case 'percent':  inputPercent();       break;
      case 'clear':    inputClear();         break;
      case 'delete':   inputDelete();        break;
    }
  });

  // ── Keyboard Support ────────────────────────────────────────

  const KEY_MAP = {
    '0': { action: 'number',   value: '0' },
    '1': { action: 'number',   value: '1' },
    '2': { action: 'number',   value: '2' },
    '3': { action: 'number',   value: '3' },
    '4': { action: 'number',   value: '4' },
    '5': { action: 'number',   value: '5' },
    '6': { action: 'number',   value: '6' },
    '7': { action: 'number',   value: '7' },
    '8': { action: 'number',   value: '8' },
    '9': { action: 'number',   value: '9' },
    '.': { action: 'decimal'  },
    '+': { action: 'operator', value: '+' },
    '-': { action: 'operator', value: '−' },
    '*': { action: 'operator', value: '×' },
    '/': { action: 'operator', value: '÷' },
    '%': { action: 'percent'  },
    'Enter':     { action: 'equals' },
    '=':         { action: 'equals' },
    'Backspace': { action: 'delete' },
    'Delete':    { action: 'clear'  },
    'Escape':    { action: 'clear'  },
  };

  function findMatchingButton(action, value) {
    if (value) {
      return buttonsEl.querySelector(`[data-action="${action}"][data-value="${value}"]`);
    }
    return buttonsEl.querySelector(`[data-action="${action}"]`);
  }

  document.addEventListener('keydown', (e) => {
    const mapped = KEY_MAP[e.key];
    if (!mapped) return;

    e.preventDefault();

    // Visual feedback on the corresponding button
    const btn = findMatchingButton(mapped.action, mapped.value);
    if (btn) {
      btn.classList.add('pressed');
      setTimeout(() => btn.classList.remove('pressed'), 100);
    }

    switch (mapped.action) {
      case 'number':   inputNumber(mapped.value);   break;
      case 'decimal':  inputDecimal();              break;
      case 'operator': inputOperator(mapped.value); break;
      case 'equals':   inputEquals();               break;
      case 'percent':  inputPercent();              break;
      case 'clear':    inputClear();                break;
      case 'delete':   inputDelete();               break;
    }
  });

  // ── Ripple position tracking ────────────────────────────────

  buttonsEl.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty('--ripple-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
    btn.style.setProperty('--ripple-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
  });

  // ── Init ────────────────────────────────────────────────────
  updateDisplay();
})();
