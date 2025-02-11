import pandas as pd
import json
import os

def convert_male_nomination():
    # 获取项目根目录
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # 输入输出文件路径
    excel_path = os.path.join(project_root, 'data', 'nomination', 'stellar', 'female', '01-female-nomination.xlsx')
    json_path = os.path.join(project_root, 'data', 'nomination', 'stellar', 'female', '01-female-nomination.json')
    
    print(f"正在读取文件：\n{excel_path}")
    
    try:
        # 读取Excel
        df = pd.read_excel(excel_path)
        
        # 转换为JSON格式
        json_data = {
            "date": "12.31-01.07",  # 与女性组保持一致
            "event": "恒星组提名-女性组别",
            "data": []
        }
        
        # 处理每一行数据
        for _, row in df.iterrows():
            character = {
                "name": row["角色"],
                "ip": row["IP"],
                "cv": row["CV"] if pd.notna(row["CV"]) else "",
                "votes": str(row["得票数"]),
                "avatar": row["头像"] if pd.notna(row["头像"]) else ""
            }
            json_data["data"].append(character)
        
        # 保存JSON文件
        os.makedirs(os.path.dirname(json_path), exist_ok=True)
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, ensure_ascii=False, indent=4)
        
        print(f"\n已保存到：{json_path}")
        
    except FileNotFoundError as e:
        print(f"错误：找不到文件\n{str(e)}")
    except Exception as e:
        print(f"错误：{str(e)}")

if __name__ == "__main__":
    convert_male_nomination() 