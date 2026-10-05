import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

import { AuthRequest } from "../middleware/auth";
import Product from "../models/Product";
import Store from "../models/Store";
import { analyzeFoodImage } from "../services/nutritionService";

const PRODUCTS_UPLOAD_DIR = path.join(
  process.cwd(),
  "uploads",
  "products"
);

// =========================================================
// VALID PRODUCT CATEGORIES
// =========================================================

const VALID_CATEGORIES = [
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
] as const;

type ProductCategory =
  (typeof VALID_CATEGORIES)[number];

// =========================================================
// FOOD CATEGORIES
// =========================================================

const FOOD_CATEGORIES = [
  "Meals",
  "Snacks",
  "Drinks",
  "Desserts",
] as const;

type FoodCategory =
  (typeof FOOD_CATEGORIES)[number];

// =========================================================
// NUTRITION TYPE
// =========================================================

interface ProductNutritionInput {
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

// =========================================================
// ENSURE PRODUCT UPLOAD DIRECTORY
// =========================================================

async function ensureProductUploadDir() {
  await fs.mkdir(PRODUCTS_UPLOAD_DIR, {
    recursive: true,
  });
}

// =========================================================
// DELETE PRODUCT IMAGE
// =========================================================

async function deleteProductImage(
  imageUrl?: string
) {
  if (!imageUrl) {
    return;
  }

  try {
    let pathname = imageUrl;

    if (
      pathname.startsWith("http://") ||
      pathname.startsWith("https://")
    ) {
      pathname = new URL(pathname).pathname;
    }

    if (
      !pathname.startsWith(
        "/uploads/products/"
      )
    ) {
      return;
    }

    const filename =
      path.basename(pathname);

    if (!filename) {
      return;
    }

    const filePath = path.join(
      PRODUCTS_UPLOAD_DIR,
      filename
    );

    await fs
      .unlink(filePath)
      .catch(() => {});
  } catch (error) {
    console.error(
      "Failed to delete product image:",
      error
    );
  }
}

// =========================================================
// CREATE PUBLIC IMAGE URL
// =========================================================

function getProductImageUrl(
  req: AuthRequest,
  filename: string
) {
  const protocol = String(
    req.headers["x-forwarded-proto"] ||
      req.protocol ||
      "http"
  )
    .split(",")[0]
    .trim();

  const host = String(
    req.headers["x-forwarded-host"] ||
      req.get("host") ||
      ""
  )
    .split(",")[0]
    .trim();

  return `${protocol}://${host}/uploads/products/${filename}`;
}

// =========================================================
// CHECK VALID CATEGORY
// =========================================================

function isValidCategory(
  value: unknown
): value is ProductCategory {
  return (
    typeof value === "string" &&
    VALID_CATEGORIES.includes(
      value as ProductCategory
    )
  );
}

// =========================================================
// CHECK FOOD CATEGORY
// =========================================================

function isFoodCategory(
  value: unknown
): value is FoodCategory {
  return (
    typeof value === "string" &&
    FOOD_CATEGORIES.includes(
      value as FoodCategory
    )
  );
}

// =========================================================
// PARSE BOOLEAN
// =========================================================

function parseBoolean(
  value: unknown,
  defaultValue: boolean
): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  if (value === true || value === "true") {
    return true;
  }

  if (
    value === false ||
    value === "false"
  ) {
    return false;
  }

  return defaultValue;
}

// =========================================================
// PARSE NUTRITION
// =========================================================

function parseNutrition(
  value: unknown
): ProductNutritionInput | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  let parsed: any = value;

  // FormData sends objects as JSON strings.
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      throw new Error(
        "Invalid nutrition data. Nutrition must be valid JSON."
      );
    }
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    throw new Error(
      "Invalid nutrition data."
    );
  }

  // -------------------------------------------------------
  // FOOD NAME
  // -------------------------------------------------------

  if (
    typeof parsed.foodName !== "string" ||
    !parsed.foodName.trim()
  ) {
    throw new Error(
      "Nutrition food name is required."
    );
  }

  // -------------------------------------------------------
  // NUMERIC FIELDS
  // -------------------------------------------------------

  const numericFields = [
    "calories",
    "protein",
    "carbohydrates",
    "fat",
    "fiber",
    "sodium",
  ] as const;

  for (const field of numericFields) {
    const numericValue =
      Number(parsed[field]);

    if (
      !Number.isFinite(numericValue) ||
      numericValue < 0
    ) {
      throw new Error(
        `Invalid nutrition ${field} value.`
      );
    }

    parsed[field] = numericValue;
  }

  // -------------------------------------------------------
  // SERVING SIZE
  // -------------------------------------------------------

  if (
    typeof parsed.servingSize !== "string" ||
    !parsed.servingSize.trim()
  ) {
    throw new Error(
      "Nutrition serving size is required."
    );
  }

  // -------------------------------------------------------
  // ESTIMATED
  // -------------------------------------------------------

  const estimated =
    parsed.estimated === false
      ? false
      : true;

  // -------------------------------------------------------
  // RETURN CLEAN OBJECT
  // -------------------------------------------------------

  return {
    foodName:
      parsed.foodName.trim(),

    calories:
      Math.round(
        parsed.calories
      ),

    protein:
      Number(
        parsed.protein.toFixed(1)
      ),

    carbohydrates:
      Number(
        parsed.carbohydrates.toFixed(1)
      ),

    fat:
      Number(
        parsed.fat.toFixed(1)
      ),

    fiber:
      Number(
        parsed.fiber.toFixed(1)
      ),

    sodium:
      Math.round(
        parsed.sodium
      ),

    servingSize:
      parsed.servingSize.trim(),

    estimated,
  };
}

// =========================================================
// VALIDATE NUTRITION AGAINST CATEGORY
// =========================================================

function validateNutritionForCategory(
  category: ProductCategory,
  nutrition: ProductNutritionInput | undefined
) {
  // -------------------------------------------------------
  // FOOD PRODUCT
  // -------------------------------------------------------

  if (isFoodCategory(category)) {
    // Nutrition is optional because seller may
    // create a food product without analyzing it yet.
    return;
  }

  // -------------------------------------------------------
  // NON-FOOD PRODUCT
  // -------------------------------------------------------

  if (nutrition) {
    throw new Error(
      "Nutrition information is only available for food and beverage products."
    );
  }
}

// =========================================================
// ANALYZE FOOD IMAGE / NUTRITION
// =========================================================

/**
 * Seller image
 *      ↓
 * Multer
 *      ↓
 * Nutrition AI
 *      ↓
 * Estimated nutrition result
 *
 * This endpoint does NOT create or update a product.
 */
export const analyzeNutrition = async (
  req: AuthRequest,
  res: any
) => {
  try {
    // -----------------------------------------------------
    // AUTHENTICATION
    // -----------------------------------------------------

    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // -----------------------------------------------------
    // CHECK SELLER STORE
    // -----------------------------------------------------

    const store =
      await Store.findOne({
        seller: userId,
      });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    // -----------------------------------------------------
    // CHECK IMAGE
    // -----------------------------------------------------

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Food image is required.",
      });
    }

    // -----------------------------------------------------
    // CHECK MIME TYPE
    // -----------------------------------------------------

    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedMimeTypes.includes(
        req.file.mimetype
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid image format. Please upload JPG, PNG, or WebP.",
      });
    }

    // -----------------------------------------------------
    // CHECK FILE
    // -----------------------------------------------------

    if (
      !req.file.buffer ||
      req.file.buffer.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Uploaded image is empty.",
      });
    }

    // -----------------------------------------------------
    // LOG
    // -----------------------------------------------------

    console.log(
      "================================================="
    );

    console.log(
      "NUTRITION ANALYSIS STARTED"
    );

    console.log(
      `Seller: ${userId}`
    );

    console.log(
      `Store: ${store._id}`
    );

    console.log(
      `Image type: ${req.file.mimetype}`
    );

    console.log(
      `Image size: ${req.file.size} bytes`
    );

    console.log(
      "================================================="
    );

    // -----------------------------------------------------
    // ANALYZE IMAGE
    // -----------------------------------------------------

    const nutrition =
      await analyzeFoodImage(
        req.file.buffer,
        req.file.mimetype
      );

    // -----------------------------------------------------
    // CHECK NON-FOOD
    // -----------------------------------------------------

    if (
      nutrition.foodName
        .toLowerCase()
        .trim() ===
      "not a food item"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The uploaded image does not appear to contain a food or beverage item.",
      });
    }

    // -----------------------------------------------------
    // SUCCESS LOG
    // -----------------------------------------------------

    console.log(
      "Nutrition analysis completed:"
    );

    console.log(nutrition);

    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    return res.json({
      success: true,
      message:
        "Nutrition analysis completed successfully.",
      nutrition,
    });
  } catch (error) {
    console.error(
      "analyzeNutrition error:",
      error
    );

    if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to analyze food image.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to analyze food image.",
    });
  }
};

// =========================================================
// GET MY PRODUCTS
// =========================================================

export const getMyProducts = async (
  req: AuthRequest,
  res: any
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const store =
      await Store.findOne({
        seller: userId,
      });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    const products =
      await Product.find({
        store: store._id,
      })
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.json(products);
  } catch (error) {
    console.error(
      "getMyProducts error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch products",
    });
  }
};

// =========================================================
// CREATE PRODUCT
// =========================================================

export const createProduct = async (
  req: AuthRequest,
  res: any
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      name,
      category,
      price,
      stock,
      available,
      nutrition,
    } = req.body;

    // -----------------------------------------------------
    // VALIDATE NAME
    // -----------------------------------------------------

    if (
      !name ||
      !String(name).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Product name is required",
      });
    }

    // -----------------------------------------------------
    // VALIDATE CATEGORY
    // -----------------------------------------------------

    if (!isValidCategory(category)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product category. Allowed categories: Meals, Snacks, Drinks, Desserts, Clothing, Accessories, School Supplies, Gadgets and Electronics, Gifts and Souvenirs, Others",
      });
    }

    // -----------------------------------------------------
    // VALIDATE PRICE
    // -----------------------------------------------------

    const parsedPrice =
      Number(price);

    if (
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product price",
      });
    }

    // -----------------------------------------------------
    // VALIDATE STOCK
    // -----------------------------------------------------

    const parsedStock =
      Number(stock);

    if (
      !Number.isFinite(parsedStock) ||
      parsedStock < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product stock",
      });
    }

    // -----------------------------------------------------
    // PARSE NUTRITION
    // -----------------------------------------------------

    let parsedNutrition:
      | ProductNutritionInput
      | undefined;

    try {
      parsedNutrition =
        parseNutrition(nutrition);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Invalid nutrition data.",
      });
    }

    // -----------------------------------------------------
    // VALIDATE NUTRITION CATEGORY
    // -----------------------------------------------------

    try {
      validateNutritionForCategory(
        category,
        parsedNutrition
      );
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Invalid nutrition data.",
      });
    }

    // -----------------------------------------------------
    // FIND SELLER STORE
    // -----------------------------------------------------

    const store =
      await Store.findOne({
        seller: userId,
      });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    // -----------------------------------------------------
    // IMAGE
    // -----------------------------------------------------

    let image = "";

    if (req.file) {
      await ensureProductUploadDir();

      const filename =
        `product-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 10)}.webp`;

      const outputPath =
        path.join(
          PRODUCTS_UPLOAD_DIR,
          filename
        );

      await sharp(
        req.file.buffer
      )
        .rotate()
        .resize({
          width: 1200,
          height: 1200,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({
          quality: 82,
        })
        .toFile(outputPath);

      image =
        getProductImageUrl(
          req,
          filename
        );
    }

    // -----------------------------------------------------
    // CREATE PRODUCT
    // -----------------------------------------------------

    const product =
      await Product.create({
        store: store._id,

        name:
          String(name).trim(),

        category,

        price:
          parsedPrice,

        stock:
          parsedStock,

        available:
          parseBoolean(
            available,
            true
          ),

        image,

        nutrition:
          parsedNutrition,
      });

    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    return res.status(201).json(
      product
    );
  } catch (error) {
    console.error(
      "createProduct error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create product",
    });
  }
};

// =========================================================
// UPDATE PRODUCT
// =========================================================

export const updateProduct = async (
  req: AuthRequest,
  res: any
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { productId } =
      req.params;

    // -----------------------------------------------------
    // FIND PRODUCT
    // -----------------------------------------------------

    const product =
      await Product.findById(
        productId
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // -----------------------------------------------------
    // FIND STORE
    // -----------------------------------------------------

    const store =
      await Store.findOne({
        seller: userId,
      });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    // -----------------------------------------------------
    // CHECK OWNERSHIP
    // -----------------------------------------------------

    if (
      String(product.store) !==
      String(store._id)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to update this product",
      });
    }

    const {
      name,
      category,
      price,
      stock,
      available,
      removeImage,
      nutrition,
    } = req.body;

    // -----------------------------------------------------
    // DETERMINE FINAL CATEGORY
    // -----------------------------------------------------

    let finalCategory:
      | ProductCategory
      | undefined =
      product.category as ProductCategory;

    if (category !== undefined) {
      if (
        !isValidCategory(category)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product category. Allowed categories: Meals, Snacks, Drinks, Desserts, Clothing, Accessories, School Supplies, Gadgets and Electronics, Gifts and Souvenirs, Others",
        });
      }

      finalCategory = category;
    }

    // -----------------------------------------------------
    // NAME
    // -----------------------------------------------------

    if (name !== undefined) {
      const trimmedName =
        String(name).trim();

      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message:
            "Product name is required",
        });
      }

      product.name =
        trimmedName;
    }

    // -----------------------------------------------------
    // CATEGORY
    // -----------------------------------------------------

    if (category !== undefined) {
      product.category =
        finalCategory;
    }

    // -----------------------------------------------------
    // PRICE
    // -----------------------------------------------------

    if (price !== undefined) {
      const parsedPrice =
        Number(price);

      if (
        !Number.isFinite(
          parsedPrice
        ) ||
        parsedPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product price",
        });
      }

      product.price =
        parsedPrice;
    }

    // -----------------------------------------------------
    // STOCK
    // -----------------------------------------------------

    if (stock !== undefined) {
      const parsedStock =
        Number(stock);

      if (
        !Number.isFinite(
          parsedStock
        ) ||
        parsedStock < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product stock",
        });
      }

      product.stock =
        parsedStock;
    }

    // -----------------------------------------------------
    // AVAILABLE
    // -----------------------------------------------------

    if (available !== undefined) {
      product.available =
        parseBoolean(
          available,
          product.available
        );
    }

    // -----------------------------------------------------
    // NUTRITION
    // -----------------------------------------------------

    if (nutrition !== undefined) {
      let parsedNutrition:
        | ProductNutritionInput
        | undefined;

      try {
        parsedNutrition =
          parseNutrition(
            nutrition
          );
      } catch (error) {
        return res.status(400).json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Invalid nutrition data.",
        });
      }

      try {
        validateNutritionForCategory(
          finalCategory,
          parsedNutrition
        );
      } catch (error) {
        return res.status(400).json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Invalid nutrition data.",
        });
      }

      if (parsedNutrition) {
        product.nutrition =
          parsedNutrition;
      }
    }

    // -----------------------------------------------------
    // REMOVE NUTRITION WHEN CHANGING TO NON-FOOD
    // -----------------------------------------------------

    if (
      category !== undefined &&
      !isFoodCategory(
        finalCategory
      )
    ) {
      product.nutrition =
        undefined;
    }

    // -----------------------------------------------------
    // REMOVE IMAGE
    // -----------------------------------------------------

    const shouldRemoveImage =
      removeImage === true ||
      removeImage === "true";

    if (
      shouldRemoveImage &&
      product.image
    ) {
      await deleteProductImage(
        product.image
      );

      product.image = "";
    }

    // -----------------------------------------------------
    // NEW IMAGE
    // -----------------------------------------------------

    if (req.file) {
      await ensureProductUploadDir();

      const oldImage =
        product.image;

      const filename =
        `product-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 10)}.webp`;

      const outputPath =
        path.join(
          PRODUCTS_UPLOAD_DIR,
          filename
        );

      await sharp(
        req.file.buffer
      )
        .rotate()
        .resize({
          width: 1200,
          height: 1200,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({
          quality: 82,
        })
        .toFile(outputPath);

      product.image =
        getProductImageUrl(
          req,
          filename
        );

      if (oldImage) {
        await deleteProductImage(
          oldImage
        );
      }
    }

    // -----------------------------------------------------
    // SAVE
    // -----------------------------------------------------

    await product.save();

    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    return res.json(product);
  } catch (error) {
    console.error(
      "updateProduct error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update product",
    });
  }
};

// =========================================================
// DELETE PRODUCT
// =========================================================

export const deleteProduct = async (
  req: AuthRequest,
  res: any
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { productId } =
      req.params;

    // -----------------------------------------------------
    // FIND PRODUCT
    // -----------------------------------------------------

    const product =
      await Product.findById(
        productId
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // -----------------------------------------------------
    // FIND STORE
    // -----------------------------------------------------

    const store =
      await Store.findOne({
        seller: userId,
      });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    // -----------------------------------------------------
    // CHECK OWNERSHIP
    // -----------------------------------------------------

    if (
      String(product.store) !==
      String(store._id)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to delete this product",
      });
    }

    // -----------------------------------------------------
    // DELETE IMAGE
    // -----------------------------------------------------

    if (product.image) {
      await deleteProductImage(
        product.image
      );
    }

    // -----------------------------------------------------
    // DELETE PRODUCT
    // -----------------------------------------------------

    await Product.findByIdAndDelete(
      productId
    );

    return res.json({
      success: true,
      message:
        "Product deleted successfully",
    });
  } catch (error) {
    console.error(
      "deleteProduct error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete product",
    });
  }
};

// =========================================================
// UPDATE PRODUCT AVAILABILITY
// =========================================================

export const updateAvailability =
  async (
    req: AuthRequest,
    res: any
  ) => {
    try {
      const userId =
        req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { productId } =
        req.params;

      const { available } =
        req.body;

      // ---------------------------------------------------
      // FIND STORE
      // ---------------------------------------------------

      const store =
        await Store.findOne({
          seller: userId,
        });

      if (!store) {
        return res.status(404).json({
          success: false,
          message:
            "Store not found",
        });
      }

      // ---------------------------------------------------
      // FIND PRODUCT
      // ---------------------------------------------------

      const product =
        await Product.findOne({
          _id: productId,
          store: store._id,
        });

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found",
        });
      }

      // ---------------------------------------------------
      // UPDATE
      // ---------------------------------------------------

      product.available =
        parseBoolean(
          available,
          product.available
        );

      await product.save();

      return res.json(product);
    } catch (error) {
      console.error(
        "updateAvailability error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update product availability",
      });
    }
  };

// =========================================================
// PUBLIC PRODUCTS BY STORE
// =========================================================

export const getPublicProductsByStore =
  async (
    req: any,
    res: any
  ) => {
    try {
      const { storeId } =
        req.params;

      const products =
        await Product.find({
          store: storeId,
          available: true,
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.json(products);
    } catch (error) {
      console.error(
        "getPublicProductsByStore error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch store products",
      });
    }
  };

// =========================================================
// PUBLIC SINGLE PRODUCT
// =========================================================

export const getPublicProductById =
  async (
    req: any,
    res: any
  ) => {
    try {
      const { productId } =
        req.params;

      const product =
        await Product.findOne({
          _id: productId,
          available: true,
        }).lean();

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found",
        });
      }

      const store =
        await Store.findById(
          product.store
        ).lean();

      return res.json({
        ...product,
        store,
      });
    } catch (error) {
      console.error(
        "getPublicProductById error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch product",
      });
    }
  };