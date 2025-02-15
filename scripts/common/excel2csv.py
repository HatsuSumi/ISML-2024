import pandas as pd
import os
import sys

def excel_to_csv(excel_file):
    try:
        # 使用绝对路径
        script_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(os.path.dirname(script_dir))
        full_excel_path = os.path.join(root_dir, excel_file)
        
        # 构建CSV文件路径
        csv_file = full_excel_path.replace('.xlsx', '_new.csv')
        
        # 读取Excel文件
        df = pd.read_excel(full_excel_path)
        
        # 处理数据类型
        for column in df.columns:
            if df[column].dtype == 'object': 
                df[column] = df[column].fillna('').astype(str).str.strip()
            elif df[column].dtype == 'float64':
                if df[column].fillna(-1).apply(lambda x: x.is_integer()).all():
                    df[column] = df[column].fillna(-1).astype(int)
                    df[column] = df[column].replace(-1, None)
        
        # 保存为CSV
        df.to_csv(csv_file, index=False, encoding='utf-8')
        
        print(f"✅ 转换成功: {csv_file}")
        return True
    except Exception as e:
        print(f"❌ 转换失败: {str(e)}")
        return False

def main():
    excel_files = [
        # 'data/nomination/nova/autumn/male/10-nova-autumn-male-nomination.xlsx',
        # 'data/characters/base/characters-data.xlsx'
        'data/characters/stats/ISML2024-characters.xlsx'
    ]
    
    for excel_file in excel_files:
        print(f"正在转换: {excel_file}")
        excel_to_csv(excel_file)

if __name__ == '__main__':
    main()