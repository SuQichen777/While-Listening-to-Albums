# cli.py
# 给 Node 后端调用的入口：stdout 只输出一行 JSON，其他日志都走 stderr
#   python cli.py album --id 1698619
#   python cli.py album --url "https://music.163.com/#/album?id=1698619"
#   python cli.py search --keyword "船骸" --limit 5
import argparse
import contextlib
import json
import sys

from get_album import get_album_info, search_albums


def main():
    parser = argparse.ArgumentParser(description='NetEase Cloud Music album crawler')
    sub = parser.add_subparsers(dest='command', required=True)

    album = sub.add_parser('album', help='crawl one album page')
    album.add_argument('--id', dest='album_id')
    album.add_argument('--url')

    search = sub.add_parser('search', help='search albums by keyword')
    search.add_argument('--keyword', required=True)
    search.add_argument('--limit', type=int, default=10)

    args = parser.parse_args()

    try:
        with contextlib.redirect_stdout(sys.stderr):
            if args.command == 'album':
                if not args.album_id and not args.url:
                    raise ValueError('album needs --id or --url')
                result = get_album_info(args.album_id, args.url)
                if result is None:
                    raise ValueError('album not found')
            else:
                result = search_albums(args.keyword, args.limit)
    except Exception as e:
        print(json.dumps({'ok': False, 'error': str(e)}, ensure_ascii=False))
        sys.exit(1)

    print(json.dumps({'ok': True, 'data': result}, ensure_ascii=False))


if __name__ == '__main__':
    main()
