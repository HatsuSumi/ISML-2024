class Rules {
    constructor() {
        this.ruleId = new URLSearchParams(window.location.search).get('id');
        this.containers = {
            content: document.querySelector('.rules-content'),
            title: document.querySelector('.rules-title')
        };

        // 绑定返回按钮事件
        document.querySelector('.back-btn').addEventListener('click', () => {
            window.history.back();
        });
    }

    async init() {
        try {
            await this.loadRules();
            this.renderRules();
            this.animateRules(); 
        } catch (error) {
            console.error('初始化规则页面失败:', error);
            this.showError('规则加载失败，请稍后重试');
        } finally {
            document.querySelector('.loading-container').style.display = 'none';
        }
    }

    async loadRules() {
        const response = await fetch('../../data/rules/rules.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        this.rulesData = await response.json();
    }

    renderRules() {
        const rule = this.rulesData[this.ruleId];
        if (!rule) {
            this.showError('未找到对应的规则内容');
            return;
        }

        this.containers.title.textContent = rule.title;
        
        // 创建有序列表
        const ol = document.createElement('ol');
        Object.entries(rule.content).forEach(([number, text]) => {
            const li = document.createElement('li');
            li.textContent = text;
            ol.appendChild(li);
        });
        
        this.containers.content.innerHTML = '';
        this.containers.content.appendChild(ol);
    }

    showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        this.containers.content.innerHTML = '';
        this.containers.content.appendChild(errorEl);
    }

    animateRules() {
        const rules = this.containers.content.querySelectorAll('li');
        rules.forEach((rule, index) => {
            setTimeout(() => {
                rule.classList.add('slide-in');
            }, index * 100);  
        });
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    const rules = new Rules();
    rules.init();
}); 
