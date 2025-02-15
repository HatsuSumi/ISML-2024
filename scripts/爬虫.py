import os
import re
import time
import sys
import csv
import traceback
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

class ImageCrawler:
    def __init__(self, base_url, max_depth=3):
        self.base_url = base_url
        
        # 设置保存目录为项目根目录下的 images 文件夹
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # 从 URL 中提取域名，作为子文件夹名称
        domain = urlparse(base_url).netloc.replace('.', '_')
        self.save_dir = os.path.join(root_dir, 'images', domain)
        
        self.max_depth = max_depth
        self.visited_urls = set()
        self.downloaded_images = set()
        self.character_data = []
        
        # 创建保存目录
        os.makedirs(self.save_dir, exist_ok=True)
        
        # 设置 Chrome 选项
        chrome_options = Options()
        
        # 禁用 WebDriver 特征
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # 取消无头模式
        # chrome_options.add_argument("--headless=new")
        
        # 模拟真实浏览器
        chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        
        # 添加更多浏览器指纹伪造
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        
        # 初始化 WebDriver
        try:
            # 尝试自动下载并安装最新的 ChromeDriver
            service = Service(ChromeDriverManager().install())
            print(f"ChromeDriver 路径: {service.path}")
            
            # 创建 WebDriver
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            
            # 设置页面加载超时和脚本超时
            self.driver.set_page_load_timeout(30)
            self.driver.set_script_timeout(30)
            
            print("WebDriver 初始化成功")
            
            # 立即导航到目标 URL
            self.driver.get(self.base_url)
            
            # 提示用户手动切换语言
            print("浏览器已打开，请在浏览器中手动切换到中文语言")
            print("将等待 10 秒让你有时间切换语言...")
            time.sleep(10)  # 等待 10 秒
        except Exception as e:
            print(f"WebDriver 初始化失败: {e}")
            print(traceback.format_exc())
            sys.exit(1)

    def is_valid_url(self, url):
        # 只下载特定路径的头像
        avatar_paths = ['/static/img/isml/avatar/small', '/static/img/isml/avatar']
        is_valid = (
            url.startswith('http') and 
            any(path in url for path in avatar_paths) and
            urlparse(url).netloc == urlparse(self.base_url).netloc
        )
        
        return is_valid

    def download_image(self, img_url):
        # 不再下载图片，只返回 True
        return True

    def extract_character_mapping(self, url):
        # 清空之前的数据
        self.character_data.clear()
        
        try:
            # 加载页面
            print(f"正在加载页面: {url}")
            self.driver.get(url)
            
            # 等待页面加载
            print("等待页面加载...")
            
            # 执行多种交互策略
            try:
                # 尝试滚动页面多次
                for _ in range(3):
                    self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    time.sleep(2)
                
                # 尝试点击可能的交互元素
                load_more_buttons = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Load More') or contains(text(), '加载更多')]")
                for button in load_more_buttons:
                    try:
                        button.click()
                        time.sleep(1)
                    except Exception as click_err:
                        print(f"点击按钮失败: {click_err}")
            except Exception as e:
                print("交互策略执行失败：", e)
            
            # 详细等待策略
            try:
                # 等待任何可能的角色元素
                WebDriverWait(self.driver, 30).until(
                    lambda d: len(d.find_elements(By.CLASS_NAME, 'contestant_field')) > 0 or
                              len(d.find_elements(By.XPATH, "//div[contains(@class, 'character') or contains(@class, 'contestant')]")) > 0
                )
            except TimeoutException:
                print("等待角色元素超时")
                # 打印更多调试信息
                print("当前页面标题：", self.driver.title)
                print("当前 URL：", self.driver.current_url)
                
                # 保存页面源码以供后续分析
                with open(os.path.join(self.save_dir, 'page_source.html'), 'w', encoding='utf-8') as f:
                    f.write(self.driver.page_source)
                
                raise
            
            # 获取页面源码
            page_source = self.driver.page_source
            soup = BeautifulSoup(page_source, 'html.parser')
            
            # 尝试多种选择器查找角色
            contestants = (
                soup.find_all('div', class_='contestant_field') or 
                soup.find_all('div', class_='character') or 
                soup.find_all('div', class_='contestant')
            )
            
            print(f"找到 {len(contestants)} 个角色元素")
            
            for contestant in contestants:
                # 专门提取头像 img，且只处理头像路径
                img = contestant.find('img', src=lambda src: src and '/static/img/isml/avatar' in src)
                
                if img:
                    # 从 src 提取英文名（文件名）
                    english_name = os.path.splitext(os.path.basename(img['src']))[0]
                    # 替换下划线为空格
                    english_name_formatted = english_name.replace('_', ' ')
                    
                    # 使用 urljoin 处理相对路径
                    image_src = urljoin(self.base_url, img['src'])
                    
                    # 提取中文名和作品名
                    name_elem = contestant.find('div', class_='contestant_name') or contestant.find('div', class_='character_name')
                    series_elem = contestant.find('div', class_='contestant_series') or contestant.find('div', class_='character_series')
                    
                    # 名称提取逻辑
                    if name_elem:
                        spans = name_elem.find_all('span')
                        chinese_name = spans[0].text.strip() if spans else english_name_formatted
                    else:
                        chinese_name = english_name_formatted
                    
                    # 调试：比较角色名和英文名
                    print(f"角色名: {chinese_name}")
                    print(f"角色英文名: {english_name_formatted}")
                    print(f"是否完全相同: {chinese_name.lower() == english_name_formatted}")
                    
                    # 作品名提取保持不变
                    series_name = series_elem.find('span').text.strip() if series_elem else ''
                    
                    # 生成文件名
                    image_filename = f"{english_name}.png"
                    
                    # 存储角色信息
                    character_info = {
                        '角色名': chinese_name,
                        '角色英文名': english_name_formatted,
                        '作品名': series_name,
                        '图片文件名': image_filename,
                        '图片路径': image_src
                    }
                    
                    self.character_data.append(character_info)
                    print(f"添加角色信息: {character_info}")
            
            # 打印所有收集到的角色信息
            print(f"总共收集到 {len(self.character_data)} 个角色信息")
        
        except Exception as e:
            print(f"提取角色信息失败: {e}")
            print(traceback.format_exc())

    def crawl(self, url, depth=0, max_images=None):
        try:
            # 导航到指定 URL
            self.driver.get(url)
            
            # 等待页面加载
            WebDriverWait(self.driver, 30).until(
                lambda d: len(d.find_elements(By.CLASS_NAME, 'contestant_field')) > 0 or
                len(d.find_elements(By.XPATH, "//div[contains(@class, 'character') or contains(@class, 'contestant')]")) > 0
            )
            
            # 解析页面
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            
            # 找到所有角色容器
            contestants = soup.find_all('div', class_='contestant_field')
            
            # 遍历角色
            for contestant in contestants:
                # 提取图片 URL
                img_elem = contestant.find('div', class_='contestant_avatar').find('img')
                img_url = urljoin(url, img_elem['src']) if img_elem and 'src' in img_elem.attrs else ''
                
                # 从图片 URL 提取英文名
                if img_url:
                    # 从 URL 路径中提取文件名（不包含扩展名）
                    english_name_formatted = os.path.splitext(os.path.basename(urlparse(img_url).path))[0]
                    # 移除可能的数字后缀
                    english_name_formatted = re.sub(r'\d+$', '', english_name_formatted)
                    # 替换下划线为空格
                    english_name_formatted = english_name_formatted.replace('_', ' ')
                else:
                    english_name_formatted = ''
                
                # 提取中文名和作品名
                name_elem = contestant.find('div', class_='contestant_name') or contestant.find('div', class_='character_name')
                series_elem = contestant.find('div', class_='contestant_series') or contestant.find('div', class_='character_series')
                
                # 名称提取逻辑
                if name_elem:
                    spans = name_elem.find_all('span')
                    chinese_name = spans[0].text.strip() if spans else ''
                else:
                    chinese_name = ''
                
                # 作品名提取
                series_name = series_elem.find('span').text.strip() if series_elem else ''
                
                # 生成文件名
                file_name = f"{english_name_formatted}.png" if english_name_formatted else '.png'
                
                # 只有在有意义的信息时才添加
                if chinese_name or english_name_formatted or series_name:
                    # 构建角色信息字典
                    character_info = {
                        '角色名': chinese_name,
                        '角色英文名': english_name_formatted,
                        '作品名': series_name,
                        '图片文件名': file_name,
                        '图片路径': img_url
                    }
                    
                    # 添加到角色数据列表
                    self.character_data.append(character_info)
            
            return True
        
        except Exception as e:
            print(f"爬取 {url} 时发生错误: {e}")
            print(traceback.format_exc())
            return False

    def save_to_csv(self):
        # 确定 CSV 保存路径
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        images_dir = os.path.join(root_dir, 'images', urlparse(self.base_url).netloc.replace('.', '_'))
        os.makedirs(images_dir, exist_ok=True)
        
        csv_path = os.path.join(images_dir, 'character_images.csv')
        
        # 写入 CSV
        with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['角色名', '角色英文名', '作品名', '图片文件名', '图片路径']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for character in self.character_data:
                writer.writerow(character)
        
        print(f"角色信息已保存到 {csv_path}")
        print(f"总共保存 {len(self.character_data)} 个角色信息")

def main():
    url = 'https://international.saimoe.website/voting/voting'
    crawler = ImageCrawler(url)
    crawler.crawl(url)
    crawler.save_to_csv()

if __name__ == '__main__':
    main()