// =====================================================
// USDA NUTRITION API
// TUPC-OrderUp
// =====================================================

import { API_URL } from "../constants/api";

// =====================================================
// TYPES
// =====================================================

export type ProductNutrition = {
  foodName: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sodium: number;
  servingSize: string;
  estimated: boolean;
  fdcId?: number;
  dataType?: string;
  brandOwner?: string;
};

export type AnalyzeNutritionResponse = {
  success: boolean;
  message: string;
  nutrition: ProductNutrition;
};

// =====================================================
// RESPONSE PARSER
// =====================================================

async function parseNutritionResponse(
  response: Response
): Promise<any> {
  const rawText = await response.text();

  console.log(
    "================================================="
  );

  console.log(
    "USDA NUTRITION API RESPONSE"
  );

  console.log(
    "STATUS:",
    response.status
  );

  console.log(
    "OK:",
    response.ok
  );

  console.log(
    "URL:",
    response.url
  );

  console.log(
    "RAW RESPONSE:",
    rawText
  );

  console.log(
    "================================================="
  );

  if (!rawText.trim()) {
    return {
      success: false,
      message:
        `Empty server response. HTTP ${response.status}.`,
    };
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return {
      success: false,
      message:
        `Invalid server response. HTTP ${response.status}.`,
      rawResponse: rawText,
    };
  }
}

// =====================================================
// VALIDATE NUTRITION
// =====================================================

function validateNutrition(
  nutrition: any
): ProductNutrition {
  if (
    !nutrition ||
    typeof nutrition !== "object"
  ) {
    throw new Error(
      "Server did not return nutrition information."
    );
  }

  // ===================================================
  // FOOD NAME
  // ===================================================

  if (
    typeof nutrition.foodName !== "string" ||
    !nutrition.foodName.trim()
  ) {
    throw new Error(
      "USDA did not return a valid food name."
    );
  }

  // ===================================================
  // NUMERIC FIELDS
  // ===================================================

  const numericFields = [
    "calories",
    "protein",
    "carbohydrates",
    "fat",
    "fiber",
    "sodium",
  ] as const;

  for (const field of numericFields) {
    if (
      typeof nutrition[field] !== "number" ||
      !Number.isFinite(
        nutrition[field]
      )
    ) {
      throw new Error(
        `USDA returned an invalid ${field} value.`
      );
    }

    if (
      nutrition[field] < 0
    ) {
      throw new Error(
        `USDA returned an invalid negative ${field} value.`
      );
    }
  }

  // ===================================================
  // SERVING SIZE
  // ===================================================

  if (
    typeof nutrition.servingSize !== "string" ||
    !nutrition.servingSize.trim()
  ) {
    throw new Error(
      "USDA did not return a valid serving size."
    );
  }

  // ===================================================
  // RETURN CLEAN DATA
  // ===================================================

  return {
    foodName:
      nutrition.foodName.trim(),

    calories:
      Math.round(
        nutrition.calories
      ),

    protein:
      Number(
        nutrition.protein.toFixed(1)
      ),

    carbohydrates:
      Number(
        nutrition.carbohydrates.toFixed(1)
      ),

    fat:
      Number(
        nutrition.fat.toFixed(1)
      ),

    fiber:
      Number(
        nutrition.fiber.toFixed(1)
      ),

    sodium:
      Math.round(
        nutrition.sodium
      ),

    servingSize:
      nutrition.servingSize.trim(),

    estimated:
      nutrition.estimated === true,

    ...(typeof nutrition.fdcId ===
    "number"
      ? {
          fdcId:
            nutrition.fdcId,
        }
      : {}),

    ...(typeof nutrition.dataType ===
    "string"
      ? {
          dataType:
            nutrition.dataType,
        }
      : {}),

    ...(typeof nutrition.brandOwner ===
    "string"
      ? {
          brandOwner:
            nutrition.brandOwner,
        }
      : {}),
  };
}

// =====================================================
// ANALYZE PRODUCT NUTRITION
// =====================================================
//
// IMPORTANT:
//
// USDA FoodData Central uses FOOD NAME for searching.
//
// Example:
//
// Product Name:
// "Chicken Adobo"
//
// Request:
//
// {
//   foodName: "Chicken Adobo"
// }
//
// The product IMAGE is NOT used for USDA nutrition
// identification.
//
// The product image is still used separately when
// saving the actual product.
//
// =====================================================

export async function analyzeProductNutrition(
  token: string,
  foodName: string
): Promise<ProductNutrition> {
  // ===================================================
  // TOKEN VALIDATION
  // ===================================================

  if (!token) {
    throw new Error(
      "Authentication token is required."
    );
  }

  // ===================================================
  // FOOD NAME VALIDATION
  // ===================================================

  if (
    typeof foodName !== "string"
  ) {
    throw new Error(
      "Food name is required."
    );
  }

  const cleanFoodName =
    foodName.trim();

  if (!cleanFoodName) {
    throw new Error(
      "Food name is required."
    );
  }

  if (
    cleanFoodName.length < 2
  ) {
    throw new Error(
      "Food name must contain at least 2 characters."
    );
  }

  // ===================================================
  // API URL
  // ===================================================

  const baseUrl = String(
    API_URL ?? ""
  ).replace(
    /\/$/,
    ""
  );

  if (!baseUrl) {
    throw new Error(
      "API URL is not configured."
    );
  }

  try {
    console.log(
      "================================================="
    );

    console.log(
      "USDA NUTRITION LOOKUP"
    );

    console.log(
      "FOOD NAME:",
      cleanFoodName
    );

    console.log(
      "API URL:",
      `${baseUrl}/api/products/analyze-nutrition`
    );

    console.log(
      "================================================="
    );

    // =================================================
    // SEND FOOD NAME TO BACKEND
    // =================================================

    const response =
      await fetch(
        `${baseUrl}/api/products/analyze-nutrition`,
        {
          method: "POST",

          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body:
            JSON.stringify({
              foodName:
                cleanFoodName,
            }),
        }
      );

    // =================================================
    // PARSE RESPONSE
    // =================================================

    const data =
      await parseNutritionResponse(
        response
      );

    // =================================================
    // HTTP ERROR
    // =================================================

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          `Nutrition lookup failed. HTTP ${response.status}.`
      );
    }

    // =================================================
    // RESPONSE VALIDATION
    // =================================================

    if (
      !data ||
      typeof data !== "object"
    ) {
      throw new Error(
        "Server returned an invalid nutrition response."
      );
    }

    // =================================================
    // SERVER SUCCESS FLAG
    // =================================================

    if (
      data.success === false
    ) {
      throw new Error(
        data.message ||
          "Nutrition lookup failed."
      );
    }

    // =================================================
    // EXTRACT NUTRITION
    // =================================================

    const nutrition =
      data?.nutrition ??
      data?.data?.nutrition ??
      data?.data ??
      data;

    // =================================================
    // VALIDATE NUTRITION
    // =================================================

    const validatedNutrition =
      validateNutrition(
        nutrition
      );

    // =================================================
    // SUCCESS LOG
    // =================================================

    console.log(
      "================================================="
    );

    console.log(
      "USDA NUTRITION SUCCESS"
    );

    console.log(
      "FOOD:",
      validatedNutrition.foodName
    );

    console.log(
      "CALORIES:",
      validatedNutrition.calories
    );

    console.log(
      "PROTEIN:",
      validatedNutrition.protein
    );

    console.log(
      "CARBOHYDRATES:",
      validatedNutrition.carbohydrates
    );

    console.log(
      "FAT:",
      validatedNutrition.fat
    );

    console.log(
      "FIBER:",
      validatedNutrition.fiber
    );

    console.log(
      "SODIUM:",
      validatedNutrition.sodium
    );

    console.log(
      "SERVING SIZE:",
      validatedNutrition.servingSize
    );

    console.log(
      "FDC ID:",
      validatedNutrition.fdcId
    );

    console.log(
      "DATA TYPE:",
      validatedNutrition.dataType
    );

    console.log(
      "BRAND OWNER:",
      validatedNutrition.brandOwner
    );

    console.log(
      "================================================="
    );

    return validatedNutrition;
  } catch (error) {
    // =================================================
    // ERROR LOG
    // =================================================

    console.error(
      "================================================="
    );

    console.error(
      "USDA NUTRITION ANALYSIS ERROR:"
    );

    console.error(
      error
    );

    console.error(
      "================================================="
    );

    // =================================================
    // NORMAL ERROR
    // =================================================

    if (
      error instanceof Error
    ) {
      throw error;
    }

    // =================================================
    // UNKNOWN ERROR
    // =================================================

    throw new Error(
      "Unable to retrieve nutrition information."
    );
  }
}

// =====================================================
// ALIAS
// =====================================================
//
// Compatibility:
//
// getNutrition(token, foodName)
//
// =====================================================

export const getNutrition =
  analyzeProductNutrition;