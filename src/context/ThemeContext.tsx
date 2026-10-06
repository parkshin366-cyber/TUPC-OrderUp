import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "@tuporderup_theme";

export const LIGHT_COLORS = {
  cardinal: "#A6192E",
  cardinalDark: "#7D1021",
  cardinalDeep: "#570B17",
  background: "#F7F7F8",
  surface: "#FFFFFF",
  surfaceSecondary: "#FAFAFA",
  input: "#F4F4F5",
  text: "#171717",
  textSecondary: "#404040",
  muted: "#737373",
  lightMuted: "#9A9A9A",
  border: "#E7E7E8",
  borderStrong: "#DADADC",
  softRed: "#FCECEF",
  softRedBorder: "#F2D5DA",
  success: "#238636",
  successBg: "#F0F8F1",
  successBorder: "#DCEFE0",
  warning: "#B7791F",
  warningBg: "#FFF8E7",
  gold: "#D8B56A",
  danger: "#C62828",
  dangerBg: "#FFF3F3",
  dangerBorder: "#F0CDD2",
  overlay: "rgba(0,0,0,0.45)",
};

export const DARK_COLORS: typeof LIGHT_COLORS = {
  cardinal: "#D12B45",
  cardinalDark: "#E24A61",
  cardinalDeep: "#A6192E",
  background: "#0F1012",
  surface: "#18191C",
  surfaceSecondary: "#202126",
  input: "#24252A",
  text: "#F5F5F5",
  textSecondary: "#D4D4D8",
  muted: "#A1A1AA",
  lightMuted: "#71717A",
  border: "#2D2E34",
  borderStrong: "#3A3B42",
  softRed: "#32151C",
  softRedBorder: "#56232D",
  success: "#43A85C",
  successBg: "#14251A",
  successBorder: "#23482D",
  warning: "#D39B37",
  warningBg: "#2C2413",
  gold: "#D8B56A",
  danger: "#E05252",
  dangerBg: "#2A1717",
  dangerBorder: "#542727",
  overlay: "rgba(0,0,0,0.70)",
};

type ThemeContextValue = {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: typeof LIGHT_COLORS;
  isThemeReady: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === "light" || savedTheme === "dark") {
          setThemeModeState(savedTheme);
        }
      } catch (error) {
        console.warn("Unable to load theme preference:", error);
      } finally {
        setIsThemeReady(true);
      }
    };

    void loadTheme();
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      isDark: themeMode === "dark",
      colors: themeMode === "dark" ? DARK_COLORS : LIGHT_COLORS,
      isThemeReady,
      setThemeMode,
    }),
    [isThemeReady, setThemeMode, themeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within a ThemeProvider.");
  }

  return context;
}
