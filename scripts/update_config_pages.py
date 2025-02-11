import json
import os

def get_project_root():
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_schedule():
    root_dir = get_project_root()
    schedule_file = os.path.join(root_dir, 'data', 'config', 'schedule.json')
    
    with open(schedule_file, 'r', encoding='utf-8') as f:
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
    root_dir = get_project_root()
    details_file = os.path.join(root_dir, 'data', 'characters', 'characters-details.json')
    
    # 读取原始数据
    with open(details_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 获取赛程信息
    schedule_rounds = load_schedule()
    
    # 遍历所有角色
    for char_id, char_data in data['characters'].items():
        # 只添加轮次名称
        new_rounds = [
            {"round": title}
            for title in schedule_rounds
        ]
        
        # 添加新的轮次
        char_data['rounds'].extend(new_rounds)
    
    # 保存修改后的数据
    with open(details_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

if __name__ == '__main__':
    add_rounds()