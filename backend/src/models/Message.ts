import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMessage extends Document {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  body: string;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, minlength: 1, maxlength: 1000 },
    readAt: { type: Date },
  },
  { timestamps: true }
);

MessageSchema.index({ conversation: 1, createdAt: 1 });

export default mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
