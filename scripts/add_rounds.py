import json

def load_schedule():
    with open('../data/config/schedule.json', 'r', encoding='utf-8') as f:
        schedule = json.load(f)
    
    # 只收集轮次标题
    rounds = []
    for phase_key, phase in schedule['phases'].items():
        # 跳过提名阶段
        if phase_key == 'mainNomination':
            continue
        for match in phase['matches']:
            rounds.append(match['title'])
    return rounds

def add_rounds():
    # 读取原始数据
    with open('../data/characters/characters-details.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 获取赛程信息
    schedule_rounds = load_schedule()
    
    # 遍历所有角色
    for char_id, char_data in data['characters'].items():
        current_round = char_data['rounds'][0]['round']
        
        # 判断组别和性别
        is_stellar = '恒星组' in current_round
        is_female = '女性' in current_round
        group_prefix = '恒星组' if is_stellar else '新星组'
        gender = '女性组别' if is_female else '男性组别'
        
        # 只添加轮次名称
        new_rounds = [
            {"round": f"{group_prefix}{title}-{gender}"}
            for title in schedule_rounds
        ]
        
        # 添加新的轮次
        char_data['rounds'].extend(new_rounds)
    
    # 保存修改后的数据
    with open('../data/characters/characters-details.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

if __name__ == '__main__':
    add_rounds()