import mongoose, { Document, Schema, Types } from "mongoose";

export interface IConversation extends Document {
  client: Types.ObjectId;
  seller: Types.ObjectId;
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    client: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lastMessage: { type: String, trim: true, maxlength: 1000 },
    lastMessageAt: { type: Date, index: true },
  },
  { timestamps: true }
);

ConversationSchema.index({ client: 1, seller: 1 }, { unique: true });

export default mongoose.models.Conversation || mongoose.model<IConversation>("Conversation", ConversationSchema);
