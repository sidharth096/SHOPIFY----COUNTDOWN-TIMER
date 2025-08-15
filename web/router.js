import express from "express";
import { createBadge, getBadges } from "./controller/badgeController.js";

const router = express.Router();

router.post("/createBadge",createBadge ) 
router.get("/getBadges", getBadges)


export default router;  