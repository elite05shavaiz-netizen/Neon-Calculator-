document.addEventListener('DOMContentLoaded', () => {
  // ---------- DOM Elements ----------
  const resultInput = document.getElementById('result');
  const expressionDiv = document.getElementById('expression');
  const buttons = document.querySelectorAll('.neon-btn');
  const themeRadios = document.querySelectorAll('input[name="theme"]');
  const historyPanel = document.getElementById('historyPanel');
  const customPanel = document.getElementById('customPanel');
  const historyToggle = document.getElementById('historyToggle');
  const settingsToggle = document.getElementById('settingsToggle');
  const closeHistory = document.getElementById('closeHistory');
  const closeCustom = document.getElementById('closeCustom');
  const clearHistoryBtn = document.getElementById('clearHistory');
  const historyList = document.getElementById('historyList');
  const glowColorInput = document.getElementById('glowColor');
  const glowIntensityInput = document.getElementById('glowIntensity');
  const btnFontSizeInput = document.getElementById('btnFontSize');
  const btnRadiusInput = document.getElementById('btnRadius');
  const resetCustomBtn = document.getElementById('resetCustom');
  const body = document.body;

  // ---------- State ----------
  let currentInput = '0';
  let expression = '';
  let resetInput = false;
  let history = JSON.parse(localStorage.getItem('calcHistory')) || [];

  // ---------- Load saved preferences ----------
  const savedTheme = localStorage.getItem('calcTheme') || 'dark';
  applyTheme(savedTheme);
  document.querySelector(`input[value="${savedTheme}"]`).checked = true;

  const savedPrefs = JSON.parse(localStorage.getItem('calcCustom')) || {};
  applyCustomPrefs(savedPrefs);

  // ---------- Update display ----------
  function updateDisplay() {
    resultInput.value = currentInput;
    expressionDiv.textContent = expression;
  }

  // ---------- Calculations ----------
  function calculate(expr) {
    try {
      // safe evaluation: replace × ÷ with * /
      let sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
      // Additional safety: only allow numbers and operators
      if (!/^[0-9+\-*/(). %√²]*$/.test(sanitized)) throw new Error('Invalid');
      // Use Function for safe eval
      const result = new Function('return ' + sanitized)();
      return Number.isFinite(result) ? result : 'Error';
    } catch {
      return 'Error';
    }
  }

  // ---------- Handle button clicks ----------
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const value = btn.dataset.value;

      // numbers and decimal
      if (value !== undefined) {
        if (resetInput) {
          currentInput = value;
          resetInput = false;
        } else {
          if (currentInput === '0' && value !== '.') currentInput = value;
          else if (value === '.' && currentInput.includes('.')) return;
          else currentInput += value;
        }
      }
      // operators
      else if (['+', '-', '*', '/'].includes(action)) {
        let opSymbol = action === '*' ? '×' : action === '/' ? '÷' : action === '-' ? '−' : '+';
        if (expression && !resetInput) {
          expression += currentInput;
        } else if (!expression) {
          expression = currentInput;
        }
        expression += opSymbol;
        resetInput = true;
        currentInput = '0';
      }
      // equals
      else if (action === '=') {
        if (expression) {
          const fullExp = expression + currentInput;
          const result = calculate(fullExp);
          if (result !== 'Error') {
            addHistory(fullExp + ' = ' + result);
            currentInput = String(result);
            expression = '';
          } else {
            currentInput = 'Error';
          }
          resetInput = true;
        }
      }
      // clear
      else if (action === 'clear') {
        currentInput = '0';
        expression = '';
        resetInput = false;
      }
      // backspace
      else if (action === 'backspace') {
        if (currentInput.length > 1) {
          currentInput = currentInput.slice(0, -1);
        } else {
          currentInput = '0';
        }
        if (currentInput === '' || currentInput === '-') currentInput = '0';
      }
      // square
      else if (action === 'square') {
        const num = parseFloat(currentInput);
        if (!isNaN(num)) {
          const squared = num * num;
          addHistory(`${num}² = ${squared}`);
          currentInput = String(squared);
          resetInput = true;
        }
      }
      // sqrt
      else if (action === 'sqrt') {
        const num = parseFloat(currentInput);
        if (!isNaN(num) && num >= 0) {
          const sqrtVal = Math.sqrt(num);
          addHistory(`√${num} = ${sqrtVal}`);
          currentInput = String(sqrtVal);
          resetInput = true;
        } else {
          currentInput = 'Error';
        }
      }

      updateDisplay();
    });
  });

  // ---------- History management ----------
  function addHistory(entry) {
    history.unshift({ text: entry, time: new Date().toLocaleTimeString() });
    if (history.length > 20) history.pop();
    localStorage.setItem('calcHistory', JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = history.map(item =>
      `<li data-exp="${item.text.split(' = ')[0]}">${item.text} <small>${item.time}</small></li>`
    ).join('');
  }

  historyList.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
      const expPart = e.target.dataset.exp;
      if (expPart) {
        expression = expPart;
        currentInput = '0';
        resetInput = true;
        updateDisplay();
        togglePanel(historyPanel, false);
      }
    }
  });

  clearHistoryBtn.addEventListener('click', () => {
    history = [];
    localStorage.removeItem('calcHistory');
    renderHistory();
  });

  // ---------- Panel toggles ----------
  function togglePanel(panel, show) {
    if (show) {
      panel.classList.remove('hidden');
    } else {
      panel.classList.add('hidden');
    }
  }

  historyToggle.addEventListener('click', () => {
    const isHidden = historyPanel.classList.contains('hidden');
    togglePanel(historyPanel, isHidden);
    togglePanel(customPanel, false);
  });

  settingsToggle.addEventListener('click', () => {
    const isHidden = customPanel.classList.contains('hidden');
    togglePanel(customPanel, isHidden);
    togglePanel(historyPanel, false);
  });

  closeHistory.addEventListener('click', () => togglePanel(historyPanel, false));
  closeCustom.addEventListener('click', () => togglePanel(customPanel, false));

  // ---------- Theme switching ----------
  themeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        applyTheme(e.target.value);
        localStorage.setItem('calcTheme', e.target.value);
      }
    });
  });

  function applyTheme(theme) {
    body.className = ''; // reset
    if (theme === 'light') body.classList.add('light');
    else if (theme === 'combo') body.classList.add('combo');
  }

  // ---------- Customization ----------
  glowColorInput.addEventListener('input', updateCustomCSS);
  glowIntensityInput.addEventListener('input', updateCustomCSS);
  btnFontSizeInput.addEventListener('input', updateCustomCSS);
  btnRadiusInput.addEventListener('input', updateCustomCSS);

  function updateCustomCSS() {
    const color = glowColorInput.value;
    const intensity = glowIntensityInput.value + 'px';
    const fontSize = btnFontSizeInput.value + 'rem';
    const radius = btnRadiusInput.value + 'px';

    document.documentElement.style.setProperty('--glow-color', color);
    document.documentElement.style.setProperty('--glow-spread', intensity);
    document.documentElement.style.setProperty('--btn-font', fontSize);
    document.documentElement.style.setProperty('--btn-radius', radius);

    // Save to localStorage
    localStorage.setItem('calcCustom', JSON.stringify({
      color, intensity, fontSize, radius
    }));
  }

  function applyCustomPrefs(prefs) {
    if (prefs.color) glowColorInput.value = prefs.color;
    if (prefs.intensity) glowIntensityInput.value = parseInt(prefs.intensity);
    if (prefs.fontSize) btnFontSizeInput.value = parseFloat(prefs.fontSize);
    if (prefs.radius) btnRadiusInput.value = parseInt(prefs.radius);
    updateCustomCSS();
  }

  resetCustomBtn.addEventListener('click', () => {
    localStorage.removeItem('calcCustom');
    // Reset inputs to default values
    glowColorInput.value = '#00ffff';
    glowIntensityInput.value = 15;
    btnFontSizeInput.value = 1.2;
    btnRadiusInput.value = 10;
    updateCustomCSS();
  });

  // ---------- Init ----------
  updateDisplay();
  renderHistory();
});