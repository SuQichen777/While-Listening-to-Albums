import './config.mjs';
import express from 'express';
import path from 'path';
import mongoose from "mongoose";
import cors from "cors";
import { fileURLToPath } from 'url';

import authRoutes from "./routes/authRoutes.mjs";
import musicRoutes from "./routes/musicRoutes.mjs";
import blogRoutes from "./routes/blogRoutes.mjs";
const app = express();
if (process.env.TRUST_PROXY) {
    // number of reverse proxies in front of the server, so the rate limit sees the real ip
    app.set('trust proxy', Number(process.env.TRUST_PROXY));
}
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth routes: register, login, me
app.use("/api/v1/auth", authRoutes);
// Music routes
app.use("/api/v1/music", musicRoutes);
// Blog routes
app.use("/api/v1/blog", blogRoutes);

// unknown api
app.use("/api", (req, res) => {
    res.status(404).json({ error: "Not found" });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// serve static files
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
// every other page belongs to the React router
app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
        if (err) {
            res.status(404).send('Client is not built yet, run "npm run build" in client/');
        }
    });
});

// the tests import app and bring their own database
if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(process.env.DSN).then(() => {
        console.log("Connected to MongoDB");
    }).catch((err) => {
        console.log("Error connecting to MongoDB", err);
    });

    app.listen(process.env.PORT || 3000);
}

export default app;
