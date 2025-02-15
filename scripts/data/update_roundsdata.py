import json
from datetime import datetime

def update_roundsdata():
    # 读取 ISML2024-characters.json
    with open('data/characters/stats/ISML2024-characters.json', 'r', encoding='utf-8') as f:
        characters_data = json.load(f)

    # 读取 roundsData.json
    with open('data/characters/roundsData.json', 'r', encoding='utf-8') as f:
        rounds_data = json.load(f)

    # 定义更新角色的通用函数
    def update_season_characters(group_list, season_characters):
        for group in group_list:
            if group["season"] == "autumn":
                group["characters"] = [
                    {
                        "id": char["id"],
                        "name": char["name"],
                        "ip": char["ip"],
                        "cv": char.get("cv", ""),
                        "avatar": char.get("avatar", "")
                    } 
                    for char in season_characters
                ]
        return group_list

    # 更新女性角色
    rounds_data["nova"]["female"] = update_season_characters(
        rounds_data["nova"]["female"], 
        characters_data["nova"]["autumn"]["female"]
    )

    # 更新男性角色
    rounds_data["nova"]["male"] = update_season_characters(
        rounds_data["nova"]["male"], 
        characters_data["nova"]["autumn"]["male"]
    )

    # 生成新文件名
    new_filename = f'data/characters/roundsData_autumn_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'

    # 写入新的 roundsData 文件
    with open(new_filename, 'w', encoding='utf-8') as f:
        json.dump(rounds_data, f, ensure_ascii=False, indent=4)

    print(f"Successfully generated new roundsData file: {new_filename}")
    print(f"Female characters added: {len(characters_data['nova']['autumn']['female'])}")
    print(f"Male characters added: {len(characters_data['nova']['autumn']['male'])}")

if __name__ == '__main__':
    update_roundsdata()
