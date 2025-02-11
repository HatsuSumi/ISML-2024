import pandas as pd
import logging
import os

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def read_txt_data(txt_path):
    # 读取txt文件
    df_txt = pd.read_csv(txt_path, sep='\t', encoding='utf-8')
    
    # 创建一个字典存储角色信息
    characters = {}
    for _, row in df_txt.iterrows():
        name = row['姓名']
        anime = row['作品']
        votes = row['得票数']
        # 如果得票数是数字，保持原样；如果是"自动"，设为"-"
        votes = votes if str(votes).isdigit() else '-'
        characters[name] = {
            'anime': anime,
            'votes': votes
        }
    
    return characters

def read_characters_data(csv_path):
    # 读取角色数据
    df_chars = pd.read_csv(csv_path, encoding='utf-8')
    
    # 创建一个字典存储角色信息
    chars_info = {}
    for _, row in df_chars.iterrows():
        key = f"{row['角色']}@{row['IP']}"
        chars_info[key] = {
            'cv': row['CV'] if pd.notna(row['CV']) else '',
            'name_en': row['角色（英）'] if pd.notna(row['角色（英）']) else '',
            'avatar': row['头像'] if pd.notna(row['头像']) else ''
        }
    
    return chars_info

def update_excel_data(excel_path, chars_info, output_path):
    # 读取Excel文件
    df_excel = pd.read_excel(excel_path)
    
    # 先将列转换为字符串类型
    for col in ['角色', '作品', 'CV', '角色（英）', '头像']:
        df_excel[col] = df_excel[col].astype(str)
    
    # 更新数据
    for i, row in df_excel.iterrows():
        if pd.notna(row['角色']) and pd.notna(row['作品']):
            key = f"{row['角色']}@{row['作品']}"
            if key in chars_info:
                df_excel.at[i, 'CV'] = chars_info[key]['cv']
                df_excel.at[i, '角色（英）'] = chars_info[key]['name_en']
                df_excel.at[i, '头像'] = chars_info[key]['avatar']
    
    # 替换 'nan' 为空字符串
    df_excel = df_excel.replace('nan', '')
    
    # 保存修改后的Excel文件
    df_excel.to_excel(output_path, index=False)
    logging.info(f'数据已保存到 {output_path}')

def main():
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(script_dir)
        
        # 文件路径
        txt_path = os.path.join(root_dir, 'data', 'name.txt')
        excel_path = os.path.join(root_dir, 'data', '02-male-nomination.xlsx')
        chars_path = os.path.join(root_dir, 'data', 'common', 'characters_data.csv')
        output_path = os.path.join(root_dir, 'data', '02-male-nomination_filled.xlsx')
        
        # 读取txt数据
        logging.info('正在读取txt文件...')
        characters = read_txt_data(txt_path)
        
        # 读取角色数据
        logging.info('正在读取角色数据...')
        chars_info = read_characters_data(chars_path)
        
        # 更新Excel数据
        logging.info('正在更新Excel数据...')
        update_excel_data(excel_path, chars_info, output_path)
        
        logging.info('处理完成！')
        
    except Exception as e:
        logging.error(f'发生错误：{str(e)}')

if __name__ == '__main__':
    main() 