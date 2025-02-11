import { Danmaku, initDanmakuSettings } from './danmaku.js';
import { CONFIG } from './config.js';

export class DanmakuGenerator {
    constructor(container, options = {}) {
        this.container = container;
        const savedSettings = localStorage.getItem(CONFIG.danmaku.storageKey);
        const settings = savedSettings ? JSON.parse(savedSettings) : {};
        
        // 确保interval有正确的默认值
        if (!settings.interval || settings.interval < 1000) {  // 如果间隔小于1秒或未设置
            settings.interval = CONFIG.danmaku.defaultInterval;
        }
        
        this.options = {
            interval: options.interval || CONFIG.danmaku.interval,
            speed: options.speed || CONFIG.danmaku.speed,
            trackCount: CONFIG.danmaku.trackCount,
            enabled: options.enabled !== undefined ? options.enabled : true,
            fontSize: options.fontSize || CONFIG.danmaku.fontSize,
            position: options.position || CONFIG.danmaku.position,
            ...settings 
        };
        
        // 同步到CONFIG
        CONFIG.features.danmakuEnabled = this.options.enabled;
        
        this.tracks = new Array(this.options.trackCount).fill(null);
        this.danmakus = new Set();
        this.messages = [];
        this.activeDanmaku = [];
        this.animationFrame = null;
        this.lastTime = performance.now();
        this.lastSendTime = 0;
        
        this.setupZIndex();
        this.init();
        
        // 根据enabled状态决定是否启动动画
        if (this.options.enabled) {
            this.startAnimation();
        }
        
        // 保存引用以便访问
        container.danmakuGenerator = this;
        this.sendingInterval = null;
        // 从localStorage读取欢迎弹幕状态
        this.hasWelcomeSent = localStorage.getItem('hasWelcomeSent') === 'true';
        
        // 初始化时更新UI
        this.updateSettingsUI();
    }

    setupZIndex() {
        const allElements = document.querySelectorAll('*');
        let maxZIndex = 0;

        allElements.forEach(el => {
            const zIndex = parseInt(window.getComputedStyle(el).zIndex);
            if (!isNaN(zIndex) && zIndex > maxZIndex) {
                maxZIndex = zIndex;
            }
        });

        const baseZIndex = maxZIndex + 100;
        
        const style = document.createElement('style');
        style.textContent = `
            .animation-container { z-index: ${baseZIndex} !important; }
            .message-text { z-index: ${baseZIndex + 1} !important; }
            .copy-tip { z-index: ${baseZIndex + 2} !important; }
        `;
        document.head.appendChild(style);

    }

    async init() {
        try {
            await this.loadData();
            
            if (this.options.enabled) {
                if (this.sendingInterval) {
                    clearInterval(this.sendingInterval);
                }
                
                this.sendWelcomeMessage();
                this.startSending();
            }
            
            initDanmakuSettings();
            this.initSettings();
        } catch (error) {
            console.error('初始化失败:', error);
        }
    }

    async loadData() {
        try {
            const response = await fetch(CONFIG.danmaku.dataUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.messages = data.messages;
            return this.messages;
        } catch (error) {
            console.error('加载弹幕数据失败:', error);
            throw error;
        }
    }

    startAnimation() {
        // 如果已经有动画在运行，先取消它
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // 重置时间
        this.lastTime = performance.now();
        
        // 启动新的动画
        this.animationFrame = requestAnimationFrame(this.animate);
    }

    startSending() {
        if (this.sendingInterval) {
            clearInterval(this.sendingInterval);
        }
        
        this.sendingInterval = setInterval(() => {
            if (!CONFIG.features.danmakuEnabled) return;
            
            const randomIndex = Math.floor(Math.random() * this.messages.length);
            const message = this.messages[randomIndex];
            
            const availableTrack = this.findAvailableTrack();
            if (availableTrack !== -1) {
                const danmaku = new Danmaku(message.text, message.type, availableTrack, this.container);
                this.activeDanmaku.push(danmaku);
                this.container.appendChild(danmaku.element);
            }
        }, this.options.interval);
    }

    findAvailableTrack() {
        for (let i = 0; i < this.tracks.length; i++) {
            if (!this.tracks[i]) {
                return i;
            }
        }
        return -1;
    }

    sendDanmaku() {
        if (!CONFIG.features.danmakuEnabled) return;

        const trackIndex = this.findAvailableTrack();
        if (trackIndex === -1 || this.messages.length === 0) return;

        const message = this.messages[Math.floor(Math.random() * this.messages.length)];

        const danmaku = new Danmaku(
            `${message.text} - ${message.ip}`,
            message.type,
            trackIndex,
            this.container
        );

        this.registerCopyEvent(danmaku);
        
        this.tracks[trackIndex] = danmaku;
        this.danmakus.add(danmaku);
        
        this.container.appendChild(danmaku.element);
    }

    registerCopyEvent(danmaku) {
        const copyIcon = danmaku.element.querySelector('.copy-icon');
        if (!copyIcon) return;

        copyIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(danmaku.text).then(() => {
                const copyTip = document.querySelector('.copy-tip');
                copyTip.classList.add('show');
                setTimeout(() => {
                    copyTip.classList.remove('show');
                }, 1000);
            });
        });
    }

    removeDanmaku(danmaku) {
        this.tracks[danmaku.track] = null;
        this.danmakus.delete(danmaku);
        danmaku.destroy();
    }

    destroy() {
        cancelAnimationFrame(this.animationFrame);
        this.danmakus.forEach(danmaku => danmaku.destroy());
        this.danmakus.clear();
        this.tracks.fill(null);
    }

    restartSending() {
        if (this.sendingInterval) {
            clearInterval(this.sendingInterval);
        }
        
        this.startSending();
    }

    sendWelcomeMessage() {
        if (!this.hasWelcomeSent && this.options.enabled) {
            const intervalInSeconds = this.options.interval / 1000;
            const welcomeMessage = {
                text: `欢迎来到2024赛季国际最萌大会数据统计主页！之后每隔${intervalInSeconds}秒会随机发送一句动画金句，可以在右上角设置`,
                type: "welcome"
            };
            
            const availableTrack = this.findAvailableTrack();
            if (availableTrack !== -1) {
                const danmaku = new Danmaku(welcomeMessage.text, welcomeMessage.type, availableTrack, this.container);
                this.activeDanmaku.push(danmaku);
                this.container.appendChild(danmaku.element);
                console.log(`生成欢迎弹幕: ${welcomeMessage.text}, 当前时间: ${new Date().toLocaleTimeString()}`);
            }
            this.hasWelcomeSent = true;
            // 保存欢迎弹幕状态到localStorage
            localStorage.setItem('hasWelcomeSent', 'true');
        }
    }

    updateTracks() {
        // 保存当前弹幕
        const activeDanmakus = Array.from(this.danmakus);
        
        // 清空轨道
        this.tracks = new Array(this.options.trackCount).fill(null);
        this.danmakus.clear();
        
        // 重新分配轨道
        activeDanmakus.forEach(danmaku => {
            const newTrack = this.findAvailableTrack();
            if (newTrack !== -1) {
                danmaku.track = newTrack;
                danmaku.element.style.top = `${newTrack * 30}px`;
                this.tracks[newTrack] = danmaku;
                this.danmakus.add(danmaku);
            } else {
                danmaku.destroy();
            }
        });
    }

    initSettings() {
        const sizeInput = document.getElementById('danmakuSize');
        const sizeNumberInput = sizeInput?.parentElement.querySelector('.number-input');
        const positionSelect = document.getElementById('danmakuPosition');
        
        if (sizeInput) {
            sizeInput.addEventListener('input', (e) => {
                this.options.fontSize = parseInt(e.target.value);
                // 更新所有现有弹幕的字体大小
                this.activeDanmaku.forEach(danmaku => {
                    if (danmaku.element) {
                        danmaku.element.style.fontSize = `${this.options.fontSize}px`;
                    }
                });
                if (sizeNumberInput) {
                    sizeNumberInput.value = e.target.value;
                }
                this.saveSettings();
            });
            
            if (sizeNumberInput) {
                sizeNumberInput.addEventListener('input', (e) => {
                    let value = parseInt(e.target.value);
                    value = Math.max(
                        CONFIG.danmaku.minFontSize,
                        Math.min(CONFIG.danmaku.maxFontSize, value)
                    );
                    sizeInput.value = value;
                    this.options.fontSize = value;
                    this.activeDanmaku.forEach(danmaku => {
                        if (danmaku.element) {
                            danmaku.element.style.fontSize = `${value}px`;
                        }
                    });
                    this.saveSettings();
                });
            }
        }
        
        if (positionSelect) {
            positionSelect.addEventListener('change', () => {
                this.options.position = positionSelect.value;
                this.updateDanmakuPosition();
                this.saveSettings();
            });
        }
    }

    // 保存设置到localStorage
    saveSettings() {
        const settings = {
            interval: this.options.interval,
            speed: this.options.speed,
            fontSize: this.options.fontSize,
            enabled: this.options.enabled,
            position: this.options.position
        };
        localStorage.setItem(CONFIG.danmaku.storageKey, JSON.stringify(settings));
    }

    // 更新UI显示
    updateSettingsUI() {
        const enabledCheckbox = document.getElementById('danmakuEnabled');
        const intervalInput = document.getElementById('danmakuInterval');
        const speedInput = document.getElementById('danmakuSpeed');
        const sizeInput = document.getElementById('danmakuSize');
        const positionSelect = document.getElementById('danmakuPosition');
        
        const intervalNumberInput = intervalInput?.parentElement.querySelector('.number-input');
        const speedNumberInput = speedInput?.parentElement.querySelector('.number-input');
        const sizeNumberInput = sizeInput?.parentElement.querySelector('.number-input');
        
        if (enabledCheckbox) enabledCheckbox.checked = this.options.enabled;
        
        if (intervalInput && intervalNumberInput) {
            const intervalValue = this.options.interval / 1000 / 60;
            intervalInput.value = intervalValue;
            intervalNumberInput.value = intervalValue;
            intervalInput.dispatchEvent(new Event('input'));
        }
        
        if (speedInput && speedNumberInput) {
            speedInput.value = this.options.speed;
            speedNumberInput.value = this.options.speed;
            speedInput.dispatchEvent(new Event('input'));
            const screenWidthSpan = speedInput.parentElement.parentElement.querySelector('.screen-width');
            if (screenWidthSpan) {
                const pixelsPerSecond = ((window.innerWidth + CONFIG.danmaku.buffer) / this.options.speed).toFixed(0);
                screenWidthSpan.textContent = `屏幕宽度：${window.innerWidth}px，${this.options.speed}秒滚动完，每秒${pixelsPerSecond}px`;
            }
        }
        
        if (sizeInput && sizeNumberInput) {
            sizeInput.value = this.options.fontSize;
            sizeNumberInput.value = this.options.fontSize;
            sizeInput.dispatchEvent(new Event('input'));
        }
        
        if (positionSelect) {
            positionSelect.value = this.options.position;
            this.updateDanmakuPosition();
        }
    }

    updateDanmakuPosition() {
        const container = this.container;
        container.style.top = '0';
        container.style.bottom = 'auto';
        container.style.transform = 'none';
        
        switch(this.options.position) {
            case 'top':
                container.style.top = '80px';
                break;
            case 'middle':
                container.style.top = '50%';
                container.style.transform = 'translateY(-50%)';
                break;
            case 'bottom':
                container.style.top = 'auto';
                container.style.bottom = '0';
                break;
        }
    }

    animate = (currentTime) => {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // 更新所有活动弹幕
        this.activeDanmaku = this.activeDanmaku.filter(danmaku => {
            const shouldRemove = danmaku.update(deltaTime);
            if (shouldRemove) {
                danmaku.destroy();
            }
            return !shouldRemove;
        });
        
        this.animationFrame = requestAnimationFrame(this.animate);
    }
}
