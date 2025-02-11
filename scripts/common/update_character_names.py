import pandas as pd

def get_name_mapping():
    """从ch.txt和en.txt获取角色名映射"""
    try:
        # 读取中英文文件
        with open('data/ch.txt', 'r', encoding='utf-8') as f:
            ch_lines = [line.strip().split('\t') for line in f if line.strip()]
            # 跳过标题行
            ch_names = [line[1] for line in ch_lines[1:]]
        
        with open('data/en.txt', 'r', encoding='utf-8') as f:
            en_lines = [line.strip().split('\t') for line in f if line.strip()]
            # 跳过标题行
            en_names = [line[1] for line in en_lines[1:]]
        
        # 创建映射字典
        name_map = {}
        if len(ch_names) == len(en_names):
            name_map = dict(zip(ch_names, en_names))
            print(f"读取到 {len(name_map)} 对中英文名称")
        else:
            raise Exception("中英文名称数量不匹配")
            
        return name_map
        
    except Exception as e:
        print(f"❌ 读取名称映射时出错: {str(e)}")
        return {}

def update_english_names():
    """更新角色的英文名"""
    try:
        # 获取名称映射
        name_map = get_name_mapping()
        if not name_map:
            return
            
        # 读取Excel文件
        isml_df = pd.read_excel('data/common/ISML2024_characters.xlsx')
        cv_df = pd.read_excel('data/common/characters_data.xlsx')
        
        # 记录更新统计
        updated = 0
        not_found = []
        
        # 更新英文名
        for idx, row in cv_df.iterrows():
            # 只更新映射表中有的角色且没有英文名的角色
            if row['角色'] in name_map and (pd.isna(row['角色（英）']) or row['角色（英）'] == ''):
                if row['角色'] in name_map:
                    cv_df.at[idx, '角色（英）'] = name_map[row['角色']]
                    updated += 1
                    print(f"更新英文名: {row['角色']} -> {name_map[row['角色']]}")
                else:
                    not_found.append(row['角色'])
        
        # 保存更新后的文件
        cv_df.to_excel('data/characters_data_with_en.xlsx', index=False)
        
        # 输出统计信息
        print(f"\n更新统计:")
        print(f"映射表角色数量: {len(name_map)}")
        print(f"更新数量: {updated}")
        
        if not_found:
            print("\n未找到英文名的新参赛者:")
            for name in not_found:
                print(name)
        
        print("\n✅ 已保存更新后的文件至: data/characters_data_with_en.xlsx")
        
    except Exception as e:
        print(f"❌ 更新英文名时出错: {str(e)}")

if __name__ == '__main__':
    print("正在更新角色英文名...")
    update_english_names() 