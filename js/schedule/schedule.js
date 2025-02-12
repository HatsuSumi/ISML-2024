let scheduleData = null;

const SCROLL_POSITION_KEY = 'schedule_scroll_position';

// 加载赛程数据
async function loadScheduleData() {
    try {
        const response = await fetch("data/config/schedule.json");
        scheduleData = await response.json();
        renderSchedule(scheduleData); 
        return scheduleData;
    } catch (error) {
        console.error('Error loading schedule data:', error);
        return null;
    }
}

// 倒计时功能
function updateCountdown() {
    const countdowns = document.querySelectorAll('[data-countdown]');
    
    countdowns.forEach(element => {
        const dateStr = element.dataset.countdown;
        const [date, time] = dateStr.split(' ');
        const targetDate = new Date(date + 'T' + time);
        const now = new Date();
        const diff = targetDate - now;
        
        if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            element.textContent = `${days}天${hours}小时${minutes}分${seconds}秒`;
        } else {
            // 找到包含倒计时的整个 p 标签并隐藏
            const countdownContainer = element.closest('p');
            if (countdownContainer) {
                countdownContainer.style.display = 'none';
            }
        }
    });
}

// 提醒功能
function initReminders() {
    const reminderLinks = document.querySelectorAll('.match-link');
    
    reminderLinks.forEach(link => {
        if (link.textContent === '设置提醒') {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = '目前静态网站暂不支持，未来升级成动态网站后将支持提醒功能';
                
                tooltip.style.position = 'fixed';
                tooltip.style.left = '50%';
                tooltip.style.top = '100px';
                tooltip.style.transform = 'translate(-50%, -50%)';
                
                document.body.appendChild(tooltip);
                
                // 3秒后自动消失
                setTimeout(() => {
                    tooltip.remove();
                }, 3000);
            });
        }
    });
}

// 获取下一场比赛
function getNextMatch(data) {
    const now = new Date();
    let nextMatch = null;
    let minDiff = Infinity;
    
    // 遍历所有阶段和比赛
    Object.values(data.phases).forEach(phase => {
        phase.matches.forEach(match => {
            const startDate = new Date(match.dateRange.start);
            const diff = startDate - now;
            // 只考虑未开始的比赛
            if (diff > 0 && diff < minDiff) {
                minDiff = diff;
                nextMatch = match;
            }
        });
    });
    
    return nextMatch;
}

// 平滑滚动函数
function smoothScrollTo(targetPosition, duration = 500) {
    const startPosition = window.scrollY;
    const distance = Math.abs(targetPosition - startPosition);
    
    const adjustedDuration = Math.min(
        Math.max(
            distance / 4,
            400
        ),
        1200
    );
    
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / adjustedDuration, 1);
        
        const ease = progress => {
            return progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        };

        window.scrollTo(0, startPosition + (targetPosition - startPosition) * ease(progress));

        if (progress < 1) {
            requestAnimationFrame(animation);
        }
    }

    requestAnimationFrame(animation);
}

// 获取元素相对于文档顶部的偏移量
function getOffsetTop(element) {
    let offsetTop = 0;
    while(element) {
        offsetTop += element.offsetTop;
        element = element.offsetParent;
    }
    return offsetTop;
}

// 判断元素是否在视口中
function isInViewport(element, offset = 0) {
    const rect = element.getBoundingClientRect();
    return rect.top <= offset && rect.bottom > offset;
}

// 更新导航栏高亮状态
function updateNavHighlight() {
    const sections = document.querySelectorAll('.timeline-section');
    const navLinks = document.querySelectorAll('.elevator-nav a');
    const headerHeight = 80;  // 导航栏高度
    
    // 找到当前在视口中的部分
    let currentSection = null;
    sections.forEach(section => {
        if (isInViewport(section, headerHeight + 100)) {
            currentSection = section;
        }
    });
    
    // 如果没有找到在视口中的部分，就找最接近的部分
    if (!currentSection) {
        let minDistance = Infinity;
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const distance = Math.abs(rect.top - headerHeight);
            if (distance < minDistance) {
                minDistance = distance;
                currentSection = section;
            }
        });
    }
    
    // 更新导航栏高亮
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (currentSection && link.getAttribute('href') === `#${currentSection.id}`) {
            link.classList.add('active');
        }
    });
}

// 创建电梯导航
function createElevatorNav(data) {
    const nav = document.createElement('nav');
    nav.className = 'elevator-nav';
    
    // 保存当前搜索状态
    let currentMatches = [];
    let currentMatchIndex = -1;
    
    // 添加搜索框
    const searchDiv = document.createElement('div');
    searchDiv.className = 'elevator-search';
    searchDiv.innerHTML = `
        <input type="text" placeholder="搜索赛事...多个搜索结果可用回车键切换" />
        <div class="search-info"></div>
    `;
    nav.appendChild(searchDiv);
    
    // 添加筛选按钮组
    const filterGroup = document.createElement('div');
    filterGroup.className = 'filter-group';
    filterGroup.innerHTML = `
        <button class="filter-btn active" data-filter="all">全部赛事</button>
        <button class="filter-btn" data-filter="ongoing">进行中</button>
        <button class="filter-btn" data-filter="completed">已结束</button>
        <button class="filter-btn" data-filter="upcoming">未开始</button>
        <div class="date-filter">
            <div class="select-wrapper">
                <select id="start-day-filter">
                    <option value="">开始日期（任意）</option>
                    <option value="0">周日</option>
                    <option value="1">周一</option>
                    <option value="2">周二</option>
                    <option value="3">周三</option>
                    <option value="4">周四</option>
                    <option value="5">周五</option>
                    <option value="6">周六</option>
                </select>
            </div>
            <div class="select-wrapper">
                <select id="end-day-filter">
                    <option value="">结束日期（任意）</option>
                    <option value="0">周日</option>
                    <option value="1">周一</option>
                    <option value="2">周二</option>
                    <option value="3">周三</option>
                    <option value="4">周四</option>
                    <option value="5">周五</option>
                    <option value="6">周六</option>
                </select>
            </div>
        </div>
    `;
    nav.appendChild(filterGroup);
    
    const startDayFilter = filterGroup.querySelector('#start-day-filter');
    const endDayFilter = filterGroup.querySelector('#end-day-filter');
    
    // 添加日期筛选事件监听
    startDayFilter.addEventListener('change', (e) => {
        applyAllFilters();
        e.target.blur();
    });
    endDayFilter.addEventListener('change', (e) => {
        applyAllFilters();
        e.target.blur();
    });
    
    // 控制箭头状态
    [startDayFilter, endDayFilter].forEach(select => {
        const wrapper = select.closest('.select-wrapper');
        select.addEventListener('focus', () => {
            wrapper.classList.add('active');
        });
        select.addEventListener('blur', () => {
            wrapper.classList.remove('active');
        });
    });
    
    // 筛选功能
    let currentFilter = 'all';
    
    // 更新轮次项显示状态的辅助函数
    function updateRoundItems(navLink, matches) {
        const roundItems = navLink.querySelectorAll('.round-item');
        roundItems.forEach(item => {
            const matchTitle = item.dataset.matchTitle;
            const matchElement = Array.from(matches).find(match => 
                match.querySelector('.match-title').textContent === matchTitle
            );
            
            if (matchElement) {
                item.style.display = matchElement.style.display;
            }
        });
    }
    
    filterGroup.addEventListener('click', (e) => {
        if (!e.target.classList.contains('filter-btn')) return;
        
        // 更新按钮状态
        filterGroup.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // 获取筛选类型
        currentFilter = e.target.dataset.filter;
        
        // 应用所有筛选条件
        applyAllFilters();
    });
    
    // 统一处理所有筛选条件
    function applyAllFilters() {
        const startDay = startDayFilter.value;
        const endDay = endDayFilter.value;
        
        console.log('开始筛选：', {
            currentFilter,
            startDay: startDay ? `周${['日','一','二','三','四','五','六'][parseInt(startDay)]}` : '任意',
            endDay: endDay ? `周${['日','一','二','三','四','五','六'][parseInt(endDay)]}` : '任意'
        });
        
        // 获取或创建无结果提示元素
        let noResults = document.querySelector('.no-results');
        if (!noResults) {
            noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = '没有找到符合条件的赛事';
            document.querySelector('.timeline').appendChild(noResults);
        }
        
        const allSections = document.querySelectorAll('.timeline-section');
        const navLinks = document.querySelectorAll('.elevator-nav .nav-link');
        let hasAnyVisibleMatch = false;
        
        allSections.forEach(section => {
            const matches = section.querySelectorAll('.timeline-item');
            let hasVisibleMatch = false;
            
            matches.forEach(match => {
                // 状态筛选
                const matchesStatus = currentFilter === 'all' ? true :
                    currentFilter === 'upcoming' ? 
                    match.classList.contains('upcoming') || match.classList.contains('pending') :
                    match.classList.contains(currentFilter);
                
                // 日期筛选
                const dateText = match.querySelector('.match-date').textContent;
                const [startDateStr, endDateStr] = dateText.split(' - ');
                const startDate = new Date(startDateStr.split(' (')[0]);
                const endDateParts = endDateStr.split(' ')[0].split('-');
                let endDate;
                if (endDateParts.length === 3) {
                    // 完整日期格式：2025-01-07
                    endDate = new Date(endDateParts.join('-'));
                } else if (endDateParts.length === 2) {
                    // 月日格式：01-07
                    endDate = new Date(`${startDate.getFullYear()}-${endDateParts.join('-')}`);
                } else {
                    // 只有日期：07
                    const endDay = parseInt(endDateParts[0]);
                    endDate = new Date(startDate);
                    endDate.setDate(endDay);
                    if (endDay < startDate.getDate()) {
                        endDate.setMonth(endDate.getMonth() + 1);
                        if (endDate < startDate) {
                            endDate.setFullYear(startDate.getFullYear() + 1);
                        }
                    }
                }
                
                const matchesStartDay = !startDay || startDate.getDay() === parseInt(startDay);
                const matchesEndDay = !endDay || endDate.getDay() === parseInt(endDay);
                
                console.log('比赛筛选结果：', {
                    title: match.querySelector('.match-title').textContent,
                    matchesStatus,
                    matchesStartDay,
                    matchesEndDay,
                    startDate: `${startDate.toISOString().split('T')[0]} (周${['日','一','二','三','四','五','六'][startDate.getDay()]})`,
                    endDate: `${endDate.toISOString().split('T')[0]} (周${['日','一','二','三','四','五','六'][endDate.getDay()]})`
                });
                
                // 组合所有筛选条件
                const isVisible = matchesStatus && matchesStartDay && matchesEndDay;
                match.style.display = isVisible ? '' : 'none';
                if (isVisible) {
                    hasVisibleMatch = true;
                    hasAnyVisibleMatch = true;
                }
            });
            
            section.style.display = hasVisibleMatch ? '' : 'none';
            
            // 更新导航项显示状态
            const sectionId = section.id;
            const navLink = Array.from(navLinks).find(link => 
                link.getAttribute('href') === `#${sectionId}`
            );
            if (navLink) {
                navLink.style.display = hasVisibleMatch ? '' : 'none';
                updateRoundItems(navLink, matches);
            }
        });
        
        console.log('筛选结果：', {
            hasAnyVisibleMatch,
            noResultsDisplay: noResults.style.display
        });
        
        // 更新无结果提示和时间线状态
        noResults.style.display = hasAnyVisibleMatch ? 'none' : 'block';
        const timeline = document.querySelector('.timeline');
        timeline.classList.toggle('has-results', hasAnyVisibleMatch);
    }
    
    // 搜索功能
    const searchInput = searchDiv.querySelector('input');
    const searchInfo = searchDiv.querySelector('.search-info');
    
    function updateSearchInfo() {
        if (currentMatches.length > 0) {
            searchInfo.textContent = `${currentMatchIndex + 1}/${currentMatches.length}`;
            searchInfo.style.display = 'block';
        } else {
            searchInfo.style.display = 'none';
        }
    }
    
    function scrollToMatch(index) {
        if (index >= 0 && index < currentMatches.length) {
            currentMatchIndex = index;
            const match = currentMatches[currentMatchIndex];
            const targetPosition = getOffsetTop(match) - 120;
            smoothScrollTo(targetPosition);
            updateSearchInfo();
        }
    }
    
    searchInput.addEventListener('input', (e) => {
        const searchText = e.target.value.toLowerCase();
        const allMatches = document.querySelectorAll('.match-card');
        
        // 如果搜索框为空，清除所有高亮
        if (!searchText) {
            allMatches.forEach(match => {
                match.style.transform = '';
                match.style.boxShadow = '';
            });
            currentMatches = [];
            currentMatchIndex = -1;
            searchInfo.style.display = 'none';
            return;
        }
        
        // 搜索匹配项
        currentMatches = [];
        allMatches.forEach(match => {
            // 只搜索当前可见的比赛
            if (match.closest('.timeline-item').style.display === 'none') {
                match.style.transform = '';
                match.style.boxShadow = '';
                return;
            }
            
            const title = match.querySelector('.match-title').textContent.toLowerCase();
            const isMatch = title.includes(searchText);
            
            // 高亮匹配项
            match.style.transform = isMatch ? 'scale(1.02)' : '';
            match.style.boxShadow = isMatch ? '0 0 20px rgba(255, 215, 0, 0.3)' : '';
            
            // 记录匹配项
            if (isMatch) {
                currentMatches.push(match);
            }
        });
        
        // 更新搜索信息
        if (currentMatches.length === 0 && searchText) {
            searchInfo.textContent = '在当前筛选结果中未找到匹配项';
            searchInfo.style.display = 'block';
            searchInfo.classList.add('no-match');
        } else {
            updateSearchInfo();
            searchInfo.classList.remove('no-match');
        }
        
        // 滚动到第一个匹配项
        if (currentMatches.length > 0) {
            currentMatchIndex = 0;
            scrollToMatch(0);
        }
    });
    
    // 处理回车键
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (currentMatches.length > 0) {
                // 循环到下一个匹配项
                const nextIndex = (currentMatchIndex + 1) % currentMatches.length;
                scrollToMatch(nextIndex);
            }
        }
    });
    
    // 添加导航列表
    const ul = document.createElement('ul');
    Object.entries(data.phases).forEach(([phaseId, phase]) => {
        // 计算阶段状态
        const now = new Date();
        let phaseStatus = 'pending';  
        
        // 检查阶段中所有比赛的状态
        const matches = phase.matches || [];
        const hasCompleted = matches.some(match => new Date(match.dateRange.end) < now);
        const hasOngoing = matches.some(match => {
            const start = new Date(match.dateRange.start);
            const end = new Date(match.dateRange.end);
            return now >= start && now <= end;
        });
        
        if (hasCompleted && !hasOngoing) {
            phaseStatus = 'completed'; 
        } else if (hasOngoing) {
            phaseStatus = 'ongoing';  
        }

        const li = document.createElement('li');
        li.innerHTML = `
            <a href="#${phaseId}" class="nav-link ${phaseStatus}">
                <span class="status-dot"></span>
                <div class="nav-text">
                    <div class="nav-text-content">
                        <span class="phase-title">${phase.title}</span>
                        <span class="phase-status phase-status-toggle">${
                            phaseStatus === 'completed' ? '已结束' :
                            phaseStatus === 'ongoing' ? '进行中' : '未开始'
                        }</span>
                    </div>
                    <span class="nav-arrow">›</span>
                </div>
                <div class="round-dropdown">
                    ${phase.matches.map((match, index) => {
                        const matchDate = new Date(match.dateRange.end);
                        const now = new Date();
                        const status = matchDate < now ? '已结束' :
                                     (new Date(match.dateRange.start) <= now && now <= matchDate) ? '进行中' : '未开始';
                        const statusClass = status === '已结束' ? 'completed' :
                                          status === '进行中' ? 'ongoing' : 'pending';
                        
                        return `
                            <div class="round-item" data-match-title="${match.title}">
                                <span class="round-title">${match.title.split(' ').pop()}</span>
                                <span class="round-status ${statusClass}">${status}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </a>
        `;
        
        // 添加点击事件处理
        li.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            const link = e.target.closest('a');
            if (!link) return;
            
            const targetId = e.target.closest('a').getAttribute('href').slice(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const targetPosition = getOffsetTop(targetSection) - 80;
                smoothScrollTo(targetPosition);
                history.pushState(null, '', `#${targetId}`);
            }
        });
        
        // 添加箭头点击事件
        li.querySelector('.nav-arrow').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const link = e.target.closest('.nav-link');
            if (!link) return;
            
            // 直接切换当前项的展开状态
            link.classList.toggle('expanded');
        });
        
        // 添加轮次点击事件
        li.querySelectorAll('.round-item').forEach((roundItem, index) => {
            // 动态添加延迟动画
            roundItem.style.transitionDelay = `${0.05 * (index + 1)}s`;
            
            roundItem.addEventListener('click', (e) => {
                e.stopPropagation(); 
                
                // 移除所有轮次的激活状态
                document.querySelectorAll('.round-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // 添加当前轮次的激活状态
                roundItem.classList.add('active');
                
                // 查找对应的比赛卡片并滚动
                const matchTitle = roundItem.dataset.matchTitle;
                const allMatches = document.querySelectorAll('.match-card');
                const matchElement = Array.from(allMatches).find(card => 
                    card.querySelector('.match-title').textContent === matchTitle
                );
                
                if (matchElement) {
                    const targetPosition = getOffsetTop(matchElement) - 120;
                    smoothScrollTo(targetPosition);
                }
            });
        });
        
        ul.appendChild(li);
    });
    nav.appendChild(ul);
    
    // 查找当前进行中或即将开始的比赛
    function findCurrentMatch(data) {
        const now = new Date();
        let currentMatch = null;
        let upcomingMatch = null;
        
        Object.values(data.phases).forEach(phase => {
            phase.matches.forEach(match => {
                const startDate = new Date(match.dateRange.start);
                const endDate = new Date(match.dateRange.end);
                
                if (now >= startDate && now <= endDate) {
                    currentMatch = { ...match, phaseTitle: phase.title };
                } else if (now < startDate && (!upcomingMatch || startDate < new Date(upcomingMatch.dateRange.start))) {
                    upcomingMatch = { ...match, phaseTitle: phase.title };
                }
            });
        });
        
        return currentMatch || upcomingMatch;
    }
    
    // 创建当前赛事信息
    const currentMatch = findCurrentMatch(data);
    if (currentMatch) {
        const currentMatchDiv = document.createElement('div');
        currentMatchDiv.className = 'current-match-info';
        currentMatchDiv.innerHTML = `
            <div class="info-label">${
                new Date() >= new Date(currentMatch.dateRange.start) && 
                new Date() <= new Date(currentMatch.dateRange.end) ? 
                '当前进行中的赛事：' : '即将开始的赛事：'
            }</div>
            <div class="match-name">${currentMatch.title}</div>
        `;
        
        // 点击跳转到对应赛事
        currentMatchDiv.querySelector('.match-name').addEventListener('click', () => {
            // 查找包含指定标题的赛事卡片
            const allMatches = document.querySelectorAll('.match-card');
            const matchElement = Array.from(allMatches).find(card => 
                card.querySelector('.match-title').textContent === currentMatch.title
            );
            
            if (matchElement) {
                const targetPosition = getOffsetTop(matchElement) - 120;
                smoothScrollTo(targetPosition);
            }
        });
        
        nav.appendChild(currentMatchDiv);
    }
    
    document.body.appendChild(nav);
    
    // 使用防抖处理滚动事件
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(() => {
            updateNavHighlight();
            updateRoundHighlight();
        }, 100);
    });
    
    // 更新轮次高亮状态
    function updateRoundHighlight() {
        const allMatches = document.querySelectorAll('.match-card');
        const roundItems = document.querySelectorAll('.round-item');
        const headerHeight = 80;
        
        // 找到当前在视口中的比赛
        let currentMatch = null;
        allMatches.forEach(match => {
            if (isInViewport(match, headerHeight + 100)) {
                currentMatch = match;
            }
        });
        
        // 如果没有找到在视口中的比赛，就找最接近的比赛
        if (!currentMatch) {
            let minDistance = Infinity;
            allMatches.forEach(match => {
                const rect = match.getBoundingClientRect();
                const distance = Math.abs(rect.top - headerHeight);
                if (distance < minDistance) {
                    minDistance = distance;
                    currentMatch = match;
                }
            });
        }
        
        // 更新轮次高亮
        if (currentMatch) {
            const currentTitle = currentMatch.querySelector('.match-title').textContent;
            roundItems.forEach(item => {
                item.classList.remove('active');
                if (item.dataset.matchTitle === currentTitle) {
                    item.classList.add('active');
                }
            });
        }
    }
    
    // 初始化高亮状态
    updateNavHighlight();
    updateRoundHighlight();
}

// 渲染日程
function renderSchedule(data) {
    const timeline = document.getElementById('timeline');
    const elevatorNav = document.querySelector('.elevator-nav');
    
    // 清空现有内容
    timeline.innerHTML = '';
    if (elevatorNav) {
        elevatorNav.remove(); 
    }
    
    timeline.classList.add('has-results');
    const nextMatch = getNextMatch(data);
    
    Object.entries(data.phases).forEach(([phaseId, phase]) => {
        const section = document.createElement('div');
        section.className = 'timeline-section';
        section.id = phaseId;
        section.innerHTML = `
            <div class="timeline-header">
                <h2>${phase.title}</h2>
            </div>
        `;
        
        phase.matches.forEach(match => {
            const matchElement = createMatchElement(match, nextMatch);
            section.appendChild(matchElement);
        });
        
        timeline.appendChild(section);
    });
    
    initReminders();
    createElevatorNav(data);
    initSavePosition();  
}

// 创建比赛元素
function createMatchElement(match, nextMatch) {
    const element = document.createElement('div');
    const status = getMatchStatus(match);
    
    const statusText = {
        'completed': '已结束',
        'ongoing': '进行中',
        'upcoming': '即将开始',
        'pending': '未开始',
        'postponed': '已延期'
    }[status];
    
    const statusIcon = {
        'completed': '✓',
        'ongoing': '●',
        'upcoming': '○',
        'pending': '·',
        'postponed': '!'
    }[status];
    
    element.className = `timeline-item ${status}`;
    
    element.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-content">
            <div class="match-card">
                <div class="match-date">
                    ${match.title === '恒星组提名' ? 
                        `2024-12-31 20:00:00 (周二) - 2025-01-07 19:59:59 (周二)` :
                        (() => {
                            const startDate = new Date(match.dateRange.start);
                            const endDate = new Date(match.dateRange.end);
                            const startStr = match.dateRange.start;
                            const endStr = match.dateRange.end;
                            const endParts = endStr.split(' ')[0].split('-');
                            
                            const isCrossMonth = endDate.getMonth() !== startDate.getMonth() ||
                                               endDate.getFullYear() !== startDate.getFullYear();
                            
                            return `${startStr} (${getWeekday(startDate)}) - ${
                                endParts.length === 3 ? endStr : 
                                isCrossMonth ? 
                                `${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endParts[0].padStart(2, '0')} ${endStr.split(' ')[1]}` :
                                `${endParts[0].padStart(2, '0')} ${endStr.split(' ')[1]}`
                            } (${getWeekday(endDate)})`;
                        })()
                    }
                    ${match.dateRange.result ? ` | 结果公布：${match.dateRange.result} (${getWeekday(new Date(match.dateRange.result))})` : ''} 
                    ${match.details?.format ? `
                        <div class="voting-format-wrapper">
                            <span class="key">投票制度</span>
                            <div class="voting-format-menu">
                                ${typeof match.details.format === 'string' ? 
                                    match.details.format.split('\n').map(line => 
                                        `<div class="format-item">${line}</div>`
                                    ).join('') :
                                    Object.entries(match.details.format).map(([group, rule]) => 
                                        `<div class="format-item">${group}：${rule}</div>`
                                    ).join('')
                                }
                            </div>
                        </div>
                    ` : ''}
                </div>
                <h3 class="match-title">${match.title}</h3>
                <div class="match-header">
                    <div class="match-status">
                        ${status === 'postponed' ? `
                            <div class="status-wrapper">
                                <span class="status-icon">${statusIcon}</span>
                                ${statusText}
                                <div class="postpone-hint">
                                    <i class="fas fa-question-circle"></i>
                                    <div class="tooltip">该赛事已延期，具体时间待定</div>
                                </div>
                            </div>
                        ` : `
                            <span class="status-icon">${statusIcon}</span>
                            ${statusText}
                        `}
                    </div>
                    <div class="match-stats">
                        ${match.details?.votes ? 
                            `<span class="stats-item">总选票数：${match.details.votes.total}（有效：${match.details.votes.valid}）</span>` 
                            : ''}
                    </div>
                </div>
                <div class="match-details">
                    ${renderMatchDetails(match, status)}
                </div>
            </div>
        </div>
    `;
    
    return element;
}

// 渲染比赛详情
function renderMatchDetails(match, status) {
    if (status === 'completed') {
        return `
            <p>${match.details?.requirements ? 
                '<span class="key">提名条件：</span><span class="value">' + (match.title.includes("提名") ? 
                    `<span class="requirements-text" data-tooltip="符合主赛事资格的标准时长动画，是指单集时长不少于20分钟或累计时长不少于40分钟的，由注册动画公司以商业性质在日本媒体播出和发行的，除预告片和音乐短片以外的动画作品">
                        ${match.details.requirements}
                    </span>` 
                    : match.details.requirements) + '</span>'
                : ''}</p>
            <p><span class="key">被提名角色数：</span><span class="value">
                ${match.details?.participants?.total || 0} 人
                ${match.details?.participants?.female !== undefined ? 
                    `（女性：${match.details.participants.female} 人，男性：${match.details.participants.male} 人）` 
                    : ''}
            </span></p>
            <p><span class="key">晋级角色数：</span><span class="value">
                ${match.details?.qualified?.total || 0} 人
                ${match.details?.qualified?.female !== undefined ? 
                    `（女性：${match.details.qualified.female} 人，男性：${match.details.qualified.male} 人）` 
                    : ''}
            </span></p>
            ${match.links?.completed?.items ? `
                <div class="result-links-wrapper">
                    <div class="result-links-trigger">查看结果</div>
                    <div class="result-links-menu">
                        ${match.links.completed.items.map(link => {
                            const fullUrl = `${link.url}?from=schedule`;
                            return `<a href="${fullUrl}">${link.text}</a>`;
                        }).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    } else if (status === 'ongoing') {
        return `
            <p>${match.details?.requirements ? 
                '<span class="key">提名条件：</span><span class="value">' + (match.title.includes("提名") ? 
                    `<span class="requirements-text" data-tooltip="符合主赛事资格的标准时长动画，是指单集时长不少于20分钟或累计时长不少于40分钟的，由注册动画公司以商业性质在日本媒体播出和发行的，除预告片和音乐短片以外的动画作品">
                        ${match.details.requirements}
                    </span>` 
                    : match.details.requirements) + '</span>'
                : ''}</p>
            <p><span class="key">被提名角色数：</span><span class="value">
                ${match.details?.participants?.total || 0} 人
                ${match.details?.participants?.female !== undefined ? 
                    `（女性：${match.details.participants.female} 人，男性：${match.details.participants.male} 人）` 
                    : ''}
            </span></p>
            ${new Date() < new Date(match.dateRange.end) ? 
                `<p><span class="key">剩余时间：</span><span class="value"><span data-countdown="${match.dateRange.end}">计算中...</span></span></p>`
                : ''
            }
        `;
    } else {  
        const reminderButton = `<div class="match-link reminder-btn">设置提醒</div>`;
        
        return `
            <p>${match.details?.requirements ? 
                '<span class="key">提名条件：</span><span class="value">' + (match.title.includes("提名") ? 
                    `<span class="requirements-text" data-tooltip="符合主赛事资格的标准时长动画，是指单集时长不少于20分钟或累计时长不少于40分钟的，由注册动画公司以商业性质在日本媒体播出和发行的，除预告片和音乐短片以外的动画作品">
                        ${match.details.requirements}
                    </span>` 
                    : match.details.requirements) + '</span>'
                : ''}</p>
            <p><span class="key">开始倒计时：</span><span class="value"><span data-countdown="${match.dateRange.start}">计算中...</span></span></p>
            ${reminderButton}
        `;
    }
}

// 获取星期几
function getWeekday(date) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
}

// 在页面加载时恢复位置
document.addEventListener('DOMContentLoaded', async () => {
    await loadScheduleData();
    updateCountdown();
    setInterval(updateCountdown, 1000);
    
    const savedPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
    if (savedPosition) {
        setTimeout(() => {
            smoothScrollTo(parseInt(savedPosition), 800);
            sessionStorage.removeItem(SCROLL_POSITION_KEY);
        }, 100);
    }
});

function saveScrollPosition() {
    sessionStorage.setItem(SCROLL_POSITION_KEY, window.scrollY.toString());
}

function initSavePosition() {
    const links = document.querySelectorAll('a:not([target="_blank"])');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#') && href !== '#') {
            link.addEventListener('mousedown', saveScrollPosition);  
        }
    });
}

// 添加角色搜索功能
const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
};

document.getElementById('characterSearch').addEventListener('input', 
    debounce(async (e) => {
        const searchValue = e.target.value.trim();
        const noCharacterEl = document.querySelector('.no-character');
        const timelineEl = document.getElementById('timeline');
        
        if (!searchValue) {  
            showAllMatches();
            noCharacterEl.style.display = 'none'; 
            timelineEl.style.display = 'block';
            return;
        }
        
        try {
            const response = await fetch("data/matches/character-matches.json");
            const data = await response.json();
            
            const matchedCharacters = Object.entries(data.matches).filter(([, char]) => 
                char.name.toLowerCase().includes(searchValue.toLowerCase())
            );
            
            if (matchedCharacters.length > 0) {
                if (matchedCharacters.length === 1) {
                    const [, character] = matchedCharacters[0];
                    filterTimelineByCharacter(character);
                    noCharacterEl.style.display = 'none';
                    timelineEl.style.display = 'block';
                } else {
                    noCharacterEl.style.display = 'none';
                    timelineEl.style.display = 'none';
                    showCharacterSelection(matchedCharacters);
                }
            } else {
                noCharacterEl.style.display = 'block';
                timelineEl.style.display = 'none';
                noCharacterEl.textContent = `未找到角色"${searchValue}"`;
            }
        } catch (error) {
            console.error('Error fetching character data:', error);
            noCharacterEl.style.display = 'none';  
            timelineEl.style.display = 'block';
        }
    }, 300)
);

function filterTimelineByCharacter(character) {
    const timeline = document.getElementById('timeline');
    const sections = timeline.querySelectorAll('.timeline-section');
    const elevatorNav = document.querySelector('.elevator-nav');  
    document.getElementById('characterSearch').value = `${character.name}（${character.ip}）`;
    
    // 获取角色参加过的比赛标题
    const participatedMatches = new Set(
        character.matches.map(m => m.title)
    );
    
    sections.forEach(section => {
        const matches = section.querySelectorAll('.timeline-item');
        let hasVisibleMatch = false;
        
        matches.forEach(match => {
            const matchTitle = match.querySelector('.match-title').textContent;
            if (participatedMatches.has(matchTitle)) {
                match.style.display = 'block';
                hasVisibleMatch = true;
                
                // 更新比赛结果
                const characterMatch = character.matches.find(m => m.title === matchTitle);
                if (characterMatch) {
                    const resultEl = match.querySelector('.match-status');
                    const resultClass = getResultClass(characterMatch.result);
                    resultEl.textContent = characterMatch.result;
                    resultEl.className = `match-status ${resultClass}`;
                    match.classList.remove('completed', 'ongoing', 'upcoming', 'pending');
                }
            } else {
                match.style.display = 'none';
            }
        });
        
        // 如果该阶段没有可见的比赛，隐藏整个阶段和对应的导航项
        section.style.display = hasVisibleMatch ? 'block' : 'none';
        const navItem = elevatorNav.querySelector(`[href="#${section.id}"]`);
        if (navItem) {
            navItem.parentElement.style.display = hasVisibleMatch ? 'block' : 'none';
        }
    });
}

function showAllMatches() {
    const statusText = {
        'completed': '已结束',
        'ongoing': '进行中',
        'upcoming': '即将开始',
        'pending': '未开始',
        'postponed': '已延期'
    };
    
    const statusIcon = {
        'completed': '✓',
        'ongoing': '●',
        'upcoming': '○',
        'pending': '·',
        'postponed': '!'
    };

    const timeline = document.getElementById('timeline');
    const sections = timeline.querySelectorAll('.timeline-section');
    const elevatorNav = document.querySelector('.elevator-nav'); 
    
    // 先恢复所有阶段和导航项的显示
    sections.forEach(section => {
        section.style.display = 'block';
        const navItem = elevatorNav.querySelector(`[href="#${section.id}"]`);
        if (navItem) {
            navItem.parentElement.style.display = 'block';
        }
    });
    
    // 使用同样的去重逻辑
    const allMatches = Array.from(timeline.querySelectorAll('.timeline-item')).filter((match, index, self) =>
        index === self.findIndex((m) => 
            m.querySelector('.match-title').textContent === match.querySelector('.match-title').textContent
        )
    );
    
    // 遍历去重后的比赛
    allMatches.forEach(match => {
        match.style.display = 'block';
        // 重新渲染比赛状态
        const matchTitle = match.querySelector('.match-title').textContent;
        const matchData = getMatchDetails(matchTitle);
        
        if (matchData) {
            const status = getMatchStatus(matchData);
            const statusEl = match.querySelector('.match-status');
            statusEl.className = `match-status ${status}`;
            statusEl.innerHTML = `
                <span class="status-icon">${statusIcon[status]}</span>
                ${statusText[status]}
            `;
            // 恢复时间线状态类
            match.className = `timeline-item ${status}`;
        }
    });
}

function getResultClass(result) {
    switch (result) {
        case '晋级': return 'win';
        case '胜利': return 'win';
        case '淘汰': return 'lose';
        case '失败': return 'lose';
        case '未晋级': return 'lose';
        case '参赛': return 'pending';
        default: return 'pending';
    }
}

function getMatchDetails(matchTitle) {
    if (!scheduleData) return null;
    
    for (const phase of Object.values(scheduleData.phases)) {
        const match = phase.matches.find(m => m.title === matchTitle);
        if (match) return match;
    }
    return null;
}

// 页面加载时初始化数据
document.addEventListener('DOMContentLoaded', loadScheduleData); 

// 监听滚动事件，控制搜索框位置
window.addEventListener('scroll', () => {
    const searchContainer = document.querySelector('.search-container');
    const scrollY = window.scrollY;
    
    // 当滚动超过一定距离时
    if (scrollY > 100) {  // 可以调整这个阈值
        searchContainer.style.position = 'fixed';
        searchContainer.style.right = '450px';
        searchContainer.style.width = '400px';
        searchContainer.style.top = '110px';
        searchContainer.style.margin = '0';
    } else {
        // 恢复原始样式
        searchContainer.style.position = 'sticky';
        searchContainer.style.right = 'auto';
        searchContainer.style.width = '600px';
        searchContainer.style.top = '140px';
        searchContainer.style.margin = '0 auto';
    }
}); 
// 获取比赛状态
function getMatchStatus(match) {
    // 如果有延期状态，优先返回
    if (match.status === 'postponed') {
        return 'postponed';
    }
    
    const now = new Date();
    const startDate = new Date(match.dateRange.start);
    const endDate = new Date(match.dateRange.end);
    
    if (now > endDate) {
        return 'completed';
    } else if (now >= startDate && now <= endDate) {
        return 'ongoing';
    } else if (startDate - now < 24 * 60 * 60 * 1000) {
        return 'upcoming';
    } else {
        return 'pending';
    }
}

// 显示角色选择列表
function showCharacterSelection(characters) {
    const selectionEl = document.createElement('div');
    selectionEl.className = 'character-selection';
    
    const title = document.createElement('p');
    title.textContent = '匹配到多个角色，请选择：';
    selectionEl.appendChild(title);
    
    characters.forEach(([, char]) => {
        const button = document.createElement('button');
        
        // 创建头像容器
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        const img = document.createElement('img');
        if (char.avatar) {
            img.src = char.avatar;
            avatar.appendChild(img);
            button.appendChild(avatar);
        }
        
        // 创建信息容器
        const info = document.createElement('div');
        info.className = 'info';
        info.textContent = `${char.name}（${char.ip}）`;
        
        button.appendChild(info);
        
        button.onclick = () => {
            filterTimelineByCharacter(char);
            selectionEl.remove();
            document.getElementById('timeline').style.display = 'block';
        };
        selectionEl.appendChild(button);
    });
    
    const searchEl = document.getElementById('characterSearch');
    searchEl.parentNode.insertBefore(selectionEl, searchEl.nextSibling);
}
