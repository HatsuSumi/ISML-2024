import json
import shutil
from datetime import datetime

def add_groups_link(input_file, output_file):
    # 读取 JSON 文件
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 添加预选赛阶段
    if 'stages' in data['config']:
        data['config']['stages']['预选赛阶段'] = {
            "恒星组": {
                "女性组别": {
                    "groups": "preliminary.stellar.female",
                    "visualization": "pages/visualization/11-stellar-female-preliminary.html",
                    "table": "pages/tables/11-stellar-female-preliminary-table.html",
                    "rules": ""
                },
                "男性组别": {
                    "groups": "preliminary.stellar.male",
                    "visualization": "pages/visualization/12-stellar-male-preliminary.html",
                    "table": "pages/tables/12-stellar-male-preliminary-table.html",
                    "rules": ""
                }
            }
        }
    
    # 写入更新后的 JSON 文件
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

# 执行脚本
input_file = r'f:\ISML\ISML2024-github\data\characters\characters-details.json'
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
output_file = f'f:\ISML\ISML2024-github\data\characters\characters-details_{timestamp}.json'

add_groups_link(input_file, output_file)

print(f"Groups links added successfully! New file: {output_file}")
