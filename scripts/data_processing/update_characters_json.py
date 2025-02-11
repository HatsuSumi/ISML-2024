import json
import os

# 获取脚本所在目录的绝对路径
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(script_dir))

def update_characters_json():
    # 读取现有的JSON文件（包含恒星组数据）
    json_file = os.path.join(root_dir, 'data', 'characters', 'stats', 'ISML2024-characters.json')
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 确保nova结构存在
    if 'nova' not in data:
        data['nova'] = {
            'winter': {'female': [], 'male': []},
            'spring': {'female': [], 'male': []},
            'summer': {'female': [], 'male': []},
            'autumn': {'female': [], 'male': []}
        }
    
    # 读取冬季赛女性组数据
    winter_female_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'winter', 'female', '03-nova-winter-female-nomination.json')
    with open(winter_female_file, 'r', encoding='utf-8') as f:
        winter_female_data = json.load(f)
    
    # 清空现有的冬季赛数据
    data['nova']['winter']['female'] = []
    
    advance_count = 1
    eliminate_count = 1
    for char in winter_female_data['data']:
        char_id = f"NFW{advance_count:03d}" if char['is_advanced'] else f"ENFW{eliminate_count:03d}"
        if char['is_advanced']:
            advance_count += 1
        else:
            eliminate_count += 1
        data['nova']['winter']['female'].append({
            'id': char_id,
            'name': char['name'],
            'ip': char['ip'],
            'cv': char['cv'],
            'avatar': char['avatar'],
            'status': '已晋级至冬季赛预选赛' if char['is_advanced'] else '未晋级'
        })
    
    # 读取冬季赛男性组数据
    winter_male_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'winter', 'male', '04-nova-winter-male-nomination.json')
    with open(winter_male_file, 'r', encoding='utf-8') as f:
        winter_male_data = json.load(f)
    
    # 清空现有的冬季赛数据
    data['nova']['winter']['male'] = []
    
    advance_count = 1
    eliminate_count = 1
    for char in winter_male_data['data']:
        char_id = f"NMW{advance_count:03d}" if char['is_advanced'] else f"ENMW{eliminate_count:03d}"
        if char['is_advanced']:
            advance_count += 1
        else:
            eliminate_count += 1
        data['nova']['winter']['male'].append({
            'id': char_id,
            'name': char['name'],
            'ip': char['ip'],
            'cv': char['cv'],
            'avatar': char['avatar'],
            'status': '已晋级至冬季赛预选赛' if char['is_advanced'] else '未晋级'
        })
    
    # 读取春季赛女性组数据
    spring_female_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'spring', 'female', '05-nova-spring-female-nomination.json')
    with open(spring_female_file, 'r', encoding='utf-8') as f:
        spring_female_data = json.load(f)
    
    # 清空现有的春季赛数据
    data['nova']['spring']['female'] = []
    
    advance_count = 1
    eliminate_count = 1
    for char in spring_female_data['data']:
        char_id = f"NFSP{advance_count:03d}" if char['is_advanced'] else f"ENFSP{eliminate_count:03d}"
        if char['is_advanced']:
            advance_count += 1
        else:
            eliminate_count += 1
        data['nova']['spring']['female'].append({
            'id': char_id,
            'name': char['name'],
            'ip': char['ip'],
            'cv': char['cv'],
            'avatar': char['avatar'],
            'status': '已晋级至春季赛预选赛' if char['is_advanced'] else '未晋级'
        })
    
    # 读取春季赛男性组数据
    spring_male_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'spring', 'male', '06-nova-spring-male-nomination.json')
    with open(spring_male_file, 'r', encoding='utf-8') as f:
        spring_male_data = json.load(f)
    
    # 清空现有的春季赛数据
    data['nova']['spring']['male'] = []
    
    advance_count = 1
    eliminate_count = 1
    for char in spring_male_data['data']:
        char_id = f"NMSP{advance_count:03d}" if char['is_advanced'] else f"ENMSP{eliminate_count:03d}"
        if char['is_advanced']:
            advance_count += 1
        else:
            eliminate_count += 1
        data['nova']['spring']['male'].append({
            'id': char_id,
            'name': char['name'],
            'ip': char['ip'],
            'cv': char['cv'],
            'avatar': char['avatar'],
            'status': '已晋级至春季赛预选赛' if char['is_advanced'] else '未晋级'
        })
    
    # 保存为新的JSON文件
    output_file = os.path.join(root_dir, 'data', 'characters', 'stats', 'ISML2024-characters-updated.json')
    with open(output_file, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    
    print(f"角色数据已更新并保存到: {output_file}")

if __name__ == "__main__":
    update_characters_json() 