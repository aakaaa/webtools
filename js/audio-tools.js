document.addEventListener('DOMContentLoaded', function() {
  const audioFileInput = document.getElementById('audioFileInput');
  const audioDropZone = document.getElementById('audioDropZone');
  const audioInfo = document.getElementById('audioInfo');
  const playbackRate = document.getElementById('playbackRate');
  const playbackRateValue = document.getElementById('playbackRateValue');
  const volumeControl = document.getElementById('volumeControl');
  const volumeValue = document.getElementById('volumeValue');
  const startTime = document.getElementById('startTime');
  const endTime = document.getElementById('endTime');
  const fadeIn = document.getElementById('fadeIn');
  const fadeOut = document.getElementById('fadeOut');
  const playBtn = document.getElementById('playBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const stopBtn = document.getElementById('stopBtn');
  const processAudioBtn = document.getElementById('processAudioBtn');
  const audioPlayer = document.getElementById('audioPlayer');
  const waveformCanvas = document.getElementById('waveformCanvas');
  const downloadAudioBtn = document.getElementById('downloadAudioBtn');
  
  let audioContext;
  let audioBuffer;
  let audioSource;
  let isPlaying = false;
  
  // 更新滑块值显示
  playbackRate.addEventListener('input', function() {
    playbackRateValue.textContent = `${this.value}x`;
    if (audioPlayer) {
      audioPlayer.playbackRate = parseFloat(this.value);
    }
  });
  
  volumeControl.addEventListener('input', function() {
    volumeValue.textContent = `${this.value}%`;
    if (audioPlayer) {
      audioPlayer.volume = parseInt(this.value) / 100;
    }
  });
  
  // 文件选择处理
  audioFileInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
      loadAudioFile(this.files[0]);
    }
  });
  
  // 拖放处理
  audioDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    audioDropZone.classList.add('dragover');
  });
  
  audioDropZone.addEventListener('dragleave', () => {
    audioDropZone.classList.remove('dragover');
  });
  
  audioDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    audioDropZone.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      loadAudioFile(file);
    }
  });
  
  // 加载音频文件
  function loadAudioFile(file) {
    // 显示文件信息
    audioInfo.innerHTML = `
      <p><strong>文件名:</strong> ${file.name}</p>
      <p><strong>大小:</strong> ${App.formatFileSize(file.size)}</p>
      <p><strong>类型:</strong> ${file.type}</p>
    `;
    
    // 设置音频播放器
    audioPlayer.src = URL.createObjectURL(file);
    
    // 初始化Web Audio API
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      audioContext.decodeAudioData(e.target.result)
        .then(buffer => {
          audioBuffer = buffer;
          drawWaveform(buffer);
          
          // 设置结束时间默认值
          endTime.value = buffer.duration.toFixed(1);
        })
        .catch(error => {
          console.error('解码音频失败:', error);
          App.showNotification('无法解码音频文件', 'error');
        });
    };
    reader.readAsArrayBuffer(file);
  }
  
  // 绘制波形图
  function drawWaveform(buffer) {
    const width = waveformCanvas.width = waveformCanvas.offsetWidth;
    const height = waveformCanvas.height = 150;
    const ctx = waveformCanvas.getContext('2d');
    
    const data = buffer.getChannelData(0); // 只使用第一个声道
    const step = Math.ceil(data.length / width);
    const amp = height / 2;
    
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < width; i++) {
      const min = 1.0;
      const max = -1.0;
      
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      
      ctx.beginPath();
      ctx.moveTo(i, (1 + min) * amp);
      ctx.lineTo(i, (1 + max) * amp);
      ctx.stroke();
    }
  }
  
  // 播放控制
  playBtn.addEventListener('click', function() {
    if (audioPlayer.src) {
      audioPlayer.play();
      isPlaying = true;
    }
  });
  
  pauseBtn.addEventListener('click', function() {
    audioPlayer.pause();
    isPlaying = false;
  });
  
  stopBtn.addEventListener('click', function() {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    isPlaying = false;
  });
  
  // 处理音频
  processAudioBtn.addEventListener('click', function() {
    if (!audioBuffer) {
      App.showNotification('请先加载音频文件', 'error');
      return;
    }
    
    App.showNotification('正在处理音频...', 'info');
    
    // 使用Web Worker处理音频
    const worker = new Worker('js/audio-worker.js');
    
    worker.postMessage({
      buffer: audioBuffer,
      startTime: parseFloat(startTime.value) || 0,
      endTime: parseFloat(endTime.value) || audioBuffer.duration,
      fadeIn: parseFloat(fadeIn.value) || 0,
      fadeOut: parseFloat(fadeOut.value) || 0,
      playbackRate: parseFloat(playbackRate.value) || 1,
      volume: parseInt(volumeControl.value) / 100 || 0.8
    });
    
    worker.onmessage = function(e) {
      const processedBlob = e.data;
      const url = URL.createObjectURL(processedBlob);
      
      // 更新音频播放器
      audioPlayer.src = url;
      
      // 启用下载按钮
      downloadAudioBtn.href = url;
      downloadAudioBtn.download = `processed_${audioFileInput.files[0].name}`;
      document.getElementById('audioActions').classList.remove('hidden');
      
      App.showNotification('音频处理完成', 'success');
    };
  });
  
  // 下载处理后的音频
  downloadAudioBtn.addEventListener('click', function() {
    // 已经在处理音频时设置好了href和download属性
  });
});
