import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

// =====================================================
// ASSETS
// =====================================================

const TUPC_LOGO = require("../../../assets/LOGO.png");

// =====================================================
// TUPC CARDINAL DESIGN SYSTEM (matches login screen)
// =====================================================

const COLORS = {
  cardinal: "#A6192E",
  cardinalDark: "#7D1021",

  gold: "#D8B56A",
  goldLight: "#E9D39B",

  white: "#FFFFFF",

  text: "#171717",
  textMuted: "#6F686A",

  background: "#F7F7F8",
  cardBorder: "#E7DFE1",
};

// =====================================================
// LAST UPDATED — update this whenever the content changes
// =====================================================

const LAST_UPDATED = "September 23, 2026";

// =====================================================
// PRIVACY POLICY SCREEN
// =====================================================

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>

      {/* =================================================
          HEADER
      ================================================= */}

      <View style={styles.header}>

        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </Pressable>

        <Text style={styles.headerTitle}>Privacy Policy</Text>

        <View style={styles.headerSpacer} />

      </View>

      {/* =================================================
          CONTENT
      ================================================= */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <Text style={styles.lastUpdated}>Last updated: {LAST_UPDATED}</Text>

        <Text style={styles.intro}>
          This Privacy Policy describes how TUPC-OrderUp (the "System"),
          operated for the Technological University of the Philippines –
          Cavite Campus ("TUPC," "University," "we," "us," or "our"),
          collects, uses, stores, and protects your personal information in
          accordance with the Data Privacy Act of 2012 (Republic Act No.
          10173) and its Implementing Rules and Regulations.
        </Text>

        <Section number="1" title="Information We Collect">
          <Paragraph>
            We collect information you provide directly, such as your name,
            TUPC student or employee number, email address, contact number,
            and password when you register an account. When you place or
            fulfill an order, we also collect order details, delivery or
            pickup preferences, and transaction records.
          </Paragraph>
          <Paragraph>
            We may also automatically collect limited technical information
            such as device type, app version, and general usage data (e.g.,
            crash logs) to help us maintain and improve the System.
          </Paragraph>
        </Section>

        <Section number="2" title="How We Use Your Information">
          <Paragraph>
            Your information is used to: create and manage your account;
            process and fulfill orders between buyers and sellers; verify
            your eligibility as a member of the TUPC community; communicate
            important updates, order status, or account notices; maintain
            the security and integrity of the System; and improve System
            features based on usage patterns.
          </Paragraph>
          <Paragraph>
            We do not use your personal information for purposes unrelated
            to the operation of TUPC-OrderUp without first obtaining your
            consent, except where required or permitted by law.
          </Paragraph>
        </Section>

        <Section number="3" title="Data Sharing & Disclosure">
          <Paragraph>
            We share the minimum necessary information between buyers and
            sellers to complete a transaction (e.g., your name and order
            details are shared with the seller fulfilling your order). We do
            not sell your personal information to third parties.
          </Paragraph>
          <Paragraph>
            We may disclose information when required by law, to comply with
            a valid legal process, to protect the rights and safety of
            TUPC-OrderUp users or the University, or in connection with an
            investigation of suspected fraudulent, abusive, or unlawful
            activity on the System.
          </Paragraph>
        </Section>

        <Section number="4" title="Data Storage & Security">
          <Paragraph>
            We implement reasonable organizational, physical, and technical
            security measures to protect your personal information against
            unauthorized access, alteration, disclosure, or destruction,
            consistent with the standards set by the National Privacy
            Commission (NPC). These measures include access controls,
            encrypted password storage, and restricted administrator access
            to personal data.
          </Paragraph>
          <Paragraph>
            While we take reasonable steps to protect your data, no method
            of electronic storage or transmission is completely secure, and
            we cannot guarantee absolute security.
          </Paragraph>
        </Section>

        <Section number="5" title="Data Retention">
          <Paragraph>
            We retain your personal information only for as long as
            necessary to fulfill the purposes described in this Policy, to
            comply with our legal obligations, resolve disputes, and enforce
            our agreements. Account information may be retained for the
            duration of your enrollment or employment at TUPC and for a
            reasonable period thereafter, unless earlier deletion is
            requested and legally permissible.
          </Paragraph>
        </Section>

        <Section number="6" title="Your Rights Under the Data Privacy Act">
          <Paragraph>
            As a data subject under RA 10173, you have the right to: be
            informed of how your personal data is processed; access your
            personal data; request correction of inaccurate or outdated
            data; object to the processing of your data in certain
            circumstances; request the erasure or blocking of your data
            where applicable; and file a complaint with the National Privacy
            Commission if you believe your rights have been violated.
          </Paragraph>
          <Paragraph>
            To exercise any of these rights, please contact us using the
            details in the "Contact Us" section below.
          </Paragraph>
        </Section>

        <Section number="7" title="Device & Usage Data">
          <Paragraph>
            As a mobile application, TUPC-OrderUp may access limited device
            information (such as device identifiers or notification tokens)
            solely to enable core functionality like order notifications.
            This information is not used for advertising or shared with
            third-party marketers.
          </Paragraph>
        </Section>

        <Section number="8" title="Children's Privacy">
          <Paragraph>
            TUPC-OrderUp is intended for use by TUPC Cavite Campus students,
            faculty, staff, and authorized sellers, and is not directed at
            children under 13. We do not knowingly collect personal
            information from children under 13 years of age.
          </Paragraph>
        </Section>

        <Section number="9" title="Changes to This Policy">
          <Paragraph>
            We may update this Privacy Policy from time to time to reflect
            changes in our practices or applicable law. We will indicate
            material changes by updating the "Last updated" date above, and,
            where appropriate, provide additional notice within the System.
          </Paragraph>
        </Section>

        <Section number="10" title="Contact Us">
          <Paragraph>
            For questions, concerns, or requests regarding this Privacy
            Policy or your personal data, please contact the TUPC-OrderUp
            Data Protection Officer:
          </Paragraph>
          <Text style={styles.contactLine}>tupc-orderup-privacy@tup.edu.ph</Text>
          <Paragraph>
            You may also file a complaint with the National Privacy
            Commission through www.privacy.gov.ph if you believe your data
            privacy rights have been violated.
          </Paragraph>
        </Section>

        <View style={styles.footer}>
          <Image
            source={TUPC_LOGO}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <Text style={styles.footerCopyright}>
            © 2026 Technological University of the Philippines
            {" "}– Cavite Campus
          </Text>
        </View>

        <View style={styles.bottomSpacer} />

      </ScrollView>

    </SafeAreaView>
  );
}

// =====================================================
// SECTION HELPERS
// =====================================================

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {number}. {title}
      </Text>
      {children}
    </View>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.cardinal,
  },

  backButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  headerSpacer: {
    width: 34,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },

  lastUpdated: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 12,
  },

  intro: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },

  section: {
    marginBottom: 18,
  },

  sectionTitle: {
    color: COLORS.cardinalDark,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },

  paragraph: {
    color: COLORS.text,
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 8,
  },

  contactLine: {
    color: COLORS.cardinal,
    fontSize: 13.5,
    fontWeight: "700",
    marginTop: 2,
    marginBottom: 8,
  },

  bottomSpacer: {
    height: 40,
  },

  footer: {
    alignItems: "center",
    marginTop: 24,
  },

  footerLogo: {
    width: 56,
    height: 56,
    opacity: 0.85,
    marginBottom: 8,
  },

  footerCopyright: {
    color: COLORS.textMuted,
    fontSize: 10.5,
    textAlign: "center",
    lineHeight: 15,
  },
});