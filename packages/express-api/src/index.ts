import express from "express";
import { ENV, PORT } from "./config/config";

const app = express();

app.use(express.json({}));

app.get("/", (_req, res) => {
  res.json({ message: "Hello World" });
});

app.listen(PORT, function () {
  console.info(`Server Running in ${ENV} on port ${PORT}`);
});
