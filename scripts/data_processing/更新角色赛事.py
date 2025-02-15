import json
import os
from datetime import datetime

# 获取脚本所在目录的绝对路径
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(script_dir))

def update_character_matches():
    # 读取现有的matches数据
    matches_file = os.path.join(root_dir, 'data', 'matches', 'character-matches.json')
    with open(matches_file, 'r', encoding='utf-8') as f:
        matches_data = json.load(f)
    
    # 读取角色数据
    characters_file = os.path.join(root_dir, 'data', 'characters', 'stats', 'ISML2024-characters.json')
    with open(characters_file, 'r', encoding='utf-8') as f:
        characters_data = json.load(f)
    
    # 更新秋季赛数据
    for gender in ['female', 'male']:
        for char in characters_data['nova']['autumn'][gender]:
            # 查找是否参加过之前的赛季
            previous_matches = []
            for season in ['winter', 'spring', 'summer']:
                for prev_char in characters_data['nova'][season][gender]:
                    if char['name'] == prev_char['name'] and char['ip'] == prev_char['ip']:
                        if prev_char['id'] in matches_data['matches']:
                            previous_matches = matches_data['matches'][prev_char['id']]['matches']
                            break
            
            matches_data['matches'][char['id']] = {
                'name': char['name'],
                'ip': char['ip'],
                'avatar': char['avatar'],
                'matches': previous_matches + [
                    {
                        'title': '新星组秋季赛提名',
                        'result': '晋级' if '已晋级' in char['status'] else '未晋级'
                    }
                ]
            }
    
    # 生成新文件名
    output_file = os.path.join(root_dir, 'data', 'matches', f'character-matches_{datetime.now().strftime("%Y%m%d")}.json')
    
    # 保存为新的JSON文件
    with open(output_file, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(matches_data, f, ensure_ascii=False, indent=4)
    
    print(f"已生成新的比赛记录文件: {output_file}")

if __name__ == "__main__":
    update_character_matches()