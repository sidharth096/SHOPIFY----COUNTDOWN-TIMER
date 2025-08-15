import express from "express";
import { createBadge } from "./controller/badgeController.js";

const router = express.Router();

router.post("/createBadge",createBadge ) 


export default router;  