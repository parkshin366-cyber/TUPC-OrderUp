import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IStall extends Document {
  code: string;
  location: string;
  monthlyRent: number;
  seller?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StallSchema = new Schema<IStall>({
  code: { type: String, required: true, trim: true, uppercase: true, unique: true },
  location: { type: String, required: true, trim: true },
  monthlyRent: { type: Number, required: true, min: 0 },
  seller: { type: Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

const Stall: Model<IStall> = mongoose.models.Stall || mongoose.model<IStall>("Stall", StallSchema);
export default Stall;
