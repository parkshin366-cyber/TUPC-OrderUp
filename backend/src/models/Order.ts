import mongoose, {
    Document,
    Schema,
    Types,
} from "mongoose";

// =====================================================
// TYPES
// =====================================================

export type PaymentMethod =
  | "cash"
  | "gcash";

export type FulfillmentMethod = "pickup" | "delivery";

export type OrderStatus =
  | "Pending"
  | "Preparing"
  | "Ready"
  | "On the Way"
  | "Completed"
  | "Cancelled";

export type CancellationStatus = "none" | "requested" | "rejected" | "approved";

// =====================================================
// ORDER ITEM
// =====================================================

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

// =====================================================
// ORDER INTERFACE
// =====================================================

export interface IOrder extends Document {
  customer: Types.ObjectId;
  seller: Types.ObjectId;
  store: Types.ObjectId;

  items: IOrderItem[];

  subtotal: number;
  discount: number;
  total: number;
  voucher?: Types.ObjectId;
  voucherCode?: string;

  pickupLocation: string;
  fulfillmentMethod: FulfillmentMethod;
  deliveryAddress?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;

  paymentMethod: PaymentMethod;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  gcashReference?: string;
  paymongoCheckoutSessionId?: string;
  paymongoPaymentId?: string;

  status: OrderStatus;
  estimatedMinutes?: number;
  estimatedReadyAt?: Date;
  cancellationStatus: CancellationStatus;
  cancellationReason?: string;
  cancellationRequestedBy?: "client" | "seller";
  cancellationRequestedAt?: Date;
  cancellationReviewedAt?: Date;
  cancellationRejectionReason?: string;
  stockRestoredAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// ORDER ITEM SCHEMA
// =====================================================

const OrderItemSchema =
  new Schema<IOrderItem>(
    {
      product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },

      name: {
        type: String,
        required: true,
        trim: true,
      },

      price: {
        type: Number,
        required: true,
        min: 0,
      },

      quantity: {
        type: Number,
        required: true,
        min: 1,
      },

      image: {
        type: String,
        required: false,
        trim: true,
      },
    },
    {
      _id: false,
    }
  );

// =====================================================
// ORDER SCHEMA
// =====================================================

const OrderSchema =
  new Schema<IOrder>(
    {
      // =================================================
      // CUSTOMER
      // =================================================

      customer: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      // =================================================
      // SELLER
      // =================================================

      seller: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      // =================================================
      // STORE
      // =================================================

      store: {
        type: Schema.Types.ObjectId,
        ref: "Store",
        required: true,
        index: true,
      },

      // =================================================
      // ITEMS
      // =================================================

      items: {
        type: [OrderItemSchema],
        required: true,
        validate: {
          validator: (
            value: IOrderItem[]
          ) => {
            return value.length > 0;
          },

          message:
            "An order must contain at least one item.",
        },
      },

      // =================================================
      // SUBTOTAL
      // =================================================

      subtotal: {
        type: Number,
        required: true,
        min: 0,
      },

      discount: {
        type: Number,
        default: 0,
        min: 0,
      },

      voucher: {
        type: Schema.Types.ObjectId,
        ref: "Voucher",
      },

      voucherCode: {
        type: String,
        trim: true,
      },

      // =================================================
      // TOTAL
      // =================================================

      total: {
        type: Number,
        required: true,
        min: 0,
      },

      // =================================================
      // PICKUP LOCATION
      // =================================================

      pickupLocation: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },

      fulfillmentMethod: {
        type: String,
        enum: ["pickup", "delivery"],
        default: "pickup",
        required: true,
      },

      deliveryAddress: { type: String, trim: true, maxlength: 300 },
      deliveryLatitude: { type: Number, min: -90, max: 90 },
      deliveryLongitude: { type: Number, min: -180, max: 180 },

      // =================================================
      // PAYMENT METHOD
      // =================================================

      paymentMethod: {
        type: String,
        enum: [
          "cash",
          "gcash",
        ],
        required: true,
      },

      paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
        required: true,
      },

      gcashReference: {
        type: String,
        trim: true,
        maxlength: 30,
      },

      paymongoCheckoutSessionId: { type: String, trim: true, select: false },
      paymongoPaymentId: { type: String, trim: true, select: false },

      // =================================================
      // ORDER STATUS
      // =================================================

      status: {
        type: String,
        enum: [
          "Pending",
          "Preparing",
          "Ready",
          "On the Way",
          "Completed",
          "Cancelled",
        ],
        default: "Pending",
        required: true,
        index: true,
      },

      estimatedMinutes: { type: Number, min: 5, max: 180 },
      estimatedReadyAt: { type: Date },
      cancellationStatus: {
        type: String,
        enum: ["none", "requested", "rejected", "approved"],
        default: "none",
        index: true,
      },
      cancellationReason: { type: String, trim: true, maxlength: 300 },
      cancellationRequestedBy: { type: String, enum: ["client", "seller"] },
      cancellationRequestedAt: { type: Date },
      cancellationReviewedAt: { type: Date },
      cancellationRejectionReason: { type: String, trim: true, maxlength: 300 },
      stockRestoredAt: { type: Date },
    },
    {
      timestamps: true,
    }
  );

// =====================================================
// INDEXES
// =====================================================

OrderSchema.index({
  seller: 1,
  status: 1,
  createdAt: -1,
});

OrderSchema.index({
  customer: 1,
  createdAt: -1,
});

OrderSchema.index({
  store: 1,
  createdAt: -1,
});

// =====================================================
// MODEL
// =====================================================

const Order =
  mongoose.models.Order ||
  mongoose.model<IOrder>(
    "Order",
    OrderSchema
  );

export default Order;
