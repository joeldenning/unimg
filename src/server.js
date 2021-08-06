import express from "express";
import { router } from "./router.js";
import "./route-imports.js";

const app = express();
app.use(router);

const port = process.env.PORT || 8080;
app.listen(port);

console.log(`HTTP server listening on port ${port}`);
