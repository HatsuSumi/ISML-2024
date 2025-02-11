import { CONFIG } from './config.js';

export class Danmaku {
    constructor(text, type, track, container) {
        this.text = text;
        this.type = type;
        this.track = track;
        this.container = container;
        this.element = null;
        this.position = window.innerWidth;
        this.isPaused = false;
        const totalDistance = window.innerWidth + CONFIG.danmaku.buffer;
        const seconds = container.danmakuGenerator?.options.speed || 15;
        this.speed = totalDistance / seconds;  
        this.createDOMElement();
        this.bindEvents();
    }

    createDOMElement() {
        this.element = document.createElement('div');
        this.element.className = 'message-text';
        this.element.style.fontSize = `${this.container.danmakuGenerator?.options.fontSize || CONFIG.danmaku.fontSize}px`;
        const [text, ip] = this.text.split(' - ');
        this.element.textContent = text;
        this.element.dataset.type = this.type;
        this.element.style.top = `${this.track * 30}px`;
        
        if (ip) {
            this.element.textContent += ` - ${ip}`;
        }
        
        if (this.type !== 'welcome') {
            const copyIcon = document.createElement('i');
            copyIcon.className = 'fas fa-copy copy-icon';
            this.element.appendChild(copyIcon);
        }
        
        this.container.danmakuGenerator.tracks[this.track] = true;
        
        this.element.addEventListener('animationend', () => {
            this.element.remove();
            this.container.danmakuGenerator.tracks[this.track] = false;
            this.container.danmakuGenerator.activeDanmaku = 
                this.container.danmakuGenerator.activeDanmaku.filter(d => d !== this);
        });
    }

    bindEvents() {
        this.element.addEventListener('mouseenter', () => {
            this.isPaused = true;
        });

        this.element.addEventListener('mouseleave', () => {
            this.isPaused = false;
        });

        const copyIcon = this.element.querySelector('.copy-icon');
        if (copyIcon) {
            copyIcon.addEventListener('click', (e) => {
                e.stopPropagation();  
                const text = this.text; 
                navigator.clipboard.writeText(text).then(() => {
                    const copyTip = document.querySelector('.copy-tip');
                    if (copyTip) {
                        copyTip.style.transform = 'translate(-50%, -50%) scale(1)';
                        setTimeout(() => {
                            copyTip.style.transform = 'translate(-50%, -50%) scale(0)';
                        }, 1000);
                    } else {
                        console.error('找不到复制提示元素');
                    }
                });
            });
        }
    }

    update(deltaTime) {
        if (this.isPaused) return false;
        
        this.position -= this.speed * deltaTime;
        this.element.style.transform = `translateX(${this.position}px)`;
        
        if (this.position < -this.element.offsetWidth) {
            this.container.danmakuGenerator.tracks[this.track] = false;
            return true;
        }
        return false;
    }

    destroy() {
        this.element.remove();
    }
}

export function initDanmakuSettings() {
    const enabledCheckbox = document.getElementById('danmakuEnabled');
    const intervalInput = document.getElementById('danmakuInterval');
    const speedInput = document.getElementById('danmakuSpeed');
    
    // 检查是否已经有DanmakuGenerator实例
    const container = document.querySelector('.animation-container');
    if (!container || !container.danmakuGenerator) {
        console.error('找不到弹幕生成器实例');
        return;
    }
    
    // 初始化开关状态
    enabledCheckbox.checked = CONFIG.features.danmakuEnabled;
    
    // 监听开关变化
    enabledCheckbox.addEventListener('change', function() {
        const generator = container.danmakuGenerator;
        if (generator) {
            generator.options.enabled = this.checked;
            CONFIG.features.danmakuEnabled = this.checked;
            generator.saveSettings();
            if (!this.checked) {
                clearAllDanmaku();
            } else {
                // 启动动画和发送弹幕
                generator.startAnimation();
                // 确保数据已加载
                if (generator.messages.length === 0) {
                    generator.loadData().then(() => {
                        generator.startSending();
                        // 如果还没发送过欢迎弹幕，先发送欢迎弹幕
                        if (!generator.hasWelcomeSent) {
                            generator.sendWelcomeMessage();
                            // 使用设置的生成间隔发送第一条普通弹幕
                            const interval = generator.options.interval;
                            setTimeout(() => {
                                const randomIndex = Math.floor(Math.random() * generator.messages.length);
                                const message = generator.messages[randomIndex];
                                const availableTrack = generator.findAvailableTrack();
                                if (availableTrack !== -1) {
                                    const danmaku = new Danmaku(message.text, message.type, availableTrack, container);
                                    generator.activeDanmaku.push(danmaku);
                                    container.appendChild(danmaku.element);
                                }
                            }, interval);
                        } else {
                            // 如果已经发送过欢迎弹幕，直接发送普通弹幕
                            const randomIndex = Math.floor(Math.random() * generator.messages.length);
                            const message = generator.messages[randomIndex];
                            const availableTrack = generator.findAvailableTrack();
                            if (availableTrack !== -1) {
                                const danmaku = new Danmaku(message.text, message.type, availableTrack, container);
                                generator.activeDanmaku.push(danmaku);
                                container.appendChild(danmaku.element);
                            }
                        }
                    });
                } else {
                    generator.startSending();
                    // 如果还没发送过欢迎弹幕，先发送欢迎弹幕
                    if (!generator.hasWelcomeSent) {
                        generator.sendWelcomeMessage();
                        // 使用设置的生成间隔发送第一条普通弹幕
                        const interval = generator.options.interval;
                        setTimeout(() => {
                            const randomIndex = Math.floor(Math.random() * generator.messages.length);
                            const message = generator.messages[randomIndex];
                            const availableTrack = generator.findAvailableTrack();
                            if (availableTrack !== -1) {
                                const danmaku = new Danmaku(message.text, message.type, availableTrack, container);
                                generator.activeDanmaku.push(danmaku);
                                container.appendChild(danmaku.element);
                            }
                        }, interval);
                    } else {
                        // 如果已经发送过欢迎弹幕，直接发送普通弹幕
                        const randomIndex = Math.floor(Math.random() * generator.messages.length);
                        const message = generator.messages[randomIndex];
                        const availableTrack = generator.findAvailableTrack();
                        if (availableTrack !== -1) {
                            const danmaku = new Danmaku(message.text, message.type, availableTrack, container);
                            generator.activeDanmaku.push(danmaku);
                            container.appendChild(danmaku.element);
                        }
                    }
                }
            }
        } else {
            console.error('找不到弹幕生成器实例');
        }
    });

    // 检查是否找到所有元素
    Object.entries({interval: intervalInput, speed: speedInput}).forEach(([key, element]) => {
        if (!element) {
            console.error(`找不到${key}元素`);
            return;
        }
    });

    // 更新屏幕宽度和滚动速度显示
    function updateSpeedDisplay(screenWidthSpan, speed) {
        if (screenWidthSpan) {
            const pixelsPerSecond = ((window.innerWidth + CONFIG.danmaku.buffer) / speed).toFixed(0);
            screenWidthSpan.textContent = `屏幕宽度：${window.innerWidth}px，${speed}秒滚动完，每秒${pixelsPerSecond}px`;
        }
    }

    function syncInputs(rangeInput, numberInput) {
        // 获取生成器实例
        const container = document.querySelector('.animation-container');
        const generator = container?.danmakuGenerator;
        
        if (generator) {
            // 根据不同的设置项设置初始值
            switch(rangeInput.id) {
                case 'danmakuInterval':
                    const intervalValue = generator.options.interval / 1000 / 60;
                    rangeInput.value = intervalValue;
                    numberInput.value = intervalValue.toFixed(1);
                    // 更新生成器的间隔设置
                    generator.options.interval = intervalValue * 60 * 1000;
                    generator.restartSending();
                    break;
                case 'danmakuSpeed':
                    rangeInput.value = generator.options.speed;
                    numberInput.value = generator.options.speed;
                    const screenWidthSpan = rangeInput.parentElement.parentElement.querySelector('.screen-width');
                    updateSpeedDisplay(screenWidthSpan, generator.options.speed);
                    break;
            }
        }
        
        function updateUnit(value) {
            numberInput.value = value.toFixed(1);
        }
        
        rangeInput.addEventListener('input', function() {
            updateUnit(parseFloat(this.value));
            
            // 更新DanmakuGenerator的设置
            const container = document.querySelector('.animation-container');
            if (!container) {
                console.error('找不到弹幕容器');
                return;
            }
            
            const generator = container.danmakuGenerator;
            if (!generator) {
                console.error('找不到弹幕生成器');
                return;
            }
            
            switch(this.id) {
                case 'danmakuInterval':
                    let value = parseFloat(this.value);
                    const intervalInSeconds = value * 60;
                    generator.options.interval = intervalInSeconds * 1000;
                    generator.restartSending();
                    generator.saveSettings();
                    break;
                case 'danmakuSpeed':
                    let speed = parseInt(this.value);
                    generator.options.speed = speed;
                    generator.activeDanmaku.forEach(danmaku => {
                        danmaku.speed = (window.innerWidth + CONFIG.danmaku.buffer) / speed;
                    });
                    // 更新显示
                    const screenWidthSpan = this.parentElement.parentElement.querySelector('.screen-width');
                    updateSpeedDisplay(screenWidthSpan, speed);
                    generator.saveSettings();
                    break;
            }
        });

        numberInput.addEventListener('input', function() {
            let value = parseFloat(this.value);
            
            value = Math.max(parseFloat(rangeInput.min), Math.min(parseFloat(rangeInput.max), value));
            rangeInput.value = value;
            updateUnit(value);
            
            // 直接更新生成器设置
            const container = document.querySelector('.animation-container');
            if (container && container.danmakuGenerator) {
                // 根据不同的设置项更新生成器
                switch(rangeInput.id) {
                    case 'danmakuInterval':
                        const intervalInSeconds = value * 60;
                        container.danmakuGenerator.options.interval = intervalInSeconds * 1000;
                        container.danmakuGenerator.restartSending();
                        container.danmakuGenerator.saveSettings();
                        break;
                    case 'danmakuSpeed':
                        container.danmakuGenerator.options.speed = value;
                        container.danmakuGenerator.saveSettings();
                        break;
                }
            }
        });

        // 添加键盘上下箭头调整
        numberInput.addEventListener('keydown', function(e) {
            // 阻止左右箭头的默认行为
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                return;
            }
            
            // 只响应上下箭头
            if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
            
            e.preventDefault(); // 阻止默认的上下滚动
            
            const unitSpan = rangeInput.parentElement.querySelector('.unit');
            const isSeconds = unitSpan && unitSpan.textContent === 's';
            
            let currentValue = parseInt(this.value);
            let step = isSeconds ? 1 : 1; // 秒模式步长1秒，分钟模式步长1分钟
            
            if (e.key === 'ArrowUp') {
                currentValue += step;
            } else {
                currentValue -= step;
            }
            
            // 如果是秒模式，转换为分钟
            let value = isSeconds ? currentValue / 60 : currentValue;
            
            // 确保在范围内
            value = Math.max(parseFloat(rangeInput.min), Math.min(parseFloat(rangeInput.max), value));
            
            // 更新显示和值
            rangeInput.value = value;
            updateUnit(value);
            
            // 触发change事件以更新弹幕设置
            rangeInput.dispatchEvent(new Event('input'));
        });
        
        // 初始化单位显示
        updateUnit(parseFloat(rangeInput.value));
    };

    Object.entries({interval: intervalInput, speed: speedInput}).forEach(([key, rangeInput]) => {
        // 如果滑块元素不存在，跳过
        if (!rangeInput) return;
        
        const numberInput = rangeInput.parentElement.querySelector('.number-input');
        if (!numberInput) {
            console.error(`找不到${key}对应的数字输入框`);
            return;
        }
        syncInputs(rangeInput, numberInput);
    });

    // 模态框控制
    const modal = document.getElementById('danmakuModal');
    const btn = document.querySelector('.danmaku-btn');
    const closeBtn = document.querySelector('.close-btn');
    
    btn.addEventListener('click', () => {
        modal.style.display = 'block';
        // 触发重排以启动动画
        modal.offsetHeight;
        modal.classList.add('show');
    });
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        // 等待动画结束后隐藏
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    });

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        const screenWidthSpan = document.querySelector('.setting-header .screen-width');
        const speedInput = document.getElementById('danmakuSpeed');
        updateSpeedDisplay(screenWidthSpan, parseInt(speedInput.value));
    });
}

// 清空所有弹幕
function clearAllDanmaku() {
    const container = document.querySelector('.animation-container');
    if (container) {
        // 保存生成器引用
        const generator = container.danmakuGenerator;
        // 清空内容
        container.innerHTML = '';
        // 恢复生成器引用
        container.danmakuGenerator = generator;
        // 重置活动弹幕数组
        if (generator) {
            generator.activeDanmaku = [];
        }
    }
}