export const CONFIG = {
    rootPath: window.location.pathname.includes('/pages/') 
        ? '../../'  
        : './',    
    features: {
        danmaku: false,
        danmakuEnabled: true,
        hasWelcomeSent: false
    },
    characters: {
        showRounds: false
    },
    danmaku: {
        storageKey: 'danmakuSettings',
        interval: 30000,
        trackHeight: 30,
        duration: 15,
        dataUrl: '/js/common/danmaku-data.json',
        speed: 15,
        buffer: 500,
        minSpeed: 1,
        maxSpeed: 60,
        fontSize: 14,
        minFontSize: 12,
        maxFontSize: 24,
        position: 'top',
        trackCount: 3,
        defaultInterval: 30000
    },
    alert: {
        duration: {
            short: 1000,   
            normal: 2000,  
            long: 3000    
        },
        animation: {
            duration: 300
        }
    },
    comparison: {
        minCharacters: 2,
        minAvgCharacters: 3,
        minBaseCharacters: 3,
        initialCards: 2,
        cardBatchSize: 3,
        baseCompareMinCards: 3,
        groupCompareMinGroups: 2,
        groupMinCharacters: 2,
        twoCharactersCount: 2,
        twoCharsCount: 3,
        animation: {
            duration: 300,
            delay: 0.1
        },
        debounce: {
            delay: 300
        },
        zIndex: {
            base: 10
        },
        scroll: {
            behavior: 'smooth',
            block: 'nearest'
        }
    },
    events: {
        dataPath: 'data/config/events.json'
    },
    stages: {   
        nomination: 'nomination',
        battle: 'battle',
        final: 'final'
    },
    isStatic: true
};

export const MESSAGE_DURATION = CONFIG.alert.duration;

export const SELECTORS = {
    compareTypeWrapper: ".compare-type-wrapper",
    addCharacterBtn: ".add-character-btn",
    characterComparison: ".character-comparison",
    searchInput: ".search-input",
    searchResults: ".search-results",
    groupCharacters: ".group-characters",
    totalVotes: ".total-votes",
    checkbox: ".checkbox",
    characterAvatar: ".character-avatar",
    characterGroup: ".character-group",
    characterCard: ".character-card",
    cardSelect: ".character-card-select",
    groupMember: ".group-member",
    selectOptions: '.select-options',
    alertBox: '.alert-box',
    deleteBtn: '.delete-btn',
    totalVotesValue: '.total-votes-value',
    totalVotesValid: '.total-votes-valid',
    selectOption: '.option',
    selectTrigger: '.select-trigger',
    selectValue: '.select-value',
    groupName: '.group-name',
    characterGrid: '.character-grid',
    closeModalBtn: '.close-modal-btn',
    confirmBtn: '.confirm-btn',
    cancelBtn: '.cancel-btn',
    quickSelectBtn: '.quick-select-btn',
    quickSelectModal: '.quick-select-modal',
    closeQuickSelectBtn: '.close-quick-select-btn',
    quickSelectConfirmBtn: '.quick-select-btn.confirm',
    quickSelectCancelBtn: '.quick-select-btn.cancel',
    emptyTip: '.empty-tip',
    checkbox: '.checkbox',
    deleteGroupBtn: '.delete-group-btn',
    charInfoCard: '.char-info-card',
    comparisonResult: '.comparison-result',
    deleteGroupBtn: '.delete-group-btn',
    groupSearch: '.group-search',
    searchItem: '.search-item',
    quickSelectDropdown: '.quick-select-dropdown',
    quickSelectOptionsList: '.quick-select-options-list',
    quickSelectOption: '.quick-select-option',
    quickSelectTrigger: '.quick-select-trigger',
    groupComparison: '.group-comparison',
};

export const LAYOUT_CLASSES = {
    oneToManyLayout: 'one-to-many-layout',
    oneToMany: 'one-to-many',
    twoChars: 'two-chars',
    card: 'character-card',
    cardSelect: 'character-card-select',
    searchResults: 'search-results',
    basicInfo: 'basic-info',
    charInfoCard: 'char-info-card',
    searchInput: 'search-input',
    deleteBtn: 'delete-btn',
    infoContent: 'info-content',
    voteInfo: 'vote-info',
    voteLabel: 'vote-label',
    autoTag: 'auto-tag',
    voteCount: 'vote-count',
    voteTrend: 'vote-trend',
    leading: 'leading',
    behind: 'behind',
    voteRate: 'vote-rate',
    rateLabel: 'rate-label',
    rateValue: 'rate-value',
    rankInfo: 'rank-info',
    rankLabel: 'rank-label',
    rankValue: 'rank-value',
    baseCharacter: 'base-character',
    main: 'main',
    compareCharacters: 'compare-characters',
    charComparisonGrid: 'char-comparison-grid',
    tie: 'tie',
    alertBox: 'alert-box',
    alertInfo: 'info',
    characterSelectModal: 'characterSelectModal',
    eventSelect: 'eventSelect',
    compareType: 'compareType',
    addCharacterBtn: 'addCharacterBtn',
    groupAddCharacterBtn: 'add-character-btn',
    addGroupBtn: 'addGroupBtn',
    cvCompareBtn: 'cvCompareBtn',
    ipCompareBtn: 'ipCompareBtn',
    comparisonResult: 'comparisonResult',
    quickCompareSection: 'quickCompareSection',
    resetBtn: 'resetBtn',
    compareBtn: 'compareBtn',
    groupTemplate: 'groupTemplate',
    groupTotalTemplate: 'group-total-template',
    cvModal: 'cvModal',
    ipModal: 'ipModal',
    divider: 'divider',
    searchItem: 'search-item',
    groupMember: 'group-member',
    characterAvatar: 'character-avatar',
    groupCard: 'group-card',
    rankNumber: 'rank-number',
    groupTotalVotes: 'group-total-votes',
    groupAvgVotes: 'group-avg-votes',
    groupCharacterList: 'group-character-list',
    voteDiff: 'vote-diff',
    voteCount: 'vote-count',
    voteRate: 'vote-rate',
    diffLabel: 'diff-label',
    diffValue: 'diff-value',
    diffRate: 'diff-rate',
    characterInfo: 'character-info',
    characterName: 'character-name',
    characterVotes: 'character-votes',
    twoGroups: 'two-groups',
    groupBaseTotalTemplate: 'group-base-total-template',
    groupBaseAvgTemplate: 'group-base-avg-template',
    groupAvgTemplate: 'group-avg-template'
};

export const ANIMATION_CLASSES = {
    show: 'show',
    init: 'init',
    open: 'open',
    selected: 'selected',
    hidden: 'hidden',
    active: 'active',
    dragging: 'dragging',
    dragOver: 'drag-over',
    disabled: 'disabled',
    checked: 'checked',
    searching: 'searching',
    deleting: 'deleting',
    invalid: 'invalid',
    error: 'error'
};

export const COMPARISON_TYPES = {
    oneToOne: 'oneToOne',
    baseCompare: 'baseCompare',
    avgCompare: 'avgCompare',
    groupBaseTotalCompare: 'groupBaseTotalCompare',
    groupBaseAvgCompare: 'groupBaseAvgCompare',
    groupTotalCompare: 'groupTotalCompare',
    groupAvgCompare: 'groupAvgCompare',
    about: 'about'
};

export const MESSAGES = {
    selectEvent: {
        text: '请先选择赛事',
        type: 'error',
        duration: MESSAGE_DURATION.normal
    },
    selectCharacter: {
        text: '请选择要对比的角色',
        type: 'error',
        duration: MESSAGE_DURATION.normal
    },
    minCharacters: {
        text: '至少需要两个角色',
        type: 'error',
        duration: MESSAGE_DURATION.normal
    },
    noCharacterFound: {
        text: '没有找到匹配的角色',
        type: 'error',
        duration: MESSAGE_DURATION.normal
    },
    loadError: {
        text: '加载数据失败',
        type: 'error',
        duration: MESSAGE_DURATION.normal
    },
    duplicateCharacter: {
        text: '不能对比相同角色哦！',
        type: 'error',
        duration: MESSAGE_DURATION.normal
    },
    minAvgCharacters: {
        text: '多角色对比至少需要选择三个角色',
        type: 'error',
        duration: MESSAGE_DURATION.normal
    },
    noMoreCharacters: {
        text: '所有角色都已选择',
        type: 'info',
        duration: MESSAGE_DURATION.short
    },
    minOneToOneCharacters: {
        text: '一对一对比只能选择两个角色',
        type: 'error',
        duration: MESSAGE_DURATION.normal
    },
    exportStart: {
        text: '正在为您导出对比结果...',
        type: 'info',
        duration: MESSAGE_DURATION.short
    },
    exportSuccess: {
        text: '导出成功！',
        type: 'success',
        duration: MESSAGE_DURATION.short
    },
    exportError: {
        text: '导出图片失败，请重试',
        type: 'error',
        duration: MESSAGE_DURATION.long
    },
    minGroups: {
        text: '至少需要保留两个组',
        duration: MESSAGE_DURATION.long,
        type: 'error'
    },
    emptyGroup: {
        text: '每个组至少需要两个角色',
        duration: MESSAGE_DURATION.long,
        type: 'error'
    },
    moveCharacter: {
        text: '已将角色移动到其他组',
        duration: MESSAGE_DURATION.normal,
        type: 'success'
    },
    duplicateInGroup: {
        text: '同一个组内不能添加重复的角色',
        duration: MESSAGE_DURATION.long,
        type: 'error'
    },
    characterExists: {
        text: '该角色已在其他组中存在',
        duration: MESSAGE_DURATION.normal,
        type: 'error'
    },
    selectBaseCharacter: {
        text: '请先选择基准角色',
        duration: MESSAGE_DURATION.long,
        type: 'info'
    },
    allAutoCharacters: {
        text: '所有角色都是自动晋级，无法进行对比！',
        duration: MESSAGE_DURATION.long,
        type: 'error'
    },
    autoGroupExists: {
        getText: (groupNames) => `存在全部角色都是自动晋级的组：${groupNames.join('、')}，无法进行对比！`,
        duration: MESSAGE_DURATION.long,
        type: 'error'
    }
};

export const generateSelectors = {
    groupMemberByChar: (char) => 
        `${SELECTORS.groupMember} img[alt="${char.name}"][title="${char.name}@${char.ip}"]`
}; 