class GroupRendererStrategy {
    static strategies = {
        preliminary: (groupConfig, charactersData, containers) => {
            const template = document.getElementById('preliminary-group-template');
            const groupContainer = document.createElement('div');
            groupContainer.className = 'group-list';

            Object.entries(groupConfig.groups).forEach(([groupName, characters]) => {
                const groupSection = template.content.querySelector('.group-section').cloneNode(true);
                const groupTitle = groupSection.querySelector('.group-title');
                groupTitle.textContent = groupName;

                const charactersList = groupSection.querySelector('.characters-list');
                charactersList.innerHTML = ''; 

                characters.forEach(characterName => {
                    const characterKey = Object.keys(charactersData).find(
                        key => charactersData[key].name === characterName
                    );

                    const characterItem = document.createElement('li');
                    characterItem.className = 'character-item';
                    
                    if (characterKey && charactersData[characterKey].avatar) {
                        characterItem.innerHTML = `
                            <img src="${charactersData[characterKey].avatar}" alt="${characterName}" class="character-avatar">
                            <span class="character-name">${characterName}</span>
                        `;
                    } else {
                        characterItem.textContent = characterName;
                    }

                    charactersList.appendChild(characterItem);
                });

                groupContainer.appendChild(groupSection);
            });

            containers.content.innerHTML = '';
            containers.content.appendChild(groupContainer);
        },

        seedGroup: (groupConfig, charactersData, containers) => {
            const template = document.getElementById('seed-group-template');
            const table = document.createElement('table');
            table.className = 'seed-group-table';

            const thead = template.content.querySelector('thead').cloneNode(true);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');

            Object.entries(groupConfig.groups).forEach(([groupName, characters]) => {
                const row = document.createElement('tr');
                row.className = 'seed-group-row';

                const groupCell = document.createElement('th');
                groupCell.textContent = groupName;
                groupCell.className = 'seed-group-name';
                row.appendChild(groupCell);

                [1, 2, 3, 4].forEach(seedNumber => {
                    const cell = document.createElement('td');
                    cell.className = `seed-group-cell seed-${seedNumber}`;
                    
                    const character = characters.find(c => c.seed === seedNumber);
                    
                    if (character) {
                        const characterKey = Object.keys(charactersData).find(
                            key => charactersData[key].name === character.name
                        );

                        if (characterKey && charactersData[characterKey].avatar) {
                            cell.innerHTML = `
                                <div class="seed-group-character">
                                    <img src="${charactersData[characterKey].avatar}" alt="${character.name}" class="seed-group-avatar">
                                    <span class="seed-group-name">${character.name}</span>
                                </div>
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
        const urlParams = new URLSearchParams(window.location.search);
        this.groupId = urlParams.get('id');
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
        const cleanGroupId = this.groupId.split('&')[0];
        if (cleanGroupId.includes('preliminary')) return 'preliminary';
        if (cleanGroupId.includes('group_stage')) return 'seedGroup';
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