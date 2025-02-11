document.addEventListener('DOMContentLoaded', () => {
    // 初始化代码高亮
    hljs.highlightAll();
    
    const sections = document.querySelectorAll('.type-section');
    const navItems = document.querySelectorAll('.nav-item');
    const guideContent = document.querySelector('.guide-content');
    
    // 自定义平滑滚动函数
    function smoothScroll(element, target, duration = 500) {
        const start = element.scrollTop;
        const distance = target - start;
        const startTime = performance.now();
        
        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }
        
        function animation(currentTime) {
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            
            element.scrollTop = start + (distance * easeOutCubic(progress));
            
            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        }
        
        requestAnimationFrame(animation);
    }
    
    // 滚动监听
    const observerOptions = {
        root: guideContent,  // 监听 guide-content 的滚动
        rootMargin: '-20% 0px -60% 0px',  // 调整触发区域
        threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 移除所有active类
                navItems.forEach(item => item.classList.remove('active'));
                // 给当前section对应的导航项添加active类
                const targetNav = document.querySelector(`.nav-item[href="#${entry.target.id}"]`);
                if (targetNav) {
                    targetNav.classList.add('active');
                    // 使用自定义滚动让导航项滚动到可视区域
                    const navContainer = targetNav.parentElement;
                    const targetPosition = targetNav.offsetTop - navContainer.offsetHeight / 2 + targetNav.offsetHeight / 2;
                    smoothScroll(navContainer, targetPosition, 300);
                }
            }
        });
    }, observerOptions);
    
    sections.forEach(section => observer.observe(section));
    
    // 平滑滚动
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const targetPosition = targetSection.offsetTop - guideContent.offsetTop;
                smoothScroll(guideContent, targetPosition);
                history.pushState(null, '', targetId);
            }
        });
    });
    
    // 处理页面加载时的锚点定位
    if (location.hash) {
        const targetSection = document.querySelector(location.hash);
        if (targetSection) {
            setTimeout(() => {
                const targetPosition = targetSection.offsetTop - guideContent.offsetTop;
                smoothScroll(guideContent, targetPosition);
            }, 100);
        }
    }

    // 代码面板折叠功能
    const codePanel = document.querySelector('.code-panel');
    const togglePanelBtn = document.querySelector('.toggle-panel');
    
    togglePanelBtn.addEventListener('click', () => {
        codePanel.classList.toggle('collapsed');
        // 更新按钮图标方向
        const icon = togglePanelBtn.querySelector('i');
        if (codePanel.classList.contains('collapsed')) {
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-left');
        } else {
            icon.classList.remove('fa-chevron-left');
            icon.classList.add('fa-chevron-right');
        }
    });
    

    // Tab 切换功能
    const tabItems = document.querySelectorAll('.tab-item');
    const codeSections = document.querySelectorAll('.code-section');

    tabItems.forEach(tab => {
        tab.addEventListener('click', () => {
            // 移除所有激活状态
            tabItems.forEach(item => item.classList.remove('active'));
            codeSections.forEach(section => section.classList.remove('active'));
            
            // 添加当前激活状态
            tab.classList.add('active');
            const type = tab.dataset.type;
            const targetSection = document.querySelector(`.code-section[data-type="${type}"]`);
            
            // 检查目标区域是否存在
            if (!targetSection) {
                console.warn(`No code section found for type: ${type}`);
                return;
            }
            
            targetSection.classList.add('active');
            
            // 更新代码示例
            updateCodeExample(type);
            
            // 重新初始化展开按钮
            setTimeout(initCodeExpand, 0);
        });
    });

    // 初始化代码块展开/收起功能
    function initCodeExpand() {
        const codePanel = document.querySelector('.code-panel');
        if (!codePanel) return;
        
        // 先移除已存在的按钮
        const existingBtn = document.querySelector('.code-expand');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        // 创建一个容器来包裹按钮
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'code-expand-container';
        
        // 创建"查看全部"按钮
        const expandBtn = document.createElement('button');
        expandBtn.className = 'code-expand';
        expandBtn.textContent = '查看全部';
        
        // 将按钮添加到容器中，再将容器添加到代码面板中
        buttonContainer.appendChild(expandBtn);
        codePanel.appendChild(buttonContainer);
        
        // 点击事件
        expandBtn.addEventListener('click', () => {
            // 获取当前激活的代码区域
            const activeSection = document.querySelector('.code-section.active');
            if (!activeSection) return;
            
            const modal = document.createElement('div');
            modal.className = 'code-modal';
            modal.innerHTML = `
                <div class="code-modal-container">
                    <button class="code-modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                    <pre><code class="language-javascript"></code></pre>
                </div>
            `;
            document.body.appendChild(modal);
            
            // 获取当前代码块的内容
            const currentCode = CODE_EXAMPLES[activeSection.dataset.type];
            const modalCode = modal.querySelector('code');
            
            // 先高亮代码
            const tempCode = document.createElement('code');
            tempCode.className = 'language-javascript';
            tempCode.textContent = currentCode;
            hljs.highlightElement(tempCode);
            
            // 获取高亮后的HTML并按行分割
            const highlightedLines = tempCode.innerHTML.split('\n');
            
            // 逐行添加代码
            highlightedLines.forEach((line, index) => {
                const lineDiv = document.createElement('div');
                lineDiv.className = 'code-line';
                lineDiv.setAttribute('data-line-number', index + 1);  // 添加行号
                lineDiv.innerHTML = line || '&nbsp;';  // 处理空行
                modalCode.appendChild(lineDiv);
            });
            
            // 触发显示动画
            requestAnimationFrame(() => {
                modal.classList.add('show');
            });
            
            // 关闭函数
            const closeModal = () => {
                modal.classList.add('hiding');
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.remove();
                }, 300);
            };
            
            // 关闭按钮
            modal.querySelector('.code-modal-close').onclick = closeModal;
            
            // 点击遮罩关闭
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });
        });
    }

    // 代码示例配置
    const CODE_EXAMPLES = {
        'one-to-one': `// 一对一对比逻辑 - 计算两个角色之间的票数差异和得票率
if (compareType === COMPARISON_TYPES.oneToOne) {
    // 1. 数据结构初始化
    // 创建三个Map来存储数据:
    // votesMap: 存储每个角色的票数
    // ratesMap: 存储每个角色的得票率
    // diffMap: 存储与最高票数的差距
    const votesMap = new Map();
    const ratesMap = new Map();
    const diffMap = new Map();

    // 2. 过滤和分类
    // 过滤出参与投票的角色（排除自动晋级的角色，其votes值为'-'）
    const normalChars = characters.filter(char => char.votes !== '-');
    // 判断是否有多个正常投票的角色
    const hasMultipleNormal = normalChars.length >= 2;

    // 3. 计算基准值
    // 获取最高票数作为基准
    // 如果有多个正常投票的角色，找出最高票；否则设为0
    const maxVotes = hasMultipleNormal 
        ? Math.max(...normalChars.map(char => parseInt(char.votes))) 
        : 0;

    // 4. 计算每个角色的数据
    characters.forEach(char => {
        if (char.votes === '-') {
            // 4.1 处理自动晋级角色
            // 所有数值设为null，表示无需参与对比
            votesMap.set(char.name, null);    // 无票数
            ratesMap.set(char.name, null);    // 无得票率
            diffMap.set(char.name, null);     // 无差距
        } else {
            // 4.2 处理正常投票角色
            const vote = parseInt(char.votes);
            votesMap.set(char.name, vote);    // 记录实际票数
            
            // 计算得票率，保留一位小数
            ratesMap.set(char.name, ((vote / totalVotes) * 100).toFixed(1));
            
            // 计算与最高票的差距
            // 只在有多个正常投票角色时计算差距
            diffMap.set(char.name, hasMultipleNormal ? maxVotes - vote : null);
        }
    });

    // 5. 生成对比结果的HTML
    // 参数说明：
    // - characters: 所有参与对比的角色数组
    // - votesMap: 存储每个角色票数的Map
    // - ratesMap: 存储每个角色得票率的Map
    // - hasMultipleNormal: 是否有多个正常投票的角色（用于决定是否显示差距）
    return this.generateOneToOneHTML(characters, votesMap, ratesMap, hasMultipleNormal);
}`,
        'base': `// 基准对比逻辑 - 计算其他角色与基准角色的票数和得票率差异
if (compareType === COMPARISON_TYPES.baseCompare) {
    // 1. 数据准备
    // 获取基准角色（第一个角色）和需要对比的角色（其余角色）
    // 基准角色通常是我们重点关注的角色，用于与其他角色进行对比
    const baseCharacter = characters[0];
    const compareCharacters = characters.slice(1);

    // 2. 计算每个对比角色与基准角色的差异数据
    const comparisons = compareCharacters.map(char => {
        // 2.1 获取票数
        // 将字符串类型的票数转换为数字
        const baseVotes = parseInt(baseCharacter.votes);
        const compareVotes = parseInt(char.votes);

        // 2.2 处理无效票数的情况
        // 当基准角色或对比角色是自动晋级时（votes为'-'），
        // 或者票数解析失败时，返回默认值
        if (isNaN(baseVotes) || isNaN(compareVotes)) {
            return {
                voteDiff: 0,        // 票数差距
                voteRate: 0,        // 基准角色得票率
                compareRate: 0,      // 对比角色得票率
                rateDiff: 0,        // 得票率差距
                isLeading: false    // 是否领先
            };
        }
        
        // 2.3 计算对比数据
        return {
            voteDiff: baseVotes - compareVotes,     // 票数差距（正数表示基准角色领先）
            voteRate: ((baseVotes / totalVotes) * 100).toFixed(1),      // 基准角色得票率
            compareRate: ((compareVotes / totalVotes) * 100).toFixed(1), // 对比角色得票率
            rateDiff: ((baseVotes - compareVotes) / totalVotes * 100).toFixed(1), // 得票率差距
            isLeading: baseVotes > compareVotes     // 基准角色是否领先于对比角色
        };
    });
    
    // 3. 生成对比结果的HTML
    // 参数说明：
    // - baseCharacter: 基准角色对象
    // - compareCharacters: 需要进行对比的其他角色数组
    // - comparisons: 每个对比角色与基准角色的差异数据数组
    // - totalVotes: 总票数，用于计算得票率
    return this.generateOneToManyHTML(baseCharacter, compareCharacters, comparisons, totalVotes);
}`,
        'avg': `// 平均值对比逻辑 - 计算每个角色与平均票数的差异
if (compareType === COMPARISON_TYPES.avgCompare) {
    // 1. 数据准备
    // 过滤出参与正常投票的角色（排除自动晋级的角色，其votes值为'-'）
    // 这些角色的票数将用于计算平均值
    const normalCharacters = characters.filter(char => char.votes !== '-');
    
    // 2. 计算平均票数
    // 先将所有正常角色的票数转换为数字
    const normalVotes = normalCharacters.map(char => parseInt(char.votes));
    // 计算平均票数：所有票数之和除以角色数量（不四舍五入，保留小数）
    const avgVotes = normalVotes.reduce((a, b) => a + b, 0) / normalVotes.length;

    // 3. 计算每个角色与平均值的差异
    const comparisons = characters.map(char => {
        // 3.1 处理自动晋级角色
        if (char.votes === '-') {
            return {
                voteDiff: null,      // 与平均值的票数差距
                voteRate: null,      // 得票率
                rateDiff: null,      // 与平均值的得票率差距
                isLeading: null,     // 是否领先于平均值
                isAuto: true         // 标记为自动晋级
            };
        }

        const votes = parseInt(char.votes);

        // 3.2 处理只有一个正常投票角色的特殊情况
        // 此时无法进行平均值对比，只显示得票率
        if (normalCharacters.length === 1) {
            return {
                voteDiff: null,      // 无法计算差距
                voteRate: ((votes / totalVotes) * 100).toFixed(1),  // 仅显示得票率
                rateDiff: null,      // 无法计算率差
                isLeading: null,     // 无法判断领先
                isAuto: false        // 非自动晋级
            };
        }

        // 3.3 计算与平均值的差异数据
        return {
            voteDiff: Number((votes - avgVotes).toFixed(1)),     // 与平均值的票数差距，保留1位小数
            voteRate: ((votes / totalVotes) * 100).toFixed(1),   // 得票率，保留1位小数
            rateDiff: ((votes - avgVotes) / totalVotes * 100).toFixed(1),  // 与平均值的得票率差距
            isLeading: votes > avgVotes,  // 是否高于平均值
            isAuto: false                 // 非自动晋级
        };
    });
    
    // 4. 生成对比结果的HTML
    // 参数说明：
    // - characters: 所有参与对比的角色
    // - avgVotes: 计算出的平均票数
    // - comparisons: 每个角色的对比结果
    // - totalVotes: 总票数
    // - allCharacters: 所有角色（包括未参与对比的）
    return this.generateAvgCompareHTML(characters, avgVotes, comparisons, totalVotes, allCharacters);
}`,
        'group-total': `// 组总票数对比逻辑
if (compareType === COMPARISON_TYPES.groupTotalCompare) {
    // 1. 数据准备
    // 先把角色按组分类
    const groups = [];
    const comparison = document.querySelector(SELECTORS.characterComparison);
    const groupElements = comparison.querySelectorAll(SELECTORS.characterGroup);
    
    // 从DOM中获取组信息
    groupElements.forEach(groupElement => {
        const members = groupElement.querySelectorAll(SELECTORS.groupMember);
        const group = Array.from(members).map(member => {
            const name = member.querySelector(SELECTORS.characterAvatar).alt;
            const ip = member.querySelector(SELECTORS.characterAvatar).title.split('@')[1];
            return characters.find(char => char.name === name && char.ip === ip);
        });
        groups.push(group);
    });

    // 2. 计算票数
    // 2.1 计算每组的总票数
    const groupTotals = groups.map(group => {
        return group.reduce((sum, char) => {
            return sum + (char.votes === '-' ? 0 : parseInt(char.votes));
        }, 0);
    });
    
    // 2.2 计算所有组的总票数
    const allGroupsTotal = groupTotals.reduce((a, b) => a + b, 0);
    
    // 3. 排序处理
    // 3.1 获取排序后的索引
    const sortedIndices = groupTotals
        .map((total, index) => ({ total, index }))
        .sort((a, b) => b.total - a.total)
        .map(item => item.index);
    
    // 3.2 按总票数排序组和票数
    const sortedGroups = sortedIndices.map(index => groups[index]);
    const sortedTotals = sortedIndices.map(index => groupTotals[index]);
    
    // 4. 计算组间差异和得票率
    const comparisons = sortedTotals.map((total, index) => {
        const nextTotal = sortedTotals[index + 1];
        return {
            total,                   // 组总票数
            voteRate: ((total / allGroupsTotal) * 100).toFixed(1),  // 组得票率
            diff: nextTotal !== undefined ? total - nextTotal : null,  // 与下一组的差距
            rank: index + 1          // 排名
        };
    });
    
    // 5. 生成对比结果的HTML
    // 参数说明：
    // - sortedGroups: 按总票数排序后的组数组，每个组包含多个角色对象
    //   [{name, votes, ip}, ...]
    // - comparisons: 每个组的对比数据数组
    //   [{total, voteRate, diff, rank}, ...]
    // - totalVotes: 所有角色的总票数（包括未分组的）
    // - allGroupsTotal: 所有组的总票数之和
    return this.generateGroupTotalHTML(sortedGroups, comparisons, totalVotes, allGroupsTotal);
}`,
        'group-avg': `// 组平均值对比逻辑
if (compareType === COMPARISON_TYPES.groupAvgCompare) {
    // 1. 数据准备
    const groups = [];
    const comparison = document.querySelector(SELECTORS.characterComparison);
    const groupElements = comparison.querySelectorAll(SELECTORS.characterGroup);
    
    // 收集每组的角色
    groupElements.forEach(groupElement => {
        const members = groupElement.querySelectorAll(SELECTORS.groupMember);
        const group = Array.from(members).map(member => {
            const name = member.querySelector(SELECTORS.characterAvatar).alt;
            const ip = member.querySelector(SELECTORS.characterAvatar).title.split('@')[1];
            return characters.find(char => char.name === name && char.ip === ip);
        });
        groups.push(group);
    });

    // 2. 计算平均值
    // 2.1 计算每组的平均票数
    const groupAverages = groups.map(group => {
        const validVotes = group.filter(char => char.votes !== '-');
        if (validVotes.length === 0) return 0;
        
        const total = validVotes.reduce((sum, char) => sum + parseInt(char.votes), 0);
        return total / validVotes.length;
    });
    
    // 2.2 计算所有组的总平均值
    const allGroupsAvg = groupAverages.reduce((a, b) => a + b, 0) / groupAverages.length;
    
    // 3. 排序处理
    // 3.1 按平均票数排序
    const sortedIndices = groupAverages
        .map((avg, index) => ({ avg, index }))
        .sort((a, b) => b.avg - a.avg)
        .map(item => item.index);
    
    // 3.2 重新排序组和平均值
    const sortedGroups = sortedIndices.map(index => groups[index]);
    const sortedAverages = sortedIndices.map(index => groupAverages[index]);
    
    // 4. 计算组间差异和得票率
    const comparisons = sortedAverages.map((avg, index) => {
        const nextAvg = sortedAverages[index + 1];
        return {
            avg: parseFloat(avg.toFixed(1)),         // 组平均票数，保留1位小数
            voteRate: ((avg / allGroupsAvg) * 100).toFixed(1),  // 相对于总平均的百分比
            diff: nextAvg !== undefined ? parseFloat((avg - nextAvg).toFixed(1)) : null,  // 与下一组的差距
            rank: index + 1                          // 排名
        };
    });
    
    // 5. 生成对比结果的HTML
    // 参数说明：
    // - sortedGroups: 按平均票数排序后的组数组，每个组包含多个角色对象
    //   [{name, votes, ip}, ...]
    // - comparisons: 每个组的对比数据数组
    //   [{avg, voteRate, diff, rank}, ...]
    // - totalVotes: 所有角色的总票数
    // - allGroupsAvg: 所有组的平均票数
    return this.generateGroupAvgHTML(sortedGroups, comparisons, totalVotes, allGroupsAvg);
}`,
        'group-base-total': `// 组基准总票数对比逻辑
if (compareType === COMPARISON_TYPES.groupBaseTotalCompare) {
    // 1. 获取所有组
    const groups = [];
    const comparison = document.querySelector(SELECTORS.characterComparison);
    const groupElements = comparison.querySelectorAll(SELECTORS.characterGroup);
    
    groupElements.forEach(groupElement => {
        const members = groupElement.querySelectorAll(SELECTORS.groupMember);
        const group = Array.from(members).map(member => {
            const name = member.querySelector(SELECTORS.characterAvatar).alt;
            const ip = member.querySelector(SELECTORS.characterAvatar).title.split('@')[1];
            return characters.find(char => char.name === name && char.ip === ip);
        });
        groups.push(group);
    });

    // 2. 计算基准组（第一组）的总票数
    const baseGroup = groups[0];
    const baseTotal = baseGroup.reduce((sum, char) => {
        return sum + (char.votes === '-' ? 0 : parseInt(char.votes));
    }, 0);
    
    // 3. 计算其他组与基准组的差异
    // 3.1 计算所有组的总票数
    const allGroupsTotal = groups.reduce((sum, group) => {
        return sum + group.reduce((groupSum, char) => {
            return groupSum + (char.votes === '-' ? 0 : parseInt(char.votes));
        }, 0);
    }, 0);

    // 3.2 计算每组的对比数据
    const comparisons = groups.map((group, index) => {
        const total = group.reduce((sum, char) => {
            return sum + (char.votes === '-' ? 0 : parseInt(char.votes));
        }, 0);
        
        return {
            total,                   // 组总票数
            voteRate: ((total / allGroupsTotal) * 100).toFixed(1),  // 组得票率
            baseDiff: total - baseTotal,  // 与基准组的票数差距
            rateDiff: ((total - baseTotal) / allGroupsTotal * 100).toFixed(1),  // 与基准组的得票率差距
            isLeading: total > baseTotal,  // 是否领先于基准组
            isBase: index === 0      // 是否是基准组
        };
    });
    
    // 4. 生成对比结果的HTML
    // 参数说明：
    // - groups: 所有组的数组，每个组包含多个角色对象
    //   [[{name, votes, ip}, ...], ...]
    // - comparisons: 每个组的对比数据数组
    //   [{total, voteRate, baseDiff, rateDiff, isLeading, isBase}, ...]
    // - totalVotes: 所有角色的总票数（包括未分组的）
    return this.generateGroupBaseTotalHTML(groups, comparisons, totalVotes);
}`,
        'group-base-avg': `// 组基准平均值对比逻辑
if (compareType === COMPARISON_TYPES.groupBaseAvgCompare) {
    // 1. 获取所有组
    const groups = [];
    const comparison = document.querySelector(SELECTORS.characterComparison);
    const groupElements = comparison.querySelectorAll(SELECTORS.characterGroup);
    
    groupElements.forEach(groupElement => {
        const members = groupElement.querySelectorAll(SELECTORS.groupMember);
        const group = Array.from(members).map(member => {
            const name = member.querySelector(SELECTORS.characterAvatar).alt;
            const ip = member.querySelector(SELECTORS.characterAvatar).title.split('@')[1];
            return characters.find(char => char.name === name && char.ip === ip);
        });
        groups.push(group);
    });

    // 2. 计算基准组（第一组）的平均票数
    const baseGroup = groups[0];
    const baseAvg = baseGroup.reduce((sum, char) => {
        return sum + (char.votes === '-' ? 0 : parseInt(char.votes));
    }, 0) / baseGroup.length;
    
    // 3. 计算所有组的总票数（用于计算占比）
    const allGroupsTotal = groups.reduce((sum, group) => {
        return sum + group.reduce((groupSum, char) => {
            return groupSum + (char.votes === '-' ? 0 : parseInt(char.votes));
        }, 0);
    }, 0);

    // 4. 计算每组的平均票数和与基准组的差异
    const comparisons = groups.map((group, index) => {
        const avg = group.reduce((sum, char) => {
            return sum + (char.votes === '-' ? 0 : parseInt(char.votes));
        }, 0) / group.length;
        
        return {
            avg,                    // 组平均票数
            voteRate: ((avg / (allGroupsTotal / groups.length)) * 100).toFixed(1),  // 相对于总平均的百分比
            baseDiff: avg - baseAvg,  // 与基准组的平均票数差距
            rateDiff: ((avg - baseAvg) / baseAvg * 100).toFixed(1),  // 与基准组的得票率差距
            isLeading: avg > baseAvg,  // 是否领先于基准组
            isBase: index === 0     // 是否是基准组
        };
    });
    
    // 5. 生成对比结果的HTML
    // 参数说明：
    // - groups: 所有组的数组，每个组包含多个角色对象
    //   [[{name, votes, ip}, ...], ...]
    // - comparisons: 每个组的对比数据数组
    //   [{avg, voteRate, baseDiff, rateDiff, isLeading, isBase}, ...]
    // - totalVotes: 所有角色的总票数（包括未分组的）
    return this.generateGroupBaseAvgHTML(groups, comparisons, totalVotes);
}`,
    };

    // 初始化代码示例
    function initCodeExamples() {
        const activeSection = document.querySelector('.code-section.active');
        if (activeSection) {
            const type = activeSection.dataset.type;
            const code = activeSection.querySelector('code');
            if (code && CODE_EXAMPLES[type]) {
                // 移除已有的类和属性
                code.className = 'language-javascript';
                code.removeAttribute('data-highlighted');
                
                // 先清空代码内容
                code.innerHTML = '';
                
                // 先高亮代码
                const tempCode = document.createElement('code');
                tempCode.className = 'language-javascript';
                tempCode.textContent = CODE_EXAMPLES[type];
                hljs.highlightElement(tempCode);
                
                // 获取高亮后的HTML并按行分割
                const highlightedLines = tempCode.innerHTML.split('\n');
                
                // 逐行添加高亮后的代码，并为每行添加动画
                highlightedLines.forEach((line, index) => {
                    // 创建行容器
                    const lineDiv = document.createElement('div');
                    lineDiv.className = 'code-line';
                    lineDiv.style.opacity = '0';
                    lineDiv.style.transform = 'translateX(20px)';
                    lineDiv.style.transition = 'all 0.3s ease';
                    lineDiv.style.transitionDelay = `${index * 0.05}s`;
                    
                    // 添加高亮后的代码内容
                    lineDiv.innerHTML = line || '&nbsp;';  // 处理空行
                    
                    // 添加到代码块
                    code.appendChild(lineDiv);
                    
                    // 触发动画
                    setTimeout(() => {
                        lineDiv.style.opacity = '1';
                        lineDiv.style.transform = 'translateX(0)';
                    }, 50);
                });
            }
        }
    }

    // Tab 切换时更新代码
    function updateCodeExample(type) {
        const codeSection = document.querySelector(`.code-section[data-type="${type}"]`);
        if (codeSection && CODE_EXAMPLES[type]) {
            const code = codeSection.querySelector('code');
            
            // 移除已有的类和属性
            code.className = 'language-javascript';
            code.removeAttribute('data-highlighted');
            
            // 先清空代码内容
            code.innerHTML = '';
            
            // 获取代码文本并按行分割
            const codeLines = CODE_EXAMPLES[type].split('\n');
            
            // 先高亮代码
            const tempCode = document.createElement('code');
            tempCode.className = 'language-javascript';
            tempCode.textContent = CODE_EXAMPLES[type];
            hljs.highlightElement(tempCode);
            
            // 获取高亮后的HTML并按行分割
            const highlightedLines = tempCode.innerHTML.split('\n');
            
            // 逐行添加高亮后的代码，并为每行添加动画
            highlightedLines.forEach((line, index) => {
                // 创建行容器
                const lineDiv = document.createElement('div');
                lineDiv.className = 'code-line';
                lineDiv.style.opacity = '0';
                lineDiv.style.transform = 'translateX(20px)';
                lineDiv.style.transition = 'all 0.3s ease';
                lineDiv.style.transitionDelay = `${index * 0.05}s`;
                
                // 添加高亮后的代码内容
                lineDiv.innerHTML = line || '&nbsp;';  // 处理空行
                
                // 添加到代码块
                code.appendChild(lineDiv);
                
                // 触发动画
                setTimeout(() => {
                    lineDiv.style.opacity = '1';
                    lineDiv.style.transform = 'translateX(0)';
                }, 50);
            });
        }
    }

    // 修改初始化顺序
    initCodeExamples();   // 先加载代码示例
    initCodeExpand();     // 再初始化展开按钮
}); 