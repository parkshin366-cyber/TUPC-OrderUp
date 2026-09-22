import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";

// =====================================================
// TYPES
// =====================================================

export type UserRole =
  | "client"
  | "seller"
  | "admin";

export type UserStatus =
  | "pending"
  | "approved"
  | "rejected";

export type TupAffiliation =
  | "student"
  | "others";

export type IdVerificationStatus =
  | "verified";

// =====================================================
// ID VERIFICATION
// =====================================================

export interface IIdVerification {
  status: IdVerificationStatus;

  matchCount: number;

  matchedFields: (
    | "firstName"
    | "lastName"
    | "idNumber"
  )[];

  idType: string;

  // FRONT ID IS REQUIRED
  frontImagePath: string;

  // BACK ID IS NO LONGER REQUIRED
  backImagePath?: string;

  verifiedAt: Date;
}

// =====================================================
// USER INTERFACE
// =====================================================

export interface IUser extends Document {
  firstName: string;

  lastName: string;

  username: string;

  email: string;

  contact: string;

  password: string;

  role: UserRole;

  status: UserStatus;

  // ===================================================
  // TUP AFFILIATION
  // ===================================================

  tupAffiliation?: TupAffiliation;

  // ===================================================
  // STUDENT ID
  // ===================================================

  tupcId?: string;

  // ===================================================
  // GOVERNMENT ID
  // ===================================================

  governmentIdType?: string;

  governmentIdNumber?: string;

  // ===================================================
  // SECURITY
  // ===================================================

  biometricEnabled?: boolean;

  pinHash?: string;

  // ===================================================
  // ID OCR VERIFICATION
  // ===================================================

  idVerification?: IIdVerification;

  // ===================================================
  // OTP
  // ===================================================

  otpHash?: string;

  otpExpiresAt?: Date;

  // ===================================================
  // TIMESTAMPS
  // ===================================================

  createdAt: Date;

  updatedAt: Date;
}

// =====================================================
// ID VERIFICATION SCHEMA
// =====================================================

const IdVerificationSchema =
  new Schema<IIdVerification>(
    {
      status: {
        type: String,
        enum: [
          "verified",
        ],
        required: true,
      },

      matchCount: {
        type: Number,
        required: true,
        min: 1,
        max: 3,
      },

      matchedFields: {
        type: [
          {
            type: String,
            enum: [
              "firstName",
              "lastName",
              "idNumber",
            ],
          },
        ],
        required: true,
        validate: {
          validator: (
            value: string[]
          ) => {
            return (
              value.length >= 1 &&
              value.length <= 3
            );
          },

          message:
            "At least one identity field must match.",
        },
      },

      idType: {
        type: String,
        required: true,
        trim: true,
      },

      // =================================================
      // FRONT ID
      // =================================================
      frontImagePath: {
        type: String,
        required: true,
        trim: true,
      },

      // =================================================
      // BACK ID
      //
      // NO LONGER REQUIRED.
      // The registration flow now accepts FRONT ID only.
      // =================================================
      backImagePath: {
        type: String,
        required: false,
        trim: true,
      },

      verifiedAt: {
        type: Date,
        required: true,
      },
    },

    {
      _id: false,
    }
  );

// =====================================================
// USER SCHEMA
// =====================================================

const UserSchema =
  new Schema<IUser>(
    {
      // =================================================
      // PERSONAL INFORMATION
      // =================================================

      firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
      },

      lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
      },

      // =================================================
      // ACCOUNT
      // =================================================

      username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        minlength: 4,
        maxlength: 30,
      },

      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },

      contact: {
        type: String,
        required: true,
        trim: true,
      },

      password: {
        type: String,
        required: true,
        minlength: 6,
      },

      // =================================================
      // ROLE
      // =================================================

      role: {
        type: String,
        enum: [
          "client",
          "seller",
          "admin",
        ],
        required: true,
        default: "client",
      },

      // =================================================
      // ACCOUNT STATUS
      // =================================================

      status: {
        type: String,
        enum: [
          "pending",
          "approved",
          "rejected",
        ],
        required: true,
        default: "pending",
      },

      // =================================================
      // TUP AFFILIATION
      // =================================================

      tupAffiliation: {
        type: String,
        enum: [
          "student",
          "others",
        ],
      },

      // =================================================
      // TUPC ID
      // =================================================

      tupcId: {
        type: String,
        trim: true,
        uppercase: true,
      },

      // =================================================
      // GOVERNMENT ID
      // =================================================

      governmentIdType: {
        type: String,
        trim: true,
      },

      governmentIdNumber: {
        type: String,
        trim: true,
        uppercase: true,
      },

      // =================================================
      // BIOMETRIC
      // =================================================

      biometricEnabled: {
        type: Boolean,
        default: false,
      },

      // =================================================
      // PIN
      //
      // NEVER store the raw PIN.
      // authController.ts stores the bcrypt hash.
      // =================================================

      pinHash: {
        type: String,
        select: false,
      },

      // =================================================
      // OCR / ID VERIFICATION
      // =================================================

      idVerification: {
        type: IdVerificationSchema,
        required: true,
      },

      // =================================================
      // OTP
      //
      // These are temporary secrets.
      // =================================================

      otpHash: {
        type: String,
        select: false,
      },

      otpExpiresAt: {
        type: Date,
        select: false,
      },
    },

    {
      timestamps: true,
    }
  );

// =====================================================
// INDEXES
// =====================================================

UserSchema.index({
  status: 1,
});

UserSchema.index({
  role: 1,
});

UserSchema.index({
  tupAffiliation: 1,
});

// =====================================================
// MODEL
// =====================================================

const User: Model<IUser> =
  mongoose.models.User ||
  mongoose.model<IUser>(
    "User",
    UserSchema
  );

export default User;

