document.addEventListener('DOMContentLoaded', function() {
  const qrContent = document.getElementById('qrContent');
  const qrSize = document.getElementById('qrSize');
  const qrSizeValue = document.getElementById('qrSizeValue');
  const qrColor = document.getElementById('qrColor');
  const qrBgColor = document.getElementById('qrBgColor');
  const qrErrorCorrection = document.getElementById('qrErrorCorrection');
  const qrMargin = document.getElementById('qrMargin');
  const qrMarginValue = document.getElementById('qrMarginValue');
  const qrLogo = document.getElementById('qrLogo');
  const logoSize = document.getElementById('logoSize');
  const logoSizeValue = document.getElementById('logoSizeValue');
  const generateQrBtn = document.getElementById('generateQrBtn');
  const qrCanvas = document.getElementById('qrCanvas');
  const downloadQrBtn = document.getElementById('downloadQrBtn');
  
  let qrCode = null;
  let logoImage = null;
  
  // 更新滑块值显示
  qrSize.addEventListener('input', function() {
    qrSizeValue.textContent = `${this.value}px`;
  });
  
  qrMargin.addEventListener('input', function() {
    qrMarginValue.textContent = this.value;
  });
  
  logoSize.addEventListener('input', function() {
    logoSizeValue.textContent = `${this.value}%`;
  });
  
  // Logo选择处理
  qrLogo.addEventListener('change', function() {
    if (this.files && this.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        logoImage = new Image();
        logoImage.src = e.target.result;
        logoSize.disabled = false;
      };
      reader.readAsDataURL(this.files[0]);
    }
  });
  
  // 生成二维码
  generateQrBtn.addEventListener('click', function() {
    const content = qrContent.value.trim();
    if (!content) {
      App.showNotification('请输入二维码内容', 'error');
      return;
    }
    
    const size = parseInt(qrSize.value) || 300;
    const color = qrColor.value;
    const bgColor = qrBgColor.value;
    const errorCorrection = qrErrorCorrection.value;
    const margin = parseInt(qrMargin.value) || 4;
    
    // 设置画布大小
    qrCanvas.width = size;
    qrCanvas.height = size;
    const ctx = qrCanvas.getContext('2d');
    
    try {
      // 生成二维码
      qrCode = QRCode.create(content, {
        errorCorrectionLevel: errorCorrection,
        version: 5
      });
      
      // 计算每个模块的大小
      const moduleCount = qrCode.modules.size;
      const moduleSize = size / (moduleCount + 2 * margin);
      const offset = (size - moduleCount * moduleSize) / 2;
      
      // 绘制背景
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, size, size);
      
      // 绘制二维码模块
      ctx.fillStyle = color;
      for (let i = 0; i < moduleCount; i++) {
        for (let j = 0; j < moduleCount; j++) {
          if (qrCode.modules.get(i, j)) {
            ctx.fillRect(
              offset + i * moduleSize,
              offset + j * moduleSize,
              moduleSize,
              moduleSize
            );
          }
        }
      }
      
      // 添加Logo
      if (logoImage) {
        logoImage.onload = function() {
          const logoSizePercent = parseInt(logoSize.value) || 20;
          const logoWidth = size * logoSizePercent / 100;
          const logoHeight = logoWidth * logoImage.height / logoImage.width;
          
          ctx.drawImage(
            logoImage,
            size / 2 - logoWidth / 2,
            size / 2 - logoHeight / 2,
            logoWidth,
            logoHeight
          );
          
          // 启用下载按钮
          downloadQrBtn.classList.remove('hidden');
        };
      } else {
        // 启用下载按钮
        downloadQrBtn.classList.remove('hidden');
      }
    } catch (error) {
      console.error(error);
      App.showNotification('生成二维码失败', 'error');
    }
  });
  
  // 下载二维码
  downloadQrBtn.addEventListener('click', function() {
    if (!qrCode) return;
    
    const format = document.getElementById('qrFormat').value;
    let mimeType, extension;
    
    switch (format) {
      case 'jpeg':
        mimeType = 'image/jpeg';
        extension = 'jpg';
        break;
      case 'svg':
        // SVG需要特殊处理
        downloadSvgQrCode();
        return;
      default:
        mimeType = 'image/png';
        extension = 'png';
    }
    
    const link = document.createElement('a');
    link.download = `qrcode.${extension}`;
    link.href = qrCanvas.toDataURL(mimeType);
    link.click();
  });
  
  // 下载SVG格式的二维码
  function downloadSvgQrCode() {
    if (!qrCode) return;
    
    const size = parseInt(qrSize.value) || 300;
    const color = qrColor.value;
    const bgColor = qrBgColor.value;
    const margin = parseInt(qrMargin.value) || 4;
    const moduleCount = qrCode.modules.size;
    const moduleSize = size / (moduleCount + 2 * margin);
    const offset = (size - moduleCount * moduleSize) / 2;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
    svg += `<rect width="100%" height="100%" fill="${bgColor}"/>`;
    
    for (let i = 0; i < moduleCount; i++) {
      for (let j = 0; j < moduleCount; j++) {
        if (qrCode.modules.get(i, j)) {
          svg += `<rect x="${offset + i * moduleSize}" y="${offset + j * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="${color}"/>`;
        }
      }
    }
    
    svg += '</svg>';
    
    const blob = new Blob([svg], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'qrcode.svg';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }
});
