# album.py
from pymongo.collection import Collection
#import datetime
from datetime import datetime



class AlbumModel:
    def __init__(self, db: Collection):
        self.db = db
    

    def get_album_info_from_db(self, album_id: str):
        album = self.db.find_one({"album_id": album_id})
        if album:
            return {
                "album_id": album["album_id"],
                "add_date": album["add_date"],
                "url": album["url"],
                'release_date': album["release_date"],
                "title": album["title"],
                "artists": album["artists"],
                "cover_url": album["cover_url"],
                "description": album["description"]
            }
        else:
            return None
        
    def save_album_info_to_db(self, album_info: dict):
        album_id = album_info["album_id"]
        existing_album = self.db.find_one({"album_id": album_id})
        if existing_album:
            self.db.update_one({"album_id": album_id}, {"$set": album_info})
        else:
            new_album = {
                "album_id": album_id,
                # add date is the current date
                "add_date": datetime.now(),
                "url": album_info["url"],
                "release_date": album_info["release_date"],
                "title": album_info["title"],
                "artists": album_info["artists"],
                "cover_url": album_info["cover_url"],
                "description": album_info["description"]
            }
            self.db.insert_one(new_album)
        return album_info
    
    def delete_album_info_from_db(self, album_id: str):
        result = self.db.delete_one({"album_id": album_id})
        if result.deleted_count > 0:
            return True
        else:
            return False
        
    def get_all_albums(self):
        albums = self.db.find()
        return [
            {
                "album_id": album["album_id"],
                "add_date": album["add_date"],
                "url": album["url"],
                'release_date': album["release_date"],
                "title": album["title"],
                "artists": album["artists"],
                "cover_url": album["cover_url"],
                "description": album["description"]
            }
            for album in albums
        ]
    
    def get_album_by_add_year(self, year: int):
        # only get the year from the add_date
        albums = self.db.find({"add_date": {"$regex": f"^{year}"}})
        return [
            {
                "album_id": album["album_id"],
                "add_date": album["add_date"],
                "url": album["url"],
                'release_date': album["release_date"],
                "title": album["title"],
                "artists": album["artists"],
                "cover_url": album["cover_url"],
                "description": album["description"]
            }
            for album in albums
        ]
    
    def get_album_by_release_year(self, year: int):
        # only get the year from the release_date
        albums = self.db.find({"release_date": {"$regex": f"^{year}"}})
        return [
            {
                "album_id": album["album_id"],
                "add_date": album["add_date"],
                "url": album["url"],
                'release_date': album["release_date"],
                "title": album["title"],
                "artists": album["artists"],
                "cover_url": album["cover_url"],
                "description": album["description"]
            }
            for album in albums
        ]
    
    def get_album_by_title(self, title: str):
        albums = self.db.find({"title": {"$regex": title}})
        return [
            {
                "album_id": album["album_id"],
                "add_date": album["add_date"],
                "url": album["url"],
                'release_date': album["release_date"],
                "title": album["title"],
                "artists": album["artists"],
                "cover_url": album["cover_url"],
                "description": album["description"]
            }
            for album in albums
        ]


