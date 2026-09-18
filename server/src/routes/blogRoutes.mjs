import express from "express";
import { Blog, Music } from "../models/db.mjs";

const router = express.Router();

// Show all blogs
router.get("/all", async (req, res) => {
  try {
    const blogs = await Blog.find()
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
    const blog = await Blog.findOne({ slug: req.params.slug }).lean(); // lean: 返回纯 JS 对象

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

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
  const { title, content, rate, referredWork, referredWorkNumber } = req.body;
  let { cover } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required." });
  }

  if (rate && (rate < 0 || rate > 10)) {
    return res.status(400).json({ error: "Rate must be between 0 and 10." });
  }

  if (referredWork && !Array.isArray(referredWork)) {
    return res.status(400).json({ error: "Referred work must be an array." });
  }

  try {
    // Check whether any referred work exists
    if (!cover && referredWork && referredWork.length > 0) {
      // Set the link of cover image to the first referred work
      const music = await Music.findById(referredWork[0].item).select("image").lean();
      if (music) {
        cover = music.image;
      }
    }

    const blog = new Blog({
      title,
      cover: cover || "",
      content,
      rate: rate || 0,
      referredWork: referredWork || [],
      referredWorkNumber: referredWorkNumber || (referredWork ? referredWork.length : 0),
    });

    await blog.save();
    res.status(201).json({ success: true, blogId: blog._id, slug: blog.slug });
  } catch (err) {
    console.error("Error creating blog:", err);
    res.status(500).json({ error: "Server error creating blog." });
  }
});

export default router;
