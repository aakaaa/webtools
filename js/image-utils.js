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
    
    // 图片转换功能
    const imageConvertFileInput = document.getElementById('imageConvertFile');
    const imageOutputFormatSelect = document.getElementById('imageOutputFormat');
    const jpegOptionsDiv = document.getElementById('jpegOptions');
    const pngOptionsDiv = document.getElementById('pngOptions');
    const jpegQualityInput = document.getElementById('jpegQuality');
    const jpegQualityValue = document.getElementById('jpegQualityValue');
    const pngCompressionInput = document.getElementById('pngCompression');
    const pngCompressionValue = document.getElementById('pngCompressionValue');
    const convertImageBtn = document.getElementById('convertImageBtn');
    
    // 监听输出格式变化
    imageOutputFormatSelect.addEventListener('change', function() {
        jpegOptionsDiv.classList.toggle('hidden', this.value !== 'jpeg');
        pngOptionsDiv.classList.toggle('hidden', this.value !== 'png');
    });
    
    // 更新质量值显示
    jpegQualityInput.addEventListener('input', function() {
        jpegQualityValue.textContent = this.value;
    });
    
    pngCompressionInput.addEventListener('input', function() {
        pngCompressionValue.textContent = this.value;
    });
    
    // 图片预览
    imageConvertFileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const originalPreview = document.getElementById('originalImagePreview');
                originalPreview.src = e.target.result;
                
                // 显示原始图片信息
                const img = new Image();
                img.onload = function() {
                    document.getElementById('originalInfo').textContent = 
                        `尺寸: ${img.width}×${img.height} 像素 | 格式: ${file.type} | 大小: ${formatFileSize(file.size)}`;
                };
                img.src = e.target.result;
            };
            
            reader.readAsDataURL(file);
        }
    });
    
    // 转换图片
    convertImageBtn.addEventListener('click', async function() {
        if (!imageConvertFileInput.files || imageConvertFileInput.files.length === 0) {
            updateProgress('convert', '请先选择图片文件', 'error');
            return;
        }
        
        const file = imageConvertFileInput.files[0];
        const outputFormat = imageOutputFormatSelect.value;
        const progressText = document.getElementById('convertProgressText');
        const progressBar = document.getElementById('convertProgressBar');
        const resultSection = document.getElementById('convertResultSection');
        const downloadLink = document.getElementById('convertDownloadLink');
        
        // 重置UI
        resultSection.classList.add('hidden');
        updateProgress('convert', '开始转换图片...', 10);
        
        try {
            // 读取图片
            const img = await loadImage(file);
            updateProgress('convert', '正在创建画布...', 30);
            
            // 创建canvas
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            updateProgress('convert', '正在转换格式...', 60);
            
            // 转换为目标格式
            let mimeType;
            let quality;
            
            switch (outputFormat) {
                case 'jpeg':
                    mimeType = 'image/jpeg';
                    quality = jpegQualityInput.value / 100;
                    break;
                case 'png':
                    mimeType = 'image/png';
                    // PNG压缩级别在浏览器中支持有限
                    break;
                case 'webp':
                    mimeType = 'image/webp';
                    quality = 0.8; // 默认质量
                    break;
                case 'bmp':
                    mimeType = 'image/bmp';
                    break;
                case 'gif':
                    mimeType = 'image/gif';
                    break;
                default:
                    mimeType = 'image/jpeg';
                    quality = 0.8;
            }
            
            // 转换并获取Blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, mimeType, quality);
            });
            
            updateProgress('convert', '正在生成结果...', 90);
            
            // 显示转换结果
            const convertedPreview = document.getElementById('convertedImagePreview');
            const url = URL.createObjectURL(blob);
            convertedPreview.src = url;
            
            // 显示转换后信息
            const convertedImg = new Image();
            convertedImg.onload = function() {
                document.getElementById('convertedInfo').textContent = 
                    `尺寸: ${convertedImg.width}×${convertedImg.height} 像素 | 格式: ${mimeType} | 大小: ${formatFileSize(blob.size)}`;
            };
            convertedImg.src = url;
            
            // 设置下载链接
            downloadLink.href = url;
            downloadLink.download = `converted.${outputFormat}`;
            downloadLink.textContent = `下载.${outputFormat}文件`;
            
            // 显示结果
            resultSection.classList.remove('hidden');
            updateProgress('convert', '转换完成!', 100);
            
        } catch (error) {
            updateProgress('convert', `转换出错: ${error.message}`, 'error');
            console.error(error);
        }
    });
    
    // 辅助函数
    function loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }
    
    function formatFileSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
});
