import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import {
  checkUsernameAvailability,
  registerUser,
} from "../../services/api";

import { API_URL, NGROK_HEADERS } from "../../constants/api";

const API_CAPTCHA_URL = `${API_URL}/captcha`;

const COLORS = {
  cardinal: "#A6192E",
  textMuted: "#6F686A",
  cardinalDark: "#7D1021",
  cardinalDeep: "#570B17",
  gold: "#D8B56A",
  white: "#FFFFFF",
  text: "#171717",
  muted: "#6B7280",
  lightMuted: "#9CA3AF",
  border: "#E5E7EB",
  input: "#FAFAFA",
  background: "#F7F7F8",
  softRed: "#FCECEF",
  softGold: "#FBF5E8",
  success: "#16834A",
  danger: "#C62828",
};

// Local TUPC branding assets. Place these at <project-root>/assets/.
const TUPC_LOGO = require("../../../assets/LOGO.png");
const TUPC_BG = require("../../../assets/BG.jpg");

type Affiliation = "student" | "others";
type IdImageType =
  | "tupcFront"
  | "governmentFront";

type GovernmentIdConfig = {
  label: string;
  placeholder: string;
  hint: string;
  maxLength: number;
  format: (value: string) => string;
  validate: (value: string) => boolean;
};

const onlyAlphaNumeric = (value: string) =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, "");

const digitsOnly = (value: string) => value.replace(/\D/g, "");

const formatGroups = (value: string, groups: number[]) => {
  const digits = digitsOnly(value);
  let cursor = 0;
  const parts: string[] = [];

  for (const size of groups) {
    if (cursor >= digits.length) break;
    parts.push(digits.slice(cursor, cursor + size));
    cursor += size;
  }

  return parts.join("-");
};

const formatNationalId = (value: string) =>
  formatGroups(value, [4, 4, 4, 4]);

const formatSss = (value: string) =>
  formatGroups(value, [2, 7, 1]);

const formatPhilHealth = (value: string) =>
  formatGroups(value, [2, 9, 1]);

const formatPagIbig = (value: string) =>
  formatGroups(value, [4, 4, 4]);

const formatTin = (value: string) =>
  formatGroups(value, [3, 3, 3, 5]);

const formatPrclId = (value: string) =>
  digitsOnly(value).slice(0, 7);

const formatDriverLicense = (value: string) =>
  onlyAlphaNumeric(value).slice(0, 12);

const formatPassport = (value: string) =>
  onlyAlphaNumeric(value).slice(0, 9);

const formatUmid = (value: string) =>
  onlyAlphaNumeric(value).slice(0, 14);

const formatPostalId = (value: string) =>
  onlyAlphaNumeric(value).slice(0, 15);

const GOVERNMENT_ID_CONFIGS: GovernmentIdConfig[] = [
  {
    label: "National ID",
    placeholder: "1234-5678-9012-3456",
    hint: "16-digit PhilSys Card Number (PCN)",
    maxLength: 19,
    format: formatNationalId,
    validate: (value) => /^\d{4}-\d{4}-\d{4}-\d{4}$/.test(value),
  },
  {
    label: "Driver's License",
    placeholder: "N01-12-345678",
    hint: "Use the license number exactly as printed on your card.",
    maxLength: 20,
    format: formatDriverLicense,
    validate: (value) => /^[A-Z0-9-]{5,20}$/.test(value),
  },
  {
    label: "Passport",
    placeholder: "P1234567A",
    hint: "6–9 uppercase letters/numbers, as printed on the passport.",
    maxLength: 9,
    format: formatPassport,
    validate: (value) => /^[A-Z0-9]{6,9}$/.test(value),
  },
  {
    label: "SSS ID",
    placeholder: "34-1234567-8",
    hint: "10-digit SSS number in 2-7-1 format.",
    maxLength: 12,
    format: formatSss,
    validate: (value) => /^\d{2}-\d{7}-\d$/.test(value),
  },
  {
    label: "UMID",
    placeholder: "CRN-0000-0000000-0",
    hint: "Enter the UMID/CRN exactly as printed on the card.",
    maxLength: 20,
    format: formatUmid,
    validate: (value) => /^[A-Z0-9-]{8,20}$/.test(value),
  },
  {
    label: "PhilHealth ID",
    placeholder: "12-345678901-2",
    hint: "12-digit PhilHealth Identification Number in 2-9-1 format.",
    maxLength: 14,
    format: formatPhilHealth,
    validate: (value) => /^\d{2}-\d{9}-\d$/.test(value),
  },
  {
    label: "Pag-IBIG ID",
    placeholder: "1234-5678-9012",
    hint: "12-digit MID number in 4-4-4 format.",
    maxLength: 14,
    format: formatPagIbig,
    validate: (value) => /^\d{4}-\d{4}-\d{4}$/.test(value),
  },
  {
    label: "TIN",
    placeholder: "123-456-789-00000",
    hint: "14-digit TIN in 3-3-3-5 format.",
    maxLength: 17,
    format: formatTin,
    validate: (value) => /^\d{3}-\d{3}-\d{3}-\d{5}$/.test(value),
  },
  {
    label: "PRC ID",
    placeholder: "0012345",
    hint: "7-digit PRC license number.",
    maxLength: 7,
    format: formatPrclId,
    validate: (value) => /^\d{7}$/.test(value),
  },
  {
    label: "Postal ID",
    placeholder: "A1B2C3D4E5",
    hint: "Enter the ID number exactly as printed on the card.",
    maxLength: 15,
    format: formatPostalId,
    validate: (value) => /^[A-Z0-9]{5,15}$/.test(value),
  },
];

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  description: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={20} color={COLORS.cardinal} />
      </View>

      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionDescription}>{description}</Text>

        <View style={styles.sectionDivider} />
      </View>
    </View>
  );
}

function IdImageUpload({
  title,
  imageUri,
  onPress,
}: {
  title: string;
  imageUri: string | null;
  onPress: () => void;
}) {
  const isFront = /front/i.test(title);

  return (
    <View style={styles.idUpload}>
      <View style={styles.idUploadTop}>
        <View style={styles.idUploadTitleWrap}>
          <View style={styles.idUploadTitleIcon}>
            <Ionicons
              name={isFront ? "card-outline" : "copy-outline"}
              size={14}
              color={COLORS.cardinal}
            />
          </View>

          <View>
            <Text style={styles.idUploadTitle}>{title}</Text>
            <Text style={styles.idUploadHint}>
              {isFront ? "Front side" : "Back side"} • Clear & readable
            </Text>
          </View>
        </View>

        {imageUri ? (
          <View style={styles.uploadedBadge}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={COLORS.success}
            />
            <Text style={styles.uploadedBadgeText}>Ready</Text>
          </View>
        ) : (
          <View style={styles.requiredBadge}>
            <Text style={styles.requiredBadgeText}>Required</Text>
          </View>
        )}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.uploadBox,
          pressed && styles.pressed,
          imageUri && styles.uploadBoxSelected,
        ]}
        onPress={onPress}
        disabled={false}
      >
        {imageUri ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />

            <View style={styles.previewOverlay}>
              <View style={styles.previewOverlayBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={COLORS.white}
                />
                <Text style={styles.previewOverlayText}>Photo selected</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyUploadContent}>
            <View style={styles.uploadIcon}>
              <Ionicons
                name="camera-outline"
                size={25}
                color={COLORS.cardinal}
              />
            </View>

            <Text style={styles.uploadMainText}>Add {isFront ? "front" : "back"} photo</Text>
            <Text style={styles.uploadSubText}>
              Choose from Gallery or take a new photo
            </Text>

            <View style={styles.uploadActionHint}>
              <Ionicons
                name="images-outline"
                size={13}
                color={COLORS.cardinal}
              />
              <Text style={styles.uploadActionHintText}>Tap to choose an option</Text>
            </View>
          </View>
        )}
      </Pressable>

      <View style={styles.uploadBottomRow}>
        <View style={styles.uploadFormatRow}>
          <Ionicons
            name="shield-checkmark-outline"
            size={13}
            color={COLORS.muted}
          />
          <Text style={styles.uploadFormatText}>JPG or PNG</Text>
        </View>

        {imageUri ? (
          <Pressable onPress={onPress} style={styles.changeImageButton}>
            <Ionicons
              name="swap-horizontal-outline"
              size={15}
              color={COLORS.cardinal}
            />
            <Text style={styles.changeImageText}>Change photo</Text>
          </Pressable>
        ) : (
          <View style={styles.uploadFormatRow}>
            <Ionicons
              name="eye-outline"
              size={13}
              color={COLORS.muted}
            />
            <Text style={styles.uploadFormatText}>Readable details</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function SellerRegisterScreen() {
  // =====================================================
  // PERSONAL & ACCOUNT INFORMATION
  // =====================================================

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // =====================================================
  // STORE INFORMATION
  // =====================================================

  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");

  // =====================================================
  // ACCOUNT CREDENTIALS
  // =====================================================

  const [username, setUsername] = useState("");

  const [usernameAvailability, setUsernameAvailability] = useState<
    "idle" | "checking" | "available" | "taken" | "error"
  >("idle");

  const [usernameAvailabilityMessage, setUsernameAvailabilityMessage] =
    useState("");

  const usernameCheckRequestId = useRef(0);

  // =====================================================
  // CONTACT / EMAIL
  // =====================================================

  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");

  // =====================================================
  // TUP AFFILIATION / IDENTITY
  // =====================================================

  const [affiliation, setAffiliation] =
    useState<Affiliation>("student");

  const handleAffiliationChange = (nextAffiliation: Affiliation) => {
    if (isLoading) return;

    setAffiliation(nextAffiliation);
    setGovernmentIdDropdownOpen(false);

    // Clear identity fields that belong to the previous affiliation.
    // This prevents stale ID information from being submitted after switching.
    if (nextAffiliation === "student") {
      setGovernmentIdType("");
      setGovernmentIdNumber("");
      setGovernmentIdFront(null);
    } else {
      setTupcId("");
      setTupcIdFront(null);
    }
  };

  const [tupcId, setTupcId] = useState("");
  const [tupcIdFront, setTupcIdFront] =
    useState<string | null>(null);
  const [governmentIdType, setGovernmentIdType] = useState("");
  const [governmentIdDropdownOpen, setGovernmentIdDropdownOpen] =
    useState(false);
  const [governmentIdNumber, setGovernmentIdNumber] =
    useState("");
  const [governmentIdFront, setGovernmentIdFront] =
    useState<string | null>(null);

  // =====================================================
  // PASSWORD
  // =====================================================

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  // =====================================================
  // CAPTCHA
  // =====================================================

  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  // =====================================================
  // UI
  // =====================================================

  const [isLoading, setIsLoading] = useState(false);

  // =====================================================
  // ID PHOTO PICKER UI
  // =====================================================

  const [idPickerVisible, setIdPickerVisible] = useState(false);
  const [idPickerType, setIdPickerType] =
    useState<IdImageType | null>(null);

  const closeIdPicker = () => {
    if (isLoading) return;
    setIdPickerVisible(false);
    setIdPickerType(null);
  };

  // =====================================================
  // USERNAME AVAILABILITY
  // Same live username authentication used by Client registration.
  // =====================================================

  useEffect(() => {
    const cleanUsername = username.trim().toLowerCase();

    usernameCheckRequestId.current += 1;
    const requestId = usernameCheckRequestId.current;

    if (!cleanUsername) {
      setUsernameAvailability("idle");
      setUsernameAvailabilityMessage("");
      return;
    }

    if (cleanUsername.length < 4) {
      setUsernameAvailability("idle");
      setUsernameAvailabilityMessage(
        "Username must contain at least 4 characters."
      );
      return;
    }

    setUsernameAvailability("checking");
    setUsernameAvailabilityMessage("Checking username...");

    const timer = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability(cleanUsername);

        if (requestId !== usernameCheckRequestId.current) {
          return;
        }

        if (result.available) {
          setUsernameAvailability("available");
          setUsernameAvailabilityMessage(
            result.message || "Username is available."
          );
        } else {
          setUsernameAvailability("taken");
          setUsernameAvailabilityMessage(
            result.message || "Username is already registered."
          );
        }
      } catch (error) {
        if (requestId !== usernameCheckRequestId.current) {
          return;
        }

        setUsernameAvailability("error");
        setUsernameAvailabilityMessage(
          error instanceof Error
            ? error.message
            : "Unable to check username availability."
        );
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [username]);

  // =====================================================
  // PASSWORD CHECKER
  // =====================================================

  const passwordChecks = useMemo(() => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const passwordScore =
    Object.values(passwordChecks).filter(Boolean).length;

  const passwordStrong = passwordScore === 5;

  // =====================================================
  // CONTACT
  // =====================================================

  const handleContactChange = (value: string) => {
    let digits = value.replace(/\D/g, "");

    if (digits.startsWith("63")) {
      digits = digits.slice(2);
    }

    if (digits.startsWith("0")) {
      digits = digits.slice(1);
    }

    digits = digits.slice(0, 10);

    setContact(digits);
  };

  // =====================================================
  // TUPC ID
  // =====================================================

  const handleTupcIdChange = (value: string) => {
    const clean = value
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, "")
      .slice(0, 12);

    setTupcId(clean);
  };

  // =====================================================
  // GOVERNMENT ID
  // =====================================================

  const selectedGovernmentIdConfig = useMemo(
    () =>
      GOVERNMENT_ID_CONFIGS.find(
        (item) => item.label === governmentIdType
      ),
    [governmentIdType]
  );

  const handleGovernmentIdTypeSelect = (type: string) => {
    setGovernmentIdType(type);
    setGovernmentIdNumber("");
    setGovernmentIdDropdownOpen(false);
  };

  const handleGovernmentIdNumberChange = (value: string) => {
    if (!selectedGovernmentIdConfig) {
      setGovernmentIdNumber(value);
      return;
    }

    setGovernmentIdNumber(
      selectedGovernmentIdConfig.format(value).slice(
        0,
        selectedGovernmentIdConfig.maxLength
      )
    );
  };

  // =====================================================
  // EMAIL
  // =====================================================

  const handleEmailChange = (value: string) => {
    setEmail(value.trim().toLowerCase());
  };

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  // Student sellers must use the TUP institutional/GSFE email.
  const isValidStudentGsfeEmail = (value: string) => {
    return /^[^\s@]+@gsfe.tupcavite\.edu\.ph$/i.test(
      value.trim().toLowerCase()
    );
  };

  // =====================================================
  // ID IMAGE PICKER / CAMERA
  // SAME BEHAVIOR AS CLIENT REGISTRATION
  //
  // TUPC-ID FRONT:
  //   - Phone/camera stays PORTRAIT
  //   - Capture frame = portrait
  //
  // GOVERNMENT ID FRONT:
  //   - Phone/camera stays PORTRAIT
  //   - Capture frame = landscape (16:10)
  //   - DO NOT rotate the whole phone to landscape
  //
  // User can:
  //   - Take Photo
  //   - Choose from Gallery
  //
  // After camera closes:
  //   - Restore normal orientation
  // =====================================================

  const setIdImage = (type: IdImageType, imageUri: string) => {
    switch (type) {
      case "tupcFront":
        setTupcIdFront(imageUri);
        break;

      case "governmentFront":
        setGovernmentIdFront(imageUri);
        break;
    }
  };

  const pickIdImage = async (type: IdImageType) => {
    let previousOrientationLock:
      | ScreenOrientation.OrientationLock
      | null = null;

    try {
      if (isLoading) return;

      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Camera Permission Required",
          "Please allow camera access so you can take a clear photo of your ID."
        );
        return;
      }

      const isTupcId = type === "tupcFront";

      // IMPORTANT:
      // The PHONE/CAMERA screen stays PORTRAIT for both ID types.
      // Government ID gets a LANDSCAPE 16:10 crop frame after capture.
      // We never lock the device to LANDSCAPE.
      const targetOrientation =
        ScreenOrientation.OrientationLock.PORTRAIT_UP;

      const targetAspect: [number, number] = isTupcId
        ? [3, 4]
        : [16, 10];

      // Save the current orientation lock first.
      // Do NOT use unlockAsync() afterwards because that can allow
      // the phone to rotate when returning from the camera.
      previousOrientationLock =
        await ScreenOrientation.getOrientationLockAsync();

      // Force camera to start in portrait.
      await ScreenOrientation.lockAsync(targetOrientation);

      const result =
        await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: targetAspect,
          quality: 0.9,
          cameraType: ImagePicker.CameraType.back,
        });

      if (
        result.canceled ||
        !result.assets?.length
      ) {
        return;
      }

      const imageUri = result.assets[0].uri;
      setIdImage(type, imageUri);
    } catch (error) {
      console.error("ID CAMERA ERROR:", error);

      Alert.alert(
        "Camera Failed",
        "Unable to open the camera or capture the ID image. Please try again."
      );
    } finally {
      // Restore the exact orientation lock from before the camera opened.
      if (previousOrientationLock !== null) {
        try {
          await ScreenOrientation.lockAsync(
            previousOrientationLock
          );
        } catch (orientationError) {
          console.error(
            "SCREEN ORIENTATION RESTORE ERROR:",
            orientationError
          );

          // Safe fallback: keep registration screen portrait.
          try {
            await ScreenOrientation.lockAsync(
              ScreenOrientation.OrientationLock.PORTRAIT_UP
            );
          } catch (fallbackError) {
            console.error(
              "SCREEN ORIENTATION FALLBACK ERROR:",
              fallbackError
            );
          }
        }
      }
    }
  };

  const chooseIdPhotoFromGallery = async (
    type: IdImageType
  ) => {
    try {
      if (isLoading) return;

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow photo library access so you can choose your ID photo."
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          quality: 0.9,
        });

      if (
        result.canceled ||
        !result.assets?.length
      ) {
        return;
      }

      setIdImage(
        type,
        result.assets[0].uri
      );
    } catch (error) {
      console.error(
        "ID GALLERY ERROR:",
        error
      );

      Alert.alert(
        "Upload Error",
        "Unable to select the ID photo."
      );
    }
  };

  const pickIdImageFromMenu = (
    type: IdImageType
  ) => {
    if (isLoading) return;

    setIdPickerType(type);
    setIdPickerVisible(true);
  };

  const handleIdPickerGallery = async () => {
    if (!idPickerType) return;

    const type = idPickerType;
    setIdPickerVisible(false);
    setIdPickerType(null);

    await chooseIdPhotoFromGallery(type);
  };

  const handleIdPickerCamera = async () => {
    if (!idPickerType) return;

    const type = idPickerType;
    setIdPickerVisible(false);
    setIdPickerType(null);

    await pickIdImage(type);
  };

  const idPickerIsTupc =
    idPickerType === "tupcFront";

  const idPickerSide = "Front";

  const idPickerTitle = idPickerIsTupc
    ? "TUPC-ID Front Photo"
    : "Government ID Front Photo";

  const idPickerDescription = idPickerIsTupc
    ? "Choose how you want to add your TUPC-ID photo."
    : "Choose how you want to add your Government ID photo.";

  // =====================================================
  // CAPTCHA
  // =====================================================

  const handleCaptchaMessage = (event: any) => {
    try {
      const raw = event?.nativeEvent?.data;

      if (!raw) {
        return;
      }

      const message =
        typeof raw === "string"
          ? JSON.parse(raw)
          : raw;

      const type = String(
        message?.type || ""
      ).toLowerCase();

      if (
        type === "captcha-success" ||
        type === "captcha_success"
      ) {
        const token =
          message?.token ||
          message?.captchaToken ||
          "";

        if (token) {
          setCaptchaToken(String(token));
        }

        return;
      }

      if (
        type === "captcha-expired" ||
        type === "captcha_expired"
      ) {
        setCaptchaToken("");
        return;
      }

      if (
        type === "captcha-error" ||
        type === "captcha_error"
      ) {
        setCaptchaToken("");
        console.warn(
          "CAPTCHA ERROR:",
          message?.message
        );
      }
    } catch (error) {
      console.warn(
        "Unable to parse CAPTCHA message:",
        error
      );
    }
  };

  const refreshCaptcha = () => {
    setCaptchaToken("");
    setCaptchaKey((current) => current + 1);
  };

  // =====================================================
  // REGISTER
  // =====================================================

  const handleRegister = async () => {
    if (isLoading) {
      return;
    }

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanStoreName = storeName.trim();
    const cleanStoreDescription =
      storeDescription.trim();
    const cleanUsername =
      username.trim().toLowerCase();
    const cleanEmail =
      email.trim().toLowerCase();
    const cleanContact = contact.trim();
    const cleanTupcId =
      tupcId.trim().toUpperCase();
    const cleanGovernmentIdType =
      governmentIdType.trim();
    const cleanGovernmentIdNumber =
      governmentIdNumber.trim();

    // =================================================
    // CAPTCHA
    // =================================================

    if (!captchaToken) {
      Alert.alert(
        "CAPTCHA Required",
        "Please complete the CAPTCHA verification before creating your seller account."
      );
      return;
    }

    // =================================================
    // PERSONAL INFORMATION
    // =================================================

    if (!cleanFirstName) {
      Alert.alert(
        "First Name Required",
        "Please enter your first name."
      );
      return;
    }

    if (!cleanLastName) {
      Alert.alert(
        "Last Name Required",
        "Please enter your last name."
      );
      return;
    }

    // =================================================
    // STORE INFORMATION
    // =================================================

    if (!cleanStoreName) {
      Alert.alert(
        "Store Name Required",
        "Please enter your store name."
      );
      return;
    }

    if (cleanStoreName.length < 2) {
      Alert.alert(
        "Invalid Store Name",
        "Store name must contain at least 2 characters."
      );
      return;
    }

    if (!cleanStoreDescription) {
      Alert.alert(
        "Store Description Required",
        "Please provide a short description of your store."
      );
      return;
    }

    // =================================================
    // USERNAME
    // =================================================

    if (!cleanUsername) {
      Alert.alert(
        "Username Required",
        "Please choose a username."
      );
      return;
    }

    if (cleanUsername.length < 4) {
      Alert.alert(
        "Username Too Short",
        "Username must contain at least 4 characters."
      );
      return;
    }

    if (!/^[a-z0-9._]+$/.test(cleanUsername)) {
      Alert.alert(
        "Invalid Username",
        "Use only lowercase letters, numbers, dots, and underscores."
      );
      return;
    }

    if (usernameAvailability === "checking") {
      Alert.alert(
        "Please Wait",
        "We're still checking if that username is available."
      );
      return;
    }

    if (usernameAvailability === "taken") {
      Alert.alert(
        "Username Unavailable",
        "That username is already registered. Please choose another username."
      );
      return;
    }

    if (usernameAvailability === "error") {
      Alert.alert(
        "Username Check Failed",
        "We couldn't verify the username right now. Please wait a moment and try again."
      );
      return;
    }

    if (usernameAvailability !== "available") {
      Alert.alert(
        "Username Not Verified",
        "Please wait for the username availability check to finish before creating your seller account."
      );
      return;
    }

    // =================================================
    // EMAIL
    // =================================================

    if (!cleanEmail) {
      Alert.alert(
        "Email Required",
        "Please enter your email address."
      );
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address."
      );
      return;
    }

    if (
      affiliation === "student" &&
      !cleanEmail.toLowerCase().endsWith("@gsfe.tupcavite.edu.ph")
    ) {
      Alert.alert(
        "TUP GSFE Email Required",
        "Student sellers must use their TUP institutional/GSFE email ending in @gsfe.tupcavite.edu.ph."
      );
      return;
    }

    // =================================================
    // MOBILE
    // =================================================

    if (!cleanContact) {
      Alert.alert(
        "Mobile Number Required",
        "Please enter your Philippine mobile number."
      );
      return;
    }

    if (
      cleanContact.length !== 10 ||
      !/^9\d{9}$/.test(cleanContact)
    ) {
      Alert.alert(
        "Invalid Mobile Number",
        "Please enter a valid 10-digit Philippine mobile number."
      );
      return;
    }

    // =================================================
    // AFFILIATION / IDENTITY
    // =================================================

    if (affiliation === "student") {
      if (!cleanTupcId) {
        Alert.alert(
          "TUPC-ID Required",
          "Students must provide their TUPC-ID."
        );
        return;
      }

      if (
        !/^TUPC-\d{2}-\d{4}$/.test(
          cleanTupcId
        )
      ) {
        Alert.alert(
          "Invalid TUPC-ID",
          "Use the format TUPC-YY-NNNN."
        );
        return;
      }

      if (!tupcIdFront) {
        Alert.alert(
          "TUPC-ID Front Required",
          "Please upload the front photo of your TUPC-ID."
        );
        return;
      }

    }

    // GOVERNMENT ID IS REQUIRED ONLY FOR "OTHERS".
    // Student sellers use TUPC-ID only.
    if (affiliation === "others") {
      if (!cleanGovernmentIdType) {
        Alert.alert(
          "Government ID Required",
          "Please select your Government ID type."
        );
        return;
      }

      if (!cleanGovernmentIdNumber) {
        Alert.alert(
          "Government ID Number Required",
          "Please enter your Government ID number."
        );
        return;
      }

      const selectedGovernmentId = GOVERNMENT_ID_CONFIGS.find(
        (item) => item.label === cleanGovernmentIdType
      );

      if (
        !selectedGovernmentId ||
        !selectedGovernmentId.validate(cleanGovernmentIdNumber)
      ) {
        Alert.alert(
          "Invalid Government ID Number",
          selectedGovernmentId
            ? `Please enter a valid ${selectedGovernmentId.label} number using the required format.`
            : "Please select a valid government ID type."
        );
        return;
      }

      if (!governmentIdFront) {
        Alert.alert(
          "Government ID Front Required",
          "Please upload the front photo of your Government ID."
        );
        return;
      }

    }

    // =================================================
    // PASSWORD
    // =================================================

    if (!password) {
      Alert.alert(
        "Password Required",
        "Please create a password."
      );
      return;
    }

    if (!passwordStrong) {
      Alert.alert(
        "Weak Password",
        "Please satisfy all password requirements."
      );
      return;
    }

    const cleanPassword = password;
    const cleanConfirmPassword = confirmPassword;

    if (cleanPassword !== cleanConfirmPassword) {
      console.log("PASSWORD DEBUG - FRONTEND MISMATCH", {
        passwordLength: cleanPassword.length,
        confirmPasswordLength: cleanConfirmPassword.length,
        passwordsMatch: false,
      });

      Alert.alert(
        "Passwords Do Not Match",
        "Please make sure both passwords are exactly the same."
      );
      return;
    }

    // =================================================
    // REGISTER
    // =================================================

    try {
      setIsLoading(true);

      console.log(
        "========================================"
      );
      console.log(
        "TUPC-ORDERUP SELLER REGISTRATION"
      );
      console.log(
        "========================================"
      );

      console.log(
        "Email:",
        cleanEmail
      );
      console.log(
        "Store:",
        cleanStoreName
      );
      console.log(
        "Affiliation:",
        affiliation
      );
      console.log(
        "TUPC ID Front:",
        !!tupcIdFront
      );
      console.log(
        "Government ID Front:",
        !!governmentIdFront
      );
      // IMPORTANT:
      // Do NOT console.log actual passwords or CAPTCHA token.
      // Log lengths only so password mismatches can be diagnosed safely.
      console.log("PASSWORD DEBUG - FRONTEND", {
        passwordLength: password.length,
        confirmPasswordLength: confirmPassword.length,
        passwordsMatch: password === confirmPassword,
      });


      const data = await registerUser({
        firstName: cleanFirstName,
        lastName: cleanLastName,

        storeName: cleanStoreName,
        storeDescription:
          cleanStoreDescription,

        username: cleanUsername,
        email: cleanEmail,

        contact: `0${cleanContact}`,

        password: cleanPassword,
        confirmPassword: cleanConfirmPassword,

        role: "seller",

        tupAffiliation: affiliation,

        tupcId:
          affiliation === "student"
            ? cleanTupcId
            : undefined,

        governmentIdType:
          affiliation === "others"
            ? cleanGovernmentIdType
            : undefined,

        governmentIdNumber:
          affiliation === "others"
            ? cleanGovernmentIdNumber
            : undefined,

        // =================================================
        // ID IMAGES
        // These are uploaded by services/api.ts as
        // multipart/form-data.
        // =================================================

        tupcIdFront:
          affiliation === "student" && tupcIdFront
            ? {
                uri: tupcIdFront,
                name: "tupc-id-front.jpg",
                type: "image/jpeg",
              }
            : undefined,


        governmentIdFront:
          affiliation === "others" && governmentIdFront
            ? {
                uri: governmentIdFront,
                name: "government-id-front.jpg",
                type: "image/jpeg",
              }
            : undefined,

        captchaToken,
      } as any);

      console.log(
        "SELLER REGISTER RESPONSE:",
        data
      );

      if (!data.success) {
        throw new Error(
          data.message ||
            "Unable to create your seller account."
        );
      }

      if (!data.userId) {
        throw new Error(
          "Registration succeeded, but the user ID was not returned."
        );
      }

      if (!data.email) {
        throw new Error(
          "Registration succeeded, but the email address was not returned."
        );
      }

      router.replace({
        pathname: "/(auth)/otp",
        params: {
          userId: data.userId,
          email: data.email,
          role: data.role || "seller",
          otpPurpose: "register",
        },
      });
    } catch (error) {
      console.error(
        "SELLER REGISTER ERROR:",
        error
      );

      Alert.alert(
        "Registration Failed",
        error instanceof Error
          ? error.message
          : "Unable to connect to the server."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // PASSWORD REQUIREMENT
  // =====================================================

  const PasswordRequirement = ({
    valid,
    text,
  }: {
    valid: boolean;
    text: string;
  }) => {
    return (
      <View style={styles.requirementRow}>
        <Ionicons
          name={
            valid
              ? "checkmark-circle"
              : "ellipse-outline"
          }
          size={16}
          color={
            valid
              ? COLORS.success
              : COLORS.muted
          }
        />

        <Text
          style={[
            styles.requirementText,
            valid &&
              styles.requirementTextValid,
          ]}
        >
          {text}
        </Text>
      </View>
    );
  };


  // =====================================================
  // PREMIUM UI ANIMATIONS
  // =====================================================

  const pageOpacity = useRef(new Animated.Value(0)).current;
  const pageTranslateY = useRef(new Animated.Value(18)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(pageOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(pageTranslateY, {
        toValue: 0,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 55,
        useNativeDriver: true,
      }),
      Animated.timing(progressWidth, {
        toValue: 1,
        duration: 700,
        delay: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [pageOpacity, pageTranslateY, logoScale, logoOpacity, progressWidth]);

  const animatePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.985,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const animatePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <Animated.View
          style={[
            styles.animatedPage,
            {
              opacity: pageOpacity,
              transform: [{ translateY: pageTranslateY }],
            },
          ]}
        >
        <ScrollView
          contentContainerStyle={
            styles.container
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <Modal
          visible={idPickerVisible}
          transparent
          animationType="fade"
          onRequestClose={closeIdPicker}
        >
          <View style={styles.idPickerBackdrop}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={closeIdPicker}
            />

            <View style={styles.idPickerModal}>
              <View style={styles.idPickerHandle} />

              <View style={styles.idPickerHeader}>
                <View style={styles.idPickerHeaderIcon}>
                  <Ionicons
                    name={idPickerIsTupc ? "card-outline" : "shield-checkmark-outline"}
                    size={25}
                    color={COLORS.cardinal}
                  />
                </View>

                <View style={styles.idPickerHeaderText}>
                  <Text style={styles.idPickerTitle}>
                    {idPickerTitle}
                  </Text>
                  <Text style={styles.idPickerDescription}>
                    {idPickerDescription}
                  </Text>
                </View>

                <Pressable
                  onPress={closeIdPicker}
                  style={styles.idPickerClose}
                  hitSlop={8}
                >
                  <Ionicons
                    name="close"
                    size={21}
                    color={COLORS.muted}
                  />
                </Pressable>
              </View>

              <View style={styles.idPickerDivider} />

              <Pressable
                style={({ pressed }) => [
                  styles.idPickerOption,
                  pressed && styles.idPickerOptionPressed,
                ]}
                onPress={handleIdPickerGallery}
              >
                <View style={styles.idPickerOptionIconGallery}>
                  <Ionicons
                    name="images-outline"
                    size={24}
                    color={COLORS.cardinal}
                  />
                </View>

                <View style={styles.idPickerOptionContent}>
                  <Text style={styles.idPickerOptionTitle}>
                    Choose from Gallery
                  </Text>
                  <Text style={styles.idPickerOptionDescription}>
                    Select an existing ID photo from your phone.
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color={COLORS.lightMuted}
                />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.idPickerOption,
                  pressed && styles.idPickerOptionPressed,
                ]}
                onPress={handleIdPickerCamera}
              >
                <View style={styles.idPickerOptionIconCamera}>
                  <Ionicons
                    name="camera-outline"
                    size={24}
                    color={COLORS.white}
                  />
                </View>

                <View style={styles.idPickerOptionContent}>
                  <Text style={styles.idPickerOptionTitle}>
                    Take Photo
                  </Text>
                  <Text style={styles.idPickerOptionDescription}>
                    Open the camera and capture a clear ID photo.
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color={COLORS.lightMuted}
                />
              </Pressable>

              <Pressable
                style={styles.idPickerCancelButton}
                onPress={closeIdPicker}
              >
                <Text style={styles.idPickerCancelText}>Cancel</Text>
              </Pressable>

              <View style={styles.idPickerSecurityNote}>
                <Ionicons
                  name="lock-closed-outline"
                  size={13}
                  color={COLORS.muted}
                />
                <Text style={styles.idPickerSecurityText}>
                  Make sure the entire ID is visible and the details are readable.
                </Text>
              </View>
            </View>
          </View>
        </Modal>

          {/* HEADER / HERO */}

          <View style={styles.hero}>
            <Image source={TUPC_BG} style={styles.heroBackgroundImage} resizeMode="cover" />
            <View style={styles.heroOverlay} />

            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={isLoading}
              hitSlop={10}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={COLORS.white}
              />
            </Pressable>
            <View style={styles.heroContent}>
              <Text style={styles.eyebrow}>TUPC-ORDERUP</Text>
              <Text style={styles.title}>Create your seller account</Text>
              <Text style={styles.subtitle}>Build your campus storefront, connect with customers, and grow your service within the TUP Cavite community.</Text>
            </View>
          </View>

          {/* PROGRESS */}

          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <Text
                style={styles.progressLabel}
              >
                SELLER ACCOUNT SETUP
              </Text>

              <Text
                style={styles.progressStep}
              >
                STEP 1 OF 3
              </Text>
            </View>

            <View
              style={styles.progressTrack}
            >
              <Animated.View
                style={[
                  styles.progressActive,
                  {
                    width: progressWidth.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "33.33%"],
                    }),
                  },
                ]}
              />
            </View>

            <View
              style={styles.progressLabels}
            >
              <Text
                style={styles.progressCurrent}
              >
                Details
              </Text>

              <Text
                style={styles.progressMuted}
              >
                Verification
              </Text>

              <Text
                style={styles.progressMuted}
              >
                Approval
              </Text>
            </View>
          </View>

          {/* AFFILIATION */}

          <View style={styles.card}>
            <SectionHeader
              icon="school-outline"
              title="TUP Affiliation"
              description={
                affiliation === "student"
                  ? "Student selected: TUPC-ID + TUP GSFE email are required."
                  : "Others selected: Government ID + regular email are required."
              }
            />

            <View
              style={styles.affiliationRow}
            >
              <Pressable
                style={[
                  styles.affiliationCard,
                  affiliation ===
                    "student" &&
                    styles.affiliationCardActive,
                ]}
                onPress={() =>
                  handleAffiliationChange("student")
                }
                disabled={isLoading}
              >
                <View
                  style={[
                    styles.affiliationIcon,
                    affiliation ===
                      "student" &&
                      styles.affiliationIconActive,
                  ]}
                >
                  <Ionicons
                    name="school-outline"
                    size={22}
                    color={
                      affiliation ===
                      "student"
                        ? COLORS.white
                        : COLORS.cardinal
                    }
                  />
                </View>

                <Text
                  style={[
                    styles.affiliationTitle,
                    affiliation ===
                      "student" &&
                      styles.affiliationTitleActive,
                  ]}
                >
                  Student
                </Text>

                <Text
                  style={[
                    styles.affiliationDescription,
                    affiliation ===
                      "student" &&
                      styles.affiliationDescriptionActive,
                  ]}
                >
                  TUPC-ID required
                </Text>

                {affiliation ===
                  "student" && (
                  <View
                    style={styles.selectedBadge}
                  >
                    <Ionicons
                      name="checkmark"
                      size={13}
                      color={
                        COLORS.cardinal
                      }
                    />
                  </View>
                )}
              </Pressable>

              <Pressable
                style={[
                  styles.affiliationCard,
                  affiliation ===
                    "others" &&
                    styles.affiliationCardActive,
                ]}
                onPress={() =>
                  handleAffiliationChange("others")
                }
                disabled={isLoading}
              >
                <View
                  style={[
                    styles.affiliationIcon,
                    affiliation ===
                      "others" &&
                      styles.affiliationIconActive,
                  ]}
                >
                  <Ionicons
                    name="id-card-outline"
                    size={22}
                    color={
                      affiliation ===
                      "others"
                        ? COLORS.white
                        : COLORS.cardinal
                    }
                  />
                </View>

                <Text
                  style={[
                    styles.affiliationTitle,
                    affiliation ===
                      "others" &&
                      styles.affiliationTitleActive,
                  ]}
                >
                  Others
                </Text>

                <Text
                  style={[
                    styles.affiliationDescription,
                    affiliation ===
                      "others" &&
                      styles.affiliationDescriptionActive,
                  ]}
                >
                  Government ID
                </Text>

                {affiliation ===
                  "others" && (
                  <View
                    style={styles.selectedBadge}
                  >
                    <Ionicons
                      name="checkmark"
                      size={13}
                      color={
                        COLORS.cardinal
                      }
                    />
                  </View>
                )}
              </Pressable>
            </View>

          </View>


          {/* PERSONAL */}

          <View style={styles.card}>
            <SectionHeader
              icon="person-outline"
              title="Personal & Account Information"
              description="Enter your personal details and the account information you will use to sign in."
            />

            <View style={styles.nameRow}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>
                  First Name
                </Text>

                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  placeholderTextColor={
                    COLORS.lightMuted
                  }
                  autoCapitalize="words"
                  editable={!isLoading}
                  style={styles.input}
                />
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.label}>
                  Last Name
                </Text>

                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  placeholderTextColor={
                    COLORS.lightMuted
                  }
                  autoCapitalize="words"
                  editable={!isLoading}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Mobile Number
              </Text>

              <View
                style={styles.inputWrapper}
              >
                <Ionicons
                  name="call-outline"
                  size={19}
                  color={COLORS.cardinal}
                />

                <View
                  style={styles.countryCode}
                >
                  <Text
                    style={styles.countryFlag}
                  >
                    🇵🇭
                  </Text>

                  <Text
                    style={
                      styles.countryCodeText
                    }
                  >
                    +63
                  </Text>
                </View>

                <View
                  style={styles.phoneDivider}
                />

                <TextInput
                  value={contact}
                  onChangeText={
                    handleContactChange
                  }
                  placeholder="9XXXXXXXXX"
                  placeholderTextColor={
                    COLORS.lightMuted
                  }
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={!isLoading}
                  style={styles.phoneInput}
                />
              </View>

              <Text style={styles.fieldHintText}>
                Enter the 10 digits after +63.
              </Text>
            </View>

            {/* USERNAME */}
            <Text style={styles.label}>
              Username
            </Text>

            <View
              style={[
                styles.inputWrapper,
                usernameAvailability === "available" &&
                  styles.usernameInputAvailable,
                usernameAvailability === "taken" &&
                  styles.usernameInputTaken,
                usernameAvailability === "error" &&
                  styles.usernameInputError,
              ]}
            >
              <Ionicons
                name="at-outline"
                size={20}
                color={COLORS.cardinal}
              />

              <TextInput
                value={username}
                onChangeText={(value) => {
                  const cleaned = value
                    .toLowerCase()
                    .replace(/[^a-z0-9._]/g, "");

                  setUsername(cleaned);
                }}
                placeholder="Choose a username"
                placeholderTextColor={COLORS.lightMuted}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                style={styles.inputWithIcon}
              />
            </View>

            {usernameAvailability === "checking" && (
              <View style={styles.usernameAvailabilityRow}>
                <ActivityIndicator
                  size="small"
                  color={COLORS.muted}
                />
                <Text style={styles.usernameAvailabilityChecking}>
                  Checking username...
                </Text>
              </View>
            )}

            {usernameAvailability === "available" && (
              <Text style={styles.usernameAvailabilityAvailable}>
                ✓ {usernameAvailabilityMessage || "Username is available."}
              </Text>
            )}

            {usernameAvailability === "taken" && (
              <Text style={styles.usernameAvailabilityTaken}>
                ✕ {usernameAvailabilityMessage || "Username is already registered."}
              </Text>
            )}

            {usernameAvailability === "error" && (
              <Text style={styles.usernameAvailabilityError}>
                {usernameAvailabilityMessage || "Unable to check username availability."}
              </Text>
            )}

            <Text
              style={[
                styles.label,
                styles.secondLabel,
              ]}
            >
              {affiliation === "student"
                ? "GSFE / TUP Student Email *"
                : "Email Address"}
            </Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.cardinal}
              />

              <TextInput
                value={email}
                onChangeText={handleEmailChange}
                placeholder={
                  affiliation === "student"
                    ? "yourname@gsfe.tupcavite.edu.ph"
                    : "you@example.com"
                }
                placeholderTextColor={COLORS.lightMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                style={styles.inputWithIcon}
              />
            </View>

            <View style={styles.fieldHint}>
              <Ionicons
                name={
                  affiliation === "student"
                    ? "school-outline"
                    : "information-circle-outline"
                }
                size={14}
                color={COLORS.muted}
              />
              <Text style={styles.fieldHintText}>
                {affiliation === "student"
                  ? "Student sellers must use their TUP institutional/GSFE email (@gsfe.tupcavite.edu.ph)."
                  : "Use an active email address for account notifications and verification."}
              </Text>
            </View>

          </View>

            {/* STUDENT ID VERIFICATION */}

            {affiliation ===
              "student" && (
              <View style={styles.card}>
                <SectionHeader
                  icon="card-outline"
                  title="TUPC-ID Verification"
                  description="Provide your TUPC-ID number and a clear photo of the front of your ID."
                />

                <View style={styles.requirementBanner}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={18}
                    color={COLORS.cardinal}
                  />
                  <View style={styles.requirementBannerText}>
                    <Text style={styles.requirementBannerTitle}>Student verification</Text>
                    <Text style={styles.requirementBannerDescription}>
                      Make sure the details on your TUPC-ID are readable and match your personal information.
                    </Text>
                  </View>
                </View>

                <Text style={styles.label}>
                  TUPC-ID Number *
                </Text>

                <View
                  style={styles.inputWrapper}
                >
                  <Ionicons
                    name="school-outline"
                    size={20}
                    color={COLORS.cardinal}
                  />

                  <TextInput
                    value={tupcId}
                    onChangeText={
                      handleTupcIdChange
                    }
                    placeholder="TUPC-YY-NNNN"
                    placeholderTextColor={
                      COLORS.lightMuted
                    }
                    autoCapitalize="characters"
                    autoCorrect={false}
                    editable={!isLoading}
                    maxLength={12}
                    style={styles.inputWithIcon}
                  />
                </View>

                <View
                  style={styles.fieldHint}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={14}
                    color={COLORS.muted}
                  />
                  <Text
                    style={
                      styles.fieldHintText
                    }
                  >
                    Example: TUPC-24-1234
                  </Text>
                </View>

                <IdImageUpload
                  title="TUPC-ID Front"
                  imageUri={tupcIdFront}
                  onPress={() =>
                    pickIdImageFromMenu("tupcFront")
                  }
                />
              </View>
            )}

            {/* GOVERNMENT ID — ONLY FOR OTHERS */}

            {affiliation === "others" && (
              <View style={styles.card}>
                <SectionHeader
                  icon="shield-checkmark-outline"
                  title="Government ID Verification"
                  description="Select a valid government-issued ID and upload a clear photo of the front."
                />

                <View style={styles.requirementBanner}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={COLORS.cardinal}
                  />
                  <View style={styles.requirementBannerText}>
                    <Text style={styles.requirementBannerTitle}>Identity verification</Text>
                    <Text style={styles.requirementBannerDescription}>
                      Use an active government-issued ID. Your ID photo should be clear, complete, and readable.
                    </Text>
                  </View>
                </View>

                <Text style={styles.label}>Government ID Type *</Text>

                <Pressable
                  style={[styles.inputWrapper, styles.dropdownTrigger]}
                  onPress={() =>
                    setGovernmentIdDropdownOpen(
                      !governmentIdDropdownOpen
                    )
                  }
                  disabled={isLoading}
                >
                  <Ionicons
                    name="card-outline"
                    size={20}
                    color={COLORS.cardinal}
                  />

                  <Text
                    style={[
                      styles.inputWithIcon,
                      !governmentIdType &&
                        styles.dropdownPlaceholder,
                    ]}
                  >
                    {governmentIdType || "Select government ID"}
                  </Text>

                  <Ionicons
                    name={
                      governmentIdDropdownOpen
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={18}
                    color={COLORS.muted}
                  />
                </Pressable>

                {governmentIdDropdownOpen && (
                  <View style={styles.governmentDropdown}>
                    {GOVERNMENT_ID_CONFIGS.map((item, index) => (
                      <Pressable
                        key={item.label}
                        style={[
                          styles.governmentDropdownItem,
                          index ===
                            GOVERNMENT_ID_CONFIGS.length - 1 &&
                            styles.governmentDropdownItemLast,
                          governmentIdType === item.label &&
                            styles.governmentDropdownItemSelected,
                        ]}
                        onPress={() =>
                          handleGovernmentIdTypeSelect(item.label)
                        }
                      >
                        <View style={styles.governmentDropdownItemText}>
                          <Text
                            style={[
                              styles.governmentDropdownTitle,
                              governmentIdType === item.label &&
                                styles.governmentDropdownTitleSelected,
                            ]}
                          >
                            {item.label}
                          </Text>

                          <Text style={styles.governmentDropdownHint}>
                            {item.hint}
                          </Text>
                        </View>

                        {governmentIdType === item.label && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={COLORS.cardinal}
                          />
                        )}
                      </Pressable>
                    ))}
                  </View>
                )}

                {selectedGovernmentIdConfig && (
                  <>
                    <Text style={[styles.label, styles.secondLabel]}>
                      Government ID Number *
                    </Text>

                    <View style={styles.inputWrapper}>
                      <Ionicons
                        name="key-outline"
                        size={20}
                        color={COLORS.cardinal}
                      />

                      <TextInput
                        value={governmentIdNumber}
                        onChangeText={
                          handleGovernmentIdNumberChange
                        }
                        placeholder={
                          selectedGovernmentIdConfig.placeholder
                        }
                        placeholderTextColor={COLORS.lightMuted}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        maxLength={
                          selectedGovernmentIdConfig.maxLength
                        }
                        editable={!isLoading}
                        style={styles.inputWithIcon}
                      />
                    </View>

                    <View style={styles.fieldHint}>
                      <Ionicons
                        name="information-circle-outline"
                        size={14}
                        color={COLORS.muted}
                      />

                      <Text style={styles.fieldHintText}>
                        {selectedGovernmentIdConfig.hint}
                      </Text>
                    </View>
                  </>
                )}

                <IdImageUpload
                  title="Government ID Front"
                  imageUri={governmentIdFront}
                  onPress={() =>
                    pickIdImage("governmentFront")
                  }
                />

              </View>
            )}


          {/* STORE */}

          <View style={styles.card}>
            <SectionHeader
              icon="storefront-outline"
              title="Store Information"
              description="Tell customers about your store."
            />

            <Text style={styles.label}>
              Store Name
            </Text>

            <View
              style={styles.inputWrapper}
            >
              <Ionicons
                name="storefront-outline"
                size={20}
                color={COLORS.cardinal}
              />

              <TextInput
                value={storeName}
                onChangeText={setStoreName}
                placeholder="Your store name"
                placeholderTextColor={
                  COLORS.lightMuted
                }
                autoCapitalize="words"
                editable={!isLoading}
                style={styles.inputWithIcon}
              />
            </View>

            <Text
              style={[
                styles.label,
                styles.secondLabel,
              ]}
            >
              Store Description
            </Text>

            <TextInput
              value={storeDescription}
              onChangeText={setStoreDescription}
              placeholder="Describe what your store sells..."
              placeholderTextColor={
                COLORS.lightMuted
              }
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              editable={!isLoading}
              maxLength={500}
              style={styles.textArea}
            />

            <Text style={styles.characterCount}>
              {storeDescription.length}/500
            </Text>
          </View>

          {/* PASSWORD */}

          <View style={styles.card}>
            <SectionHeader
              icon="lock-closed-outline"
              title="Password"
              description="Create a strong password for your seller account."
            />

            <Text style={styles.label}>
              Password
            </Text>

            <View
              style={styles.inputWrapper}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={COLORS.cardinal}
              />

              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                placeholderTextColor={
                  COLORS.lightMuted
                }
                secureTextEntry={
                  !showPassword
                }
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
                importantForAutofill="no"
                editable={!isLoading}
                style={styles.inputWithIcon}
              />

              <Pressable
                onPress={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                hitSlop={10}
                disabled={isLoading}
              >
                <Ionicons
                  name={
                    showPassword
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  size={21}
                  color={COLORS.muted}
                />
              </Pressable>
            </View>

            {password.length > 0 && (
              <View
                style={styles.requirements}
              >
                <PasswordRequirement
                  valid={
                    passwordChecks.length
                  }
                  text="At least 8 characters"
                />
                <PasswordRequirement
                  valid={
                    passwordChecks.uppercase
                  }
                  text="One uppercase letter"
                />
                <PasswordRequirement
                  valid={
                    passwordChecks.lowercase
                  }
                  text="One lowercase letter"
                />
                <PasswordRequirement
                  valid={
                    passwordChecks.number
                  }
                  text="One number"
                />
                <PasswordRequirement
                  valid={
                    passwordChecks.special
                  }
                  text="One special character"
                />
              </View>
            )}

            <Text
              style={[
                styles.label,
                styles.secondLabel,
              ]}
            >
              Confirm Password
            </Text>

            <View
              style={styles.inputWrapper}
            >
              <Ionicons
                name="lock-open-outline"
                size={20}
                color={COLORS.cardinal}
              />

              <TextInput
                value={confirmPassword}
                onChangeText={
                  setConfirmPassword
                }
                placeholder="Re-enter your password"
                placeholderTextColor={
                  COLORS.lightMuted
                }
                secureTextEntry={
                  !showConfirmPassword
                }
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
                importantForAutofill="no"
                editable={!isLoading}
                style={styles.inputWithIcon}
              />

              <Pressable
                onPress={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                hitSlop={10}
                disabled={isLoading}
              >
                <Ionicons
                  name={
                    showConfirmPassword
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  size={21}
                  color={COLORS.muted}
                />
              </Pressable>
            </View>

            {confirmPassword.length >
              0 && (
              <View
                style={styles.matchRow}
              >
                <Ionicons
                  name={
                    password ===
                    confirmPassword
                      ? "checkmark-circle"
                      : "close-circle"
                  }
                  size={16}
                  color={
                    password ===
                    confirmPassword
                      ? COLORS.success
                      : COLORS.danger
                  }
                />

                <Text
                  style={styles.matchText}
                >
                  {password ===
                  confirmPassword
                    ? "Passwords match"
                    : "Passwords do not match"}
                </Text>
              </View>
            )}
          </View>

          {/* CAPTCHA */}

          <View style={styles.card}>
            <SectionHeader
              icon="shield-checkmark-outline"
              title="Security Verification"
              description="Complete the CAPTCHA before submitting your seller registration."
            />

            <View
              style={styles.captchaHeader}
            >
              <View
                style={styles.captchaStatusIcon}
              >
                <Ionicons
                  name={
                    captchaToken
                      ? "checkmark-circle"
                      : "shield-checkmark-outline"
                  }
                  size={22}
                  color={
                    captchaToken
                      ? COLORS.success
                      : COLORS.cardinal
                  }
                />
              </View>

              <View
                style={styles.captchaStatusText}
              >
                <Text
                  style={
                    styles.captchaStatusTitle
                  }
                >
                  {captchaToken
                    ? "CAPTCHA verified"
                    : "CAPTCHA verification required"}
                </Text>

                <Text
                  style={
                    styles.captchaStatusDescription
                  }
                >
                  {captchaToken
                    ? "You can now submit your registration."
                    : "Please complete the challenge below."}
                </Text>
              </View>

              {captchaToken ? (
                <Pressable
                  onPress={refreshCaptcha}
                  disabled={isLoading}
                  style={
                    styles.refreshCaptchaButton
                  }
                >
                  <Ionicons
                    name="refresh-outline"
                    size={18}
                    color={
                      COLORS.cardinal
                    }
                  />
                </Pressable>
              ) : null}
            </View>

            <View
              style={styles.captchaWebViewContainer}
            >
              <WebView
                key={captchaKey}
                source={{
                  uri: API_CAPTCHA_URL,
                  headers: NGROK_HEADERS,
                }}
                onMessage={
                  handleCaptchaMessage
                }
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={["*"]}
                startInLoadingState
                renderLoading={() => (
                  <View
                    style={
                      styles.captchaLoading
                    }
                  >
                    <ActivityIndicator
                      size="small"
                      color={
                        COLORS.cardinal
                      }
                    />
                    <Text
                      style={
                        styles.captchaLoadingText
                      }
                    >
                      Loading CAPTCHA...
                    </Text>
                  </View>
                )}
              />
            </View>

            <View
              style={styles.captchaNote}
            >
              <Ionicons
                name="information-circle-outline"
                size={15}
                color={COLORS.muted}
              />

              <Text
                style={styles.captchaNoteText}
              >
                CAPTCHA verification is checked
                by the server before registration
                is accepted.
              </Text>
            </View>
          </View>

          {/* EMAIL NOTICE */}

          <View style={styles.infoBox}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="mail-unread-outline"
                size={21}
                color={COLORS.cardinal}
              />
            </View>

            <View
              style={styles.infoContent}
            >
              <Text style={styles.infoTitle}>
                Email verification required
              </Text>

              <Text style={styles.infoText}>
                A 6-digit verification code will
                be sent to your email after
                registration. Your seller account
                will remain pending until the
                required verification and approval
                process is completed.
              </Text>
            </View>
          </View>

          {/* SELLER NOTICE */}

          <View
            style={styles.approvalBox}
          >
            <Ionicons
              name="storefront-outline"
              size={21}
              color={COLORS.cardinal}
            />

            <Text
              style={styles.approvalText}
            >
              Seller accounts are subject to
              account and store verification before
              seller features become available.
            </Text>
          </View>

          {/* CREATE */}

          <Animated.View
            style={{
              transform: [{ scale: pressScale }],
            }}
          >
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed &&
                  !isLoading &&
                  styles.pressed,
                isLoading &&
                  styles.buttonDisabled,
              ]}
              onPressIn={animatePressIn}
              onPressOut={animatePressOut}
              onPress={handleRegister}
              disabled={isLoading}
            >
            {isLoading ? (
              <>
                <ActivityIndicator
                  size="small"
                  color={COLORS.white}
                />
                <Text
                  style={styles.buttonText}
                >
                  Creating account...
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="storefront-outline"
                  size={20}
                  color={COLORS.white}
                />
                <Text
                  style={styles.buttonText}
                >
                  Create Seller Account
                </Text>
              </>
            )}
            </Pressable>
          </Animated.View>

          <Text style={styles.footerText}>
            By creating an account, you agree to the Terms and Conditions
            of TUP-OrderUp and confirm that the information you provide
            is accurate and complete.
          </Text>

          <View style={styles.brandFooter}>
            <View style={styles.footerDivider} />
            <Image source={TUPC_LOGO} style={styles.footerLogo} resizeMode="contain" />
            <Text style={styles.footerBrandName}>TUPC-ORDERUP</Text>
                      <Text style={styles.footerCopyright}>
                        © 2026 Technological University of the Philippines
                        {" "}– Cavite Campus
                      </Text>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  keyboard: {
    flex: 1,
  },

  animatedPage: {
    flex: 1,
  },

  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
  },

  // ===================================================
  // BACK + HERO
  // ===================================================

  backButton: {
    position: "absolute",
    top: 16,
    left: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.24)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 10,
  },

  hero: {
    height: 300,
    marginHorizontal: -16,
    marginTop: -12,
    marginBottom: 20,
    position: "relative",
    overflow: "hidden",
    backgroundColor: COLORS.cardinalDeep,
  },

  heroBackgroundImage: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },

  heroOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(87, 11, 23, 0.58)",
  },

  heroContent: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-start",
    paddingHorizontal: 22,
    paddingBottom: 28,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#F4D27A",
    marginBottom: 7,
  },

  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: COLORS.white,
    textAlign: "left",
    letterSpacing: -0.6,
  },

  subtitle: {
    marginTop: 8,
    maxWidth: 355,
    textAlign: "left",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
    letterSpacing: 0.1,
    color: "rgba(255,255,255,0.90)",
  },

  // ===================================================
  // PROGRESS
  // ===================================================

  progressCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 15,
  },

  progressTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  progressLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    color: COLORS.cardinal,
  },

  progressStep: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.muted,
  },

  progressTrack: {
    height: 6,
    borderRadius: 10,
    backgroundColor: COLORS.border,
    overflow: "hidden",
    marginTop: 12,
  },

  progressActive: {
    width: "33.33%",
    height: "100%",
    backgroundColor: COLORS.cardinal,
    borderRadius: 10,
  },

  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  progressCurrent: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.cardinal,
  },

  progressMuted: {
    fontSize: 9,
    color: COLORS.lightMuted,
    fontWeight: "600",
  },

  // ===================================================
  // CARDS
  // ===================================================

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E8E9EC",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.045,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 13,
    backgroundColor: "rgba(166, 25, 46, 0.055)",
    borderWidth: 1,
    borderColor: "rgba(166, 25, 46, 0.10)",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.cardinal,
  },

  sectionIcon: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: "rgba(166, 25, 46, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeaderText: {
    flex: 1,
    marginLeft: 11,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.cardinalDark,
  },

  sectionDescription: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: "#8D5961",
  },

  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(166, 25, 46, 0.16)",
    marginTop: 10,
  },

  // ===================================================
  // INPUTS
  // ===================================================

  nameRow: {
    flexDirection: "row",
    gap: 11,
  },

  halfInput: {
    flex: 1,
  },

  inputGroup: {
    marginTop: 17,
  },

  label: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
  },

  secondLabel: {
    marginTop: 17,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#E1E3E7",
    borderRadius: 14,
    backgroundColor: "#FBFBFC",
    paddingHorizontal: 13,
    fontSize: 14,
    color: COLORS.text,
  },

  inputWrapper: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#E1E3E7",
    borderRadius: 14,
    backgroundColor: "#FBFBFC",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
  },

  inputWithIcon: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 13,
  },

  // ===================================================
  // USERNAME AVAILABILITY
  // ===================================================

  usernameInputAvailable: {
    borderColor: COLORS.success,
    backgroundColor: "#EEF8F0",
  },

  usernameInputTaken: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.softRed,
  },

  usernameInputError: {
    borderColor: COLORS.danger,
  },

  usernameAvailabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    gap: 7,
  },

  usernameAvailabilityChecking: {
    fontSize: 11,
    color: COLORS.muted,
  },

  usernameAvailabilityAvailable: {
    marginTop: 7,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.success,
  },

  usernameAvailabilityTaken: {
    marginTop: 7,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.danger,
  },

  usernameAvailabilityError: {
    marginTop: 7,
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.danger,
  },

  dropdownTrigger: {
    minHeight: 52,
  },

  dropdownPlaceholder: {
    color: COLORS.lightMuted,
  },

  governmentDropdown: {
    marginTop: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    overflow: "hidden",
  },

  governmentDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  governmentDropdownItemLast: {
    borderBottomWidth: 0,
  },

  governmentDropdownItemSelected: {
    backgroundColor: COLORS.softRed,
  },

  governmentDropdownItemText: {
    flex: 1,
    paddingRight: 8,
  },

  governmentDropdownTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.text,
  },

  governmentDropdownTitleSelected: {
    color: COLORS.cardinal,
  },

  governmentDropdownHint: {
    marginTop: 2,
    fontSize: 9,
    lineHeight: 13,
    color: COLORS.muted,
  },

  textArea: {
    minHeight: 115,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    backgroundColor: COLORS.input,
    paddingHorizontal: 13,
    paddingTop: 13,
    fontSize: 14,
    color: COLORS.text,
  },

  characterCount: {
    textAlign: "right",
    fontSize: 10,
    color: COLORS.lightMuted,
    marginTop: 5,
  },

  // ===================================================
  // PHONE
  // ===================================================

  countryCode: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 9,
    gap: 5,
  },

  countryFlag: {
    fontSize: 16,
  },

  countryCodeText: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.text,
  },

  phoneDivider: {
    width: 1,
    height: 23,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },

  phoneInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 13,
  },

  fieldHint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 5,
  },

  fieldHintText: {
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.muted,
  },

  // ===================================================
  // AFFILIATION
  // ===================================================

  affiliationRow: {
    flexDirection: "row",
    gap: 11,
  },

  affiliationCard: {
    flex: 1,
    minHeight: 140,
    borderWidth: 1.2,
    borderColor: "#E2E4E8",
    borderRadius: 17,
    backgroundColor: "#FCFCFD",
    padding: 14,
    position: "relative",
  },

  affiliationCardActive: {
    borderColor: COLORS.cardinal,
    backgroundColor: "#FFF7F8",
    borderWidth: 1.5,
  },

  affiliationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.softRed,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },

  affiliationIconActive: {
    backgroundColor: COLORS.cardinal,
  },

  affiliationTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.text,
  },

  affiliationTitleActive: {
    color: COLORS.cardinal,
  },

  affiliationDescription: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 3,
  },

  affiliationDescriptionActive: {
    color: COLORS.cardinalDark,
  },

  selectedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  dynamicSection: {
    marginTop: 0,
  },

  requirementBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.softRed,
    borderRadius: 14,
    padding: 12,
    marginBottom: 17,
    gap: 9,
    borderWidth: 1,
    borderColor: "#F5D6DC",
  },

  requirementBannerText: {
    flex: 1,
  },

  requirementBannerTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.text,
  },

  requirementBannerDescription: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.muted,
  },

  // ===================================================
  // ID UPLOAD
  // ===================================================

  // ===================================================
  // ID PHOTO UPLOAD / PICKER
  // ===================================================

  idUpload: {
    marginTop: 18,
    padding: 13,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#ECECEF",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  idUploadTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },

  idUploadTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  idUploadTitleIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.softRed,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  idUploadTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.text,
  },

  idUploadHint: {
    marginTop: 2,
    fontSize: 9,
    color: COLORS.lightMuted,
  },

  uploadedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF3",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  uploadedBadgeText: {
    fontSize: 9,
    color: COLORS.success,
    fontWeight: "900",
  },

  requiredBadge: {
    backgroundColor: COLORS.softGold,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  requiredBadgeText: {
    fontSize: 9,
    color: COLORS.cardinalDark,
    fontWeight: "900",
  },

  uploadBox: {
    minHeight: 165,
    borderWidth: 1.3,
    borderStyle: "dashed",
    borderColor: "#D7D9DE",
    borderRadius: 15,
    backgroundColor: "#FBFBFC",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  uploadBoxSelected: {
    borderStyle: "solid",
    borderColor: COLORS.success,
    backgroundColor: "#F8FFFB",
  },

  emptyUploadContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
  },

  uploadIcon: {
    width: 51,
    height: 51,
    borderRadius: 16,
    backgroundColor: COLORS.softRed,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },

  uploadMainText: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.text,
  },

  uploadSubText: {
    marginTop: 4,
    fontSize: 9.5,
    color: COLORS.muted,
    textAlign: "center",
  },

  uploadActionHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#EEE1E5",
  },

  uploadActionHintText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: COLORS.cardinal,
  },

  previewWrap: {
    width: "100%",
    height: 190,
    position: "relative",
  },

  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  previewOverlay: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    alignItems: "flex-start",
  },

  previewOverlayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(22, 131, 74, 0.92)",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  previewOverlayText: {
    fontSize: 9,
    fontWeight: "900",
    color: COLORS.white,
  },

  uploadBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 9,
    minHeight: 20,
  },

  uploadFormatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  uploadFormatText: {
    fontSize: 8.5,
    color: COLORS.muted,
    fontWeight: "600",
  },

  changeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: COLORS.softRed,
  },

  changeImageText: {
    fontSize: 9,
    fontWeight: "900",
    color: COLORS.cardinal,
  },

  idPickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.58)",
    justifyContent: "flex-end",
  },

  idPickerModal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 9,
    paddingBottom: Platform.OS === "ios" ? 28 : 20,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -8 },
    elevation: 18,
  },

  idPickerHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#D6D8DD",
    marginBottom: 18,
  },

  idPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  idPickerHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.softRed,
    alignItems: "center",
    justifyContent: "center",
  },

  idPickerHeaderText: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 8,
  },

  idPickerTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.text,
  },

  idPickerDescription: {
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.muted,
    marginTop: 3,
  },

  idPickerClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F5F5F6",
    alignItems: "center",
    justifyContent: "center",
  },

  idPickerDivider: {
    height: 1,
    backgroundColor: "#EEEEF0",
    marginVertical: 17,
  },

  idPickerOption: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 76,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 17,
    backgroundColor: "#FAFAFB",
    borderWidth: 1,
    borderColor: "#EEEEF0",
    marginBottom: 10,
  },

  idPickerOptionPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },

  idPickerOptionIconGallery: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.softRed,
    alignItems: "center",
    justifyContent: "center",
  },

  idPickerOptionIconCamera: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.cardinal,
    alignItems: "center",
    justifyContent: "center",
  },

  idPickerOptionContent: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 8,
  },

  idPickerOptionTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.text,
  },

  idPickerOptionDescription: {
    fontSize: 9.5,
    lineHeight: 14,
    color: COLORS.muted,
    marginTop: 3,
  },

  idPickerCancelButton: {
    minHeight: 47,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  idPickerCancelText: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.text,
  },

  idPickerSecurityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 5,
    marginTop: 11,
    paddingHorizontal: 10,
  },

  idPickerSecurityText: {
    flex: 1,
    fontSize: 8.5,
    lineHeight: 13,
    color: COLORS.muted,
    textAlign: "center",
  },

  idSpacer: {
    height: 3,
  },

  // ===================================================
  // PASSWORD
  // ===================================================

  requirements: {
    marginTop: 12,
    gap: 7,
  },

  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  requirementText: {
    fontSize: 11,
    color: COLORS.muted,
  },

  requirementTextValid: {
    color: COLORS.success,
    fontWeight: "700",
  },

  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },

  matchText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.muted,
  },

  // ===================================================
  // CAPTCHA
  // ===================================================

  captchaHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  captchaStatusIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.softRed,
    alignItems: "center",
    justifyContent: "center",
  },

  captchaStatusText: {
    flex: 1,
    marginLeft: 10,
  },

  captchaStatusTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.text,
  },

  captchaStatusDescription: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 2,
  },

  refreshCaptchaButton: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: COLORS.softRed,
    alignItems: "center",
    justifyContent: "center",
  },

  captchaWebViewContainer: {
    height: 190,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },

  captchaLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.white,
  },

  captchaLoadingText: {
    fontSize: 10,
    color: COLORS.muted,
  },

  captchaNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 9,
  },

  captchaNoteText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 14,
    color: COLORS.muted,
  },

  // ===================================================
  // INFO
  // ===================================================

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.softRed,
    borderRadius: 17,
    padding: 14,
    marginBottom: 13,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  infoContent: {
    flex: 1,
    marginLeft: 10,
  },

  infoTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.text,
  },

  infoText: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.muted,
  },

  approvalBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.softGold,
    borderRadius: 15,
    padding: 13,
    marginBottom: 13,
    gap: 8,
  },

  approvalText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.muted,
  },

    footerCopyright: {
    color: COLORS.textMuted,
    fontSize: 10.5,
    textAlign: "center",
    lineHeight: 15,
  },

  // ===================================================
  // BUTTON
  // ===================================================

  button: {
    minHeight: 55,
    borderRadius: 15,
    backgroundColor: COLORS.cardinal,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 18,
    marginTop: 2,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  buttonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
  },

  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },

  footerText: {
    textAlign: "center",
    fontSize: 9,
    lineHeight: 14,
    color: COLORS.lightMuted,
    marginTop: 13,
    paddingHorizontal: 15,
  },

  brandFooter: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
    paddingBottom: 2,
  },

  footerDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(166, 25, 46, 0.12)",
    marginBottom: 18,
  },

  footerLogo: {
    width: 150,
    height: 50,
    opacity: 0.20,
    marginBottom: 4,
  },

  footerBrandName: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.8,
    color: COLORS.cardinalDark,
  },

  footerBrandSub: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.4,
    color: COLORS.lightMuted,
    textAlign: "center",
  },

  bottomSpace: {
    height: 20,
  },
});
