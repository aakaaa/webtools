document.addEventListener('DOMContentLoaded', function() {
  const sourceImage = document.getElementById('sourceImage');
  const imageDropZone = document.getElementById('imageDropZone');
  const watermarkText = document.getElementById('watermarkText');
  const textColor = document.getElementById('textColor');
  const textOpacity = document.getElementById('textOpacity');
  const textOpacityValue = document.getElementById('textOpacityValue');
  const textSize = document.getElementById('textSize');
  const textSizeValue = document.getElementById('textSizeValue');
  const textFont = document.getElementById('textFont');
  const textAngle = document.getElementById('textAngle');
  const textAngleValue = document.getElementById('textAngleValue');
  const watermarkPosition = document.getElementById('watermarkPosition');
  const applyTextWatermarkBtn = document.getElementById('applyTextWatermarkBtn');
  const originalImagePreview = document.getElementById('originalImagePreview');
  const watermarkedCanvas = document.getElementById('watermarkedCanvas');
  const downloadTextWatermarkBtn = document.getElementById('downloadTextWatermarkBtn');
  
  let originalImage = null;
  
  // 更新滑块值显示
  textOpacity.addEventListener('input', function() {
    textOpacityValue.textContent = `${this.value}%`;
  });
  
  textSize.addEventListener('input', function() {
    textSizeValue.textContent = `${this.value}px`;
  });
  
  textAngle.addEventListener('input', function() {
    textAngleValue.textContent = `${this.value}°`;
  });
  
  // 文件选择处理
  sourceImage.addEventListener('change', function() {
    if (this.files && this.files[0]) {
      loadImage(this.files[0]);
    }
  });
  
  // 拖放处理
  imageDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageDropZone.classList.add('dragover');
  });
  
  imageDropZone.addEventListener('dragleave', () => {
    imageDropZone.classList.remove('dragover');
  });
  
  imageDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    imageDropZone.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      loadImage(file);
    }
  });
  
  // 加载图片
  function loadImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      originalImagePreview.src = e.target.result;
      originalImage = new Image();
      originalImage.onload = function() {
        watermarkedCanvas.width = originalImage.width;
        watermarkedCanvas.height = originalImage.height;
      };
      originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
  
  // 应用文字水印
  applyTextWatermarkBtn.addEventListener('click', function() {
    if (!originalImage) {
      App.showNotification('请先选择图片', 'error');
      return;
    }
    
    const ctx = watermarkedCanvas.getContext('2d');
    ctx.clearRect(0, 0, watermarkedCanvas.width, watermarkedCanvas.height);
    
    // 绘制原始图片
    ctx.drawImage(originalImage, 0, 0);
    
    // 设置水印样式
    ctx.font = `${textSize.value}px ${textFont.value}`;
    ctx.fillStyle = textColor.value;
    ctx.globalAlpha = textOpacity.value / 100;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 处理旋转
    const angle = parseInt(textAngle.value) * Math.PI / 180;
    
    // 根据位置绘制水印
    const text = watermarkText.value;
    const fontSize = parseInt(textSize.value);
    const padding = 20;
    
    if (watermarkPosition.value === 'tile') {
      // 平铺水印
      const stepX = watermarkedCanvas.width / 4;
      const stepY = watermarkedCanvas.height / 4;
      
      for (let x = stepX / 2; x < watermarkedCanvas.width; x += stepX) {
        for (let y = stepY / 2; y < watermarkedCanvas.height; y += stepY) {
          drawRotatedText(ctx, text, x, y, angle);
        }
      }
    } else {
      // 单水印
      let x, y;
      
      switch (watermarkPosition.value) {
        case 'center':
          x = watermarkedCanvas.width / 2;
          y = watermarkedCanvas.height / 2;
          break;
        case 'top-left':
          x = padding + (text.length * fontSize / 4);
          y = padding + fontSize;
          break;
        case 'top-right':
          x = watermarkedCanvas.width - padding - (text.length * fontSize / 4);
          y = padding + fontSize;
          break;
        case 'bottom-left':
          x = padding + (text.length * fontSize / 4);
          y = watermarkedCanvas.height - padding - fontSize;
          break;
        case 'bottom-right':
          x = watermarkedCanvas.width - padding - (text.length * fontSize / 4);
          y = watermarkedCanvas.height - padding - fontSize;
          break;
      }
      
      drawRotatedText(ctx, text, x, y, angle);
    }
    
    downloadTextWatermarkBtn.classList.remove('hidden');
  });
  
  // 绘制旋转文本
  function drawRotatedText(ctx, text, x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  
  // 下载水印图片
  downloadTextWatermarkBtn.addEventListener('click', function() {
    const link = document.createElement('a');
    link.download = `watermarked_${sourceImage.files[0].name}`;
    link.href = watermarkedCanvas.toDataURL('image/png');
    link.click();
  });
});
