import csv
import json
from pathlib import Path

def csv_to_json():
    """将CSV数据转换为JSON格式"""
    # 读取CSV文件
    csv_file = Path('data/01-female-nomination.csv')
    json_file = Path('data/01-female-nomination.json')
    
    data = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        # 跳过表头
        next(f)
        csv_reader = csv.reader(f)
        
        for row in csv_reader:
            if not row or not row[2].strip():  # 跳过空行或角色名为空的行
                continue
                
            # 构建数据对象
            item = {
                "date": row[0].strip(),
                "event": row[1].strip(),
                "character": row[2].strip(),
                "anime": row[3].strip(),
                "cv": row[4].strip(),
                "votes": row[5].strip(),
                "avatar": row[8].strip() if len(row) > 8 else ""
            }
            
            # 处理票数
            if item["votes"] and item["votes"] != "-":
                try:
                    item["votes"] = int(item["votes"])
                except ValueError:
                    print(f"Warning: Invalid vote count for {item['character']}: {item['votes']}")
                    item["votes"] = 0
            
            data.append(item)
    
    # 按票数排序（自动晋级的排在前面）
    data.sort(key=lambda x: (
        0 if x["votes"] == "-" else 1,  # 自动晋级排在前面
        -999999 if x["votes"] == "-" else -int(x["votes"] if isinstance(x["votes"], int) else 0)
    ))
    
    # 写入JSON文件
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump({"data": data}, f, ensure_ascii=False, indent=4)
    
    print(f"已生成JSON文件：{json_file}")
    print(f"共处理 {len(data)} 条数据")

if __name__ == "__main__":
    csv_to_json() 