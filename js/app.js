/**
 * 文件处理工具箱 - 主应用逻辑
 * 包含全局功能、工具初始化和公共方法
 */

// 全局状态管理
const AppState = {
  currentTool: null,
  isProcessing: false,
  userPreferences: {
    theme: 'light',
    language: 'zh-CN',
    recentTools: []
  }
};

// DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', function() {
  initToolNavigation();
  initGlobalEventListeners();
  initServiceWorker();
  setCopyrightYear();
  loadUserPreferences();
  initThemeToggle();
});

/**
 * 初始化工具导航系统
 */
function initToolNavigation() {
  // 获取当前页面路径确定当前工具
  const path = window.location.pathname.split('/').pop() || 'index.html';
  AppState.currentTool = path.replace('.html', '');
  
  // 更新最近使用工具
  if (AppState.currentTool !== 'index') {
    updateRecentTools(AppState.currentTool);
  }

  // 高亮当前导航项
  const navLinks = document.querySelectorAll('.nav-link, .tool-card');
  navLinks.forEach(link => {
    if (link.getAttribute('href').includes(AppState.currentTool)) {
      link.classList.add('active');
    }
  });
}

/**
 * 初始化全局事件监听器
 */
function initGlobalEventListeners() {
  // 文件拖放功能
  const dropZones = document.querySelectorAll('.drop-zone');
  
  dropZones.forEach(zone => {
    zone.addEventListener('dragover', function(e) {
      e.preventDefault();
      this.classList.add('dragover');
    });
    
    zone.addEventListener('dragleave', function() {
      this.classList.remove('dragover');
    });
    
    zone.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('dragover');
      
      const fileInput = this.querySelector('input[type="file"]') || 
                       document.querySelector(`#${this.id.replace('DropZone', 'Input')}`);
      if (fileInput) {
        fileInput.files = e.dataTransfer.files;
        const event = new Event('change');
        fileInput.dispatchEvent(event);
      }
    });
  });

  // 全局错误处理
  window.addEventListener('error', function(e) {
    console.error('全局错误:', e.error);
    showGlobalNotification(`发生错误: ${e.message}`, 'error');
  });

  // 离线状态检测
  window.addEventListener('offline', function() {
    showGlobalNotification('您已离线，部分功能可能不可用', 'warning');
  });

  window.addEventListener('online', function() {
    showGlobalNotification('网络连接已恢复', 'success');
  });
}

/**
 * 注册Service Worker
 */
function initServiceWorker() {
  if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker注册成功:', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker注册失败:', error);
      });
  }
}

/**
 * 设置版权年份
 */
function setCopyrightYear() {
  const yearElements = document.querySelectorAll('.copyright-year');
  const currentYear = new Date().getFullYear();
  
  yearElements.forEach(el => {
    el.textContent = currentYear;
  });
}

/**
 * 初始化主题切换
 */
function initThemeToggle() {
  const themeToggle = document.createElement('div');
  themeToggle.className = 'theme-toggle';
  themeToggle.innerHTML = `
    <button id="themeToggleBtn">
      <i class="fas fa-moon"></i>
      <span>暗色模式</span>
    </button>
  `;
  document.body.insertBefore(themeToggle, document.body.firstChild);
  
  document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
}

/**
 * 切换主题
 */
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-theme');
  AppState.userPreferences.theme = isDark ? 'dark' : 'light';
  saveUserPreferences();
  
  const btn = document.getElementById('themeToggleBtn');
  btn.querySelector('i').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
  btn.querySelector('span').textContent = isDark ? '亮色模式' : '暗色模式';
}

/**
 * 加载用户偏好设置
 */
function loadUserPreferences() {
  const savedPrefs = localStorage.getItem('fileToolsPreferences');
  if (savedPrefs) {
    AppState.userPreferences = JSON.parse(savedPrefs);
  }
  
  // 应用主题
  if (AppState.userPreferences.theme === 'dark') {
    document.body.classList.add('dark-theme');
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.querySelector('i').className = 'fas fa-sun';
      btn.querySelector('span').textContent = '亮色模式';
    }
  }
}

/**
 * 保存用户偏好设置
 */
function saveUserPreferences() {
  localStorage.setItem('fileToolsPreferences', JSON.stringify(AppState.userPreferences));
}

/**
 * 更新最近使用工具
 */
function updateRecentTools(toolId) {
  const recentTools = AppState.userPreferences.recentTools;
  const index = recentTools.indexOf(toolId);
  
  if (index !== -1) {
    recentTools.splice(index, 1);
  }
  
  recentTools.unshift(toolId);
  
  // 最多保存5个最近工具
  if (recentTools.length > 5) {
    recentTools.pop();
  }
  
  saveUserPreferences();
}

/**
 * 显示全局通知
 */
function showGlobalNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `global-notification ${type}`;
  notification.innerHTML = `
    <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 
                   type === 'success' ? 'fa-check-circle' : 
                   type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 3000);
}

/**
 * 通用文件处理进度更新
 */
function updateProgress(toolId, message, progress) {
  const progressText = document.getElementById(`${toolId}ProgressText`);
  const progressBar = document.getElementById(`${toolId}ProgressBar`);
  
  if (!progressText || !progressBar) return;
  
  progressText.textContent = message;
  
  if (typeof progress === 'number') {
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    progressBar.className = 'progress';
  } else if (progress === 'error') {
    progressBar.style.width = '100%';
    progressBar.className = 'progress error';
  }
}

/**
 * 添加日志条目
 */
function addLog(toolId, message) {
  const logOutput = document.getElementById(`${toolId}LogOutput`);
  if (!logOutput) return;
  
  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry';
  logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logOutput.appendChild(logEntry);
  logOutput.scrollTop = logOutput.scrollHeight;
}

/**
 * 读取文件为ArrayBuffer
 */
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 读取文件为DataURL
 */
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * 生成随机ID
 */
function generateRandomId(length = 8) {
  return Math.random().toString(36).substr(2, length);
}

/**
 * 节流函数
 */
function throttle(func, delay = 100) {
  let lastCall = 0;
  return function(...args) {
    const now = new Date().getTime();
    if (now - lastCall < delay) return;
    lastCall = now;
    return func.apply(this, args);
  };
}

/**
 * 防抖函数
 */
function debounce(func, delay = 100) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// 导出公共方法
window.App = {
  showNotification: showGlobalNotification,
  updateProgress,
  addLog,
  readFileAsArrayBuffer,
  readFileAsDataURL,
  formatFileSize,
  generateRandomId,
  throttle,
  debounce,
  state: AppState
};
