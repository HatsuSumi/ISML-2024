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
            await this.renderGroups();
        } catch (error) {
            console.error('初始化分组页面失败:', error);
            this.showError('分组信息加载失败，请稍后重试');
        } finally {
            const loadingContainer = document.querySelector('.loading-container');
            console.log('Loading container:', loadingContainer);
            
            if (loadingContainer) {
                console.log('Hiding loading container');
                loadingContainer.style.display = 'none';
            } else {
                console.warn('Loading container not found');
            }
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

    async renderGroups() {
        const groupConfig = this.groupsData[this.groupId];
        if (!groupConfig) {
            this.showError('未找到对应的分组信息');
            return;
        }

        this.containers.title.textContent = groupConfig.title;

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
                const characterKey = Object.keys(this.charactersData).find(
                    key => this.charactersData[key].name === characterName
                );

                const characterItem = document.createElement('li');
                
                if (characterKey && this.charactersData[characterKey].avatar) {
                    characterItem.innerHTML = `
                        <img src="${this.charactersData[characterKey].avatar}" alt="${characterName}">
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

        this.containers.content.innerHTML = '';
        this.containers.content.appendChild(groupContainer);
    }

    showError(message) {
        this.containers.content.innerHTML = `<p class="error">${message}</p>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const groups = new Groups();
    groups.init();
});