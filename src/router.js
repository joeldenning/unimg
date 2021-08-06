import express from "express";
import path from "path";
import Router from "express-promise-router";

export const router = Router();

router.use("/static", express.static(path.join(process.cwd(), "static")));
