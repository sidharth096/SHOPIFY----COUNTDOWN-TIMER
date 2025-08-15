import express from "express";
import { createBadge, getBadge, getBadges } from "./controller/badgeController.js";

const router = express.Router();

router.post("/createBadge",createBadge ) 
router.get("/getBadges", getBadges)
router.get("/getBadge/:id", getBadge)


export default router;  