document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById('fileInput');
  const renameDropZone = document.getElementById('renameDropZone');
  const renamePattern = document.getElementById('renamePattern');
  const startIndex = document.getElementById('startIndex');
  const dateFormat = document.getElementById('dateFormat');
  const previewRenameBtn = document.getElementById('previewRenameBtn');
  const applyRenameBtn = document.getElementById('applyRenameBtn');
  const fileListBody = document.getElementById('fileListBody');
  const renameActions = document.getElementById('renameActions');
  const downloadRenamedBtn = document.getElementById('downloadRenamedBtn');
  const downloadZipBtn = document.getElementById('downloadZipBtn');
  
  let files = [];
  let renamedFiles = [];
  
  // 文件选择处理
  fileInput.addEventListener('change', function() {
    files = Array.from(this.files);
    updateFileList();
  });
  
  // 拖放处理
  renameDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    renameDropZone.classList.add('dragover');
  });
  
  renameDropZone.addEventListener('dragleave', () => {
    renameDropZone.classList.remove('dragover');
  });
  
  renameDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    renameDropZone.classList.remove('dragover');
    files = Array.from(e.dataTransfer.files);
    updateFileList();
  });
  
  // 预览重命名
  previewRenameBtn.addEventListener('click', function() {
    if (files.length === 0) {
      App.showNotification('请先选择文件', 'error');
      return;
    }
    
    const pattern = renamePattern.value.trim() || '{ORIGINAL}';
    const startIdx = parseInt(startIndex.value) || 1;
    const date = new Date();
    
    // 获取日期字符串
    let dateStr = '';
    switch (dateFormat.value) {
      case 'YYYY-MM-DD':
        dateStr = date.toISOString().split('T')[0];
        break;
      case 'YYYYMMDD':
        dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        break;
      case 'DD-MM-YYYY':
        const [year, month, day] = date.toISOString().split('T')[0].split('-');
        dateStr = `${day}-${month}-${year}`;
        break;
      case 'MM-DD-YYYY':
        const [y, m, d] = date.toISOString().split('T')[0].split('-');
        dateStr = `${m}-${d}-${y}`;
        break;
    }
    
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '');
    
    renamedFiles = files.map((file, index) => {
      const originalName = file.name.substring(0, file.name.lastIndexOf('.'));
      const ext = file.name.substring(file.name.lastIndexOf('.'));
      
      let newName = pattern
        .replace(/{INDEX}/g, (startIdx + index).toString().padStart(3, '0'))
        .replace(/{DATE}/g, dateStr)
        .replace(/{TIME}/g, timeStr)
        .replace(/{ORIGINAL}/g, originalName)
        .replace(/{EXT}/g, ext);
      
      return {
        originalFile: file,
        originalName: file.name,
        newName: newName,
        size: file.size
      };
    });
    
    updateFileList();
    applyRenameBtn.classList.remove('hidden');
  });
  
  // 应用重命名
  applyRenameBtn.addEventListener('click', function() {
    renameActions.classList.remove('hidden');
  });
  
  // 下载重命名文件
  downloadRenamedBtn.addEventListener('click', function() {
    renamedFiles.forEach(file => {
      const blob = new Blob([file.originalFile], {type: file.originalFile.type});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.newName;
      a.click();
      URL.revokeObjectURL(url);
    });
  });
  
  // 下载为ZIP
  downloadZipBtn.addEventListener('click', async function() {
    App.showNotification('正在创建ZIP文件...', 'info');
    
    try {
      const zip = new JSZip();
      
      for (const file of renamedFiles) {
        zip.file(file.newName, file.originalFile);
      }
      
      const content = await zip.generateAsync({type: 'blob'});
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'renamed_files.zip';
      a.click();
      URL.revokeObjectURL(url);
      
      App.showNotification('ZIP文件已创建', 'success');
    } catch (error) {
      App.showNotification(`创建ZIP失败: ${error.message}`, 'error');
      console.error(error);
    }
  });
  
  // 更新文件列表
  function updateFileList() {
    fileListBody.innerHTML = '';
    
    const filesToShow = renamedFiles.length > 0 ? renamedFiles : 
      files.map(file => ({
        originalName: file.name,
        newName: file.name,
        size: file.size
      }));
    
    filesToShow.forEach(file => {
      const row = document.createElement('tr');
      
      const originalNameCell = document.createElement('td');
      originalNameCell.textContent = file.originalName;
      
      const newNameCell = document.createElement('td');
      newNameCell.textContent = file.newName;
      
      const sizeCell = document.createElement('td');
      sizeCell.textContent = App.formatFileSize(file.size);
      
      row.appendChild(originalNameCell);
      row.appendChild(newNameCell);
      row.appendChild(sizeCell);
      
      fileListBody.appendChild(row);
    });
  }
});
