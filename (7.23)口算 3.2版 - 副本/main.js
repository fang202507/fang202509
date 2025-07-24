// 口算练习主逻辑
// 登录与界面切换
const loginView = document.getElementById('loginView');
const gameView = document.getElementById('gameView');
const usernameInput = document.getElementById('usernameInput');
const loginBtn = document.getElementById('loginBtn');
const userDisplay = document.getElementById('userDisplay');
const coinDisplay = document.getElementById('coinDisplay');
const levelLabel = document.getElementById('levelLabel');
const progressLabel = document.getElementById('progressLabel');
const questionText = document.getElementById('questionText');
const answerInput = document.getElementById('answerInput');
const keyboard = document.getElementById('keyboard');
const feedback = document.getElementById('feedback');
const timerDisplay = document.getElementById('timerDisplay');

let username = '';
let coins = 0;
let level = 1;
window.levelHistoryRecords = [];
let questionIndex = 0;
let questions = [];
let totalQuestions = 10;
let savedLevel = 1;
let successfulLevels = 0; // 成功闯关数量



// 全局变量
// 生成9减几的题目
function generateMinus9(isBlank) {
  const a = Math.floor(Math.random() * 8) + 11; // 11-18（a>10且<19）
  const difference = a - 9; // 差范围2-9
  if (isBlank) {
    const blankPos = Math.floor(Math.random() * 2);
    if (blankPos === 0) {
      return { q: `( ) - 9 = ${difference}`, a: a };
    } else {
      return { q: `${a} - ( ) = ${difference}`, a: 9 };
    }
  }
  return { q: `${a} - 9 =`, a: difference };
}

// 音效文件路径
const sound = {
  bgm: new Audio('闯关背景音乐.mp3'),
  success: new Audio('闯关成功音效.wav'),
  fail: new Audio('闯关失败音效.mp3'),
  right: new Audio('答对表扬音.mp3'),
  wrong: new Audio('答错提示音.wav'),
  coin: new Audio('金币获得音效.mp3'),
};
sound.bgm.loop = true;
sound.bgm.volume = 0.15;

// 选关功能相关变量
let levelSelectMode = false; // 选关模式状态
let maxUnlockedLevel = 1; // 已解锁关卡最大值（至少1，最多54）
let selectedLevel = 1; // 当前选中的关卡

// 闯关记录榜相关变量
const recordBoardBtn = document.getElementById('recordBoardBtn');
const recordBoardPanel = document.getElementById('recordBoardPanel');
const recordBoardBody = document.getElementById('recordBoardBody');
let levelRankRecords = JSON.parse(localStorage.getItem('levelRankRecords') || '{}'); // 存储关卡排名记录

// 初始化选关按钮
const levelSelectBtn = document.getElementById('levelSelectBtn');
const levelSelectPopup = document.getElementById('levelSelectPopup');
const levelSelectList = document.getElementById('levelSelectList');

// 绑定选关按钮点击事件
if (levelSelectBtn && levelSelectPopup && levelSelectList) {
  levelSelectBtn.addEventListener('click', toggleLevelSelectPopup);
}

// 初始化闯关记录榜
function initLevelRankRecords() {
  // 确保每个关卡都有3条记录槽位
  for (let lv = 1; lv <= 54; lv++) {
    if (!levelRankRecords[lv]) {
      levelRankRecords[lv] = [];
    }
  }
  renderRankTable();
}

// 渲染排行榜表格
function renderRankTable() {
  if (!recordBoardBody) return;
  recordBoardBody.innerHTML = '';

  // 为每个关卡生成3行记录
  for (let lv = 1; lv <= 54; lv++) {
    const records = levelRankRecords[lv] || [];
    // 确保始终显示3行
    for (let i = 0; i < 3; i++) {
      const record = records[i] || { time: '', date: '' };
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="border:1px solid #e5e7eb;padding:8px;text-align:center;">第${lv}关</td>
        <td style="border:1px solid #e5e7eb;padding:8px;text-align:center;">${record.time || '-'}</td>
        <td style="border:1px solid #e5e7eb;padding:8px;text-align:center;">${record.date || '-'}</td>
      `;
      recordBoardBody.appendChild(row);
    }
  }
}

// 更新闯关记录
function updateLevelRankRecord(level, passTime) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const dateStr = `${year}.${month}.${day} ${hours}:${minutes}`;
  const timeStr = `${passTime}秒`;

  // 如果没有该关卡记录，初始化数组
  if (!levelRankRecords[level]) {
    levelRankRecords[level] = [];
  }

  // 添加新记录
  levelRankRecords[level].push({ time: passTime, date: dateStr });

  // 按时间排序并保留前3条
  levelRankRecords[level].sort((a, b) => a.time - b.time);
  if (levelRankRecords[level].length > 3) {
    levelRankRecords[level] = levelRankRecords[level].slice(0, 3);
  }

  // 保存到本地存储
  localStorage.setItem('levelRankRecords', JSON.stringify(levelRankRecords));
  // 重新渲染表格
  renderRankTable();
}

// 初始化已解锁关卡（页面加载时读取）
function initUnlockedLevels() {
  // 删除选关模式的临时存储
  localStorage.removeItem('selectedLevel');
  // 从本地存储读取当前关卡，默认为1
  savedLevel = parseInt(localStorage.getItem('currentLevel')) || 1;
  level = savedLevel;
  
  // 检查是否是第二天
  const today = new Date().toLocaleDateString();
  const lastRecordDate = localStorage.getItem('lastRecordDate');
  
  if (!lastRecordDate || lastRecordDate !== today) {
      // 如果是新的一天，重置当日统计数据
      localStorage.setItem('lastRecordDate', today);
      localStorage.setItem('dailyCount', '0');
      localStorage.setItem('dailyCorrectAnswers', '0');
      localStorage.setItem('successfulLevels', '0');
      localStorage.setItem('correctAnswers', '0');
      localStorage.removeItem('levelHistoryRecords');
      
      // 重置UI显示
      document.getElementById('correctCount').textContent = '正确: 0';
      document.getElementById('dailyCount').textContent = '0';
      document.getElementById('successfulLevels').textContent = '成功闯关: 0';
      document.getElementById('statsPanel').innerHTML = '';
    } else {
    // 初始化成功闯关数量
    successfulLevels = parseInt(localStorage.getItem('successfulLevels')) || 0;
    document.getElementById('successfulLevels').textContent = `成功闯关: ${successfulLevels}`;
    
    // 初始化正确答题数
    const correctAnswers = parseInt(localStorage.getItem('correctAnswers') || '0');
    const correctCountElement = document.getElementById('correctCount');
    if (correctCountElement) {
      correctCountElement.textContent = `正确: ${correctAnswers}`;
    }
    
    // 初始化当日答题数
    const dailyCount = parseInt(localStorage.getItem('dailyCount') || '0');
    const dailyCountElement = document.getElementById('dailyCount');
    if (dailyCountElement) {
      dailyCountElement.textContent = dailyCount;
    }
    
    // 加载并显示历史记录
    const historyRecords = JSON.parse(localStorage.getItem('levelHistoryRecords') || '[]');
    const statsPanel = document.getElementById('statsPanel');
    if (statsPanel) {
      statsPanel.innerHTML = historyRecords.map(record => `
        <div class="record-item">${record}</div>
      `).join('');
    }
  }
  
  // 更新UI显示当前关卡
  levelLabel.textContent = `第${level}关`;
  
  // 计算最大解锁关卡（取当前关卡和已解锁关卡的较大值）
  maxUnlockedLevel = Math.max(Math.min(Math.max(1, savedLevel), 54), parseInt(localStorage.getItem('maxUnlockedLevel')) || 1);
  
  // 强制渲染选关列表
  renderLevelSelectList();
  
  
}
// 绑定闯关记录榜按钮点击事件
if (recordBoardBtn && recordBoardPanel) {
  recordBoardBtn.addEventListener('click', () => {
    recordBoardPanel.style.display = recordBoardPanel.style.display === 'block' ? 'none' : 'block';
    renderRankTable(); // 点击时重新渲染确保数据最新
  });
}

// 页面加载时执行初始化
window.addEventListener('load', () => {
  initUnlockedLevels();
  initLevelRankRecords();
});

// 切换选关弹窗显示状态
function toggleLevelSelectPopup() {
  if (levelSelectPopup.style.display === 'flex') {
    levelSelectPopup.style.display = 'none';
    levelSelectMode = false;
    if (window.currentRestoreState) {
      window.currentRestoreState.restore();
      window.currentRestoreState = null;
    }
    // 恢复输入框可用状态
    answerInput.disabled = false;
    // 恢复键盘操作
    keyboard.style.pointerEvents = 'auto';
    // 恢复倒计时（如果之前在运行）
    if (!timerRunning) startLevelTimer();
  } else {
    renderLevelSelectList();
    levelSelectPopup.style.display = 'flex';
    // 禁用输入框和计时
    answerInput.disabled = true;
    // 禁用键盘操作
    keyboard.style.pointerEvents = 'none';
    stopLevelTimer();
    levelSelectMode = true;
  }
}

// 显示选关弹窗
function showLevelSelectPopup() {
  if (levelSelectPopup && levelSelectList) {
    renderLevelSelectList();
    levelSelectPopup.style.display = 'flex';
  }
}

// 渲染关卡选择列表
function renderLevelSelectList() {
  if (!levelSelectList) return;
  
  levelSelectList.innerHTML = '';
  
  for (let lv = 1; lv <= 54; lv++) {
    const levelItem = document.createElement('div');
    levelItem.className = 'level-item';
    levelItem.textContent = `第${lv}关`;
    
    if (lv === level) {
      levelItem.classList.add('current');
    } else if (lv <= maxUnlockedLevel) {
      levelItem.classList.add('unlocked');
    } else {
      levelItem.classList.add('locked');
    }
    
    if (lv <= maxUnlockedLevel || lv <= level) {
      levelItem.addEventListener('click', () => {
        toggleLevelSelectPopup(); // 调用切换函数触发关闭逻辑（含状态恢复）
        window.currentRestoreState = selectLevel(lv);
      });
    }
    
    levelSelectList.appendChild(levelItem);
  }
}

// 选择关卡
function selectLevel(lv, isSelectMode = true) {
  if (lv === level) {
    levelSelectPopup.style.display = 'none';
  }
  
  // 设置选关模式（默认选关模式为true，正常模式调用时传false）
  levelSelectMode = isSelectMode;
  
  // 保存当前关卡状态
  const currentLevel = level;
  const currentQuestions = questions;
  const currentQuestionIndex = questionIndex;
  
  selectedLevel = lv;
  level = lv;

  questionIndex = 0;
  questions = generateQuestions();
  totalQuestions = questions.length;
  
  // 重置计时器 - 选关模式使用关卡最低时间限制
  timerLeft = getLevelMinTime(level);
  if (levelSelectMode) {
    levelTimerData[level] = {curTime: getLevelMinTime(level), minTime: getLevelMinTime(level), attempts: 1};
  }
  
  // 更新UI
  levelLabel.textContent = `第${level}关${levelSelectMode ? '(选关模式)' : ''}`; // 确保选关模式标识始终显示 // 确保选关模式标识始终显示
  progressLabel.textContent = `1/${totalQuestions}`;
  questionText.textContent = questions[0].q;
  answerInput.value = '';
  feedback.textContent = '';
  
  // 关闭弹窗
  levelSelectPopup.style.display = 'none';
  
  // 开始新关卡
  startLevelTimer();
  
  // 选关模式不立即保存到currentLevel
  if(!levelSelectMode) {
    updateAndSave();
  }

  // 恢复当前关卡状态
  return {
    restore: () => {
      // 完全重置游戏状态
      level = currentLevel;
      questions = currentQuestions;
      questionIndex = currentQuestionIndex;
      totalQuestions = currentQuestions.length;
      // 退出选关模式时重置状态
      levelSelectMode = false;
      
      // 重置UI显示
      levelLabel.textContent = `第${level}关`;
      levelSelectMode = false; // 确保状态同步
      progressLabel.textContent = `${questionIndex + 1}/${totalQuestions}`;
      questionText.textContent = questions[questionIndex].q;
      answerInput.value = '';
      feedback.textContent = '';
      
      // 重置计时器
      stopLevelTimer();
      timerLeft = getLevelMinTime(level);
      timerDisplay.textContent = '';
      
      // 仅在正常模式下保存进度
      if(!levelSelectMode) {
        updateAndSave();
      }
      // 关闭弹窗时不立即保存正常模式进度，由restore方法处理
      levelSelectPopup.style.display = 'none';
    }
  };


}

// 关卡倒计时相关变量
let levelTimerData = {}; // 记录每关的首次用时、当前倒计时、最低限定时间、失败次数
let timer = null;
let timerStart = 0;
let timerLeft = 0;
let timerRunning = false;
let timerFailCount = 0;

function getLevelMinTime(lv) {
  if (lv >= 1 && lv <= 6) return 30;
  if (lv === 7) return 60;
  if (lv === 8) return 90;
  if (lv >= 9 && lv <= 25) return 70;
  if (lv >= 26 && lv <= 29) return 80;
  if (lv >= 30 && lv <= 34) return 90;
  if (lv >= 35 && lv <= 37) return 100;
  if (lv === 38) return 90;
  if (lv >= 39 && lv <= 53) return 70;
  if (lv === 54) return 90;
  return 30;
}

function startLevelTimer() {
  // 播放背景音乐
  sound.bgm.currentTime = 0;
  sound.bgm.play();
  
  // 选关模式跳过首次计时判断，直接使用最低时间
  if (!levelSelectMode && (!levelTimerData[level] || !levelTimerData[level].firstTime)) {
    timerStart = Date.now();
    timerRunning = true;
    if (timer) clearInterval(timer);
    timer = setInterval(()=>{
      const used = Math.floor((Date.now() - timerStart)/1000);
      timerDisplay.textContent = `首次: ${used}秒`;
    }, 200);
    return;
  }
  
  // 非首次闯关显示倒计时
  timerLeft = levelTimerData[level].curTime;
  timerDisplay.textContent = timerLeft + '秒';
  timerRunning = true;
  timerStart = Date.now();
  if (timer) clearInterval(timer);
  timer = setInterval(()=>{
    const used = Math.floor((Date.now() - timerStart)/1000);
    const left = timerLeft - used;
    if (left >= 0) {
      timerDisplay.textContent = left + '秒';
    }
    if (left <= 0) {
      clearInterval(timer);
      timerRunning = false;
      timerDisplay.textContent = '0秒';
      handleTimeFail();
    }
  }, 200);
}

function stopLevelTimer() {
  if (timer) clearInterval(timer);
  timerRunning = false;
  // 暂停背景音乐
  sound.bgm.pause();
}

function handleTimeFail() {
    // 立即停止计时器
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    timerRunning = false;
    
    // 暂停背景音乐
    sound.bgm.pause();
    
    // 计算本局挑战用时
    let currentTimeUsed = Math.floor((Date.now() - timerStart)/1000);
    let nextTimer = 30;
    
    // 选关模式统一使用最低时间
    if (levelSelectMode) {
      nextTimer = getLevelMinTime(level);
    } else {
      // 首次闯关：下局时间=当前时间
      if (!levelTimerData[level] || !levelTimerData[level].firstTime) {
        nextTimer = currentTimeUsed;
      } else {
        // 非首次闯关：下局时间=当前时间+2秒
        nextTimer = (levelTimerData[level]?.curTime || 30) + 2;
      }
    }
    
    // 显示失败反馈
    timerFailCount++;
    feedback.textContent = '时间到，闯关失败！';
    feedback.className = 'feedback wrong';
    sound.fail.currentTime = 0;
    sound.fail.play();
    
    // 显示时间到弹窗
    showPopup('timeup', {
      attemptCount: timerFailCount,
      correctCount: questionIndex,
      nextTimer: (!levelTimerData[level] || (levelTimerData[level] && !levelTimerData[level].firstTime)) ? '首次不限时' : nextTimer,
      title: '很遗憾，闯关失败！',
      message: levelSelectMode ? 
        `这是你第${timerFailCount}次挑战本关\n已答对题目数: ${questionIndex}\n继续努力！你一定能行的！` :
        `这是你第${timerFailCount}次挑战本关\n已答对题目数: ${questionIndex}\n继续努力！你一定能行的！`,
      isFirstTime: (!levelSelectMode && (!levelTimerData[level] || !levelTimerData[level].firstTime))
    });
    
    // 连续2次失败，时间+2秒（不超过首次用时）
    if (timerFailCount >= 2 && levelTimerData[level] && !levelSelectMode) {
      const first = levelTimerData[level].firstTime;
      let cur = levelTimerData[level].curTime + 2;
      if (cur > first) cur = first;
      levelTimerData[level].curTime = cur;
      timerFailCount = 0;
      updateAndSave();
    }
}

// 题目生成（根据关卡生成不同题目）
function generateQuestions() {
  const arr = [];
  const count = level <= 6 ? 10 : 20;
  let lastQ = '';
  for (let i = 0; i < count; i++) {
    let question;
    let tryCount = 0;
    do {
      switch(level) {
        // 50关：乘数有9的乘法，乘数不超过9
        case 50: {
          const a50 = Math.floor(Math.random() * 9) + 1; // 1-9
          const b50 = 9;
          // 随机交换乘数位置
          if (Math.random() < 0.5) {
            question = { q: `${a50} × ${b50} =`, a: a50 * b50 };
          } else {
            question = { q: `${b50} × ${a50} =`, a: b50 * a50 };
          }
          break;
        }
        
        // 51关：乘数有9的乘法，乘数不超过9，填空
        case 51: {
          const a51 = Math.floor(Math.random() * 9) + 1; // 1-9
          const b51 = 9;
          // 随机选择填空位置
          const blankPos = Math.floor(Math.random() * 2);
          if (blankPos === 0) {
            question = { q: `( ) × ${b51} = ${a51 * b51}`, a: a51 };
          } else {
            question = { q: `${b51} × ( ) = ${a51 * b51}`, a: a51 };
          }
          break;
        }
        
        // 52关：乘数有7、8、9的乘法，乘数不超过9
        case 52: {
          const a52 = Math.floor(Math.random() * 9) + 1; // 1-9
          const b52 = Math.floor(Math.random() * 3) + 7; // 7-9
          // 随机交换乘数位置
          if (Math.random() < 0.5) {
            question = { q: `${a52} × ${b52} =`, a: a52 * b52 };
          } else {
            question = { q: `${b52} × ${a52} =`, a: b52 * a52 };
          }
          break;
        }
        
        // 53关：乘数不超过9的乘法计算，随机生成填空题或求结果题
        case 53: {
          const a53 = Math.floor(Math.random() * 9) + 1; // 1-9
          const b53 = Math.floor(Math.random() * 9) + 1; // 1-9
          // 50%概率生成填空或求结果题
          if (Math.random() < 0.5) {
            // 求结果题
            question = { q: `${a53} × ${b53} =`, a: a53 * b53 };
          } else {
            // 填空题，随机选择a或b的位置填空
            const blankPos = Math.floor(Math.random() * 2);
            if (blankPos === 0) {
              question = { q: `( ) × ${b53} = ${a53 * b53}`, a: a53 };
            } else {
              question = { q: `${a53} × ( ) = ${a53 * b53}`, a: b53 };
            }
          }
          break;
        }
        
        // 54关：一个数乘一位数的积再加减一位数，结果非负
        case 54: {
          const a54 = Math.floor(Math.random() * 8) + 1; // 1-8
          const b54 = Math.floor(Math.random() * 8) + 1; // 1-8
          const c54 = Math.floor(Math.random() * 8) + 1; // 1-8
          // 随机选择加法或减法
          if (Math.random() < 0.5) {
            question = { q: `${a54} × ${b54} + ${c54} =`, a: a54 * b54 + c54 };
          } else {
            // 确保结果非负
            const product = a54 * b54;
            if (product > c54) {
              question = { q: `${a54} × ${b54} - ${c54} =`, a: product - c54 };
            } else {
              question = { q: `${a54} × ${b54} + ${c54} =`, a: product + c54 };
            }
          }
          break;
        }
        // 43关：乘数有6的乘法，乘数不超过6
        case 43: {
          const a43 = Math.floor(Math.random() * 6) + 1; // 1-6
          const b43 = 6;
          // 随机交换乘数位置
          if (Math.random() < 0.5) {
            question = { q: `${a43} × ${b43} =`, a: a43 * b43 };
          } else {
            question = { q: `${b43} × ${a43} =`, a: b43 * a43 };
          }
          break;
        }
        
        // 44关：乘数有6的乘法，乘数不超过6，填空
        case 44: {
          const a44 = Math.floor(Math.random() * 6) + 1; // 1-6
          const b44 = 6;
          // 随机选择填空位置
          const blankPos = Math.floor(Math.random() * 2);
          if (blankPos === 0) {
            question = { q: `( ) × ${b44} = ${a44 * b44}`, a: a44 };
          } else {
            question = { q: `${b44} × ( ) = ${a44 * b44}`, a: a44 };
          }
          break;
        }
        
        // 45关：乘数不超过6的乘法，随机生成填空题或求结果题
        case 45: {
          const a45 = Math.floor(Math.random() * 6) + 1; // 1-6
          const b45 = Math.floor(Math.random() * 6) + 1; // 1-6
          // 50%概率生成填空或求结果题
          if (Math.random() < 0.5) {
            // 求结果题
            question = { q: `${a45} × ${b45} =`, a: a45 * b45 };
          } else {
            // 填空题，随机选择a或b的位置填空
            const blankPos = Math.floor(Math.random() * 2);
            if (blankPos === 0) {
              question = { q: `( ) × ${b45} = ${a45 * b45}`, a: a45 };
            } else {
              question = { q: `${a45} × ( ) = ${a45 * b45}`, a: b45 };
            }
          }
          break;
        }
        
        // 46关：乘数有7的乘法，乘数不超过7
        case 46: {
          const a46 = Math.floor(Math.random() * 7) + 1; // 1-7
          const b46 = 7;
          // 随机交换乘数位置
          if (Math.random() < 0.5) {
            question = { q: `${a46} × ${b46} =`, a: a46 * b46 };
          } else {
            question = { q: `${b46} × ${a46} =`, a: b46 * a46 };
          }
          break;
        }
        
        // 47关：乘数有7的乘法，乘数不超过7，填空
        case 47: {
          const a47 = Math.floor(Math.random() * 7) + 1; // 1-7
          const b47 = 7;
          // 随机选择填空位置
          const blankPos = Math.floor(Math.random() * 2);
          if (blankPos === 0) {
            question = { q: `( ) × ${b47} = ${a47 * b47}`, a: a47 };
          } else {
            question = { q: `${b47} × ( ) = ${a47 * b47}`, a: a47 };
          }
          break;
        }
        
        // 48关：乘数有8的乘法，乘数不超过8
        case 48: {
          const a48 = Math.floor(Math.random() * 8) + 1; // 1-8
          const b48 = 8;
          // 随机交换乘数位置
          if (Math.random() < 0.5) {
            question = { q: `${a48} × ${b48} =`, a: a48 * b48 };
          } else {
            question = { q: `${b48} × ${a48} =`, a: b48 * a48 };
          }
          break;
        }
        
        // 49关：乘数有8的乘法，乘数不超过8，填空
        case 49: {
          const a49 = Math.floor(Math.random() * 8) + 1; // 1-8
          const b49 = 8;
          // 随机选择填空位置
          const blankPos = Math.floor(Math.random() * 2);
          if (blankPos === 0) {
            question = { q: `( ) × ${b49} = ${a49 * b49}`, a: a49 };
          } else {
            question = { q: `${b49} × ( ) = ${a49 * b49}`, a: a49 };
          }
          break;
        }
        // 39关：乘数有5的乘法，乘数不超过5
        case 39: {
          const a39 = Math.floor(Math.random() * 5) + 1; // 1-5
          const b39 = 5;
          // 随机交换乘数位置
          if (Math.random() < 0.5) {
            question = { q: `${a39} × ${b39} =`, a: a39 * b39 };
          } else {
            question = { q: `${b39} × ${a39} =`, a: b39 * a39 };
          }
          break;
        }
        
        // 40关：乘数有5的乘法，乘数不超过5，填空
        case 40: {
          const a40 = Math.floor(Math.random() * 5) + 1; // 1-5
          const b40 = 5;
          // 随机选择填空位置
          const blankPos = Math.floor(Math.random() * 2);
          if (blankPos === 0) {
            question = { q: `( ) × ${b40} = ${a40 * b40}`, a: a40 };
          } else {
            question = { q: `${b40} × ( ) = ${a40 * b40}`, a: a40 };
          }
          break;
        }
        
        // 41关：乘数有2、3、4的乘法，乘数不超过5
        case 41: {
          const nums = [2, 3, 4];
          const a41 = nums[Math.floor(Math.random() * 3)];
          const b41 = Math.floor(Math.random() * 5) + 1; // 1-5
          // 随机交换乘数位置
          if (Math.random() < 0.5) {
            question = { q: `${a41} × ${b41} =`, a: a41 * b41 };
          } else {
            question = { q: `${b41} × ${a41} =`, a: b41 * a41 };
          }
          break;
        }
        
        // 42关：乘数有2、3、4的乘法，乘数不超过5，填空
        case 42: {
          const nums = [2, 3, 4];
          const a42 = nums[Math.floor(Math.random() * 3)];
          const b42 = Math.floor(Math.random() * 5) + 1; // 1-5
          // 随机选择填空位置
          const blankPos = Math.floor(Math.random() * 2);
          if (blankPos === 0) {
            question = { q: `( ) × ${b42} = ${a42 * b42}`, a: a42 };
          } else {
            question = { q: `${b42} × ( ) = ${a42 * b42}`, a: a42 };
          }
          break;
        }
        // 35关：两位数加两位数的进位加法
        case 35: {
          let a35, b35;
          do {
            a35 = Math.floor(Math.random() * 80) + 10; // 10-89
            b35 = Math.floor(Math.random() * 80) + 10; // 10-89
          } while ((a35 % 10 + b35 % 10) <= 10 || (a35 + b35) > 100); // 确保个位相加大于10且和不超过100
          question = { q: `${a35} + ${b35} =`, a: a35 + b35 };
          break;
        }
        
        // 36关：两位数减两位数的退位减法
        case 36: {
          let a36, b36;
          do {
            a36 = Math.floor(Math.random() * 80) + 10; // 10-89
            b36 = Math.floor(Math.random() * 80) + 10; // 10-89
          } while (a36 % 10 >= b36 % 10 || a36 <= b36); // 确保被减数个位小于减数个位且被减数大于减数
          question = { q: `${a36} - ${b36} =`, a: a36 - b36 };
          break;
        }
        
        // 37关：随机生成进位加法或退位减法题
        case 37: {
          // 随机选择加法或减法（50%概率）
          if (Math.random() < 0.5) {
            // 进位加法
            let a37, b37;
            do {
              a37 = Math.floor(Math.random() * 80) + 10; // 10-89
              b37 = Math.floor(Math.random() * 80) + 10; // 10-89
            } while ((a37 % 10 + b37 % 10) <= 10 || (a37 + b37) > 100); // 确保个位相加大于10且和不超过100
            question = { q: `${a37} + ${b37} =`, a: a37 + b37 };
          } else {
            // 退位减法
            let a37, b37;
            do {
              a37 = Math.floor(Math.random() * 80) + 10; // 10-89
              b37 = Math.floor(Math.random() * 80) + 10; // 10-89
            } while (a37 % 10 >= b37 % 10 || a37 <= b37); // 确保被减数个位小于减数个位且被减数大于减数
            question = { q: `${a37} - ${b37} =`, a: a37 - b37 };
          }
          break;
        }
        // 32关：两位数减一位数的退位减法
        case 32: {
          let a32, b32;
          do {
            a32 = Math.floor(Math.random() * 89) + 11; // 11-99
            b32 = Math.floor(Math.random() * 9) + 1; // 1-9
          } while (a32 % 10 >= b32 % 10 || a32 <= b32); // 确保被减数个位小于减数个位且被减数大于减数
          question = { q: `${a32} - ${b32} =`, a: a32 - b32 };
          break;
        }
        
        // 33关：32关的填空版本
        case 33: {
          let a33, b33;
          do {
            a33 = Math.floor(Math.random() * 89) + 11; // 11-99
            b33 = Math.floor(Math.random() * 9) + 1; // 1-9
          } while (a33 % 10 >= b33 % 10 || a33 <= b33); // 确保被减数个位小于减数个位且被减数大于减数
          
          // 随机选择填空位置（0或1）
          const blankPos = Math.floor(Math.random() * 2);
          if (blankPos === 0) {
            question = { q: `( ) - ${b33} = ${a33 - b33}`, a: a33 };
          } else {
            question = { q: `${a33} - ( ) = ${a33 - b33}`, a: b33 };
          }
          break;
        }
        
        // 34关：随机生成进位加法或退位减法题
        case 34: {
          // 随机选择加法或减法（50%概率）
          if (Math.random() < 0.5) {
            // 进位加法
            let a34, b34;
            do {
              a34 = Math.floor(Math.random() * 89) + 11; // 11-99
              b34 = Math.floor(Math.random() * 9) + 1; // 1-9
            } while ((a34 % 10 + b34) <= 10); // 确保个位相加大于10
            
            // 50%概率生成填空或求结果题
            if (Math.random() < 0.5) {
              question = { q: `${a34} + ${b34} =`, a: a34 + b34 };
            } else {
              // 填空题，随机选择a或b的位置填空
              const blankPos = Math.floor(Math.random() * 2);
              if (blankPos === 0) {
                question = { q: `( ) + ${b34} = ${a34 + b34}`, a: a34 };
              } else {
                question = { q: `${a34} + ( ) = ${a34 + b34}`, a: b34 };
              }
            }
          } else {
            // 退位减法
            let a34, b34;
            do {
              a34 = Math.floor(Math.random() * 89) + 11; // 11-99
              b34 = Math.floor(Math.random() * 9) + 1; // 1-9
            } while (a34 % 10 >= b34 % 10 || a34 <= b34); // 确保被减数个位小于减数个位且被减数大于减数
            
            // 50%概率生成填空或求结果题
            if (Math.random() < 0.5) {
              question = { q: `${a34} - ${b34} =`, a: a34 - b34 };
            } else {
              // 填空题，随机选择a或b的位置填空
              const blankPos = Math.floor(Math.random() * 2);
              if (blankPos === 0) {
                question = { q: `( ) - ${b34} = ${a34 - b34}`, a: a34 };
              } else {
                question = { q: `${a34} - ( ) = ${a34 - b34}`, a: b34 };
              }
            }
          }
          break;
        }
        // 27关：两位数减一位数或两位数减整十数
        case 27: {
          // 随机选择两种题型（50%概率）
          if (Math.random() < 0.5) {
            // 类型1: a-b，10<a<100，0<b<10
            let a27, b27;
            do {
              a27 = Math.floor(Math.random() * 89) + 11; // 11-99
              b27 = Math.floor(Math.random() * 9) + 1; // 1-9
            } while (a27 % 10 - b27 <= 1); // 确保被减数个位减减数个位大于1
            question = { q: `${a27} - ${b27} =`, a: a27 - b27 };
          } else {
            // 类型2: c-d，c不是整十数，10<c<100，d是整十数
            let c27, d27;
            do {
              c27 = Math.floor(Math.random() * 89) + 11; // 11-99
              while (c27 % 10 === 0) c27 = Math.floor(Math.random() * 89) + 11; // 确保c不是整十数
              d27 = Math.floor(Math.random() * 9 + 1) * 10; // 10,20,...,90
            } while (c27 % 10 - d27 % 10 <= 1); // 确保被减数个位减减数个位大于1
            question = { q: `${c27} - ${d27} =`, a: c27 - d27 };
          }
          break;
        }
        
        // 28关：27关的填空版本
        case 28: {
          // 随机选择两种题型（50%概率）
          if (Math.random() < 0.5) {
            // 类型1: a-b，10<a<100，0<b<10
            let a28, b28;
            do {
              a28 = Math.floor(Math.random() * 89) + 11; // 11-99
              b28 = Math.floor(Math.random() * 9) + 1; // 1-9
            } while (a28 % 10 - b28 <= 1 || a28 <= b28); // 确保被减数个位减减数个位大于1且被减数大于减数
            
            // 随机选择填空位置（0或1）
            const blankPos = Math.floor(Math.random() * 2);
            if (blankPos === 0) {
              question = { q: `( ) - ${b28} = ${a28 - b28}`, a: a28 };
            } else {
              question = { q: `${a28} - ( ) = ${a28 - b28}`, a: b28 };
            }
          } else {
            // 类型2: c-d，c不是整十数，10<c<100，d是整十数
            let c28, d28;
            do {
              c28 = Math.floor(Math.random() * 89) + 11; // 11-99
              while (c28 % 10 === 0) c28 = Math.floor(Math.random() * 89) + 11; // 确保c不是整十数
              d28 = Math.floor(Math.random() * 9 + 1) * 10; // 10,20,...,90
            } while (c28 % 10 - d28 % 10 <= 1 || c28 <= d28); // 确保被减数个位减减数个位大于1且被减数大于减数
            
            // 随机选择填空位置（0或1）
            const blankPos = Math.floor(Math.random() * 2);
            if (blankPos === 0) {
              question = { q: `( ) - ${d28} = ${c28 - d28}`, a: c28 };
            } else {
              question = { q: `${c28} - ( ) = ${c28 - d28}`, a: d28 };
            }
          }
          break;
        }
        
        // 29关：四种算式类型（a-b、a+b、c-d、c+d）
        case 29: {
          // 随机选择四种题型（各25%概率）
          const type29 = Math.random();
          
          if (type29 < 0.25) {
            // 类型1: a-b，10<a<100，0<b<10
            let a29, b29;
            do {
              a29 = Math.floor(Math.random() * 89) + 11; // 11-99
              b29 = Math.floor(Math.random() * 9) + 1; // 1-9
            } while (a29 % 10 - b29 <= 1 || a29 <= b29); // 确保被减数个位减减数个位大于1且被减数大于减数
            
            // 50%概率生成填空或求结果题
            if (Math.random() < 0.5) {
              // 求结果题
              question = { q: `${a29} - ${b29} =`, a: a29 - b29 };
            } else {
              // 填空题，随机选择a或b的位置填空
              const blankPos = Math.floor(Math.random() * 2);
              if (blankPos === 0) {
                question = { q: `( ) - ${b29} = ${a29 - b29}`, a: a29 };
              } else {
                question = { q: `${a29} - ( ) = ${a29 - b29}`, a: b29 };
              }
            }
          } else if (type29 < 0.5) {
            // 类型2: a+b，10<a<100，0<b<10
            let a29, b29;
            do {
              a29 = Math.floor(Math.random() * 89) + 11; // 11-99
              b29 = Math.floor(Math.random() * 9) + 1; // 1-9
            } while ((a29 % 10 + b29) >= 10 || (Math.floor(a29 / 10) + Math.floor(b29 / 10)) >= 10); // 确保个位和十位相加均小于10
            
            // 50%概率生成填空或求结果题
            if (Math.random() < 0.5) {
              // 求结果题
              question = { q: `${a29} + ${b29} =`, a: a29 + b29 };
            } else {
              // 填空题，随机选择a或b的位置填空
              const blankPos = Math.floor(Math.random() * 2);
              if (blankPos === 0) {
                question = { q: `( ) + ${b29} = ${a29 + b29}`, a: a29 };
              } else {
                question = { q: `${a29} + ( ) = ${a29 + b29}`, a: b29 };
              }
            }
          } else if (type29 < 0.75) {
            // 类型3: c-d，c不是整十数，10<c<100，d是整十数
            let c29, d29;
            do {
              c29 = Math.floor(Math.random() * 89) + 11; // 11-99
              while (c29 % 10 === 0) c29 = Math.floor(Math.random() * 89) + 11; // 确保c不是整十数
              d29 = Math.floor(Math.random() * 9 + 1) * 10; // 10,20,...,90
            } while (c29 % 10 - d29 % 10 <= 1 || c29 <= d29); // 确保被减数个位减减数个位大于1且被减数大于减数
            
            // 50%概率生成填空或求结果题
            if (Math.random() < 0.5) {
              // 求结果题
              question = { q: `${c29} - ${d29} =`, a: c29 - d29 };
            } else {
              // 填空题，随机选择c或d的位置填空
              const blankPos = Math.floor(Math.random() * 2);
              if (blankPos === 0) {
                question = { q: `( ) - ${d29} = ${c29 - d29}`, a: c29 };
              } else {
                question = { q: `${c29} - ( ) = ${c29 - d29}`, a: d29 };
              }
            }
          } else {
            // 类型4: c+d，c不是整十数，10<c<100，d是整十数
            let c29, d29;
            do {
              c29 = Math.floor(Math.random() * 89) + 11; // 11-99
              while (c29 % 10 === 0) c29 = Math.floor(Math.random() * 89) + 11; // 确保c不是整十数
              d29 = Math.floor(Math.random() * 9 + 1) * 10; // 10,20,...,90
            } while ((c29 % 10 + d29 % 10) >= 10 || (Math.floor(c29 / 10) + Math.floor(d29 / 10)) >= 10); // 确保个位和十位相加均小于10
            
            // 50%概率生成填空或求结果题
            if (Math.random() < 0.5) {
              // 求结果题
              question = { q: `${c29} + ${d29} =`, a: c29 + d29 };
            } else {
              // 填空题，随机选择c或d的位置填空
              const blankPos = Math.floor(Math.random() * 2);
              if (blankPos === 0) {
                question = { q: `( ) + ${d29} = ${c29 + d29}`, a: c29 };
              } else {
                question = { q: `${c29} + ( ) = ${c29 + d29}`, a: d29 };
              }
            }
          }
          break;
        }
        // 25关：两位数加一位数或两位数加整十数
        case 25: {
          // 随机选择两种题型（50%概率）
          if (Math.random() < 0.5) {
            // 类型1: a+b，10<a<100，0<b<10
            let a25, b25;
            do {
              a25 = Math.floor(Math.random() * 89) + 11; // 11-99
              b25 = Math.floor(Math.random() * 9) + 1; // 1-9
            } while ((a25 % 10 + b25) >= 10 || (Math.floor(a25 / 10) + Math.floor(b25 / 10)) >= 10);
            question = { q: `${a25} + ${b25} =`, a: a25 + b25 };
          } else {
            // 类型2: c+d，c不是整十数，10<c<100，d是整十数
            let c25, d25;
            do {
              c25 = Math.floor(Math.random() * 89) + 11; // 11-99
              while (c25 % 10 === 0) c25 = Math.floor(Math.random() * 89) + 11; // 确保c不是整十数
              d25 = Math.floor(Math.random() * 9 + 1) * 10; // 10,20,...,90
            } while ((c25 % 10 + d25 % 10) >= 10 || (Math.floor(c25 / 10) + Math.floor(d25 / 10)) >= 10);
            question = { q: `${c25} + ${d25} =`, a: c25 + d25 };
          }
          break;
        }
        
        // 26关：25关的填空版本
        case 26: {
          // 随机选择两种题型（50%概率）
          if (Math.random() < 0.5) {
            // 类型1: a+b，10<a<100，0<b<10
            let a26, b26;
            do {
              a26 = Math.floor(Math.random() * 89) + 11; // 11-99
              b26 = Math.floor(Math.random() * 9) + 1; // 1-9
            } while ((a26 % 10 + b26) >= 10 || (Math.floor(a26 / 10) + Math.floor(b26 / 10)) >= 10);
            
            // 随机选择填空位置（0或1）
            const blankPos = Math.floor(Math.random() * 2);
            if (blankPos === 0) {
              question = { q: `( ) + ${b26} = ${a26 + b26}`, a: a26 };
            } else {
              question = { q: `${a26} + ( ) = ${a26 + b26}`, a: b26 };
            }
          } else {
            // 类型2: c+d，c不是整十数，10<c<100，d是整十数
            let c26, d26;
            do {
              c26 = Math.floor(Math.random() * 89) + 11; // 11-99
              while (c26 % 10 === 0) c26 = Math.floor(Math.random() * 89) + 11; // 确保c不是整十数
              d26 = Math.floor(Math.random() * 9 + 1) * 10; // 10,20,...,90
            } while ((c26 % 10 + d26 % 10) >= 10 || (Math.floor(c26 / 10) + Math.floor(d26 / 10)) >= 10);
            
            // 随机选择填空位置（0或1）
            const blankPos = Math.floor(Math.random() * 2);
            if (blankPos === 0) {
              question = { q: `( ) + ${d26} = ${c26 + d26}`, a: c26 };
            } else {
              question = { q: `${c26} + ( ) = ${c26 + d26}`, a: d26 };
            }
          }
          break;
        }
        // 1-6关基础题目
        case 1: question = generateBasicQuestion(5, false, false); break;
        case 2: question = generateBlankQuestion(5, false, false); break;
        case 3: question = generateBasicQuestion(10, true, false); break;
        case 4: question = generateBlankQuestion(10, true, false); break;
        case 5: question = generateBasicQuestion(10, false, true); break;
        case 6: question = generateBlankQuestion(10, false, true); break;

        // 7-24关进阶题目
        case 7: {
          // 生成一位数加法题，和<11，至少一个数>5，50%填空或求结果
          let a7, b7, c7;
          do {
            a7 = Math.floor(Math.random() * 10); // 0-9
            b7 = Math.floor(Math.random() * 10);
            c7 = a7 + b7;
          } while (c7 >= 11 || (a7 <= 5 && b7 <= 5 && c7 <= 5)); // 确保和<11且至少一个数>5
          
          // 50%概率生成填空或求结果题
          if (Math.random() < 0.5) {
            // 求结果题
            question = { q: `${a7} + ${b7} =`, a: c7 };
          } else {
            // 填空题，随机选择a、b或c的位置填空
            const blankPos7 = Math.floor(Math.random() * 3);
            if (blankPos7 === 0) {
              question = { q: `( ) + ${b7} = ${c7}`, a: a7 };
            } else if (blankPos7 === 1) {
              question = { q: `${a7} + ( ) = ${c7}`, a: b7 };
            } else {
              question = { q: `${a7} + ${b7} = ( )`, a: c7 };
            }
          }
          break;
        }
        case 8: {
          // 按概率分配四种题型（各25%）
          const type8 = Math.random();
          let a8, b8, c8, d8;
          do {
            if (type8 < 0.25) {
              // 题型1: a8+b8+c8=d8，d8≤10
              a8 = Math.floor(Math.random() * 11);
              b8 = Math.floor(Math.random() * (11 - a8));
              c8 = Math.floor(Math.random() * (11 - (a8 + b8)));
              d8 = a8 + b8 + c8;
            } else if (type8 < 0.5) {
              // 题型2: a8-b8-c8=d8，a8≤10
              a8 = Math.floor(Math.random() * 11);
              b8 = Math.floor(Math.random() * (a8 + 1));
              const temp = a8 - b8;
              c8 = Math.floor(Math.random() * (temp + 1));
              d8 = temp - c8;
            } else if (type8 < 0.75) {
              // 题型3: a8+b8-c8=d8，a8+b8≤10
              a8 = Math.floor(Math.random() * 11);
              b8 = Math.floor(Math.random() * (11 - a8));
              const sum = a8 + b8;
              c8 = Math.floor(Math.random() * (sum + 1));
              d8 = sum - c8;
            } else {
              // 题型4: a8-b8+c8=d8，a8≤10且d8≤10
              a8 = Math.floor(Math.random() * 11);
              b8 = Math.floor(Math.random() * (a8 + 1));
              const temp = a8 - b8;
              c8 = Math.floor(Math.random() * (11 - temp));
              d8 = temp + c8;
            }
            // 验证所有数值在0-10之间
          } while (
            a8 < 0 || a8 > 10 || b8 < 0 || b8 > 10 || c8 < 0 || c8 > 10 || d8 < 0 || d8 > 10
          );
          // 生成题目（示例为求结果题）
          switch (true) {
            case type8 < 0.25: question = { q: `${a8}+${b8}+${c8}=`, a: d8 }; break;
            case type8 < 0.5: question = { q: `${a8}-${b8}-${c8}=`, a: d8 }; break;
            case type8 < 0.75: question = { q: `${a8}+${b8}-${c8}=`, a: d8 }; break;
            default: question = { q: `${a8}-${b8}+${c8}=`, a: d8 };
          }
          break;
        }
        case 9: 
          // 随机选择三种题型（各33%概率）
          const type9 = Math.floor(Math.random() * 3);
          let a9, b9;
          
          if (type9 === 0) {
            // 类型1: a-10，10<a<20
            a9 = Math.floor(Math.random() * 9) + 11; // 11-19
            question = { q: `${a9} - 10 =`, a: a9 - 10 };
          } else if (type9 === 1) {
            // 类型2: a-b，10<a<20且0<b<10且a的个位>b
            do {
              a9 = Math.floor(Math.random() * 9) + 11; // 11-19
              b9 = Math.floor(Math.random() * 9) + 1; // 1-9
            } while (a9 % 10 <= b9);
            question = { q: `${a9} - ${b9} =`, a: a9 - b9 };
          } else {
            // 类型3: a+b，10<a<20且0<b<10且a的个位+b的个位<10
            do {
              a9 = Math.floor(Math.random() * 9) + 11; // 11-19
              b9 = Math.floor(Math.random() * 9) + 1; // 1-9
            } while ((a9 % 10 + b9 % 10) >= 10);
            question = { q: `${a9} + ${b9} =`, a: a9 + b9 };
          }
          break;
        case 10: 
          // 随机选择三种题型（各33%概率）
          const type10 = Math.floor(Math.random() * 3);
          let a10, b10;
          
          if (type10 === 0) {
            // 类型1: a-10，10<a<20
            a10 = Math.floor(Math.random() * 9) + 11; // 11-19
            
            // 随机选择填空位置（0或1）
            const blankPos14_1 = Math.floor(Math.random() * 2);
            if (blankPos14_1 === 0) { // 第一个数填空
              question = { q: `( ) - 10 = ${a10 - 10}`, a: a10 };
            } else { // 第二个数填空
              question = { q: `${a10} - ( ) = ${a10 - 10}`, a: 10 };
            }
          } else if (type10 === 1) {
            // 类型2: a-b，10<a<20且0<b<10且a的个位>b
            do {
              a10 = Math.floor(Math.random() * 9) + 11; // 11-19
              b10 = Math.floor(Math.random() * 9) + 1; // 1-9
            } while (a10 % 10 <= b10);
            
            // 随机选择填空位置（0或1）
            const blankPos14_1 = Math.floor(Math.random() * 2);
            if (blankPos14_1 === 0) { // 第一个数填空
              question = { q: `( ) - ${b10} = ${a10 - b10}`, a: a10 };
            } else { // 第二个数填空
              question = { q: `${a10} - ( ) = ${a10 - b10}`, a: b10 };
            }
          } else {
            // 类型3: a+b，10<a<20且0<b<10且a的个位+b的个位<10
            do {
              a10 = Math.floor(Math.random() * 9) + 11; // 11-19
              b10 = Math.floor(Math.random() * 9) + 1; // 1-9
            } while ((a10 % 10 + b10 % 10) >= 10);
            
            // 随机选择填空位置（0或1）
            const blankPos14_1 = Math.floor(Math.random() * 2);
            if (blankPos14_1 === 0) { // 第一个数填空
              question = { q: `( ) + ${b10} = ${a10 + b10}`, a: a10 };
            } else { // 第二个数填空
              question = { q: `${a10} + ( ) = ${a10 + b10}`, a: b10 };
            }
          }
          break;
        case 11: 
          // 生成9+a或a+9题目，1<a<10
          const a11 = Math.floor(Math.random() * 8) + 2; // 2-9
          const isReverse = Math.random() > 0.5;
          question = {
            q: isReverse ? `${a11} + 9 =` : `9 + ${a11} =`,
            a: 9 + a11
          };
          break;
        case 12: 
          // 生成9+a或a+9的填空题，1<a<10
          do {
            const a12 = Math.floor(Math.random() * 8) + 2; // 2-9
            const isReverse = Math.random() > 0.5;
            const blankPos14_1 = Math.floor(Math.random() * 2);
            
            if (blankPos14_1 === 0) {
              question = { q: `( )${isReverse ? '+9' : '+'+a12}=${9 + a12}`, a: isReverse ? a12 : 9 };
            } else {
              question = { q: `${isReverse ? a12 : 9}+( )=${9 + a12}`, a: isReverse ? 9 : a12 };
            }
          } while (question.q === lastQ);
          break;
        case 13: {
          let a13, b13;
          do {
            a13 = Math.floor(Math.random() * 3) + 6;
            b13 = Math.floor(Math.random() * 9) + 1;
          } while (a13 + b13 <= 10);
          if(Math.random() > 0.5) [a13, b13] = [b13, a13];
          question = { q: `${a13} + ${b13} =`, a: a13 + b13 };
          break;
        }
        case 24: {
          let a, b;
          do {
            a = Math.floor(Math.random() * 8) + 11; // 11-18（10<a<19）
            b = Math.floor(Math.random() * 8) + 2; // 2-9（1<b<10）
          } while (a % 10 >= b); // 确保被减数个位小于减数

          const isBlank = Math.random() < 0.5; // 50%概率填空
          if (isBlank) {
            const blankPos = Math.floor(Math.random() * 2);
            if (blankPos === 0) {
              question = { q: `( ) - ${b} = ${a - b}`, a: a };
            } else {
              question = { q: `${a} - ( ) = ${a - b}`, a: b };
            }
          } else {
            question = { q: `${a} - ${b} =`, a: a - b };
          }
          break;
        }
        case 25: {
          const type = Math.random() < 0.5 ? 'type1' : 'type2'; // 两种类型均衡

          if (type === 'type1') {
            let a, b;
            do {
              a = Math.floor(Math.random() * 89) + 11; // 11-99
              b = Math.floor(Math.random() * 9) + 1; // 1-9
            } while ((a % 10 + b) >= 10 || Math.floor(a / 10) >= 10); // 十位个位相加<10
            question = { q: `${a} + ${b} =`, a: a + b };
          } else {
            let c, d;
            do {
              c = Math.floor(Math.random() * 89) + 11; // 11-99
              d = Math.floor(Math.random() * 9) * 10; // 10,20,...,90
            } while (c % 10 === 0 || (Math.floor(c / 10) + Math.floor(d / 10)) >= 10 || (c % 10 + d % 10) >= 10); // 非整十数且十位个位相加<10
            question = { q: `${c} + ${d} =`, a: c + d };
          }
          break;
        }
        case 26: {
          const type = Math.random() < 0.5 ? 'type1' : 'type2'; // 两种类型均衡

          if (type === 'type1') {
            let a, b, sum;
            do {
              a = Math.floor(Math.random() * 89) + 11;
              b = Math.floor(Math.random() * 9) + 1;
              sum = a + b;
            } while ((a % 10 + b) >= 10 || Math.floor(a / 10) >= 10);

            const blankPos = Math.random() < 0.5 ? 0 : 1;
            if (blankPos === 0) {
              question = { q: `( ) + ${b} = ${sum}`, a: a };
            } else {
              question = { q: `${a} + ( ) = ${sum}`, a: b };
            }
          } else {
            let c, d, sum;
            do {
              c = Math.floor(Math.random() * 89) + 11;
              d = Math.floor(Math.random() * 9) * 10;
              sum = c + d;
            } while (c % 10 === 0 || (Math.floor(c / 10) + Math.floor(d / 10)) >= 10 || (c % 10 + d % 10) >= 10);

            const blankPos = Math.random() < 0.5 ? 0 : 1;
            if (blankPos === 0) {
              question = { q: `( ) + ${d} = ${sum}`, a: c };
            } else {
              question = { q: `${c} + ( ) = ${sum}`, a: d };
            }
          }
          break;
        }
        case 14: {
          let x14, y14;
          do {
            x14 = Math.floor(Math.random() * 3) + 6;
            y14 = Math.floor(Math.random() * 8) + 2;
          } while (x14 + y14 <= 10);
          const blankPos14_2 = Math.floor(Math.random() * 2);
          if (blankPos14_2 === 0) {
            question = { q: `( ) + ${y14} = ${x14 + y14}`, a: x14 };
          } else {
            question = { q: `${x14} + ( ) = ${x14 + y14}`, a: y14 };
          }
          break;
        }
        case 15: {
          // 生成a15+b15或b15+a15，确保1<a15<6，1<b15<10且a15+b15>10
          let a15, b15;
          do {
            a15 = Math.floor(Math.random() * 4) + 2; // 2-5
            b15 = Math.floor(Math.random() * 8) + 2; // 2-9
          } while (a15 + b15 <= 10);
          // 随机交换a15和b15位置
          if(Math.random() > 0.5) [a15, b15] = [b15, a15];
          question = { q: `${a15} + ${b15} =`, a: a15 + b15 };
          break;
        }
        case 16: {
          let A16, B16;
          do {
            A16 = Math.floor(Math.random() * 4) + 2; // 2-5
            B16 = Math.floor(Math.random() * 8) + 2; // 2-9
          } while (A16 + B16 <= 10);
          // 随机交换A16和B16的位置
          if (Math.random() > 0.5) [A16, B16] = [B16, A16];
          // 随机选择填空位置（0或1）
          const blankPos16 = Math.floor(Math.random() * 2);
          if (blankPos16 === 0) {
            question = { q: `( ) + ${B16} = ${A16 + B16}`, a: A16 };
          } else {
            question = { q: `${A16} + ( ) = ${A16 + B16}`, a: B16 };
          }
          break;
        }
        case 17: {
          // 生成a17+b17=c题目，1<a17<10，1<b17<10，c>10，50%概率生成填空或求结果题
          let a17, b17;
          do {
            a17 = Math.floor(Math.random() * 8) + 2; // 2-9
            b17 = Math.floor(Math.random() * 8) + 2; // 2-9
          } while (a17 + b17 <= 10);
          
          // 50%概率生成填空或求结果题
          if (Math.random() < 0.5) {
            // 求结果题
            question = { q: `${a17} + ${b17} =`, a: a17 + b17 };
          } else {
            // 填空题，随机选择a、b或c的位置填空
            const blankPos17 = Math.floor(Math.random() * 3);
            if (blankPos17 === 0) {
              question = { q: `( ) + ${b17} = ${a17 + b17}`, a: a17 };
            } else if (blankPos17 === 1) {
              question = { q: `${a17} + ( ) = ${a17 + b17}`, a: b17 };
            } else {
              question = { q: `${a17} + ${b17} = ( )`, a: a17 + b17 };
            }
          }
          break;
        }
        case 18: question = generateMinus9(); break;
        case 21: {
          // 第21关：十几减8/7/6（被减数填空，个位<减数）
          const subtractors = [8, 7, 6];
          const sub = subtractors[Math.floor(Math.random() * subtractors.length)];
          let minuend, difference;
          do {
            difference = Math.floor(Math.random() * 8) + 2; // 差范围2-9（确保被减数≥11）
            minuend = difference + sub;
          } while (minuend < 11 || minuend > 19 || (minuend % 10) >= sub);
          question = { q: `( ) - ${sub} = ${difference}`, a: minuend };
          break;
        }
        case 22: {
          // 第22关：十几减5/4/3/2（标准算式，个位<减数）
          const subtractors = [5, 4, 3, 2];
          const sub = subtractors[Math.floor(Math.random() * subtractors.length)];
          let minuend;
          do {
            minuend = Math.floor(Math.random() * 9) + 11; // 11-19
          } while ((minuend % 10) >= sub);
          question = { q: `${minuend} - ${sub} =`, a: minuend - sub };
          break;
        }
        case 23: {
          // 第23关：十几减5/4/3/2（填空被减数或减数，个位<减数）
          const subtractors = [5, 4, 3, 2];
          const sub = subtractors[Math.floor(Math.random() * subtractors.length)];
          const blankPos = Math.floor(Math.random() * 2);
          let minuend, difference;
          if (blankPos === 0) {
            // 填被减数
            do {
              difference = Math.floor(Math.random() * 8) + 2; // 差范围2-9
              minuend = difference + sub;
            } while (minuend < 11 || minuend > 19 || (minuend % 10) >= sub);
            question = { q: `( ) - ${sub} = ${difference}`, a: minuend };
          } else {
            // 填减数
            do {
              minuend = Math.floor(Math.random() * 9) + 11; // 11-19
              difference = minuend - sub;
            } while ((minuend % 10) >= sub || difference < 2); // 确保差合理
            question = { q: `${minuend} - ( ) = ${difference}`, a: sub };
          }
          break;
        }        case 19: question = generateMinus9(true); break;
        // 25-36关两位数运算
        case 25: 
          // 随机选择两种题型（50%概率）
          if(Math.random() < 0.5) {
            // 题型1: a+b，10<a<100，0<b<10
            let a, b;
            do {
              a = Math.floor(Math.random() * 90) + 11; // 11-100
              b = Math.floor(Math.random() * 10); // 0-9
            } while((a%10 + b%10) >= 10 || Math.floor(a/10) + Math.floor(b/10) >= 10);
            question = { q: `${a} + ${b} =`, a: a + b };
          } else {
            // 题型2: c+d，c非整十数且10<c<100，d为整十数
            let c, d;
            do {
              c = Math.floor(Math.random() * 89) + 11; // 11-99
              d = Math.floor(Math.random() * 9 + 1) * 10; // 10,20,...,90
            } while(c%10 === 0 || (c%10 + d%10) >= 10 || Math.floor(c/10) + Math.floor(d/10) >= 10);
            question = { q: `${c} + ${d} =`, a: c + d };
          }
          break;
        case 26: 
          // 随机选择两种题型（50%概率）
          if(Math.random() < 0.5) {
            // 题型1: a+b，10<a<100，0<b<10
            let a, b;
            do {
              a = Math.floor(Math.random() * 89) + 11; // 11-99
              b = Math.floor(Math.random() * 10); // 0-9
            } while((a%10 + b%10) >= 10 || Math.floor(a/10) + Math.floor(b/10) >= 10);
            
            // 随机选择填空位置（0或1）
            const blankPos14_1 = Math.floor(Math.random() * 2);
            if (blankPos14_1 === 0) { // 第一个数填空
              question = { q: `( ) + ${b} = ${a + b}`, a: a };
            } else { // 第二个数填空
              question = { q: `${a} + ( ) = ${a + b}`, a: b };
            }
          } else {
            // 题型2: c+d，c非整十数且10<c<100，d为整十数
            let c, d;
            do {
              c = Math.floor(Math.random() * 89) + 11; // 11-99
              d = Math.floor(Math.random() * 9 + 1) * 10; // 10,20,...,90
            } while(c%10 === 0 || (c%10 + d%10) >= 10 || Math.floor(c/10) + Math.floor(d/10) >= 10);
            
            // 随机选择填空位置（0或1）
            const blankPos14_1 = Math.floor(Math.random() * 2);
            if (blankPos14_1 === 0) { // 第一个数填空
              question = { q: `( ) + ${d} = ${c + d}`, a: c };
            } else { // 第二个数填空
              question = { q: `${c} + ( ) = ${c + d}`, a: d };
            }
          }
          break;
        case 27: question = generateTwoDigit(true); break;
        case 28: question = generateTwoDigit(true, true); break;
        case 29: 
          // 随机选择四种题型（各25%概率）
          const type29 = Math.random();
          let a29, b29, c29, d29;
          
          if (type29 < 0.25) {
            // 题型1: a+b，10<a<100，0<b<10
            do {
              a29 = Math.floor(Math.random() * 89) + 11; // 11-99
              b29 = Math.floor(Math.random() * 9) + 1; // 1-9
            } while((a29%10 + b29%10) >= 10 || Math.floor(a29/10) + Math.floor(b29/10) >= 10);
            
            // 50%概率生成填空或求结果题
            if (Math.random() < 0.5) {
              question = { q: `${a29} + ${b29} =`, a: a29 + b29 };
            } else {
              const blankPos14_1 = Math.floor(Math.random() * 2);
              if (blankPos14_1 === 0) {
                question = { q: `( ) + ${b29} = ${a29 + b29}`, a: a29 };
              } else {
                question = { q: `${a29} + ( ) = ${a29 + b29}`, a: b29 };
              }
            }
          } else if (type29 < 0.5) {
            // 题型2: a-b，10<a<100，0<b<10，且a的个位减b的个位大于1
            do {
              a29 = Math.floor(Math.random() * 89) + 11; // 11-99
              b29 = Math.floor(Math.random() * 9) + 1; // 1-9
            } while((a29%10 - b29%10) <= 1 || (a29 - b29) < 0);
            
            if (Math.random() < 0.5) {
              question = { q: `${a29} - ${b29} =`, a: a29 - b29 };
            } else {
              const blankPos14_1 = Math.floor(Math.random() * 2);
              if (blankPos14_1 === 0) {
                question = { q: `( ) - ${b29} = ${a29 - b29}`, a: a29 };
              } else {
                question = { q: `${a29} - ( ) = ${a29 - b29}`, a: b29 };
              }
            }
          } else if (type29 < 0.75) {
            // 题型3: c+d，c非整十数且10<c<100，d为整十数
            do {
              c29 = Math.floor(Math.random() * 89) + 11; // 11-99
              d29 = Math.floor(Math.random() * 9 + 1) * 10; // 10,20,...,90
            } while(c29%10 === 0 || (c29%10 + d29%10) >= 10 || Math.floor(c29/10) + Math.floor(d29/10) >= 10);
            
            if (Math.random() < 0.5) {
              question = { q: `${c29} + ${d29} =`, a: c29 + d29 };
            } else {
              const blankPos14_1 = Math.floor(Math.random() * 2);
              if (blankPos14_1 === 0) {
                question = { q: `( ) + ${d29} = ${c29 + d29}`, a: c29 };
              } else {
                question = { q: `${c29} + ( ) = ${c29 + d29}`, a: d29 };
              }
            }
          } else {
            // 题型4: c-d，c非整十数且10<c<100，d为整十数，且c的个位减d的个位大于1
            do {
              c29 = Math.floor(Math.random() * 89) + 11; // 11-99
              d29 = Math.floor(Math.random() * 9 + 1) * 10; // 10,20,...,90
            } while(c29%10 === 0 || (c29%10 - d29%10) <= 1 || (c29 - d29) < 0);
            
            if (Math.random() < 0.5) {
              question = { q: `${c29} - ${d29} =`, a: c29 - d29 };
            } else {
              const blankPos14_1 = Math.floor(Math.random() * 2);
              if (blankPos14_1 === 0) {
                question = { q: `( ) - ${d29} = ${c29 - d29}`, a: c29 };
              } else {
                question = { q: `${c29} - ( ) = ${c29 - d29}`, a: d29 };
              }
            }
          }
          break;
        case 30: 
          // 两位数加一位数的进位加法，确保两加数的和<100且个位相加大于10
          let a30, b30;
          do {
            a30 = Math.floor(Math.random() * 89) + 11; // 11-99
            b30 = Math.floor(Math.random() * 9) + 1; // 1-9
          } while((a30 + b30) >= 100 || (a30%10 + b30%10) <= 10);
          question = { q: `${a30} + ${b30} =`, a: a30 + b30 };
          break;
        case 31: 
          // 两位数加一位数的进位加法，确保两加数的和<100且个位相加大于10
          let a31, b31;
          do {
            a31 = Math.floor(Math.random() * 89) + 11; // 11-99
            b31 = Math.floor(Math.random() * 9) + 1; // 1-9
          } while((a31 + b31) >= 100 || (a31%10 + b31%10) <= 10);
          
          // 随机选择填空位置（0或1）
          const blankPos14_1 = Math.floor(Math.random() * 2);
          if (blankPos14_1 === 0) { // 第一个数填空
            question = { q: `( ) + ${b31} = ${a31 + b31}`, a: a31 };
          } else { // 第二个数填空
            question = { q: `${a31} + ( ) = ${a31 + b31}`, a: b31 };
          }
          break;
        case 32: question = generateTwoDigitBorrow(); break;
        case 33: question = generateTwoDigitBorrow(true); break;
        case 34: question = generateRandomType(30,33); break;
        case 35: question = generateTwoDigitDoubleCarry(); break;
        case 36: question = generateTwoDigitDoubleBorrow(); break;

        // 37-54关乘法及混合运算
        case 37: question = generateMultiplyQuestion(2); break;
        case 38:
          // 随机选择加法或减法（各50%概率）
          const isAddition = Math.random() > 0.5;
          let a38, b38;
          
          if (isAddition) {
            // 生成a+b题目，确保11<a<100，4<b<100，且结果在2-100之间
            do {
              a38 = Math.floor(Math.random() * 88) + 12; // 12-99
              b38 = Math.floor(Math.random() * 95) + 5; // 5-99
            } while ((a38 + b38) < 2 || (a38 + b38) > 100);
            question = { q: `${a38} + ${b38} =`, a: a38 + b38 };
          } else {
            // 生成a-b题目，确保11<a<100，4<b<100，且结果在2-100之间
            do {
              a38 = Math.floor(Math.random() * 88) + 12; // 12-99
              b38 = Math.floor(Math.random() * 95) + 5; // 5-99
            } while ((a38 - b38) < 2 || (a38 - b38) > 100);
            question = { q: `${a38} - ${b38} =`, a: a38 - b38 };
          }
          break;
        case 39: question = generateMultiplyQuestion(4); break;
        case 40: question = generateMultiplyQuestion(5); break;
        case 41: question = generateMultiplyQuestion(6); break;
        case 42: question = generateMultiplyQuestion(7); break;
        case 43: question = generateMultiplyQuestion(7); break;
        case 44: question = generateMultiplyQuestion(7, true); break;
        case 45: question = generateRandomMultiply(2,6); break;
        case 46: question = generateMultiplyQuestion(8); break;
        case 47: question = generateMultiplyQuestion(8, true); break;
        case 48: question = generateMultiplyQuestion(9); break;
        case 49: question = generateMultiplyQuestion(9, true); break;
        case 50: question = generateRandomMultiply(7,9); break;
        case 51: question = generateRandomMultiply(2,9); break;
        case 52: question = generateMixedQuestion(); break;
        
        


            case 54: question = generateMixedQuestion(true); break;
        default: // 默认生成10以内加法
          question = generateBasicQuestion(10, false, false);
      }
      tryCount++;
    } while ((question?.q === lastQ || !question?.q) && tryCount < 10);
    arr.push(question);
    lastQ = question.q;
  }
  return arr;
}

// 生成基础加减法题目
// 基础题目生成器
function generateBasicQuestion(max, needGT5, need10) {
  // 新增进位/退位验证逻辑
  const validateCarry = (num1, num2, op) => {
    if(op === '+' && (num1%10 + num2%10) >= 10) return true;
    if(op === '-' && (num1%10 < num2%10)) return true;
    return false;
  };

  let num1, num2, op, ans;
  while (true) {
    num1 = Math.floor(Math.random() * (max + 1));
    num2 = Math.floor(Math.random() * (max + 1));
    op = Math.random() > 0.5 ? '+' : '-';
    
    // 新增综合关卡验证
    if(level >=7 && level <=24) {
      if(op === '+' && !validateCarry(num1, num2, '+')) continue;
      if(op === '-' && !validateCarry(num1, num2, '-')) continue;
    }

    if (op === '+') {
      ans = num1 + num2;
      if (ans > max) continue;
      // 第3关特殊处理：所有数小于10且必须包含大于5的数
      if(level === 3) {
        if(ans >= 10 || num1 >= 10 || num2 >= 10) continue;
        if(num1 <= 5 && num2 <= 5 && ans <= 5) continue;
      }
      if (needGT5 && num1 <= 5 && num2 <= 5) continue;
      if (need10 && num1 !== 10 && num2 !== 10 && ans !== 10) continue;
      break;
    } else {
      ans = num1 - num2;
      if (ans < 0) continue;
      // 第3关特殊处理：所有数小于10且必须包含大于5的数
      if(level === 3) {
        if(ans >= 10 || num1 >= 10 || num2 >= 10) continue;
        if(num1 <= 5 && num2 <= 5 && ans <= 5) continue;
      }
      if (needGT5 && num1 <= 5 && num2 <= 5) continue;
      if (need10 && num1 !== 10 && num2 !== 10) continue;
      break;
    }
  }
  return {
    q: `${num1} ${op} ${num2} =`,
    a: ans
  };
}


// 生成填空题型
function generateBlankQuestion(max, needGT5, need10) {
  // 第2关特殊处理：限定0-5范围
  const isLevel2 = level === 2;
  // 第4关特殊处理：所有数字小于10且必须包含大于5的数
  const isLevel4 = level === 4;
  // 第6关特殊处理：必须包含数字10的加减法填空题
  const isLevel6 = level === 6;
  
  if (isLevel6) {
    // 随机选择加法或减法
    const isAddition = Math.random() > 0.5;
    let question;
    
    if (isAddition) {
      // 生成两数相加得10的题目
      const num2 = Math.floor(Math.random() * 10);
      const blankPos14_1 = Math.floor(Math.random() * 2); // 随机选择填空位置
      
      if (blankPos14_1 === 0) { // 第一个数填空
        return {
          q: `( ) + ${num2} = 10`,
          a: 10 - num2
        };
      } else { // 第二个数填空
        return {
          q: `${10 - num2} + ( ) = 10`,
          a: num2
        };
      }
    } else {
      // 生成10减一位数的题目
      const num2 = Math.floor(Math.random() * 10);
      const blankPos14_1 = Math.floor(Math.random() * 2); // 随机选择填空位置
      
      if (blankPos14_1 === 0) { // 第一个数填空(必须是10)
        return {
          q: `( ) - ${num2} = ${10 - num2}`,
          a: 10
        };
      } else { // 第二个数填空
        return {
          q: `10 - ( ) = ${10 - num2}`,
          a: num2
        };
      }
    }
  }
  
  const question = generateBasicQuestion(isLevel2 ? 5 : max, needGT5, need10);
  const parts = question.q.split(' ');
  
  // 确保答案在0-5范围内（第2关）
  if(isLevel2 && question.a > 5) {
    question.a = 5;
  }
  // 确保操作数也在0-5范围内（第2关）
  if(isLevel2) {
    parts[0] = Math.min(5, parseInt(parts[0]));
    parts[2] = Math.min(5, parseInt(parts[2]));
  }
  // 第4关验证：所有数字小于10且必须包含大于5的数
  if(isLevel4) {
    const num1 = parseInt(parts[0]);
    const num2 = parseInt(parts[2]);
    const ans = question.a;
    if(num1 >= 10 || num2 >= 10 || ans >= 10) return generateBlankQuestion(max, needGT5, need10);
    if(num1 <= 5 && num2 <= 5 && ans <= 5) return generateBlankQuestion(max, needGT5, need10);
    // 强制第4关使用填空形式，不返回结果填空
    const blankPos14_1 = Math.floor(Math.random() * 2); // 随机选择填空位置（0或1）
    if (blankPos14_1 === 0) { // 第一个数填空
      return {
        q: `( ) ${parts[1]} ${parts[2]} = ${question.a}`,
        a: parseInt(parts[0])
      };
    } else { // 第二个数填空
      return {
        q: `${parts[0]} ${parts[1]} ( ) = ${question.a}`,
        a: parseInt(parts[2])
      };
    }
  }
  
  // 强制第2关使用填空形式，不返回结果填空
  if(isLevel2) {
    const blankPos14_1 = Math.floor(Math.random() * 2); // 随机选择填空位置（0或1）
    if (blankPos14_1 === 0) { // 第一个数填空
      return {
        q: `( ) ${parts[1]} ${parts[2]} = ${question.a}`,
        a: parseInt(parts[0])
      };
    } else { // 第二个数填空
      return {
        q: `${parts[0]} ${parts[1]} ( ) = ${question.a}`,
        a: parseInt(parts[2])
      };
    }
  }
  
  // 其他关卡保持原有逻辑
  const blankPos14 = Math.floor(Math.random() * 3); // 随机选择填空位置
  if (blankPos14_1 === 0) { // 第一个数填空
    return {
      q: `( ) ${parts[1]} ${parts[2]} = ${question.a}`,
      a: parseInt(parts[0])
    };
  } else if (blankPos14 === 1) { // 第二个数填空
    return {
      q: `${parts[0]} ${parts[1]} ( ) = ${question.a}`,
      a: parseInt(parts[2])
    };
  } else { // 结果填空
    return question;
  }
}

// 生成随机类型题目
function generateRandomType(minLv, maxLv) {
  const randomLv = Math.floor(Math.random() * (maxLv - minLv + 1)) + minLv;
  switch(randomLv) {
    case 3: return generateBasicQuestion(10, true, false);
    case 4: return generateBlankQuestion(10, true, false);
    case 5: return generateBasicQuestion(10, false, true);
    case 6: return generateBlankQuestion(10, false, true);
    case 11: return generateCarryAddition(9);
    case 12: return generateCarryAddition(9, true);
    case 13: return generateCarryAddition(8);
    case 14: return generateCarryAddition(8, true);
    case 15: return generateCarryAddition(5);
    case 16: return generateCarryAddition(5, true);
    case 18: return generateMinus9();
    case 19: return generateMinus9(true);
    case 20: return generateMinus876();
    case 21: return generateMinus876(true);
    case 22: return generateMinus5432();
    case 23: return generateMinus5432(true);
    case 25: return generateTwoDigit(false);
    case 26: return generateTwoDigit(false, true);
    case 27: return generateTwoDigit(true);
    case 28: return generateTwoDigit(true, true);
    case 30: return generateTwoDigitCarry();
    case 31: return generateTwoDigitCarry(true);
    case 32: return generateTwoDigitBorrow();
    case 33: return generateTwoDigitBorrow(true);
    case 35: return generateTwoDigitDoubleCarry();
    case 36: return generateTwoDigitDoubleBorrow();
    default: return generateBasicQuestion(10, false, false);
  }
}

// 生成连加连减题目
function generateSeriesOperation() {
  const nums = [Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 10) + 1];
  const op1 = Math.random() > 0.5 ? '+' : '-';
  const op2 = Math.random() > 0.5 ? '+' : '-';
  let ans;
  if(op1 === '+' && op2 === '+') {
    ans = nums[0] + nums[1] + nums[2];
  } else if(op1 === '+' && op2 === '-') {
    ans = nums[0] + nums[1] - nums[2];
  } else if(op1 === '-' && op2 === '+') {
    ans = nums[0] - nums[1] + nums[2];
  } else {
    ans = nums[0] - nums[1] - nums[2];
  }
  // 确保结果非负
  if(ans < 0) return generateSeriesOperation();
  return {
    q: `${nums[0]} ${op1} ${nums[1]} ${op2} ${nums[2]} =`,
    a: ans
  };
}
// 生成十几的加减法题目（第9、10关）
function generateTeenSubtraction(isBlank = false, level = 0) {
  let minuend, num, ans, questionStr;
  const isAdd = Math.random() > 0.5; // 随机选择加法或减法
  
  // 第18关和第19关特殊处理：a-9且差在2-9之间
  if(level === 18 || level === 19) {
    minuend = Math.floor(Math.random() * 8) + 11; // 11-18
    num = 9;
    ans = minuend - num;
    
    // 确保差在2-9之间
    if(ans < 2 || ans > 9) {
      return generateTeenSubtraction(isBlank, level);
    }
    
    // 第19关是被减数填空
    if(level === 19) {
      return { q: `( ) - ${num} = ${ans}`, a: minuend };
    }
    
    return { q: `${minuend} - ${num} =`, a: ans };
  }
  
  // 第20关特殊处理：十几减8/7/6且个位小于减数
  if(level === 20) {
    minuend = Math.floor(Math.random() * 9) + 11; // 11-19
    num = Math.floor(Math.random() * 3) + 6; // 6-8
    
    // 确保个位小于减数
    if(minuend % 10 >= num) {
      return generateTeenSubtraction(isBlank, level);
    }
    
    ans = minuend - num;
    return { q: `${minuend} - ${num} =`, a: ans };
  }
  
  // 默认处理：生成11-19的被减数和1-9的减数
  minuend = Math.floor(Math.random() * 9) + 11; // 11-19
  num = Math.floor(Math.random() * 9) + 1; // 1-9

  if(isAdd) {
    ans = minuend + num;
    questionStr = `${minuend} + ${num} =`;
  } else {
    ans = minuend - num;
    questionStr = `${minuend} - ${num} =`;
  }

  // 处理填空题模式
  if(isBlank) {
    const blankPos = Math.floor(Math.random() * 3); // 0:被减数 1:数 2:结果
    switch(blankPos) {
      case 0:
        return { q: `( ) ${isAdd ? '+' : '-'} ${num} = ${ans}`, a: minuend };
      case 1:
        return { q: `${minuend} ${isAdd ? '+' : '-'} ( ) = ${ans}`, a: num };
      default:
        return { q: `${minuend} ${isAdd ? '+' : '-'} ${num} = ( )`, a: ans };
    }
  }

  return { q: questionStr, a: ans };
}



// 生成乘法题目
function generateMultiplyQuestion(maxMultiplier) {
  const num1 = Math.floor(Math.random() * maxMultiplier) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  return {
    q: `${num1} × ${num2} =`,
    a: num1 * num2
  };
}

// 生成乘加减混合运算题目
function generateMixedQuestion() {
  const num1 = Math.floor(Math.random() * 9) + 1; // 1-9
  const num2 = Math.floor(Math.random() * 9) + 1; // 1-9
  const op = Math.random() > 0.5 ? '+' : '-';
  let num3, result;
  
  if (op === '+') {
    num3 = Math.floor(Math.random() * 10); // 0-9
    result = num1 * num2 + num3;
  } else {
    // 确保结果不是负数
    const product = num1 * num2;
    num3 = Math.floor(Math.random() * product); // 0到乘积-1
    result = product - num3;
  }
  
  return {
    q: `${num1}×${num2}${op}${num3}=`,
    a: result
  };
}

// 数字键盘生成
function renderKeyboard() {
  let html = '';
  for (let i = 0; i <= 20; i++) {
    html += `<button class="key-btn" data-key="${i}">${i}</button>`;
  }
  html += `<button class="key-btn del" data-key="del">删除</button>`;
  html += `<button class="key-btn submit" data-key="submit">提交</button>`;
  keyboard.innerHTML = html;

  // 移除已存在的自动提交选项，防止重复
  const existingAutoSubmit = document.querySelector('.auto-submit-option');
  if (existingAutoSubmit) {
    existingAutoSubmit.remove();
  }

  // 自动提交选项独立容器
  const autoSubmitDiv = document.createElement('div');
  autoSubmitDiv.className = 'auto-submit-option';
  autoSubmitDiv.style = 'margin: 15px auto; display: flex; justify-content: center; align-items: center; width: 100%; min-width: 400px !important; box-sizing: border-box; overflow: visible;'
  autoSubmitDiv.innerHTML = `
    <label style="cursor: pointer; color: #3366CC !important; white-space: nowrap !important; min-width: 400px !important; width: auto !important; display: inline-block; flex-shrink: 0 !important;">
      <input type="checkbox" id="autoSubmit" style="margin-right: 5px; vertical-align: middle;">自动提交答案
    </label>
  `;
  keyboard.parentNode.appendChild(autoSubmitDiv);

  // 加载保存的自动提交状态
  const savedAutoSubmit = localStorage.getItem('autoSubmit') === 'true';
  document.getElementById('autoSubmit').checked = savedAutoSubmit;
  window.autoSubmit = savedAutoSubmit;

  // 绑定自动提交复选框事件
  document.getElementById('autoSubmit').addEventListener('change', function() {
    window.autoSubmit = this.checked;
    localStorage.setItem('autoSubmit', this.checked);
  });
}

// 在所有进度变动处保存数据
function updateAndSave() {
  if (levelSelectMode) {
    // 选关模式只保存临时状态
    sessionStorage.setItem('tempLevel', level.toString());
  } else {
    // 正常模式更新进度
    localStorage.setItem('currentLevel', level.toString());
    maxUnlockedLevel = Math.max(maxUnlockedLevel, level);
    localStorage.setItem('maxUnlockedLevel', maxUnlockedLevel.toString());
  }

  const data = {
    username,
    coins,
    level: levelSelectMode ? savedLevel : level,
    questionIndex: levelSelectMode ? 0 : questionIndex,
    questions: [],
    totalQuestions: 10,
    levelTimerData: levelSelectMode ? {} : levelTimerData,
    maxUnlockedLevel: maxUnlockedLevel,

    savedLevel: savedLevel
  };
  coinDisplay.textContent = coins;
  saveUserData();
}

// 修改 showQuestion，切换题目时也保存进度
function showQuestion() {
  const q = questions[questionIndex];
  questionText.textContent = q.q;
  answerInput.value = '';
  feedback.textContent = '';
  progressLabel.textContent = `${questionIndex + 1}/${totalQuestions}`;
  levelLabel.textContent = `第${level}关${levelSelectMode ? '(选关模式)' : ''}`;
  if (questionIndex === 0) startLevelTimer();
  if (!levelSelectMode) {
    updateAndSave();
  }


}

// 修改 submitAnswer，确保每次答题、闯关、金币变化都保存
function submitAnswer() {
  const userAns = answerInput.value;
  if (userAns === '') {
    feedback.textContent = '请输入答案';
    feedback.className = 'feedback wrong';
    return;
  }
  if (parseInt(userAns) === questions[questionIndex].a) {
    coins++;
    
    // 更新正确答题计数
    const today = new Date().toLocaleDateString();
    const correctAnswers = parseInt(localStorage.getItem('correctAnswers') || '0') + 1;
    localStorage.setItem('correctAnswers', correctAnswers.toString());
    
    // 更新答题记录面板
    const correctCountElement = document.getElementById('correctCount');
    if (correctCountElement) {
      correctCountElement.textContent = `正确: ${correctAnswers}`;
    }
    
    // 检查是否是第二天
    const lastRecordDate = localStorage.getItem('lastRecordDate');
    if (!lastRecordDate || lastRecordDate !== today) {
      // 重置当日数据
      localStorage.setItem('lastRecordDate', today);
      localStorage.setItem('dailyCorrectAnswers', '0');
    }
    
    // 更新当日正确答题数
    const dailyCorrectAnswers = parseInt(localStorage.getItem('dailyCorrectAnswers') || '0') + 1;
    localStorage.setItem('dailyCorrectAnswers', dailyCorrectAnswers.toString());
    
    // 更新答题统计
    const today2 = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    // 检查是否是第二天
    const lastRecordDate1 = localStorage.getItem('lastRecordDate');
    if (!lastRecordDate1 || lastRecordDate1 !== today) {
      // 重置当日数据
      localStorage.setItem('lastRecordDate', today);
      localStorage.setItem('dailyCount', '0');
      document.getElementById('dailyCount').textContent = '0';
    }
    
    // 更新当日答题数
    const dailyCount = parseInt(localStorage.getItem('dailyCount') || '0') + 1;
    localStorage.setItem('dailyCount', dailyCount.toString());
    const dailyCountElement = document.getElementById('dailyCount');
    if(dailyCountElement) dailyCountElement.textContent = dailyCount;
    
    // 记录当前日期
    if (!localStorage.getItem('lastRecordDate') || localStorage.getItem('lastRecordDate') !== today) {
      // 如果是新的一天，重置当日数据
      localStorage.setItem('lastRecordDate', today);
      localStorage.setItem('dailyLevelRecords', JSON.stringify([]));
    }
    
    feedback.textContent = '答对啦！';
    feedback.className = 'feedback correct';
    sound.right.currentTime = 0;
    sound.right.play();

    setTimeout(()=>{
      questionIndex++;
      if(!levelSelectMode) updateAndSave();

      if (questionIndex < totalQuestions) {
        showQuestion();
      } else {
        // 关卡完成
        stopLevelTimer();
        let passTime = Math.floor((Date.now() - timerStart)/1000);
        let minTime = getLevelMinTime(level);

        // 记录所有成功闯关信息（通用逻辑）
        // 此部分记录逻辑已移动到首次闯关和非首次闯关的分支中，避免重复记录

        if (!levelTimerData[level]) {
          // 首次通关，记录首次用时和最低限制时间
          levelTimerData[level] = {firstTime: passTime, curTime: passTime, minTime, attempts: 1};
          // 确保首次闯关后设置firstTime属性
          levelTimerData[level].firstTime = passTime;
          coins += 5; // 闯关成功奖励5金币
          successfulLevels++;
          localStorage.setItem('successfulLevels', successfulLevels.toString());
          document.getElementById('successfulLevels').textContent = `成功闯关: ${successfulLevels}`;
          sound.success.currentTime = 0;
          sound.success.play();
          if(!levelSelectMode) updateAndSave();

          // 判断是否满足进入下一关条件（时长≤最低限制时间）
          if (passTime <= minTime) {
            feedback.textContent = '首次闯关成功！+5金币';
            
            // 记录闯关成功信息
            const now = new Date();
            const timeStr = now.toLocaleTimeString('zh-CN', {hour12: false, hour: '2-digit', minute: '2-digit'});
            const record = `${timeStr} 第${level}关 用时${passTime}秒`;
            
            // 获取并更新历史记录
            let history = JSON.parse(localStorage.getItem('levelHistory') || '[]');
            history.unshift(record);
            if (history.length > 50) history = history.slice(0, 50);
            localStorage.setItem('levelHistory', JSON.stringify(history));
            

            

            
            setTimeout(()=>{
              showPopup('success', {
                attemptCount: 1,
                passTime: passTime,
                coinsEarned: 5,
                minTime: minTime,
                currentTime: passTime,
                unlocked: true
              });
            }, 1200);
          } else {
            feedback.textContent = '首次闯关成功但超时！+5金币';
            levelTimerData[level].curTime = Math.max(passTime - 2, minTime);
            setTimeout(()=>{
              showPopup('success', {
                attemptCount: 1,
                passTime: passTime,
                coinsEarned: 5,
                minTime: minTime,
                currentTime: levelTimerData[level].curTime,
                unlocked: false
              });
            }, 1200);
          }
        } else {
          // 非首次，判断是否在最低限制时间内
          levelTimerData[level].attempts = (levelTimerData[level].attempts || 0) + 1;
          if (passTime <= minTime) {
            // 满足最低时间，进入下一关
            coins += 5;
            successfulLevels++;
            localStorage.setItem('successfulLevels', successfulLevels.toString());
            document.getElementById('successfulLevels').textContent = `成功闯关: ${successfulLevels}`;
            sound.success.currentTime = 0;
            sound.success.play();
            if(!levelSelectMode) updateAndSave();
            
            // 更新总闯关数
            const totalLevels = document.getElementById('totalLevels');
            totalLevels.textContent = parseInt(totalLevels.textContent) + 1;

            showPopup('success', {
              attemptCount: levelTimerData[level].attempts,
              passTime: passTime,
              coinsEarned: 5,
              minTime: minTime,
              currentTime: levelTimerData[level].curTime,
              unlocked: true
            });
          } else {
            // 未满足最低时间，调整下次时间并继续挑战
            let nextTime = Math.max(passTime - 2, minTime);
            levelTimerData[level].curTime = nextTime;
            coins += 5;
            successfulLevels++;
            localStorage.setItem('successfulLevels', successfulLevels.toString());
            document.getElementById('successfulLevels').textContent = `成功闯关: ${successfulLevels}`;
            sound.success.currentTime = 0;
            sound.success.play();
            if(!levelSelectMode) updateAndSave();

            showPopup('success', {
              attemptCount: levelTimerData[level].attempts,
              passTime: passTime,
              coinsEarned: 5,
              minTime: minTime,
              currentTime: nextTime,
              unlocked: false
            });
          }
        }
      }
    }, 600);
  } else {
    sound.wrong.currentTime = 0;
    sound.wrong.play();
    // 暂停背景音乐
    sound.bgm.pause();
    // 停止倒计时
    stopLevelTimer();
    // 显示错误弹窗
    showPopup('error', {
      currentQuestion: questions[questionIndex].q,
      correctAnswer: questions[questionIndex].a,
      attemptCount: timerFailCount + 1,
      correctCount: questionIndex,
      nextTimer: (!levelTimerData[level] || !levelTimerData[level].firstTime) ? '首次不限时' : (levelTimerData[level]?.curTime || 30)
    });
    feedback.textContent = '';
  }
  if(!levelSelectMode) updateAndSave();
}

// 本地存档相关
function saveUserData() {
  const data = {
    username, coins, level, levelTimerData, autoSubmit, savedLevel
  };
  localStorage.setItem('ksUserData', JSON.stringify(data));
}
function loadUserData() {
  const str = localStorage.getItem('ksUserData');
  if (!str) return null;
  try {
    const data = JSON.parse(str);
    // 强制设置为正常模式
    if(data) {
      data.questionIndex = 0;
      data.questions = [];
      data.totalQuestions = 10;
      data.testMode = false;
    }
    return data;
  } catch { return null; }
}
function clearUserData() {
  console.log('=== 开始清除用户数据 ===');
  console.log('清除前 levelHistoryRecords 长度:', levelHistoryRecords.length);
  console.log('清除前 localStorage 记录:', localStorage.getItem('levelHistoryRecords'));
  console.log('清除前统计面板记录数:', document.querySelectorAll('.record-item, .level-record').length);
  // 清除用户数据
  localStorage.removeItem('ksUserData');
  
  // 清除统计数据
  localStorage.removeItem('successfulLevels');
  localStorage.removeItem('correctAnswers');
  localStorage.removeItem('dailyCount');
  localStorage.removeItem('dailyCorrectAnswers');
  localStorage.removeItem('levelHistoryRecords');
  localStorage.removeItem('maxUnlockedLevel');
  localStorage.removeItem('lastRecordDate');
  // 清除所有与用户相关的游戏数据
  const userDataKeys = ['ksUserData', 'successfulLevels', 'correctAnswers', 'dailyCount', 'dailyCorrectAnswers', 'levelHistoryRecords', 'maxUnlockedLevel', 'lastRecordDate', 'levelRankRecords', 'dailyLevelRecords'];
  userDataKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log('清除用户数据键:', key);
      localStorage.removeItem(key);
    }
  });
  // 清除所有以mathGame_开头的键
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('mathGame_') || key.includes('level') || key.includes('record'))) {
      console.log('清除相关数据键:', key);
      localStorage.removeItem(key);
      i--;
    }
  }
  // 清除sessionStorage中可能残留的数据
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.startsWith('mathGame_') || key.includes('level'))) {
      console.log('清除session数据键:', key);
      sessionStorage.removeItem(key);
      i--;
    }
  }
  
  // 清除排行榜数据
  localStorage.removeItem('levelRankRecords');
  
  // 清除所有日期相关的每日统计数据
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('dailyCount_') || key.startsWith('dailyCorrectAnswers_') || key.startsWith('mathGame_'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // 重置全局变量
  coins = 0;
  level = 1;
  successfulLevels = [];
  correctAnswers = 0;
  dailyCount = 0;
  dailyCorrectAnswers = 0;
  levelRankRecords = [];
  levelHistoryRecords = [];
  levelTimerData = {};
  maxUnlockedLevel = 1;
  savedLevel = null;
  autoSubmit = false;
  // 重置所有可能存储关卡数据的全局变量
  levelRankRecords = [];
  dailyRecords = {};
  monthlyStats = {};
  gameHistory = [];
  userProgress = {};
  levelScores = [];
  completedLevels = [];
  recentRecords = [];
  
  // 清空UI显示
  if (document.getElementById('correctCount')) document.getElementById('correctCount').textContent = '0';
  if (document.getElementById('successfulLevels')) document.getElementById('successfulLevels').textContent = '0';
  if (document.getElementById('totalAttempts')) document.getElementById('totalAttempts').textContent = '0';
  if (document.getElementById('accuracyRate')) document.getElementById('accuracyRate').textContent = '0%';
  if (document.getElementById('dailyStreak')) document.getElementById('dailyStreak').textContent = '0';
  
  // 清空排行榜表格
  const rankTable = document.getElementById('rankTable');
  if (rankTable) {
    const tbody = rankTable.querySelector('tbody');
    if (tbody) tbody.innerHTML = '';
  }
  
  // 清空统计面板
  const statsPanel = document.getElementById('statsPanel');
  if (statsPanel) {
    const counters = statsPanel.querySelectorAll('.counter-value, .counter');
    counters.forEach(counter => counter.textContent = '0');
    
    // 全局清除所有闯关记录元素
  const globalRecordItems = document.querySelectorAll('.record-item, .level-record, .dynamic-record, .history-item, .success-record, .level-entry');
  console.log('全局清除闯关记录元素数量:', globalRecordItems.length);
  globalRecordItems.forEach(item => item.remove());

  // 全局清除所有可能的记录容器
  const globalRecordContainers = document.querySelectorAll('#recordBoardBody, #levelRecords, #historyRecords, .record-container, .level-history, .stats-container');
  globalRecordContainers.forEach(container => {
    if (container) {
      console.log('清除全局容器内容:', container.id || container.className);
      container.innerHTML = '';
    }
  });

  // 确保所有计数器重置
  document.querySelectorAll('.counter, .counter-value, .stat-number, .level-count').forEach(el => {
    if (el) el.textContent = '0';
  });
    
    // 清空历史记录容器
    const historyContainer = statsPanel.querySelector('.history-records');
    if (historyContainer) historyContainer.innerHTML = '';
  }
}

// 登录界面自动检测本地存档
const resumeBox = document.getElementById('resumeBox');
const resumeBtn = document.getElementById('resumeBtn');
const resetBtn = document.getElementById('resetBtn');
window.addEventListener('DOMContentLoaded', function() {
  const data = loadUserData();
  if (data && data.username) {
    resumeBox.style.display = '';
    usernameInput.style.display = 'none';
    loginBtn.style.display = 'none';
    // 动态显示用户名
    const tipDiv = resumeBox.querySelector('div');
    if (tipDiv) {
      tipDiv.textContent = `检测到上次进度（用户：${data.username}），是否继续？`;
    }
  } else {
    resumeBox.style.display = 'none';
    usernameInput.style.display = '';
    loginBtn.style.display = '';
  }
});
if (resumeBtn) resumeBtn.onclick = function() {
  const data = loadUserData();
  if (data && data.username) {
    username = data.username;
    coins = data.coins;
    level = data.level;
    levelTimerData = data.levelTimerData || {};
    autoSubmit = data.autoSubmit ?? false;
    userDisplay.textContent = username;
    coinDisplay.textContent = coins;
    loginView.classList.remove('show');
    loginView.classList.add('fade');
    setTimeout(()=>{
      loginView.style.display = 'none';
      gameView.style.display = 'flex';
      gameView.classList.remove('fade');
      gameView.classList.add('show');
    }, 400);
    // 继续上次关卡，从第一题开始
    questionIndex = 0;
    totalQuestions = level <= 6 ? 10 : 20;
    questions = generateQuestions();
    renderKeyboard(); // 渲染键盘并同步自动提交状态
    showQuestion();
  }
};
let passwordAttempts = 0;

function verifyPassword() {
  passwordAttempts = 0;
  showPopup('password-verify', {
    message: '为了防止误删原来用户，请输入密码验证',
    onSubmit: handlePasswordSubmit
  });
}

function handlePasswordSubmit(inputPassword) {
  if (inputPassword === 'fang2025') {
    clearUserData();
    resumeBox.style.display = 'none';
    usernameInput.style.display = 'block';
    loginBtn.style.display = 'block';
    loginView.style.setProperty('display', 'flex', 'important');
    gameView.style.setProperty('display', 'none', 'important');
    usernameInput.value = '';
    usernameInput.focus();
    document.getElementById('popup').style.display = 'none';
  } else {
    passwordAttempts++;
    if (passwordAttempts >= 5) {
      document.getElementById('popup').style.display = 'none';
      passwordAttempts = 0;
      return;
    }
    const errorEl = document.getElementById('passwordError');
    if (errorEl) {
      errorEl.textContent = `密码错误，还剩${5 - passwordAttempts}次机会`;
    }
  }
}

if (resetBtn) resetBtn.onclick = verifyPassword;


// 登录按钮事件
loginBtn.onclick = function() {
  const val = usernameInput.value.trim();
  if (!val) {
    usernameInput.focus();
    usernameInput.style.border = '2px solid #ef4444';
    setTimeout(()=>{usernameInput.style.border='1.5px solid #bcd0ee';}, 800);
    return;
  }
  username = val;
  // 加载本地存储数据
  const savedData = localStorage.getItem(`mathGame_${username}`);
  if (savedData) {
    const data = JSON.parse(savedData);
    coins = data.coins;
    level = data.savedLevel ?? 1;
    savedLevel = data.savedLevel ?? 1; // 恢复正常模式保存的关卡
    maxUnlockedLevel = data.maxUnlockedLevel || 1;
    levelTimerData = data.levelTimerData || {};
    autoSubmit = data.autoSubmit ?? false;
  } else {
    // 新用户注册，清除所有历史数据
    clearUserData();
    coins = 0;
    level = 1;
    levelTimerData = {};
    autoSubmit = false;
    maxUnlockedLevel = 1;
  }
  userDisplay.textContent = username;
  coinDisplay.textContent = coins;
  loginView.classList.remove('show');
  loginView.classList.add('fade');
  setTimeout(()=>{
    loginView.style.display = 'none';
    gameView.style.display = 'flex';
    gameView.classList.remove('fade');
    gameView.classList.add('show');
  }, 400);
  // 初始化题目
  questions = generateQuestions();
  questionIndex = 0;
  renderKeyboard(); // 渲染键盘并同步自动提交状态
  showQuestion();
  saveUserData();
};

// 键盘事件
keyboard.onclick = function(e) {
  if (!e.target.classList.contains('key-btn')) return;
  const key = e.target.getAttribute('data-key');
  if (key === 'del') {
    answerInput.value = '';
    feedback.textContent = '';
    return;
  }
  if (key === 'submit') {
    submitAnswer();
    return;
  }
  // 数字输入
  if(answerInput.value.length < 2) {
    answerInput.value += key;
    feedback.textContent = '';
    // 自动提交逻辑：勾选自动提交或输入两位数字时提交
    if (window.autoSubmit || answerInput.value.length === 2) {
      submitAnswer();
    }
  }
};

  // 显示弹窗函数
  // 新增选关模式状态变量
levelSelectMode = false;

function showPopup(type, data) {
  if (type === 'password-verify') {
    const popup = document.getElementById('popup');
    popup.className = 'popup popup-password-verify';
    popup.innerHTML = `
      <div class='popup-content' style='width: 350px; padding: 30px; background-color: #f8f9fa; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);'>
        <h3 style='color: #333; text-align: center; margin-bottom: 25px; font-size: 18px;'>${data.message}</h3>
        <input type='password' id='passwordInput' placeholder='请输入密码' style='width: 100%; padding: 12px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px;'>
        <div id='passwordError' class='error-message' style='color: #dc3545; text-align: center; margin-bottom: 20px; height: 20px;'></div>
        <div style='display: flex; gap: 15px;'>
          <button id='passwordCancel' style='flex: 1; padding: 12px; background-color: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;'>取消</button>
          <button id='passwordSubmit' style='flex: 1; padding: 12px; background-color: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;'>确认</button>
        </div>
      </div>
    `;
    popup.style.display = 'flex';
    
    const passwordInput = document.getElementById('passwordInput');
    const passwordSubmit = document.getElementById('passwordSubmit');
    
    const submitHandler = () => {
      data.onSubmit(passwordInput.value);
    };
    
    passwordSubmit.onclick = submitHandler;
    document.getElementById('passwordCancel').onclick = () => {
      document.getElementById('popup').style.display = 'none';
    };
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') submitHandler();
    });
    return;
  }

    const popup = document.getElementById('popup');
    // 清除原有类型类并添加当前类型类
    ['popup-success', 'popup-error', 'popup-countdown'].forEach(cls => popup.classList.remove(cls));
    popup.classList.add(`popup-${type}`);
    // 确保弹窗内容容器也添加对应类名
    const popupContent = document.querySelector('.popup-content');
    if(popupContent) {
      ['popup-success', 'popup-error', 'popup-countdown'].forEach(cls => popupContent.classList.remove(cls));
      popupContent.classList.add(`popup-${type}`);
    }
    
    // 闯关成功时记录关卡信息
    if (type === 'success') {
      // 更新闯关记录榜
      updateLevelRankRecord(level, data.passTime);
      
      const today3 = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString('zh-CN', {hour12: false}).slice(0,5); // 格式化为13:20
      const recordStr = `${currentTime} 第${level}关 用时${data.passTime}秒`;
      
      // 保存到答题统计面板（添加防重复逻辑）
      const statsPanel = document.getElementById('statsPanel');
      if (statsPanel) {
        // 使用关卡和时间戳创建唯一标识
        // 使用更精确的唯一标识防止重复记录
        const recordId = `record-${level}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        // 检查是否已存在相同记录
        if (!document.getElementById(recordId)) {
          const recordItem = document.createElement('div');
          recordItem.id = recordId;
          recordItem.className = 'record-item';
          recordItem.textContent = recordStr;
          statsPanel.appendChild(recordItem);
        }
      }
      
      // 更新历史记录
      let historyRecords = JSON.parse(localStorage.getItem('levelHistoryRecords') || '[]');
      historyRecords.unshift(recordStr);
      if(historyRecords.length > 10) historyRecords = historyRecords.slice(0, 10);
      localStorage.setItem('levelHistoryRecords', JSON.stringify(historyRecords));
      
      // 更新UI显示
      const historyPanel = document.getElementById('historyPanel');
      if(historyPanel) {
        historyPanel.innerHTML = historyRecords.join('<br>');
      }
      
      const today = new Date().toLocaleDateString();
      const levelRecord = {
        level: level,
        passTime: data.passTime,
        recordTime: currentTime,
        date: today,
        timestamp: Date.now()
      };
      
      // 获取并更新关卡记录
      let levelRecords = JSON.parse(localStorage.getItem('dailyLevelRecords') || '[]');
      levelRecords.push(levelRecord);
      localStorage.setItem('dailyLevelRecords', JSON.stringify(levelRecords));
      
      // 更新总闯关数
      const totalLevels = parseInt(localStorage.getItem('totalLevels') || '0') + 1;
      localStorage.setItem('totalLevels', totalLevels.toString());
      document.getElementById('totalLevels').textContent = totalLevels;
      

      
      // 添加每日凌晨自动重置逻辑
      const now = new Date();
      const resetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const timeUntilReset = resetTime - now;
      
      // 设置定时器在凌晨重置数据
      setTimeout(() => {
        localStorage.setItem('dailyCount', '0');
        localStorage.setItem('dailyLevelRecords', JSON.stringify([]));
        document.getElementById('dailyCount').textContent = '0';
      }, timeUntilReset);
    }
    
    // 正常模式时移除选关模式的按钮容器并显示默认按钮
    if (!levelSelectMode) {
      const existingBtnContainer = document.querySelector('.popup-content .btn-container');
      if (existingBtnContainer) existingBtnContainer.remove();
      // 显示默认按钮并设置文本为"继续挑战本关"
      const btnEl = document.getElementById('popupBtn');
      if (btnEl) {
        btnEl.style.display = 'block';
        btnEl.textContent = '继续挑战本关';
      }
    }
    
    // 已在上方统一处理闯关记录，此处不再重复添加
    
    const titleEl = document.getElementById('popupTitle');
    const contentEl = document.getElementById('popupContent');
    const btnEl = document.getElementById('popupBtn');
    let title, content, btnText;
    
    // 选关模式添加第二个按钮
    if (levelSelectMode) {
      // 移除已有的按钮容器防止重复
      const existingBtnContainer = document.querySelector('.popup-content .btn-container');
      if (existingBtnContainer) existingBtnContainer.remove();

      const btnContainer = document.createElement('div');
      btnContainer.className = 'btn-container'; // 添加唯一标识类
      btnContainer.style.display = 'flex';
      btnContainer.style.justifyContent = 'space-between';
      btnContainer.style.marginTop = '10px';
      
      const continueBtn = document.createElement('button');
      continueBtn.className = 'key-btn submit';
      continueBtn.style.width = '48%';
      continueBtn.textContent = '继续挑战本关';
      
      const exitBtn = document.createElement('button');
      exitBtn.className = 'key-btn';
      exitBtn.style.width = '48%';
      exitBtn.style.background = '#e2e8f0';
      exitBtn.style.color = '#1e293b';
      exitBtn.textContent = '退出选关模式';
      
      btnContainer.appendChild(continueBtn);
      btnContainer.appendChild(exitBtn);
      document.querySelector('.popup-content').appendChild(btnContainer);
      
      exitBtn.onclick = () => {
        if (window.currentRestoreState) {
          window.currentRestoreState.restore();
          // 退出选关模式后强制更新localStorage中的currentLevel
          localStorage.setItem('currentLevel', level);
          // 同时更新maxUnlockedLevel
          if(level > maxUnlockedLevel) {
            maxUnlockedLevel = level;
            localStorage.setItem('maxUnlockedLevel', maxUnlockedLevel);
          }
        }
        levelSelectMode = false;
        levelLabel.textContent = `第${level}关`; // 强制更新关卡显示
        popup.style.display = 'none';
        // 移除选关模式的按钮容器并显示默认按钮
        const btnContainer = document.querySelector('.popup-content .btn-container');
        if (btnContainer) btnContainer.remove();
        document.getElementById('popupBtn').style.display = 'block';
        if (sound.bgm.paused) {
          sound.bgm.play().catch(()=>{});
        }
        showQuestion();
        startLevelTimer();
      };
      
      continueBtn.onclick = () => {
        popup.style.display = 'none';
        levelSelectMode = true; // 显式保持选关模式
        if (sound.bgm.paused) {
          sound.bgm.play().catch(()=>{});
        }
        // 调用selectLevel重新生成当前关卡题目
        selectLevel(selectedLevel);
      };
      btnEl.style.display = 'none';
      // 选关模式时保持按钮容器可见并隐藏默认按钮
      btnContainer.style.display = 'flex';
      document.getElementById('popupBtn').style.display = 'none';
    }

    // 恢复背景音乐播放（弹窗关闭时）
    btnEl.onclick = () => {
      popup.style.display = 'none';
      if (sound.bgm.paused) {
        sound.bgm.play().catch(()=>{});
      }

      if (type === 'success' && data.unlocked) {
        if (!levelSelectMode) {
          // 使用selectLevel函数切换到下一关
          const nextLevel = level + 1;
          if (nextLevel > maxUnlockedLevel) {
            maxUnlockedLevel = nextLevel;
            localStorage.setItem('maxUnlockedLevel', maxUnlockedLevel);
          }
          selectLevel(nextLevel, false);
        } else {
          coins += 5;
          questionIndex = 0;
          totalQuestions = questions.length;
          questions = generateQuestions();
          showQuestion();
        }
        updateAndSave(); // 保存最新关卡
      } else {
        // 时间到弹窗时更新当前关卡的倒计时时间
        if (type === 'timeup') {
          levelTimerData[level] = levelTimerData[level] || {};
          levelTimerData[level].curTime = data.nextTimer;
          updateAndSave();


        }
        // 重新开始本关（正常模式）
        // 正常模式继续挑战本关，触发非首次倒计时
selectLevel(level, false);
// 确保levelTimerData的firstTime已标记
if (levelTimerData[level]) levelTimerData[level].firstTime = levelTimerData[level].firstTime || true; // 传递isSelectMode为false触发非首次倒计时逻辑
      }
    };

    switch(type) {
      case 'error':
        title = '很遗憾，闯关失败！';
        if (levelSelectMode) {
          content = `这是你第${data.attemptCount}次挑战本关\n获得金币数：${data.coinsEarned || 0}\n鼓励语：继续努力！你一定能行的！`;
          btnText = '继续挑战本关';
        } else {
          content = `当前题目：${data.currentQuestion}\n正确答案：${data.correctAnswer}\n这是你第${data.attemptCount}次挑战本关\n已答对题目数：${data.correctCount}\n鼓励语：不要灰心，继续努力！\n相信你一定会成功的！\n下局倒计时时间：${data.nextTimer}秒`;
          btnText = '继续挑战本关';
        }
        break;
      case 'timeup':
        title = '很遗憾，闯关失败！';
        if (levelSelectMode) {
          content = `这是你第${data.attemptCount}次挑战本关\n获得金币数：${data.coinsEarned || 0}\n鼓励语：继续努力！你一定能行的！`;
          btnText = '继续挑战本关';
        } else {
          const timerText = data.isFirstTime ? '首次不限时' : `${data.nextTimer}秒`;
          content = `这是你第${data.attemptCount}次挑战本关\n已答对题目数：${data.correctCount}\n鼓励语：继续努力！你一定能行的！\n下局倒计时时间：${timerText}`;
          btnText = '继续挑战本关';
        }
        break;
      case 'success':
        title = '恭喜你闯关成功！';
        if (levelSelectMode) {
          content = `这是你第${data.attemptCount}次挑战本关\n闯关用时：${data.passTime}秒\n获得金币数：${data.coinsEarned}\n鼓励语：太棒了，你是计算天才吗！`;
          btnText = '继续挑战本关';
        } else {
          content = `这是你第${data.attemptCount}次挑战本关\n闯关用时：${data.passTime}秒\n获得金币数：${data.coinsEarned}\n下局倒计时时间：${data.unlocked ? '首关不限制' : data.currentTime}秒\n${data.unlocked ? '鼓励语：太棒了！已解锁下一关！' : '鼓励语：继续挑战本关，下次时间会调整哦！'}`;
          btnText = data.unlocked ? '进入下一关' : '继续挑战本关';
        }
        break;
    }

    titleEl.textContent = title;
    // 为内容中的关键部分添加类名
    const contentParts = content.split('\n');
    let formattedContent = '';
    contentParts.forEach(part => {
      if (part.includes('答对题目数')) {
        formattedContent += `<span class="correct-count">${part}</span>\n`;
      } else if (part.includes('鼓励语')) {
        formattedContent += `<span class="encouragement">${part}</span>\n`;
      } else if (part.includes('下局倒计时时间') || part.includes('下局时间')) {
        formattedContent += `<span class="next-time">${part}</span>\n`;
      } else {
        formattedContent += `${part}\n`;
      }
    });
    contentEl.innerHTML = formattedContent;
    btnEl.textContent = btnText;
    sound.bgm.pause();
    popup.style.display = 'flex';
  }

  // 播放金币音效
  function playCoin(times=1) {
  let count = 0;
  function play() {
    if (count++ < times) {
      sound.coin.currentTime = 0;
      sound.coin.play();
      setTimeout(play, 350);
    }
  }
  play();
}

// 失败音效（可在闯关失败时调用）
// sound.fail.play();

// 初始化
// 确保弹窗内容换行显示
  document.getElementById('popupContent').style.whiteSpace = 'pre-line';
renderKeyboard();
usernameInput.focus();
