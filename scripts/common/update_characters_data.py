import pandas as pd
import os

def update_characters_data():
    # 获取项目根目录
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # 读取两个Excel文件
    isml_path = os.path.join(project_root, 'data', 'characters', 'stats', 'ISML2024-characters.xlsx')
    data_path = os.path.join(project_root, 'data', 'characters', 'base', 'characters-data.xlsx')
    
    print(f"正在读取文件：\n{isml_path}\n{data_path}")
    
    try:
        isml_df = pd.read_excel(isml_path)
        data_df = pd.read_excel(data_path)
        
        # 打印列名
        print("\nISML2024-characters.xlsx 的列名：")
        print(isml_df.columns.tolist())
        print("\ncharacters-data.xlsx 的列名：")
        print(data_df.columns.tolist())
        
        # 获取所有作品的年份和季度信息
        ip_info = {}
        for index, row in isml_df.iterrows():
            if row['IP'] not in ip_info and pd.notna(row['IP首映年份']):
                ip_info[row['IP']] = {
                    'year': row['IP首映年份'],
                    'season': row['IP首映季度']
                }
        
        # 更新 characters-data.xlsx
        for index, row in data_df.iterrows():
            if row['IP'] in ip_info:
                info = ip_info[row['IP']]
                data_df.at[index, 'IP首映年份'] = info['year']
                data_df.at[index, 'IP首映季度'] = info['season']
        
        # 保存更新后的文件
        output_path = data_path.replace('.xlsx', '_update.xlsx')
        data_df.to_excel(output_path, index=False)
        print(f"\n已保存到：{output_path}")
        
    except FileNotFoundError as e:
        print(f"错误：找不到文件\n{str(e)}")
    except Exception as e:
        print(f"错误：{str(e)}")

if __name__ == "__main__":
    update_characters_data() 