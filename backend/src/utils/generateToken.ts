import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

export function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is missing. Please add JWT_SECRET to your .env file."
    );
  }

  return jwt.sign(
    {
      userId,
    },
    secret,
    {
      expiresIn: "7d",
    }
  );
}