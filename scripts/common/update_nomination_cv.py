import pandas as pd

def update_nomination_cv():
    """从characters_data.xlsx更新01-female-nomination.xlsx中缺少的CV信息"""
    try:
        # 读取文件
        nomination_df = pd.read_excel('data/01-female-nomination.xlsx')
        cv_df = pd.read_excel('data/common/characters_data.xlsx')
        
        # 记录更新统计
        updated = 0
        not_found = []
        
        # 更新CV信息
        for idx, row in nomination_df.iterrows():
            # 只处理没有CV的行
            if pd.isna(row['CV']) or row['CV'] == '':
                # 在characters_data中查找对应角色
                mask = (cv_df['角色'] == row['角色']) & (cv_df['作品'] == row['作品'])
                if any(mask):
                    cv_row = cv_df[mask].iloc[0]
                    if pd.notna(cv_row['CV']):
                        nomination_df.at[idx, 'CV'] = cv_row['CV']
                        updated += 1
                        print(f"更新CV: {row['角色']} -> {cv_row['CV']}")
                else:
                    not_found.append({
                        'name': row['角色'],
                        'series': row['作品']
                    })
        
        # 保存更新后的文件
        nomination_df.to_excel('data/01-female-nomination_updated.xlsx', index=False)
        
        # 输出统计信息
        print(f"\n更新统计:")
        print(f"总角色数: {len(nomination_df)}")
        print(f"更新CV数: {updated}")
        print(f"未找到匹配: {len(not_found)}")
        
        if not_found:
            print("\n未找到匹配的角色:")
            for char in not_found:
                print(f"{char['name']} ({char['series']})")
        
        print("\n✅ 已保存更新后的文件至: data/01-female-nomination_updated.xlsx")
        
    except Exception as e:
        print(f"❌ 更新CV信息时出错: {str(e)}")

if __name__ == '__main__':
    print("正在更新提名文件的CV信息...")
    update_nomination_cv() 