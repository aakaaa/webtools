// Excel分类工具核心逻辑
document.addEventListener('DOMContentLoaded', function() {
    const addRuleBtn = document.getElementById('addRule');
    const rulesContainer = document.getElementById('rulesContainer');
    const processBtn = document.getElementById('processBtn');
    const progressText = document.getElementById('progressText');
    const progressBar = document.getElementById('progressBar');
    const logOutput = document.getElementById('logOutput');
    const resultSection = document.getElementById('resultSection');
    const downloadLink = document.getElementById('downloadLink');
    
    let workbook = null;
    let processing = false;
    
    // 添加规则
    addRuleBtn.addEventListener('click', function() {
        const ruleItem = document.createElement('div');
        ruleItem.className = 'rule-item';
        ruleItem.innerHTML = `
            <input type="text" class="rule-name" placeholder="分类名称" value="分类${rulesContainer.children.length + 1}">
            <input type="text" class="rule-terms" placeholder="匹配关键词,用逗号分隔">
            <button class="remove-rule">删除</button>
        `;
        rulesContainer.appendChild(ruleItem);
        
        // 绑定删除按钮
        ruleItem.querySelector('.remove-rule').addEventListener('click', function() {
            rulesContainer.removeChild(ruleItem);
        });
    });
    
    // 处理Excel文件
    processBtn.addEventListener('click', async function() {
        if (processing) return;
        processing = true;
        
        const fileInput = document.getElementById('excelFile');
        if (!fileInput.files || fileInput.files.length === 0) {
            updateProgress('请先选择Excel文件', 'error');
            processing = false;
            return;
        }
        
        const file = fileInput.files[0];
        const sheetName = document.getElementById('sheetName').value;
        const matchColumn = document.getElementById('matchColumn').value.toUpperCase();
        const outputOption = document.getElementById('outputOption').value;
        
        // 收集规则
        const rules = [];
        const ruleItems = rulesContainer.querySelectorAll('.rule-item');
        if (ruleItems.length === 0) {
            updateProgress('请至少添加一条分类规则', 'error');
            processing = false;
            return;
        }
        
        ruleItems.forEach(item => {
            const name = item.querySelector('.rule-name').value.trim();
            const terms = item.querySelector('.rule-terms').value
                .split(',')
                .map(t => t.trim())
                .filter(t => t.length > 0);
            
            if (name && terms.length > 0) {
                rules.push({ name, terms });
            }
        });
        
        if (rules.length === 0) {
            updateProgress('有效的分类规则为空', 'error');
            processing = false;
            return;
        }
        
        // 重置UI
        logOutput.innerHTML = '';
        resultSection.classList.add('hidden');
        updateProgress('开始处理...', 0);
        
        try {
            // 读取Excel文件
            updateProgress('正在读取Excel文件...', 10);
            const data = await readFileAsArrayBuffer(file);
            workbook = XLSX.read(data, { type: 'array' });
            
            // 获取工作表
            let worksheet;
            if (sheetName && workbook.Sheets[sheetName]) {
                worksheet = workbook.Sheets[sheetName];
                addLog(`使用工作表: ${sheetName}`);
            } else {
                const firstSheetName = workbook.SheetNames[0];
                worksheet = workbook.Sheets[firstSheetName];
                addLog(sheetName ? 
                    `未找到工作表"${sheetName}", 使用第一个工作表: ${firstSheetName}` : 
                    `使用第一个工作表: ${firstSheetName}`);
            }
            
            // 转换为JSON
            updateProgress('正在解析数据...', 20);
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (jsonData.length <= 1) {
                throw new Error('Excel文件中没有足够的数据行');
            }
            
            // 获取匹配列索引
            const headerRow = jsonData[0];
            let matchColIndex = letterToColumn(matchColumn) - 1;
            if (matchColIndex < 0 || matchColIndex >= headerRow.length) {
                addLog(`警告: 匹配列"${matchColumn}"无效, 默认使用第一列`);
                matchColIndex = 0;
            }
            
            // 准备分类数据
            updateProgress('正在分类数据...', 30);
            const classifiedData = {};
            rules.forEach(rule => {
                classifiedData[rule.name] = [headerRow]; // 保留表头
            });
            
            // 未匹配的数据
            const unmatchedData = [headerRow];
            
            // 处理每一行数据
            const totalRows = jsonData.length - 1; // 减去表头
            let processedRows = 0;
            
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                processedRows++;
                const progress = 30 + Math.floor((processedRows / totalRows) * 60);
                updateProgress(`正在处理行 ${processedRows}/${totalRows}`, progress);
                
                const cellValue = row[matchColIndex] ? String(row[matchColIndex]) : '';
                let matched = false;
                
                // 检查每个规则
                for (const rule of rules) {
                    if (rule.terms.some(term => cellValue.includes(term))) {
                        classifiedData[rule.name].push(row);
                        matched = true;
                        break;
                    }
                }
                
                if (!matched) {
                    unmatchedData.push(row);
                }
            }
            
            // 添加未匹配的数据(如果有)
            if (unmatchedData.length > 1) {
                classifiedData['未匹配数据'] = unmatchedData;
                addLog(`发现 ${unmatchedData.length - 1} 行未匹配数据`);
            }
            
            // 生成输出
            updateProgress('正在生成结果...', 95);
            let resultBlob;
            
            if (outputOption === 'single') {
                // 单个Excel文件(多工作表)
                const newWorkbook = XLSX.utils.book_new();
                for (const [name, data] of Object.entries(classifiedData)) {
                    const newWorksheet = XLSX.utils.aoa_to_sheet(data);
                    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, name);
                }
                resultBlob = workbookToBlob(newWorkbook);
                downloadLink.textContent = '下载Excel文件';
            } else {
                // 多个文件或ZIP包
                const zip = new JSZip();
                
                for (const [name, data] of Object.entries(classifiedData)) {
                    const worksheet = XLSX.utils.aoa_to_sheet(data);
                    const newWorkbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(newWorkbook, worksheet, name);
                    
                    const worksheetBlob = workbookToBlob(newWorkbook);
                    zip.file(`${name}.xlsx`, worksheetBlob);
                }
                
                if (outputOption === 'zip') {
                    resultBlob = await zip.generateAsync({ type: 'blob' });
                    downloadLink.textContent = '下载ZIP压缩包';
                } else {
                    // 对于"多个文件"选项，我们仍然提供ZIP下载，因为浏览器无法同时下载多个文件
                    resultBlob = await zip.generateAsync({ type: 'blob' });
                    downloadLink.textContent = '下载ZIP压缩包(包含所有分类文件)';
                }
            }
            
            // 设置下载链接
            const resultUrl = URL.createObjectURL(resultBlob);
            downloadLink.href = resultUrl;
            downloadLink.download = outputOption === 'single' ? '分类结果.xlsx' : '分类结果.zip';
            
            // 显示结果
            resultSection.classList.remove('hidden');
            updateProgress('处理完成!', 100);
            addLog('处理完成，可以下载结果了');
            
        } catch (error) {
            updateProgress(`处理出错: ${error.message}`, 'error');
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
    
    function workbookToBlob(workbook) {
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        return new Blob([wbout], { type: 'application/octet-stream' });
    }
    
    function letterToColumn(letter) {
        let column = 0;
        for (let i = 0; i < letter.length; i++) {
            column = column * 26 + (letter.charCodeAt(i) - 64);
        }
        return column;
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
