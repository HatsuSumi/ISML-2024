import pandas as pd

def update_missing_english():
    """更新characters_data.xlsx中缺少的英文名"""
    try:
        # 读取Excel文件
        df = pd.read_excel('data/common/characters_data.xlsx')
        
        # 读取txt文件并创建映射
        ch_names = []
        en_names = []
        
        with open('data/ch.txt', 'r', encoding='utf-8') as f:
            ch_lines = [line.strip().split('\t') for line in f if line.strip()]
            # 跳过标题行
            for line in ch_lines[1:]:
                ch_names.append({
                    'name': line[1],
                    'series': line[2]
                })
        
        with open('data/en.txt', 'r', encoding='utf-8') as f:
            en_lines = [line.strip().split('\t') for line in f if line.strip()]
            # 跳过标题行
            for line in en_lines[1:]:
                en_names.append({
                    'name': line[1],
                    'series': line[2]
                })
        
        # 创建中英文映射字典
        name_map = {}
        for ch, en in zip(ch_names, en_names):
            name_map[(ch['name'], ch['series'])] = en['name']
        
        # 记录更新统计
        updated = 0
        not_found = []
        
        # 更新英文名
        for idx, row in df.iterrows():
            key = (row['角色'], row['作品'])
            if key in name_map:
                df.at[idx, '角色（英）'] = name_map[key]
                updated += 1
                print(f"更新英文名: {row['角色']} -> {name_map[key]}")
        
        # 保存更新后的文件
        df.to_excel('data/characters_data_with_en.xlsx', index=False)
        
        # 输出统计信息
        print(f"\n更新统计:")
        print(f"映射表角色数量: {len(name_map)}")
        print(f"更新数量: {updated}")
        
        print("\n✅ 已保存更新后的文件至: data/characters_data_with_en.xlsx")
        
    except Exception as e:
        print(f"❌ 更新英文名时出错: {str(e)}")

if __name__ == '__main__':
    print("正在更新缺少的英文名...")
    update_missing_english() 