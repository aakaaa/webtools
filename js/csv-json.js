document.addEventListener('DOMContentLoaded', function() {
  const csvInput = document.getElementById('csvInput');
  const csvFileInput = document.getElementById('csvFileInput');
  const csvDelimiter = document.getElementById('csvDelimiter');
  const customDelimiter = document.getElementById('customDelimiter');
  const convertToJsonBtn = document.getElementById('convertToJsonBtn');
  const jsonOutput = document.getElementById('jsonOutput');
  
  // 分隔符选择变化
  csvDelimiter.addEventListener('change', function() {
    customDelimiter.classList.toggle('hidden', this.value !== 'custom');
  });
  
  // 文件拖放处理
  csvInput.addEventListener('dragover', (e) => {
    e.preventDefault();
    csvInput.classList.add('dragover');
  });
  
  csvInput.addEventListener('dragleave', () => {
    csvInput.classList.remove('dragover');
  });
  
  csvInput.addEventListener('drop', (e) => {
    e.preventDefault();
    csvInput.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file) {
      readCsvFile(file);
    }
  });
  
  // 文件选择处理
  csvFileInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
      readCsvFile(this.files[0]);
    }
  });
  
  // 读取CSV文件
  function readCsvFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      csvInput.value = e.target.result;
    };
    reader.readAsText(file);
  }
  
  // 转换为JSON
  convertToJsonBtn.addEventListener('click', function() {
    const csvText = csvInput.value.trim();
    if (!csvText) {
      App.showNotification('请输入CSV内容', 'error');
      return;
    }
    
    let delimiter = csvDelimiter.value;
    if (delimiter === 'custom') {
      delimiter = customDelimiter.value;
    }
    
    const hasHeader = document.getElementById('csvHasHeader').checked;
    
    try {
      const jsonData = csvToJson(csvText, delimiter, hasHeader);
      jsonOutput.textContent = JSON.stringify(jsonData, null, 2);
      
      // 显示操作按钮
      document.querySelector('.tool-buttons').classList.remove('hidden');
    } catch (error) {
      App.showNotification(`转换失败: ${error.message}`, 'error');
      console.error(error);
    }
  });
  
  // CSV转JSON函数
  function csvToJson(csvText, delimiter = ',', hasHeader = true) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    
    const headers = hasHeader ? 
      lines.shift().split(delimiter).map(h => h.trim()) : 
      Array.from({length: lines[0].split(delimiter).length}, (_, i) => `column_${i+1}`);
    
    return lines.map(line => {
      const values = line.split(delimiter);
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = values[i] ? values[i].trim() : '';
      });
      return obj;
    });
  }
  
  // 复制JSON
  document.getElementById('copyJsonBtn').addEventListener('click', function() {
    navigator.clipboard.writeText(jsonOutput.textContent).then(() => {
      App.showNotification('JSON已复制', 'success');
    });
  });
  
  // 下载JSON
  document.getElementById('downloadJsonBtn').addEventListener('click', function() {
    const blob = new Blob([jsonOutput.textContent], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.json';
    a.click();
    URL.revokeObjectURL(url);
  });
  
  // 格式化JSON
  document.getElementById('formatJsonBtn').addEventListener('click', function() {
    try {
      const jsonData = JSON.parse(jsonOutput.textContent);
      jsonOutput.textContent = JSON.stringify(jsonData, null, 2);
    } catch (error) {
      App.showNotification('无效的JSON格式', 'error');
    }
  });
  
  // 压缩JSON
  document.getElementById('minifyJsonBtn').addEventListener('click', function() {
    try {
      const jsonData = JSON.parse(jsonOutput.textContent);
      jsonOutput.textContent = JSON.stringify(jsonData);
    } catch (error) {
      App.showNotification('无效的JSON格式', 'error');
    }
  });
});
