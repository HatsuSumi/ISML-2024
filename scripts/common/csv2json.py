import pandas as pd
import json

def csv_to_json(csv_file, json_file):
    try:
        # 读取CSV文件
        df = pd.read_csv(csv_file)
        
        # 创建JSON结构
        json_data = {
            "date": "01.28-02.03",
            "event": "新星组秋季赛提名-男性组别",
            "data": []
        }
        
        for _, row in df.iterrows():
            item = {
                "name": row["角色"],
                "ip": row["IP"],
                "cv": row["CV"],
                "votes": int(row["得票数"]),  
                "avatar": row["头像"] if pd.notna(row["头像"]) else "",
                "is_advanced": bool(row["是否晋级"]),  
                "rank": int(row["排名"])
            }
            json_data["data"].append(item)
        
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, ensure_ascii=False, indent=2)
            
        print(f"已将 {csv_file} 转换为 {json_file}")
        
    except Exception as e:
        print(f"转换失败: {e}")

def main():
    csv_file = 'data/nomination/nova/autumn/male/10-nova-autumn-male-nomination.csv'
    json_file = 'data/nomination/nova/autumn/male/10-nova-autumn-male-nomination.json'
    csv_to_json(csv_file, json_file)

if __name__ == '__main__':
    main() 