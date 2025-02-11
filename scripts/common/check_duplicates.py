import pandas as pd

def check_duplicates():
    """检查ISML2024_characters.xlsx中的重复角色"""
    try:
        # 读取Excel文件
        df = pd.read_excel('data/common/ISML2024_characters.xlsx')
        
        # 检查完全重复的行
        exact_duplicates = df[df.duplicated()]
        
        # 检查角色名和作品名都相同的情况
        name_series_duplicates = df[df.duplicated(subset=['角色', '作品'], keep=False)].sort_values(['角色', '作品'])
        
        # 检查只有角色名相同的情况
        name_duplicates = df[df.duplicated(subset=['角色'], keep=False)].sort_values('角色')
        
        # 输出检查结果
        print("\nISML2024_characters.xlsx 检查结果:")
        
        if len(exact_duplicates) > 0:
            print("\n完全重复的行:")
            print("-" * 50)
            for _, row in exact_duplicates.iterrows():
                print(f"角色: {row['角色']}")
                print(f"作品: {row['作品']}")
                print(f"CV: {row['CV']}")
                print("-" * 50)
        
        if len(name_series_duplicates) > 0:
            print("\n角色名和作品名都重复的记录:")
            print("-" * 50)
            current_name = None
            for _, row in name_series_duplicates.iterrows():
                if current_name != (row['角色'], row['作品']):
                    current_name = (row['角色'], row['作品'])
                    print(f"\n角色: {row['角色']}")
                    print(f"作品: {row['作品']}")
                    # 计算重复次数
                    duplicates_count = len(name_series_duplicates[
                        (name_series_duplicates['角色'] == row['角色']) & 
                        (name_series_duplicates['作品'] == row['作品'])
                    ])
                    print(f"出现次数: {duplicates_count}")
                    print("-" * 50)
        
        if len(name_duplicates) > 0:
            print("\n同名但作品不同的角色:")
            print("-" * 50)
            current_name = None
            for _, row in name_duplicates.iterrows():
                if current_name != row['角色']:
                    current_name = row['角色']
                    print(f"\n角色: {row['角色']}")
                    print("出现在以下作品中:")
                    for _, dup_row in name_duplicates[name_duplicates['角色'] == row['角色']].iterrows():
                        print(f"- {dup_row['作品']}")
                    print("-" * 50)
        
        if len(exact_duplicates) == 0 and len(name_series_duplicates) == 0:
            print("✅ 未发现重复记录")
        else:
            print(f"\n统计信息:")
            print(f"完全重复的行数: {len(exact_duplicates)}")
            print(f"角色和作品都重复的组数: {len(name_series_duplicates) // 2}")
            print(f"仅角色名重复的组数: {len(df[df.duplicated(subset=['角色'], keep=False)]) // 2}")
        
    except Exception as e:
        print(f"❌ 检查重复时出错: {str(e)}")

if __name__ == '__main__':
    print("正在检查重复角色...")
    check_duplicates() 