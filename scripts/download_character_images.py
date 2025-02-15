import os
import time
import random
import hashlib
import requests
from urllib.parse import urljoin, urlparse, urlunparse, urlencode, parse_qsl
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from PIL import Image
import io

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.FileHandler('image_downloader.log', encoding='utf-8', mode='w'),
        logging.StreamHandler()
    ]
)

class ImageDownloader:
    def __init__(self, base_url, max_depth=3, max_workers=50):  
        self.base_url = base_url
        self.max_depth = max_depth
        self.max_workers = max_workers
        self.visited_urls = set()
        self.downloaded_images = set()
        
        # 设置保存目录
        root_dir = os.path.dirname(os.path.abspath(__file__))
        self.save_dir = os.path.join(root_dir, 'images', 'isml_2024')
        os.makedirs(self.save_dir, exist_ok=True)
        
        # 下载统计
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.successful_downloads = 0
        self.failed_downloads = 0
        self.duplicate_downloads = 0

    @staticmethod
    def normalize_url(url):
        """规范化 URL，移除查询参数"""
        parsed = urlparse(url)
        clean_query = urlencode(sorted(parse_qsl(parsed.query)))
        normalized = urlunparse((
            parsed.scheme, 
            parsed.netloc, 
            parsed.path, 
            parsed.params, 
            clean_query, 
            parsed.fragment
        ))
        return normalized
    
    @staticmethod
    def get_image_hash(content):
        """计算图片内容哈希值"""
        return hashlib.md5(content).hexdigest()
    
    def is_valid_crawl_url(self, url):
        """判断是否是可以遍历的 URL"""
        # 严格限制只处理特定的 GIF 文件 URL
        return url.endswith('.gif')
    
    def is_valid_image_url(self, img_url):
        """判断图片是否符合下载条件"""
        # 严格检查 GIF 文件
        conditions = [
            # 严格匹配 /static/img/isml/avatar/dynamic/ 路径
            '/static/img/isml/avatar/dynamic/' in img_url.lower(),
            # 严格限制为 .gif 扩展名
            img_url.lower().endswith('.gif')
        ]
        
        is_valid = all(conditions)
        
        # 记录所有尝试下载的 GIF 路径
        if is_valid:
            with open('gif_image_paths.txt', 'a', encoding='utf-8') as f:
                f.write(f"{img_url}\n")
        
        return is_valid
    
    def _crawl_url(self, url, depth=0):
        # 防止重复访问和超出深度
        normalized_url = self.normalize_url(url)
        if normalized_url in self.visited_urls or depth > self.max_depth:
            return
        
        self.visited_urls.add(normalized_url)
        
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 下载页面图片
            self._download_page_images(url, soup)
            
            # 提取并遍历子链接
            links = soup.find_all('a', href=True)
            logging.info(f"在 {url} 中找到 {len(links)} 个链接")
            
            for link in links:
                href = link['href']
                full_url = urljoin(url, href)
                
                if (urlparse(full_url).netloc == urlparse(self.base_url).netloc and 
                    self.is_valid_crawl_url(full_url)):
                    self._crawl_url(full_url, depth + 1)
                
                time.sleep(random.uniform(0.1, 0.5))
        
        except Exception as e:
            logging.error(f"处理 {url} 出错: {e}")
    
    def _download_page_images(self, current_url, soup):
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = []
            
            # 原有的全页面图片处理逻辑
            img_elements = soup.find_all('img', src=True)
            
            for img in img_elements:
                try:
                    img_url = img['src']
                    full_url = urljoin(current_url, img_url)
                    
                    if self.is_valid_image_url(full_url):
                        futures.append(executor.submit(self._download_image, full_url))
                
                except Exception as e:
                    logging.error(f"处理单个图片时出错: {e}")
            
            # 等待所有任务完成
            for future in as_completed(futures):
                future.result()
    
    def _download_image(self, img_url):
        try:
            # 如果是相对路径，转换为绝对路径
            if img_url.startswith('/'):
                img_url = f'https://international.saimoe.website{img_url}'
            
            # 规范化 URL
            normalized_url = self.normalize_url(img_url)
            
            # 检查是否已下载
            if normalized_url in self.downloaded_images:
                self.duplicate_downloads += 1
                return
            
            # 下载图片
            response = requests.get(img_url, headers=self.headers, timeout=10)
            
            # 严格检查 GIF 类型和大小
            content_type = response.headers.get('content-type', '')
            content_length = len(response.content)
            
            if ('image/gif' not in content_type.lower() or 
                not img_url.lower().endswith('.gif') or 
                content_length < 1024):
                logging.warning(f"跳过非 GIF 图片: {img_url}")
                self.failed_downloads += 1
                return
            
            # 生成文件名
            filename = os.path.basename(urlparse(img_url).path)
            file_path = os.path.join(self.save_dir, filename)
            
            # 保存图片
            with open(file_path, 'wb') as f:
                f.write(response.content)
            
            # 记录下载信息
            self.downloaded_images.add(normalized_url)
            self.successful_downloads += 1
            
            logging.info(f"成功下载 GIF: {filename}")
        
        except Exception as e:
            logging.error(f"下载 {img_url} 出错: {e}")
            self.failed_downloads += 1
    
    def download_images(self):
        try:
            logging.info(f"开始下载图片，起始 URL: {self.base_url}")
            self._crawl_url(self.base_url)
        except Exception as e:
            logging.error(f"图片下载过程出错: {e}")
        
        # 打印下载统计
        logging.info(f"下载完成：成功 {self.successful_downloads} 个，失败 {self.failed_downloads} 个，重复 {self.duplicate_downloads} 个")

def download_gif_with_retry(gif_url, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = requests.get(gif_url, timeout=10)
            
            # 检查是否是有效的 GIF
            if (response.status_code == 200 and 
                'image/gif' in response.headers.get('content-type', '') and 
                len(response.content) > 1024):
                return response.content
            
        except (requests.ConnectionError, requests.Timeout) as e:
            logging.warning(f"下载 {gif_url} 失败，第 {attempt + 1} 次尝试：{e}")
            time.sleep(2 ** attempt)  # 指数退避
    
    logging.error(f"下载 {gif_url} 失败，已达最大重试次数")
    return None

def get_character_profile_links():
    # 配置 Chrome 选项
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # 无头模式
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    
    # 使用 WebDriver Manager 自动管理 ChromeDriver
    service = Service(ChromeDriverManager().install())
    
    # 创建浏览器实例
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    try:
        # 导航到页面
        driver.get('https://international.saimoe.website/contestants/profile')
        
        # 等待页面加载
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'a[href^="/contestants/profile/"]'))
        )
        
        # 查找所有角色详情页链接
        character_links = driver.find_elements(By.CSS_SELECTOR, 'a[href^="/contestants/profile/"]')
        
        # 提取链接
        profile_links = [link.get_attribute('href') for link in character_links]
        
        # 去重
        unique_profile_links = list(set(profile_links))
        
        # 打印统计信息
        logging.info(f"在 /contestants/profile 目录下找到 {len(unique_profile_links)} 个角色详情页")
        
        # 将角色详情页链接写入文件
        with open('character_profile_links.txt', 'w', encoding='utf-8') as f:
            for link in unique_profile_links:
                f.write(f"{link}\n")
        
        logging.info("角色详情页链接已保存到 character_profile_links.txt")
        
        return unique_profile_links
    
    except Exception as e:
        logging.error(f"获取角色详情页链接时出错: {e}")
        return []
    
    finally:
        # 关闭浏览器
        driver.quit()

def is_valid_image_size(image_content, max_height=100):
    try:
        # 使用 io.BytesIO 从内存中打开图片
        with Image.open(io.BytesIO(image_content)) as img:
            # 检查图片高度
            return img.height <= max_height
    except Exception as e:
        logging.error(f"图片尺寸检查出错: {e}")
        return False

def download_character_pngs(character_links):
    # 指定下载目录
    download_dir = r'F:\ISML\ISML2024-github\images\isml_2024'
    
    # 确保目录存在
    os.makedirs(download_dir, exist_ok=True)
    
    # 配置 Chrome 选项
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # 无头模式
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    
    # 使用 WebDriver Manager 自动管理 ChromeDriver
    service = Service(ChromeDriverManager().install())
    
    # 创建浏览器实例
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    # 下载统计
    total_downloads = 0
    skipped_downloads = 0
    failed_downloads = 0
    height_skipped_downloads = 0
    
    try:
        # 遍历角色详情页
        for character_link in character_links:
            try:
                # 导航到角色详情页
                driver.get(character_link)
                
                # 等待页面加载
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.TAG_NAME, 'body'))
                )
                
                # 查找 PNG 图片
                png_elements = driver.find_elements(By.CSS_SELECTOR, 'img[src*="/static/img/isml/avatar/"][src$=".png"]')
                
                for png_element in png_elements:
                    png_url = png_element.get_attribute('src')
                    
                    # 生成文件名（使用原始文件名）
                    filename = os.path.basename(png_url)
                    file_path = os.path.join(download_dir, filename)
                    
                    # 检查文件是否已存在
                    if os.path.exists(file_path):
                        skipped_downloads += 1
                        logging.info(f"跳过已存在的文件: {filename}")
                        continue
                    
                    # 下载 PNG
                    try:
                        response = requests.get(png_url)
                        
                        # 检查是否是有效的 PNG
                        if (response.status_code == 200 and 
                            'image/png' in response.headers.get('content-type', '') and 
                            len(response.content) > 1024):
                            
                            # 检查图片高度
                            if not is_valid_image_size(response.content):
                                height_skipped_downloads += 1
                                logging.info(f"跳过高度超过100px的图片: {filename}")
                                continue
                            
                            # 保存 PNG
                            with open(file_path, 'wb') as f:
                                f.write(response.content)
                            
                            total_downloads += 1
                            logging.info(f"下载成功: {filename}")
                        
                    except Exception as download_error:
                        failed_downloads += 1
                        logging.error(f"下载 {png_url} 出错: {download_error}")
            
            except Exception as page_error:
                logging.error(f"处理 {character_link} 出错: {page_error}")
        
        logging.info(f"PNG 下载完成：成功 {total_downloads} 个，跳过已存在 {skipped_downloads} 个，跳过高度 {height_skipped_downloads} 个，失败 {failed_downloads} 个")
    
    finally:
        # 关闭浏览器
        driver.quit()

def download_character_gifs(character_links):
    # 创建下载目录（位于项目根目录）
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    download_dir = os.path.join(project_root, 'images', 'character_gifs')
    
    # 添加详细的目录创建日志
    try:
        os.makedirs(download_dir, exist_ok=True)
        logging.info(f"下载目录已创建: {download_dir}")
        logging.info(f"目录是否存在: {os.path.exists(download_dir)}")
    except Exception as e:
        logging.error(f"创建目录失败: {e}")
        raise
    
    # 打印当前工作目录和脚本绝对路径，帮助调试
    logging.info(f"当前工作目录: {os.getcwd()}")
    logging.info(f"脚本绝对路径: {os.path.abspath(__file__)}")
    logging.info(f"完整下载路径: {os.path.abspath(download_dir)}")
    
    # 配置 Chrome 选项
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # 无头模式
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    
    # 使用 WebDriver Manager 自动管理 ChromeDriver
    service = Service(ChromeDriverManager().install())
    
    # 创建浏览器实例
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    # 下载统计
    total_downloads = 0
    failed_downloads = 0
    
    try:
        # 遍历角色详情页
        for character_link in character_links:
            try:
                # 导航到角色详情页
                driver.get(character_link)
                
                # 等待页面加载
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.TAG_NAME, 'body'))
                )
                
                # 查找 GIF 图片
                gif_elements = driver.find_elements(By.CSS_SELECTOR, 'img[src*="/static/img/isml/avatar/dynamic/"][src$=".gif"]')
                
                for gif_element in gif_elements:
                    gif_url = gif_element.get_attribute('src')
                    
                    # 下载 GIF
                    gif_content = download_gif_with_retry(gif_url)
                    
                    if gif_content:
                        # 生成文件名
                        filename = os.path.basename(gif_url)
                        file_path = os.path.join(download_dir, filename)
                        
                        # 保存 GIF
                        with open(file_path, 'wb') as f:
                            f.write(gif_content)
                        
                        total_downloads += 1
                        logging.info(f"下载成功: {filename}")
                    else:
                        failed_downloads += 1
                        logging.error(f"下载失败: {gif_url}")
            
            except Exception as page_error:
                logging.error(f"处理 {character_link} 出错: {page_error}")
        
        logging.info(f"GIF 下载完成：成功 {total_downloads} 个，失败 {failed_downloads} 个")
    
    finally:
        # 关闭浏览器
        driver.quit()

def main():
    # 获取角色详情页链接
    character_links = get_character_profile_links()
    
    # 下载角色 PNG
    download_character_pngs(character_links)

if __name__ == '__main__':
    main()