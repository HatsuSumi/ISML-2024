import pandas as pd
import json
import os

# 获取脚本所在目录的绝对路径
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(script_dir))

def csv_to_json():
    try:
        # 读取CSV文件
        csv_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'spring', 'female', '05-nova-spring-female-nomination.csv')
        df = pd.read_csv(csv_file)
        
        # 创建JSON结构
        json_data = {
            "date": "01.14-01.21",
            "event": "新星组春季赛提名-女性组别",
            "data": []
        }
        
        # 遍历每一行数据
        for _, row in df.iterrows():
            item = {
                "name": row["角色"],
                "ip": row["IP"],
                "cv": row["CV"] if pd.notna(row["CV"]) else "",
                "votes": int(row["得票数"]) if pd.notna(row["得票数"]) else 0,
                "avatar": row["头像"] if pd.notna(row["头像"]) else "",
                "is_advanced": row["是否晋级"],
                "rank": int(row["排名"]) if pd.notna(row["排名"]) else 0
            }
            json_data["data"].append(item)
        
        # 保存为JSON文件
        json_file = os.path.join(root_dir, 'data', 'nomination', 'nova', 'spring', 'female', '05-nova-spring-female-nomination.json')
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, ensure_ascii=False, indent=2)
            
        print(f"已将 {csv_file} 转换为 {json_file}")
        
    except Exception as e:
        print(f"转换失败: {e}")

if __name__ == '__main__':
    csv_to_json() 