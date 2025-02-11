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

def rename_fields(obj):
    """递归替换字段名"""
    if isinstance(obj, dict):
        new_dict = {}
        for key, value in obj.items():
            # 替换字段名
            if key == 'series':
                new_key = 'ip'
            elif key == 'image':
                new_key = 'avatar'
            else:
                new_key = key
            # 递归处理值
            new_dict[new_key] = rename_fields(value)
        return new_dict
    elif isinstance(obj, list):
        return [rename_fields(item) for item in obj]
    else:
        return obj

def process_file():
    # 基础路径
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # 文件路径
    file_path = os.path.join(base_path, 'data', 'characters', 'tourament', 'ISML2024-characters.json')
    
    if os.path.exists(file_path):
        print(f"Processing ISML2024-characters.json...")
        data = load_json(file_path)
        if data:
            # 替换字段名
            new_data = rename_fields(data)
            # 保存文件
            save_json(new_data, file_path)
            print("Completed!")
        else:
            print("Failed to load file")
    else:
        print("File not found")

if __name__ == "__main__":
    process_file() 