import pandas as pd

def add_new_characters():
    """从txt文件添加新角色到ISML2024_characters.xlsx"""
    try:
        # 读取现有Excel文件
        isml_df = pd.read_excel('data/common/ISML2024_characters.xlsx')
        
        # 读取txt文件
        ch_data = []
        en_data = []
        
        with open('data/ch.txt', 'r', encoding='utf-8') as f:
            ch_lines = [line.strip().split('\t') for line in f if line.strip()]
            # 跳过标题行
            for line in ch_lines[1:]:
                ch_data.append({
                    'rank': int(line[0]),
                    'name': line[1],
                    'series': line[2],
                    'votes': int(line[3])
                })
        
        with open('data/en.txt', 'r', encoding='utf-8') as f:
            en_lines = [line.strip().split('\t') for line in f if line.strip()]
            # 跳过标题行
            for line in en_lines[1:]:
                en_data.append({
                    'rank': int(line[0]),
                    'name': line[1],
                    'series': line[2],
                    'votes': int(line[3])
                })
        
        # 记录新增角色
        added = 0
        
        # 添加新角色
        for ch, en in zip(ch_data, en_data):
            # 检查角色是否已存在
            mask = (isml_df['角色'] == ch['name']) & (isml_df['作品'] == ch['series'])
            if not any(mask):
                new_row = pd.Series({
                    'ID': len(isml_df) + 1,  # 自动生成新ID
                    '角色': ch['name'],
                    '作品': ch['series'],
                    'CV': '',
                    '头像': '',
                    '状态': '',
                    '分组': '',
                    '季节': '',
                    '性别': ''
                })
                isml_df = pd.concat([isml_df, pd.DataFrame([new_row])], ignore_index=True)
                added += 1
                print(f"添加新角色: {ch['name']} ({ch['series']})")
        
        # 保存更新后的文件
        isml_df.to_excel('data/ISML2024_characters_updated.xlsx', index=False)
        
        # 输出统计信息
        print(f"\n更新统计:")
        print(f"原有角色数: {len(isml_df) - added}")
        print(f"新增角色数: {added}")
        print(f"总角色数: {len(isml_df)}")
        
        print("\n✅ 已保存更新后的文件至: data/ISML2024_characters_updated.xlsx")
        
    except Exception as e:
        print(f"❌ 添加新角色时出错: {str(e)}")

if __name__ == '__main__':
    print("正在添加新角色...")
    add_new_characters() 