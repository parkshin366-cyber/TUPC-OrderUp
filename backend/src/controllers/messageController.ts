import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth";
import Conversation from "../models/Conversation";
import Message from "../models/Message";
import Order from "../models/Order";
import User from "../models/User";

function conversationQuery(userId: string) {
  return { $or: [{ client: userId }, { seller: userId }] };
}

export async function getConversations(req: AuthRequest, res: Response) {
  try {
    const conversations = await Conversation.find(conversationQuery(String(req.userId)))
      .populate("client", "firstName lastName username")
      .populate("seller", "firstName lastName username")
      .sort({ lastMessageAt: -1, updatedAt: -1 });
    return res.json({ success: true, conversations });
  } catch (error) {
    console.error("Get conversations error:", error);
    return res.status(500).json({ success: false, message: "Unable to load conversations." });
  }
}

export async function getMessages(req: AuthRequest, res: Response) {
  try {
    const conversationId = String(req.params.conversationId);
    if (!mongoose.Types.ObjectId.isValid(conversationId)) return res.status(400).json({ success: false, message: "Invalid conversation." });
    const conversation = await Conversation.findOne({ _id: conversationId, ...conversationQuery(String(req.userId)) });
    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found." });
    const messages = await Message.find({ conversation: conversation._id }).populate("sender", "firstName lastName username").sort({ createdAt: 1 });
    await Message.updateMany({ conversation: conversation._id, sender: { $ne: req.userId }, readAt: { $exists: false } }, { $set: { readAt: new Date() } });
    return res.json({ success: true, conversation, messages });
  } catch (error) {
    console.error("Get messages error:", error);
    return res.status(500).json({ success: false, message: "Unable to load messages." });
  }
}

export async function sendMessage(req: AuthRequest, res: Response) {
  try {
    const recipientId = String(req.body?.recipientId || "");
    const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
    if (!mongoose.Types.ObjectId.isValid(recipientId) || recipientId === String(req.userId)) return res.status(400).json({ success: false, message: "Choose a valid recipient." });
    if (!body || body.length > 1000) return res.status(400).json({ success: false, message: "Message must be between 1 and 1000 characters." });
    const [sender, recipient] = await Promise.all([User.findById(req.userId).select("role"), User.findById(recipientId).select("role")]);
    if (!sender || !recipient || sender.role === recipient.role || ![sender.role, recipient.role].includes("client") || ![sender.role, recipient.role].includes("seller")) return res.status(403).json({ success: false, message: "Messaging is available only between a client and a seller." });
    const clientId = sender.role === "client" ? String(req.userId) : recipientId;
    const sellerId = sender.role === "seller" ? String(req.userId) : recipientId;
    const hasOrder = await Order.exists({ customer: clientId, seller: sellerId });
    if (!hasOrder) return res.status(403).json({ success: false, message: "You can message only a seller or client with an order." });
    const conversation = await Conversation.findOneAndUpdate({ client: clientId, seller: sellerId }, { $set: { lastMessage: body, lastMessageAt: new Date() } }, { new: true, upsert: true, setDefaultsOnInsert: true });
    const message = await Message.create({ conversation: conversation._id, sender: req.userId, body });
    return res.status(201).json({ success: true, conversation, message });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({ success: false, message: "Unable to send message." });
  }
}
