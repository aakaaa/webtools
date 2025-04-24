document.addEventListener('DOMContentLoaded', function() {
    // 标签页切换
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // 更新按钮状态
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // 更新内容显示
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // PDF合并功能
    const pdfMergeFilesInput = document.getElementById('pdfMergeFiles');
    const mergeOrderSelect = document.getElementById('mergeOrder');
    const customOrderContainer = document.getElementById('customOrderContainer');
    const pdfSortableList = document.getElementById('pdfSortableList');
    const mergePdfBtn = document.getElementById('mergePdfBtn');
    
    let pdfFilesToMerge = [];
    
    // 监听合并顺序选择
    mergeOrderSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customOrderContainer.classList.remove('hidden');
            updateSortableList();
        } else {
            customOrderContainer.classList.add('hidden');
        }
    });
    
    // 监听PDF文件选择
    pdfMergeFilesInput.addEventListener('change', function() {
        pdfFilesToMerge = Array.from(this.files);
        updateSortableList();
    });
    
    // 更新可排序列表
    function updateSortableList() {
        pdfSortableList.innerHTML = '';
        
        if (pdfFilesToMerge.length === 0) {
            pdfSortableList.innerHTML = '<li>暂无文件</li>';
            return;
        }
        
        // 按选择的排序方式初始化
        if (mergeOrderSelect.value === 'filename') {
            pdfFilesToMerge.sort((a, b) => a.name.localeCompare(b.name));
        } else if (mergeOrderSelect.value === 'upload') {
            // 保持上传顺序
        }
        
        pdfFilesToMerge.forEach(file => {
            const li = document.createElement('li');
            li.textContent = file.name;
            li.draggable = true;
            pdfSortableList.appendChild(li);
        });
        
        // 使列表可拖拽排序
        makeSortable(pdfSortableList);
    }
    
    // 使列表可拖拽排序
    function makeSortable(list) {
        let draggedItem = null;
        
        list.querySelectorAll('li').forEach(item => {
            item.addEventListener('dragstart', function() {
                draggedItem = this;
                setTimeout(() => this.style.opacity = '0.4', 0);
            });
            
            item.addEventListener('dragend', function() {
                setTimeout(() => this.style.opacity = '1', 0);
                draggedItem = null;
            });
            
            item.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.style.borderTop = '2px solid #3498db';
            });
            
            item.addEventListener('dragleave', function() {
                this.style.borderTop = '';
            });
            
            item.addEventListener('drop', function(e) {
                e.preventDefault();
                this.style.borderTop = '';
                if (draggedItem !== this) {
                    list.insertBefore(draggedItem, this);
                    updateFilesOrder();
                }
            });
        });
    }
    
    // 更新文件顺序
    function updateFilesOrder() {
        const newOrder = Array.from(pdfSortableList.children).map(li => 
            pdfFilesToMerge.find(file => file.name === li.textContent)
        );
        pdfFilesToMerge = newOrder.filter(file => file !== undefined);
    }
    
    // 合并PDF
    mergePdfBtn.addEventListener('click', async function() {
        if (pdfFilesToMerge.length < 2) {
            updateProgress('merge', '请至少选择2个PDF文件进行合并', 'error');
            return;
        }
        
        const progressText = document.getElementById('mergeProgressText');
        const progressBar = document.getElementById('mergeProgressBar');
        const logOutput = document.getElementById('mergeLogOutput');
        const resultSection = document.getElementById('mergeResultSection');
        const downloadLink = document.getElementById('mergeDownloadLink');
        
        // 重置UI
        logOutput.innerHTML = '';
        resultSection.classList.add('hidden');
        updateProgress('merge', '开始合并PDF...', 0);
        
        try {
            const { PDFDocument } = PDFLib;
            const mergedPdf = await PDFDocument.create();
            
            for (let i = 0; i < pdfFilesToMerge.length; i++) {
                const file = pdfFilesToMerge[i];
                updateProgress('merge', `正在处理文件 ${i + 1}/${pdfFilesToMerge.length}: ${file.name}`, 10 + (i / pdfFilesToMerge.length) * 80);
                
                const fileData = await readFileAsArrayBuffer(file);
                const pdfDoc = await PDFDocument.load(fileData);
                
                const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
                
                addLog('merge', `已添加文件: ${file.name}`);
            }
            
            updateProgress('merge', '正在生成合并文件...', 90);
            const mergedPdfBytes = await mergedPdf.save();
            const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            downloadLink.href = url;
            downloadLink.download = '合并PDF_' + formatDate(Date.now()) + '.pdf';
            downloadLink.textContent = '下载合并PDF';
            
            // 显示结果
            resultSection.classList.remove('hidden');
            updateProgress('merge', '合并完成!', 100);
            addLog('merge', `成功合并 ${pdfFilesToMerge.length} 个PDF文件`);
            
        } catch (error) {
            updateProgress('merge', `合并出错: ${error.message}`, 'error');
            addLog('merge', `错误: ${error.message}`);
            console.error(error);
        }
    });
    
    // 辅助函数
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
    
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        return `${date.getFullYear()}${padZero(date.getMonth() + 1)}${padZero(date.getDate())}_${padZero(date.getHours())}${padZero(date.getMinutes())}`;
    }
    
    function padZero(num) {
        return num.toString().padStart(2, '0');
    }
    
    function updateProgress(tab, message, progress) {
        const progressText = document.getElementById(`${tab}ProgressText`);
        const progressBar = document.getElementById(`${tab}ProgressBar`);
        
        progressText.textContent = message;
        
        if (typeof progress === 'number') {
            progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
            progressBar.className = 'progress';
        } else if (progress === 'error') {
            progressBar.style.width = '100%';
            progressBar.className = 'progress error';
        }
    }
    
    function addLog(tab, message) {
        const logOutput = document.getElementById(`${tab}LogOutput`);
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logOutput.appendChild(logEntry);
        logOutput.scrollTop = logOutput.scrollHeight;
    }
});
