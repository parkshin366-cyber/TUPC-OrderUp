import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as LocalAuthentication from "expo-local-authentication";
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

const COLORS = {
  cardinal: "#A6192E",
  cardinalDark: "#7D1021",
  cardinalDeep: "#570B17",
  gold: "#D8B56A",

  background: "#F7F7F8",
  white: "#FFFFFF",

  text: "#171717",
  muted: "#737373",
  lightMuted: "#A3A3A3",

  border: "#E5E5E5",
  input: "#FAFAFA",

  success: "#218739",
  warning: "#B7791F",
  danger: "#C53030",

  softRed: "#FCEDEF",
  softRedBorder: "#EBC1C8",
  softGold: "#FBF7ED",
  softGreen: "#EEF8F0",
};

// Local TUPC branding assets. Place these at <project-root>/assets/.
const TUPC_LOGO = require("../../../assets/LOGO.png");
const TUPC_BG = require("../../../assets/BG.jpg");

type Affiliation = "student" | "others";

/**
 * FINGERPRINT ONLY
 *
 * Face ID / facial recognition is intentionally NOT supported
 * in this registration screen.
 */
type BiometricType = "fingerprint" | "none";

type IdImageType =
  | "tupcFront"
  | "tupcBack"
  | "governmentFront"
  | "governmentBack";


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

const formatPrclId = (value: string) => digitsOnly(value).slice(0, 7);

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

export default function ClientRegisterScreen() {
  // =====================================================
  // PERSONAL INFORMATION
  // =====================================================

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // =====================================================
  // ACCOUNT INFORMATION
  // =====================================================

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [usernameSuggestionDismissed, setUsernameSuggestionDismissed] = useState(false);

  const [usernameAvailability, setUsernameAvailability] = useState<
    "idle" | "checking" | "available" | "taken" | "error"
  >("idle");

  const [usernameAvailabilityMessage, setUsernameAvailabilityMessage] =
    useState("");

  const usernameCheckRequestId = useRef(0);

  // =====================================================
  // USERNAME AVAILABILITY
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

    // The registration form requires at least 4 characters, so wait
    // until the username is long enough before calling the API.
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
        const result = await checkUsernameAvailability(
          cleanUsername
        );

        // Ignore an older request if the user has already typed
        // another username while the request was in progress.
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
  // CONTACT
  // =====================================================

  const [contact, setContact] = useState("");

  // =====================================================
  // TUP AFFILIATION
  // =====================================================

  const [affiliation, setAffiliation] =
    useState<Affiliation>("student");

  // =====================================================
  // IDENTITY
  // =====================================================

  const [tupcId, setTupcId] = useState("");

  const [tupcIdFront, setTupcIdFront] =
    useState<string | null>(null);

  const [tupcIdBack, setTupcIdBack] =
    useState<string | null>(null);

  const [governmentIdType, setGovernmentIdType] =
    useState("");

  // Government ID dropdown state
  const [governmentIdDropdownOpen, setGovernmentIdDropdownOpen] =
    useState(false);

  const [governmentIdNumber, setGovernmentIdNumber] =
    useState("");

  const [governmentIdFront, setGovernmentIdFront] =
    useState<string | null>(null);

  const [governmentIdBack, setGovernmentIdBack] =
    useState<string | null>(null);

  // =====================================================
  // PASSWORD
  // =====================================================

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  // =====================================================
  // SECURITY
  // =====================================================

  const [biometricType, setBiometricType] =
    useState<BiometricType>("none");

  const [biometricAvailable, setBiometricAvailable] =
    useState(false);

  const [biometricLabel, setBiometricLabel] =
    useState("Fingerprint");

  const [enableBiometric, setEnableBiometric] =
    useState(false);

  // Fingerprint registration state. The app never stores the raw
  // fingerprint; Expo LocalAuthentication verifies it through the
  // device's secure biometric system.
  const [biometricEnrolledForAccount, setBiometricEnrolledForAccount] =
    useState(false);

  const [isRegisteringFingerprint, setIsRegisteringFingerprint] =
    useState(false);

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] =
    useState(false);

  // =====================================================
  // UI
  // =====================================================

  const [isLoading, setIsLoading] = useState(false);
  const [idImageMenuType, setIdImageMenuType] = useState<IdImageType | null>(null);

  // =====================================================
  // PREMIUM UI ANIMATIONS
  // =====================================================

  const pageOpacity = useRef(new Animated.Value(0)).current;
  const pageTranslateY = useRef(new Animated.Value(18)).current;
  const logoScale = useRef(new Animated.Value(0.86)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  const animatePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.985,
      useNativeDriver: true,
      speed: 24,
      bounciness: 4,
    }).start();
  };

  const animatePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

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
      Animated.sequence([
        Animated.delay(80),
        Animated.parallel([
          Animated.spring(logoScale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 14,
            bounciness: 7,
          }),
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.timing(progressWidth, {
        toValue: 1,
        duration: 700,
        delay: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [logoOpacity, logoScale, pageOpacity, pageTranslateY, progressWidth]);

  // =====================================================
  // CLOUDFLARE TURNSTILE CAPTCHA
  // =====================================================

  const [captchaToken, setCaptchaToken] = useState<string | null>(
    null
  );

  const CAPTCHA_URL =
    "http://192.168.18.24:5001/captcha";

  const handleCaptchaMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (
        (data.type === "captcha-success" ||
          data.type === "CAPTCHA_SUCCESS") &&
        typeof data.token === "string" &&
        data.token.trim()
      ) {
        setCaptchaToken(data.token.trim());
        return;
      }

      if (
        data.type === "captcha-expired" ||
        data.type === "CAPTCHA_EXPIRED"
      ) {
        setCaptchaToken(null);
        return;
      }

      if (
        data.type === "captcha-error" ||
        data.type === "CAPTCHA_ERROR"
      ) {
        setCaptchaToken(null);
      }
    } catch (error) {
      console.error("CAPTCHA MESSAGE ERROR:", error);
    }
  };

  // =====================================================
  // CHECK FINGERPRINT AVAILABILITY
  // =====================================================

  useEffect(() => {
    checkFingerprintAvailability();
  }, []);

  const checkFingerprintAvailability = async () => {
    try {
      const hasHardware =
        await LocalAuthentication.hasHardwareAsync();

      const isEnrolled =
        await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setBiometricAvailable(false);
        setBiometricType("none");
        setBiometricLabel("Fingerprint");
        setEnableBiometric(false);
        return;
      }

      const types =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      const hasFingerprint = types.includes(
        LocalAuthentication.AuthenticationType.FINGERPRINT
      );

      /**
       * IMPORTANT:
       * We intentionally ignore FACIAL_RECOGNITION.
       *
       * Even if the phone supports Face ID / Face Unlock,
       * this screen will only enable Fingerprint.
       */
      if (hasFingerprint) {
        setBiometricType("fingerprint");
        setBiometricLabel("Fingerprint");
        setBiometricAvailable(true);
        setEnableBiometric(false);
        setBiometricEnrolledForAccount(false);
        return;
      }

      setBiometricAvailable(false);
      setBiometricType("none");
      setBiometricLabel("Fingerprint");
      setEnableBiometric(false);
    } catch (error) {
      console.error(
        "Fingerprint detection error:",
        error
      );

      setBiometricAvailable(false);
      setBiometricType("none");
      setBiometricLabel("Fingerprint");
      setEnableBiometric(false);
    }
  };

  // =====================================================
  // FINGERPRINT REGISTRATION
  // =====================================================

  const registerFingerprint = async () => {
    if (isLoading || isRegisteringFingerprint) return;

    if (!biometricAvailable || biometricType !== "fingerprint") {
      Alert.alert(
        "Fingerprint Unavailable",
        "Fingerprint authentication is not available on this device. Please enroll a fingerprint in your device security settings first."
      );
      return;
    }

    try {
      setIsRegisteringFingerprint(true);

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Register fingerprint for TUPC-OrderUp",
        cancelLabel: "Not now",
        disableDeviceFallback: true,
      });

      if (result.success) {
        setBiometricEnrolledForAccount(true);
        setEnableBiometric(true);

        Alert.alert(
          "Fingerprint Registered",
          "Your device fingerprint has been verified and will be enabled for TUPC-OrderUp sign-in after your account is created."
        );
      } else {
        setBiometricEnrolledForAccount(false);
        setEnableBiometric(false);
      }
    } catch (error) {
      console.error("FINGERPRINT REGISTRATION ERROR:", error);
      setBiometricEnrolledForAccount(false);
      setEnableBiometric(false);

      Alert.alert(
        "Fingerprint Registration Failed",
        "We could not verify your fingerprint. Please try again or use your 6-digit PIN instead."
      );
    } finally {
      setIsRegisteringFingerprint(false);
    }
  };

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
  // USERNAME SUGGESTIONS
  // =====================================================

  const usernameSuggestions = useMemo(() => {
    const first = firstName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const last = lastName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    if (!first && !last) {
      return [];
    }

    const suggestions: string[] = [];

    if (first && last) {
      suggestions.push(`${first}.${last}`);
      suggestions.push(`${first}${last}`);
      suggestions.push(`${first}_${last}`);
      suggestions.push(`${first}.${last}26`);
    }

    if (first) {
      suggestions.push(`${first}01`);
      suggestions.push(`${first}26`);
    }

    if (last) {
      suggestions.push(`${last}01`);
    }

    return [...new Set(suggestions)]
      .filter((item) => item.length >= 4)
      .slice(0, 4);
  }, [firstName, lastName]);

  useEffect(() => {
    setUsernameSuggestionDismissed(false);
  }, [firstName, lastName]);

  const handleAffiliationChange = (nextAffiliation: Affiliation) => {
    setAffiliation(nextAffiliation);
    setGovernmentIdDropdownOpen(false);

    if (nextAffiliation === "student") {
      setGovernmentIdType("");
      setGovernmentIdNumber("");
      setGovernmentIdFront(null);
      setGovernmentIdBack(null);
    } else {
      setTupcId("");
      setTupcIdFront(null);
      setTupcIdBack(null);
    }
  };

  // =====================================================
  // PHONE NUMBER
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
  // TUPC-ID
  //
  // MANUAL ENTRY ONLY
  //
  // NO AUTO TUPC- PREFIX
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
    const config = GOVERNMENT_ID_CONFIGS.find(
      (item) => item.label === type
    );

    setGovernmentIdType(type);
    setGovernmentIdNumber("");
    setGovernmentIdDropdownOpen(false);

    if (!config) return;
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
  // PIN
  // =====================================================

  const handlePinChange = (value: string) => {
    setPin(
      value.replace(/\D/g, "").slice(0, 6)
    );
  };

  const handleConfirmPinChange = (
    value: string
  ) => {
    setConfirmPin(
      value.replace(/\D/g, "").slice(0, 6)
    );
  };

  // =====================================================
  // EMAIL
  // =====================================================

  const isValidEmail = (value: string) => {
    if (affiliation === "student") {
      return /^[^\s@]+@gsfe\.tupcavite\.edu\.ph$/i.test(value);
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  // =====================================================
  // SELECT USERNAME
  // =====================================================

  const selectUsername = (value: string) => {
    setUsername(
      value
        .toLowerCase()
        .replace(/[^a-z0-9._]/g, "")
    );
    setUsernameSuggestionDismissed(true);
  };

  // =====================================================
  // ID CAMERA
  // =====================================================
  //
  // TUPC-ID:
  //   Portrait camera orientation
  //
  // Government ID:
  //   Portrait phone/camera orientation
  //   Landscape ID capture frame (16:10 crop)
  //
  // The device stays portrait while the camera is open.
  // =====================================================

  const pickIdImage = async (type: IdImageType) => {
    let orientationLocked = false;

    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Camera Permission Required",
          "Please allow camera access so you can take a clear photo of your ID."
        );
        return;
      }

      const isTupcId =
        type === "tupcFront" ||
        type === "tupcBack";

      /*
       * IMPORTANT:
       * Keep the PHONE / CAMERA UI in PORTRAIT for BOTH ID types.
       *
       * For Government ID, we still use a LANDSCAPE capture frame
       * (16:10) through ImagePicker's editing/crop step.
       *
       * Do NOT lock the device to LANDSCAPE here. Doing that makes
       * the whole phone rotate when the Government ID button is tapped.
       */
      const targetOrientation =
        ScreenOrientation.OrientationLock.PORTRAIT_UP;

      const targetAspect: [number, number] = isTupcId
        ? [3, 4]
        : [16, 10];

      // Keep the camera screen/device physically in portrait.
      await ScreenOrientation.lockAsync(targetOrientation);
      orientationLocked = true;

      const result =
        await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: targetAspect,
          quality: 0.9,
          cameraType:
            ImagePicker.CameraType.back,
        });

      if (
        result.canceled ||
        !result.assets?.length
      ) {
        return;
      }

      const imageUri = result.assets[0].uri;

      switch (type) {
        case "tupcFront":
          setTupcIdFront(imageUri);
          break;

        case "tupcBack":
          setTupcIdBack(imageUri);
          break;

        case "governmentFront":
          setGovernmentIdFront(imageUri);
          break;

        case "governmentBack":
          setGovernmentIdBack(imageUri);
          break;
      }
    } catch (error) {
      console.error(
        "ID CAMERA ERROR:",
        error
      );

      Alert.alert(
        "Camera Failed",
        "Unable to open the camera or capture the ID image. Please try again."
      );
    } finally {
      // Always return the registration screen to normal
      // device orientation after the camera closes.
      if (orientationLocked) {
        try {
          await ScreenOrientation.unlockAsync();
        } catch (orientationError) {
          console.error(
            "SCREEN ORIENTATION RESTORE ERROR:",
            orientationError
          );
        }
      }
    }
  };


  // =====================================================
  // ID IMAGE SOURCE MENU
  // =====================================================
  //
  // TUPC-ID Front / Back:
  //   Tap the upload box first.
  //   User chooses:
  //     1. Take Photo
  //     2. Choose from Gallery
  //     3. Cancel
  //
  // The camera permission is requested ONLY when
  // "Take Photo" is selected.
  // The gallery is opened ONLY when
  // "Choose from Gallery" is selected.
  // =====================================================

// =====================================================
// ID IMAGE SOURCE MENU
// =====================================================
// TUPC-ID Front / Back:
// 1. Choose from Gallery
// 2. Take Photo
// 3. Cancel
// =====================================================

const pickIdImageFromMenu = (type: IdImageType) => {
  if (isLoading) return;
  setIdImageMenuType(type);
};

const closeIdImageMenu = () => setIdImageMenuType(null);

const handleIdImageMenuAction = async (action: "gallery" | "camera") => {
  const type = idImageMenuType;
  if (!type) return;
  setIdImageMenuType(null);

  if (action === "camera") {
    await pickIdImage(type);
    return;
  }

  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Gallery Permission Required", "Please allow photo library access so you can choose an existing ID photo.");
      return;
    }
    const isTupcId = type === "tupcFront" || type === "tupcBack";
    const targetAspect: [number, number] = isTupcId ? [3, 4] : [16, 10];
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: targetAspect,
      quality: 0.9,
      selectionLimit: 1,
    });
    if (result.canceled || !result.assets?.length) return;
    const imageUri = result.assets[0].uri;
    switch (type) {
      case "tupcFront": setTupcIdFront(imageUri); break;
      case "tupcBack": setTupcIdBack(imageUri); break;
      case "governmentFront": setGovernmentIdFront(imageUri); break;
      case "governmentBack": setGovernmentIdBack(imageUri); break;
    }
  } catch (error) {
    console.error("ID GALLERY ERROR:", error);
    Alert.alert("Gallery Failed", "Unable to open the gallery or select the ID image. Please try again.");
  }
};

  // =====================================================
  // REGISTER
  // =====================================================

  const handleRegister = async () => {
    const cleanFirstName =
      firstName.trim();

    const cleanLastName =
      lastName.trim();

    const cleanUsername =
      username.trim().toLowerCase();

    const cleanEmail =
      email.trim().toLowerCase();

    const cleanContact =
      contact.trim();

    const cleanTupcId =
      tupcId.trim().toUpperCase();

    const cleanGovernmentIdType =
      governmentIdType.trim();

    const cleanGovernmentIdNumber =
      governmentIdNumber.trim();

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

    if (
      !/^[a-z0-9._]+$/.test(
        cleanUsername
      )
    ) {
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
        "Please wait for the username availability check to finish before creating your account."
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
        affiliation === "student"
          ? "Students must use their TUP Cavite GSFE email ending in @gsfe.tupcavite.edu.ph."
          : "Please enter a valid email address."
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
      // TUPC-ID
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

      // TUPC FRONT
      if (!tupcIdFront) {
        Alert.alert(
          "TUPC-ID Front Required",
          "Please upload the front photo of your TUPC-ID."
        );
        return;
      }

      // TUPC BACK
      if (!tupcIdBack) {
        Alert.alert(
          "TUPC-ID Back Required",
          "Please upload the back photo of your TUPC-ID."
        );
        return;
      }
    }

    if (affiliation === "others") {
      // GOVERNMENT ID TYPE
      if (!cleanGovernmentIdType) {
        Alert.alert(
          "Government ID Required",
          "Please enter your Government ID type."
        );
        return;
      }

      // GOVERNMENT ID NUMBER
      if (!cleanGovernmentIdNumber) {
        Alert.alert(
          "Government ID Number Required",
          "Please enter your Government ID number."
        );
        return;
      }

      const selectedConfig = GOVERNMENT_ID_CONFIGS.find(
        (item) => item.label === cleanGovernmentIdType
      );

      if (!selectedConfig || !selectedConfig.validate(cleanGovernmentIdNumber)) {
        Alert.alert(
          "Invalid Government ID Number",
          selectedConfig
            ? `Please enter a valid ${selectedConfig.label} number using the required format.`
            : "Please select a valid government ID type."
        );
        return;
      }

      // GOVERNMENT FRONT
      if (!governmentIdFront) {
        Alert.alert(
          "Government ID Front Required",
          "Please upload the front photo of your Government ID."
        );
        return;
      }

      // GOVERNMENT BACK
      if (!governmentIdBack) {
        Alert.alert(
          "Government ID Back Required",
          "Please upload the back photo of your Government ID."
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

    if (
      password !== confirmPassword
    ) {
      Alert.alert(
        "Passwords Do Not Match",
        "Please make sure both passwords are the same."
      );
      return;
    }

    // =================================================
    // FINGERPRINT
    // =================================================

    if (enableBiometric && !biometricEnrolledForAccount) {
      Alert.alert(
        "Fingerprint Setup Required",
        "Please tap Register Fingerprint and complete the fingerprint verification before creating your account."
      );
      return;
    }

    // =================================================
    // PIN
    // =================================================

    if (pin.length !== 6) {
      Alert.alert(
        "PIN Required",
        "Please create a 6-digit PIN. It will be used as your backup authentication method."
      );
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert(
        "PINs Do Not Match",
        "Please make sure both PINs are the same."
      );
      return;
    }

    // =================================================
    // CAPTCHA
    // =================================================

    if (!captchaToken) {
      Alert.alert(
        "CAPTCHA Required",
        "Please complete the Cloudflare CAPTCHA before creating your account."
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
        "TUPC-ORDERUP CLIENT REGISTRATION"
      );

      console.log(
        "========================================"
      );

      console.log(
        "Username:",
        cleanUsername
      );

      console.log(
        "Email:",
        cleanEmail
      );

      console.log(
        "Affiliation:",
        affiliation
      );

      console.log(
        "Biometric Enabled:",
        enableBiometric
      );

      console.log(
        "Biometric Type:",
        biometricType
      );

      console.log(
        "TUPC ID Front:",
        !!tupcIdFront
      );

      console.log(
        "TUPC ID Back:",
        !!tupcIdBack
      );

      console.log(
        "Government ID Front:",
        !!governmentIdFront
      );

      console.log(
        "Government ID Back:",
        !!governmentIdBack
      );

      // IMPORTANT:
      // Do NOT console.log password or PIN.

      const data = await registerUser({
        firstName: cleanFirstName,
        lastName: cleanLastName,

        username: cleanUsername,
        email: cleanEmail,

        contact: `0${cleanContact}`,

        password,
        confirmPassword,

        role: "client",

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

        tupcIdBack:
          affiliation === "student" && tupcIdBack
            ? {
                uri: tupcIdBack,
                name: "tupc-id-back.jpg",
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

        governmentIdBack:
          affiliation === "others" && governmentIdBack
            ? {
                uri: governmentIdBack,
                name: "government-id-back.jpg",
                type: "image/jpeg",
              }
            : undefined,

        biometricEnabled:
          enableBiometric,

        pin,
        confirmPin,

        captchaToken,
      });

      console.log(
        "REGISTER RESPONSE:",
        data
      );

      if (!data.success) {
        throw new Error(
          data.message ||
            "Unable to create your account."
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
          role: data.role,
          otpPurpose: "register",
        },
      });
    } catch (error) {
      console.error(
        "CLIENT REGISTER ERROR:",
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
      <View
        style={styles.requirementRow}
      >
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
  // SECURITY ICON
  // =====================================================

  const securityIcon =
    biometricType === "fingerprint"
      ? "finger-print-outline"
      : "shield-outline";

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
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
          {/* =================================================
              HEADER / HERO
          ================================================= */}

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
              <Text style={styles.title}>Create your account</Text>
              <Text style={styles.subtitle}>A simple, secure campus ordering experience designed for the TUP Cavite community.</Text>
            </View>
          </View>

          {/* =================================================
              PROGRESS
          ================================================= */}

          <View
            style={styles.progressCard}
          >
            <View
              style={styles.progressTop}
            >
              <Text
                style={
                  styles.progressLabel
                }
              >
                ACCOUNT SETUP
              </Text>

              <Text
                style={
                  styles.progressStep
                }
              >
                STEP 1 OF 3
              </Text>
            </View>

            <View
              style={
                styles.progressTrack
              }
            >
              <Animated.View
                style={[
                  styles.progressActive,
                  {
                    width: progressWidth.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "33.333%"],
                    }),
                  },
                ]}
              />
            </View>

            <View
              style={
                styles.progressLabels
              }
            >
              <Text
                style={
                  styles.progressCurrent
                }
              >
                Details
              </Text>

              <Text
                style={
                  styles.progressMuted
                }
              >
                Verification
              </Text>

              <Text
                style={
                  styles.progressMuted
                }
              >
                Approval
              </Text>
            </View>
          </View>

          {/* =================================================
              TUP AFFILIATION
          ================================================= */}

          <View style={styles.card}>
            <SectionHeader
              icon="school-outline"
              title="TUP Affiliation"
              description={
                affiliation === "student"
                  ? "Student selected: TUPC-ID and TUP Cavite GSFE email are required."
                  : "Others selected: Government ID and regular email are required."
              }
            />

            <View
              style={
                styles.affiliationRow
              }
            >
              {/* STUDENT */}

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
                    size={23}
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
                    style={
                      styles.selectedBadge
                    }
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

              {/* OTHERS */}

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
                    size={23}
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
                    style={
                      styles.selectedBadge
                    }
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


          {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

          <View style={styles.card}>
            <SectionHeader
              icon="person-outline"
              title="Personal & Account Information"
              description="Enter your personal details and the account information you will use to sign in."
            />

            <View style={styles.nameRow}>
              <View
                style={styles.halfInput}
              >
                <Text
                  style={styles.label}
                >
                  First Name
                </Text>

                <TextInput
                  value={firstName}
                  onChangeText={
                    setFirstName
                  }
                  placeholder="First name"
                  placeholderTextColor={
                    COLORS.lightMuted
                  }
                  autoCapitalize="words"
                  editable={!isLoading}
                  style={styles.input}
                />
              </View>

              <View
                style={styles.halfInput}
              >
                <Text
                  style={styles.label}
                >
                  Last Name
                </Text>

                <TextInput
                  value={lastName}
                  onChangeText={
                    setLastName
                  }
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




            {/* MOBILE */}

            <View
              style={
                styles.inputGroup
              }
            >
              <Text
                style={styles.label}
              >
                Mobile Number
              </Text>

              <View
                style={
                  styles.inputWrapper
                }
              >
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={COLORS.cardinal}
                />

                <View
                  style={
                    styles.countryCode
                  }
                >
                  <Text
                    style={
                      styles.countryFlag
                    }
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
                  style={
                    styles.phoneDivider
                  }
                />

                <TextInput
                  value={contact}
                  onChangeText={
                    handleContactChange
                  }
                  placeholder="917 123 4567"
                  placeholderTextColor={
                    COLORS.lightMuted
                  }
                  keyboardType="phone-pad"
                  editable={!isLoading}
                  maxLength={10}
                  style={
                    styles.phoneInput
                  }
                />
              </View>
            </View>



            {/* USERNAME */}

            <Text
              style={styles.label}
            >
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
                  setUsername(
                    value
                      .toLowerCase()
                      .replace(
                        /[^a-z0-9._]/g,
                        ""
                      )
                  );
                  setUsernameSuggestionDismissed(false);
                }}
                placeholder="Choose a username"
                placeholderTextColor={
                  COLORS.lightMuted
                }
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                style={
                  styles.inputWithIcon
                }
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

            {usernameSuggestions.length >
              0 &&
              !username &&
              !usernameSuggestionDismissed && (
                <View
                  style={
                    styles.suggestionsBox
                  }
                >
                  <View
                    style={
                      styles.suggestionHeader
                    }
                  >
                    <Ionicons
                      name="sparkles-outline"
                      size={15}
                      color={COLORS.gold}
                    />

                    <Text
                      style={
                        styles.suggestionTitle
                      }
                    >
                      Username suggestions
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.suggestionSubtitle
                    }
                  >
                    Based on your name
                  </Text>

                  <View
                    style={
                      styles.suggestionRow
                    }
                  >
                    {usernameSuggestions.map(
                      (suggestion) => (
                        <Pressable
                          key={
                            suggestion
                          }
                          style={
                            styles.suggestionChip
                          }
                          onPress={() =>
                            selectUsername(
                              suggestion
                            )
                          }
                        >
                          <Text
                            style={
                              styles.suggestionText
                            }
                          >
                            {suggestion}
                          </Text>

                          <Ionicons
                            name="arrow-up-outline"
                            size={13}
                            color={
                              COLORS.cardinal
                            }
                          />
                        </Pressable>
                      )
                    )}
                  </View>
                </View>
              )}



            {/* EMAIL */}

            <View
              style={
                styles.inputGroup
              }
            >
              <Text
                style={styles.label}
              >
                {affiliation === "student" ? "TUP Student Email *" : "Email Address"}
              </Text>

              <View
                style={
                  styles.inputWrapper
                }
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={COLORS.cardinal}
                />

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={affiliation === "student" ? "yourname@gsfe.tupcavite.edu.ph" : "you@example.com"}
                  placeholderTextColor={
                    COLORS.lightMuted
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  style={
                    styles.inputWithIcon
                  }
                />
              </View>
            </View>

          </View>


          {/* =================================================
              IDENTITY VERIFICATION
          ================================================= */}

          <View style={styles.card}>
            <SectionHeader
              icon={affiliation === "student" ? "school-outline" : "id-card-outline"}
              title={
                affiliation === "student"
                  ? "TUPC-ID Verification"
                  : "Government ID Verification"
              }
              description={
                affiliation === "student"
                  ? "Provide your TUPC-ID details and clear front and back photos."
                  : "Provide a valid government ID number and clear front and back photos."
              }
            />

            {/* =================================================
                STUDENT ID
            ================================================= */}

            {affiliation ===
              "student" && (
              <View
                style={
                  styles.dynamicSection
                }
              >
                <Text
                  style={styles.label}
                >
                  TUPC-ID
                </Text>

                <View
                  style={
                    styles.inputWrapper
                  }
                >
                  <Ionicons
                    name="school-outline"
                    size={20}
                    color={
                      COLORS.cardinal
                    }
                  />

                  <TextInput
                    value={tupcId}
                    onChangeText={
                      handleTupcIdChange
                    }
                    placeholder="Enter your TUPC-ID"
                    placeholderTextColor={
                      COLORS.lightMuted
                    }
                    autoCapitalize="characters"
                    autoCorrect={false}
                    editable={!isLoading}
                    maxLength={12}
                    style={
                      styles.inputWithIcon
                    }
                  />
                </View>

                <View
                  style={
                    styles.fieldHint
                  }
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={14}
                    color={
                      COLORS.muted
                    }
                  />

                  <Text
                    style={
                      styles.fieldHintText
                    }
                  >
                    Example: TUPC-24-1234
                  </Text>
                </View>

                {/* FRONT */}

<IdImageUpload
  title="TUPC-ID Front"
  imageUri={tupcIdFront}
  onPress={() =>
    pickIdImageFromMenu("tupcFront")
  }
  onRemove={() =>
    setTupcIdFront(null)
  }
/>

                {/* BACK */}

                <IdImageUpload
                  title="TUPC-ID Back"
                  imageUri={
                    tupcIdBack
                  }
                  onPress={() =>
                    pickIdImageFromMenu(
                      "tupcBack"
                    )
                  }
                  onRemove={() =>
                    setTupcIdBack(
                      null
                    )
                  }
                />
              </View>
            )}

            {/* =================================================
                GOVERNMENT ID
            ================================================= */}

            {affiliation ===
              "others" && (
              <View
                style={
                  styles.dynamicSection
                }
              >
                <Text style={styles.label}>
                  Government ID Type *
                </Text>

                <Pressable
                  style={[styles.inputWrapper, styles.dropdownTrigger]}
                  onPress={() => setGovernmentIdDropdownOpen(!governmentIdDropdownOpen)}
                  disabled={isLoading}
                >
                  <Ionicons name="card-outline" size={20} color={COLORS.cardinal} />
                  <Text style={[styles.inputWithIcon, !governmentIdType && styles.dropdownPlaceholder]}>
                    {governmentIdType || "Select government ID"}
                  </Text>
                  <Ionicons name={governmentIdDropdownOpen ? "chevron-up" : "chevron-down"} size={18} color={COLORS.muted} />
                </Pressable>

                {governmentIdDropdownOpen && (
                  <View style={styles.governmentDropdown}>
                    {GOVERNMENT_ID_CONFIGS.map((item, index) => (
                      <Pressable
                        key={item.label}
                        style={[
                          styles.governmentDropdownItem,
                          index === GOVERNMENT_ID_CONFIGS.length - 1 && styles.governmentDropdownItemLast,
                          governmentIdType === item.label && styles.governmentDropdownItemSelected,
                        ]}
                        onPress={() => handleGovernmentIdTypeSelect(item.label)}
                      >
                        <View style={styles.governmentDropdownItemText}>
                          <Text style={[styles.governmentDropdownTitle, governmentIdType === item.label && styles.governmentDropdownTitleSelected]}>
                            {item.label}
                          </Text>
                          <Text style={styles.governmentDropdownHint}>{item.hint}</Text>
                        </View>
                        {governmentIdType === item.label && (
                          <Ionicons name="checkmark-circle" size={20} color={COLORS.cardinal} />
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
                      <Ionicons name="key-outline" size={20} color={COLORS.cardinal} />
                      <TextInput
                        value={governmentIdNumber}
                        onChangeText={handleGovernmentIdNumberChange}
                        placeholder={selectedGovernmentIdConfig.placeholder}
                        placeholderTextColor={COLORS.lightMuted}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        maxLength={selectedGovernmentIdConfig.maxLength}
                        editable={!isLoading}
                        style={styles.inputWithIcon}
                      />
                    </View>
                    <View style={styles.fieldHint}>
                      <Ionicons name="information-circle-outline" size={14} color={COLORS.muted} />
                      <Text style={styles.fieldHintText}>{selectedGovernmentIdConfig.hint}</Text>
                    </View>
                  </>
                )}

                {/* FRONT */}

                <IdImageUpload
                  title="Government ID Front"
                  imageUri={governmentIdFront}
                  onPress={() => pickIdImageFromMenu("governmentFront")}
                  onRemove={() =>
                    setGovernmentIdFront(
                      null
                    )
                  }
                />

                {/* BACK */}

<IdImageUpload
  title="Government ID Back"
  imageUri={governmentIdBack}
  onPress={() => pickIdImageFromMenu("governmentBack")}
  onRemove={() => setGovernmentIdBack(null)}
/>
              </View>
            )}

          </View>


          {/* =================================================
              PASSWORD
          ================================================= */}

          <View style={styles.card}>
            <SectionHeader
              icon="lock-closed-outline"
              title="Password"
              description="Create a strong password to protect your account."
            />

            <Text
              style={styles.label}
            >
              Password
            </Text>

            <View
              style={
                styles.inputWrapper
              }
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={COLORS.cardinal}
              />

              <TextInput
                value={password}
                onChangeText={
                  setPassword
                }
                placeholder="Create a strong password"
                placeholderTextColor={
                  COLORS.lightMuted
                }
                secureTextEntry={
                  !showPassword
                }
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                style={
                  styles.inputWithIcon
                }
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

            {/* PASSWORD STRENGTH */}

            {password.length > 0 && (
              <View
                style={
                  styles.passwordStrengthBox
                }
              >
                <View
                  style={
                    styles.strengthHeader
                  }
                >
                  <Text
                    style={
                      styles.strengthTitle
                    }
                  >
                    Password strength
                  </Text>

                  <Text
                    style={[
                      styles.strengthScore,
                      {
                        color:
                          passwordStrong
                            ? COLORS.success
                            : passwordScore >=
                              3
                            ? COLORS.warning
                            : COLORS.danger,
                      },
                    ]}
                  >
                    {passwordStrong
                      ? "Strong"
                      : passwordScore >=
                        3
                      ? "Medium"
                      : "Weak"}
                  </Text>
                </View>

                <View
                  style={
                    styles.strengthBar
                  }
                >
                  {[1, 2, 3, 4, 5].map(
                    (item) => (
                      <View
                        key={item}
                        style={[
                          styles.strengthSegment,
                          item <=
                            passwordScore &&
                            styles.strengthSegmentActive,
                        ]}
                      />
                    )
                  )}
                </View>

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

            {/* CONFIRM PASSWORD */}

            <View
              style={
                styles.inputGroup
              }
            >
              <Text
                style={styles.label}
              >
                Confirm Password
              </Text>

              <View
                style={
                  styles.inputWrapper
                }
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.cardinal}
                />

                <TextInput
                  value={
                    confirmPassword
                  }
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
                  editable={!isLoading}
                  style={
                    styles.inputWithIcon
                  }
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
                    color={
                      COLORS.muted
                    }
                  />
                </Pressable>
              </View>

              {confirmPassword.length >
                0 && (
                <View
                  style={
                    styles.matchRow
                  }
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
                    style={
                      styles.matchText
                    }
                  >
                    {password ===
                    confirmPassword
                      ? "Passwords match"
                      : "Passwords do not match"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* =================================================
              SECURITY SETUP
          ================================================= */}

          <View style={styles.card}>
            <SectionHeader
              icon="shield-checkmark-outline"
              title="Security Setup"
              description="Secure your account with fingerprint and a backup PIN."
            />

            {/* FINGERPRINT REGISTRATION */}

            <View
              style={[
                styles.biometricCard,
                enableBiometric && styles.biometricCardActive,
              ]}
            >
              <View
                style={[
                  styles.biometricIconBox,
                  enableBiometric && styles.biometricIconBoxActive,
                ]}
              >
                <Ionicons
                  name="finger-print-outline"
                  size={29}
                  color={enableBiometric ? COLORS.white : COLORS.cardinal}
                />
              </View>

              <View style={styles.biometricContent}>
                <View style={styles.biometricTitleRow}>
                  <Text style={styles.biometricTitle}>
                    Register Fingerprint
                  </Text>

                  {biometricAvailable && (
                    <View style={styles.availableBadge}>
                      <View style={styles.availableDot} />
                      <Text style={styles.availableText}>DEVICE READY</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.biometricDescription}>
                  {enableBiometric
                    ? "Fingerprint registration is complete. You can use it for faster sign-in after account approval."
                    : biometricAvailable
                      ? "Verify your enrolled device fingerprint to enable fingerprint sign-in for this account."
                      : "No enrolled fingerprint was detected. Add a fingerprint in your device security settings first."}
                </Text>
              </View>

              {biometricAvailable && !enableBiometric && (
                <Pressable
                  style={styles.registerFingerprintButton}
                  onPress={registerFingerprint}
                  disabled={isLoading || isRegisteringFingerprint}
                >
                  {isRegisteringFingerprint ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Ionicons
                      name="finger-print-outline"
                      size={19}
                      color={COLORS.white}
                    />
                  )}
                </Pressable>
              )}

              {enableBiometric && (
                <View style={styles.fingerprintRegisteredBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={21}
                    color={COLORS.success}
                  />
                </View>
              )}
            </View>

            {/* PIN */}

            <View
              style={styles.pinCard}
            >
              <View
                style={styles.pinTop}
              >
                <View
                  style={
                    styles.pinIconBox
                  }
                >
                  <Ionicons
                    name="keypad-outline"
                    size={22}
                    color={
                      COLORS.cardinal
                    }
                  />
                </View>

                <View
                  style={
                    styles.pinTextContainer
                  }
                >
                  <Text
                    style={
                      styles.pinTitle
                    }
                  >
                    6-Digit PIN
                  </Text>

                  <Text
                    style={
                      styles.pinDescription
                    }
                  >
                    Your backup authentication method
                    if fingerprint sign-in is unavailable.
                  </Text>
                </View>

                <View
                  style={
                    styles.requiredBadge
                  }
                >
                  <Text
                    style={
                      styles.requiredBadgeText
                    }
                  >
                    REQUIRED
                  </Text>
                </View>
              </View>

              {/* CREATE PIN */}

              <Text
                style={styles.label}
              >
                Create PIN
              </Text>

              <View
                style={
                  styles.inputWrapper
                }
              >
                <Ionicons
                  name="keypad-outline"
                  size={20}
                  color={COLORS.cardinal}
                />

                <TextInput
                  value={pin}
                  onChangeText={
                    handlePinChange
                  }
                  placeholder="Enter 6-digit PIN"
                  placeholderTextColor={
                    COLORS.lightMuted
                  }
                  keyboardType="number-pad"
                  secureTextEntry={
                    !showPin
                  }
                  maxLength={6}
                  editable={!isLoading}
                  style={
                    styles.inputWithIcon
                  }
                />

                <Pressable
                  onPress={() =>
                    setShowPin(
                      !showPin
                    )
                  }
                  hitSlop={10}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={
                      showPin
                        ? "eye-off-outline"
                        : "eye-outline"
                    }
                    size={21}
                    color={
                      COLORS.muted
                    }
                  />
                </Pressable>
              </View>

              {/* CONFIRM PIN */}

              <Text
                style={[
                  styles.label,
                  styles.secondLabel,
                ]}
              >
                Confirm PIN
              </Text>

              <View
                style={
                  styles.inputWrapper
                }
              >
                <Ionicons
                  name="keypad-outline"
                  size={20}
                  color={COLORS.cardinal}
                />

                <TextInput
                  value={
                    confirmPin
                  }
                  onChangeText={
                    handleConfirmPinChange
                  }
                  placeholder="Confirm 6-digit PIN"
                  placeholderTextColor={
                    COLORS.lightMuted
                  }
                  keyboardType="number-pad"
                  secureTextEntry={
                    !showConfirmPin
                  }
                  maxLength={6}
                  editable={!isLoading}
                  style={
                    styles.inputWithIcon
                  }
                />

                <Pressable
                  onPress={() =>
                    setShowConfirmPin(
                      !showConfirmPin
                    )
                  }
                  hitSlop={10}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={
                      showConfirmPin
                        ? "eye-off-outline"
                        : "eye-outline"
                    }
                    size={21}
                    color={
                      COLORS.muted
                    }
                  />
                </Pressable>
              </View>

              {confirmPin.length >
                0 && (
                <View
                  style={
                    styles.matchRow
                  }
                >
                  <Ionicons
                    name={
                      pin ===
                      confirmPin
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={16}
                    color={
                      pin ===
                      confirmPin
                        ? COLORS.success
                        : COLORS.danger
                    }
                  />

                  <Text
                    style={
                      styles.matchText
                    }
                  >
                    {pin ===
                    confirmPin
                      ? "PINs match"
                      : "PINs do not match"}
                  </Text>
                </View>
              )}
            </View>

            {/* SECURITY INFO */}

            <View
              style={
                styles.securityInfo
              }
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={19}
                color={
                  COLORS.cardinal
                }
              />

              <Text
                style={
                  styles.securityInfoText
                }
              >
                Fingerprint authentication is handled by
                your device's secure biometric system.
                TUPC-OrderUp does not receive or store
                your fingerprint data. Your 6-digit PIN
                remains available as the backup sign-in method.
              </Text>
            </View>
          </View>

          {/* =================================================
              EMAIL VERIFICATION INFO
          ================================================= */}

          <View
            style={styles.infoBox}
          >
            <View
              style={styles.infoIcon}
            >
              <Ionicons
                name="mail-unread-outline"
                size={21}
                color={
                  COLORS.cardinal
                }
              />
            </View>

            <View
              style={
                styles.infoContent
              }
            >
              <Text
                style={styles.infoTitle}
              >
                Email verification required
              </Text>

              <Text
                style={styles.infoText}
              >
                A 6-digit verification code will
                be sent to your email after
                registration. Your account will
                remain pending until an
                administrator approves it.
              </Text>
            </View>
          </View>

          {/* =================================================
              CLOUDFLARE TURNSTILE CAPTCHA
          ================================================= */}

          <View style={styles.captchaCard}>
            <View style={styles.captchaHeader}>
              <View style={styles.captchaIconBox}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={COLORS.cardinal}
                />
              </View>

              <View style={styles.captchaHeaderText}>
                <Text style={styles.captchaTitle}>
                  Security Verification
                </Text>

                <Text style={styles.captchaDescription}>
                  Complete the CAPTCHA before creating your account.
                </Text>
              </View>
            </View>

            <View style={styles.captchaWebViewContainer}>
              <WebView
                source={{ uri: CAPTCHA_URL }}
                onMessage={handleCaptchaMessage}
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={["*"]}
                startInLoadingState
                renderLoading={() => (
                  <View style={styles.captchaLoading}>
                    <ActivityIndicator
                      size="small"
                      color={COLORS.cardinal}
                    />
                    <Text style={styles.captchaLoadingText}>
                      Loading security verification...
                    </Text>
                  </View>
                )}
                style={styles.captchaWebView}
              />
            </View>

            <View style={styles.captchaStatusRow}>
              <Ionicons
                name={
                  captchaToken
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={17}
                color={
                  captchaToken
                    ? COLORS.success
                    : COLORS.muted
                }
              />

              <Text
                style={[
                  styles.captchaStatusText,
                  captchaToken &&
                    styles.captchaStatusTextSuccess,
                ]}
              >
                {captchaToken
                  ? "CAPTCHA verified"
                  : "CAPTCHA verification required"}
              </Text>
            </View>
          </View>

          {/* =================================================
              CREATE ACCOUNT
          ================================================= */}

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
                  style={
                    styles.buttonText
                  }
                >
                  Creating Account...
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={
                    styles.buttonText
                  }
                >
                  Create Client Account
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={19}
                  color={
                    COLORS.white
                  }
                />
              </>
            )}
          </Pressable>
          </Animated.View>

          {/* =================================================
              FOOTER
          ================================================= */}

          <Text style={styles.footerText}>
            By creating an account, you agree to the Terms and Conditions
            of TUP-OrderUp and confirm that the information you provide
            is accurate and complete.
          </Text>

          <View style={styles.brandFooter}>
            <View style={styles.footerDivider} />
            <Image source={TUPC_LOGO} style={styles.footerLogo} resizeMode="contain" />
            <Text style={styles.footerBrandName}>TUPC-ORDERUP</Text>
            <Text style={styles.footerBrandSub}>Campus ordering made simple • TUP Cavite</Text>
          </View>
        </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

    {idImageMenuType && (
      <View style={styles.idImageModalOverlay}>
        <Pressable style={styles.idImageModalBackdrop} onPress={closeIdImageMenu} />
        <View style={styles.idImageModalCard}>
          <View style={styles.idImageModalHandle} />
          <Text style={styles.idImageModalTitle}>
            {idImageMenuType === "tupcFront" ? "TUPC-ID Front" :
              idImageMenuType === "tupcBack" ? "TUPC-ID Back" :
              idImageMenuType === "governmentFront" ? "Government ID Front" : "Government ID Back"}
          </Text>
          <Text style={styles.idImageModalSubtitle}>Choose how you want to add your ID photo.</Text>

          <Pressable style={styles.idImageModalOption} onPress={() => void handleIdImageMenuAction("gallery")}>
            <View style={styles.idImageModalIcon}>
              <Ionicons name="images-outline" size={22} color={COLORS.cardinal} />
            </View>
            <View style={styles.idImageModalOptionText}>
              <Text style={styles.idImageModalOptionTitle}>Choose from Gallery</Text>
              <Text style={styles.idImageModalOptionSubtitle}>Select an existing photo</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
          </Pressable>

          <Pressable style={styles.idImageModalOption} onPress={() => void handleIdImageMenuAction("camera")}>
            <View style={styles.idImageModalIcon}>
              <Ionicons name="camera-outline" size={22} color={COLORS.cardinal} />
            </View>
            <View style={styles.idImageModalOptionText}>
              <Text style={styles.idImageModalOptionTitle}>Take Photo</Text>
              <Text style={styles.idImageModalOptionSubtitle}>Use your camera</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
          </Pressable>

          <Pressable style={styles.idImageModalCancelButton} onPress={closeIdImageMenu}>
            <Text style={styles.idImageModalCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    )}

    </SafeAreaView>
  );
}

// =====================================================
// SECTION HEADER
// =====================================================

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View
      style={styles.sectionHeader}
    >
      <View
        style={styles.sectionIcon}
      >
        <Ionicons
          name={icon}
          size={18}
          color={COLORS.cardinal}
        />
      </View>

      <View
        style={
          styles.sectionHeaderText
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.sectionDescription
          }
        >
          {description}
        </Text>

        <View style={styles.sectionDivider} />
      </View>
    </View>
  );
}

// =====================================================
// ID IMAGE UPLOAD COMPONENT
// =====================================================

function IdImageUpload({
  title,
  imageUri,
  onPress,
  onRemove,
}: {
  title: string;
  imageUri: string | null;
  onPress: () => void;
  onRemove: () => void;
}) {
  return (
    <View
      style={styles.idUploadContainer}
    >
      <Text
        style={styles.label}
      >
        {title}
      </Text>

      <Pressable
        style={[
          styles.idUploadBox,
          imageUri &&
            styles.idUploadBoxSelected,
        ]}
        onPress={onPress}
      >
        {imageUri ? (
          <>
            <Image
              source={{
                uri: imageUri,
              }}
              style={styles.idPreview}
              resizeMode="cover"
            />

            <View
              style={
                styles.idUploadedOverlay
              }
            >
              <View
                style={
                  styles.idUploadedBadge
                }
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={
                    COLORS.success
                  }
                />

                <Text
                  style={
                    styles.idUploadedText
                  }
                >
                  Image Selected
                </Text>
              </View>
            </View>

            <Pressable
              style={
                styles.idRemoveButton
              }
              onPress={(event) => {
                event.stopPropagation();
                onRemove();
              }}
              hitSlop={10}
            >
              <Ionicons
                name="close"
                size={18}
                color={COLORS.white}
              />
            </Pressable>
          </>
        ) : (
          <>
            <View
              style={styles.idUploadIcon}
            >
              <Ionicons
                name="camera-outline"
                size={25}
                color={
                  COLORS.cardinal
                }
              />
            </View>

            <Text
              style={
                styles.idUploadTitle
              }
            >
              Take ID Photo
            </Text>

            <Text
              style={
                styles.idUploadSubtitle
              }
            >
              {title.startsWith("TUPC-ID")
                ? "Portrait camera • Tap to open"
                : "Landscape camera • Tap to open"}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  animatedPage: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  keyboard: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 44,
  },

  // ===================================================
  // BACK
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

  // ===================================================
  // HERO
  // ===================================================

  hero: {
    height: 300,
    marginHorizontal: -20,
    marginTop: -14,
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
    backgroundColor:
      COLORS.white,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    marginBottom: 16,
  },

  progressTop: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  progressLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    color: COLORS.cardinal,
  },

  progressStep: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.muted,
  },

  progressTrack: {
    height: 5,
    borderRadius: 5,
    backgroundColor:
      "#EDEDED",
    overflow: "hidden",
  },

  progressActive: {
    width: "34%",
    height: "100%",
    backgroundColor:
      COLORS.cardinal,
    borderRadius: 5,
  },

  progressLabels: {
    flexDirection: "row",
    justifyContent:
      "space-between",
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
  // CARD
  // ===================================================

  card: {
    backgroundColor:
      COLORS.white,
    borderRadius: 20,
    padding: 19,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    marginBottom: 15,
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
    height: 51,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 13,
    backgroundColor:
      COLORS.input,
    paddingHorizontal: 13,
    fontSize: 14,
    color: COLORS.text,
  },

  inputWrapper: {
    minHeight: 52,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 13,
    backgroundColor:
      COLORS.input,
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

  usernameInputAvailable: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.softGreen,
  },

  usernameInputTaken: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.softRed,
  },

  usernameInputError: {
    borderColor: COLORS.warning,
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
    color: COLORS.warning,
  },

  dropdownTrigger: {
    minHeight: 52,
  },

  dropdownPlaceholder: {
    color: COLORS.lightMuted,
  },

  governmentDropdown: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    backgroundColor: COLORS.white,
    overflow: "hidden",
  },

  governmentDropdownItem: {
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  governmentDropdownItemLast: { borderBottomWidth: 0 },
  governmentDropdownItemSelected: { backgroundColor: COLORS.softRed },
  governmentDropdownItemText: { flex: 1 },
  governmentDropdownTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text },
  governmentDropdownTitleSelected: { color: COLORS.cardinal },
  governmentDropdownHint: { marginTop: 3, fontSize: 10, lineHeight: 14, color: COLORS.muted },

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
    backgroundColor:
      COLORS.border,
    marginHorizontal: 10,
  },

  phoneInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 13,
  },

  // ===================================================
  // USERNAME SUGGESTIONS
  // ===================================================

  suggestionsBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 13,
    backgroundColor:
      COLORS.softGold,
    borderWidth: 1,
    borderColor:
      "#EFE2C1",
  },

  suggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  suggestionTitle: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.text,
  },

  suggestionSubtitle: {
    marginTop: 3,
    marginBottom: 9,
    fontSize: 10,
    color: COLORS.muted,
  },

  suggestionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor:
      COLORS.white,
    borderWidth: 1,
    borderColor:
      "#E7D5A7",
  },

  suggestionText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.cardinal,
  },

  // ===================================================
  // AFFILIATION
  // ===================================================

  affiliationRow: {
    flexDirection: "row",
    gap: 10,
  },

  affiliationCard: {
    flex: 1,
    minHeight: 125,
    borderRadius: 16,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.input,
    padding: 14,
    position: "relative",
  },

  affiliationCardActive: {
    backgroundColor:
      COLORS.cardinal,
    borderColor:
      COLORS.cardinal,
  },

  affiliationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor:
      COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  affiliationIconActive: {
    backgroundColor:
      "rgba(255,255,255,0.16)",
  },

  affiliationTitle: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.text,
  },

  affiliationTitleActive: {
    color: COLORS.white,
  },

  affiliationDescription: {
    marginTop: 4,
    fontSize: 10,
    color: COLORS.muted,
  },

  affiliationDescriptionActive: {
    color: "#F9DDE2",
  },

  selectedBadge: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor:
      COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  dynamicSection: {
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor:
      COLORS.border,
  },

  fieldHint: {
    flexDirection: "row",
    alignItems:
      "flex-start",
    marginTop: 7,
  },

  fieldHintText: {
    flex: 1,
    marginLeft: 5,
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.muted,
  },

  // ===================================================
  // ID IMAGE UPLOAD
  // ===================================================

  idUploadContainer: {
    marginTop: 17,
  },

  idUploadBox: {
    height: 155,
    borderWidth: 1.5,
    borderColor:
      COLORS.border,
    borderStyle: "dashed",
    borderRadius: 15,
    backgroundColor:
      COLORS.input,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },

  idUploadBoxSelected: {
    borderColor:
      COLORS.softRedBorder,
    borderStyle: "solid",
    backgroundColor:
      COLORS.white,
  },

  idUploadIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor:
      COLORS.softRed,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },

  idUploadTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.text,
  },

  idUploadSubtitle: {
    marginTop: 4,
    fontSize: 10,
    color: COLORS.muted,
  },

  idPreview: {
    width: "100%",
    height: "100%",
  },

  idUploadedOverlay: {
    position: "absolute",
    left: 10,
    bottom: 10,
  },

  idUploadedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      COLORS.white,
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  idUploadedText: {
    marginLeft: 5,
    fontSize: 9,
    fontWeight: "900",
    color: COLORS.success,
  },

  idRemoveButton: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor:
      "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ===================================================
  // PASSWORD
  // ===================================================

  passwordStrengthBox: {
    marginTop: 11,
    padding: 13,
    borderRadius: 13,
    backgroundColor:
      COLORS.input,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  strengthHeader: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: 9,
  },

  strengthTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.text,
  },

  strengthScore: {
    fontSize: 11,
    fontWeight: "900",
  },

  strengthBar: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 10,
  },

  strengthSegment: {
    flex: 1,
    height: 5,
    borderRadius: 5,
    backgroundColor:
      "#E1E1E1",
  },

  strengthSegmentActive: {
    backgroundColor:
      COLORS.cardinal,
  },

  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  requirementText: {
    marginLeft: 7,
    fontSize: 10,
    color: COLORS.muted,
  },

  requirementTextValid: {
    color: COLORS.success,
    fontWeight: "700",
  },

  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  matchText: {
    marginLeft: 6,
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: "600",
  },

  // ===================================================
  // SECURITY
  // ===================================================

  biometricCard: {
    minHeight: 82,
    borderRadius: 16,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.input,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  biometricCardActive: {
    backgroundColor:
      "#FFF8F9",
    borderColor:
      COLORS.softRedBorder,
  },

  biometricIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor:
      COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },

  biometricIconBoxActive: {
    backgroundColor:
      COLORS.cardinal,
  },

  biometricContent: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  biometricTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
  },

  biometricTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.text,
  },

  biometricDescription: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.muted,
  },

  availableBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor:
      COLORS.softGreen,
  },

  availableDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor:
      COLORS.success,
    marginRight: 4,
  },

  availableText: {
    fontSize: 8,
    fontWeight: "900",
    color: COLORS.success,
  },

  registerFingerprintButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.cardinal,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.cardinal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 3,
  },

  fingerprintRegisteredBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.softGreen,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CDE8D2",
  },

  toggle: {
    width: 42,
    height: 24,
    borderRadius: 13,
    backgroundColor:
      "#D5D5D5",
    padding: 3,
    justifyContent:
      "center",
  },

  toggleActive: {
    backgroundColor:
      COLORS.cardinal,
  },

  toggleCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor:
      COLORS.white,
  },

  toggleCircleActive: {
    alignSelf: "flex-end",
  },

  // ===================================================
  // PIN
  // ===================================================

  pinCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor:
      "#FCFCFC",
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  pinTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  pinIconBox: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor:
      COLORS.softRed,
    alignItems: "center",
    justifyContent: "center",
  },

  pinTextContainer: {
    flex: 1,
    marginLeft: 10,
  },

  pinTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.text,
  },

  pinDescription: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.muted,
  },

  requiredBadge: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor:
      COLORS.softRed,
  },

  requiredBadgeText: {
    fontSize: 7,
    fontWeight: "900",
    color: COLORS.cardinal,
    letterSpacing: 0.5,
  },

  securityInfo: {
    flexDirection: "row",
    alignItems:
      "flex-start",
    backgroundColor:
      COLORS.softRed,
    borderRadius: 12,
    padding: 12,
    marginTop: 13,
  },

  securityInfoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.muted,
  },

  // ===================================================
  // INFO
  // ===================================================

  infoBox: {
    flexDirection: "row",
    alignItems:
      "flex-start",
    backgroundColor:
      COLORS.softRed,
    borderWidth: 1,
    borderColor:
      "#F0D1D6",
    borderRadius: 15,
    padding: 13,
    marginBottom: 15,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor:
      COLORS.white,
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
    marginBottom: 3,
  },

  infoText: {
    fontSize: 10,
    lineHeight: 16,
    color: COLORS.muted,
  },

  // ===================================================
  // CAPTCHA
  // ===================================================

  captchaCard: {
    backgroundColor:
      COLORS.white,
    borderRadius: 20,
    padding: 17,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    marginBottom: 15,
  },

  captchaHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 13,
  },

  captchaIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor:
      COLORS.softRed,
    alignItems: "center",
    justifyContent: "center",
  },

  captchaHeaderText: {
    flex: 1,
    marginLeft: 10,
  },

  captchaTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.text,
  },

  captchaDescription: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.muted,
  },

  captchaWebViewContainer: {
    height: 95,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.input,
  },

  captchaWebView: {
    flex: 1,
    backgroundColor:
      "transparent",
  },

  captchaLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      COLORS.input,
  },

  captchaLoadingText: {
    marginTop: 7,
    fontSize: 10,
    color: COLORS.muted,
  },

  captchaStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  captchaStatusText: {
    marginLeft: 6,
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.muted,
  },

  captchaStatusTextSuccess: {
    color: COLORS.success,
  },

  // ===================================================
  // BUTTON
  // ===================================================

  button: {
    minHeight: 55,
    borderRadius: 15,
    backgroundColor:
      COLORS.cardinal,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 18,
    shadowColor:
      COLORS.cardinal,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.18,
    shadowRadius: 9,
    elevation: 4,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  pressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  buttonText: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.white,
  },

  // ===================================================
  // FOOTER
  // ===================================================

  footer: {
    alignItems: "center",
    marginTop: 24,
  },

  footerBrand: {
    flexDirection: "row",
    alignItems: "center",
  },

  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      COLORS.gold,
    marginRight: 6,
  },

  footerTitle: {
    fontSize: 13,
    fontWeight: "900",
    color:
      COLORS.cardinalDark,
  },

  footerText: {
    marginTop: 5,
    fontSize: 9,
    lineHeight: 14,
    color: COLORS.muted,
    textAlign: "center",
    alignSelf: "center",
    maxWidth: 340,
  },

  idImageModalOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: "flex-end",
    zIndex: 999,
  },
  idImageModalBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  idImageModalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 12 },
  idImageModalHandle: { width: 42, height: 5, borderRadius: 3, backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 18 },
  idImageModalTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text, textAlign: "center" },
  idImageModalSubtitle: { fontSize: 14, color: COLORS.muted, textAlign: "center", marginTop: 6, marginBottom: 18 },
  idImageModalOption: { minHeight: 68, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, marginBottom: 10, backgroundColor: COLORS.white },
  idImageModalIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.softRed, alignItems: "center", justifyContent: "center", marginRight: 12 },
  idImageModalOptionText: { flex: 1 },
  idImageModalOptionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  idImageModalOptionSubtitle: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  idImageModalCancelButton: { height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.softRed, marginTop: 4 },
  idImageModalCancelText: { fontSize: 16, fontWeight: "800", color: COLORS.cardinal },

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
    height: 70,
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

});
