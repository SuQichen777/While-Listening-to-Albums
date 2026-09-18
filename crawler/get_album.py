import re
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Referer': 'https://music.163.com/',
}

_album_model = None


def get_album_model():
    # 连接到 MongoDB 数据库（懒加载，只在真的要存库的时候才连）
    global _album_model
    if _album_model is None:
        from pymongo import MongoClient
        from models.albums import AlbumModel
        client = MongoClient(os.getenv('netEaseGetterDSN'))
        db = client.get_database('netEaseGetter')
        albumCollection = db.get_collection('album')
        _album_model = AlbumModel(albumCollection)
    return _album_model


def parse_album_id(url):
    # url给的例子：https://music.163.com/album?id=159831321&userid=433293042
    # 或者 https://music.163.com/#/album?id=159831321
    # 先看看是song还是album
    if url.find('album') == -1:
        return None
    match = re.search(r'[?&]id=(\d+)', url)
    return match.group(1) if match else None


def get_album_info(album_id=None, url=None):
    if url is None and album_id is None:
        print("没有给专辑 ID 或 URL")
        album_id = '1698619'
    elif url is not None:
        # 如果直接给专辑 URL 或者 给了 URL也给了ID 就直接用 URL
        album_id = parse_album_id(url)
        if album_id is None:
            print("没给专辑 URL或者不是专辑")
            return None
        print(f"给了专辑 URL: {url}")
    else:
        # 如果只给了专辑 ID
        print(f"只给了专辑 ID: {album_id}")
    # 不保留 "/#" 和 &userid=... 之类的参数
    url = f'https://music.163.com/album?id={album_id}'

    response = requests.get(url, headers=HEADERS, timeout=10)
    soup = BeautifulSoup(response.text, 'html.parser')
    # print(f"获取到的页面内容：{soup.prettify()}")

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
        # 网易云有时只返回外层框架页（没有专辑内容），这时改用 JSON 接口
        print("没找到对应栏目，改用 JSON 接口")
        return get_album_info_from_api(album_id)
    artist_tag = intr_info[0]
    artists = [a.text.strip() for a in artist_tag.find_all('a')]
    if not artists:
        artists = ["未知作者"]
    # 格式是 发行时间：2024-05-18，只要后面的日期
    release_date = ''
    if len(intr_info) > 1 and '：' in intr_info[1].text:
        release_date = intr_info[1].text.strip().split('：')[1]

    # 封面图
    cover_tag = soup.find('img', class_='j-img')
    cover_url = cover_tag['src'] if cover_tag else ''
    if cover_tag and cover_tag.get('data-src'):
        # data-src 是不带 ?param=177y177 的原图
        cover_url = cover_tag['data-src']

    # 简介（介绍字段只在专辑页存在）
    desc_tag = soup.find('div', id='album-desc-more')
    description = desc_tag.text.strip() if desc_tag else '无简介'

    return {
        'album_id': album_id,
        'url': url,
        'release_date': release_date,
        'title': album_title,
        'artists': artists,
        'cover_url': cover_url,
        'description': description
    }


def format_album(album):
    # 把网易云 JSON 接口里的 album 整理成和 get_album_info 同样形状的 dict
    publish_time = album.get('publishTime')
    release_date = ''
    if publish_time:
        release_date = datetime.fromtimestamp(publish_time / 1000).strftime('%Y-%m-%d')
    return {
        'album_id': str(album['id']),
        'url': f"https://music.163.com/album?id={album['id']}",
        'release_date': release_date,
        'title': album.get('name', ''),
        'artists': [a['name'] for a in album.get('artists', [])] or ["未知作者"],
        'cover_url': (album.get('picUrl') or '').replace('http://', 'https://'),
        'description': album.get('description') or '无简介',
        'total_tracks': album.get('size', 0),
    }


def get_album_info_from_api(album_id):
    response = requests.get(
        f'https://music.163.com/api/v1/album/{album_id}',
        headers=HEADERS,
        timeout=10,
    )
    data = response.json()
    if data.get('code') != 200 or not data.get('album'):
        print("JSON 接口也没找到专辑")
        return None
    return format_album(data['album'])


def search_albums(keyword, limit=10):
    # 网易云的专辑搜索（type=10 是专辑），返回和 get_album_info 同样形状的 dict
    response = requests.get(
        'https://music.163.com/api/search/get',
        params={'s': keyword, 'type': 10, 'limit': limit, 'offset': 0},
        headers=HEADERS,
        timeout=10,
    )
    data = response.json()
    albums = (data.get('result') or {}).get('albums') or []
    return [format_album(album) for album in albums]


def save_album_to_db(album_info):
    get_album_model().save_album_info_to_db(album_info)
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
        except (EOFError, KeyboardInterrupt):
            break
        except Exception as e:
            print(f"发生错误: {e}")
            continue
