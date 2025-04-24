document.addEventListener('DOMContentLoaded', function() {
  const passwordLength = document.getElementById('passwordLength');
  const passwordLengthValue = document.getElementById('passwordLengthValue');
  const excludeChars = document.getElementById('excludeChars');
  const passwordCount = document.getElementById('passwordCount');
  const generatePasswordBtn = document.getElementById('generatePasswordBtn');
  const passwordList = document.getElementById('passwordList');
  const copyAllPasswordsBtn = document.getElementById('copyAllPasswordsBtn');
  const exportPasswordsBtn = document.getElementById('exportPasswordsBtn');
  const strengthIndicator = document.getElementById('strengthIndicator');
  const strengthText = document.getElementById('strengthText');
  
  // 字符集
  const charSets = {
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  };
  
  // 更新滑块值显示
  passwordLength.addEventListener('input', function() {
    passwordLengthValue.textContent = this.value;
  });
  
  // 生成密码
  generatePasswordBtn.addEventListener('click', function() {
    const length = parseInt(passwordLength.value) || 12;
    const count = parseInt(passwordCount.value) || 5;
    const excluded = excludeChars.value.split('').filter(c => c.trim() !== '');
    
    // 获取选中的字符类型
    const selectedTypes = Array.from(document.querySelectorAll('input[name="charType"]:checked'))
      .map(el => el.value);
    
    if (selectedTypes.length === 0) {
      App.showNotification('请至少选择一种字符类型', 'error');
      return;
    }
    
    // 构建字符池
    let charPool = '';
    selectedTypes.forEach(type => {
      charPool += charSets[type];
    });
    
    // 移除排除的字符
    excluded.forEach(char => {
      charPool = charPool.replace(new RegExp(char, 'g'), '');
    });
    
    if (charPool.length === 0) {
      App.showNotification('字符池为空，请减少排除字符或增加字符类型', 'error');
      return;
    }
    
    // 生成密码
    passwordList.innerHTML = '';
    const passwords = [];
    
    for (let i = 0; i < count; i++) {
      const password = generatePassword(charPool, length);
      passwords.push(password);
      
      const passwordItem = document.createElement('div');
      passwordItem.className = 'password-item';
      passwordItem.innerHTML = `
        <span>${password}</span>
        <button class="copy-password-btn" data-password="${password}">
          <i class="fas fa-copy"></i>
        </button>
      `;
      passwordList.appendChild(passwordItem);
    }
    
    // 评估密码强度
    evaluatePasswordStrength(passwords[0]);
    
    // 添加复制按钮事件
    document.querySelectorAll('.copy-password-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const password = this.getAttribute('data-password');
        navigator.clipboard.writeText(password).then(() => {
          App.showNotification('密码已复制', 'success');
        });
      });
    });
  });
  
  // 生成单个密码
  function generatePassword(charPool, length) {
    let password = '';
    const poolLength = charPool.length;
    
    // 确保密码包含每种选中的字符类型至少一个字符
    const selectedTypes = Array.from(document.querySelectorAll('input[name="charType"]:checked'))
      .map(el => el.value);
    
    selectedTypes.forEach(type => {
      const randomChar = charSets[type][Math.floor(Math.random() * charSets[type].length)];
      password += randomChar;
    });
    
    // 填充剩余长度
    for (let i = password.length; i < length; i++) {
      password += charPool[Math.floor(Math.random() * poolLength)];
    }
    
    // 打乱密码
    return shuffleString(password);
  }
  
  // 打乱字符串
  function shuffleString(str) {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  }
  
  // 评估密码强度
  function evaluatePasswordStrength(password) {
    let strength = 0;
    
    // 长度得分
    strength += Math.min(password.length / 4, 4);
    
    // 字符类型多样性得分
    const typesPresent = Array.from(document.querySelectorAll('input[name="charType"]:checked'))
      .filter(el => new RegExp(`[${charSets[el.value]}]`).test(password))
      .length;
    
    strength += (typesPresent - 1) * 2;
    
    // 特殊字符得分
    if (/[^a-zA-Z0-9]/.test(password)) {
      strength += 1;
    }
    
    // 更新UI
    strength = Math.min(Math.max(strength, 0), 10);
    const percent = strength * 10;
    
    strengthIndicator.style.width = `${percent}%`;
    
    if (strength < 4) {
      strengthIndicator.style.backgroundColor = '#e74c3c';
      strengthText.textContent = '弱';
    } else if (strength < 7) {
      strengthIndicator.style.backgroundColor = '#f39c12';
      strengthText.textContent = '中等';
    } else if (strength < 9) {
      strengthIndicator.style.backgroundColor = '#3498db';
      strengthText.textContent = '强';
    } else {
      strengthIndicator.style.backgroundColor = '#2ecc71';
      strengthText.textContent = '非常强';
    }
  }
  
  // 复制所有密码
  copyAllPasswordsBtn.addEventListener('click', function() {
    const passwords = Array.from(document.querySelectorAll('.password-item span'))
      .map(span => span.textContent)
      .join('\n');
    
    navigator.clipboard.writeText(passwords).then(() => {
      App.showNotification('所有密码已复制', 'success');
    });
  });
  
  // 导出密码
  exportPasswordsBtn.addEventListener('click', function() {
    const passwords = Array.from(document.querySelectorAll('.password-item span'))
      .map(span => span.textContent)
      .join('\n');
    
    const blob = new Blob([passwords], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'passwords.txt';
    a.click();
    URL.revokeObjectURL(url);
  });
});
