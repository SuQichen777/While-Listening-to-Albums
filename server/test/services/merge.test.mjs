// server/test/services/merge.test.mjs
import { expect } from "chai";
import { normalize, isSameAlbum, mergeResults } from "../../src/services/merge.mjs";

const spotifyAlbum = {
  title: "OK Computer", artistName: "Radiohead", releaseDate: "1997-05-21",
  spotifyId: "sp1", spotifyUrl: "https://open.spotify.com/album/sp1", description: "from spotify",
};
const neteaseAlbum = {
  title: "OK Computer", artistName: "Radiohead", releaseDate: "1997-05-20",
  neteaseId: "2060534", neteaseUrl: "https://music.163.com/album?id=2060534", description: "from netease",
};

describe("Search merge", function () {
  it("normalize ignores case, brackets and punctuation", function () {
    expect(normalize("OK Computer (Remastered)")).to.equal("okcomputer");
    expect(normalize("船骸【豪华版】")).to.equal("船骸");
  });

  it("same title with a shared artist is the same album", function () {
    expect(isSameAlbum(spotifyAlbum, { ...neteaseAlbum, artistName: "Radiohead, Someone" })).to.equal(true);
  });

  it("translated artist names still match when released in the same year", function () {
    const a = { title: "范特西", artistName: "Jay Chou", releaseDate: "2001-09-14" };
    const b = { title: "范特西", artistName: "周杰伦", releaseDate: "2001-09-01" };
    expect(isSameAlbum(a, b)).to.equal(true);
    expect(isSameAlbum(a, { ...b, releaseDate: "2010-01-01" })).to.equal(false);
  });

  it("different titles never match", function () {
    expect(isSameAlbum(spotifyAlbum, { ...neteaseAlbum, title: "Kid A" })).to.equal(false);
  });

  it("mergeResults puts both links on a matched album and keeps the rest", function () {
    const other = { title: "Kid A", artistName: "Radiohead", neteaseId: "9", neteaseUrl: "u" };
    const merged = mergeResults([spotifyAlbum], [other, neteaseAlbum]);
    expect(merged).to.have.length(2);
    expect(merged[0]).to.include({ spotifyId: "sp1", neteaseId: "2060534", description: "from netease" });
    expect(merged[1]).to.include({ title: "Kid A", spotifyId: "", neteaseId: "9" });
  });

  it("one NetEase album is only used once", function () {
    const merged = mergeResults([spotifyAlbum, { ...spotifyAlbum, spotifyId: "sp2" }], [neteaseAlbum]);
    expect(merged.map(m => m.neteaseId)).to.deep.equal(["2060534", ""]);
  });
});
