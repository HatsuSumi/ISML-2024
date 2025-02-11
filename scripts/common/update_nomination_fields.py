import json
import os

def load_json(file_path):
    """加载JSON文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return None

def save_json(data, file_path):
    """保存JSON文件"""
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"Successfully saved to {file_path}")
    except Exception as e:
        print(f"Error saving {file_path}: {e}")

def update_fields(data):
    """更新字段名"""
    if isinstance(data, dict):
        if 'data' in data:
            # 处理数据数组
            data['data'] = [update_item(item) for item in data['data']]
        return data
    return data

def update_item(item):
    """更新单个项目的字段名"""
    new_item = {}
    for key, value in item.items():
        if key == 'character':
            new_item['name'] = value
        elif key == 'anime':
            new_item['ip'] = value
        else:
            new_item[key] = value
    return new_item

def process_file():
    # 基础路径
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # 文件路径
    file_path = os.path.join(base_path, 'data', 'nomination', 'stellar', 'female', '01-female-nomination.json')
    
    if os.path.exists(file_path):
        print("Processing 01-female-nomination.json...")
        data = load_json(file_path)
        if data:
            # 更新字段名
            new_data = update_fields(data)
            # 保存文件
            save_json(new_data, file_path)
            print("Completed!")
        else:
            print("Failed to load file")
    else:
        print("File not found")

if __name__ == "__main__":
    process_file() 