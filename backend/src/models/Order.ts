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

export type OrderStatus =
  | "Pending"
  | "Preparing"
  | "Ready"
  | "Completed"
  | "Cancelled";

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
  total: number;

  pickupLocation: string;

  paymentMethod: PaymentMethod;

  status: OrderStatus;

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

      // =================================================
      // ORDER STATUS
      // =================================================

      status: {
        type: String,
        enum: [
          "Pending",
          "Preparing",
          "Ready",
          "Completed",
          "Cancelled",
        ],
        default: "Pending",
        required: true,
        index: true,
      },
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