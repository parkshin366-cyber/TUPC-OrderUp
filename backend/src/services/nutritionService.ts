// =====================================================
// USDA FOODDATA CENTRAL NUTRITION SERVICE
// TUPC-OrderUp
// =====================================================

export interface NutritionResult {
  foodName: string;

  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sodium: number;

  servingSize: string;

  // USDA database data is not AI estimation.
  estimated: boolean;

  // USDA information
  fdcId?: number;
  dataType?: string;
  brandOwner?: string;
}

// =====================================================
// USDA TYPES
// =====================================================

interface USDAFoodNutrient {
  nutrientId?: number;
  nutrientName?: string;
  nutrientNumber?: string;
  unitName?: string;
  value?: number;
}

interface USDAFoodSearchResult {
  fdcId: number;
  description?: string;
  dataType?: string;
  brandOwner?: string;
  brandName?: string;

  servingSize?: number;
  servingSizeUnit?: string;

  foodNutrients?: USDAFoodNutrient[];
}

interface USDAFoodSearchResponse {
  foods?: USDAFoodSearchResult[];
  totalHits?: number;
  currentPage?: number;
  totalPages?: number;
}

interface USDAFoodDetailsResponse {
  fdcId?: number;
  description?: string;
  dataType?: string;
  brandOwner?: string;
  brandName?: string;

  servingSize?: number;
  servingSizeUnit?: string;

  foodNutrients?: USDAFoodNutrient[];
}

// =====================================================
// CONFIG
// =====================================================

const USDA_API_BASE_URL =
  "https://api.nal.usda.gov/fdc/v1";

// =====================================================
// USDA API KEY
// =====================================================

function getUSDAApiKey(): string {
  const apiKey = process.env.USDA_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "USDA_API_KEY is not configured in backend/.env."
    );
  }

  return apiKey;
}

// =====================================================
// HELPERS
// =====================================================

function cleanFoodName(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function roundNumber(
  value: number,
  decimals = 1
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const multiplier = Math.pow(10, decimals);

  return (
    Math.round(value * multiplier) /
    multiplier
  );
}

// =====================================================
// GET NUTRIENT VALUE
// =====================================================

function getNutrientValue(
  nutrients: USDAFoodNutrient[] | undefined,
  nutrientId: number
): number {
  if (!Array.isArray(nutrients)) {
    return 0;
  }

  const nutrient = nutrients.find(
    (item) =>
      Number(item.nutrientId) === nutrientId
  );

  const value = Number(
    nutrient?.value ?? 0
  );

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

// =====================================================
// GET NUTRIENT VALUE BY NAME
// =====================================================
// Some USDA records may not expose the exact same
// nutrient ID structure. This gives us a safe fallback.
// =====================================================

function getNutrientValueByName(
  nutrients: USDAFoodNutrient[] | undefined,
  names: string[]
): number {
  if (!Array.isArray(nutrients)) {
    return 0;
  }

  const normalizedNames = names.map(
    (name) =>
      name
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim()
  );

  const nutrient = nutrients.find((item) => {
    const nutrientName = String(
      item.nutrientName ?? ""
    )
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    return normalizedNames.some(
      (name) =>
        nutrientName === name ||
        nutrientName.includes(name)
    );
  });

  const value = Number(
    nutrient?.value ?? 0
  );

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

// =====================================================
// USDA NUTRIENT IDS
// =====================================================
//
// 1003 = Protein
// 1004 = Total lipid / Fat
// 1005 = Carbohydrate
// 1008 = Energy / Calories
// 1079 = Fiber
// 1093 = Sodium
//
// =====================================================

const USDA_NUTRIENT_IDS = {
  PROTEIN: 1003,
  FAT: 1004,
  CARBOHYDRATES: 1005,
  CALORIES: 1008,
  FIBER: 1079,
  SODIUM: 1093,
} as const;

// =====================================================
// BUILD SERVING SIZE
// =====================================================

function buildServingSize(
  food:
    | USDAFoodSearchResult
    | USDAFoodDetailsResponse
): string {
  const servingSize = Number(
    food.servingSize
  );

  const servingSizeUnit = cleanFoodName(
    food.servingSizeUnit
  );

  if (
    Number.isFinite(servingSize) &&
    servingSize > 0 &&
    servingSizeUnit
  ) {
    return `${roundNumber(
      servingSize,
      1
    )} ${servingSizeUnit}`;
  }

  return "Per 100 g";
}

// =====================================================
// CONVERT USDA FOOD → APP NUTRITION
// =====================================================

function convertUSDAFoodToNutrition(
  food: USDAFoodDetailsResponse
): NutritionResult {
  const foodName = cleanFoodName(
    food.description
  );

  if (!foodName) {
    throw new Error(
      "USDA did not return a valid food name."
    );
  }

  const nutrients =
    food.foodNutrients ?? [];

  // ---------------------------------------------------
  // CALORIES
  // ---------------------------------------------------

  let calories = getNutrientValue(
    nutrients,
    USDA_NUTRIENT_IDS.CALORIES
  );

  if (calories <= 0) {
    calories = getNutrientValueByName(
      nutrients,
      [
        "energy",
        "energy (kcal)",
        "energy, kcal",
      ]
    );
  }

  // ---------------------------------------------------
  // PROTEIN
  // ---------------------------------------------------

  let protein = getNutrientValue(
    nutrients,
    USDA_NUTRIENT_IDS.PROTEIN
  );

  if (protein <= 0) {
    protein = getNutrientValueByName(
      nutrients,
      [
        "protein",
        "protein, total",
      ]
    );
  }

  // ---------------------------------------------------
  // CARBOHYDRATES
  // ---------------------------------------------------

  let carbohydrates =
    getNutrientValue(
      nutrients,
      USDA_NUTRIENT_IDS.CARBOHYDRATES
    );

  if (carbohydrates <= 0) {
    carbohydrates =
      getNutrientValueByName(
        nutrients,
        [
          "carbohydrate, by difference",
          "carbohydrate",
          "carbohydrates",
        ]
      );
  }

  // ---------------------------------------------------
  // FAT
  // ---------------------------------------------------

  let fat = getNutrientValue(
    nutrients,
    USDA_NUTRIENT_IDS.FAT
  );

  if (fat <= 0) {
    fat = getNutrientValueByName(
      nutrients,
      [
        "total lipid (fat)",
        "total fat",
        "fat",
      ]
    );
  }

  // ---------------------------------------------------
  // FIBER
  // ---------------------------------------------------

  let fiber = getNutrientValue(
    nutrients,
    USDA_NUTRIENT_IDS.FIBER
  );

  if (fiber <= 0) {
    fiber = getNutrientValueByName(
      nutrients,
      [
        "fiber, total dietary",
        "dietary fiber",
        "fiber",
      ]
    );
  }

  // ---------------------------------------------------
  // SODIUM
  // ---------------------------------------------------

  let sodium = getNutrientValue(
    nutrients,
    USDA_NUTRIENT_IDS.SODIUM
  );

  if (sodium <= 0) {
    sodium = getNutrientValueByName(
      nutrients,
      [
        "sodium, na",
        "sodium",
      ]
    );
  }

  return {
    foodName,

    calories: Math.round(
      calories
    ),

    protein: roundNumber(
      protein,
      1
    ),

    carbohydrates: roundNumber(
      carbohydrates,
      1
    ),

    fat: roundNumber(
      fat,
      1
    ),

    fiber: roundNumber(
      fiber,
      1
    ),

    sodium: Math.round(
      sodium
    ),

    servingSize:
      buildServingSize(food),

    // USDA database record,
    // not AI estimation.
    estimated: false,

    fdcId:
      typeof food.fdcId === "number"
        ? food.fdcId
        : undefined,

    dataType:
      cleanFoodName(
        food.dataType
      ) || undefined,

    brandOwner:
      cleanFoodName(
        food.brandOwner
      ) || undefined,
  };
}

// =====================================================
// USDA REQUEST
// =====================================================

async function usdaRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const apiKey =
    getUSDAApiKey();

  const separator =
    endpoint.includes("?")
      ? "&"
      : "?";

  const url =
    `${USDA_API_BASE_URL}${endpoint}` +
    `${separator}api_key=${encodeURIComponent(
      apiKey
    )}`;

  let response: Response;

  try {
    response =
      await fetch(url, {
        ...options,

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",

          ...(options?.headers ?? {}),
        },
      });
  } catch (error) {
    console.error(
      "USDA NETWORK ERROR:",
      error
    );

    throw new Error(
      "Unable to connect to USDA FoodData Central. Please check your internet connection."
    );
  }

  const rawText =
    await response.text();

  let data: any = null;

  if (rawText.trim()) {
    try {
      data =
        JSON.parse(rawText);
    } catch {
      console.error(
        "USDA INVALID JSON RESPONSE:",
        rawText
      );

      throw new Error(
        "USDA returned an invalid response."
      );
    }
  }

  if (!response.ok) {
    console.error(
      "USDA API ERROR:",
      response.status,
      data
    );

    if (
      response.status === 400
    ) {
      throw new Error(
        data?.error?.message ||
          data?.message ||
          "USDA rejected the nutrition request. Please check the food name and API request."
      );
    }

    if (
      response.status === 401
    ) {
      throw new Error(
        "USDA API key is invalid or missing."
      );
    }

    if (
      response.status === 403
    ) {
      throw new Error(
        "USDA API access was denied. Please check your API key."
      );
    }

    if (
      response.status === 404
    ) {
      throw new Error(
        "USDA food record was not found."
      );
    }

    if (
      response.status === 429
    ) {
      throw new Error(
        "USDA API rate limit reached. Please try again later."
      );
    }

    throw new Error(
      data?.error?.message ||
        data?.message ||
        `USDA API request failed. HTTP ${response.status}.`
    );
  }

  return data as T;
}

// =====================================================
// SEARCH USDA FOODS
// =====================================================

export async function searchUSDAFoods(
  foodName: string
): Promise<USDAFoodSearchResult[]> {
  const cleanName =
    cleanFoodName(foodName);

  if (!cleanName) {
    throw new Error(
      "Food name is required."
    );
  }

  if (cleanName.length < 2) {
    throw new Error(
      "Food name must contain at least 2 characters."
    );
  }

  console.log(
    "================================================="
  );

  console.log(
    "USDA FOOD SEARCH STARTED"
  );

  console.log(
    "Food:",
    cleanName
  );

  const response =
    await usdaRequest<USDAFoodSearchResponse>(
      "/foods/search",
      {
        method: "POST",

        body: JSON.stringify({
          query: cleanName,

          pageNumber: 1,

          pageSize: 10,

          dataType: [
            "Foundation",
            "SR Legacy",
            "Survey (FNDDS)",
            "Branded",
          ],

          sortBy:
            "dataType.keyword",

          sortOrder:
            "asc",
        }),
      }
    );

  const foods =
    Array.isArray(
      response.foods
    )
      ? response.foods
      : [];

  console.log(
    "USDA RESULTS:",
    foods.length
  );

  console.log(
    "================================================="
  );

  return foods;
}

// =====================================================
// GET USDA FOOD DETAILS
// =====================================================

export async function getUSDAFoodDetails(
  fdcId: number
): Promise<NutritionResult> {
  if (
    !Number.isInteger(fdcId) ||
    fdcId <= 0
  ) {
    throw new Error(
      "Invalid USDA FDC ID."
    );
  }

  console.log(
    "Getting USDA food details:",
    fdcId
  );

  const food =
    await usdaRequest<USDAFoodDetailsResponse>(
      `/food/${fdcId}`,
      {
        method: "GET",
      }
    );

  return convertUSDAFoodToNutrition(
    food
  );
}

// =====================================================
// SCORE USDA SEARCH RESULT
// =====================================================

function scoreFoodMatch(
  query: string,
  food: USDAFoodSearchResult
): number {
  const normalizedQuery =
    cleanFoodName(query)
      .toLowerCase();

  const description =
    cleanFoodName(
      food.description
    ).toLowerCase();

  if (!description) {
    return 0;
  }

  let score = 0;

  // Exact match
  if (
    description ===
    normalizedQuery
  ) {
    score += 1000;
  }

  // Starts with query
  if (
    description.startsWith(
      normalizedQuery
    )
  ) {
    score += 500;
  }

  // Contains complete query
  if (
    description.includes(
      normalizedQuery
    )
  ) {
    score += 250;
  }

  const queryWords =
    normalizedQuery
      .split(/\s+/)
      .filter(Boolean);

  for (const word of queryWords) {
    if (
      description.includes(word)
    ) {
      score += 25;
    }
  }

  // Prefer database records that
  // are generally more suitable for
  // generic food nutrition.
  const dataType =
    cleanFoodName(
      food.dataType
    ).toLowerCase();

  if (
    dataType ===
    "foundation"
  ) {
    score += 20;
  }

  if (
    dataType ===
    "sr legacy"
  ) {
    score += 15;
  }

  if (
    dataType ===
    "survey (fndds)"
  ) {
    score += 10;
  }

  return score;
}

// =====================================================
// SEARCH + GET BEST USDA FOOD
// =====================================================

export async function searchFoodNutrition(
  foodName: string
): Promise<NutritionResult> {
  const cleanName =
    cleanFoodName(foodName);

  if (!cleanName) {
    throw new Error(
      "Food name is required."
    );
  }

  if (cleanName.length < 2) {
    throw new Error(
      "Food name must contain at least 2 characters."
    );
  }

  const foods =
    await searchUSDAFoods(
      cleanName
    );

  if (
    foods.length === 0
  ) {
    throw new Error(
      `No USDA nutrition record was found for "${cleanName}". Try a more general food name, such as "chicken adobo", "fried chicken", or "rice".`
    );
  }

  // ===================================================
  // SORT BY BEST MATCH
  // ===================================================

  const rankedFoods =
    [...foods].sort(
      (a, b) =>
        scoreFoodMatch(
          cleanName,
          b
        ) -
        scoreFoodMatch(
          cleanName,
          a
        )
    );

  const selectedFood =
    rankedFoods[0];

  if (
    !selectedFood ||
    !selectedFood.fdcId
  ) {
    throw new Error(
      "USDA returned an invalid food result."
    );
  }

  console.log(
    "USDA SELECTED FOOD:",
    {
      fdcId:
        selectedFood.fdcId,

      description:
        selectedFood.description,

      dataType:
        selectedFood.dataType,

      brandOwner:
        selectedFood.brandOwner,

      score:
        scoreFoodMatch(
          cleanName,
          selectedFood
        ),
    }
  );

  const nutrition =
    await getUSDAFoodDetails(
      selectedFood.fdcId
    );

  return nutrition;
}

// =====================================================
// MAIN FUNCTION FOR CONTROLLER
// =====================================================
//
// IMPORTANT:
// USDA FoodData Central is being used as a
// text-based nutrition database.
//
// It does NOT identify food from an image.
//
// Controller should call:
//
//   searchFoodNutrition(foodName)
//
// =====================================================

export async function analyzeFoodName(
  foodName: string
): Promise<NutritionResult> {
  return searchFoodNutrition(
    foodName
  );
}

// =====================================================
// BACKWARD COMPATIBILITY
// =====================================================
//
// Kept only so older imports do not immediately
// break.
//
// IMPORTANT:
// This does NOT analyze the image.
//
// If foodName is supplied, USDA lookup is performed.
// If foodName is missing, an explicit error is returned.
// =====================================================

export async function analyzeFoodImage(
  _imageBuffer: Buffer,
  _mimeType: string,
  foodName?: string
): Promise<NutritionResult> {
  if (
    !foodName ||
    !cleanFoodName(foodName)
  ) {
    throw new Error(
      "USDA nutrition lookup requires a food name. USDA does not identify food from an image."
    );
  }

  return searchFoodNutrition(
    foodName
  );
}

// =====================================================
// ALIAS
// =====================================================
//
// Useful if another backend file expects
// analyzeNutrition.
// =====================================================

export const analyzeNutrition =
  analyzeFoodName;