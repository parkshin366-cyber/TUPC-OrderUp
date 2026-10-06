import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IVoucherActivation extends Document {
  voucher: Types.ObjectId;
  seller: Types.ObjectId;
  store: Types.ObjectId;
  productIds: Types.ObjectId[];
  enabled: boolean;
}

const VoucherActivationSchema = new Schema<IVoucherActivation>({
  voucher: { type: Schema.Types.ObjectId, ref: "Voucher", required: true, index: true },
  seller: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  store: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  enabled: { type: Boolean, default: true },
}, { timestamps: true });

VoucherActivationSchema.index({ voucher: 1, store: 1 }, { unique: true });

const VoucherActivation: Model<IVoucherActivation> = mongoose.models.VoucherActivation || mongoose.model<IVoucherActivation>("VoucherActivation", VoucherActivationSchema);
export default VoucherActivation;
