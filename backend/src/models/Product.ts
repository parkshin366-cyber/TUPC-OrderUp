import mongoose, {
  Document,
  Model,
  Schema,
  Types,
} from "mongoose";

// =====================================================
// PRODUCT CATEGORIES
// =====================================================

export type ProductCategory =
  | "Meals"
  | "Snacks"
  | "Drinks"
  | "Desserts"
  | "Clothing"
  | "Accessories"
  | "School Supplies"
  | "Gadgets and Electronics"
  | "Gifts and Souvenirs"
  | "Others";

// =====================================================
// NUTRITION
// =====================================================

export interface IProductNutrition {
  foodName: string;

  calories: number;

  protein: number;

  carbohydrates: number;

  fat: number;

  fiber: number;

  sodium: number;

  servingSize: string;

  estimated: boolean;
}

// =====================================================
// PRODUCT DOCUMENT
// =====================================================

export interface IProduct extends Document {
  store: Types.ObjectId;

  name: string;

  category: ProductCategory;

  price: number;

  stock: number;

  available: boolean;

  image?: string;

  nutrition?: IProductNutrition;

  createdAt: Date;

  updatedAt: Date;
}

// =====================================================
// NUTRITION SCHEMA
// =====================================================

const NutritionSchema =
  new Schema<IProductNutrition>(
    {
      foodName: {
        type: String,
        trim: true,
        required: true,
      },

      calories: {
        type: Number,
        min: 0,
        required: true,
      },

      protein: {
        type: Number,
        min: 0,
        required: true,
      },

      carbohydrates: {
        type: Number,
        min: 0,
        required: true,
      },

      fat: {
        type: Number,
        min: 0,
        required: true,
      },

      fiber: {
        type: Number,
        min: 0,
        required: true,
      },

      sodium: {
        type: Number,
        min: 0,
        required: true,
      },

      servingSize: {
        type: String,
        trim: true,
        required: true,
      },

      estimated: {
        type: Boolean,
        default: true,
      },
    },

    {
      _id: false,
    }
  );

// =====================================================
// PRODUCT SCHEMA
// =====================================================

const ProductSchema =
  new Schema<IProduct>(
    {
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
      // NAME
      // =================================================

      name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
      },

      // =================================================
      // CATEGORY
      // =================================================

      category: {
        type: String,

        enum: [
          "Meals",
          "Snacks",
          "Drinks",
          "Desserts",
          "Clothing",
          "Accessories",
          "School Supplies",
          "Gadgets and Electronics",
          "Gifts and Souvenirs",
          "Others",
        ],

        required: true,
      },

      // =================================================
      // PRICE
      // =================================================

      price: {
        type: Number,
        required: true,
        min: 0,
      },

      // =================================================
      // STOCK
      // =================================================

      stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },

      // =================================================
      // AVAILABLE
      // =================================================

      available: {
        type: Boolean,
        default: true,
      },

      // =================================================
      // IMAGE
      // =================================================

      image: {
        type: String,
        default: "",
      },

      // =================================================
      // NUTRITION
      // =================================================

      nutrition: {
        type: NutritionSchema,
        required: false,
      },
    },

    {
      timestamps: true,
    }
  );

// =====================================================
// INDEXES
// =====================================================

ProductSchema.index({
  store: 1,
  available: 1,
});

// =====================================================
// MODEL
// =====================================================

const Product: Model<IProduct> =
  mongoose.models.Product ||
  mongoose.model<IProduct>(
    "Product",
    ProductSchema
  );

export default Product;