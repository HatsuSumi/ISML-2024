import pandas as pd
from pathlib import Path

def excel_to_csv(excel_file):
    """将Excel文件转换为CSV"""
    try:
        df = pd.read_excel(excel_file)
        
        for column in df.columns:
            if df[column].dtype == 'object': 
                df[column] = df[column].fillna('').astype(str).str.strip()
            elif df[column].dtype == 'float64':
                if df[column].fillna(-1).apply(lambda x: x.is_integer()).all():
                    df[column] = df[column].fillna(-1).astype(int)
                    df[column] = df[column].replace(-1, None)
        
        excel_path = Path(excel_file)
        csv_file = excel_path.parent / f"{excel_path.stem}_new.csv"
        
        df.to_csv(csv_file, index=False, encoding='utf-8')
        print(f"✅ 已转换为CSV: {csv_file}")
            
    except Exception as e:
        print(f"❌ 转换文件时出错: {str(e)}")

def main():
    excel_file = 'data/characters/base/characters-data.xlsx'
    print(f"正在转换: {excel_file}")
    excel_to_csv(excel_file)
if __name__ == '__main__':

    main() 