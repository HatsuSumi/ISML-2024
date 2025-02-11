import json
import os
import sys

def get_project_root():
    # 获取脚本所在目录的上级目录（项目根目录）
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data, file_path):
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def clear_characters():
    file_path = os.path.join(get_project_root(), 'data', 'characters', 'characterData.json')
    data = load_json(file_path)
    
    # 保留config，清空characters
    data['characters'] = {}
    
    save_json(data, file_path)
    print("已清空所有角色数据")

def convert_character(char_data, group_type, gender, season=None):
    # 构建轮次名称
    if group_type == "stellar":
        round_name = f"恒星组提名-{gender}组别"
        rounds = [
            {
                "round": round_name,
                "排名": "",
                "上届世萌战绩": ""
            }
        ]
    else:  # nova
        round_name = f"新星组{season}赛提名-{gender}组别"
        rounds = [
            {
                "round": round_name,
                "排名": ""
            }
        ]
    
    return {
        "basic": {
            "name": char_data["name"],
            "ip": char_data["ip"],
            "avatar": char_data["avatar"],
            "cv": char_data["cv"]
        },
        "rounds": rounds
    }

def import_from_json():
    root_dir = get_project_root()
    source_file = os.path.join(root_dir, 'data', 'characters', 'stats', 'ISML2024-characters.json')
    target_file = os.path.join(root_dir, 'data', 'characters', 'characterData.json')
    
    # 加载数据
    source_data = load_json(source_file)
    target_data = load_json(target_file)
    
    # 导入角色数据
    imported_count = 0
    
    # 导入恒星女子组
    for char in source_data['stellar']['female']:
        char_id = char["id"]
        if char_id not in target_data['characters']:
            target_data['characters'][char_id] = convert_character(char, "stellar", "女性")
            imported_count += 1
            print(f"已导入恒星女子组: {char['name']} ({char_id})")
    
    # 导入恒星男子组
    for char in source_data['stellar']['male']:
        char_id = char["id"]
        if char_id not in target_data['characters']:
            target_data['characters'][char_id] = convert_character(char, "stellar", "男性")
            imported_count += 1
            print(f"已导入恒星男子组: {char['name']} ({char_id})")
    
    # 导入新星组
    if 'nova' in source_data:
        seasons = ['winter', 'spring', 'summer', 'autumn']
        season_names = {
            'winter': '冬季',
            'spring': '春季',
            'summer': '夏季',
            'autumn': '秋季'
        }
        for season in seasons:
            if season in source_data['nova']:
                # 导入女子组
                for char in source_data['nova'][season]['female']:
                    char_id = char["id"]
                    if char_id not in target_data['characters']:
                        target_data['characters'][char_id] = convert_character(char, "nova", "女性", season_names[season])
                        imported_count += 1
                        print(f"已导入新星{season_names[season]}赛女子组: {char['name']} ({char_id})")
                
                # 导入男子组
                for char in source_data['nova'][season]['male']:
                    char_id = char["id"]
                    if char_id not in target_data['characters']:
                        target_data['characters'][char_id] = convert_character(char, "nova", "男性", season_names[season])
                        imported_count += 1
                        print(f"已导入新星{season_names[season]}赛男子组: {char['name']} ({char_id})")
    
    # 保存更新后的数据
    save_json(target_data, target_file)
    print(f"\n成功导入 {imported_count} 个角色")

if __name__ == "__main__":
    try:
        clear_characters()
        import_from_json()
    except Exception as e:
        print(f"发生错误: {e}") 