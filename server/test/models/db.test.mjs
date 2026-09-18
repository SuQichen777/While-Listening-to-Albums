// server/test/models/db.test.mjs
import { expect } from "chai";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { Artist, Music, Blog } from "../../src/models/db.mjs";

describe("Mongoose Schemas", function () {
  let mongod;

  /* ---------- global connect / disconnect ---------- */
  before(async function () {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  });

  after(async function () {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
  });

  /* ---------- Artist ---------- */
  describe("ArtistSchema", function () {
    it("should require name", function () {
      const a = new Artist({}); // missing name
      const err = a.validateSync(); // sync validate
      expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
      expect(err.errors).to.have.property("name");
    });

    it("should generate slug on save", async function () {
      const a = await Artist.create({ name: "Daft Punk" });
      expect(a.slug).to.equal("daft-punk");
    });
  });

    it("should keep Chinese names in the slug", async function () {
      const a = await Artist.create({ name: "刘炫廷" });
      expect(a.slug).to.equal("刘炫廷");
      const same = await Artist.create({ name: "刘炫廷" });
      expect(same.slug).to.equal("刘炫廷-1");
    });

  /* ---------- Music ---------- */
  describe("MusicSchema", function () {
    it("enum validation for type", function () {
      const m = new Music({
        title: "Bad Type",
        type: "movie", // invalid enum value
      });
      const err = m.validateSync();
      expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
      expect(err.errors.type.kind).to.equal("enum");
    });

    it("totalTracks should default to 0 and streaming links to empty", async function () {
      const m = await Music.create({
        title: "Random Access Memories",
        type: "album",
        artistName: "Daft Punk",
      });
      expect(m.totalTracks).to.equal(0);
      expect(m.spotifyUrl).to.equal("");
      expect(m.neteaseUrl).to.equal("");
      expect(m.slug).to.equal("random-access-memories-daft-punk");
    });
  });

  /* ---------- Blog ---------- */
  describe("BlogSchema", function () {
    it("referredWorkNumber should default to 0 and allow multiple references", async function () {
      const b = await Blog.create({ title: "My Empty Blog" });
      expect(b.referredWorkNumber).to.equal(0);
      expect(b.referredWork).to.have.length(0);
    });

    it("rate accepts decimals up to 10", function () {
      expect(new Blog({ title: "ok", rate: 8.5 }).validateSync("rate")).to.equal(undefined);
      const err = new Blog({ title: "too high", rate: 11 }).validateSync("rate");
      expect(err.errors).to.have.property("rate");
    });
  });
});
