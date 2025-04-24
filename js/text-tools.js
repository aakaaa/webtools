document.addEventListener('DOMContentLoaded', function() {
  const textInput = document.getElementById('textInput');
  const textFileInput = document.getElementById('textFileInput');
  const countBtn = document.getElementById('countBtn');
  const copyCounterResults = document.getElementById('copyCounterResults');
  
  // 文件拖放处理
  textInput.addEventListener('dragover', (e) => {
    e.preventDefault();
    textInput.classList.add('dragover');
  });
  
  textInput.addEventListener('dragleave', () => {
    textInput.classList.remove('dragover');
  });
  
  textInput.addEventListener('drop', (e) => {
    e.preventDefault();
    textInput.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file) {
      readTextFile(file);
    }
  });
  
  // 文件选择处理
  textFileInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
      readTextFile(this.files[0]);
    }
  });
  
  // 读取文本文件
  function readTextFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      textInput.value = e.target.result;
    };
    reader.readAsText(file);
  }
  
  // 统计文本
  countBtn.addEventListener('click', function() {
    const text = textInput.value;
    
    // 字符数(含空格)
    const charCountWithSpaces = text.length;
    
    // 字符数(不含空格)
    const charCountWithoutSpaces = text.replace(/\s+/g, '').length;
    
    // 单词数(英文)
    const wordCount = text.trim() === '' ? 0 : 
      text.split(/\s+/).filter(word => word.length > 0).length;
    
    // 行数
    const lineCount = text.trim() === '' ? 0 : 
      text.split('\n').filter(line => line.trim().length > 0).length;
    
    // 更新UI
    document.getElementById('charCountWithSpaces').textContent = charCountWithSpaces;
    document.getElementById('charCountWithoutSpaces').textContent = charCountWithoutSpaces;
    document.getElementById('wordCount').textContent = wordCount;
    document.getElementById('lineCount').textContent = lineCount;
  });
  
  // 复制结果
  copyCounterResults.addEventListener('click', function() {
    const results = `字符数(含空格): ${document.getElementById('charCountWithSpaces').textContent}
字符数(不含空格): ${document.getElementById('charCountWithoutSpaces').textContent}
单词数: ${document.getElementById('wordCount').textContent}
行数: ${document.getElementById('lineCount').textContent}`;
    
    navigator.clipboard.writeText(results).then(() => {
      App.showNotification('统计结果已复制', 'success');
    });
  });
});
