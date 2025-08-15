import express from "express";
import { createBadge, deleteBadge, getBadge, getBadges, updateBadge } from "./controller/badgeController.js";

const router = express.Router();

router.post("/createBadge", createBadge)
router.get("/getBadges", getBadges)
router.get("/getBadge/:id", getBadge)
router.put("/updateBadge/:id", updateBadge)
router.delete("/deleteBadge/:id", deleteBadge)

export default router;  