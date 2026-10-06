import mongoose, { Document, Schema, Types } from "mongoose";

export interface IVoucherRedemption extends Document {
  voucher: Types.ObjectId;
  customer: Types.ObjectId;
  store: Types.ObjectId;
  order: Types.ObjectId;
  redeemedAt: Date;
}

const VoucherRedemptionSchema = new Schema<IVoucherRedemption>({
  voucher: { type: Schema.Types.ObjectId, ref: "Voucher", required: true, index: true },
  customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  store: { type: Schema.Types.ObjectId, ref: "Store", required: true },
  order: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
  redeemedAt: { type: Date, default: Date.now },
}, { timestamps: true });

VoucherRedemptionSchema.index({ voucher: 1, customer: 1 }, { unique: true });

export default mongoose.models.VoucherRedemption || mongoose.model<IVoucherRedemption>("VoucherRedemption", VoucherRedemptionSchema);
