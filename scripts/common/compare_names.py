import json
import pandas as pd

def compare_character_names():
    """比较JSON和Excel中的角色名差异"""
    try:
        # 读取文件
        df = pd.read_excel('data/common/characters_data.xlsx')
        with open('data/common/ISML2024_characters.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 获取所有差异
        differences = []
        
        for char in data['stellar']['male']:
            # 在Excel中查找对应角色
            char_matches = df[df['作品'] == char['series']]
            if not char_matches.empty:
                # 检查是否有相似但不完全相同的名字
                for _, row in char_matches.iterrows():
                    if row['角色'].strip() != char['name'].strip():
                        # 计算字符重合度
                        common_chars = set(row['角色']) & set(char['name'])
                        if len(common_chars) >= min(len(row['角色']), len(char['name'])) * 0.5:
                            differences.append({
                                'json_name': char['name'],
                                'excel_name': row['角色'],
                                'series': char['series']
                            })
        
        # 输出差异
        print("\n角色名称差异:")
        print("-" * 50)
        for diff in differences:
            print(f"作品: {diff['series']}")
            print(f"JSON中的名字: {diff['json_name']}")
            print(f"Excel中的名字: {diff['excel_name']}")
            print("-" * 50)
        
        print(f"\n总计发现 {len(differences)} 个差异")
        
    except Exception as e:
        print(f"❌ 比较文件时出错: {str(e)}")

if __name__ == '__main__':
    print("正在比较角色名称...")
    compare_character_names() 