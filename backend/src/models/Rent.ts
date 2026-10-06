import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type RentStatus = "Paid" | "Due" | "Overdue" | "For verification";

export interface IRent extends Document {
  seller: Types.ObjectId;
  stall?: Types.ObjectId;
  amount: number;
  dueDate: Date;
  status: RentStatus;
  paymentReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RentSchema = new Schema<IRent>({
  seller: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  stall: { type: Schema.Types.ObjectId, ref: "Stall", default: null },
  amount: { type: Number, required: true, min: 0 },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ["Paid", "Due", "Overdue", "For verification"], default: "Due", index: true },
  paymentReference: { type: String, trim: true, maxlength: 120 },
}, { timestamps: true });

const Rent: Model<IRent> = mongoose.models.Rent || mongoose.model<IRent>("Rent", RentSchema);
export default Rent;
