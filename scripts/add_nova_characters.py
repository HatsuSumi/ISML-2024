import json
import os

def get_project_root():
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data, file_path):
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def add_nova_characters():
    root_dir = get_project_root()
    rounds_file = os.path.join(root_dir, 'data', 'characters', 'roundsData.json')
    details_file = os.path.join(root_dir, 'data', 'characters', 'characters-details.json')
    output_file = os.path.join(root_dir, 'data', 'characters', 'roundsData_new.json')
    
    # 加载数据
    rounds_data = load_json(rounds_file)
    details_data = load_json(details_file)
    
    # 从 details 中提取新星组角色
    for char_id, char_info in details_data['characters'].items():
        if char_info['rounds'][0]['round'].startswith('新星组'):
            round_info = char_info['rounds'][0]['round']
            season = round_info.split('组')[1].split('赛')[0]
            gender = '女性' in round_info and 'female' or 'male'
            
            season_map = {'冬季': 'winter', '春季': 'spring', '夏季': 'summer', '秋季': 'autumn'}
            season_en = season_map[season]
            
            # 找到对应的赛季数组
            season_data = next((s for s in rounds_data['nova'][gender] if s['season'] == season_en), None)
            if season_data:
                # 添加角色数据
                char_data = {
                    'id': char_id,
                    'name': char_info['basic']['name'],
                    'ip': char_info['basic']['ip'],
                    'cv': char_info['basic']['cv'],
                    'avatar': char_info['basic']['avatar']
                }
                season_data['characters'].append(char_data)
                print(f'已添加{season}{gender}组角色: {char_info["basic"]["name"]}')
    
    # 保存到新文件
    save_json(rounds_data, output_file)
    print('新星组角色添加完成，已保存到 roundsData_new.json')

if __name__ == '__main__':
    try:
        add_nova_characters()
    except Exception as e:
        print(f'发生错误: {e}') 