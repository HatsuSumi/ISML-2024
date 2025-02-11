import pandas as pd
import os

# 获取脚本所在目录的绝对路径
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(script_dir))

def update_characters_excel():
    # 读取Excel文件
    excel_file = os.path.join(root_dir, 'data', 'characters', 'stats', 'ISML2024-characters.xlsx')
    df = pd.read_excel(excel_file)
    
    # 更新春季赛ID
    # 女性组
    advance_count = 1
    eliminate_count = 1
    for idx, row in df.iterrows():
        if row['季节'] == 'spring' and row['性别'] == 'female':
            if '已晋级' in str(row['状态']):
                df.at[idx, 'ID'] = f"NFSP{advance_count:03d}"
                advance_count += 1
            else:
                df.at[idx, 'ID'] = f"ENFSP{eliminate_count:03d}"
                eliminate_count += 1
    
    # 男性组
    advance_count = 1
    eliminate_count = 1
    for idx, row in df.iterrows():
        if row['季节'] == 'spring' and row['性别'] == 'male':
            if '已晋级' in str(row['状态']):
                df.at[idx, 'ID'] = f"NMSP{advance_count:03d}"
                advance_count += 1
            else:
                df.at[idx, 'ID'] = f"ENMSP{eliminate_count:03d}"
                eliminate_count += 1
    
    # 保存更新后的Excel文件
    output_file = os.path.join(root_dir, 'data', 'characters', 'stats', 'ISML2024-characters-updated.xlsx')
    df.to_excel(output_file, index=False)
    
    print(f"Excel文件已更新并保存到: {output_file}")

if __name__ == "__main__":
    update_characters_excel() 