let observer;
let eventsData;
let nav;

// 添加常量
const SCROLL_POSITION_KEY = 'events_scroll_position';
const RETURN_FROM_KEY = 'return_from_event';

const TITLE_MAPPING = {
    '预选赛第一轮': [
        { 
            title: '恒星女子组', 
            format: '赞成投票制',
            description: 'A组'
        }, 
        { 
            title: '恒星男子组', 
            format: '赞成投票制',
            description: 'A组'
        }
    ],
    '预选赛第二轮': [
        { 
            title: '恒星女子组', 
            format: '赞成投票制',
            description: 'B组'
        }, 
        { 
            title: '恒星男子组', 
            format: '赞成投票制',
            description: 'B组'
        }
    ]
};

// 添加一个函数来找到下一场比赛的开始时间
function findNextEventStartTime(data) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    let nextStartTime = null;
    
    // 遍历所有月份和事件，找到最近的未开始的比赛
    for (const [monthKey, month] of Object.entries(data.months)) {
        month.events.forEach(event => {
            const startDate = new Date(event.dateRange.start);
            startDate.setHours(0, 0, 0, 0);
            
            if (startDate > now) {
                if (!nextStartTime || startDate < nextStartTime) {
                    nextStartTime = startDate;
                }
            }
        });
    }
    
    return nextStartTime;
}

function getEventStatus(event, nextEventStartTime) {
    if (event.status === 'postponed') {
        return 'postponed';
    }
    
    const now = new Date();
    const startDate = new Date(event.dateRange.start);
    const endDate = new Date(event.dateRange.end);
    
    // 设置时间为当天开始和结束
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    now.setHours(0, 0, 0, 0);
    
    if (now > endDate) {
        return 'completed';
    } else if (now >= startDate && now <= endDate) {
        return 'ongoing';
    } else if (startDate.getTime() === nextEventStartTime?.getTime()) {
        return 'upcoming';
    } else {
        return 'notstarted';
    }
}

function smoothScroll(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
    
    const targetPosition = target.getBoundingClientRect().top + window.scrollY;
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition - 100;
    const duration = 500;
    let start = null;
    
    function animation(currentTime) {
        if (start === null) start = currentTime;
        const timeElapsed = currentTime - start;
        const progress = Math.min(timeElapsed / duration, 1);
        
        const ease = progress => {
            return progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        };
        
        window.scrollTo(0, startPosition + distance * ease(progress));
        
        if (timeElapsed < duration) {
            requestAnimationFrame(animation);
        }
    }
    
    requestAnimationFrame(animation);
}

function smoothScrollTo(targetPosition) {
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    const duration = 500;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) {
            startTime = currentTime;
        }
        
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        
        const ease = progress => {
            return progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        };

        const currentPos = startPosition + (distance * ease(progress));

        window.scrollTo(0, currentPos);

        if (progress < 1) {
            requestAnimationFrame(animation);
        } 
    }

    requestAnimationFrame(animation);
}

// 修改链接点击事件
function getEventLinks(match, status) {
    if (match.links && status === 'completed') {
        return `
            <a href="${match.links.visualization}?from=events-data" 
               class="event-link visualization-link"
               onclick="savePosition('visualization')">数据可视化</a>
            <a href="${match.links.table}?from=events-data" 
               class="event-link table-link"
               onclick="savePosition('table')">查看表格</a>
        `;
    }
    return `
        <span class="event-link visualization-link disabled-link">数据可视化</span>
        <span class="event-link table-link disabled-link">查看表格</span>
    `;
}

// 保存位置
function savePosition(from) {
    const currentPosition = window.scrollY;
    sessionStorage.setItem(SCROLL_POSITION_KEY, currentPosition.toString());
    sessionStorage.setItem(SCROLL_POSITION_KEY, currentPosition.toString());
    sessionStorage.setItem(RETURN_FROM_KEY, from);
}

// 添加一个函数来判断当前阶段
function getCurrentPhase(eventsData) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // 遍历所有月份和事件
    for (const [monthKey, month] of Object.entries(eventsData.months)) {
        for (const event of month.events) {
            const startDate = new Date(event.dateRange.start);
            const endDate = new Date(event.dateRange.end);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            
            if (now >= startDate && now <= endDate) {
                const match = event.matches[0]; 
                if (match.phase) {
                    return match.phase;  
                }
            }
        }
    }
    return null;
}

document.addEventListener('DOMContentLoaded', async function() {
    try {
        const [data, rankingData, charactersData] = await Promise.all([
            fetch("data/config/events.json").then(r => r.json()),
            fetch("data/votes/top5-rankings.json").then(r => r.json()),
            fetch("data/characters/base/characters-data.json").then(r => r.json())
        ]);
        eventsData = data;
        
        // 获取 hash
        const hash = window.location.hash.slice(1);
        
        window.createEventCard = function(event, match, nextEventStartTime) {
            const card = document.createElement('div');
            card.className = 'event-card';
            
            const eventTitle = match.title;
            
            const status = getEventStatus(event, nextEventStartTime);
            
            let description = '';
            if (match.details?.qualified) {
                description = match.details.qualified.description;
            }
            
            const topFiveData = rankingData?.[match.title]?.top5;
            
            card.innerHTML = `
                <div class="event-header">
                    <div class="event-info">
                        <div class="event-title">
                            ${eventTitle}
                        </div>
                        ${match.format ? `
                            <div class="voting-format-wrapper">
                                <span class="key">投票制度：</span>
                                <span class="value">${match.format}</span>
                            </div>
                        ` : ''}
                        ${match.resultDate ? `
                            <div class="result-date-wrapper">
                                <span class="key">出结果日：</span>
                                <span class="value">${formatDateTime(match.resultDate)}</span>
                            </div>
                        ` : ''}
                    </div>
                    ${status === 'postponed' ? 
                        `<div class="postpone-hint" title="该赛事已延期">?</div>` : 
                        ''
                    }
                </div>
                ${description ? `
                    <div class="event-content">
                        ${description}
                    </div>
                ` : ''}
                ${topFiveData && topFiveData.length > 0 ? `
                    <div class="top-characters">
                        <h4 class="top-title">得票数 Top 5</h4>
                        <div class="character-list">
                            ${topFiveData.map((item, index) => {
                                const characterKey = `${item.name}@${item.ip}`;
                                const characterData = charactersData[characterKey];
                                
                                const prevVotes = index > 0 ? topFiveData[index - 1].votes : item.votes;
                                const votesDiff = prevVotes - item.votes;
                                const diffHtml = index > 0 ? `<div class="votes-diff">↓${votesDiff}</div>` : '';
                                
                                return `
                                    <div class="character-item">
                                        ${characterData?.avatar ? `
                                            <div class="character-avatar">
                                                <img src="${characterData.avatar}" alt="${item.name}">
                                            </div>
                                        ` : ''}
                                        <span class="rank">${index + 1}</span>
                                        <span class="name">${item.name}<span class="ip">@${characterData?.ip || item.ip}</span></span>
                                        <span class="votes">${item.votes}票</span>
                                        ${diffHtml}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
                <div class="event-footer">
                    ${getEventLinks(match, status)}
                </div>
            `;
            
            return card;
        }
        
        const container = document.querySelector('.container');
        container.innerHTML = `
            <h1>赛事数据</h1>
            <div class="events-container"></div>
        `;
        
        // 添加电梯导航
        nav = document.createElement('nav');
        nav.className = 'elevator-nav';
        nav.innerHTML = `
            <ul class="elevator-nav-list">
                <!-- 主赛事提名阶段 -->
                <div class="elevator-nav-group">
                    <div class="elevator-nav-item" data-target="nomination">
                        <span>主赛事提名阶段</span>
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </div>
                    <div class="elevator-nav-item sub-item" data-target="stellar-nomination">
                        <span>恒星组提名</span>
                    </div>
                    <div class="elevator-nav-item sub-item" data-target="nova-nomination">
                        <span>新星组提名</span>
                    </div>
                </div>
                
                <!-- 预选赛阶段 -->
                <div class="elevator-nav-group">
                    <div class="elevator-nav-item" data-target="preliminary">
                        <span>预选赛阶段</span>
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </div>
                    ${Array.from({length: 6}, (_, i) => i + 1).map(round => `
                        <div class="elevator-nav-item sub-item" data-target="preliminary-${round}">
                            <span>预选赛第${toChineseNumber(round)}轮</span>
                        </div>
                    `).join('')}
                </div>
                
                <!-- 第一阶段 -->
                <div class="elevator-nav-group">
                    <div class="elevator-nav-item" data-target="phase-1">
                        <span>第一阶段</span>
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </div>
                    ${Array.from({length: 6}, (_, i) => i + 1).map(round => `
                        <div class="elevator-nav-item sub-item" data-target="phase-1-${round}">
                            <span>第${toChineseNumber(round)}轮</span>
                        </div>
                    `).join('')}
                </div>
                
                <!-- 第二阶段 -->
                <div class="elevator-nav-group">
                    <div class="elevator-nav-item" data-target="phase-2">
                        <span>第二阶段</span>
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </div>
                    ${Array.from({length: 6}, (_, i) => i + 1).map(round => `
                        <div class="elevator-nav-item sub-item" data-target="phase-2-${round}">
                            <span>第${toChineseNumber(round)}轮</span>
                        </div>
                    `).join('')}
                </div>
                
                <!-- 第三阶段 -->
                <div class="elevator-nav-group">
                    <div class="elevator-nav-item" data-target="phase-3">
                        <span>第三阶段</span>
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </div>
                    ${Array.from({length: 6}, (_, i) => i + 1).map(round => `
                        <div class="elevator-nav-item sub-item" data-target="phase-3-${round}">
                            <span>第${toChineseNumber(round)}轮</span>
                        </div>
                    `).join('')}
                </div>
                
                <!-- 第四阶段 -->
                <div class="elevator-nav-group">
                    <div class="elevator-nav-item" data-target="phase-4">
                        <span>第四阶段</span>
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </div>
                    ${Array.from({length: 6}, (_, i) => i + 1).map(round => `
                        <div class="elevator-nav-item sub-item" data-target="phase-4-${round}">
                            <span>第${toChineseNumber(round)}轮</span>
                        </div>
                    `).join('')}
                </div>
                
                <!-- 淘汰赛阶段 -->
                <div class="elevator-nav-group">
                    <div class="elevator-nav-item" data-target="knockout">
                        <span>淘汰赛阶段</span>
                        <i class="fas fa-chevron-down collapse-icon"></i>
                    </div>
                    ${Array.from({length: 9}, (_, i) => i + 1).map(round => `
                        <div class="elevator-nav-item sub-item" data-target="knockout-${round}">
                            <span>第${toChineseNumber(round)}轮</span>
                        </div>
                    `).join('')}
                </div>
            </ul>
        `;
        
        // 获取当前阶段
        const currentPhase = getCurrentPhase(eventsData);
        
        // 初始化导航栏状态
        nav.querySelectorAll('.elevator-nav-group').forEach(group => {
            const mainItem = group.querySelector('.elevator-nav-item');
            const phase = mainItem.textContent.trim();
            
            // 默认折叠所有组
            group.classList.add('collapsed');
            const icon = group.querySelector('.collapse-icon');
            if (icon) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-right');
            }
            
            // 如果是当前阶段，则展开
            if (currentPhase && phase.includes(currentPhase)) {
                group.classList.remove('collapsed');
                if (icon) {
                    icon.classList.remove('fa-chevron-right');
                    icon.classList.add('fa-chevron-down');
                }
            }
        });
        
        // 点击事件处理
        nav.querySelectorAll('.elevator-nav-item').forEach(item => {
            // 处理折叠/展开
            if (item.querySelector('.collapse-icon')) {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const group = item.closest('.elevator-nav-group');
                    const icon = item.querySelector('.collapse-icon');
                    
                    // 折叠/展开当前组
                    group.classList.toggle('collapsed');
                    icon.classList.toggle('fa-chevron-down');
                    icon.classList.toggle('fa-chevron-right');
                    
                    // 关闭其他已展开的组
                    nav.querySelectorAll('.elevator-nav-group').forEach(otherGroup => {
                        if (otherGroup !== group && !otherGroup.classList.contains('collapsed')) {
                            otherGroup.classList.add('collapsed');
                            const otherIcon = otherGroup.querySelector('.collapse-icon');
                            otherIcon.classList.remove('fa-chevron-down');
                            otherIcon.classList.add('fa-chevron-right');
                        }
                    });
                });
            }
            
            // 处理滚动
            item.addEventListener('click', (e) => {
                const targetId = item.dataset.target;
                
                const targetElement = document.querySelector(`[data-phase="${targetId}"]`);
                if (targetElement) {
                    e.preventDefault();
                    smoothScrollTo(targetElement.offsetTop - 80);
                    history.pushState(null, '', `/ISML-2024/pages/events-data/events-data.html#${targetId}`);
                    updateNavActiveState(targetId);
                } else {
                    console.warn('未找到目标元素:', targetId);  
                }
            });
        });
        
        document.body.appendChild(nav);
        
        // 添加滚动监听
        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const phase = entry.target.querySelector('.phase-header')?.textContent;
                    document.querySelectorAll('.elevator-nav a').forEach(a => {
                        a.classList.remove('active');
                        if (a.getAttribute('data-target') === phase) {
                            a.classList.add('active');
                        }
                    });
                }
            });
        }, { threshold: 0.5 });
        
        // 监听所有阶段区块
        const eventsContainer = container.querySelector('.events-container');
        
        // 找到下一场比赛的开始时间
        const nextEventStartTime = findNextEventStartTime(eventsData);
        
        // 遍历所有月份
        for (const [monthKey, month] of Object.entries(eventsData.months)) {
            const monthSection = createMonthSection(month, nextEventStartTime);
            
            eventsContainer.appendChild(monthSection);
        }

        // 在页面加载时检查
        const returnFrom = sessionStorage.getItem(RETURN_FROM_KEY);
        const savedPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
        
        if (returnFrom && savedPosition) {
            setTimeout(() => {
                const targetPosition = parseInt(savedPosition);
                smoothScrollTo(targetPosition);
                
                // 清理存储
                sessionStorage.removeItem(SCROLL_POSITION_KEY);
                sessionStorage.removeItem(RETURN_FROM_KEY);
            }, 100);
        }

        // 更新导航激活状态
        if (hash) {
            updateNavActiveState(hash);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

function createMonthSection(month, nextEventStartTime) {
    const section = document.createElement('section');
    section.className = 'month-section';
    
    const title = document.createElement('h2');
    title.className = 'month-title';
    title.textContent = month.title;
    section.appendChild(title);
    
    // 按日期分组事件
    const eventsByDate = groupEventsByStructure(month.events);
    
    // 创建事件网格
    const grid = document.createElement('div');
    grid.className = 'events-grid';
    
    // 按日期顺序创建日期区块
    Object.keys(eventsByDate).sort((a, b) => {
        const dateA = new Date(eventsByDate[a].date);
        const dateB = new Date(eventsByDate[b].date);
        return dateA - dateB;
    }).forEach(dateKey => {
        const dateGroup = eventsByDate[dateKey];
        const dateSection = createDateSection(dateKey, dateGroup, nextEventStartTime);
        grid.appendChild(dateSection);
    });
    
    section.appendChild(grid);
    return section;
}

function groupEventsByStructure(events) {
    const structure = {};
    const processedEvents = new Set();
    
    events.forEach(event => {
        const startDate = new Date(event.dateRange.start);
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        const dateKey = `${month}.${day}`;
        
        if (!structure[dateKey]) {
            structure[dateKey] = {
                date: event.dateRange.start,
                phases: {}
            };
        }
        
        event.matches.forEach(match => {
            const eventId = `${event.dateRange.start}-${match.title}`;
            if (processedEvents.has(eventId)) return;
            processedEvents.add(eventId);
            
            const phase = match.phase;
            if (!structure[dateKey].phases[phase]) {
                structure[dateKey].phases[phase] = {
                    groups: {}
                };
            }
            
            // 生成 phaseId
            let phaseId = '';
            if (match.title.includes('恒星组提名')) {
                phaseId = 'stellar-nomination';
            } else if (match.title.includes('新星组') && match.title.includes('提名')) {
                phaseId = 'nova-nomination';
            } else if (match.title.includes('预选赛')) {
                const round = match.title.match(/第([一二三四五六])轮/)?.[1];
                if (round) {
                    const numMap = {
                        '一': '1-1', 
                        '二': '1-2', 
                        '三': '2-1', 
                        '四': '2-2', 
                        '五': '3-1', 
                        '六': '3-2'
                    };
                    phaseId = `preliminary-${numMap[round]}`;
                }
            }

            // 保留原有的分组逻辑
            let mainGroup;
            if (match.title.includes('预选赛')) {
                const roundMatch = match.title.match(/第([一二三四五六])轮/);
                if (roundMatch) {
                    mainGroup = `预选赛${roundMatch[0]}`;
                } else {
                    mainGroup = match.title;
                }
            } else {
                mainGroup = match.title.includes('恒星组') ? '恒星组提名' : 
                          match.title.includes('新星组') ? '新星组提名' : '其他';
            }
            
            if (!structure[dateKey].phases[phase].groups[mainGroup]) {
                structure[dateKey].phases[phase].groups[mainGroup] = [];
            }
            
            structure[dateKey].phases[phase].groups[mainGroup].push({
                event,
                match,
                phaseId 
            });
        });
    });
    
    return structure;
}

function createDateSection(date, dateGroup, nextEventStartTime) {
    const dateSection = document.createElement('div');
    dateSection.className = 'date-section';
    
    const dateHeader = document.createElement('div');
    dateHeader.className = 'date-header';
    dateHeader.textContent = date;
    dateSection.appendChild(dateHeader);
    
    // 遍历每个阶段
    Object.entries(dateGroup.phases).forEach(([phaseName, phase]) => {
        const phaseSection = createPhaseSection(phaseName, phase, nextEventStartTime);
        dateSection.appendChild(phaseSection);
    });
    
    return dateSection;
}

function createPhaseSection(phaseName, phase, nextEventStartTime) {
    const phaseSection = document.createElement('div');
    phaseSection.className = 'phase-group';
    
    const firstMatch = Object.values(phase.groups)[0]?.[0];
    if (firstMatch?.phaseId) {
        phaseSection.dataset.phase = firstMatch.phaseId;
    }
    
    phaseSection.id = phaseName;
    observer.observe(phaseSection);
    
    const phaseHeader = document.createElement('div');
    phaseHeader.className = 'phase-header';
    phaseHeader.textContent = phaseName;
    phaseSection.appendChild(phaseHeader);
    
    const phaseContent = document.createElement('div');
    phaseContent.className = 'phase-content';
    
    Object.entries(phase.groups).forEach(([groupName, matches]) => {
        // 使用 TITLE_MAPPING 获取 groupTitle
        const finalGroupTitle = 
            TITLE_MAPPING[groupName]?.groupTitle || groupName;
        
        const modifiedMatches = matches.flatMap((eventMatch) => {
            const match = eventMatch.match;
            
            if (TITLE_MAPPING[match.title]) {
                return TITLE_MAPPING[match.title].map(item => ({
                    ...eventMatch,
                    match: {
                        ...match,
                        title: item.title,
                        format: item.format,
                        details: {
                            ...match.details,
                            qualified: {
                                description: item.description
                            }
                        }
                    }
                }));
            }
            
            return [eventMatch];
        });
        
        const groupSection = createGroupSection(finalGroupTitle, modifiedMatches, nextEventStartTime);
        phaseContent.appendChild(groupSection);
    });
    
    phaseSection.appendChild(phaseContent);
    
    phaseHeader.addEventListener('click', () => {
        phaseSection.classList.toggle('collapsed');
    });
    
    return phaseSection;
}

function createGroupSection(groupTitle, groupData, nextEventStartTime) {
    const section = document.createElement('div');
    section.className = 'group-section';
    
    // 获取第一个事件的月份和数据
    const firstEvent = groupData[0].event;
    const stats = firstEvent?.stats;
    const status = getEventStatus(firstEvent, nextEventStartTime);
    
    section.innerHTML = `
        <div class="group-header">
            <div class="group-info">
                <div class="group-title">${groupTitle}</div>
                <div class="group-date">
                    原定：${formatDateTime(groupData[0].event.dateRange.originalStart)} - ${formatDateTime(groupData[0].event.dateRange.originalEnd)}
                    ${groupData[0].event.dateRange.isRescheduled ? 
                        `<br>重赛：${formatDateTime(groupData[0].event.dateRange.start)} - ${formatDateTime(groupData[0].event.dateRange.end)}` 
                        : ''}
                    ${firstEvent.dateRange.result ? ` | 结果公布：${formatDateTime(firstEvent.dateRange.result, 'date')}` : ''}
                </div>
            </div>
            <div class="status-info">
                ${status === 'postponed' ? `
                    <div class="status-wrapper">
                        <span class="event-status status-postponed">已延期</span>
                        <div class="postpone-hint">
                            <i class="fas fa-question-circle"></i>
                            <div class="tooltip">该赛事已延期，具体时间待定</div>
                        </div>
                    </div>
                ` : `
                    <span class="event-status status-${status}">${getStatusText(status)}</span>
                `}
                ${stats ? `
                    <div class="event-stats">
                        <span class="stat-item">
                            总选票数: ${stats.votes.total}（有效：${stats.votes.valid}）
                        </span>
                    </div>
                ` : ''}
            </div>
        </div>
        <div class="cards-container" style="display: ${status === 'completed' ? 'block' : 'none'}">
            ${groupData.map(data => createEventCard(data.event, data.match, nextEventStartTime).outerHTML).join('')}
        </div>
    `;
    
    return section;
}

function formatDateTime(date, format = 'full') {
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const d = new Date(date);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const weekDay = weekDays[d.getDay()];
    
    if (format === 'date') {
        return `${year}-${month}-${day} (${weekDay})`;
    }
    
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} (${weekDay})`;
}

function formatEventTitle(title) {  
    // 只处理预选赛的标题
    if (title.includes('预选赛')) {
        if (title.includes('恒星组')) {
            return '恒星组';
        } else if (title.includes('新星组')) {
            return '新星组';
        }
    }
    return title;
}

function getStatusText(status) {
    const statusMap = {
        'completed': '已结束',
        'ongoing': '进行中',
        'upcoming': '即将开始',
        'notstarted': '未开始',
        'postponed': '已延期'  
    };
    return statusMap[status] || status;
}

function toChineseNumber(num) {
    const chineseNumbers = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    return chineseNumbers[num];
}

// 更新导航激活状态
function updateNavActiveState(activeId) {
    // 先移除所有项的激活状态
    nav.querySelectorAll('.elevator-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // 先折叠所有组
    nav.querySelectorAll('.elevator-nav-group').forEach(group => {
        group.classList.add('collapsed');
        const icon = group.querySelector('.collapse-icon');
        if (icon) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-right');
        }
    });
    
    // 激活当前项并展开其所在组
    const activeItem = nav.querySelector(`.elevator-nav-item[data-target="${activeId}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
        
        // 展开当前项所在的组
        const group = activeItem.closest('.elevator-nav-group');
        if (group) {
            group.classList.remove('collapsed');
            const icon = group.querySelector('.collapse-icon');
            if (icon) {
                icon.classList.remove('fa-chevron-right');
                icon.classList.add('fa-chevron-down');
            }
        }
    }
}

// 滚动监听
let scrollTimeout;
window.addEventListener('scroll', () => {
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }
    
    scrollTimeout = setTimeout(() => {
        const scrollPosition = window.scrollY + 100;
        
        // 找到当前可见的阶段
        const phases = document.querySelectorAll('[data-phase]');
        let currentPhase = null;
        let minDistance = Infinity;
        
        phases.forEach(phase => {
            const rect = phase.getBoundingClientRect();
            const distance = Math.abs(rect.top - 100);
            
            if (distance < minDistance) {
                minDistance = distance;
                currentPhase = phase.dataset.phase;
            }
        });
        
        // 更新导航栏状态
        if (currentPhase) {
            updateNavActiveState(currentPhase);
        }
    }, 100); // 100ms 的防抖
});

// 页面加载时检查 hash 并滚动
window.addEventListener('load', () => {
    const hash = window.location.hash.slice(1);
    if (hash) {
        const targetElement = document.querySelector(`[data-phase="${hash}"]`);
        if (targetElement) {
            setTimeout(() => {
                smoothScrollTo(targetElement.offsetTop - 80);
                updateNavActiveState(hash);
            }, 100);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const ROUND_NAME_MAP = {
            '预选赛第一轮': '预选赛第1 - 1轮',
            '预选赛第二轮': '预选赛第1 - 2轮',
            '预选赛第三轮': '预选赛第2 - 1轮',
            '预选赛第四轮': '预选赛第2 - 2轮',
            '预选赛第五轮': '预选赛第3 - 1轮',
            '预选赛第六轮': '预选赛第3 - 2轮'
        };

        $('*').filter(function() {
            return $(this).text().includes('预选赛第') || 
                   $(this).attr('data-target') && $(this).attr('data-target').includes('preliminary');
        }).each(function() {
            const $this = $(this);
            const originalText = $this.text();
            const originalTarget = $this.attr('data-target');

            if (originalText && ROUND_NAME_MAP[originalText]) {
                $this.text(ROUND_NAME_MAP[originalText]);
            }

            if (originalTarget && originalTarget.includes('preliminary')) {
                const roundNumber = originalTarget.replace('preliminary-', '');
                const newTarget = 'preliminary-' + roundNumber
                    .replace('1', '1-1')
                    .replace('2', '1-2')
                    .replace('3', '2-1')
                    .replace('4', '2-2')
                    .replace('5', '3-1')
                    .replace('6', '3-2');
                $this.attr('data-target', newTarget);
            }
        });
    }, 1000);
});
