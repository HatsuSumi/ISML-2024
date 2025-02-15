import requests
from bs4 import BeautifulSoup
import os
import re
import time
import random
from urllib.parse import urljoin, urlparse

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
        
        # 创建保存目录
        os.makedirs(self.save_dir, exist_ok=True)
        
        # 请求头，模拟浏览器
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

    def is_valid_url(self, url):
        # 只下载特定路径的头像
        avatar_path = '/static/img/isml/avatar/small/'
        return (
            url.startswith('http') and 
            avatar_path in url and
            urlparse(url).netloc == urlparse(self.base_url).netloc
        )

    def download_image(self, img_url):
        try:
            # 避免重复下载
            if img_url in self.downloaded_images:
                return False

            response = requests.get(img_url, headers=self.headers, timeout=10)
            
            # 检查图片类型和大小
            content_type = response.headers.get('content-type', '')
            if 'image' not in content_type or len(response.content) < 1024:
                return False

            # 生成文件名
            filename = os.path.join(
                self.save_dir, 
                os.path.basename(urlparse(img_url).path)
            )
            
            # 保存图片
            with open(filename, 'wb') as f:
                f.write(response.content)
            
            self.downloaded_images.add(img_url)
            print(f"下载成功: {img_url}")
            
            # 随机延迟，避免被封
            time.sleep(random.uniform(0.5, 2))
            return True
        
        except Exception as e:
            print(f"下载失败: {img_url}, 错误: {e}")
            return False

    def crawl(self, url, depth=0):
        # 防止重复爬取和超出深度
        if url in self.visited_urls or depth > self.max_depth:
            return
        
        self.visited_urls.add(url)
        
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 下载图片
            images = soup.find_all('img')
            for img in images:
                img_url = img.get('src')
                if not img_url:
                    continue
                
                # 处理相对路径
                img_url = urljoin(url, img_url)
                
                if self.is_valid_url(img_url):
                    # 从 src 提取英文名（文件名）
                    english_name = os.path.splitext(os.path.basename(img_url))[0]
                    # 替换下划线为空格
                    english_name_formatted = english_name.replace('_', ' ')
                    self.download_image(img_url)
            
            # 递归爬取链接
            links = soup.find_all('a', href=True)
            for link in links:
                next_url = urljoin(url, link['href'])
                if self.is_valid_url(next_url):
                    self.crawl(next_url, depth + 1)
        
        except Exception as e:
            print(f"爬取失败: {url}, 错误: {e}")

def main():
    url = 'https://international.saimoe.website/voting/voting' 
    crawler = ImageCrawler(url)
    crawler.crawl(url)

if __name__ == '__main__':
    main()