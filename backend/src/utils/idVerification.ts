import sharp from "sharp";
import Tesseract from "tesseract.js";

export type IdVerificationField =
  | "firstName"
  | "lastName"
  | "idNumber";

export type IdVerificationResult = {
  passed: boolean;
  matchCount: number;
  matchedFields: IdVerificationField[];
};

export type IdImageOrientation =
  | "portrait"
  | "landscape";

/* =========================================================
   TEXT NORMALIZATION
========================================================= */

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeId(value: string): string {
  return normalizeText(value).replace(
    /[^A-Z0-9]/g,
    ""
  );
}

/* =========================================================
   NAME MATCHING
========================================================= */

function matchesName(
  ocrText: string,
  expectedName: string
): boolean {
  const ocr = normalizeText(ocrText);
  const expected = normalizeText(expectedName);

  if (!expected) {
    return false;
  }

  // Normal matching
  if (ocr.includes(expected)) {
    return true;
  }

  // Compact matching
  const ocrCompact = ocr.replace(/\s/g, "");
  const expectedCompact =
    expected.replace(/\s/g, "");

  return (
    expectedCompact.length >= 3 &&
    ocrCompact.includes(expectedCompact)
  );
}

/* =========================================================
   ID NUMBER MATCHING
========================================================= */

function matchesIdNumber(
  ocrText: string,
  expectedIdNumber: string
): boolean {
  const ocr = normalizeId(ocrText);
  const expected = normalizeId(
    expectedIdNumber
  );

  if (!expected) {
    return false;
  }

  return ocr.includes(expected);
}

/* =========================================================
   TESSERACT OCR
========================================================= */

async function runTesseract(
  imageBuffer: Buffer
): Promise<string> {
  try {
    const result = await Tesseract.recognize(
      imageBuffer,
      "eng"
    );

    return result.data.text || "";
  } catch (error) {
    console.error(
      "Tesseract OCR error:",
      error
    );

    return "";
  }
}

/* =========================================================
   IMAGE PREPARATION
========================================================= */

async function prepareImage(
  imageBuffer: Buffer,
  orientation: IdImageOrientation
): Promise<Buffer> {
  try {
    let image = sharp(imageBuffer).rotate();

    const metadata = await image.metadata();

    console.log(
      `Original image: ${
        metadata.width ?? "?"
      }x${metadata.height ?? "?"}`
    );

    /*
     * Expected portrait
     */
    if (
      orientation === "portrait" &&
      metadata.width &&
      metadata.height &&
      metadata.width > metadata.height
    ) {
      console.log(
        "Expected portrait ID but image is landscape. Rotating 90 degrees..."
      );

      image = image.rotate(90);
    }

    /*
     * Expected landscape
     */
    if (
      orientation === "landscape" &&
      metadata.width &&
      metadata.height &&
      metadata.height > metadata.width
    ) {
      console.log(
        "Expected landscape ID but image is portrait. Rotating 90 degrees..."
      );

      image = image.rotate(90);
    }

    return await image
      .jpeg({
        quality: 95,
      })
      .toBuffer();
  } catch (error) {
    console.error(
      "Image preparation failed:",
      error
    );

    return imageBuffer;
  }
}

/* =========================================================
   OCR ONE ID IMAGE
========================================================= */

async function extractTextFromOneIdImage(
  imageBuffer: Buffer,
  orientation: IdImageOrientation
): Promise<string> {
  console.log(
    `Starting OCR. Expected orientation: ${orientation}`
  );

  /*
   * Primary orientation
   */
  const primaryImage =
    await prepareImage(
      imageBuffer,
      orientation
    );

  const primaryText =
    await runTesseract(primaryImage);

  if (primaryText.trim()) {
    console.log(
      `Primary ${orientation} OCR detected text.`
    );

    return primaryText;
  }

  /*
   * Fallback rotations
   */
  console.log(
    "Primary OCR returned no text. Trying fallback rotations..."
  );

  const fallbackAngles = [
    90,
    270,
    180,
  ];

  const fallbackTexts: string[] = [];

  for (const angle of fallbackAngles) {
    try {
      console.log(
        `Trying fallback rotation: ${angle} degrees`
      );

      const rotatedImage =
        await sharp(imageBuffer)
          .rotate()
          .rotate(angle)
          .jpeg({
            quality: 95,
          })
          .toBuffer();

      const text =
        await runTesseract(
          rotatedImage
        );

      if (text.trim()) {
        fallbackTexts.push(text);
      }
    } catch (error) {
      console.error(
        `Fallback OCR failed at ${angle} degrees:`,
        error
      );
    }
  }

  return [
    primaryText,
    ...fallbackTexts,
  ]
    .filter(Boolean)
    .join("\n");
}

/* =========================================================
   SINGLE ID IMAGE OCR
========================================================= */

export async function extractTextFromIdImage(
  imageBuffer: Buffer,
  orientation: IdImageOrientation
): Promise<string> {
  return extractTextFromOneIdImage(
    imageBuffer,
    orientation
  );
}

/* =========================================================
   FRONT + BACK ID OCR
========================================================= */

export async function extractTextFromIdImages(
  frontBuffer: Buffer,
  backBuffer: Buffer,
  orientation: IdImageOrientation
): Promise<string> {
  console.log(
    "========================================"
  );

  console.log(
    "ID OCR START"
  );

  console.log(
    `Expected orientation: ${orientation}`
  );

  console.log(
    "========================================"
  );

  const [
    frontText,
    backText,
  ] = await Promise.all([
    extractTextFromOneIdImage(
      frontBuffer,
      orientation
    ),

    extractTextFromOneIdImage(
      backBuffer,
      orientation
    ),
  ]);

  console.log(
    "ID OCR completed."
  );

  return [
    frontText,
    backText,
  ]
    .filter(Boolean)
    .join("\n");
}

/* =========================================================
   IDENTITY VERIFICATION
========================================================= */

/*
 * 3 IDENTITY CHECKS:
 *
 * 1. First Name
 * 2. Last Name
 * 3. ID Number
 *
 * PASS RULE:
 *
 * At least ONE of the three must match.
 *
 * 1/3 = PASSED
 * 2/3 = PASSED
 * 3/3 = PASSED
 * 0/3 = FAILED
 */

export function verifyIdIdentity(
  ocrText: string,
  firstName: string,
  lastName: string,
  idNumber: string
): IdVerificationResult {
  const matchedFields: IdVerificationField[] =
    [];

  /* =======================================================
     FIRST NAME CHECK
  ======================================================= */

  const firstNameMatched =
    matchesName(
      ocrText,
      firstName
    );

  if (firstNameMatched) {
    matchedFields.push(
      "firstName"
    );
  }

  /* =======================================================
     LAST NAME CHECK
  ======================================================= */

  const lastNameMatched =
    matchesName(
      ocrText,
      lastName
    );

  if (lastNameMatched) {
    matchedFields.push(
      "lastName"
    );
  }

  /* =======================================================
     ID NUMBER CHECK
  ======================================================= */

  const idNumberMatched =
    matchesIdNumber(
      ocrText,
      idNumber
    );

  if (idNumberMatched) {
    matchedFields.push(
      "idNumber"
    );
  }

  /* =======================================================
     MATCH COUNT
  ======================================================= */

  const matchCount =
    matchedFields.length;

  /* =======================================================
     PASS CONDITION
     
     AT LEAST 1 OF 3 MUST MATCH
  ======================================================= */

  const passed =
    matchedFields.length >= 1;

  /* =======================================================
     LOG RESULTS
  ======================================================= */

  console.log(
    "========================================"
  );

  console.log(
    "IDENTITY VERIFICATION RESULT"
  );

  console.log(
    `First Name: ${
      firstNameMatched
        ? "MATCH"
        : "NO MATCH"
    }`
  );

  console.log(
    `Last Name: ${
      lastNameMatched
        ? "MATCH"
        : "NO MATCH"
    }`
  );

  console.log(
    `ID Number: ${
      idNumberMatched
        ? "MATCH"
        : "NO MATCH"
    }`
  );

  console.log(
    `Match Count: ${matchCount}/3`
  );

  console.log(
    `Verification: ${
      passed
        ? "PASSED"
        : "FAILED"
    }`
  );

  console.log(
    "========================================"
  );

  return {
    passed,
    matchCount,
    matchedFields,
  };
}