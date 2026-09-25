import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  cardinal: "#A6192E",
  cardinalDark: "#7D1021",
  gold: "#D8B56A",
  background: "#F7F7F8",
  white: "#FFFFFF",
  text: "#171717",
  muted: "#737373",
  lightMuted: "#9A9A9A",
  border: "#E5E5E5",
};

export default function RegisterScreen() {
  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
    >
      <View style={styles.container}>

        {/* BACK BUTTON */}

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={COLORS.text}
          />
        </Pressable>

        {/* HEADER */}

        <View style={styles.header}>

          {/* SMALL ADD PERSON ICON */}

          <View style={styles.iconCircle}>
            <Ionicons
              name="person-add-outline"
              size={22}
              color={COLORS.white}
            />
          </View>

          <Text style={styles.eyebrow}>
            TUPC-ORDERUP
          </Text>

          <Text style={styles.title}>
            Create Account
          </Text>

          <Text style={styles.subtitle}>
            Choose the type of TUPC-OrderUp account you want to create.
          </Text>

        </View>

        {/* ACCOUNT TYPE HEADER */}

        <View style={styles.sectionHeader}>

          <View style={styles.sectionAccent} />

          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>
              Choose your account
            </Text>

            <Text style={styles.sectionDescription}>
              Select how you want to use TUPC-OrderUp.
            </Text>
          </View>

        </View>

        {/* CLIENT */}

        <Pressable
          style={({ pressed }) => [
            styles.roleCard,
            pressed && styles.pressed,
          ]}
          onPress={() =>
            router.push("/(auth)/client-register")
          }
        >
          <View style={styles.roleIcon}>
            <Ionicons
              name="person-outline"
              size={27}
              color={COLORS.cardinal}
            />
          </View>

          <View style={styles.roleContent}>

            <Text style={styles.roleTitle}>
              Client Account
            </Text>

            <Text style={styles.roleDescription}>
              Order food, products, and services from participating campus
              sellers.
            </Text>

            <View style={styles.continueRow}>

              <Text style={styles.continueText}>
                Continue as Client
              </Text>

              <View style={styles.arrowCircle}>
                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color={COLORS.white}
                />
              </View>

            </View>

          </View>
        </Pressable>

        {/* SELLER */}

        <Pressable
          style={({ pressed }) => [
            styles.roleCard,
            pressed && styles.pressed,
          ]}
          onPress={() =>
            router.push("/(auth)/seller-register")
          }
        >
          <View style={styles.roleIcon}>
            <Ionicons
              name="storefront-outline"
              size={27}
              color={COLORS.cardinal}
            />
          </View>

          <View style={styles.roleContent}>

            <Text style={styles.roleTitle}>
              Seller Account
            </Text>

            <Text style={styles.roleDescription}>
              Manage your campus store, products, orders, inventory, and
              sales.
            </Text>

            <View style={styles.continueRow}>

              <Text style={styles.continueText}>
                Continue as Seller
              </Text>

              <View style={styles.arrowCircle}>
                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color={COLORS.white}
                />
              </View>

            </View>

          </View>
        </Pressable>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 12,
  },

  /* BACK BUTTON */

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.035,
    shadowRadius: 6,
    elevation: 1,
  },

  /* HEADER */

  header: {
    alignItems: "center",
    marginTop: 9,
    marginBottom: 17,
    paddingHorizontal: 8,
  },

  /* SMALL ADD PERSON ICON */

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.cardinal,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,

    shadowColor: COLORS.cardinal,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.14,
    shadowRadius: 7,
    elevation: 3,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    color: COLORS.gold,
    marginBottom: 4,
  },

  title: {
    fontSize: 27,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 5,
    maxWidth: 315,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.muted,
  },

  /* SECTION */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(166, 25, 46, 0.045)",
    borderWidth: 1,
    borderColor: "rgba(166, 25, 46, 0.09)",
  },

  sectionAccent: {
    width: 3,
    height: 27,
    borderRadius: 3,
    backgroundColor: COLORS.cardinal,
  },

  sectionHeaderText: {
    flex: 1,
    marginLeft: 10,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.cardinalDark,
  },

  sectionDescription: {
    marginTop: 1,
    fontSize: 10.5,
    lineHeight: 15,
    color: "#8D5961",
  },

  /* ROLE CARDS */

  roleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(166, 25, 46, 0.10)",
    flexDirection: "row",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  pressed: {
    opacity: 0.84,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  roleIcon: {
    width: 47,
    height: 47,
    borderRadius: 14,
    backgroundColor: "rgba(166, 25, 46, 0.075)",
    borderWidth: 1,
    borderColor: "rgba(166, 25, 46, 0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  roleContent: {
    flex: 1,
  },

  roleTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.15,
  },

  roleDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.muted,
  },

  continueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 9,
  },

  continueText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.cardinal,
    marginRight: 7,
  },

  arrowCircle: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: COLORS.cardinal,
    alignItems: "center",
    justifyContent: "center",
  },
});