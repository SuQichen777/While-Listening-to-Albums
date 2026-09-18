import mongoose from "mongoose";
import mongooseSlugPlugin from 'mongoose-slug-plugin';

const ArtistSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, default: "" },
    spotifyId: { type: String, default: "" }, // Spotify ID
    description: { type: String, default: "This an artist" },
});

const MusicSchema = new mongoose.Schema({
    title: { type: String, required: true },
    artistName: { type: String }, // name of the artist, used for slug
    image: { type: String, default: "" },
    type: { type: String, enum: ["album", "single", "other"], required: true },
    releaseDate: { type: Date },
    description: { type: String },
    artists: [{ type: mongoose.Schema.Types.ObjectId, ref: "Artist" }], // array of artist IDs
    totalTracks: { type: Number, default: 0 }, // total tracks in the album
    // streaming links, either side can be empty
    spotifyId: { type: String, default: "" },
    spotifyUrl: { type: String, default: "" },
    neteaseId: { type: String, default: "" },
    neteaseUrl: { type: String, default: "" },
});

const BlogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    cover: { type: String, default: "" },
    content: { type: String, default: "" },
    rate: { type: Number, default: 0, min: 0, max: 10 }, // 1-10 and decimals are fine, 0 means not rated
    // author: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // the author of the blog
    createDate: { type: Date, default: Date.now },
    referredWorkNumber: { type: Number, default: 0 }, // number of referred works
    referredWork: [
        {
            item: { type: mongoose.Schema.Types.ObjectId, refPath: 'referredModel' },
            referredModel: { type: String, enum: ['Music'] }
        }
    ] // the referred work can have multiple musics
});

// the default slug function of the plugin drops every Chinese character ("船骸" -> ""),
// this one keeps letters and numbers of any language: "船骸 - Doggie" -> "船骸-doggie"
function slugify(text) {
    const slug = String(text).normalize("NFKC").toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "");
    return slug || "untitled";
}

ArtistSchema.plugin(mongooseSlugPlugin, { tmpl: '<%= name %>', slug: slugify });
MusicSchema.plugin(mongooseSlugPlugin, { tmpl: '<%= title %>-<%= artistName %>', slug: slugify });
BlogSchema.plugin(mongooseSlugPlugin, { tmpl: '<%= title %>', slug: slugify });

const Artist = mongoose.model("Artist", ArtistSchema);
const Music = mongoose.model("Music", MusicSchema);
const Blog = mongoose.model("Blog", BlogSchema);

export { Artist, Music, Blog };
