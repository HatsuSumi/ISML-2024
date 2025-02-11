import pandas as pd
import logging

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

def fill_excel_data(excel_path, characters, output_path):
    # 读取Excel文件
    df_excel = pd.read_excel(excel_path)
    
    # 先将列转换为字符串类型
    df_excel['角色'] = df_excel['角色'].astype(str)
    df_excel['作品'] = df_excel['作品'].astype(str)
    df_excel['得票数'] = df_excel['得票数'].astype(str)
    
    # 获取所有角色名称的列表
    character_names = list(characters.keys())
    
    # 填充数据
    for i in range(len(character_names)):
        if i < len(df_excel):
            name = character_names[i]
            df_excel.at[i, '角色'] = name
            df_excel.at[i, '作品'] = characters[name]['anime']
            df_excel.at[i, '得票数'] = characters[name]['votes']
    
    # 替换 'nan' 为空字符串
    df_excel = df_excel.replace('nan', '')
    
    # 保存修改后的Excel文件
    df_excel.to_excel(output_path, index=False)
    logging.info(f'数据已保存到 {output_path}')

def main():
    try:
        # 文件路径
        txt_path = 'data/name.txt'
        excel_path = 'data/02-male-nomination.xlsx'
        output_path = 'data/02-male-nomination_filled.xlsx'
        
        # 读取txt数据
        logging.info('正在读取txt文件...')
        characters = read_txt_data(txt_path)
        
        # 填充Excel数据
        logging.info('正在填充Excel数据...')
        fill_excel_data(excel_path, characters, output_path)
        
        logging.info('处理完成！')
        
    except Exception as e:
        logging.error(f'发生错误：{str(e)}')

if __name__ == '__main__':
    main() 