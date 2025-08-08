
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import groupRoutes from './routes/group.route.js';

import path from 'path';

import { connectDB } from './lib/db.js';
import { io, app, server } from './lib/socket.js';

dotenv.config();

const PORT = process.env.PORT || 5001;

const __dirname = path.resolve();


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

console.log("Loading /api/auth...");
app.use("/api/auth", authRoutes);

console.log("Loading /api/messages...");
app.use("/api/messages", messageRoutes);

console.log("Loading /api/groups...");
app.use("/api/groups", groupRoutes);

console.log("All routes mounted successfully");


if(process.env.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname, '../frontend/dist')));

    app.get('/*', (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend","dist","index.html"));
    });
}

server.listen(5001,() => {
    console.log('Server is running on port:'+ PORT);
    connectDB();
});


