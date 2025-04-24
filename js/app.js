/**
 * 文件处理工具箱 - 主应用逻辑
 * 包含全局功能、工具初始化和公共方法
 */

// 全局状态管理
const AppState = {
  currentTool: null,
  isProcessing: false
};

// DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', function() {
  initToolNavigation();
  initGlobalEventListeners();
  initServiceWorker();
  setCopyrightYear();
});

/**
 * 初始化工具导航系统
 */
function initToolNavigation() {
  // 获取当前页面路径确定当前工具
  const path = window.location.pathname.split('/').pop() || 'index.html';
  AppState.currentTool = path.replace('.html', '');

  // 高亮当前导航项
  if (AppState.currentTool !== 'index') {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      if (link.getAttribute('href').includes(AppState.currentTool)) {
        link.classList.add('active');
      }
    });
  }

  // 初始化返回首页按钮
  const backLinks = document.querySelectorAll('.back-link');
  backLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      if (window.history.length > 1) {
        e.preventDefault();
        window.history.back();
      }
    });
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
      
      const fileInput = this.querySelector('input[type="file"]');
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
  if ('serviceWorker' in navigator) {
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
 * 显示全局通知
 * @param {string} message 通知消息
 * @param {string} type 通知类型 (success, error, warning, info)
 */
function showGlobalNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `global-notification ${type}`;
  notification.textContent = message;
  
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
 * @param {string} toolId 工具ID
 * @param {string} message 进度消息
 * @param {number|string} progress 进度百分比或'error'
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
 * @param {string} toolId 工具ID
 * @param {string} message 日志消息
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
 * @param {File} file 文件对象
 * @returns {Promise<ArrayBuffer>}
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
 * @param {File} file 文件对象
 * @returns {Promise<string>}
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
 * @param {number} bytes 字节数
 * @returns {string} 格式化后的文件大小
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 生成随机ID
 * @param {number} length ID长度
 * @returns {string} 随机ID
 */
function generateRandomId(length = 8) {
  return Math.random().toString(36).substr(2, length);
}

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {number} delay 延迟时间(ms)
 * @returns {Function} 节流后的函数
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
 * @param {Function} func 要防抖的函数
 * @param {number} delay 延迟时间(ms)
 * @returns {Function} 防抖后的函数
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
  debounce
};
