import pandas as pd
import json
from datetime import datetime

def update_json():
    # 读取现有的JSON文件
    json_path = 'data/characters/stats/ISML2024-characters.json'
    with open(json_path, 'r', encoding='utf-8') as f:
        json_data = json.load(f)
    
    # 读取CSV文件
    csv_path = 'data/characters/stats/ISML2024-characters.csv'
    df = pd.read_csv(csv_path)
    
    # 更新夏季赛数据
    for _, row in df.iterrows():
        if row['季节'].lower() == 'summer':
            character = {
                "id": row['ID'],
                "name": row['角色'],
                "ip": row['IP'],
                "cv": row['CV'],
                "avatar": row['头像'] if pd.notna(row['头像']) else "",
                "status": row['状态']
            }
            
            # 根据ID前缀分类
            if row['ID'].startswith(('NFSU', 'ENFSU')):
                json_data["nova"]["summer"]["female"].append(character)
            elif row['ID'].startswith(('NMSU', 'ENMSU')):
                json_data["nova"]["summer"]["male"].append(character)
    
    # 生成新文件名
    new_json_path = f'data/characters/stats/ISML2024-characters_{datetime.now().strftime("%Y%m%d")}.json'
    
    # 保存为新的JSON文件
    with open(new_json_path, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, ensure_ascii=False, indent=4)
    
    print(f'已生成新的JSON文件: {new_json_path}')

if __name__ == '__main__':
    update_json() 