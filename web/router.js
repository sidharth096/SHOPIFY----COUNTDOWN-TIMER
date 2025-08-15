import express from "express";
import { createBadge, getBadge, getBadges, updateBadge } from "./controller/badgeController.js";

const router = express.Router();

router.post("/createBadge",createBadge ) 
router.get("/getBadges", getBadges)
router.get("/getBadge/:id", getBadge)
router.put("/updateBadge/:id", updateBadge) // Assuming createBadge handles updates as well

export default router;  