class GroupRendererStrategy {
    static strategies = {
        preliminary: (groupConfig, charactersData, containers) => {
            const groupContainer = document.createElement('div');
            groupContainer.className = 'group-list';

            Object.entries(groupConfig.groups).forEach(([groupName, characters]) => {
                const groupSection = document.createElement('div');
                groupSection.className = 'group-section';
                
                const groupTitle = document.createElement('h2');
                groupTitle.textContent = groupName;
                groupSection.appendChild(groupTitle);

                const charactersList = document.createElement('ul');
                charactersList.className = 'characters-list';

                characters.forEach(characterName => {
                    const characterKey = Object.keys(charactersData).find(
                        key => charactersData[key].name === characterName
                    );

                    const characterItem = document.createElement('li');
                    
                    if (characterKey && charactersData[characterKey].avatar) {
                        characterItem.innerHTML = `
                            <img src="${charactersData[characterKey].avatar}" alt="${characterName}">
                            <span>${characterName}</span>
                        `;
                    } else {
                        characterItem.textContent = characterName;
                    }

                    charactersList.appendChild(characterItem);
                });

                groupSection.appendChild(charactersList);
                groupContainer.appendChild(groupSection);
            });

            containers.content.innerHTML = '';
            containers.content.appendChild(groupContainer);
        },

        seedGroup: (groupConfig, charactersData, containers) => {
            const table = document.createElement('table');
            table.className = 'group-table';

            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            headerRow.innerHTML = '<th></th><th>1号种子</th><th>2号种子</th><th>3号种子</th>';
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            Object.entries(groupConfig.groups).forEach(([groupName, characters]) => {
                const row = document.createElement('tr');
                const groupCell = document.createElement('th');
                groupCell.textContent = groupName;
                row.appendChild(groupCell);

                [1, 2, 3].forEach(seedNumber => {
                    const cell = document.createElement('td');
                    const character = characters.find(c => c.seed === seedNumber);
                    
                    if (character) {
                        const characterKey = Object.keys(charactersData).find(
                            key => charactersData[key].name === character.name
                        );

                        if (characterKey && charactersData[characterKey].avatar) {
                            cell.innerHTML = `
                                <img src="${charactersData[characterKey].avatar}" alt="${character.name}">
                                <span>${character.name}</span>
                            `;
                        } else {
                            cell.textContent = character.name;
                        }
                    } else {
                        cell.textContent = '';
                    }

                    row.appendChild(cell);
                });

                tbody.appendChild(row);
            });

            table.appendChild(tbody);

            containers.content.innerHTML = '';
            containers.content.appendChild(table);
        },

        registerStrategy(type, renderFn) {
            this.strategies[type] = renderFn;
        }
    };

    static render(type, groupConfig, charactersData, containers) {
        const strategy = this.strategies[type];
        if (strategy) {
            strategy(groupConfig, charactersData, containers);
        } else {
            throw new Error(`未找到 ${type} 类型的渲染策略`);
        }
    }
}

class Groups {
    constructor() {
        this.groupId = new URLSearchParams(window.location.search).get('id');
        this.containers = {
            content: document.querySelector('.groups-content'),
            title: document.querySelector('.groups-title')
        };

        document.querySelector('.back-btn').addEventListener('click', () => {
            window.history.back();
        });
    }

    async init() {
        try {
            await this.loadCharacters();
            this.renderGroups();
        } catch (error) {
            console.error('初始化分组页面失败:', error);
            this.showError('分组信息加载失败，请稍后重试');
        }
    }

    async loadCharacters() {
        const [groupsResponse, charactersResponse] = await Promise.all([
            fetch("data/groups/groups.json"),
            fetch("data/characters/base/characters-data.json")
        ]);

        if (!groupsResponse.ok || !charactersResponse.ok) {
            throw new Error('数据加载失败');
        }

        const [groupsData, charactersData] = await Promise.all([
            groupsResponse.json(),
            charactersResponse.json()
        ]);

        this.groupsData = groupsData;
        this.charactersData = charactersData;
    }

    renderGroups() {
        const groupConfig = this.groupsData[this.groupId];
        if (!groupConfig) {
            this.showError('未找到对应的分组信息');
            return;
        }

        this.containers.title.textContent = groupConfig.title;

        const type = this.getGroupType();
        GroupRendererStrategy.render(type, groupConfig, this.charactersData, this.containers);
    }

    getGroupType() {
        if (this.groupId.includes('preliminary')) return 'preliminary';
        if (this.groupId.includes('group_stage')) return 'seedGroup';
        throw new Error('未知的分组类型');
    }

    showError(message) {
        this.containers.content.innerHTML = `<p class="error">${message}</p>`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".loading-container").forEach(container => container.remove());
    const groups = new Groups();
    groups.init();
});