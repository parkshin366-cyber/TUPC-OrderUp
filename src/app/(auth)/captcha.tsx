import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, WebViewMessageEvent } from "react-native-webview";

const CAPTCHA_SERVER = "http://192.168.18.24:5001";

export default function CaptchaScreen() {
  const webViewRef = useRef<WebView>(null);

  const params = useLocalSearchParams<{
    next?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const nextRoute = params.next || "/(auth)/login";

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "captcha-success") {
        setVerifying(true);

        const token = data.token;

        if (!token) {
          throw new Error("CAPTCHA token was not received.");
        }

        const response = await fetch(`${CAPTCHA_SERVER}/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "CAPTCHA verification failed."
          );
        }

        setVerified(true);
        setVerifying(false);

        Alert.alert(
          "Verification Successful",
          "CAPTCHA verification completed.",
          [
            {
              text: "Continue",
              onPress: () => {
                router.replace(nextRoute as any);
              },
            },
          ]
        );

        return;
      }

      if (data.type === "captcha-error") {
        setVerifying(false);
        setVerified(false);

        Alert.alert(
          "CAPTCHA Failed",
          data.message || "Please complete the CAPTCHA again."
        );

        return;
      }

      if (data.type === "captcha-expired") {
        setVerifying(false);
        setVerified(false);

        Alert.alert(
          "CAPTCHA Expired",
          "Your CAPTCHA verification expired. Please complete it again."
        );
      }
    } catch (error) {
      console.error("CAPTCHA MESSAGE ERROR:", error);

      setVerifying(false);

      Alert.alert(
        "CAPTCHA Error",
        error instanceof Error
          ? error.message
          : "Unable to verify CAPTCHA."
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>T</Text>
          </View>

          <Text style={styles.title}>Security Verification</Text>

          <Text style={styles.subtitle}>
            Complete the CAPTCHA verification to continue.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.shieldCircle}>
              <Text style={styles.shieldText}>✓</Text>
            </View>

            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>
                Verify you are human
              </Text>

              <Text style={styles.cardSubtitle}>
                This helps protect TUPC-OrderUp from automated activity.
              </Text>
            </View>
          </View>

          <View style={styles.webViewContainer}>
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator
                  size="large"
                  color="#A6192E"
                />

                <Text style={styles.loadingText}>
                  Loading CAPTCHA...
                </Text>
              </View>
            )}

            <WebView
              ref={webViewRef}
              source={{
                uri: `${CAPTCHA_SERVER}/captcha`,
              }}
              style={styles.webView}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={["*"]}
              mixedContentMode="always"
              onLoadEnd={() => setLoading(false)}
              onMessage={handleMessage}
              onError={(event) => {
                console.error(
                  "CAPTCHA WEBVIEW ERROR:",
                  event.nativeEvent
                );

                setLoading(false);

                Alert.alert(
                  "Connection Error",
                  "Unable to connect to the CAPTCHA server. Make sure the backend CAPTCHA server is running."
                );
              }}
            />
          </View>

          {verifying && (
            <View style={styles.statusBox}>
              <ActivityIndicator
                size="small"
                color="#A6192E"
              />

              <Text style={styles.statusText}>
                Verifying CAPTCHA...
              </Text>
            </View>
          )}

          {verified && !verifying && (
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>✓</Text>

              <Text style={styles.successText}>
                CAPTCHA verified successfully.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            TUPC-OrderUp Security
          </Text>

          <Text style={styles.footerSubtext}>
            Your verification helps keep the platform secure.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F7F8",
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
  },

  header: {
    alignItems: "center",
    marginBottom: 24,
  },

  logoCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#A6192E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  logoText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#171717",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 20,
    color: "#737373",
    textAlign: "center",
    maxWidth: 330,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 3,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  shieldCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FBECEF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  shieldText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#A6192E",
  },

  cardHeaderText: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#171717",
  },

  cardSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: "#737373",
  },

  webViewContainer: {
    height: 180,
    overflow: "hidden",
    borderRadius: 14,
    backgroundColor: "#F7F7F8",
  },

  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#737373",
    fontWeight: "600",
  },

  statusBox: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#FFF8E8",
    flexDirection: "row",
    alignItems: "center",
  },

  statusText: {
    marginLeft: 9,
    color: "#8A6416",
    fontSize: 13,
    fontWeight: "700",
  },

  successBox: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#EEF8F0",
    flexDirection: "row",
    alignItems: "center",
  },

  successIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#218739",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "900",
  },

  successText: {
    marginLeft: 9,
    color: "#218739",
    fontSize: 13,
    fontWeight: "700",
  },

  footer: {
    alignItems: "center",
    marginTop: 24,
  },

  footerText: {
    color: "#A6192E",
    fontSize: 12,
    fontWeight: "800",
  },

  footerSubtext: {
    marginTop: 4,
    color: "#999999",
    fontSize: 11,
    textAlign: "center",
  },
});