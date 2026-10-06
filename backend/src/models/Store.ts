import mongoose, {
  Document,
  Model,
  Schema,
  Types,
} from "mongoose";

// =====================================================
// TYPES
// =====================================================

export interface IStore extends Document {
  seller: Types.ObjectId;

  name: string;

  description: string;

  location: string;

  openTime: string;

  closeTime: string;

  isOpen: boolean;

  pickupEnabled: boolean;

  deliveryEnabled: boolean;

  createdAt: Date;

  updatedAt: Date;
}

// =====================================================
// SCHEMA
// =====================================================

const StoreSchema = new Schema<IStore>(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    location: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },

    openTime: {
      type: String,
      default: "7:00 AM",
      trim: true,
    },

    closeTime: {
      type: String,
      default: "6:00 PM",
      trim: true,
    },

    isOpen: {
      type: Boolean,
      default: true,
    },

    pickupEnabled: {
      type: Boolean,
      default: true,
    },

    deliveryEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// MODEL
// =====================================================

const Store: Model<IStore> =
  mongoose.models.Store ||
  mongoose.model<IStore>(
    "Store",
    StoreSchema
  );

export default Store;
