document.addEventListener('DOMContentLoaded', function() {
  const originalText = document.getElementById('originalText');
  const modifiedText = document.getElementById('modifiedText');
  const diffMode = document.getElementById('diffMode');
  const ignoreWhitespace = document.getElementById('ignoreWhitespace');
  const ignoreCase = document.getElementById('ignoreCase');
  const compareTextBtn = document.getElementById('compareTextBtn');
  const textDiffResults = document.getElementById('textDiffResults');
  const textDiffViewer = document.getElementById('textDiffViewer');
  
  // 比较文本
  compareTextBtn.addEventListener('click', function() {
    const oldText = originalText.value;
    const newText = modifiedText.value;
    
    if (!oldText || !newText) {
      App.showNotification('请在两栏中输入要比较的文本', 'error');
      return;
    }
    
    let diff;
    const options = {
      ignoreWhitespace: ignoreWhitespace.checked,
      ignoreCase: ignoreCase.checked
    };
    
    switch (diffMode.value) {
      case 'chars':
        diff = Diff.diffChars(oldText, newText, options);
        break;
      case 'words':
        diff = Diff.diffWords(oldText, newText, options);
        break;
      case 'lines':
        diff = Diff.diffLines(oldText, newText, options);
        break;
      default:
        diff = Diff.diffWords(oldText, newText, options);
    }
    
    displayDiff(diff);
    textDiffResults.classList.remove('hidden');
  });
  
  // 显示差异结果
  function displayDiff(diff) {
    textDiffViewer.innerHTML = '';
    
    diff.forEach(part => {
      const span = document.createElement('span');
      span.className = part.added ? 'added' : 
                       part.removed ? 'removed' : 'unchanged';
      span.textContent = part.value;
      textDiffViewer.appendChild(span);
    });
  }
});
