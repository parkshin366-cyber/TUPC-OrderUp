import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

import { API_URL, NGROK_HEADERS } from "../constants/api";

type Props = {
  onMessage: (event: WebViewMessageEvent) => void;
};

/**
 * Loads the Turnstile page from the backend WITHOUT going through the
 * ngrok browser-warning page.
 *
 * How it works:
 *   1. fetch() sends the "ngrok-skip-browser-warning" header, so ngrok
 *      returns the real HTML instead of the warning page.
 *   2. The HTML is rendered directly inside the WebView.
 *   3. baseUrl makes the page's origin the ngrok domain, which is what
 *      Cloudflare Turnstile checks against the widget's hostname list.
 */
export default function CaptchaWebView({ onMessage }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCaptcha = useCallback(async () => {
    setHtml(null);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/captcha`, {
        headers: NGROK_HEADERS,
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(
          `CAPTCHA server returned ${response.status}. Check the backend terminal.`
        );
      }

      setHtml(text);
    } catch (err) {
      console.error("CAPTCHA LOAD ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to reach the CAPTCHA server."
      );
    }
  }, []);

  useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>

        <Pressable style={styles.retryButton} onPress={loadCaptcha}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (!html) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#A6192E" />
        <Text style={styles.loadingText}>Loading CAPTCHA...</Text>
      </View>
    );
  }

  return (
    <WebView
      source={{ html, baseUrl: API_URL }}
      onMessage={onMessage}
      javaScriptEnabled
      domStorageEnabled
      originWhitelist={["*"]}
      style={styles.webView}
    />
  );
}

const styles = StyleSheet.create({
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#FFFFFF",
  },

  loadingText: {
    fontSize: 10,
    color: "#6B7280",
  },

  errorText: {
    fontSize: 10,
    lineHeight: 15,
    color: "#C62828",
    textAlign: "center",
  },

  retryButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#FCECEF",
  },

  retryText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#A6192E",
  },
});