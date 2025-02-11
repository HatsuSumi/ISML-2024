import pandas as pd
import os
import sys
import json

# 添加项目根目录到 Python 路径
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

def update_characters_json():
    # 获取项目根目录
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # 读取Excel文件
    excel_path = os.path.join(project_root, 'data', 'characters', 'stats', 'ISML2024-characters.xlsx')
    df = pd.read_excel(excel_path)
    
    # 创建JSON结构
    characters_json = {
        "stellar": {
            "female": [],
            "male": []
        },
        "nova": {
            "winter": {
                "female": [],
                "male": []
            },
            "spring": {
                "female": [],
                "male": []
            },
            "summer": {
                "female": [],
                "male": []
            },
            "autumn": {
                "female": [],
                "male": []
            }
        }
    }
    
    # 处理每个角色
    for _, row in df.iterrows():
        # 处理头像字段
        avatar = row['头像']
        if pd.isna(avatar):  # 只处理NaN的情况
            avatar = ""
        elif not isinstance(avatar, str):  # 如果不是字符串才转换
            avatar = str(avatar)
            
        character = {
            "id": row['ID'],
            "name": row['角色'],
            "ip": row['IP'],
            "avatar": avatar,
            "status": row['状态'],
            "cv": row['CV']
        }
        
        # 根据分组和性别添加到对应列表
        if row['分组'] == 'stellar':
            if row['性别'] == 'female':
                characters_json['stellar']['female'].append(character)
            else:
                characters_json['stellar']['male'].append(character)
        else:  # nova组
            season = row['季节']
            if season in ['winter', 'spring', 'summer', 'autumn']:
                if row['性别'] == 'female':
                    characters_json['nova'][season]['female'].append(character)
                else:
                    characters_json['nova'][season]['male'].append(character)
    
    # 保存JSON文件
    output_path = os.path.join(project_root, 'data', 'characters', 'stats', 'ISML2024-characters_update.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(characters_json, f, ensure_ascii=False, indent=4)
    
    print(f"已保存JSON文件到：{output_path}")
    print(f"恒星组女性角色数：{len(characters_json['stellar']['female'])}")
    print(f"恒星组男性角色数：{len(characters_json['stellar']['male'])}")

if __name__ == "__main__":
    update_characters_json() 