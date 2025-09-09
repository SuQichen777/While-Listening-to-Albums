import requests
from bs4 import BeautifulSoup
from models.albums import AlbumModel
from dotenv import load_dotenv
import os
from pymongo import MongoClient
from datetime import datetime

load_dotenv()
# 连接到 MongoDB 数据库
client = MongoClient(os.getenv('netEaseGetterDSN'))
db = client.get_database('netEaseGetter')
albumCollection = db.get_collection('album')
# 创建 AlbumModel 实例
album_model = AlbumModel(albumCollection)

def get_album_info(album_id=None, url=None):
    if url is None and album_id is None:
        print("没有给专辑 ID 或 URL")
        url = 'https://music.163.com/album?id=1698619'
        album_id = '1698619'
    elif url is None and album_id is not None:
        # 如果只给了专辑 ID
        print(f"只给了专辑 ID: {album_id}")
        url = f'https://music.163.com/album?id={album_id}'
        album_id = album_id
    else:
        # 如果直接给专辑 ID 或者 给了 URL也给了ID 就直接用 URL
        # url给的例子：https://music.163.com/album?id=159831321&userid=433293042
        # 不保留&userid=433293042
        # 检查有没有“#”
        # 比如https://music.163.com/#/album?id=159831321，就删掉"/#"
        if url.find('#') != -1:
            url = url.split('#')[0] + url.split('#')[1][1:]
        
        # 先看看是song还是album
        if url.find('album') == -1:
            print("没给专辑 URL或者不是专辑")
            return None
        print(f"给了专辑 URL: {url}")
        url = url.split('&')[0]
        album_id = url.split('=')[1]

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://music.163.com/',
    }

    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')
    # print(f"获取到的页面内容：{soup.prettify()}")
    if soup is None:
        raise ValueError("无法获取页面内容")
        return None
    

    # 标题
    title_tag = soup.find('div', class_='tit')
    if title_tag and title_tag.h2:
        album_title = title_tag.h2.text.strip()
    elif title_tag and title_tag.em:
        album_title = title_tag.em.text.strip()
    else:
        album_title = "未知专辑"

    # 作者和发行时间
    intr_info = soup.find_all('p', class_='intr')
    if not intr_info:
        intr_info = soup.find_all('p', class_='des s-fc4')
    if not intr_info:
        print("没找到对应栏目")
        return
    artist_tag = intr_info[0]
    if artist_tag:
        artist_links = artist_tag.find_all('a')
        artists = []
        for a in artist_links:
            artist = a.text.strip()
            artists.append(artist)
    else:
        artists = ["未知作者"]
    release_date_tag = intr_info[1]
    # 格式是 发行时间：2024-05-18，只要后面的日期
    release_date = release_date_tag.text.strip().split('：')[1]


    # 封面图
    cover_tag = soup.find('img', class_='j-img')
    cover_url = cover_tag['src'] if cover_tag else '未找到封面'

    # 简介（介绍字段只在专辑页存在）
    desc_tag = soup.find('div', id='album-desc-more')
    description = desc_tag.text.strip() if desc_tag else '无简介'

    return {
        'album_id':album_id,
        'url': url,
        'release_date': release_date,
        'title': album_title,
        'artists': artists,
        'cover_url': cover_url,
        'description': description
    }

def save_album_to_db(album_info):
    album_model.save_album_info_to_db(album_info)
    return album_info


if __name__ == '__main__':
    while True:
        try:
            album_id = input("请输入专辑ID：")
            album_url = input("请输入专辑URL：")
            if album_url == '':
                album_url = None
            if album_id == '':
                album_id = None
            album_info = get_album_info(album_id, album_url)
            for key, value in album_info.items():
                print(f"{key}: {value}")
            save_album_to_db(album_info)
            print("专辑信息已保存到数据库")
        except Exception as e:
            print(f"发生错误: {e}")
            continue