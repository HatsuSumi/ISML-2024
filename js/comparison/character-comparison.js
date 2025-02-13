import { 
    CONFIG, 
    MESSAGES, 
    COMPARISON_TYPES,
    ANIMATION_CLASSES,
    LAYOUT_CLASSES,
    SELECTORS,
    generateSelectors
} from '/ISML-2024/js/common/config.js';
import { SERIES_ALIASES } from '/ISML-2024/js/aliases/aliases.js';

class CharacterManager {
    constructor() {
        this.characters = [];
        this.selectedCharacters = new Map();
        this.events = null;
        this.loadEvents();
    }

    async loadCharacters(eventId) {
        const event = this.findEventById(eventId);
        if (!event?.links?.data) {
            throw new Error('找不到赛事数据路径');
        }
        
        const dataPath = event.links.data;
        
        try {
            const response = await fetch(dataPath);
            
            if (!response.ok) {
                console.error('加载失败:', await response.text());
                throw new Error(MESSAGES.loadError.text);
            }
            
            const data = await response.json();
            this.characters = data.data;
        } catch (error) {
            console.error('加载错误详情:', error);
            throw error;
        }
    }

    findEventById(eventId) {
        const match = Object.values(this.events.months)
            .flatMap(month => month.events)
            .flatMap(event => event.matches)
            .find(match => match.id === eventId);
        
        return match;
    }

    async loadEvents() {
        try {
            const response = await fetch(CONFIG.events.dataPath);
            const data = await response.json();
            this.events = data;
            
            const options = [];
            for (const month of Object.values(data.months)) {
                for (const event of month.events) {
                    if (event.dateRange?.result) {
                        for (const match of event.matches) {
                            if (match.id && match.links?.data) {
                                options.push({
                                    value: match.id,
                                    name: match.title
                                });
                            }
                        }
                    }
                }
            }
            
            const optionsHtml = options
                .map(option => `
                    <div class="option" data-value="${option.value}">
                        ${option.name}
                    </div>
                `).join('');
                
            document.querySelector(SELECTORS.selectOptions).innerHTML = optionsHtml;
            
        } catch (error) {
            console.error('加载赛事失败:', error);
        }
    }

    getTotalVotes(eventId) {
        for (const monthKey in this.events.months) {
            const monthData = this.events.months[monthKey];
            const event = monthData.events.find(e => {
                const matched = e.matches?.some(m => m.id === eventId);
                return matched;
            });
            
            if (event?.stats?.votes?.valid) {
                return event.stats.votes.valid;
            }
        }
        
        return 0;
    }

    searchCharacters(keyword) {
        if (!keyword) return [];
        const term = keyword.toLowerCase();
        
        return this.characters.filter(char => {
            // 基础搜索
            const basicMatch = char.name.toLowerCase().includes(term) ||
                             char.cv?.toLowerCase().includes(term);
            
            // IP 搜索（包括别名）
            const ipMatch = char.ip.toLowerCase().includes(term);
            const aliasMatch = SERIES_ALIASES[char.ip]?.some(alias => 
                alias.toLowerCase().includes(term)
            );
            
            return basicMatch || ipMatch || aliasMatch;
        });
    }

    selectCharacter(cardId, character) {
        this.selectedCharacters.set(cardId, character);
    }

    unselectCharacter(cardId) {
        this.selectedCharacters.delete(cardId);
    }

    getSelectedCharacters() {
        return Array.from(this.selectedCharacters.values());
    }

    reset() {
        this.selectedCharacters.clear();
    }

    getEventStats(eventId) {
        for (const monthKey in this.events.months) {
            const monthData = this.events.months[monthKey];
            const event = monthData.events.find(e => 
                e.matches?.some(m => m.id === eventId)
            );
            
            if (event) {
                return event;
            }
        }
        
        return null;
    }
}

class ComparisonResultGenerator {

    static setGroupLayout(container, groups) {
        if (groups.length === CONFIG.comparison.groupCompareMinGroups) {
            container.classList.add(LAYOUT_CLASSES.twoGroups);
        }
    }

    static generateBasicInfo(characters, totalVotes, eventId, compareType, allCharacters) {
        const stage = eventId.split('/')[0];  
        
        switch(stage) {
            case CONFIG.stages.nomination:
                const result = this.generateNominationInfo(characters, totalVotes, compareType, allCharacters);
                // 如果返回的是 DocumentFragment，获取它的 innerHTML
                return result instanceof DocumentFragment ? result.firstElementChild.outerHTML : result;
            case CONFIG.stages.battle:
                return this.generateBattleInfo(characters, totalVotes, compareType);
            case CONFIG.stages.final:
                return this.generateFinalInfo(characters, totalVotes, compareType);
            default:
                console.error('未知的赛事阶段:', stage);
                return this.generateNominationInfo(characters, totalVotes, compareType, allCharacters);
        }
    }


    static generateNominationInfo(characters, totalVotes, compareType, allCharacters) {
        const normalCharacters = characters.filter(char => char.votes !== '-');

        if (compareType === COMPARISON_TYPES.baseCompare) {
            // 基准对比逻辑
            const baseCharacter = characters[0];
            const compareCharacters = characters.slice(1);

            const comparisons = compareCharacters.map(char => {
                const baseVotes = parseInt(baseCharacter.votes);
                const compareVotes = parseInt(char.votes);

                if (isNaN(baseVotes) || isNaN(compareVotes)) {
                    return {
                        voteDiff: 0,
                        voteRate: 0,
                        compareRate: 0,
                        rateDiff: 0,
                        isLeading: false
                    };
                }
                
                return {
                    voteDiff: baseVotes - compareVotes,
                    voteRate: ((baseVotes / totalVotes) * 100).toFixed(1),
                    compareRate: ((compareVotes / totalVotes) * 100).toFixed(1),
                    rateDiff: ((baseVotes - compareVotes) / totalVotes * 100).toFixed(1),
                    isLeading: baseVotes > compareVotes
                };
            });
            
            return this.generateOneToManyHTML(baseCharacter, compareCharacters, comparisons, totalVotes);
        } else if (compareType === COMPARISON_TYPES.avgCompare) {
            // 平均值对比逻辑
            const normalVotes = normalCharacters.map(char => parseInt(char.votes));
            const avgVotes = normalVotes.reduce((a, b) => a + b, 0) / normalVotes.length;

            const comparisons = characters.map(char => {
                if (char.votes === '-') {
                    return {
                        voteDiff: null,
                        voteRate: null,
                        rateDiff: null,
                        isLeading: null,
                        isAuto: true
                    };
                }
                const votes = parseInt(char.votes);

                if (normalCharacters.length === 1) {
                    return {
                        voteDiff: null,
                        voteRate: ((votes / totalVotes) * 100).toFixed(1),
                        rateDiff: null,
                        isLeading: null,
                        isAuto: false
                    };
                }
                return {
                    voteDiff: Number((votes - avgVotes).toFixed(1)),
                    voteRate: ((votes / totalVotes) * 100).toFixed(1),
                    rateDiff: ((votes - avgVotes) / totalVotes * 100).toFixed(1),
                    isLeading: votes > avgVotes,
                    isAuto: false
                };
            });
            
            return this.generateAvgCompareHTML(characters, avgVotes, comparisons, totalVotes, allCharacters);
        } else if (compareType === COMPARISON_TYPES.oneToOne) {
            // 一对一对比逻辑
            const votesMap = new Map();
            const ratesMap = new Map();
            const diffMap = new Map();

          
            const normalChars = characters.filter(char => char.votes !== '-');
            const hasMultipleNormal = normalChars.length >= 2;

            const maxVotes = hasMultipleNormal ? Math.max(...normalChars.map(char => parseInt(char.votes))) : 0;
          
            characters.forEach(char => {
                if (char.votes === '-') {
                    votesMap.set(char.name, null);
                    ratesMap.set(char.name, null);
                    diffMap.set(char.name, null);
                } else {
                    const vote = parseInt(char.votes);
                    votesMap.set(char.name, vote);
                    ratesMap.set(char.name, ((vote / totalVotes) * 100).toFixed(1));
                    diffMap.set(char.name, hasMultipleNormal ? maxVotes - vote : null);
                }
            });

            return this.generateOneToOneHTML(characters, votesMap, ratesMap, hasMultipleNormal);
        } else if (compareType === COMPARISON_TYPES.groupBaseTotalCompare) {
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
            const allGroupsTotal = groups.reduce((sum, group) => {
                return sum + group.reduce((groupSum, char) => {
                    return groupSum + (char.votes === '-' ? 0 : parseInt(char.votes));
                }, 0);
            }, 0);

            const comparisons = groups.map((group, index) => {
                const total = group.reduce((sum, char) => {
                    return sum + (char.votes === '-' ? 0 : parseInt(char.votes));
                }, 0);
                
                return {
                    total,
                    voteRate: ((total / allGroupsTotal) * 100).toFixed(1),
                    baseDiff: total - baseTotal,
                    rateDiff: ((total - baseTotal) / allGroupsTotal * 100).toFixed(1),
                    isLeading: total > baseTotal,
                    isBase: index === 0
                };
            });
            
            return this.generateGroupBaseTotalHTML(groups, comparisons, totalVotes);
        } else if (compareType === COMPARISON_TYPES.groupBaseAvgCompare) {
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
                    avg,
                    voteRate: ((avg / (allGroupsTotal / groups.length)) * 100).toFixed(1),
                    baseDiff: avg - baseAvg,
                    rateDiff: ((avg - baseAvg) / baseAvg * 100).toFixed(1),
                    isLeading: avg > baseAvg,
                    isBase: index === 0
                };
            });
            
            // 5. 生成HTML
            return this.generateGroupBaseAvgHTML(groups, comparisons, totalVotes);
        } else if (compareType === COMPARISON_TYPES.groupAvgCompare) {
            // 组平均值对比逻辑
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
        
            // 1. 计算每组的平均票数
            const groupAverages = groups.map(group => {
                const validVotes = group.filter(char => char.votes !== '-');
                if (validVotes.length === 0) return 0;
                
                const total = validVotes.reduce((sum, char) => sum + parseInt(char.votes), 0);
                return total / validVotes.length;
            });
            
            // 2. 计算所有组的总平均值
            const allGroupsAvg = groupAverages.reduce((a, b) => a + b, 0) / groupAverages.length;
            
            // 3. 按平均票数排序
            const sortedIndices = groupAverages
                .map((avg, index) => ({ avg, index }))
                .sort((a, b) => b.avg - a.avg)
                .map(item => item.index);
            
            const sortedGroups = sortedIndices.map(index => groups[index]);
            const sortedAverages = sortedIndices.map(index => groupAverages[index]);
            
            // 4. 计算组间差异和得票率
            const comparisons = sortedAverages.map((avg, index) => {
                const nextAvg = sortedAverages[index + 1];
                return {
                    avg: parseFloat(avg.toFixed(1)),
                    voteRate: ((avg / allGroupsAvg) * 100).toFixed(1),
                    diff: nextAvg !== undefined ? parseFloat((avg - nextAvg).toFixed(1)) : null,
                    rank: index + 1
                };
            });
            
            return this.generateGroupAvgHTML(sortedGroups, comparisons, totalVotes, allGroupsAvg);
            
        } else if (compareType === COMPARISON_TYPES.groupTotalCompare) {
            // 组总票数对比逻辑
            // 先把角色按组分类
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

            // 1. 计算每组的总票数
            const groupTotals = groups.map(group => {
                return group.reduce((sum, char) => {
                    return sum + (char.votes === '-' ? 0 : parseInt(char.votes));
                }, 0);
            });
            
            // 2. 计算所有组的总票数
            const allGroupsTotal = groupTotals.reduce((a, b) => a + b, 0);
            
            // 3. 按总票数排序
            const sortedIndices = groupTotals
                .map((total, index) => ({ total, index }))
                .sort((a, b) => b.total - a.total)
                .map(item => item.index);
            
            const sortedGroups = sortedIndices.map(index => groups[index]);
            const sortedTotals = sortedIndices.map(index => groupTotals[index]);
            
            // 4. 计算组间差异和得票率
            const comparisons = sortedTotals.map((total, index) => {
                const nextTotal = sortedTotals[index + 1];
                return {
                    total,
                    voteRate: ((total / allGroupsTotal) * 100).toFixed(1),
                    diff: nextTotal !== undefined ? total - nextTotal : null,
                    rank: index + 1
                };
            });
            
            return this.generateGroupTotalHTML(sortedGroups, comparisons, totalVotes, allGroupsTotal);
        }
    }

    static generateAvgCompareHTML(characters, avgVotes, comparisons, totalVotes, allCharacters) {
        const allRankData = allCharacters
            .filter(c => c.votes !== '-')
            .sort((a, b) => parseInt(b.votes) - parseInt(a.votes));

        const voteToRank = new Map();
        allRankData.forEach((char, index) => {
            const votes = parseInt(char.votes);
            if (!voteToRank.has(votes)) {
                voteToRank.set(votes, index + 1);
            }
        });

        return `
            <div class="${LAYOUT_CLASSES.basicInfo}">
                ${characters.map((char, index) => {
                    let rank = char.votes === '-' ? '-' : voteToRank.get(parseInt(char.votes));
                    
                    const showDeleteBtn = characters.length > CONFIG.comparison.minAvgCharacters;

                    return `
                        <div class="${LAYOUT_CLASSES.charInfoCard}">
                            <button class="${LAYOUT_CLASSES.deleteBtn}" style="display: ${showDeleteBtn ? '' : 'none'}" onclick="event.stopPropagation(); document.querySelector('${SELECTORS.characterComparison}').__uiManager.deleteCharacter(this.closest('${SELECTORS.charInfoCard}'), true);">
                                <i class="fas fa-times"></i>
                            </button>
                            ${char.avatar ? `<img src="${char.avatar}" alt="${char.name}">` : ''}
                            <div class="${LAYOUT_CLASSES.infoContent}">
                                <h3>${char.name}</h3>
                                <p>IP：${char.ip}</p>
                                ${char.cv ? `<p>CV：${char.cv}</p>` : ''}
                                <div class="${LAYOUT_CLASSES.voteInfo}">
                                    <span class="${LAYOUT_CLASSES.voteLabel}">得票数：</span>
                                    ${char.votes === '-' ? 
                                        `<span class="${LAYOUT_CLASSES.autoTag}">自动晋级</span>` :
                                        `<span class="${LAYOUT_CLASSES.voteCount}">${char.votes}票</span>
                                        ${comparisons[index].voteDiff !== null ? `
                                            <span class="${LAYOUT_CLASSES.voteTrend} ${comparisons[index].isLeading ? LAYOUT_CLASSES.leading : LAYOUT_CLASSES.behind}">
                                                ${comparisons[index].isLeading ? 
                                                    `高于平均${avgVotes}票 ↑${Math.abs(comparisons[index].voteDiff)}票` : 
                                                    `低于平均${avgVotes}票 ↓${Math.abs(comparisons[index].voteDiff)}票`
                                                }
                                            </span>
                                        ` : ''}`
                                    }
                                </div>
                                ${char.votes !== '-' ? `
                                    <div class="${LAYOUT_CLASSES.voteRate}">
                                        <span class="${LAYOUT_CLASSES.rateLabel}">得票率：</span>
                                        <span class="${LAYOUT_CLASSES.rateValue}">${comparisons[index].voteRate}%</span>
                                        ${comparisons[index].rateDiff !== null ? `
                                            <span class="${LAYOUT_CLASSES.voteTrend} ${comparisons[index].isLeading ? LAYOUT_CLASSES.leading : LAYOUT_CLASSES.behind}">
                                                ${comparisons[index].isLeading ? 
                                                    `高于平均${((avgVotes / totalVotes) * 100).toFixed(1)}% ↑${Math.abs(comparisons[index].rateDiff)}%` : 
                                                    `低于平均${((avgVotes / totalVotes) * 100).toFixed(1)}% ↓${Math.abs(comparisons[index].rateDiff)}%`
                                                }
                                            </span>
                                        ` : ''}
                                    </div>
                                    <div class="${LAYOUT_CLASSES.rankInfo}">
                                        <span class="${LAYOUT_CLASSES.rankLabel}">当前排名：</span>
                                        <span class="${LAYOUT_CLASSES.rankValue}">${rank}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    static generateOneToManyHTML(baseCharacter, compareCharacters, comparisons, totalVotes) {
        const twoCharsClass = compareCharacters.length === CONFIG.comparison.twoCharactersCount ? LAYOUT_CLASSES.twoChars : '';
        
        return `
        <div class="${LAYOUT_CLASSES.basicInfo} ${LAYOUT_CLASSES.oneToMany} ${twoCharsClass}">
            <!-- 基准角色 -->
            <div class="${LAYOUT_CLASSES.baseCharacter}">
                <div class="${LAYOUT_CLASSES.charInfoCard} ${LAYOUT_CLASSES.main}">
                    <button class="${LAYOUT_CLASSES.deleteBtn}" onclick="event.stopPropagation(); document.querySelector('${SELECTORS.characterComparison}').__uiManager.deleteCharacter(this.closest('${SELECTORS.charInfoCard}'), true);">
                        <i class="fas fa-times"></i>
                    </button>
                    ${baseCharacter.avatar ? `<img src="${baseCharacter.avatar}" alt="${baseCharacter.name}">` : ''}
                    <div class="${LAYOUT_CLASSES.infoContent}">
                        <h3>${baseCharacter.name}</h3>
                        <p>IP：${baseCharacter.ip}</p>
                        ${baseCharacter.cv ? `<p>CV：${baseCharacter.cv}</p>` : ''}
                        <div class="${LAYOUT_CLASSES.voteInfo}">
                            <span class="${LAYOUT_CLASSES.voteLabel}">得票数：</span>
                            ${baseCharacter.votes === '-' ? 
                                `<span class="${LAYOUT_CLASSES.autoTag}">自动晋级</span>` :
                                `<span class="${LAYOUT_CLASSES.voteCount}">${baseCharacter.votes}票</span>`
                            }
                        </div>
                        ${baseCharacter.votes !== '-' ? `
                            <div class="${LAYOUT_CLASSES.voteRate}">
                                <span class="${LAYOUT_CLASSES.rateLabel}">得票率：</span>
                                <span class="${LAYOUT_CLASSES.rateValue}">${((baseCharacter.votes / totalVotes) * 100).toFixed(1)}%</span>
                            </div>
                            <div class="${LAYOUT_CLASSES.rankInfo}">
                                <span class="${LAYOUT_CLASSES.rankLabel}">当前排名：</span>
                                <span class="${LAYOUT_CLASSES.rankValue}">${baseCharacter.rank}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>

            <!-- 对比角色 -->
            <div class="${LAYOUT_CLASSES.compareCharacters}">
                <div class="${LAYOUT_CLASSES.charComparisonGrid}">
                    ${compareCharacters.map((char, index) => {
                        const baseRate = ((parseInt(baseCharacter.votes) / totalVotes) * 100).toFixed(1);
                        const compareRate = ((parseInt(char.votes) / totalVotes) * 100).toFixed(1);
                        const rateDiff = (parseFloat(baseRate) - parseFloat(compareRate)).toFixed(1);
                        const showTrend = baseCharacter.votes !== '-' && char.votes !== '-';

                        return `
                            <div class="${LAYOUT_CLASSES.charInfoCard}">
                                <button class="${LAYOUT_CLASSES.deleteBtn}" onclick="event.stopPropagation(); document.querySelector('${SELECTORS.characterComparison}').__uiManager.deleteCharacter(this.closest('${SELECTORS.charInfoCard}'), true);">
                                    <i class="fas fa-times"></i>
                                </button>
                                ${char.avatar ? `<img src="${char.avatar}" alt="${char.name}">` : ''}
                                <div class="${LAYOUT_CLASSES.infoContent}">
                                    <h3>${char.name}</h3>
                                    <p>IP：${char.ip}</p>
                                    ${char.cv ? `<p>CV：${char.cv}</p>` : ''}
                                    <div class="${LAYOUT_CLASSES.voteInfo}">
                                        <span class="${LAYOUT_CLASSES.voteLabel}">得票数：</span>
                                        ${char.votes === '-' ? 
                                            `<span class="${LAYOUT_CLASSES.autoTag}">自动晋级</span>` :
                                            `<span class="${LAYOUT_CLASSES.voteCount}">${char.votes}票</span>
                                            ${showTrend ? `
                                                <span class="${LAYOUT_CLASSES.voteTrend} ${
                                                    Math.abs(parseFloat(rateDiff)) < 0.1 ? 
                                                        LAYOUT_CLASSES.tie : 
                                                        parseFloat(rateDiff) > 0 ? LAYOUT_CLASSES.behind : LAYOUT_CLASSES.leading
                                                }">
                                                    ${Math.abs(parseFloat(rateDiff)) < 0.1 ? 
                                                        '=0' : 
                                                        `${parseFloat(rateDiff) > 0 ? '↓' : '↑'}${Math.abs(comparisons[index].voteDiff)}票`
                                                    }
                                                </span>
                                            ` : ''}`
                                        }
                                    </div>
                                    ${char.votes !== '-' ? `
                                    <div class="${LAYOUT_CLASSES.voteRate}">
                                        <span class="${LAYOUT_CLASSES.rateLabel}">得票率：</span>
                                        <span class="${LAYOUT_CLASSES.rateValue}">${compareRate}%</span>
                                        ${showTrend ? `
                                            <span class="${LAYOUT_CLASSES.voteTrend} ${
                                                Math.abs(parseFloat(rateDiff)) < 0.1 ? 
                                                    LAYOUT_CLASSES.tie : 
                                                    parseFloat(rateDiff) > 0 ? LAYOUT_CLASSES.behind : LAYOUT_CLASSES.leading
                                            }">
                                                ${Math.abs(parseFloat(rateDiff)) < 0.1 ? 
                                                    '=0%' : 
                                                    `${parseFloat(rateDiff) > 0 ? '↓' : '↑'}${Math.abs(rateDiff)}%`
                                                }
                                            </span>
                                        ` : ''}
                                    </div>
                                    <div class="${LAYOUT_CLASSES.rankInfo}">
                                        <span class="${LAYOUT_CLASSES.rankLabel}">当前排名：</span>
                                        <span class="${LAYOUT_CLASSES.rankValue}">${char.rank}</span>
                                        ${showTrend ? `
                                            <span class="${LAYOUT_CLASSES.voteTrend} ${
                                                char.rank === baseCharacter.rank ? 
                                                    LAYOUT_CLASSES.tie : 
                                                    char.rank > baseCharacter.rank ? LAYOUT_CLASSES.behind : LAYOUT_CLASSES.leading
                                            }">
                                                ${char.rank === baseCharacter.rank ? 
                                                    '=0' : 
                                                    `${char.rank > baseCharacter.rank ? '↓' : '↑'}${Math.abs(char.rank - baseCharacter.rank)}`
                                                }
                                            </span>
                                        ` : ''}
                                    </div>
                                 ` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}

    static generateOneToOneHTML(characters, votesMap, ratesMap, hasMultipleNormal) {
        return `
            <div class="${LAYOUT_CLASSES.basicInfo} ${LAYOUT_CLASSES.twoChars}">
                ${characters.map(char => `
                    <div class="${LAYOUT_CLASSES.charInfoCard}">
                        ${char.avatar ? `<img src="${char.avatar}" alt="${char.name}">` : ''}
                        <div class="${LAYOUT_CLASSES.infoContent}">
                            <h3>${char.name}</h3>
                            <p>IP：${char.ip}</p>
                            ${char.cv ? `<p>CV：${char.cv}</p>` : ''}
                            <div class="${LAYOUT_CLASSES.voteInfo}">
                                <span class="${LAYOUT_CLASSES.voteLabel}">得票数：</span>
                                ${char.votes === '-' ? 
                                    `<span class="${LAYOUT_CLASSES.autoTag}">自动晋级</span>` : 
                                    `<span class="${LAYOUT_CLASSES.voteCount}">${char.votes}票</span>
                                    ${hasMultipleNormal && char.voteDiff !== null ? `
                                        <span class="${LAYOUT_CLASSES.voteTrend} ${char.voteDiff === 0 ? LAYOUT_CLASSES.tie : (char.voteDiff > 0 ? LAYOUT_CLASSES.leading : LAYOUT_CLASSES.behind)}">
                                            ${char.voteDiff === 0 ? 
                                                '=0' : 
                                                (char.voteDiff > 0 ? 
                                                    `↑${char.voteDiff}` : 
                                                    `↓${Math.abs(char.voteDiff)}`
                                                )
                                            }
                                        </span>` : ''
                                    }`
                                }
                            </div>
                            ${char.votes !== '-' && votesMap.get(char.name) !== null ? `
                                <div class="${LAYOUT_CLASSES.voteRate}">
                                    <span class="${LAYOUT_CLASSES.rateLabel}">得票率：</span>
                                    <span class="${LAYOUT_CLASSES.rateValue}">${ratesMap.get(char.name)}%</span>
                                    ${hasMultipleNormal && char.rateDiff !== null ? `
                                        <span class="${LAYOUT_CLASSES.voteTrend} ${char.rateDiff === 0 ? LAYOUT_CLASSES.tie : (char.rateDiff > 0 ? LAYOUT_CLASSES.leading : LAYOUT_CLASSES.behind)}">
                                            ${char.rateDiff === 0 ? 
                                                '=0' : 
                                                (char.rateDiff > 0 ? 
                                                    `↑${char.rateDiff}` : 
                                                    `↓${Math.abs(char.rateDiff)}`
                                                )
                                            }%
                                        </span>` : ''
                                    }
                                </div>
                                <div class="${LAYOUT_CLASSES.rankInfo}">
                                    <span class="${LAYOUT_CLASSES.rankLabel}">当前排名：</span>
                                    <span class="${LAYOUT_CLASSES.rankValue}">${char.rank}</span>
                                    ${hasMultipleNormal && char.rankDiff !== null ? `
                                        <span class="${LAYOUT_CLASSES.voteTrend} ${char.rankDiff === 0 ? LAYOUT_CLASSES.tie : (char.rankDiff < 0 ? LAYOUT_CLASSES.leading : LAYOUT_CLASSES.behind)}">
                                            ${char.rankDiff === 0 ? 
                                                '=0' : 
                                                (char.rankDiff < 0 ? 
                                                    `↑${Math.abs(char.rankDiff)}` : 
                                                    `↓${char.rankDiff}`
                                                )
                                            }
                                        </span>` : ''
                                    }
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    // 正赛阶段的对比逻辑
    static generateBattleInfo(characters, totalVotes, compareType) {
        // TODO: 实现正赛阶段的对比逻辑
    }

    // 决赛阶段的对比逻辑
    static generateFinalInfo(characters, totalVotes, compareType) {
        // TODO: 实现决赛阶段的对比逻辑
    }

    // 添加生成 HTML 的函数
    static generateGroupTotalHTML(groups, comparisons, totalVotes, allGroupsTotal) {
        const template = document.getElementById(LAYOUT_CLASSES.groupTotalTemplate);
        const content = template.content.cloneNode(true);
        const container = content.querySelector(SELECTORS.groupComparison);
        container.innerHTML = '';  
        
        this.setGroupLayout(container, groups);
        
        groups.forEach((group, index) => {
            const groupCard = document.createElement('div');
            groupCard.className = LAYOUT_CLASSES.groupCard;
            groupCard.style.animationDelay = `${index * CONFIG.comparison.animation.delay}s`;
            
            groupCard.innerHTML = `
                <div class="${LAYOUT_CLASSES.rankNumber}">第 ${comparisons[index].rank} 名</div>
                <div class="${LAYOUT_CLASSES.groupTotalVotes}">
                    <div class="${LAYOUT_CLASSES.voteCount}">组总票数：${comparisons[index].total}票</div>
                    <div class="${LAYOUT_CLASSES.voteRate}">${comparisons[index].voteRate}%</div>
                </div>
                <div class="${LAYOUT_CLASSES.groupCharacterList}">
                    ${group.map(char => `
                        <div class="${LAYOUT_CLASSES.card}">
                            ${char.avatar ? `<img src="${char.avatar}" alt="${char.name}" class="${LAYOUT_CLASSES.characterAvatar}">` : ''}
                            <div class="${LAYOUT_CLASSES.characterInfo}">
                                <div class="${LAYOUT_CLASSES.characterName}">${char.name}</div>
                                <div class="${LAYOUT_CLASSES.characterVotes}">
                                    ${char.votes === '-' ? '自动晋级' : `${char.votes}票 (${((parseInt(char.votes) / totalVotes) * 100).toFixed(1)}%)`}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="${LAYOUT_CLASSES.voteDiff}">
                    ${index === groups.length - 1 ? 
                      `<div class="${LAYOUT_CLASSES.diffLabel} ${LAYOUT_CLASSES.behind}">落后第1名</div>
                      <div class="${LAYOUT_CLASSES.diffValue} ${LAYOUT_CLASSES.behind}">${comparisons[0].total - comparisons[index].total}票</div>
                      <div class="${LAYOUT_CLASSES.diffRate} ${LAYOUT_CLASSES.behind}">-${((comparisons[0].total - comparisons[index].total) / allGroupsTotal * 100).toFixed(1)}%</div>` : 
                       `<div class="${LAYOUT_CLASSES.diffLabel} ${comparisons[index].diff === 0 ? LAYOUT_CLASSES.tie : LAYOUT_CLASSES.leading}">
                            ${comparisons[index].diff === 0 ? 
                                '与下一名持平' : 
                                `领先第${comparisons[index].rank + 1}名`
                            }
                        </div>
                        <div class="${LAYOUT_CLASSES.diffValue} ${comparisons[index].diff === 0 ? LAYOUT_CLASSES.tie : LAYOUT_CLASSES.leading}">
                            ${comparisons[index].diff === 0 ? '-' : `${comparisons[index].diff}票`}
                        </div>
                        <div class="${LAYOUT_CLASSES.diffRate} ${comparisons[index].diff === 0 ? LAYOUT_CLASSES.tie : LAYOUT_CLASSES.leading}">
                            ${comparisons[index].diff === 0 ? '-' : `+${((comparisons[index].diff / allGroupsTotal) * 100).toFixed(1)}%`}
                        </div>`
                    }
                </div>
            `;
            
            container.appendChild(groupCard);
        });
        
        return content;
    }

    static generateGroupBaseTotalHTML(groups, comparisons, totalVotes) {
        const template = document.getElementById(LAYOUT_CLASSES.groupBaseTotalTemplate);
        const content = template.content.cloneNode(true);
        const container = content.querySelector(SELECTORS.groupComparison);
        container.innerHTML = ''; 

        this.setGroupLayout(container, groups);
        
        groups.forEach((group, index) => {
            const groupCard = document.createElement('div');
            groupCard.className = LAYOUT_CLASSES.groupCard;
            groupCard.style.animationDelay = `${index * CONFIG.comparison.animation.delay}s`;
            
            const rankNumber = document.createElement('div');
            rankNumber.className = LAYOUT_CLASSES.rankNumber;
            rankNumber.textContent = index === 0 ? '基准组' : `对比组${index}`;
            groupCard.appendChild(rankNumber);
            
            const totalVotesDiv = document.createElement('div');
            totalVotesDiv.className = LAYOUT_CLASSES.groupTotalVotes;
            totalVotesDiv.innerHTML = `
                <div class="${LAYOUT_CLASSES.voteCount}">组总票数：${comparisons[index].total}票</div>
                <div class="${LAYOUT_CLASSES.voteRate}">${comparisons[index].voteRate}%</div>
            `;
            groupCard.appendChild(totalVotesDiv);
            
            const characterList = document.createElement('div');
            characterList.className = LAYOUT_CLASSES.groupCharacterList;
            characterList.innerHTML = group.map(char => `
                <div class="${LAYOUT_CLASSES.card}">
                    ${char.avatar ? `<img src="${char.avatar}" alt="${char.name}" class="${LAYOUT_CLASSES.characterAvatar}">` : ''}
                    <div class="${LAYOUT_CLASSES.characterInfo}">
                        <div class="${LAYOUT_CLASSES.characterName}">${char.name}</div>
                        <div class="${LAYOUT_CLASSES.characterVotes}">
                            ${char.votes === '-' ? '自动晋级' : `${char.votes}票 (${((parseInt(char.votes) / totalVotes) * 100).toFixed(1)}%)`}
                        </div>
                    </div>
                </div>
            `).join('');
            groupCard.appendChild(characterList);
            
            const voteDiff = document.createElement('div');
            voteDiff.className = LAYOUT_CLASSES.voteDiff;
            if (index > 0) {
                const isDiffPositive = comparisons[index].baseDiff > 0;
                const diffClass = isDiffPositive ? LAYOUT_CLASSES.leading : LAYOUT_CLASSES.behind;
                const diffPrefix = isDiffPositive ? '+' : '';
                voteDiff.innerHTML = `
                    <div class="${LAYOUT_CLASSES.diffLabel} ${diffClass}">与基准组差距</div>
                    <div class="${LAYOUT_CLASSES.diffValue} ${diffClass}">
                        ${diffPrefix}${comparisons[index].baseDiff}票
                    </div>
                    <div class="${LAYOUT_CLASSES.diffRate} ${diffClass}">
                        ${diffPrefix}${comparisons[index].rateDiff}%
                    </div>
                `;
            } else {
                const otherGroups = comparisons.slice(1);
                const leadingCount = otherGroups.filter(group => group.baseDiff < 0).length;
                const behindCount = otherGroups.filter(group => group.baseDiff > 0).length;
                const tieCount = otherGroups.filter(group => group.baseDiff === 0).length;
                
                let statusText = '';
                if (leadingCount === otherGroups.length) {
                    statusText = `<div class="${LAYOUT_CLASSES.diffLabel} ${LAYOUT_CLASSES.leading}">领先全部${otherGroups.length}个对比组</div>`;
                } else {
                    const parts = [];
                    if (leadingCount > 0) parts.push(`<span class="${LAYOUT_CLASSES.leading}">领先${leadingCount}组</span>`);
                    if (behindCount > 0) parts.push(`<span class="${LAYOUT_CLASSES.behind}">落后${behindCount}组</span>`);
                    if (tieCount > 0) parts.push(`<span class="${LAYOUT_CLASSES.tie}">持平${tieCount}组</span>`);
                    statusText = `<div class="${LAYOUT_CLASSES.diffLabel}">${parts.join('，')}</div>`;
                }
                
                voteDiff.innerHTML = statusText;
            }
            groupCard.appendChild(voteDiff);
            
            container.appendChild(groupCard);
        });
        
        return content;
    }

    // 添加生成HTML的方法
    static generateGroupBaseAvgHTML(groups, comparisons, totalVotes) {
        const template = document.getElementById(LAYOUT_CLASSES.groupBaseAvgTemplate);
        const content = template.content.cloneNode(true);
        const container = content.querySelector(SELECTORS.groupComparison);
        container.innerHTML = '';
        
        this.setGroupLayout(container, groups);

        groups.forEach((group, index) => {
            const groupCard = document.createElement('div');
            groupCard.className = LAYOUT_CLASSES.groupCard;
            groupCard.style.animationDelay = `${index * CONFIG.comparison.animation.delay}s`;
            
            const rankNumber = document.createElement('div');
            rankNumber.className = LAYOUT_CLASSES.rankNumber;
            rankNumber.textContent = index === 0 ? '基准组' : `对比组${index}`;
            groupCard.appendChild(rankNumber);
            
            const avgVotesDiv = document.createElement('div');
            avgVotesDiv.className = LAYOUT_CLASSES.groupAvgVotes;
            avgVotesDiv.innerHTML = `
                <div class="${LAYOUT_CLASSES.voteCount}">平均票数：${comparisons[index].avg.toFixed(1)}票</div>
                <div class="${LAYOUT_CLASSES.voteRate}">${comparisons[index].voteRate}%</div>
            `;
            groupCard.appendChild(avgVotesDiv);
            
            const characterList = document.createElement('div');
            characterList.className = LAYOUT_CLASSES.groupCharacterList;
            characterList.innerHTML = group.map(char => `
                <div class="${LAYOUT_CLASSES.card}">
                ${char.avatar ? `<img src="${char.avatar}" alt="${char.name}" class="${LAYOUT_CLASSES.characterAvatar}">` : ''}
                    <div class="${LAYOUT_CLASSES.characterInfo}">
                        <div class="${LAYOUT_CLASSES.characterName}">${char.name}</div>
                        <div class="${LAYOUT_CLASSES.characterVotes}">
                            ${char.votes === '-' ? '自动晋级' : `${char.votes}票 (${((parseInt(char.votes) / totalVotes) * 100).toFixed(1)}%)`}
                        </div>
                    </div>
                </div>
            `).join('');
            groupCard.appendChild(characterList);
            
            const voteDiff = document.createElement('div');
            voteDiff.className = LAYOUT_CLASSES.voteDiff;

         if (index > 0) {
            const isDiffPositive = comparisons[index].baseDiff > 0;
            const diffClass = isDiffPositive ? LAYOUT_CLASSES.leading : LAYOUT_CLASSES.behind;
            const diffPrefix = isDiffPositive ? '+' : '';
            voteDiff.innerHTML = `
                <div class="${LAYOUT_CLASSES.diffLabel} ${diffClass}">与基准组差距</div>
                <div class="${LAYOUT_CLASSES.diffValue} ${diffClass}">
                    ${diffPrefix}${comparisons[index].baseDiff}票
                </div>
                <div class="${LAYOUT_CLASSES.diffRate} ${diffClass}">
                    ${diffPrefix}${comparisons[index].rateDiff}%
                </div>
            `;
        } else {
            const otherGroups = comparisons.slice(1);
            const leadingCount = otherGroups.filter(group => group.baseDiff < 0).length;
            const behindCount = otherGroups.filter(group => group.baseDiff > 0).length;
            const tieCount = otherGroups.filter(group => group.baseDiff === 0).length;
            
            let statusText = '';
            if (leadingCount === otherGroups.length) {
                statusText = `<div class="${LAYOUT_CLASSES.diffLabel} ${LAYOUT_CLASSES.leading}">领先全部${otherGroups.length}个对比组</div>`;
            } else {
                const parts = [];
                if (leadingCount > 0) parts.push(`<span class="${LAYOUT_CLASSES.leading}">领先${leadingCount}组</span>`);
                if (behindCount > 0) parts.push(`<span class="${LAYOUT_CLASSES.behind}">落后${behindCount}组</span>`);
                if (tieCount > 0) parts.push(`<span class="${LAYOUT_CLASSES.tie}">持平${tieCount}组</span>`);
                statusText = `<div class="${LAYOUT_CLASSES.diffLabel}">${parts.join('，')}</div>`;
            }
            
            voteDiff.innerHTML = statusText;
        }
        
        groupCard.appendChild(voteDiff);
        container.appendChild(groupCard);
    });  
        return content;
    }

    static generateGroupAvgHTML(groups, comparisons, totalVotes, allGroupsAvg) {
        const template = document.getElementById(LAYOUT_CLASSES.groupAvgTemplate);
        const content = template.content.cloneNode(true);
        const container = content.querySelector(SELECTORS.groupComparison);
        container.innerHTML = '';  
        
        this.setGroupLayout(container, groups);
        
        groups.forEach((group, index) => {
            const groupCard = document.createElement('div');
            groupCard.className = LAYOUT_CLASSES.groupCard;
            groupCard.style.animationDelay = `${index * CONFIG.comparison.animation.delay}s`;
            
            groupCard.innerHTML = `
                <div class="${LAYOUT_CLASSES.rankNumber}">第 ${comparisons[index].rank} 名</div>
                <div class="${LAYOUT_CLASSES.groupAvgVotes}">
                    <div class="${LAYOUT_CLASSES.voteCount}">组平均票数：${comparisons[index].avg}票</div>
                    <div class="${LAYOUT_CLASSES.voteRate}">相对总平均：${comparisons[index].voteRate}%</div>
                </div>
                <div class="${LAYOUT_CLASSES.groupCharacterList}">
                    ${group.map(char => `
                        <div class="${LAYOUT_CLASSES.card}">
                            ${char.avatar ? `<img src="${char.avatar}" alt="${char.name}" class="${LAYOUT_CLASSES.characterAvatar}">` : ''}
                            <div class="${LAYOUT_CLASSES.characterInfo}">
                                <div class="${LAYOUT_CLASSES.characterName}">${char.name}</div>
                                <div class="${LAYOUT_CLASSES.characterVotes}">
                                    ${char.votes === '-' ? 
                                        '<span class="auto-tag">自动晋级</span>' : 
                                        `${char.votes}票 (${((parseInt(char.votes) / totalVotes) * 100).toFixed(1)}%)`
                                    }
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="${LAYOUT_CLASSES.voteDiff}">
                    ${index === groups.length - 1 ? 
                        `<div class="${LAYOUT_CLASSES.diffLabel} ${LAYOUT_CLASSES.behind}">落后第1名</div>
                        <div class="${LAYOUT_CLASSES.diffValue} ${LAYOUT_CLASSES.behind}">${(comparisons[0].avg - comparisons[index].avg).toFixed(1)}票</div>
                        <div class="${LAYOUT_CLASSES.diffRate} ${LAYOUT_CLASSES.behind}">
                            -${(((comparisons[0].avg - comparisons[index].avg) / allGroupsAvg) * 100).toFixed(1)}%
                        </div>` : 
                        `<div class="${LAYOUT_CLASSES.diffLabel} ${comparisons[index].diff === 0 ? LAYOUT_CLASSES.tie : LAYOUT_CLASSES.leading}">
                            ${comparisons[index].diff === 0 ? 
                                '与下一名持平' : 
                                `领先第${comparisons[index].rank + 1}名`
                            }
                        </div>
                        <div class="${LAYOUT_CLASSES.diffValue} ${comparisons[index].diff === 0 ? LAYOUT_CLASSES.tie : LAYOUT_CLASSES.leading}">
                            ${comparisons[index].diff === 0 ? '-' : `${comparisons[index].diff}票`}
                        </div>
                        <div class="${LAYOUT_CLASSES.diffRate} ${comparisons[index].diff === 0 ? LAYOUT_CLASSES.tie : LAYOUT_CLASSES.leading}">
                            ${comparisons[index].diff === 0 ? '-' : `+${((comparisons[index].diff / allGroupsAvg) * 100).toFixed(1)}%`}
                        </div>`
                    }
                </div>
            `;
            
            container.appendChild(groupCard);
        });
        
        return content;
    }
}

// 提示框工具类
class AlertBox {
    static show(message, duration = CONFIG.alert.duration.normal, type = LAYOUT_CLASSES.alertInfo) {
    
        const existingAlert = document.querySelector(SELECTORS.alertBox);
        if (existingAlert) {
            existingAlert.remove();
        }

        const alertBox = document.createElement('div');
        alertBox.className = `${LAYOUT_CLASSES.alertBox} ${type}`;
        alertBox.textContent = message;
        document.body.appendChild(alertBox);

        requestAnimationFrame(() => {
            alertBox.classList.add(ANIMATION_CLASSES.show);
        });

        setTimeout(() => {
            alertBox.classList.remove(ANIMATION_CLASSES.show);
            setTimeout(() => alertBox.remove(), CONFIG.alert.animation.duration);
        }, duration);
    }
}

class UIManager {
    static groupCompareTypes = new Set([
        COMPARISON_TYPES.groupBaseTotalCompare,
        COMPARISON_TYPES.groupBaseAvgCompare,
        COMPARISON_TYPES.groupTotalCompare,
        COMPARISON_TYPES.groupAvgCompare,
    ]);
    
    static compareTypes = [
        COMPARISON_TYPES.baseCompare,
        COMPARISON_TYPES.avgCompare,
        ...UIManager.groupCompareTypes
    ];

    constructor(characterManager) {
        this.characterManager = characterManager;
        this.cardCounter = 0;
        this.clickHandlers = new WeakMap();
        this.createGroup = this.createGroup.bind(this);
        this.deleteGroup = this.deleteGroup.bind(this);
        this.compareCharacters = this.compareCharacters.bind(this);
        this.showCharacterSelectModal = this.showCharacterSelectModal.bind(this);
        this.handleCharacterSearch = this.handleCharacterSearch.bind(this);
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.updateQuickCompareButtons();
        this.setupQuickCompareButtons();
        this.setupGroupButtons();
    }

    createGroup(index) {
        const template = document.getElementById(LAYOUT_CLASSES.groupTemplate);
        if (!template) {
            console.error('找不到组模板');
            return null;
        }
        
        const group = template.content.cloneNode(true).firstElementChild;
        group.classList.add(ANIMATION_CLASSES.init); 
        
        // 绑定组名输入事件
        const nameInput = group.querySelector(SELECTORS.groupName);
        const baseGroupTag = group.querySelector('.base-group-tag');
        const compareType = document.getElementById(LAYOUT_CLASSES.compareType).value;
        const isBaseCompareType = compareType === COMPARISON_TYPES.groupBaseTotalCompare || 
                                 compareType === COMPARISON_TYPES.groupBaseAvgCompare;
        
        nameInput.placeholder = `组名${index + 1}`;
        if (isBaseCompareType && index === 0) {
            baseGroupTag.textContent = '（基准组）';
        }
        
        nameInput.addEventListener('input', () => {
            // 可以在这里添加验证逻辑
            const value = nameInput.value.trim();
            nameInput.classList.toggle(ANIMATION_CLASSES.invalid, !value);
        });
        
        // 失去焦点时保存
        nameInput.addEventListener('blur', () => {
            if (!nameInput.value.trim()) {
                nameInput.value = nameInput.placeholder;
            }
        });
        
        // 添加回车键确定
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();  
                nameInput.blur();   
            }
        });
        
        // 下一帧移除初始状态类，触发动画
        requestAnimationFrame(() => {
            group.classList.remove(ANIMATION_CLASSES.init);
        });
        
        // 绑定删除组按钮事件
        const deleteBtn = group.querySelector(SELECTORS.deleteGroupBtn);
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteGroup(group);
        });
        
        // 绑定空组点击事件
        const groupCharacters = group.querySelector(SELECTORS.groupCharacters);
        const clickHandler = () => {
            if (!groupCharacters.querySelector(SELECTORS.groupMember)) {
                this.showCharacterSelectModal(group);
            }
        };
        groupCharacters.addEventListener('click', clickHandler);
        // 使用 WeakMap 保存事件处理函数
        this.clickHandlers.set(groupCharacters, clickHandler);
        
        return group;
    }

    handleGroupSearch(input, group) {
        const results = this.characterManager.searchCharacters(input.value);
        const resultsContainer = input.nextElementSibling;
        
        if (results.length > 0) {
            resultsContainer.innerHTML = results
                .map(char => searchItemTemplate(char))
                .join('');
            
            resultsContainer.querySelectorAll(SELECTORS.searchItem).forEach(item => {
                item.addEventListener('click', () => {
                    const character = JSON.parse(item.dataset.character);
                    this.addCharacterToGroup(character, group);
                    
                    // 隐藏搜索框
                    group.querySelector(SELECTORS.groupSearch).classList.remove(ANIMATION_CLASSES.show);
                    group.querySelector(SELECTORS.groupCharacters).classList.remove(ANIMATION_CLASSES.searching);
                });
            });
            
            resultsContainer.classList.remove(ANIMATION_CLASSES.hidden);
        }
    }

    setupQuickCompareButtons() {
        const setupQuickCompare = (type) => {
            const btnId = type === 'cv' ? LAYOUT_CLASSES.cvCompareBtn : LAYOUT_CLASSES.ipCompareBtn;
            const modalId = type === 'cv' ? LAYOUT_CLASSES.cvModal : LAYOUT_CLASSES.ipModal;
            const optionsClass = `${type}-select-option`;
            const placeholder = type === 'cv' ? '请选择声优...' : '请选择IP...';

            document.getElementById(btnId).addEventListener('click', () => {
                // 如果是基准对比模式，先检查是否选择了基准角色
                const compareType = document.getElementById(LAYOUT_CLASSES.compareType).value;
                if (compareType === COMPARISON_TYPES.baseCompare) {
                    const firstCard = document.querySelector(SELECTORS.characterCard);
                    const input = firstCard.querySelector(SELECTORS.searchInput);
                    
                    if (!input.value) {
                        AlertBox.show(
                            MESSAGES.selectBaseCharacter.text,
                            MESSAGES.selectBaseCharacter.duration,
                            MESSAGES.selectBaseCharacter.type
                        );
                        return;
                    }
                }

                // 先显示模态框
                const modal = document.getElementById(modalId);
                if (!modal) {
                    console.error('找不到模态框元素!');
                    return;
                }
                modal.classList.add(ANIMATION_CLASSES.show);

                // 统计每个选项的角色数量
                const stats = new Map();
                this.characterManager.characters.forEach(char => {
                    const value = type === 'cv' ? char.cv : char.ip;
                    if (value) {  
                        const count = stats.get(value) || 0;
                        stats.set(value, count + 1);
                    }
                });

                // 转换为数组并按角色数量降序排序
                const sortedOptions = Array.from(stats.entries())
                    .sort((a, b) => {
                        const countDiff = b[1] - a[1];
                        if (countDiff !== 0) return countDiff;
                        return a[0].localeCompare(b[0]);
                    })
                    .map(([value, count]) => ({
                        value,
                        text: `${value} (${count}位角色)`
                    }));

                // 等模态框显示后再获取和更新选项容器
                requestAnimationFrame(() => {
                    const optionsContainer = document.querySelector(`#${modalId} .${type}-select-options`);
                    if (!optionsContainer) {
                        console.error('找不到选项容器!');
                        return;
                    }

                    optionsContainer.innerHTML = sortedOptions
                        .map(option => `<div class="${optionsClass}" data-value="${option.value}">${option.text}</div>`)
                        .join('');

                    // 添加选项点击事件
                    const options = optionsContainer.querySelectorAll(`.${optionsClass}`);
                    options.forEach(option => {
                        option.addEventListener('click', () => {
                            const text = option.textContent;
                            
                            document.querySelector(`.${type}-select-value`).textContent = text;
                            document.querySelector(`.${type}-select`).classList.remove('active');
                            document.querySelector(`.${type}-modal-btn.confirm`).disabled = false;
                            
                            options.forEach(opt => opt.classList.remove(ANIMATION_CLASSES.selected));
                            option.classList.add(ANIMATION_CLASSES.selected);
                        });
                    });
                });

                // 添加关闭按钮事件
                document.querySelector(`.${type}-modal-close`).addEventListener('click', () => {
                    document.getElementById(modalId).classList.remove(ANIMATION_CLASSES.show);
                    // 折叠下拉菜单
                    document.querySelector(`#${modalId} .${type}-select`).classList.remove('active');
                    // 重置选择
                    document.querySelector(`.${type}-select-value`).textContent = placeholder;
                    document.querySelector(`.${type}-modal-btn.confirm`).disabled = true;
                    document.querySelectorAll(`.${optionsClass}`).forEach(opt => opt.classList.remove(ANIMATION_CLASSES.selected));
                });

                // 添加触发器点击事件
                const trigger = document.querySelector(`#${modalId} .${type}-select-trigger`);
                if (trigger) {
                    trigger.addEventListener('click', () => {
                        document.querySelector(`#${modalId} .${type}-select`).classList.toggle(ANIMATION_CLASSES.active);
                    });
                }

                // 添加确定按钮事件
                document.querySelector(`.${type}-modal-btn.confirm`).addEventListener('click', () => {
                    const selectedValue = document.querySelector(`.${optionsClass}.selected`)?.dataset.value;
                    if (!selectedValue) return;

                    // 获取当前对比模式
                    const compareType = document.getElementById(LAYOUT_CLASSES.compareType).value;

                    // 获取同类型角色并排序
                    const characters = this.characterManager.characters
                        .filter(char => type === 'cv' ? char.cv === selectedValue : char.ip === selectedValue)
                        .sort((a, b) => parseInt(b.votes || '0') - parseInt(a.votes || '0'));

                    if (compareType === COMPARISON_TYPES.baseCompare) {
                        // 基准对比模式：保留第一个作为基准
                        document.querySelectorAll(SELECTORS.characterCard).forEach((card, index) => {
                            const input = card.querySelector(SELECTORS.searchInput);
                            if (index > 0 && (input.value === '' || input.placeholder.startsWith('选择角色'))) {
                                card.remove();
                            }
                        });

                        // 添加其他角色作为对比
                        characters.forEach(char => {
                            this.addCharacter();
                            const newCard = document.querySelector(SELECTORS.characterCard + ':last-child');
                            this.characterManager.selectCharacter(newCard.id, char);
                            const input = newCard.querySelector(SELECTORS.searchInput);
                            input.value = `${char.name}@${char.ip}`;
                        });
                    } else {
                        // 平均值对比模式：添加所有角色
                        document.querySelectorAll(SELECTORS.characterCard).forEach(card => {
                            const input = card.querySelector(SELECTORS.searchInput);
                            if (input.value === '' || input.placeholder.startsWith('选择角色')) {
                                card.remove();
                            }
                        });

                        characters.forEach(char => {
                            this.addCharacter();
                            const newCard = document.querySelector(SELECTORS.characterCard + ':last-child');
                            this.characterManager.selectCharacter(newCard.id, char);
                            
                            // 更新输入框显示
                            const input = newCard.querySelector(SELECTORS.searchInput);
                            input.value = `${char.name}@${char.ip}`;
                        });
                    }

                    // 执行对比
                    this.compareCharacters();

                    // 关闭模态框
                    document.getElementById(modalId).classList.remove(ANIMATION_CLASSES.show);
                });

                // 添加取消按钮事件
                document.querySelector(`.${type}-modal-btn.cancel`).addEventListener('click', () => {
                    document.getElementById(modalId).classList.remove(ANIMATION_CLASSES.show);
                    // 折叠下拉菜单
                    document.querySelector(`#${modalId} .${type}-select`).classList.remove('active');
                    // 重置选择
                    document.querySelector(`.${type}-select-value`).textContent = placeholder;
                    document.querySelector(`.${type}-modal-btn.confirm`).disabled = true;
                    document.querySelectorAll(`.${optionsClass}`).forEach(opt => opt.classList.remove(ANIMATION_CLASSES.selected));
                });
            });
        };

        // 等待 DOM 完全加载后再设置快速对比按钮
        requestAnimationFrame(() => {
            setupQuickCompare('cv');
            setupQuickCompare('ip');
        });
    }

    setupEventListeners() {
        const eventSelect = document.getElementById(LAYOUT_CLASSES.eventSelect);
        const compareTypeSelect = document.getElementById(LAYOUT_CLASSES.compareType);
        const addBtn = document.getElementById(LAYOUT_CLASSES.addCharacterBtn);
            
        compareTypeSelect.addEventListener('change', () => {
            if (compareTypeSelect.value === COMPARISON_TYPES.about) {
                compareTypeSelect.value = compareTypeSelect.dataset.previousValue || COMPARISON_TYPES.oneToOne;
                window.open('comparison-guide.html', '_blank');
            } 
        
            const comparison = document.querySelector(SELECTORS.characterComparison);
            
            compareTypeSelect.blur();

            const groupCompareTypes = UIManager.groupCompareTypes;
            
            // 获取当前和目标模式
            const currentMode = compareTypeSelect.dataset.previousValue || compareTypeSelect.value;
            const targetMode = compareTypeSelect.value;
            
            // 检查是否从组对比切换
            const isFromGroupCompare = groupCompareTypes.has(currentMode);
            
            // 保存当前值作为下次切换的参考
            compareTypeSelect.dataset.previousValue = targetMode;

            this.resetExceptEvent();
            
            // 从多对多对比切换回来时的处理
            if (isFromGroupCompare) {
                comparison.querySelectorAll(SELECTORS.characterGroup).forEach(group => group.remove());
                
                // 根据目标模式决定创建几个卡片
                const targetCardCount = targetMode === COMPARISON_TYPES.avgCompare ? 
                    CONFIG.comparison.baseCompareMinCards :  
                    CONFIG.comparison.initialCards;       
                
                let currentCardCount = 0;
                for (let i = 0; i < targetCardCount; i++) {
                    this.addCharacter(currentCardCount++);
                }

                document.getElementById(LAYOUT_CLASSES.addCharacterBtn).style.display = 'flex';
                document.getElementById(LAYOUT_CLASSES.addGroupBtn).style.display = 'none';
                
            }
            
            if (compareTypeSelect.value === COMPARISON_TYPES.baseCompare) {    
                comparison.classList.add(LAYOUT_CLASSES.oneToManyLayout);
                
                const divider = document.createElement('div');
                divider.className = LAYOUT_CLASSES.divider;
                
                // 先添加需要的卡片
                while (comparison.querySelectorAll(SELECTORS.characterCard).length < CONFIG.comparison.baseCompareMinCards) {
                    this.addCharacter();
                }
                
                // 再获取所有卡片
                const cards = Array.from(comparison.querySelectorAll(SELECTORS.characterCard));
                const cardCount = cards.length;            
                
                // 再清空内容
                comparison.innerHTML = '';
                
                // 重新添加卡片
                comparison.appendChild(cards[0]); 
                comparison.appendChild(divider);  
                cards.slice(1).forEach(card => comparison.appendChild(card));
                
                addBtn.innerHTML = '<i class="fas fa-plus"></i>添加对比角色';
                
                // 删除多余的卡片
                while (comparison.querySelectorAll(SELECTORS.characterCard).length > CONFIG.comparison.initialCards) {
                    comparison.querySelector(SELECTORS.characterCard + ':last-child').remove();
                }
                
                // 重新检查卡片数量并添加
                while (comparison.querySelectorAll(SELECTORS.characterCard).length < CONFIG.comparison.baseCompareMinCards) {
                    this.addCharacter();
                }
                
                // 3个卡片时添加 two-chars 类
                comparison.classList.toggle(LAYOUT_CLASSES.twoChars, cardCount === CONFIG.comparison.twoCharsCount);
                
                this.setupDragAndDrop();
            } else if (groupCompareTypes.has(compareTypeSelect.value)) {
                comparison.classList.remove(LAYOUT_CLASSES.oneToManyLayout);
                comparison.classList.remove(LAYOUT_CLASSES.twoChars);
                
                // 清空现有卡片
                comparison.innerHTML = '';
                
                // 添加最少需要的两个组
                for (let i = 0; i < CONFIG.comparison.groupCompareMinGroups; i++) {
                    const group = this.createGroup(i);
                    if (group) {
                        comparison.appendChild(group);
                    }
                }
                this.updateGroupDeleteButtons();
                
                // 隐藏添加角色按钮，显示添加组按钮
                document.getElementById(LAYOUT_CLASSES.addCharacterBtn).style.display = 'none';
                document.getElementById(LAYOUT_CLASSES.addGroupBtn).style.display = 'flex';
                // 隐藏快速对比区域
                document.getElementById(LAYOUT_CLASSES.quickCompareSection).style.display = 'none';
            } else {
                comparison.classList.remove(LAYOUT_CLASSES.oneToManyLayout);
                comparison.classList.remove(LAYOUT_CLASSES.twoChars); 
                addBtn.innerHTML = '<i class="fas fa-plus"></i>添加角色';  

                 // 先删除多余卡片
               if (compareTypeSelect.value === COMPARISON_TYPES.oneToOne) {
                       while (comparison.querySelectorAll(SELECTORS.characterCard).length > CONFIG.comparison.initialCards) {
                           comparison.querySelector(SELECTORS.characterCard + ':last-child').remove();
                       }
                   }

                if (compareTypeSelect.value === COMPARISON_TYPES.avgCompare) {
                    // 先删除多余的卡片
                    while (comparison.querySelectorAll(SELECTORS.characterCard).length > CONFIG.comparison.baseCompareMinCards) {
                        comparison.querySelector(SELECTORS.characterCard + ':last-child').remove();
                    }
                    // 再添加缺少的卡片
                    while (comparison.querySelectorAll(SELECTORS.characterCard).length < CONFIG.comparison.baseCompareMinCards) {
                        this.addCharacter();
                    }
                }
                // 显示添加角色按钮，隐藏添加组按钮
                document.getElementById(LAYOUT_CLASSES.addCharacterBtn).style.display = 'flex';
                document.getElementById(LAYOUT_CLASSES.addGroupBtn).style.display = 'none';
                // 显示快速对比区域
                document.getElementById(LAYOUT_CLASSES.quickCompareSection).style.display = 'flex';
            }
            this.updateDeleteButtons();
            this.updateQuickCompareButtons(); 
        });

        eventSelect.addEventListener('click', async e => {
            const option = e.target.closest(SELECTORS.selectOption);
            if (!option) return;

            const value = option.dataset.value;
            const text = option.textContent;
            
            const trigger = eventSelect.querySelector(SELECTORS.selectTrigger);
            trigger.querySelector(SELECTORS.selectValue).textContent = text;
            
            eventSelect.querySelectorAll(SELECTORS.selectOption).forEach(opt => opt.classList.remove(ANIMATION_CLASSES.selected));

            option.classList.add(ANIMATION_CLASSES.selected);
            
            eventSelect.classList.remove(ANIMATION_CLASSES.open);
            
            await this.handleEventChange(value);
            
            document.querySelectorAll(SELECTORS.characterCard).forEach(card => {
                card.draggable = true;
            });
            
            this.characterManager.reset();

            document.querySelectorAll(SELECTORS.characterCard + ' ' + SELECTORS.searchInput).forEach(input => {
                input.value = '';
            });

            this.updateDeleteButtons();
        });

        const trigger = eventSelect.querySelector(SELECTORS.selectTrigger);

        trigger.addEventListener('click', () => {
            eventSelect.classList.toggle(ANIMATION_CLASSES.open);
        });

        document.addEventListener('click', e => {
            if (!eventSelect.contains(e.target)) {
                eventSelect.classList.remove(ANIMATION_CLASSES.open);
            }
        });

        document.querySelectorAll(`${SELECTORS.characterCard} ${SELECTORS.searchInput}`).forEach(input => {
            input.addEventListener('input', this.debounce(e => this.handleSearch(e.target), CONFIG.comparison.debounce.delay));
            
            input.addEventListener('focus', e => this.handleFocus(e.target));
            
            input.addEventListener('keydown', e => this.handleKeydown(e));
            
            document.addEventListener('click', e => {
                const target = e.target;
                const cards = document.querySelectorAll(SELECTORS.characterCard);
                
                cards.forEach(card => {
                    const resultsContainer = card.querySelector(SELECTORS.searchResults);
                    if (resultsContainer && !card.contains(target)) {
                        resultsContainer.classList.add(ANIMATION_CLASSES.hidden);
                    }
                });
            });
        });

        document.getElementById(LAYOUT_CLASSES.addCharacterBtn).addEventListener('click', () => this.addCharacter());
        document.getElementById(LAYOUT_CLASSES.compareBtn).addEventListener('click', () => this.compareCharacters());
        document.getElementById(LAYOUT_CLASSES.resetBtn).addEventListener('click', () => this.reset());

        document.querySelectorAll(`${SELECTORS.comparisonResult} ${SELECTORS.charInfoCard} ${SELECTORS.deleteBtn}`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();  
                this.deleteCharacter(btn.closest(SELECTORS.charInfoCard), true);
            });
        });

        // 监听赛事选择
        eventSelect.addEventListener('change', () => {
            const cards = document.querySelectorAll(SELECTORS.characterCard);
            cards.forEach(card => {
                card.draggable = eventSelect.value !== ''; 
            });
            
            if (eventSelect.value !== '') {
                this.setupDragAndDrop();  
            }
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async handleEventChange(eventId) {
        if (!eventId) {
            AlertBox.show(MESSAGES.selectEvent.text, MESSAGES.selectEvent.duration, MESSAGES.selectEvent.type);
            return;
        }

        try {
            this.resetExceptEvent();
            await this.characterManager.loadCharacters(eventId);
            
            const stage = eventId.split('/')[0]; 
            const compareTypeSelect = document.getElementById(LAYOUT_CLASSES.compareType);
            const compareTypeWrapper = document.querySelector(SELECTORS.compareTypeWrapper);
            
            // 所有需要处理的对比类型
            const compareTypes = UIManager.compareTypes;
            
            if (stage === CONFIG.stages.nomination) {
                // 显示所有对比选项
                compareTypes.forEach(type => {
                    compareTypeSelect.querySelector(`option[value="${type}"]`).style.display = 'block';
                });
                compareTypeWrapper.classList.add(ANIMATION_CLASSES.show);
            } else {
                // 隐藏所有对比选项
                compareTypes.forEach(type => {
                    compareTypeSelect.querySelector(`option[value="${type}"]`).style.display = 'none';
                });
                if (compareTypeSelect.value !== COMPARISON_TYPES.oneToOne) {
                    compareTypeSelect.value = COMPARISON_TYPES.oneToOne;
                }
            }
            
            const event = this.characterManager.getEventStats(eventId);
            if (event?.stats?.votes) {
                document.querySelector(SELECTORS.totalVotesValue).textContent = event.stats.votes.total;
                document.querySelector(SELECTORS.totalVotesValid).textContent = `（有效：${event.stats.votes.valid}）`;
            }
        } catch (error) {
            AlertBox.show(error.message, MESSAGES.loadError.duration, MESSAGES.loadError.type);
        }
    }

    calculateZIndex(index, compareType) {
        if (compareType === COMPARISON_TYPES.baseCompare) {
            if (index === 0) return '';
            return CONFIG.comparison.zIndex.base - Math.floor((index - 1) / CONFIG.comparison.cardBatchSize);
        } else {
            return CONFIG.comparison.zIndex.base - Math.floor(index / CONFIG.comparison.cardBatchSize);
        }
    }

    resetExceptEvent() {
        document.querySelectorAll(SELECTORS.characterCard).forEach((card, index) => {
            const compareType = document.getElementById(LAYOUT_CLASSES.compareType).value;
            const zIndex = this.calculateZIndex(index, compareType);
            card.style.zIndex = String(zIndex);

            card.innerHTML = `
                <input type="text" class="${LAYOUT_CLASSES.searchInput}" placeholder="选择角色${index + 1}...">
                <div class="${LAYOUT_CLASSES.searchResults} ${ANIMATION_CLASSES.hidden}"></div>
                <button class="${LAYOUT_CLASSES.deleteBtn}" style="display: none;"><i class="fas fa-times"></i></button>
            `;
            
            const input = card.querySelector(SELECTORS.searchInput);
            input.addEventListener('input', this.debounce(e => this.handleSearch(e.target), CONFIG.comparison.debounce.delay));
            input.addEventListener('focus', e => this.handleFocus(e.target));
            input.addEventListener('keydown', e => this.handleKeydown(e));
            
            const deleteBtn = card.querySelector(SELECTORS.deleteBtn);
            deleteBtn.addEventListener('click', () => this.deleteCharacter(card));
        });

        const resultContainer = document.getElementById(LAYOUT_CLASSES.comparisonResult);
        resultContainer.classList.remove(ANIMATION_CLASSES.show);
        resultContainer.innerHTML = '';

        document.querySelector(SELECTORS.totalVotes).classList.add(ANIMATION_CLASSES.hidden);

        this.characterManager.reset();

        this.updateDeleteButtons();
    }

    async handleSearch(input) {
        const card = input.closest(SELECTORS.characterCard);
        const resultsContainer = card.querySelector(SELECTORS.searchResults);
        
        if (!input.value.trim()) {
            resultsContainer.classList.add(ANIMATION_CLASSES.hidden);
            return;
        }

        const results = this.characterManager.searchCharacters(input.value);
        if (results.length === 0) {
            resultsContainer.innerHTML = `<div class="${LAYOUT_CLASSES.searchItem}">${MESSAGES.noCharacterFound.text}</div>`;
        } else {
            resultsContainer.innerHTML = results.map(char => searchItemTemplate(char)).join('');

            const firstItem = resultsContainer.querySelector(SELECTORS.searchItem + '[data-character]');
            if (firstItem) {
                firstItem.classList.add(ANIMATION_CLASSES.active);
            }

            resultsContainer.querySelectorAll(SELECTORS.searchItem).forEach(item => {
                if (item.dataset.character) {
                    item.addEventListener('click', () => {
                        const character = JSON.parse(item.dataset.character);
                        this.selectCharacter(card.id, character);
                    });
                }
            });
        }

        resultsContainer.classList.remove(ANIMATION_CLASSES.hidden);
    }

    selectCharacter(cardId, character) {
        const card = document.getElementById(cardId);
        const input = card.querySelector(SELECTORS.searchInput);
        const results = card.querySelector(SELECTORS.searchResults);

        const selectedCharacters = this.characterManager.getSelectedCharacters();
        const isCharacterSelected = selectedCharacters.some(char => 
            char.name === character.name && char.ip === character.ip
        );

        if (isCharacterSelected) {
            AlertBox.show(MESSAGES.duplicateCharacter.text, MESSAGES.duplicateCharacter.duration, MESSAGES.duplicateCharacter.type);
            input.value = '';  
            results.classList.add(ANIMATION_CLASSES.hidden);
            return;
        }

        input.value = `${character.name}@${character.ip}`;
        results.classList.add(ANIMATION_CLASSES.hidden);
        input.blur();

        this.characterManager.selectCharacter(cardId, character);
        this.updateDeleteButtons(); 
    }

    addCharacter(existingCardCount = null) {
        const comparison = document.querySelector(SELECTORS.characterComparison);
        
        if (!this.characterManager.characters.length) {
            AlertBox.show(MESSAGES.selectEvent.text, 
                         MESSAGES.selectEvent.duration, 
                         MESSAGES.selectEvent.type);
            return;
        }

        const compareType = document.getElementById(LAYOUT_CLASSES.compareType).value;
        
        const cardCount = existingCardCount ?? comparison.querySelectorAll(SELECTORS.characterCard).length;

        if (compareType === COMPARISON_TYPES.oneToOne && cardCount >= CONFIG.comparison.initialCards) {
            AlertBox.show(MESSAGES.minOneToOneCharacters.text, 
                         MESSAGES.minOneToOneCharacters.duration, 
                         MESSAGES.minOneToOneCharacters.type);
            return;
        }   

        if (compareType === COMPARISON_TYPES.baseCompare && cardCount === CONFIG.comparison.baseCompareMinCards) {
            comparison.classList.remove(LAYOUT_CLASSES.twoChars);
        }

        const newCard = document.createElement('div');
        newCard.className = `${LAYOUT_CLASSES.card} ${ANIMATION_CLASSES.init}`;
        newCard.id = `character${cardCount + 1}`;
        newCard.draggable = true;
        
        const zIndex = this.calculateZIndex(cardCount, compareType);
        newCard.style.zIndex = String(zIndex);
        
        newCard.innerHTML = `
            <input type="text" class="${LAYOUT_CLASSES.searchInput}" placeholder="选择角色${cardCount + 1}...">
            <div class="${LAYOUT_CLASSES.searchResults} ${ANIMATION_CLASSES.hidden}"></div>
            <button class="${LAYOUT_CLASSES.deleteBtn}" style="display: none;"><i class="fas fa-times"></i></button>
        `;
        
        comparison.appendChild(newCard);

        // 添加基本事件绑定
        const input = newCard.querySelector(SELECTORS.searchInput);
        input.addEventListener('input', this.debounce(e => this.handleSearch(e.target), CONFIG.comparison.debounce.delay));
        input.addEventListener('focus', e => this.handleFocus(e.target));
        input.addEventListener('keydown', e => this.handleKeydown(e));
        
        const deleteBtn = newCard.querySelector(SELECTORS.deleteBtn);
        deleteBtn.addEventListener('click', () => this.deleteCharacter(newCard));

        requestAnimationFrame(() => {
            newCard.classList.remove(ANIMATION_CLASSES.init);
        });

        // 设置新卡片的拖拽
        this.setupDragAndDrop();
        
        // 更新删除按钮状态
        this.updateDeleteButtons();

    }

    updateDeleteButtons() {
        const compareType = document.getElementById(LAYOUT_CLASSES.compareType).value;
        const cards = document.querySelectorAll(SELECTORS.characterCard);
    
        cards.forEach((card, index) => {
            const deleteBtn = card.querySelector(SELECTORS.deleteBtn);
            if (!deleteBtn) {
                return;
            }

            if (compareType === COMPARISON_TYPES.oneToOne) {
                const shouldShow = cards.length > CONFIG.comparison.initialCards;
                deleteBtn.style.display = shouldShow ? '' : 'none';
            } else {
                const minRequired = compareType === COMPARISON_TYPES.avgCompare ? 
                    CONFIG.comparison.minAvgCharacters : CONFIG.comparison.minBaseCharacters;
                const shouldShow = cards.length > minRequired;
                deleteBtn.style.display = shouldShow ? '' : 'none';
            }
        });
    }

    compareCharacters() {
        const selectedOption = document.querySelector(`${SELECTORS.selectOption}.${ANIMATION_CLASSES.selected}`);
        if (!selectedOption) {
            AlertBox.show(MESSAGES.selectEvent.text, MESSAGES.selectEvent.duration, MESSAGES.selectEvent.type);
            return;
        }

        const groups = document.querySelectorAll(SELECTORS.characterGroup);
        const hasInvalidGroup = Array.from(groups).some(group => {
            const memberCount = group.querySelectorAll(SELECTORS.groupMember).length;
            return memberCount < CONFIG.comparison.groupMinCharacters;
        });
        
        if (hasInvalidGroup) {
            AlertBox.show(MESSAGES.emptyGroup.text, MESSAGES.emptyGroup.duration, MESSAGES.emptyGroup.type);
            return;
        }
        
        const characters = this.characterManager.getSelectedCharacters();
        const compareType = document.getElementById(LAYOUT_CLASSES.compareType).value;

        if (UIManager.groupCompareTypes.has(compareType)) {
            const groupCharacters = [];
            groups.forEach((group, index) => {
                const members = group.querySelectorAll(SELECTORS.groupMember);
                const groupChars = Array.from(members).map(member => {
                    const name = member.querySelector(SELECTORS.characterAvatar).alt;
                    const ip = member.querySelector(SELECTORS.characterAvatar).title.split('@')[1];
                    return characters.find(char => char.name === name && char.ip === ip);
                });
                groupCharacters.push(groupChars);
            });
            
            let autoGroupNames = [];
            groups.forEach(group => {
                group.classList.remove(ANIMATION_CLASSES.error);
            });
            
            groupCharacters.forEach((group, index) => {
                if (group.length > 0 && group.every(char => char.votes === '-')) {
                    const groupNameInput = groups[index].querySelector(SELECTORS.groupName);
                    const groupName = groupNameInput.value.trim() || `组名${index + 1}`;
                    autoGroupNames.push(groupName);
                    groups[index].classList.add(ANIMATION_CLASSES.error);
                }
            });
            const hasAllAutoGroup = autoGroupNames.length > 0;
            
            const allAreAuto = characters.every(char => char.votes === '-');
            
            if (hasAllAutoGroup || allAreAuto) {
                AlertBox.show(
                    allAreAuto ? 
                    MESSAGES.allAutoCharacters.text : 
                    MESSAGES.autoGroupExists.getText(autoGroupNames),
                    allAreAuto ? 
                    MESSAGES.allAutoCharacters.duration : 
                    MESSAGES.autoGroupExists.duration,
                    allAreAuto ? 
                    MESSAGES.allAutoCharacters.type : 
                    MESSAGES.autoGroupExists.type
                );
                return;
            }
        }

        if (characters.length < CONFIG.comparison.minCharacters) {
            AlertBox.show(MESSAGES.minCharacters.text, 
                         MESSAGES.minCharacters.duration, 
                         MESSAGES.minCharacters.type);
            return;
        }
        
        if (compareType !== COMPARISON_TYPES.oneToOne && characters.length < CONFIG.comparison.minAvgCharacters) {
            AlertBox.show(MESSAGES.minAvgCharacters.text, 
                         MESSAGES.minAvgCharacters.duration, 
                         MESSAGES.minAvgCharacters.type);
            return;
        }

        const names = characters.map(char => char.name);
        const uniqueNames = new Set(names);
        if (uniqueNames.size !== names.length) {
            AlertBox.show(MESSAGES.duplicateCharacter.text, MESSAGES.duplicateCharacter.duration, MESSAGES.duplicateCharacter.type);
            return;
        }

        const eventId = selectedOption.dataset.value;
        const totalVotes = this.characterManager.getTotalVotes(eventId);

        document.querySelector(SELECTORS.totalVotes).classList.remove(ANIMATION_CLASSES.hidden);
        
        const event = this.characterManager.getEventStats(eventId);
        if (event?.stats?.votes) {
            document.querySelector(SELECTORS.totalVotesValue).textContent = event.stats.votes.total;
            document.querySelector(SELECTORS.totalVotesValid).textContent = `（有效：${event.stats.votes.valid}）`;
        }

        const allRankData = this.characterManager.characters
            .filter(c => c.votes !== '-')
            .sort((a, b) => parseInt(b.votes) - parseInt(a.votes));

        const voteToRank = new Map();
        allRankData.forEach((char, index) => {
            const votes = parseInt(char.votes);
            if (!voteToRank.has(votes)) {
                voteToRank.set(votes, index + 1);
            }
        });

        const charactersWithRank = characters.map(char => {
            if (char.votes === '-') {
                return {
                    ...char,
                    rank: '-',  
                    rankDiff: null 
                };
            }

            const currentVotes = parseInt(char.votes);
            const rank = voteToRank.get(currentVotes);

            return {
                ...char,
                rank,
                rankDiff: null  
            };
        });

        if (charactersWithRank.length === 2 && charactersWithRank[0].rank !== '-' && charactersWithRank[1].rank !== '-') {
            const voteDiff = parseInt(charactersWithRank[0].votes) - parseInt(charactersWithRank[1].votes);
            const rateDiff = ((parseInt(charactersWithRank[0].votes) / totalVotes * 100) - (parseInt(charactersWithRank[1].votes) / totalVotes * 100));
            const rateDiffStr = rateDiff.toFixed(1); 
            const rankDiff = charactersWithRank[1].rank - charactersWithRank[0].rank;

            charactersWithRank[0].voteDiff = voteDiff;   
            charactersWithRank[1].voteDiff = -voteDiff;    
            charactersWithRank[0].rateDiff = rateDiff === 0 ? 0 : rateDiffStr;      
            charactersWithRank[1].rateDiff = rateDiff === 0 ? 0 : -rateDiffStr;    
            charactersWithRank[0].rankDiff = -rankDiff;    
            charactersWithRank[1].rankDiff = rankDiff;    
        }

        const resultContainer = document.getElementById(LAYOUT_CLASSES.comparisonResult);
        resultContainer.innerHTML = `
            ${ComparisonResultGenerator.generateBasicInfo(charactersWithRank, totalVotes, eventId, compareType, this.characterManager.characters)}
        `;

        resultContainer.querySelectorAll(SELECTORS.charInfoCard).forEach(card => {
            card.classList.add(ANIMATION_CLASSES.init);
        });

        requestAnimationFrame(() => {
            resultContainer.classList.add(ANIMATION_CLASSES.show);
            resultContainer.querySelectorAll(SELECTORS.charInfoCard).forEach(card => {
                card.classList.remove(ANIMATION_CLASSES.init);
            });
        });

        resultContainer.scrollIntoView({ behavior: CONFIG.comparison.scroll.behavior });
    }

    handleFocus(input) {
        const card = input.closest(SELECTORS.characterCard);
        const resultsContainer = card.querySelector(SELECTORS.searchResults);

        if (this.characterManager.characters.length === 0) {
            AlertBox.show(MESSAGES.selectEvent.text, MESSAGES.selectEvent.duration, MESSAGES.selectEvent.type);
            input.blur();
            return;
        }

        const selectedCharacters = this.characterManager.getSelectedCharacters();
        const selectedNames = new Set(selectedCharacters.map(char => `${char.name}@${char.ip}`));

        const availableCharacters = this.characterManager.characters.filter(char => {
            const charKey = `${char.name}@${char.ip}`;
            return !selectedNames.has(charKey);
        });

        if (availableCharacters.length > 0) {
            resultsContainer.innerHTML = availableCharacters.map(char => searchItemTemplate(char)).join('');
            
            resultsContainer.querySelectorAll(SELECTORS.searchItem).forEach(item => {
                if (item.dataset.character) {
                    item.addEventListener('click', () => {
                        const character = JSON.parse(item.dataset.character);
                        this.selectCharacter(card.id, character);
                    });
                }
            });
            
            resultsContainer.classList.remove(ANIMATION_CLASSES.hidden);
        } else {
            resultsContainer.innerHTML = `<div class="${SELECTORS.searchItem}">${MESSAGES.noMoreCharacters.text}</div>`;
            resultsContainer.classList.remove(ANIMATION_CLASSES.hidden);
        }
    }

    reset() {
        console.log('开始重置...');
        
        const compareType = document.getElementById(LAYOUT_CLASSES.compareType);
        const currentType = compareType.value;
        const comparison = document.querySelector(SELECTORS.characterComparison);
    
        // 清除布局类
        comparison.classList.remove(LAYOUT_CLASSES.oneToManyLayout);
    
        if (UIManager.groupCompareTypes.has(currentType)) {
            this.resetGroups(comparison);
        } else {
            this.resetCards(comparison, currentType);
        }
    
        this.clearResults();
        this.characterManager.reset();
        this.updateDeleteButtons();
    }
    
    resetGroups(comparison) {
        // 移除现有组
        comparison.querySelectorAll(SELECTORS.characterGroup).forEach(group => {
            this.unbindGroupEvents(group);
            group.remove();
        });
    
        // 创建新组
        for (let i = 0; i < CONFIG.comparison.groupCompareMinGroups; i++) {
            const group = this.createGroup(i);
            if (group) {
                comparison.appendChild(group);
            }
        }
    }
    
    unbindGroupEvents(group) {
        const groupCharacters = group.querySelector(SELECTORS.groupCharacters);
        const clickHandler = this.clickHandlers.get(groupCharacters);
        if (clickHandler) {
            groupCharacters.removeEventListener('click', clickHandler);
            this.clickHandlers.delete(groupCharacters);
        }
    }
    
    resetCards(comparison, currentType) {
        // 先移除所有卡片
        comparison.querySelectorAll(SELECTORS.characterCard).forEach(card => {
            card.remove();
        });
    
        // 根据对比类型决定创建几个卡片
        const cardCount = currentType === COMPARISON_TYPES.avgCompare ? 
            CONFIG.comparison.baseCompareMinCards : 
            CONFIG.comparison.initialCards;
    
        // 使用 addCharacter 方法创建新卡片
        for (let i = 0; i < cardCount; i++) {
            this.addCharacter(i);
        }
    }
    
    clearResults() {
        const resultContainer = document.getElementById(LAYOUT_CLASSES.comparisonResult);   
        resultContainer.classList.remove(ANIMATION_CLASSES.show);
        resultContainer.innerHTML = '';
        
        document.querySelector(SELECTORS.totalVotes).classList.add(ANIMATION_CLASSES.hidden);
    }

    handleKeydown(e) {
        const input = e.target;
        const card = input.closest(SELECTORS.characterCard);
        const resultsContainer = card.querySelector(SELECTORS.searchResults);
        const items = resultsContainer.querySelectorAll(SELECTORS.searchItem + '[data-character]');
        
        if (items.length === 0) return;

        let currentIndex = Array.from(items).findIndex(item => item.classList.contains(ANIMATION_CLASSES.active));
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (currentIndex < 0) {
                    items[0].classList.add(ANIMATION_CLASSES.active);
                    items[0].scrollIntoView({ 
                        block: CONFIG.comparison.scroll.block,
                        behavior: CONFIG.comparison.scroll.behavior 
                    });
                } else {
                    items[currentIndex].classList.remove(ANIMATION_CLASSES.active);
                    currentIndex = (currentIndex + 1) % items.length;
                    items[currentIndex].classList.add(ANIMATION_CLASSES.active);
                    items[currentIndex].scrollIntoView({ 
                        block: CONFIG.comparison.scroll.block,
                        behavior: CONFIG.comparison.scroll.behavior 
                    });
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (currentIndex < 0) {
                    items[items.length - 1].classList.add(ANIMATION_CLASSES.active);
                    items[items.length - 1].scrollIntoView({ 
                        block: CONFIG.comparison.scroll.block,
                        behavior: CONFIG.comparison.scroll.behavior 
                    });
                } else {
                    items[currentIndex].classList.remove(ANIMATION_CLASSES.active);
                    currentIndex = (currentIndex - 1 + items.length) % items.length;
                    items[currentIndex].classList.add(ANIMATION_CLASSES.active);
                    items[currentIndex].scrollIntoView({ 
                        block: CONFIG.comparison.scroll.block,
                        behavior: CONFIG.comparison.scroll.behavior 
                    });
                }
                break;

            case 'Enter':
                e.preventDefault();
                if (items.length === 1) {
                    const character = JSON.parse(items[0].dataset.character);
                    this.selectCharacter(card.id, character);
                } else if (currentIndex >= 0) {
                    const character = JSON.parse(items[currentIndex].dataset.character);
                    this.selectCharacter(card.id, character);
                }
                break;
        }
    }

    deleteCharacter(cardElement, isComparisonResult = false) {
        const resultContainer = document.getElementById(LAYOUT_CLASSES.comparisonResult);
        const hasComparisonResult = resultContainer.innerHTML.trim() !== '';
        const compareType = document.getElementById(LAYOUT_CLASSES.compareType).value;
        const cards = document.querySelectorAll(SELECTORS.characterCard);

        // 检查是否可以删除
        const minRequired = compareType === COMPARISON_TYPES.avgCompare ? 
            CONFIG.comparison.minAvgCharacters : 
            compareType === COMPARISON_TYPES.baseCompare ? 
                CONFIG.comparison.minBaseCharacters : 
                CONFIG.comparison.initialCards;

        if (cards.length <= minRequired) {
            AlertBox.show(compareType === COMPARISON_TYPES.avgCompare ? 
                MESSAGES.minAvgCharacters.text : 
                compareType === COMPARISON_TYPES.baseCompare ? 
                    MESSAGES.minCharacters.text : 
                    MESSAGES.minOneToOneCharacters.text, 
                MESSAGES.minAvgCharacters.duration, 
                compareType === COMPARISON_TYPES.avgCompare ? 
                    MESSAGES.minAvgCharacters.type : 
                    compareType === COMPARISON_TYPES.baseCompare ? 
                        MESSAGES.minCharacters.type : 
                        MESSAGES.minOneToOneCharacters.type
            );
            return;
        }

        const deleteCards = async () => {
            return new Promise(resolve => {
                setTimeout(() => {
                    if (isComparisonResult) {
                        // 从结果区域删除
                        const name = cardElement.querySelector('h3').textContent;
                        const ip = cardElement.querySelector('p').textContent.replace('IP：', '');
                        
                        // 同步删除所有相关卡片
                        document.querySelectorAll(SELECTORS.characterCard).forEach(selectCard => {
                            const input = selectCard.querySelector(SELECTORS.searchInput);
                            if (input.value === `${name}@${ip}`) {
                                this.characterManager.selectedCharacters.delete(selectCard.id);
                                selectCard.remove();
                            }
                        });
                        cardElement.remove();
                    } else {
                        // 从选择区域删除
                        const input = cardElement.querySelector(SELECTORS.searchInput);
                        const name = input.value.split('@')[0];
                        
                        cardElement.remove();
                        this.characterManager.selectedCharacters.delete(cardElement.id);
                        
                        if (hasComparisonResult) {
                            const resultCards = Array.from(resultContainer.querySelectorAll(SELECTORS.charInfoCard));
                            const resultCard = resultCards.find(card => 
                                card.querySelector('h3').textContent === name
                            );
                            if (resultCard) {
                                resultCard.remove();
                            }
                        }
                    }

                    // 重新编号剩余卡片
                    document.querySelectorAll(SELECTORS.characterCard).forEach((card, index) => {
                        card.id = `character${index + 1}`;
                        card.querySelector(SELECTORS.searchInput).placeholder = `选择角色${index + 1}...`;
                        const zIndex = this.calculateZIndex(index, compareType);
                        card.style.zIndex = String(zIndex);
                    });

                    resolve();
                }, CONFIG.comparison.animation.duration);
            });
        };

        // 添加删除动画
        if (isComparisonResult) {
            cardElement.classList.add(ANIMATION_CLASSES.deleting);
            const name = cardElement.querySelector('h3').textContent;
            const ip = cardElement.querySelector('p').textContent.replace('IP：', '');
            document.querySelectorAll(SELECTORS.characterCard).forEach(selectCard => {
                const input = selectCard.querySelector(SELECTORS.searchInput);
                if (input.value === `${name}@${ip}`) {
                    selectCard.classList.add(ANIMATION_CLASSES.deleting);
                }
            });
        } else {
            cardElement.classList.add(ANIMATION_CLASSES.deleting);
            if (hasComparisonResult) {
                const name = cardElement.querySelector(SELECTORS.searchInput).value.split('@')[0];
                const resultCards = Array.from(resultContainer.querySelectorAll(SELECTORS.charInfoCard));
                const resultCard = resultCards.find(card => 
                    card.querySelector('h3').textContent === name
                );
                if (resultCard) {
                    resultCard.classList.add(ANIMATION_CLASSES.deleting);
                }
            }
        }

        // 等待删除完成后再重新对比
        deleteCards().then(() => {
            // 在重新对比前，先更新 CharacterManager 中的数据
            const characterCards = document.querySelectorAll(SELECTORS.characterCard);
            this.characterManager.selectedCharacters.clear();  // 先清空
            
            // 重新收集当前选中的角色
            characterCards.forEach(card => {
                const input = card.querySelector(SELECTORS.searchInput);
                if (input.value) {
                    const [name, ip] = input.value.split('@');
                    const character = this.characterManager.characters.find(
                        char => char.name === name && char.ip === ip
                    );
                    if (character) {
                        this.characterManager.selectedCharacters.set(card.id, character);
                    }
                }
            });

            // 重新生成结果区域
            if (hasComparisonResult) {
                this.compareCharacters();
            }
            this.updateDeleteButtons();
        });
    }

    setupDragAndDrop() {
        const cards = document.querySelectorAll(SELECTORS.characterCard);
        
        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                // 如果卡片不可拖拽，阻止拖拽
                if (card.draggable === false) {
                    e.preventDefault();
                    return;
                }

                // 如果搜索结果显示中，不允许拖拽
                const searchResults = card.querySelector(SELECTORS.searchResults);
                if (!searchResults.classList.contains(ANIMATION_CLASSES.hidden)) {
                    e.preventDefault();
                    return;
                }
                
                card.classList.add(ANIMATION_CLASSES.dragging);
                e.dataTransfer.setData('text/plain', card.id);
            });
            
            card.addEventListener('dragend', () => {
                card.classList.remove(ANIMATION_CLASSES.dragging);
            });

            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                // 只有在不是搜索结果区域时才添加 drag-over 效果
                const searchResults = card.querySelector(SELECTORS.searchResults);
                if (searchResults.classList.contains(ANIMATION_CLASSES.hidden)) {
                    card.classList.add(ANIMATION_CLASSES.dragOver);
                }
            });

            card.addEventListener('dragleave', () => {
                card.classList.remove(ANIMATION_CLASSES.dragOver);
            });

            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove(ANIMATION_CLASSES.dragOver);
                
                const draggedId = e.dataTransfer.getData('text/plain');
                const draggedCard = document.getElementById(draggedId);
                
                this.swapCards(draggedCard, card);
            });
        });
    }

    swapCards(card1, card2) {
        if (card1.id === card2.id) return;

        // 1. 保存所有需要的数据
        const input1 = card1.querySelector(SELECTORS.searchInput);
        const input2 = card2.querySelector(SELECTORS.searchInput);
        const value1 = input1.value;
        const value2 = input2.value;

        // 2. 交换卡片 ID
        const tempId = card1.id;
        card1.id = card2.id;
        card2.id = tempId;

        // 3. 交换输入框的值
        input1.value = value2;
        input2.value = value1;

        // 4. 先保存所有角色数据
        const cards = document.querySelectorAll(SELECTORS.characterCard);
        const allCharacters = new Map();
        cards.forEach(card => {
            const character = this.characterManager.selectedCharacters.get(card.id);
            if (character) {
                allCharacters.set(card.id, character);
            }
        });

        // 5. 更新 CharacterManager 中的数据
        this.characterManager.selectedCharacters.clear();
        allCharacters.forEach((character, id) => {
            this.characterManager.selectedCharacters.set(id, character);
        });

        // 6. 重新生成对比结果
        const resultContainer = document.getElementById(LAYOUT_CLASSES.comparisonResult);
        if (resultContainer.innerHTML.trim() !== '') {
            this.compareCharacters();
        }
    }

    // 更新快速对比按钮状态
    updateQuickCompareButtons() {
        const compareType = document.getElementById(LAYOUT_CLASSES.compareType).value;
        const cvCompareBtn = document.getElementById(LAYOUT_CLASSES.cvCompareBtn);
        const ipCompareBtn = document.getElementById(LAYOUT_CLASSES.ipCompareBtn);
        
        // 在一对一对比时禁用按钮
        const isOneToOne = compareType === COMPARISON_TYPES.oneToOne;
        cvCompareBtn.disabled = isOneToOne;
        ipCompareBtn.disabled = isOneToOne;
        
        // 添加禁用状态的样式
        cvCompareBtn.classList.toggle(ANIMATION_CLASSES.disabled, isOneToOne);
        ipCompareBtn.classList.toggle(ANIMATION_CLASSES.disabled, isOneToOne);
    }

    setupGroupButtons() {
        const addGroupBtn = document.getElementById(LAYOUT_CLASSES.addGroupBtn);
        if (!addGroupBtn) return;
        
        addGroupBtn.addEventListener('click', () => {
            const comparison = document.querySelector(SELECTORS.characterComparison);
            const groupCount = comparison.querySelectorAll(SELECTORS.characterGroup).length;
            
            const group = this.createGroup(groupCount);
            if (group) {
                comparison.appendChild(group);
                this.updateGroupDeleteButtons();  
            }
        });
    }

    deleteGroup(group) {
        const comparison = document.querySelector(SELECTORS.characterComparison);
        const groupCount = comparison.querySelectorAll(SELECTORS.characterGroup).length;
        
        if (groupCount <= CONFIG.comparison.groupCompareMinGroups) {
            AlertBox.show(MESSAGES.minGroups.text, MESSAGES.minGroups.duration, MESSAGES.minGroups.type);
            return;
        }
        
        // 添加删除动画类
        group.classList.add(ANIMATION_CLASSES.deleting);
        
        // 等待动画完成后移除元素
        setTimeout(() => {
            group.remove();
            
            comparison.querySelectorAll(SELECTORS.characterGroup).forEach((g, index) => {
                g.querySelector(SELECTORS.groupName).placeholder = `组名${index + 1}`;
            });
            this.updateGroupDeleteButtons();  
        }, CONFIG.comparison.animation.duration); 
    }

    showCharacterSelectModal(targetGroup) {
        // 创建模态框
        const template = document.getElementById(LAYOUT_CLASSES.characterSelectModal);
        const modal = template.content.cloneNode(true).firstElementChild;
        document.body.appendChild(modal);

        // 关闭模态框函数
        const closeModal = () => {
            modal.classList.remove(ANIMATION_CLASSES.show);
            setTimeout(() => modal.remove(), CONFIG.alert.animation.duration);
        };

        // 获取元素
        const searchInput = modal.querySelector(SELECTORS.searchInput);
        const characterGrid = modal.querySelector(SELECTORS.characterGrid);
        const closeBtn = modal.querySelector(SELECTORS.closeModalBtn);
        const confirmBtn = modal.querySelector(SELECTORS.confirmBtn);
        const cancelBtn = modal.querySelector(SELECTORS.cancelBtn);
        const quickSelectBtn = modal.querySelector(SELECTORS.quickSelectBtn);
        const quickSelectModal = modal.querySelector(SELECTORS.quickSelectModal);
        const closeQuickSelectBtn = modal.querySelector(SELECTORS.closeQuickSelectBtn);
        const quickSelectConfirmBtn = quickSelectModal.querySelector(SELECTORS.quickSelectConfirmBtn);
        const quickSelectCancelBtn = quickSelectModal.querySelector(SELECTORS.quickSelectCancelBtn);

        // 存储选中的角色
        const selectedCharacters = new Set();  // 存储选中的角色对象
        // 初始化已选角色
        const existingMembers = targetGroup.querySelectorAll(SELECTORS.groupMember);
        existingMembers.forEach(member => {
            const name = member.querySelector(SELECTORS.characterAvatar).alt;
            const ip = member.querySelector(SELECTORS.characterAvatar).title.split('@')[1];
            const character = this.characterManager.characters.find(c => 
                c.name === name && c.ip === ip
            );
            if (character) {
                selectedCharacters.add(character);
            }
        });

        let currentFilteredChars = [];  // 存储当前筛选出的角色

        // 打开一键勾选模态框
        quickSelectBtn.addEventListener('click', () => {
            quickSelectModal.classList.add(ANIMATION_CLASSES.show);
        });

        // 重置一键勾选模态框函数
        const resetQuickSelectModal = () => {
            quickSelectModal.querySelectorAll(`${SELECTORS.quickSelectDropdown}.${ANIMATION_CLASSES.open}`).forEach(dropdown => {
                dropdown.classList.remove(ANIMATION_CLASSES.open);
            });
            quickSelectModal.classList.remove(ANIMATION_CLASSES.show);
            // 重置选择
            quickSelectModal.querySelectorAll(SELECTORS.selectValue).forEach(value => {
                value.textContent = value.closest(SELECTORS.quickSelectDropdown).dataset.type === 'cv' ? '选择声优...' : '选择IP...';
            });
            // 重置下拉菜单状态
            quickSelectModal.querySelectorAll(SELECTORS.quickSelectDropdown).forEach(dropdown => {
                dropdown.classList.remove(ANIMATION_CLASSES.disabled);
            });
            quickSelectConfirmBtn.disabled = true;
        };

        // 关闭和取消按钮都重置状态
        closeQuickSelectBtn.addEventListener('click', resetQuickSelectModal);
        quickSelectCancelBtn.addEventListener('click', resetQuickSelectModal);

        // 点击空白处关闭模态框
        quickSelectModal.addEventListener('click', (e) => {
            if (e.target === quickSelectModal) {
                // 关闭所有展开的下拉菜单
                quickSelectModal.querySelectorAll(`${SELECTORS.quickSelectDropdown}.${ANIMATION_CLASSES.open}`).forEach(dropdown => {
                    dropdown.classList.remove(ANIMATION_CLASSES.open);
                });
                quickSelectModal.classList.remove(ANIMATION_CLASSES.show);
            }
        });

        // 一键勾选选项点击事件
        quickSelectModal.querySelectorAll(SELECTORS.quickSelectDropdown).forEach(select => {
            const optionsContainer = select.querySelector(SELECTORS.quickSelectOptionsList);
            const selectValue = select.querySelector(SELECTORS.selectValue);
            const type = select.dataset.type;
            
            // 填充选项
            const options = new Set();
            const optionsMap = new Map(); 
            this.characterManager.characters.forEach(char => {
                const value = type === 'cv' ? char.cv : char.ip;
                if (value) {
                    if (!optionsMap.has(value)) {
                        optionsMap.set(value, 1);
                    } else {
                        optionsMap.set(value, optionsMap.get(value) + 1);
                    }
                }
            });
            
            // 转换为数组并按角色数量降序排序
            const sortedOptions = Array.from(optionsMap.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([value, count]) => `${value}（${count}位角色）`);
            
            optionsContainer.innerHTML = sortedOptions.map(option => `
                <div class="quick-select-option" data-value="${option.split('（')[0]}">${option}</div>
            `).join('');
            
            // 点击展开/收起
            select.querySelector(SELECTORS.quickSelectTrigger).addEventListener('click', () => {
                select.classList.toggle(ANIMATION_CLASSES.open);
            });
            
            // 点击选项
            optionsContainer.querySelectorAll(SELECTORS.quickSelectOption).forEach(option => {
                option.addEventListener('click', () => {
                    const value = option.dataset.value;
                    selectValue.textContent = option.textContent;
                    select.classList.remove(ANIMATION_CLASSES.open);
                    
                    // 获取另一个下拉菜单
                    const otherType = type === 'cv' ? 'ip' : 'cv';
                    const otherDropdown = quickSelectModal.querySelector(`${SELECTORS.quickSelectDropdown}[data-type="${otherType}"]`);
                    
                    // 如果当前选项有值，禁用另一个下拉菜单
                    if (value && value !== '选择声优...' && value !== '选择IP...') {
                        otherDropdown.classList.add(ANIMATION_CLASSES.disabled);
                    } else {
                        otherDropdown.classList.remove(ANIMATION_CLASSES.disabled);
                    }
                    
                    // 根据类型选择相同属性的角色
                    currentFilteredChars = this.characterManager.characters.filter(char => {
                        if (type === 'cv') {
                            return char.cv && char.cv === value.trim();
                        } else if (type === 'ip') {
                            return char.ip === value.trim();
                        }
                        return false;
                    });
                    
                    // 启用确定按钮
                    quickSelectConfirmBtn.disabled = false;
                });
            });
        });

        // 确定按钮事件
        quickSelectConfirmBtn.addEventListener('click', () => {
            
            // 真正勾选角色
            currentFilteredChars.forEach(char => {
                selectedCharacters.add(char);
            });

            // 重新渲染以更新选中状态
            renderCharacters(this.characterManager.characters);
            quickSelectModal.classList.remove(ANIMATION_CLASSES.show);
            // 清空筛选结果
            currentFilteredChars = [];
        });

        // 渲染角色列表
        const self = this;  
        const renderCharacters = (characters) => {
            const allGroups = document.querySelectorAll(SELECTORS.characterGroup);
            const existingCharacters = new Set();
            
            allGroups.forEach(g => {
                if (g === targetGroup) return; 
                
                const members = g.querySelectorAll(SELECTORS.groupMember);
                members.forEach(member => {
                    const name = member.querySelector(SELECTORS.characterAvatar).alt;
                    const ip = member.querySelector(SELECTORS.characterAvatar).title.split('@')[1];
                    existingCharacters.add(`${name}@${ip}`);
                });
            });
            
            const availableCharacters = characters.filter(char => 
                !existingCharacters.has(`${char.name}@${char.ip}`)
            );

            if (availableCharacters.length === 0) {
                characterGrid.innerHTML = `
                    <div class="empty-tip">
                        <i class="fas fa-search"></i>
                        <div>没有找到匹配的角色</div>
                    </div>
                `;
                requestAnimationFrame(() => {
                    characterGrid.querySelector(SELECTORS.emptyTip).classList.add(ANIMATION_CLASSES.show);
                });
                return;
            }

            // 将角色分成已选和未选两组
            const selectedChars = availableCharacters.filter(char => 
                Array.from(selectedCharacters).some(c => 
                    c.name === char.name && c.cv === char.cv && c.ip === char.ip
                )
            );
            const unselectedChars = availableCharacters.filter(char => 
                !Array.from(selectedCharacters).some(c => 
                    c.name === char.name && c.cv === char.cv && c.ip === char.ip
                )
            );
            
            // 合并两组角色，选中的在前
            const sortedCharacters = [...selectedChars, ...unselectedChars];

            characterGrid.innerHTML = sortedCharacters.map(char => {
                const isSelected = Array.from(selectedCharacters).some(c => 
                    c.name === char.name && c.cv === char.cv && c.ip === char.ip
                );

                return `
                    <div class="${LAYOUT_CLASSES.cardSelect}">
                        ${char.avatar ? `<img src="${char.avatar}" alt="${char.name}">` : ''}
                        <div class="info">
                            <div class="name">${char.name}</div>
                            <div class="ip">${char.ip}</div>
                            <div class="cv">${char.cv || '暂无CV'}</div>
                            ${char.votes === '-' ? `<div class="auto-tag">自动晋级</div>` : ''}
                        </div>
                        <div class="checkbox${isSelected ? ' checked' : ''}"></div>
                    </div>
                `;
            }).join('');

            // 绑定卡片点击事件
            characterGrid.addEventListener('click', (e) => {
                const card = e.target.closest(SELECTORS.cardSelect);
                if (!card) return;
                
                const char = self.characterManager.characters.find(c => 
                    c.name === card.querySelector('.name').textContent &&
                    c.ip === card.querySelector('.ip').textContent &&
                    (c.cv || '暂无CV') === card.querySelector('.cv').textContent
                );
                
                if (Array.from(selectedCharacters).some(c => c.name === char.name && c.cv === char.cv && c.ip === char.ip)) {
                    selectedCharacters.delete(char);
                    card.querySelector(SELECTORS.checkbox).classList.remove(ANIMATION_CLASSES.checked);
                    // 从容器中移除对应的角色
                    const member = targetGroup.querySelector(generateSelectors.groupMemberByChar(char))?.parentElement;
                    if (member) {
                        this.characterManager.selectedCharacters.delete(member.id);
                        member.remove();
                        
                        // 如果是最后一个角色，移除真实的加号按钮并重新绑定点击事件
                        if (!targetGroup.querySelector(SELECTORS.groupMember)) {
                            const groupCharacters = targetGroup.querySelector(SELECTORS.groupCharacters);
                            const addBtn = groupCharacters.querySelector(SELECTORS.addCharacterBtn);
                            if (addBtn) {
                                addBtn.remove();
                            }
                            // 重新绑定点击事件
                            const clickHandler = () => {
                                if (!groupCharacters.querySelector(SELECTORS.groupMember)) {
                                    this.showCharacterSelectModal(targetGroup);
                                }
                            };
                            groupCharacters.addEventListener('click', clickHandler);
                            this.clickHandlers.set(groupCharacters, clickHandler);
                        }
                    }
                } else {
                       // 检查其他组中是否已存在该角色
                       const allGroups = document.querySelectorAll(SELECTORS.characterGroup);
                       const isExist = Array.from(allGroups).some(g => {
                           // 跳过当前组
                           if (g === targetGroup) return false;
                           
                           const members = g.querySelectorAll(SELECTORS.groupMember);
                           return Array.from(members).some(member => {
                               const name = member.querySelector(SELECTORS.characterAvatar).alt;
                               const ip = member.querySelector(SELECTORS.characterAvatar).title.split('@')[1];
                               return char.name === name && char.ip === ip;
                           });
                       });
                       
                       if (isExist) {
                           AlertBox.show(MESSAGES.characterExists.text, MESSAGES.characterExists.duration, MESSAGES.characterExists.type);
                           return;
                       }
                    selectedCharacters.add(char);
                    card.querySelector(SELECTORS.checkbox).classList.add(ANIMATION_CLASSES.checked);
                }
            });
        };

        renderCharacters(this.characterManager.characters);

        // 搜索功能
        searchInput.addEventListener('input', this.debounce(() => {
            const keyword = searchInput.value.trim();
            if (!keyword) {
                const allCharacters = this.characterManager.characters;
                renderCharacters(allCharacters);
                return;
            }
            this.handleCharacterSearch(searchInput.value, renderCharacters);
        }, CONFIG.comparison.debounce.delay));

        // 关闭按钮
        closeBtn.addEventListener('click', closeModal);

        // 取消按钮
        cancelBtn.addEventListener('click', closeModal);

        // 确认按钮
        confirmBtn.addEventListener('click', () => {
            // 如果当前组有错误样式，检查是否需要移除
            if (targetGroup.classList.contains(ANIMATION_CLASSES.error)) {
                // 获取当前选择的角色
                const selectedChars = Array.from(selectedCharacters.values());
                // 检查是否都是自动晋级
                const allAreAuto = selectedChars.every(char => char.votes === '-');
                // 如果不是全部自动晋级，移除错误样式
                if (!allAreAuto) {
                    targetGroup.classList.remove(ANIMATION_CLASSES.error);
                }
            }

            // 只添加新选中的角色到组
            const existingMembers = new Set(Array.from(targetGroup.querySelectorAll(SELECTORS.groupMember)).map(member => {
                const name = member.querySelector(SELECTORS.characterAvatar).alt;
                const ip = member.querySelector(SELECTORS.characterAvatar).title.split('@')[1];
                return `${name}@${ip}`;
            }));
            
            selectedCharacters.forEach(character => {
                if (character && !existingMembers.has(`${character.name}@${character.ip}`)) {
                    this.addCharacterToGroup(character, targetGroup);
                }
            });

            modal.classList.remove(ANIMATION_CLASSES.show);
            setTimeout(() => modal.remove(), CONFIG.alert.animation.duration);
        });

        // 显示模态框
        requestAnimationFrame(() => modal.classList.add(ANIMATION_CLASSES.show));

        // 点击空白处关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove(ANIMATION_CLASSES.show);
                setTimeout(() => modal.remove(), CONFIG.alert.animation.duration);
            }
        });

        // ESC 键关闭
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.classList.remove(ANIMATION_CLASSES.show);
                setTimeout(() => modal.remove(), CONFIG.alert.animation.duration);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    handleCharacterSearch(keyword, renderCallback) {
        const searchResults = this.characterManager.characters.filter(char => {
            // 基础搜索字符串
            const basicStr = `${char.name}${char.cv || ''}`.toLowerCase();
            
            // IP及其别名
            const ipAliases = SERIES_ALIASES[char.ip] || [];
            const ipStr = [char.ip, ...ipAliases].join('').toLowerCase();
            
            const searchTerm = keyword.toLowerCase();
            
            return basicStr.includes(searchTerm) || ipStr.includes(searchTerm);
        });
        
        renderCallback(searchResults);
    }

    addCharacterToGroup(character, group) {
        const groupCharacters = group.querySelector(SELECTORS.groupCharacters);
        
        // 如果是第一个角色，移除父容器的点击事件
        if (!groupCharacters.querySelector(SELECTORS.groupMember)) {
            const clickHandler = this.clickHandlers.get(groupCharacters);
            if (clickHandler) {
                groupCharacters.removeEventListener('click', clickHandler);
                this.clickHandlers.delete(groupCharacters);
            }
        }
        
        const cardId = `character_${this.cardCounter++}`;  
        
        // 先创建卡片
        const card = document.createElement('div');
        card.className = `${LAYOUT_CLASSES.groupMember} ${ANIMATION_CLASSES.init}`;
        card.id = cardId;
        
        card.innerHTML = `
            <img src="${character.avatar}" alt="${character.name}" title="${character.name}@${character.ip}" class="${LAYOUT_CLASSES.characterAvatar}">
        `;
        
        // 找到现有的加号按钮
        const existingAddBtn = groupCharacters.querySelector(SELECTORS.addCharacterBtn);
        
        // 如果有加号按钮，就在它前面插入新卡片
        if (existingAddBtn) {
            groupCharacters.insertBefore(card, existingAddBtn);
        } else {
            // 如果没有加号按钮（第一次添加角色），就添加卡片和加号
            groupCharacters.appendChild(card);  
            
            const addBtn = document.createElement('div');
            addBtn.className = LAYOUT_CLASSES.groupAddCharacterBtn;
            addBtn.innerHTML = '+';
            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();  
                this.showCharacterSelectModal(group);
            });
            groupCharacters.appendChild(addBtn);
        }
        
        // 更新 CharacterManager
        this.characterManager.selectCharacter(cardId, character);
        
        // 添加动画效果
        requestAnimationFrame(() => {
            card.classList.remove(ANIMATION_CLASSES.init);
        });
        
        // 更新组删除按钮的显示状态
        this.updateGroupDeleteButtons();
    }

    updateGroupDeleteButtons() {
        const comparison = document.querySelector(SELECTORS.characterComparison);
        const groups = comparison.querySelectorAll(SELECTORS.characterGroup);
        const deleteButtons = comparison.querySelectorAll(SELECTORS.deleteGroupBtn);
        
        const compareType = document.getElementById(LAYOUT_CLASSES.compareType).value;
        const isBaseCompareType = compareType === COMPARISON_TYPES.groupBaseTotalCompare || 
                                 compareType === COMPARISON_TYPES.groupBaseAvgCompare;
        
        deleteButtons.forEach((btn, index) => {
            if (isBaseCompareType && index === 0) {
                btn.style.display = 'none';
            } else {
                btn.style.display = groups.length <= CONFIG.comparison.groupCompareMinGroups ? 'none' : 'flex';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.onkeydown = function(e) {
        if (e.altKey && e.key.toLowerCase() === 'n') {  
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const addBtn = document.getElementById(LAYOUT_CLASSES.addCharacterBtn);
            if (addBtn && addBtn.offsetParent !== null && !addBtn.disabled) {
                const uiManager = document.querySelector(SELECTORS.characterComparison)?.__uiManager;
                if (uiManager) {
                    uiManager.addCharacter();
                }
            }
            return false;
        }
    };

    const characterManager = new CharacterManager();
    const uiManager = new UIManager(characterManager);
    
    document.querySelector(SELECTORS.characterComparison).__uiManager = uiManager;
    uiManager.updateDeleteButtons(); 
});

const searchItemTemplate = char => `
    <div class="${LAYOUT_CLASSES.searchItem}" data-character='${JSON.stringify(char)}'>
        ${char.avatar ? `<img src="${char.avatar}" alt="${char.name}">` : ''}
        <div class="search-info">
            <div class="name">${char.name}</div>
            <div class="ip">IP：${char.ip}</div>
            ${char.cv ? `<div class="cv">CV：${char.cv}</div>` : ''}
        </div>
    </div>
`;

            