// server/test/models/db.test.mjs
import { expect } from "chai";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { User, Artist, Music, Mark, Blog } from "../../src/models/db.mjs";

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

  /* ---------- User ---------- */
  describe("UserSchema", function () {
    it("should reject bad usernames and require passwordHash", function () {
      const err = new User({ username: "no spaces!" }).validateSync();
      expect(err.errors).to.have.property("username");
      expect(err.errors).to.have.property("passwordHash");
    });

    it("usernames are unique ignoring case, email is optional", async function () {
      await User.init();
      const first = await User.create({ username: "Jiaxi", passwordHash: "x" });
      expect(first.usernameLower).to.equal("jiaxi");
      await User.create({ username: "someone_else", passwordHash: "x" }); // a second user without email is fine
      let error = null;
      try {
        await User.create({ username: "JIAXI", passwordHash: "x" });
      } catch (err) {
        error = err;
      }
      expect(error?.code).to.equal(11000);
    });

    it("passwordHash is not selected by default", async function () {
      const user = await User.findOne({ usernameLower: "jiaxi" });
      expect(user.passwordHash).to.equal(undefined);
    });
  });

  /* ---------- Mark ---------- */
  describe("MarkSchema", function () {
    it("one user can mark a music only once", async function () {
      await Mark.init();
      const user = await User.findOne({ usernameLower: "jiaxi" });
      const music = await Music.create({ title: "Discovery", type: "album", artistName: "Daft Punk" });
      await Mark.create({ user: user._id, music: music._id });
      let error = null;
      try {
        await Mark.create({ user: user._id, music: music._id });
      } catch (err) {
        error = err;
      }
      expect(error?.code).to.equal(11000);
    });
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
    it("should require an author", function () {
      const err = new Blog({ title: "Nobody wrote this" }).validateSync();
      expect(err.errors).to.have.property("author");
    });

    it("referredWorkNumber should default to 0 and allow multiple references", async function () {
      const author = await User.findOne({ usernameLower: "jiaxi" });
      const b = await Blog.create({ title: "My Empty Blog", author: author._id });
      expect(b.referredWorkNumber).to.equal(0);
      expect(b.isPublic).to.equal(false);
      expect(b.referredWork).to.have.length(0);
    });

    it("rate accepts decimals up to 10", function () {
      expect(new Blog({ title: "ok", rate: 8.5 }).validateSync("rate")).to.equal(undefined);
      const err = new Blog({ title: "too high", rate: 11 }).validateSync("rate");
      expect(err.errors).to.have.property("rate");
    });
  });
});
