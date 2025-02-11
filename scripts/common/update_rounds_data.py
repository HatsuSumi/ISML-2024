import json
import os
import sys

# 添加项目根目录到 Python 路径
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

def update_rounds_data():
    # 获取项目根目录
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # 读取角色数据
    characters_path = os.path.join(project_root, 'data', 'characters', 'stats', 'ISML2024-characters.json')
    with open(characters_path, 'r', encoding='utf-8') as f:
        characters_data = json.load(f)
    
    # 创建基础数据结构
    rounds_data = {
        "stellar": {
            "female": [],
            "male": []
        },
        "nova": {
            "female": [
                {"season": "winter", "characters": []},
                {"season": "spring", "characters": []},
                {"season": "summer", "characters": []},
                {"season": "autumn", "characters": []}
            ],
            "male": [
                {"season": "winter", "characters": []},
                {"season": "spring", "characters": []},
                {"season": "summer", "characters": []},
                {"season": "autumn", "characters": []}
            ]
        },
        "ensemble": {
            "characters": []
        }
    }
    
    # 添加所有角色
    for gender in ['female', 'male']:
        characters = [
            {
                "id": char['id'],
                "name": char['name'],
                "ip": char['ip'],
                "cv": char['cv'],
                "avatar": char['avatar']
            }
            for char in characters_data['stellar'][gender]
        ]
        
        # 按状态分组
        advanced = [char for char in characters if char['id'].startswith('S')]  # SF/SM开头的是已晋级角色
        eliminated = [char for char in characters if char['id'].startswith('ES')]  # ESF/ESM开头的是未晋级角色
        
        # 为已晋级角色创建分组
        rank_groups = []
        for i in range(0, len(advanced), 8):
            group = advanced[i:i+8]
            # 如果是最后一组且不足8个，用未晋级角色补充
            if len(group) < 8 and eliminated:
                needed = 8 - len(group)
                group.extend(eliminated[:needed])
                eliminated = eliminated[needed:]  # 更新剩余的未晋级角色
            
            rank_label = f"{(i//8 + 1)*8}强"
            rank_groups.append({
                "rankLabel": rank_label,
                "characters": group
            })
        
        # 如果还有未晋级角色，每8个一组添加到最后
        total_chars = ((len(advanced) - 1) // 8 + 1) * 8  # 向上取整到8的倍数
        while eliminated:
            group = eliminated[:8]  # 取前8个
            eliminated = eliminated[8:]  # 更新剩余的未晋级角色
            total_chars += 8  # 每组加8，保持8的倍数
            
            rank_groups.append({
                "rankLabel": f"{total_chars}强",
                "characters": group
            })
        
        rounds_data['stellar'][gender] = rank_groups
    
    # 保存更新后的文件
    output_path = os.path.join(project_root, 'data', 'characters', 'roundsData_update.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(rounds_data, f, ensure_ascii=False, indent=4)
    
    print(f"已保存更新后的文件到：{output_path}")
    print(f"未晋级女性角色数：{len(rounds_data['stellar']['female'][0]['characters'])}")
    print(f"未晋级男性角色数：{len(rounds_data['stellar']['male'][0]['characters'])}")

if __name__ == "__main__":
    update_rounds_data() 