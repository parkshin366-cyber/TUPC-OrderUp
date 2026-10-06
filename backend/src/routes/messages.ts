import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { getConversations, getMessages, sendMessage } from "../controllers/messageController";

const router = Router();
router.get("/conversations", authenticate, getConversations);
router.get("/:conversationId", authenticate, getMessages);
router.post("/", authenticate, sendMessage);
export default router;
