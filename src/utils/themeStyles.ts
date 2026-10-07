import { StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from "react-native";
import type { AppColors } from "../context/ThemeContext";

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

const normalize = (value: string) => value.trim().toLowerCase();

export function createThemedStyleSheet<T extends NamedStyles<T>>(
  colors: AppColors,
  source: T,
) {
  const colorMap: Record<string, string> = {
    "#ffffff": colors.surface,
    "#fff": colors.surface,
    "white": colors.surface,
    "#f7f7f8": colors.background,
    "#fafafa": colors.surfaceSecondary,
    "#f8f8f9": colors.surfaceSecondary,
    "#f6f6f7": colors.surfaceSecondary,
    "#f5f5f6": colors.surfaceSecondary,
    "#f4f4f4": colors.input,
    "#f3f3f4": colors.input,
    "#f2f2f3": colors.input,
    "#f1f1f2": colors.input,
    "#f1f1f1": colors.input,
    "#f0f0f1": colors.input,
    "#f0f0f0": colors.input,
    "#eeeeef": colors.input,
    "#eeeef0": colors.input,
    "#ececec": colors.input,
    "#f4f4f5": colors.input,
    "#171717": colors.text,
    "#404040": colors.textSecondary,
    "#737373": colors.muted,
    "#9a9a9a": colors.lightMuted,
    "#e7e7e8": colors.border,
    "#e5e5e5": colors.border,
    "#e8e8e8": colors.border,
    "#d6d6d6": colors.borderStrong,
    "#d5d5d5": colors.borderStrong,
    "#dadadc": colors.borderStrong,
    "#fcecef": colors.softRed,
    "#fbecef": colors.softRed,
    "#f8e9ec": colors.softRed,
    "#f8edf0": colors.softRed,
    "#faecef": colors.softRed,
    "#f9e9ec": colors.softRed,
    "#fbecee": colors.softRed,
    "#fff7f8": colors.softRed,
    "#fdecec": colors.dangerBg,
    "#fef2f2": colors.dangerBg,
    "#fff3f3": colors.dangerBg,
    "#fff8e7": colors.warningBg,
    "#fff8e8": colors.warningBg,
    "#fff4df": colors.warningBg,
    "#fff3e3": colors.warningBg,
    "#fff7ed": colors.warningBg,
    "#fff6e4": colors.warningBg,
    "#fff8f8": colors.dangerBg,
    "#eaf7ee": colors.successBg,
    "#eaf7ef": colors.successBg,
    "#e9f7ef": colors.successBg,
    "#eef8f0": colors.successBg,
    "#ecfdf3": colors.successBg,
    "#f2faf4": colors.successBg,
    "#e3f4e7": colors.successBg,
    "#eaf6ec": colors.successBg,
    "#eaf5ec": colors.successBg,
    "#d8eedd": colors.successBorder,
    "#d8ebdd": colors.successBorder,
    "#28794d": colors.success,
    "#2e7d32": colors.success,
    "#18864b": colors.success,
    "#6d5a2b": colors.warning,
    "rgba(247,247,248,0.96)": colors.background,
    "rgba(247, 247, 248, 0.96)": colors.background,
  };

  const transform = (value: unknown, property?: string): unknown => {
    if (typeof value === "string") {
      const normalized = normalize(value);

      // White and near-white foregrounds are normally text/icons placed on
      // cardinal or status buttons. They must remain light in dark mode.
      if (property === "color" && [
        "#ffffff", "#fff", "white", "#f0f0f0", "#eeeeee", "#f6dce1",
      ].includes(normalized)) {
        return value;
      }

      return colorMap[normalize(value)] ?? value;
    }

    if (Array.isArray(value)) {
      return value.map((child) => transform(child, property));
    }

    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, child]) => [key, transform(child, key)]),
      );
    }

    return value;
  };

  return StyleSheet.create(transform(source) as T);
}
