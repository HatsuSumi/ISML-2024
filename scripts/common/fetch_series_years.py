import json
import os
import requests
from bs4 import BeautifulSoup
import time
import re
from urllib.parse import quote
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def load_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data, file_path):
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def search_baidu(title):
    """从百度百科搜索作品"""
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')  # 无界面模式
    
    try:
        driver = webdriver.Chrome(options=options)
        url = f'https://baike.baidu.com/item/{quote(title)}'
        print(f"Requesting: {url}")
        
        driver.get(url)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, 'basic-info'))
        )
        
        # 查找首播日期或发行日期
        basic_info = driver.find_element(By.CLASS_NAME, 'basic-info')
        dts = basic_info.find_elements(By.TAG_NAME, 'dt')
        dds = basic_info.find_elements(By.TAG_NAME, 'dd')
        
        for dt, dd in zip(dts, dds):
            if any(key in dt.text for key in ['首播', '发行', '播出', '开播', '连载开始']):
                date_text = dd.text
                print(f"Found date text: {date_text}")
                year_match = re.search(r'(\d{4})年', date_text)
                if year_match:
                    year = year_match.group(1)
                    print(f"Extracted year: {year}")
                    return year
                    
        print("No year found in basic info")
    except Exception as e:
        print(f"Error searching baidu for {title}: {e}")
    finally:
        driver.quit()
    return None

def get_all_series_years(data):
    """获取所有作品的年份"""
    series_years = {}
    series_set = set()

    # 收集所有不重复的作品名
    def collect_series(obj):
        if isinstance(obj, dict):
            if 'ip' in obj:
                series_set.add(obj['ip'])
            for value in obj.values():
                if isinstance(value, (dict, list)):
                    collect_series(value)
        elif isinstance(obj, list):
            for item in obj:
                collect_series(item)

    collect_series(data)
    print(f"Found {len(series_set)} unique series")

    # 获取每个作品的年份
    for series in series_set:
        print(f"\nSearching for {series}...")
        year = search_baidu(series)
        if year and year.isdigit():
            series_years[series] = int(year)
            print(f"Found year {year} for {series}")
        time.sleep(2)  # 避免请求过快

    return series_years

def process_file():
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    stats_path = os.path.join(base_path, 'data', 'statistics', 'nomination-stats.json')
    update_path = os.path.join(base_path, 'data', 'statistics', 'nomination-stats_update.json')
    
    if os.path.exists(stats_path):
        print("Processing nomination-stats.json...")
        data = load_json(stats_path)
        if data:
            # 获取所有作品年份
            series_years = get_all_series_years(data)
            print("\nCollected years:", series_years)
            
            # 添加年份信息到数据中
            def add_years(obj):
                if isinstance(obj, dict):
                    if 'ip' in obj and obj['ip'] in series_years:
                        obj['series_year'] = series_years[obj['ip']]
                    for value in obj.values():
                        if isinstance(value, (dict, list)):
                            add_years(value)
                elif isinstance(obj, list):
                    for item in obj:
                        add_years(item)

            add_years(data)
            save_json(data, update_path)
            print(f"Saved to {update_path}")
        else:
            print("Failed to load file")
    else:
        print("File not found")

if __name__ == "__main__":
    process_file() 