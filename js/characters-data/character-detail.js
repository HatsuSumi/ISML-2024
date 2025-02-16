import { CONFIG } from '/ISML-2024/js/common/config.js';

class CharacterDetail {
    constructor() {
        this.characterId = new URLSearchParams(window.location.search).get('id');
        this.fromNav = new URLSearchParams(window.location.search).get('from') === 'nav';
        
        this.characterData = null;
        this.eventData = null;
        this.allCharacters = null;  
        
        // 缓存模板元素
        this.templates = {
            battleRecord: document.getElementById('battle-record-template'),
            eventReport: document.getElementById('event-report-template'),
            navItem: document.getElementById('nav-item-template')
        };
        
        // 缓存容器元素
        this.containers = {
            info: document.querySelector('.character-info'),
            reports: document.querySelector('.battle-reports'),
            nav: document.querySelector('.nav-list')
        };
        
        // 缓存基本信息元素
        this.infoElements = {
            avatar: this.containers.info.querySelector('.character-avatar img'),
            avatarContainer: document.querySelector('.character-avatar'),
            name: this.containers.info.querySelector('.character-name'),
            ip: this.containers.info.querySelector('.character-ip'),
            cv: this.containers.info.querySelector('.character-cv'),
            birthdayRow: this.containers.info.querySelector('.birthday-row'),
            birthday: this.containers.info.querySelector('.character-birthday')
        };
        
        // 保存滚动位置的 key
        this.SCROLL_POSITION_KEY = 'character_detail_scroll_position';
        
        // 最近访问的角色 key
        this.RECENT_CHARS_KEY = 'recent_visited_characters';
        // 最大记录数
        this.MAX_RECENT_CHARS = 5;
        
        // 添加返回按钮
        this.addBackButton();
        
        // 绑定事件处理
        this.bindEvents();
        
        // 滚动动画相关
        this.scrollAnimation = null;
        
        // 定义需要过滤的字段
        this.excludeFields = new Set([
            'round',
            'visualization',
            'hasRules',
            'rules',
            'groupResults',
            'visualizationUrl',
            'visualizationUrl2',
            'type'
        ]);
    }
    
    addBackButton() {
        const backBtn = document.createElement('button');
        backBtn.className = 'back-btn';
        backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> 返回列表';
        backBtn.addEventListener('click', () => {
            sessionStorage.setItem(this.SCROLL_POSITION_KEY, this.containers.reports.scrollTop);
            window.location.href = 'characters-data.html';
        });
        
        this.containers.info.insertBefore(backBtn, this.containers.info.firstChild);
    }
    
    async init() {
        if (!this.characterId) {
            console.error('未指定角色ID');
            return;
        }
        
        let loadingContainer;
        if (!this.fromNav) {
            loadingContainer = document.createElement('div');
            loadingContainer.className = 'loading-container';
            loadingContainer.innerHTML = '<div class="loading-spinner"></div>';
            document.body.appendChild(loadingContainer);
            
            requestAnimationFrame(() => {
                loadingContainer.style.opacity = '1';
            });
        }
        
        try {
            await this.loadData();
            this.renderCharacterInfo();
            this.renderEventReports();
            this.setupNavigation();
            this.setupCharacterNav();
            
            const container = document.querySelector('.character-detail-container');
            container.classList.add('loaded');
            
            const savedPosition = sessionStorage.getItem(this.SCROLL_POSITION_KEY);
            if (savedPosition) {
                this.smoothScroll(parseInt(savedPosition), 800);
                sessionStorage.removeItem(this.SCROLL_POSITION_KEY);
            }
        } catch (error) {
            console.error('初始化失败:', error);
        } finally {
            if (loadingContainer) {
                loadingContainer.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(loadingContainer);
                }, 300);
            }
        }
    }
    
    async loadData() {
        try {
            // 并行加载所有数据
            const [charactersResponse, rulesResponse, groupsResponse] = await Promise.all([
                fetch("data/characters/characters-details.json"),
                fetch("data/rules/rules.json"),
                fetch("data/groups/groups.json")
            ]);
            if (!charactersResponse.ok || !rulesResponse.ok || !groupsResponse.ok) {
                throw new Error('数据加载失败');
            }

            const [charactersData, rulesData, groupsData] = await Promise.all([
                charactersResponse.json(),
                rulesResponse.json(),
                groupsResponse.json()
            ]);

            this.allCharacters = charactersData.characters;
            this.characterData = charactersData.characters[this.characterId];
            this.configData = charactersData.config;
            this.rulesData = rulesData;
            this.groupsData = groupsData;

            if (!this.characterData) {
                throw new Error('角色数据不存在');
            }
            this.eventData = this.characterData.rounds;
        } catch (error) {
            console.error('加载数据失败:', error);
            this.showError('数据加载失败，请稍后重试');
            throw error;
        }
    }
    
    renderCharacterInfo() {
        if (!this.characterData) return;
        
        const basic = this.characterData.basic;

        if (basic.avatar) {
            this.infoElements.avatar.src = basic.avatar;
            this.infoElements.avatar.alt = basic.name;
        } else {
            this.infoElements.avatarContainer.remove();
        }

        this.infoElements.name.textContent = basic.name;
        this.infoElements.ip.textContent = basic.ip;
        this.infoElements.cv.textContent = basic.cv;
        
        if (basic.birthday) {
            this.infoElements.birthdayRow.style.display = '';
            this.infoElements.birthday.textContent = basic.birthday;
        } else {
            this.infoElements.birthdayRow.remove();
        }
    }
    
    renderEventReports() {
        // 添加防御性检查
        if (!this.eventData || !Array.isArray(this.eventData)) {
            console.error('事件数据无效:', this.eventData);
            return;
        }
        
        // 清空容器
        this.containers.reports.innerHTML = '';
        
        // 按事件渲染战报
        this.eventData.forEach(round => {
            const report = this.createEventReport(round);
            this.containers.reports.appendChild(report);
        });
    }
    
    createEventReport(round) {
        const report = this.templates.eventReport.content.cloneNode(true).querySelector('.event-report');
        report.id = `round-${round.round}`;

        const titleBar = report.querySelector('.event-title');
        titleBar.innerHTML = `
            <i class="fas fa-chevron-down collapse-icon"></i>
            <span>${round.round}</span>
        `;
        
        const battleList = report.querySelector('.battle-list');

        const hasOnlyRound = Object.keys(round).length === 1 && round.round;
        
        if (hasOnlyRound) {
            battleList.innerHTML = '<div class="no-content">暂无数据</div>';
        } else {
            const record = this.createBattleRecord(round);
            battleList.appendChild(record);
        }
        
        titleBar.addEventListener('click', () => {
            const icon = titleBar.querySelector('.collapse-icon');
            
            const isCollapsed = battleList.classList.contains('collapsed');
            battleList.classList.toggle('collapsed');
            icon.className = `fas ${isCollapsed ? 'fa-chevron-down' : 'fa-chevron-right'} collapse-icon`;
            titleBar.classList.toggle('collapsed');
            
            setTimeout(() => {
                this.handleScroll();

                if (!isCollapsed) {
                    const targetRect = report.getBoundingClientRect();
                    const containerRect = this.containers.reports.getBoundingClientRect();
                    const targetTop = this.containers.reports.scrollTop + targetRect.top - containerRect.top;
                    this.smoothScroll(targetTop);
                }
            }, 300); 
        });
        
        return report;
    }
    
    createBattleRecord(round) {
        const record = this.templates.battleRecord.content.cloneNode(true).querySelector('.battle-record');
        const content = record.querySelector('.record-content');
        const linksDropdown = record.querySelector('.links-dropdown');
        
        const excludeRankFields = new Set(['弃票数', '弃票率']);
        
        // 获取排名样式
        const getRankStyle = (rank) => {
            const rankNum = parseInt(rank);
            switch(rankNum) {
                case 1: return 'rank-first';
                case 2: return 'rank-second';
                case 3: return 'rank-third';
                default: return '';
            }
        };

        // 提取排名信息的函数
        const extractRank = (value) => {
            if (typeof value !== 'string') return null;
            const match = value.match(/（全场排名第\s*(\d+)）/);
            return match ? match[1] : null;
        };
        
        try {
            const handler = StageHandlerFactory.getHandler(round, this.configData.stages);
            const { roundConfig, stageConfig } = handler.config;
            const fields = handler.getFields(round);
            
            // 创建数据行
            const createDataRow = (label, value) => {
                if (!value) return null;
                
                // 检查是否包含排名信息
                const rank = !excludeRankFields.has(label) ? extractRank(value) : null;
                const rankStyle = rank ? getRankStyle(rank) : '';
                
                const row = document.createElement('div');
                row.className = 'data-row';
                
                const labelDiv = document.createElement('div');
                labelDiv.className = `data-label ${rankStyle}`;
                labelDiv.textContent = label;
                
                const valueDiv = document.createElement('div');
                valueDiv.className = `data-value ${rankStyle}`;
                valueDiv.textContent = value;
                
                row.appendChild(labelDiv);
                row.appendChild(valueDiv);
                return row;
            };
            
            // 按顺序创建数据行
            Object.entries(fields)
                .filter(([_, value]) => value !== null && value !== undefined)
                .forEach(([label, value]) => {
                    const row = createDataRow(label, value);
                    if (row) content.appendChild(row);
                });
            
            // 添加相关链接
            const linkConfigs = [
                {
                    key: 'visualization',
                    icon: 'chart-line',
                    text: '数据可视化'
                },
                {
                    key: 'table',
                    icon: 'table',
                    text: '详细表格'
                },
                {
                    key: 'groups',
                    icon: 'users', 
                    text: '角色分组'
                },
                {
                    key: 'rules',
                    icon: 'book',
                    text: '赛事规则'
                }
            ];

            const links = linkConfigs
            .filter(config => {
                console.log(`检查配置: ${config.key}`);
                console.log('RoundConfig:', roundConfig);   
                if (config.key === 'rules') {
                    const ruleKey = roundConfig?.[config.key];
                    return ruleKey && this.rulesData[ruleKey];
                }
                if (config.key === 'visualization' || config.key === 'table') {
                    const linkKey = roundConfig?.[config.key];
                    return linkKey;
                }
                return roundConfig?.[config.key];
            })
            .map(config => {
                let url;
                if (config.key === 'visualization' || config.key === 'table') {
                    url = roundConfig[config.key];
                } else if (config.key === 'rules') {
                    url = `pages/rules/rules.html?id=${roundConfig[config.key]}&from=characters-data`;
                } else {
                    url = roundConfig[config.key];
                }
                
                if (!url.includes('from=characters-data')) {
                    url += url.includes('?') ? `&from=characters-data` : `?from=characters-data`;
                }
                
                return {
                    key: config.key,
                    icon: config.icon,
                    text: config.text,
                    url: url
                };
            });

            console.log('Round Config:', roundConfig);
            console.log('Links:', links);
            
            // 如果有链接，显示链接按钮，否则隐藏
            const linksSection = record.querySelector('.record-links');
            if (links.length > 0) {
                links.forEach(link => {
                    const a = document.createElement('a');
                    a.href = link.url;
                    a.innerHTML = `<i class="fas fa-${link.icon}"></i>${link.text}`;
                    linksDropdown.appendChild(a);
                });
            } else {
                linksSection.style.display = 'none';
            }
        } catch (error) {
            console.error('处理赛事数据失败:', error);
        }
        
        return record;
    }
    
    setupNavigation() {
        // 清空导航栏
        this.containers.nav.innerHTML = '';
        
        // 添加导航项
        this.eventData.forEach(round => {
            const navItem = this.createNavItem(round);
            this.containers.nav.appendChild(navItem);
        });
        
        // 激活第一个导航项
        const firstItem = this.containers.nav.firstElementChild;
        if (firstItem) firstItem.classList.add('active');
    }
    
    createNavItem(round) {
        const item = this.templates.navItem.content.cloneNode(true).querySelector('.nav-item');
        const link = item.querySelector('a');
        link.href = 'javascript:void(0)';
        link.dataset.target = `round-${round.round}`;
        const navText = round.round.split('（')[0];
        link.textContent = navText;
        return item;
    }
    
    // 自定义平滑滚动函数
    smoothScroll(target, duration = 500) {
        // 参数验证
        if (typeof target !== 'number' || target < 0) {
            console.warn('Invalid scroll target:', target);
            return;
        }
        if (typeof duration !== 'number' || duration <= 0) {
            duration = 500;
        }

        if (this.scrollAnimation) {
            cancelAnimationFrame(this.scrollAnimation);
        }
        
        const container = this.containers.reports;
        const start = container.scrollTop;
        const distance = target - start;
        const startTime = performance.now();
        
        // 使用更柔和的缓动函数
        const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            container.scrollTop = start + distance * easeOutCubic(progress);
            
            if (progress < 1) {
                this.scrollAnimation = requestAnimationFrame(animate);
            }
        };
        
        this.scrollAnimation = requestAnimationFrame(animate);
    }
    
    bindEvents() {
        // 监听滚动事件
        this.containers.reports.addEventListener('scroll', (e) => {
            this.handleScroll(e);
        });
        
        // 监听导航点击
        this.containers.nav.addEventListener('click', (e) => {
            console.log('Nav clicked');
            const link = e.target.closest('a');
            if (!link) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            // 更新激活状态
            this.containers.nav.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            link.parentElement.classList.add('active');
            
            // 平滑滚动到目标位置
            const targetId = link.dataset.target;
            console.log('Target ID:', targetId);
            const target = document.getElementById(targetId);
            if (target) {
                // 计算目标滚动位置
                const targetRect = target.getBoundingClientRect();
                const containerRect = this.containers.reports.getBoundingClientRect();
                const targetTop = this.containers.reports.scrollTop + targetRect.top - containerRect.top;
                console.log('Scrolling to:', targetTop);
                this.smoothScroll(targetTop);
            }
        });
    }
    
    handleScroll(e) {
        if (this.scrollTimer) {
            cancelAnimationFrame(this.scrollTimer);
        }
        
        this.scrollTimer = requestAnimationFrame(() => {
            const reports = this.containers.reports.querySelectorAll('.event-report');
            let currentReport = null;
            const scrollTop = this.containers.reports.scrollTop;
            const containerHeight = this.containers.reports.clientHeight;
            const buffer = 100;
            
            for (const report of reports) {
                const reportTop = report.offsetTop - scrollTop;
                if (reportTop >= -buffer && reportTop <= containerHeight / 2) {
                    currentReport = report;
                    break;
                }
            }
            
            if (!currentReport) {
                for (const report of reports) {
                    const reportTop = report.offsetTop - scrollTop;
                    if (reportTop > -report.offsetHeight) {
                        currentReport = report;
                        break;
                    }
                }
            }
            
            if (currentReport) {
                const id = currentReport.id;
                this.containers.nav.querySelectorAll('.nav-item').forEach(item => {
                    const link = item.querySelector('a');
                    item.classList.toggle('active', link.dataset.target === id);
                });
                
                const activeItem = this.containers.nav.querySelector('.nav-item.active');
                if (activeItem) {
                    const navContainer = this.containers.nav;
                    const itemTop = activeItem.offsetTop;
                    const containerScrollTop = navContainer.scrollTop;
                    const containerHeight = navContainer.clientHeight;
                    
                    if (itemTop < containerScrollTop || itemTop > containerScrollTop + containerHeight) {
                        const targetScroll = itemTop - containerHeight / 2 + activeItem.offsetHeight / 2;
                        this.smoothScrollNav(targetScroll);
                    }
                }
            }
        });
    }
    
    showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        this.containers.reports.appendChild(errorEl);
    }
    
    destroy() {
        
        if (this.scrollAnimation) {
            cancelAnimationFrame(this.scrollAnimation);
        }

        this.containers = null;
        this.templates = null;
        this.infoElements = null;
    }

    smoothScrollNav(target, duration = 300) {
        if (this.navScrollAnimation) {
            cancelAnimationFrame(this.navScrollAnimation);
        }
        
        const container = this.containers.nav;
        const start = container.scrollTop;
        const distance = target - start;
        const startTime = performance.now();
        
        const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            container.scrollTop = start + distance * easeOutCubic(progress);
            
            if (progress < 1) {
                this.navScrollAnimation = requestAnimationFrame(animate);
            }
        };
        
        this.navScrollAnimation = requestAnimationFrame(animate);
    }

    setupCharacterNav() {
        const filters = document.querySelector('.nav-filters');
        
        // 过滤按钮点击事件
        filters.addEventListener('click', e => {
            const btn = e.target.closest('.filter-btn');
            if (!btn) return;
            
            // 更新按钮状态
            filters.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.toggle('active', b === btn);
            });
            
            // 根据筛选条件显示角色
            const filter = btn.dataset.filter;
            this.showFilteredCharacters(filter);
        });
        
        // 初始显示全部角色
        this.showFilteredCharacters('all');
    }

    showFilteredCharacters(filter) {
        const container = document.querySelector('.characters-list');
        container.innerHTML = '';
        
        // 获取最近访问记录
        const recentChars = JSON.parse(localStorage.getItem(this.RECENT_CHARS_KEY) || '[]');
        
        // 筛选并添加角色
        const characters = this.filterCharacters(filter);
        characters.forEach(([id, char]) => {
            const item = document.createElement('div');
            item.className = 'character-item';
            if (recentChars.includes(id)) {
                item.classList.add('recently-visited');
            }
            
            const hasAvatar = Boolean(char.basic.avatar);
            item.innerHTML = `
                ${hasAvatar ? `<img src="${char.basic.avatar}" alt="${char.basic.name}">` : ''}
                <div class="character-info-text">
                    <div class="name">${char.basic.name}</div>
                    <div class="details">
                        <span class="text-wrapper">
                            <span class="text-content">${char.basic.ip}</span>
                        </span>
                        <span class="text-wrapper">
                            <span class="text-content">${char.basic.cv}</span>
                        </span>
                    </div>
                </div>
            `;
            
            container.appendChild(item);
            
            // 在元素添加到 DOM 后检查文本是否溢出
            const textContents = item.querySelectorAll('.text-content');
            textContents.forEach(text => {
                // 检查实际宽度是否超过容器宽度
                if (text.scrollWidth > text.clientWidth) {
                    text.parentElement.className = 'tooltip';
                    text.parentElement.setAttribute('data-tooltip', text.textContent);
                }
            });
            
            item.addEventListener('click', () => {
                // 保存当前滚动位置
                sessionStorage.setItem(this.SCROLL_POSITION_KEY, this.containers.reports.scrollTop);
                
                // 更新最近访问记录
                const newRecentChars = [id, ...recentChars.filter(cid => cid !== id)]
                    .slice(0, this.MAX_RECENT_CHARS);
                localStorage.setItem(this.RECENT_CHARS_KEY, JSON.stringify(newRecentChars));
                
                window.location.href = `character-detail.html?id=${id}&from=nav`;
            });
        });
    }

    filterCharacters(filter) {
        const container = document.querySelector('.characters-list');
        const innerContainer = container.querySelector('.characters-list-inner');
        
        // 获取最近访问的角色
        const recentChars = JSON.parse(localStorage.getItem(this.RECENT_CHARS_KEY) || '[]');
        
        // 获取当前角色的组别、季节和性别
        const currentRound = this.eventData[0]?.round || '';
        const currentGroup = currentRound.includes('恒星组') ? '恒星组' : 
                            currentRound.includes('新星组') ? '新星组' : null;
        const currentGender = currentRound.includes('女性') ? '女性' : 
                             currentRound.includes('男性') ? '男性' : null;
        
        // 如果是新星组，获取季节
        const currentSeason = currentGroup === '新星组' ? 
            ['春季赛', '夏季赛', '秋季赛', '冬季赛'].find(season => currentRound.includes(season)) : 
            null;
        
        // 过滤角色
        const characters = Object.entries(this.allCharacters)
            .filter(([id, char]) => {
                // 排除当前角色
                if (id === this.characterId) return false;
                
                const charRound = char.rounds[0]?.round || '';
                const charGroup = charRound.includes('恒星组') ? '恒星组' : 
                                charRound.includes('新星组') ? '新星组' : null;
                const charGender = charRound.includes('女性') ? '女性' : 
                                 charRound.includes('男性') ? '男性' : null;
                
                // 检查组别和性别
                if (charGroup !== currentGroup || charGender !== currentGender) return false;
                
                // 如果是新星组，还要检查季节
                if (currentGroup === '新星组') {
                    const charSeason = ['春季赛', '夏季赛', '秋季赛', '冬季赛']
                        .find(season => charRound.includes(season));
                    if (charSeason !== currentSeason) return false;
                }
                
                // 根据筛选条件过滤
                switch (filter) {
                    case 'cv':
                        return char.basic.cv === this.characterData.basic.cv;
                    case 'ip':
                        return char.basic.ip === this.characterData.basic.ip;
                    default:
                        return true;
                }
            });
        
        // 对角色列表进行排序：最近访问的排在前面
        characters.sort(([idA], [idB]) => {
            const indexA = recentChars.indexOf(idA);
            const indexB = recentChars.indexOf(idB);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

        return characters;
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    const detail = new CharacterDetail();
    detail.init();
});

// 单独的赛事处理器文件
class StageHandler {
    constructor(config) {
        this.config = config;
    }
    
    getFields() {
        throw new Error('必须实现 getFields 方法');
    }
    
    getConfig() {
        throw new Error('必须实现 getConfig 方法');
    }
}

class NominationHandler extends StageHandler {
    getFields(round) {
        return {
            '提名时间': this.config.stageConfig?.['提名时间'],
            '被提名角色数': round['名次'] !== '自动晋级' ? this.config.roundConfig?.['被提名角色数'] : null,
            '提名票': round['提名票'],
            '名次': round['名次'],
            '上届世萌战绩': round['上届世萌战绩']
        };
    }
    
    getConfig(round, stages) {
        const gender = round.round.includes('女性') ? '女性组别' : '男性组别';
        if (round.round.includes('恒星组')) {
            return {
                roundConfig: stages['提名阶段']['恒星组'][gender],
                stageConfig: stages['提名阶段']['恒星组']
            };
        }
        
        const seasonMap = {
            '冬季赛': '冬季赛',
            '春季赛': '春季赛',
            '夏季赛': '夏季赛',
            '秋季赛': '秋季赛'
        };
        const season = Object.keys(seasonMap).find(s => round.round.includes(s)) || '冬季赛';
        
        return {
            roundConfig: stages['提名阶段']['新星组'][season][gender],
            stageConfig: stages['提名阶段']['新星组'][season]
        };
    }
}

class PreliminariesHandler extends StageHandler {
    getFields(round) {
        return {
            '比赛时间': this.config.stageConfig?.['比赛时间'],
            '小组': round['小组'],
            '得票': round['得票'],
            '排名': round['排名'],
            '晋级状态': round['晋级状态']
        };
    }
    
    getConfig(round, stages) {
        console.log('Current Round:', round);
        
        // 从 round 中提取组别信息
        const group = round.round.includes('女性') ? '女性组别' : '男性组别';
        
        // 从 round 中提取轮次
        const roundNumber = round.round.match(/第([一二三四五六])轮/)[1];
        const roundKey = `预选赛${roundNumber}轮`;
        
        return {
            roundConfig: stages['预选赛阶段'][roundKey]['恒星组'][group],
            stageConfig: stages['预选赛阶段'][roundKey]['恒星组']
        };
    }
}

// 处理器工厂
class StageHandlerFactory {
    // 使用正则表达式来匹配赛事类型
    static patterns = [
        {
            pattern: /恒星组提名/,
            handler: NominationHandler
        },
        {
            pattern: /新星组.*?[春夏秋冬]季赛提名/,
            handler: NominationHandler
        },
        {
            pattern: /预选赛第[一二三四五六]轮/,
            handler: PreliminariesHandler
        }
    ];
    
    static getHandler(round, stages) {
        console.log('Current Round:', round);
        console.log('Round Name:', round.round);
        console.log('Available Stages:', Object.keys(stages));
    
        // 使用正则表达式匹配
        const match = this.patterns.find(p => {
            const isMatch = p.pattern.test(round.round);
            console.log(`Testing pattern ${p.pattern}: ${isMatch}`);
            return isMatch;
        });
    
        if (!match) {
            throw new Error(`未找到对应的处理器: ${round.round}`);
        }
        
        const handler = new match.handler();
        const config = handler.getConfig(round, stages);
        return new match.handler(config);
    }
}