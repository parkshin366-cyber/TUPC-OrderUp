import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IVoucher extends Document {
  code: string;
  title: string;
  description?: string;
  discountPercent: number;
  minimumOrder: number;
  newUsersOnly: boolean;
  active: boolean;
  startsAt: Date;
  endsAt?: Date;
  createdBy: Types.ObjectId;
}

const VoucherSchema = new Schema<IVoucher>({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, minlength: 3, maxlength: 30 },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 250 },
  discountPercent: { type: Number, required: true, min: 1, max: 100 },
  minimumOrder: { type: Number, default: 0, min: 0 },
  newUsersOnly: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  startsAt: { type: Date, default: Date.now },
  endsAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

VoucherSchema.index({ active: 1, startsAt: 1, endsAt: 1 });

const Voucher: Model<IVoucher> = mongoose.models.Voucher || mongoose.model<IVoucher>("Voucher", VoucherSchema);
export default Voucher;
