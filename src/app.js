import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
const app = express();
app.use(morgan("dev"));
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import

import userrouter from "./routes/user.Routes.js";
import videorouter from "./routes/video.Routes.js"

//routes declaration

app.use("/api/v1/users", userrouter);
app.use('/api/v1/video',videorouter)

export default app;
