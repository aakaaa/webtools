document.addEventListener('DOMContentLoaded', function() {
  const videoInput = document.getElementById('videoInput');
  const videoDropZone = document.getElementById('videoDropZone');
  const videoPreview = document.getElementById('videoPreview');
  const startTimeGif = document.getElementById('startTimeGif');
  const durationGif = document.getElementById('durationGif');
  const gifWidth = document.getElementById('gifWidth');
  const gifFps = document.getElementById('gifFps');
  const gifQuality = document.getElementById('gifQuality');
  const gifQualityValue = document.getElementById('gifQualityValue');
  const playVideoBtn = document.getElementById('playVideoBtn');
  const pauseVideoBtn = document.getElementById('pauseVideoBtn');
  const setStartBtn = document.getElementById('setStartBtn');
  const setEndBtn = document.getElementById('setEndBtn');
  const createGifBtn = document.getElementById('createGifBtn');
  const gifPreview = document.getElementById('gifPreview');
  const gifInfo = document.getElementById('gifInfo');
  const downloadGifBtn = document.getElementById('downloadGifBtn');
  const copyGifBtn = document.getElementById('copyGifBtn');
  const conversionProgress = document.getElementById('conversionProgress');
  const gifProgressBar = document.getElementById('gifProgressBar');
  const gifProgressText = document.getElementById('gifProgressText');
  
  let videoFile = null;
  
  // 更新质量值显示
  gifQuality.addEventListener('input', function() {
    gifQualityValue.textContent = `${this.value}/10`;
  });
  
  // 文件选择处理
  videoInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
      loadVideoFile(this.files[0]);
    }
  });
  
  // 拖放处理
  videoDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    videoDropZone.classList.add('dragover');
  });
  
  videoDropZone.addEventListener('dragleave', () => {
    videoDropZone.classList.remove('dragover');
  });
  
  videoDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    videoDropZone.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      loadVideoFile(file);
    }
  });
  
  // 加载视频文件
  function loadVideoFile(file) {
    videoFile = file;
    videoPreview.src = URL.createObjectURL(file);
    
    gifInfo.innerHTML = `
      <p><strong>文件名:</strong> ${file.name}</p>
      <p><strong>大小:</strong> ${App.formatFileSize(file.size)}</p>
      <p><strong>类型:</strong> ${file.type}</p>
    `;
    
    // 重置GIF预览
    gifPreview.src = '';
    document.getElementById('gifActions').classList.add('hidden');
  }
  
  // 播放控制
  playVideoBtn.addEventListener('click', function() {
    if (videoPreview.src) {
      videoPreview.play();
    }
  });
  
  pauseVideoBtn.addEventListener('click', function() {
    videoPreview.pause();
  });
  
  // 设置开始时间
  setStartBtn.addEventListener('click', function() {
    startTimeGif.value = videoPreview.currentTime.toFixed(1);
  });
  
  // 设置结束时间
  setEndBtn.addEventListener('click', function() {
    const endTime = parseFloat(startTimeGif.value) + parseFloat(durationGif.value);
    if (videoPreview.currentTime > parseFloat(startTimeGif.value)) {
      durationGif.value = (videoPreview.currentTime - parseFloat(startTimeGif.value)).toFixed(1);
    }
  });
  
  // 创建GIF
  createGifBtn.addEventListener('click', async function() {
    if (!videoFile) {
      App.showNotification('请先选择视频文件', 'error');
      return;
    }
    
    const start = parseFloat(startTimeGif.value) || 0;
    const duration = parseFloat(durationGif.value) || 3;
    const width = parseInt(gifWidth.value) || 400;
    const fps = parseInt(gifFps.value) || 15;
    const quality = parseInt(gifQuality.value) || 7;
    
    if (duration > 15) {
      App.showNotification('GIF时长不能超过15秒', 'error');
      return;
    }
    
    conversionProgress.classList.remove('hidden');
    gifProgressBar.style.width = '0%';
    gifProgressText.textContent = '正在处理...';
    
    try {
      // 使用FFmpeg.js处理视频
      const { createFFmpeg, fetchFile } = FFmpeg;
      const ffmpeg = createFFmpeg({ 
        log: true,
        progress: ({ ratio }) => {
          const percent = Math.round(ratio * 100);
          gifProgressBar.style.width = `${percent}%`;
          gifProgressText.textContent = `正在处理... ${percent}%`;
        }
      });
      
      await ffmpeg.load();
      
      ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoFile));
      
      await ffmpeg.run(
        '-i', 'input.mp4',
        '-ss', start.toString(),
        '-t', duration.toString(),
        '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
        '-loop', '0',
        '-f', 'gif',
        'output.gif'
      );
      
      const data = ffmpeg.FS('readFile', 'output.gif');
      const gifUrl = URL.createObjectURL(new Blob([data.buffer], { type: 'image/gif' }));
      
      gifPreview.src = gifUrl;
      downloadGifBtn.href = gifUrl;
      downloadGifBtn.download = `converted_${videoFile.name.replace(/\.[^/.]+$/, '')}.gif`;
      
      document.getElementById('gifActions').classList.remove('hidden');
      conversionProgress.classList.add('hidden');
      
      App.showNotification('GIF创建成功', 'success');
    } catch (error) {
      console.error(error);
      App.showNotification('创建GIF失败', 'error');
      conversionProgress.classList.add('hidden');
    }
  });
  
  // 复制GIF到剪贴板
  copyGifBtn.addEventListener('click', async function() {
    if (!gifPreview.src) return;
    
    try {
      const response = await fetch(gifPreview.src);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      App.showNotification('GIF已复制到剪贴板', 'success');
    } catch (error) {
      console.error('复制失败:', error);
      App.showNotification('复制GIF失败', 'error');
    }
  });
});
