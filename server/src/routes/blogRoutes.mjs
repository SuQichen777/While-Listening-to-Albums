import express from "express";
import mongoose from "mongoose";
import { Blog, Music } from "../models/db.mjs";
import { requireAuth } from "../middleware/auth.mjs";

const router = express.Router();

// blogs are private: everything here belongs to a logged-in user
router.use(requireAuth);

// Show all my blogs
router.get("/all", async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user._id })
      .sort({ createDate: -1 })
      .select("-__v");
    res.json(blogs);
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).json({ error: "Error retrieving blogs." });
  }
});

// Specific Blog Detail Page
router.get("/:slug", async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug }).populate("author", "username").lean(); // lean: 返回纯 JS 对象

    // someone else's private blog looks exactly like a missing one
    const isMine = blog && blog.author && blog.author._id.equals(req.user._id);
    if (!blog || (!isMine && !blog.isPublic)) {
      return res.status(404).json({ error: "Blog not found" });
    }

    blog.isMine = Boolean(isMine);
    blog.referredWork = await Promise.all(
      (blog.referredWork || []).map(async (ref) => {
        const doc = await Music.findById(ref.item).select("title image artistName slug").lean();
        return { ...ref, item: doc || null };
      })
    );

    res.json(blog);
  } catch (err) {
    console.error("Error fetching blog:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create a new blog
router.post("/create", async (req, res) => {
  const { title, content, rate, referredWork, isPublic } = req.body;
  let { cover } = req.body;

  if (typeof title !== "string" || typeof content !== "string" || !title.trim() || !content.trim()) {
    return res.status(400).json({ error: "Title and content are required." });
  }

  if (rate && (typeof rate !== "number" || rate < 0 || rate > 10)) {
    return res.status(400).json({ error: "Rate must be between 0 and 10." });
  }

  if (referredWork && !Array.isArray(referredWork)) {
    return res.status(400).json({ error: "Referred work must be an array." });
  }
  const works = (referredWork || []).map(work => ({ item: work?.item, referredModel: "Music" }));
  if (works.some(work => !mongoose.isValidObjectId(work.item))) {
    return res.status(400).json({ error: "Referred work is not a music." });
  }

  try {
    // Check whether any referred work exists
    if (!cover && works.length > 0) {
      // Set the link of cover image to the first referred work
      const music = await Music.findById(works[0].item).select("image").lean();
      if (music) {
        cover = music.image;
      }
    }

    const blog = new Blog({
      title,
      cover: typeof cover === "string" ? cover : "",
      content,
      rate: rate || 0,
      author: req.user._id,
      isPublic: isPublic === true,
      referredWork: works,
      referredWorkNumber: works.length,
    });

    await blog.save();
    res.status(201).json({ success: true, blogId: blog._id, slug: blog.slug });
  } catch (err) {
    console.error("Error creating blog:", err);
    res.status(500).json({ error: "Server error creating blog." });
  }
});

export default router;
