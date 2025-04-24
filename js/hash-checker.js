document.addEventListener('DOMContentLoaded', function() {
  const hashFileInput = document.getElementById('hashFileInput');
  const hashDropZone = document.getElementById('hashDropZone');
  const calculateHashBtn = document.getElementById('calculateHashBtn');
  const hashResults = document.getElementById('hashResults');
  const hashProgress = document.getElementById('hashProgress');
  const hashProgressBar = document.getElementById('hashProgressBar');
  const hashProgressText = document.getElementById('hashProgressText');
  
  // 计算哈希值
  calculateHashBtn.addEventListener('click', async function() {
    if (!hashFileInput.files || hashFileInput.files.length === 0) {
      App.showNotification('请先选择文件', 'error');
      return;
    }
    
    const file = hashFileInput.files[0];
    const algorithms = Array.from(document.querySelectorAll('input[name="hashAlgorithm"]:checked'))
      .map(el => el.value);
    
    if (algorithms.length === 0) {
      App.showNotification('请至少选择一种哈希算法', 'error');
      return;
    }
    
    hashProgress.classList.remove('hidden');
    hashProgressBar.style.width = '0%';
    hashProgressText.textContent = '正在计算...';
    
    try {
      // 隐藏所有结果
      document.querySelectorAll('.result-item').forEach(el => {
        el.classList.add('hidden');
      });
      
      // 读取文件为ArrayBuffer
      const buffer = await App.readFileAsArrayBuffer(file);
      
      // 计算选中的哈希值
      for (const alg of algorithms) {
        const hash = await calculateHash(buffer, alg);
        const elementId = `${alg}Hash`;
        const resultElement = document.getElementById(`${alg}Result`);
        
        document.getElementById(elementId).textContent = hash;
        resultElement.classList.remove('hidden');
        
        // 更新进度
        const progress = (algorithms.indexOf(alg) + 1 / algorithms.length * 100;
        hashProgressBar.style.width = `${progress}%`;
        hashProgressText.textContent = `正在计算 ${alg.toUpperCase()}...`;
      }
      
      hashProgress.classList.add('hidden');
      App.showNotification('哈希计算完成', 'success');
    } catch (error) {
      console.error(error);
      hashProgress.classList.add('hidden');
      App.showNotification('计算哈希失败', 'error');
    }
  });
  
  // 复制哈希值
  document.querySelectorAll('.copy-hash-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const hash = document.getElementById(targetId).textContent;
      
      navigator.clipboard.writeText(hash).then(() => {
        App.showNotification('哈希值已复制', 'success');
      });
    });
  });
  
  // 计算哈希值函数
  async function calculateHash(buffer, algorithm) {
    // 使用Web Crypto API计算哈希
    const hashBuffer = await crypto.subtle.digest(algorithm.toUpperCase(), buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // 拖放处理
  hashDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    hashDropZone.classList.add('dragover');
  });
  
  hashDropZone.addEventListener('dragleave', () => {
    hashDropZone.classList.remove('dragover');
  });
  
  hashDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    hashDropZone.classList.remove('dragover');
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      hashFileInput.files = e.dataTransfer.files;
    }
  });
});
