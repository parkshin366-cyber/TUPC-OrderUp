import mongoose, { Document, Schema, Types } from "mongoose";

export interface IReview extends Document {
  order: Types.ObjectId;
  client: Types.ObjectId;
  seller: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    client: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, minlength: 3, maxlength: 1000 },
  },
  { timestamps: true }
);

ReviewSchema.index({ seller: 1, createdAt: -1 });

export default mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);
