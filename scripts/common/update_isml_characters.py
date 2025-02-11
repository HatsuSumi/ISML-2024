import pandas as pd

def update_isml_characters():
    """从characters_data.xlsx更新ISML2024_characters.xlsx"""
    try:
        # 读取文件
        isml_df = pd.read_excel('data/common/ISML2024_characters.xlsx')
        cv_df = pd.read_excel('data/common/characters_data.xlsx')
        
        # 记录更新统计
        updated = 0
        not_found = []
        
        # 更新角色信息
        for idx, row in isml_df.iterrows():
            # 在characters_data中查找对应角色
            mask = (cv_df['角色'] == row['角色']) & (cv_df['作品'] == row['作品'])
            if any(mask):
                cv_row = cv_df[mask].iloc[0]
                # 只更新CV列
                if pd.notna(cv_row['CV']) and (pd.isna(row['CV']) or row['CV'] == ''):
                    isml_df.at[idx, 'CV'] = cv_row['CV']
                    print(f"更新 {row['角色']} 的 CV: {cv_row['CV']}")
                updated += 1
            else:
                not_found.append({
                    'name': row['角色'],
                    'series': row['作品']
                })
        
        # 保存更新后的文件
        isml_df.to_excel('data/ISML2024_characters_updated.xlsx', index=False)
        
        # 输出统计信息
        print(f"\n更新统计:")
        print(f"总角色数: {len(isml_df)}")
        print(f"更新数量: {updated}")
        
        if not_found:
            print("\n未找到匹配的角色:")
            for char in not_found:
                print(f"- {char['name']} ({char['series']})")
        
        print("\n✅ 已保存更新后的文件至: data/ISML2024_characters_updated.xlsx")
        
    except Exception as e:
        print(f"❌ 更新角色信息时出错: {str(e)}")

if __name__ == '__main__':
    print("正在更新ISML2024角色信息...")
    update_isml_characters() 