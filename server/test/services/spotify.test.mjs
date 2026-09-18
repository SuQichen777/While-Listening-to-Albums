// server/test/services/spotify.test.mjs
import { expect } from "chai";
import { spotifyAlbumToMusic } from "../../src/services/spotify.mjs";

// shape of one item of GET /v1/search?type=album
const album = {
  album_type: "album",
  total_tracks: 12,
  external_urls: { spotify: "https://open.spotify.com/album/21jF5jlMtzo94wbxmJ18aa" },
  id: "21jF5jlMtzo94wbxmJ18aa",
  images: [{ url: "https://i.scdn.co/image/big" }, { url: "https://i.scdn.co/image/small" }],
  name: "30",
  release_date: "2021-11-19",
  artists: [{ id: "4dpARuHxo51G3z768sgnrY", name: "Adele", external_urls: { spotify: "https://open.spotify.com/artist/4dpARuHxo51G3z768sgnrY" } }],
};

describe("spotifyAlbumToMusic", function () {
  it("maps a Spotify album to Music fields", function () {
    const music = spotifyAlbumToMusic(album);
    expect(music).to.include({
      title: "30",
      spotifyId: "21jF5jlMtzo94wbxmJ18aa",
      spotifyUrl: "https://open.spotify.com/album/21jF5jlMtzo94wbxmJ18aa",
      image: "https://i.scdn.co/image/big",
      type: "album",
      totalTracks: 12,
      artistName: "Adele",
    });
    expect(music.rawArtists).to.have.length(1);
  });

  it("compilations become other, and a missing cover is fine", function () {
    const music = spotifyAlbumToMusic({ ...album, album_type: "compilation", images: [] });
    expect(music.type).to.equal("other");
    expect(music.image).to.equal("");
  });
});
