document.addEventListener('DOMContentLoaded', function() {
    const mergeFilesInput = document.getElementById('mergeFiles');
    const mergeBtn = document.getElementById('mergeBtn');
    const progressText = document.getElementById('progressText');
    const progressBar = document.getElementById('progressBar');
    const logOutput = document.getElementById('logOutput');
    const fileListItems = document.getElementById('fileListItems');
    const resultSection = document.getElementById('resultSection');
    const downloadLink = document.getElementById('downloadLink');
    
    let filesToMerge = [];
    let processing = false;
    
    // 监听文件选择
    mergeFilesInput.addEventListener('change', function() {
        filesToMerge = Array.from(this.files);
        updateFileList();
    });
    
    // 更新文件列表显示
    function updateFileList() {
        fileListItems.innerHTML = '';
        
        if (filesToMerge.length === 0) {
            fileListItems.innerHTML = '<li>暂无文件</li>';
            return;
        }
        
        // 按修改时间排序
        filesToMerge.sort((a, b) => a.lastModified - b.lastModified);
        
        filesToMerge.forEach((file, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${file.name} (${formatDate(file.lastModified)})`;
            fileListItems.appendChild(li);
        });
    }
    
    // 格式化日期
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
    }
    
    function padZero(num) {
        return num.toString().padStart(2, '0');
    }
    
    // 合并文件
    mergeBtn.addEventListener('click', async function() {
        if (processing) return;
        processing = true;
        
        if (filesToMerge.length < 2) {
            updateProgress('请至少选择2个文件进行合并', 'error');
            processing = false;
            return;
        }
        
        // 重置UI
        logOutput.innerHTML = '';
        resultSection.classList.add('hidden');
        updateProgress('开始合并...', 0);
        
        try {
            const mergeOption = document.getElementById('mergeOption').value;
            const includeHeader = document.getElementById('includeHeader').value;
            const outputSheetName = document.getElementById('outputSheetName').value || '合并数据';
            
            // 读取所有文件
            updateProgress('正在读取文件...', 10);
            const workbooks = [];
            
            for (let i = 0; i < filesToMerge.length; i++) {
                const file = filesToMerge[i];
                updateProgress(`正在读取文件 ${i + 1}/${filesToMerge.length}: ${file.name}`, 10 + (i / filesToMerge.length) * 30);
                
                const data = await readFileAsArrayBuffer(file);
                const workbook = XLSX.read(data, { type: 'array' });
                workbooks.push(workbook);
                
                addLog(`已加载文件: ${file.name}`);
            }
            
            // 合并数据
            updateProgress('正在合并数据...', 50);
            const mergedData = [];
            let headers = [];
            
            if (mergeOption === 'vertical') {
                // 垂直合并
                for (let i = 0; i < workbooks.length; i++) {
                    const workbook = workbooks[i];
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    if (i === 0) {
                        // 第一个文件
                        headers = jsonData[0];
                        mergedData.push(...jsonData);
                        
                        if (includeHeader === 'none') {
                            mergedData.shift(); // 移除表头
                        }
                    } else {
                        // 后续文件
                        if (includeHeader === 'all') {
                            mergedData.push(...jsonData);
                        } else {
                            mergedData.push(...jsonData.slice(1));
                        }
                    }
                }
            } else {
                // 水平合并
                for (let i = 0; i < workbooks.length; i++) {
                    const workbook = workbooks[i];
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    if (i === 0) {
                        // 第一个文件
                        headers = jsonData[0];
                        mergedData.push(...jsonData);
                        
                        if (includeHeader === 'none') {
                            mergedData.shift(); // 移除表头
                        }
                    } else {
                        // 后续文件
                        const currentHeaders = jsonData[0];
                        const currentData = includeHeader === 'all' ? jsonData : jsonData.slice(1);
                        
                        // 合并表头
                        if (includeHeader !== 'none') {
                            headers = headers.concat(currentHeaders);
                        }
                        
                        // 合并数据
                        for (let j = 0; j < currentData.length; j++) {
                            if (j < mergedData.length) {
                                mergedData[j] = mergedData[j].concat(currentData[j]);
                            } else {
                                mergedData.push(currentData[j]);
                            }
                        }
                    }
                }
            }
            
            // 创建新工作簿
            updateProgress('正在生成合并文件...', 90);
            const newWorkbook = XLSX.utils.book_new();
            const newWorksheet = XLSX.utils.aoa_to_sheet(mergedData);
            XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, outputSheetName);
            
            // 生成下载链接
            const wbout = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            
            downloadLink.href = url;
            downloadLink.download = '合并结果_' + formatDate(Date.now()) + '.xlsx';
            downloadLink.textContent = '下载合并文件';
            
            // 显示结果
            resultSection.classList.remove('hidden');
            updateProgress('合并完成!', 100);
            addLog(`成功合并 ${filesToMerge.length} 个文件`);
            
        } catch (error) {
            updateProgress(`合并出错: ${error.message}`, 'error');
            addLog(`错误: ${error.message}`);
            console.error(error);
        } finally {
            processing = false;
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
    
    function updateProgress(message, progress) {
        progressText.textContent = message;
        
        if (typeof progress === 'number') {
            progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
            progressBar.className = 'progress';
        } else if (progress === 'error') {
            progressBar.style.width = '100%';
            progressBar.className = 'progress error';
        }
    }
    
    function addLog(message) {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logOutput.appendChild(logEntry);
        logOutput.scrollTop = logOutput.scrollHeight;
    }
});
