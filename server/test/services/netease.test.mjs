// server/test/services/netease.test.mjs
import { expect } from "chai";
import { isNeteaseAlbumUrl } from "../../src/services/netease.mjs";

describe("isNeteaseAlbumUrl", function () {
  it("recognizes album links, with or without /#/", function () {
    expect(isNeteaseAlbumUrl("https://music.163.com/#/album?id=1698619")).to.equal(true);
    expect(isNeteaseAlbumUrl("https://music.163.com/album?id=159831321&userid=433293042")).to.equal(true);
  });

  it("rejects songs and plain keywords", function () {
    expect(isNeteaseAlbumUrl("https://music.163.com/song?id=5")).to.equal(false);
    expect(isNeteaseAlbumUrl("OK Computer")).to.equal(false);
  });
});
