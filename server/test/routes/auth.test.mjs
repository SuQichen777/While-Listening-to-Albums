// server/test/routes/auth.test.mjs
import { expect } from "chai";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../../src/app.mjs";
import { User, Mark } from "../../src/models/db.mjs";

const album = {
  title: "船骸", artistName: "刘炫廷, Doggie", type: "album", totalTracks: 10, releaseDate: "2024-08-25",
  neteaseId: "249042739", neteaseUrl: "https://music.163.com/album?id=249042739", rawArtists: [],
};

async function register(username, extra = {}) {
  const res = await request(app).post("/api/v1/auth/register").send({ username, password: "correct horse", ...extra });
  return res;
}

describe("Users and login", function () {
  let mongod;
  let alice;
  let bob;

  before(async function () {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await Promise.all([User.init(), Mark.init()]);
  });

  after(async function () {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
  });

  describe("POST /auth/register", function () {
    it("creates a user and returns a token, never the password", async function () {
      const res = await register("Alice", { email: "Alice@Example.com" });
      expect(res.status).to.equal(201);
      expect(res.body.token).to.be.a("string");
      expect(res.body.user).to.include({ username: "Alice", email: "alice@example.com" });
      expect(JSON.stringify(res.body)).to.not.include("assword");
      alice = res.body.token;

      const saved = await User.findOne({ usernameLower: "alice" }).select("+passwordHash");
      expect(saved.passwordHash).to.match(/^\$2[aby]\$12\$/); // bcrypt, cost 12
    });

    it("rejects a taken username (ignoring case) and a taken email", async function () {
      expect((await register("alice")).status).to.equal(409);
      expect((await register("alice2", { email: "alice@example.com" })).status).to.equal(409);
    });

    it("rejects bad input", async function () {
      expect((await register("a")).status).to.equal(400);
      expect((await register("carol", { password: "short" })).status).to.equal(400);
      expect((await register("carol", { email: "not-an-email" })).status).to.equal(400);
      expect((await register({ $ne: null })).status).to.equal(400);
    });
  });

  describe("POST /auth/login", function () {
    it("logs in with username or email", async function () {
      const byName = await request(app).post("/api/v1/auth/login").send({ login: "ALICE", password: "correct horse" });
      expect(byName.status).to.equal(200);
      expect(byName.body.token).to.be.a("string");
      const byEmail = await request(app).post("/api/v1/auth/login").send({ login: "alice@example.com", password: "correct horse" });
      expect(byEmail.status).to.equal(200);
    });

    it("gives the same answer for a wrong password and an unknown user", async function () {
      const wrong = await request(app).post("/api/v1/auth/login").send({ login: "alice", password: "wrong horse" });
      const unknown = await request(app).post("/api/v1/auth/login").send({ login: "nobody", password: "correct horse" });
      expect(wrong.status).to.equal(401);
      expect(unknown.status).to.equal(401);
      expect(wrong.body).to.deep.equal(unknown.body);
    });

    it("does not accept query objects", async function () {
      const res = await request(app).post("/api/v1/auth/login").send({ login: { $ne: null }, password: { $ne: null } });
      expect(res.status).to.equal(400);
    });
  });

  describe("GET /auth/me", function () {
    it("returns the user of the token", async function () {
      const res = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${alice}`);
      expect(res.status).to.equal(200);
      expect(res.body.user.username).to.equal("Alice");
    });

    it("rejects a missing or broken token", async function () {
      expect((await request(app).get("/api/v1/auth/me")).status).to.equal(401);
      expect((await request(app).get("/api/v1/auth/me").set("Authorization", "Bearer nonsense")).status).to.equal(401);
    });

    it("rejects the token of a deleted user", async function () {
      const res = await register("temporary");
      await User.deleteOne({ usernameLower: "temporary" });
      const me = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${res.body.token}`);
      expect(me.status).to.equal(401);
    });
  });

  describe("Music belongs to a user", function () {
    before(async function () {
      bob = (await register("bob")).body.token;
    });

    it("needs a login", async function () {
      expect((await request(app).get("/api/v1/music/all")).status).to.equal(401);
      expect((await request(app).post("/api/v1/music/search").send({ title: "x" })).status).to.equal(401);
      expect((await request(app).post("/api/v1/music/add").send(album)).status).to.equal(401);
    });

    it("what alice adds is in her list and not in bob's", async function () {
      const add = await request(app).post("/api/v1/music/add").set("Authorization", `Bearer ${alice}`).send(album);
      expect(add.status).to.equal(201);
      const mine = await request(app).get("/api/v1/music/all").set("Authorization", `Bearer ${alice}`);
      expect(mine.body.map(m => m.title)).to.deep.equal(["船骸"]);
      const his = await request(app).get("/api/v1/music/all").set("Authorization", `Bearer ${bob}`);
      expect(his.body).to.deep.equal([]);
    });

    it("adding twice is refused, bob adding the same album reuses the catalog", async function () {
      const again = await request(app).post("/api/v1/music/add").set("Authorization", `Bearer ${alice}`).send(album);
      expect(again.status).to.equal(400);
      const spotifySide = { ...album, spotifyId: "sp1", spotifyUrl: "https://open.spotify.com/album/sp1" };
      const bobAdd = await request(app).post("/api/v1/music/add").set("Authorization", `Bearer ${bob}`).send(spotifySide);
      expect(bobAdd.status).to.equal(201);
      expect(bobAdd.body.slug).to.equal("船骸-刘炫廷-doggie");
      // the catalog learned the Spotify link from bob, alice sees it too
      const detail = await request(app).get(`/api/v1/music/${encodeURIComponent("船骸-刘炫廷-doggie")}`).set("Authorization", `Bearer ${alice}`);
      expect(detail.body).to.include({ spotifyId: "sp1", inLibrary: true });
    });

    it("removing only touches my own list", async function () {
      const url = `/api/v1/music/${encodeURIComponent("船骸-刘炫廷-doggie")}`;
      expect((await request(app).delete(url).set("Authorization", `Bearer ${bob}`)).status).to.equal(200);
      expect((await request(app).delete(url).set("Authorization", `Bearer ${bob}`)).status).to.equal(404);
      const mine = await request(app).get("/api/v1/music/all").set("Authorization", `Bearer ${alice}`);
      expect(mine.body).to.have.length(1);
    });
  });

  describe("Blogs are private by default", function () {
    it("only the author can list and read a private blog", async function () {
      const create = await request(app).post("/api/v1/blog/create").set("Authorization", `Bearer ${alice}`)
        .send({ title: "Secret thoughts", content: "only for me", rate: 8.5 });
      expect(create.status).to.equal(201);

      const mine = await request(app).get("/api/v1/blog/all").set("Authorization", `Bearer ${alice}`);
      expect(mine.body.map(b => b.title)).to.deep.equal(["Secret thoughts"]);
      const his = await request(app).get("/api/v1/blog/all").set("Authorization", `Bearer ${bob}`);
      expect(his.body).to.deep.equal([]);

      expect((await request(app).get("/api/v1/blog/secret-thoughts").set("Authorization", `Bearer ${alice}`)).status).to.equal(200);
      expect((await request(app).get("/api/v1/blog/secret-thoughts").set("Authorization", `Bearer ${bob}`)).status).to.equal(404);
      expect((await request(app).get("/api/v1/blog/secret-thoughts")).status).to.equal(401);
    });

    it("a public blog can be read by others, but stays out of their list", async function () {
      await request(app).post("/api/v1/blog/create").set("Authorization", `Bearer ${alice}`)
        .send({ title: "Open letter", content: "for everyone", isPublic: true });
      const read = await request(app).get("/api/v1/blog/open-letter").set("Authorization", `Bearer ${bob}`);
      expect(read.status).to.equal(200);
      expect(read.body).to.include({ isMine: false });
      expect(read.body.author.username).to.equal("Alice");
      const his = await request(app).get("/api/v1/blog/all").set("Authorization", `Bearer ${bob}`);
      expect(his.body).to.deep.equal([]);
    });
  });
});
