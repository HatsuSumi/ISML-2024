import json
import os

def load_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def update_characters_details():
    # 文件路径
    characters_details_path = r'f:\ISML\ISML2024-github\data\characters\characters-details.json'
    characters_path = r'f:\ISML\ISML2024-github\data\characters\stats\ISML2024-characters.json'
    female_nomination_path = r'f:\ISML\ISML2024-github\data\nomination\nova\autumn\female\09-nova-autumn-female-nomination.json'
    male_nomination_path = r'f:\ISML\ISML2024-github\data\nomination\nova\autumn\male\10-nova-autumn-male-nomination.json'

    # 加载文件
    characters_details = load_json(characters_details_path)
    characters_data = load_json(characters_path)
    characters_female = characters_data['nova']['autumn']['female']
    characters_male = characters_data['nova']['autumn']['male']

    female_nominations = load_json(female_nomination_path)['data']
    male_nominations = load_json(male_nomination_path)['data']

    # 处理女性角色
    for character in female_nominations:
        name = character['name']
        character_info = next((c for c in characters_female if c['name'] == name), None)
        
        if character_info:
            new_id = character_info['id']
            
            character_details = {
                "basic": {
                    "name": name,
                    "ip": character_info.get('ip', ''),
                    "avatar": character_info.get('avatar', ''),
                    "cv": character_info.get('cv', ''),
                    "company": "",
                    "birthday": ""
                },
                "rounds": [
                    {
                        "round": "新星组秋季赛提名-女性组别",
                        "提名票": character.get('votes', 0),
                        "名次": character.get('rank', 0)
                    },
                    {"round": "预选赛第一轮"},
                    {"round": "预选赛第二轮"},
                    {"round": "预选赛第三轮"},
                    {"round": "预选赛第四轮"},
                    {"round": "预选赛第五轮"},
                    {"round": "预选赛第六轮"},
                    {"round": "第一阶段第一轮"},
                    {"round": "第一阶段第二轮"},
                    {"round": "第一阶段第三轮"},
                    {"round": "第一阶段第四轮"},
                    {"round": "第一阶段第五轮"},
                    {"round": "第一阶段第六轮"},
                    {"round": "第二阶段第一轮"},
                    {"round": "第二阶段第二轮"},
                    {"round": "第二阶段第三轮"},
                    {"round": "第二阶段第四轮"},
                    {"round": "第二阶段第五轮"},
                    {"round": "第二阶段第六轮"},
                    {"round": "第三阶段第一轮"},
                    {"round": "第三阶段第二轮"},
                    {"round": "第三阶段第三轮"},
                    {"round": "第三阶段第四轮"},
                    {"round": "第三阶段第五轮"},
                    {"round": "第三阶段第六轮"},
                    {"round": "第四阶段第一轮"},
                    {"round": "第四阶段第二轮"},
                    {"round": "第四阶段第三轮"},
                    {"round": "第四阶段第四轮"},
                    {"round": "第四阶段第五轮"},
                    {"round": "第四阶段第六轮"},
                    {"round": "淘汰赛第一轮"},
                    {"round": "淘汰赛第二轮"},
                    {"round": "淘汰赛第三轮"},
                    {"round": "淘汰赛第四轮"},
                    {"round": "淘汰赛第五轮"},
                    {"round": "淘汰赛第六轮"},
                    {"round": "淘汰赛第七轮"},
                    {"round": "淘汰赛第八轮"},
                    {"round": "淘汰赛第九轮"}
                ]
            }
            
            characters_details["characters"][new_id] = character_details

    # 处理男性角色（逻辑类似）
    for character in male_nominations:
        name = character['name']
        character_info = next((c for c in characters_male if c['name'] == name), None)
        
        if character_info:
            new_id = character_info['id']
            
            character_details = {
                "basic": {
                    "name": name,
                    "ip": character_info.get('ip', ''),
                    "avatar": character_info.get('avatar', ''),
                    "cv": character_info.get('cv', ''),
                    "company": "",
                    "birthday": ""
                },
                "rounds": [
                    {
                        "round": "新星组秋季赛提名-男性组别",
                        "提名票": character.get('votes', 0),
                        "名次": character.get('rank', 0)
                    },
                    {"round": "预选赛第一轮"},
                    {"round": "预选赛第二轮"},
                    {"round": "预选赛第三轮"},
                    {"round": "预选赛第四轮"},
                    {"round": "预选赛第五轮"},
                    {"round": "预选赛第六轮"},
                    {"round": "第一阶段第一轮"},
                    {"round": "第一阶段第二轮"},
                    {"round": "第一阶段第三轮"},
                    {"round": "第一阶段第四轮"},
                    {"round": "第一阶段第五轮"},
                    {"round": "第一阶段第六轮"},
                    {"round": "第二阶段第一轮"},
                    {"round": "第二阶段第二轮"},
                    {"round": "第二阶段第三轮"},
                    {"round": "第二阶段第四轮"},
                    {"round": "第二阶段第五轮"},
                    {"round": "第二阶段第六轮"},
                    {"round": "第三阶段第一轮"},
                    {"round": "第三阶段第二轮"},
                    {"round": "第三阶段第三轮"},
                    {"round": "第三阶段第四轮"},
                    {"round": "第三阶段第五轮"},
                    {"round": "第三阶段第六轮"},
                    {"round": "第四阶段第一轮"},
                    {"round": "第四阶段第二轮"},
                    {"round": "第四阶段第三轮"},
                    {"round": "第四阶段第四轮"},
                    {"round": "第四阶段第五轮"},
                    {"round": "第四阶段第六轮"},
                    {"round": "淘汰赛第一轮"},
                    {"round": "淘汰赛第二轮"},
                    {"round": "淘汰赛第三轮"},
                    {"round": "淘汰赛第四轮"},
                    {"round": "淘汰赛第五轮"},
                    {"round": "淘汰赛第六轮"},
                    {"round": "淘汰赛第七轮"},
                    {"round": "淘汰赛第八轮"},
                    {"round": "淘汰赛第九轮"}
                ]
            }
            
            characters_details["characters"][new_id] = character_details

    # 保存更新后的文件
    characters_details_path = r'f:\ISML\ISML2024-github\data\characters\characters-details-autumn.json'
    with open(characters_details_path, 'w', encoding='utf-8') as f:
        json.dump(characters_details, f, ensure_ascii=False, indent=4)

    print(f"角色详细信息已保存到 {characters_details_path}")

if __name__ == "__main__":
    update_characters_details()
