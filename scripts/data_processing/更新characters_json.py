import json
import pandas as pd
import os

# 获取脚本所在目录的绝对路径
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(script_dir))

# 读取文件
json_file = os.path.join(root_dir, 'data', 'characters', 'base', 'characters-data.json')
nova_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'summer', 'male', '08-nova-summer-male-nomination.csv')
base_file = os.path.join(root_dir, 'data', 'characters', 'base', 'characters-data.csv')

# 读取现有的JSON数据
with open(json_file, 'r', encoding='utf-8') as f:
    char_data = json.load(f)

# 读取新角色数据
nova_df = pd.read_csv(nova_file)

# 读取基础数据中的IP信息
base_df = pd.read_csv(base_file)
# 将年份和季度转换为整数
base_df['IP首映年份'] = base_df['IP首映年份'].fillna(-1).astype(int)
base_df['IP首映季度'] = base_df['IP首映季度'].fillna(-1).astype(int)
ip_info = dict(zip(base_df['IP'], zip(base_df['IP首映年份'], base_df['IP首映季度'])))

# 添加新角色并更新IP信息
new_characters = []
updated_ip_info = []

for _, row in nova_df.iterrows():
    char_key = f"{row['角色']}@{row['IP']}"
    ip_year, ip_season = ip_info.get(row['IP'], (-1, -1))
    # 将-1转换回None
    ip_year = None if ip_year == -1 else ip_year
    ip_season = None if ip_season == -1 else ip_season
    
    if char_key not in char_data:
        # 添加新角色
        char_data[char_key] = {
            "name": row['角色'],
            "ip": row['IP'],
            "name_en": row['角色（英）'],
            "cv": row['CV'],
            "avatar": "",  
            "ip_year": ip_year,
            "ip_season": ip_season
        }
        new_characters.append(char_key)
    else:
        # 更新现有角色的IP信息
        if char_data[char_key]["ip_year"] != ip_year or char_data[char_key]["ip_season"] != ip_season:
            char_data[char_key]["ip_year"] = ip_year
            char_data[char_key]["ip_season"] = ip_season
            updated_ip_info.append(char_key)

# 保存更新后的JSON
output_file = os.path.join(root_dir, 'data', 'characters', 'base', 'characters-data-updated.json')
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(char_data, f, ensure_ascii=False, indent=4)

# 打印结果
if new_characters:
    print(f"已添加 {len(new_characters)} 个新角色到JSON数据库")
    for char in new_characters:
        print(f"- {char}")
elif updated_ip_info:
    print(f"已更新 {len(updated_ip_info)} 个角色的IP信息")
    for char in updated_ip_info:
        print(f"- {char}")
else:
    print("没有需要更新的内容") 