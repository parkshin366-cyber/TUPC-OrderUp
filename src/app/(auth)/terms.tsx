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
// TERMS & CONDITIONS SCREEN
// =====================================================

export default function TermsScreen() {
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

        <Text style={styles.headerTitle}>Terms & Conditions</Text>

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
          These Terms & Conditions ("Terms") govern your access to and use of
          TUPC-OrderUp (the "System"), the campus ordering platform of the
          Technological University of the Philippines – Cavite Campus
          ("TUPC," "University," "we," "us," or "our"). By creating an
          account or using the System, you agree to be bound by these Terms.
          If you do not agree, please do not use the System.
        </Text>

        <Section number="1" title="Eligibility">
          <Paragraph>
            TUPC-OrderUp is intended for use by currently enrolled TUPC
            Cavite Campus students, faculty, staff, and authorized food or
            merchandise sellers operating within or in partnership with the
            University. By registering an account, you represent that you
            belong to one of these groups and that all information you
            provide is accurate, current, and complete.
          </Paragraph>
        </Section>

        <Section number="2" title="Account Registration & Security">
          <Paragraph>
            You are responsible for maintaining the confidentiality of your
            username and password and for all activity that occurs under
            your account. You agree to notify us immediately of any
            unauthorized use of your account or any other breach of
            security. TUPC-OrderUp is not liable for any loss or damage
            arising from your failure to safeguard your login credentials.
          </Paragraph>
          <Paragraph>
            We reserve the right to suspend or terminate accounts that
            provide false information, impersonate another person, or are
            used in violation of these Terms.
          </Paragraph>
        </Section>

        <Section number="3" title="Ordering & Payment">
          <Paragraph>
            Orders placed through the System are subject to availability and
            acceptance by the seller. Prices, item descriptions, and
            availability are set by individual sellers and may change
            without prior notice. You are responsible for reviewing your
            order and total amount before confirming a purchase.
          </Paragraph>
          <Paragraph>
            Accepted payment methods (such as cash on pickup, e-wallets, or
            other options made available in the System) will be indicated at
            checkout. TUPC-OrderUp facilitates the transaction between buyer
            and seller but is not a party to, and does not guarantee, the
            quality, safety, legality, or timely delivery of any item
            ordered.
          </Paragraph>
        </Section>

        <Section number="4" title="Seller Responsibilities">
          <Paragraph>
            Sellers using TUPC-OrderUp agree to provide accurate product
            listings, honor confirmed orders, comply with applicable food
            safety and business regulations, and treat all buyers fairly and
            professionally. TUPC-OrderUp reserves the right to remove
            listings or suspend seller accounts that violate these
            standards or University policy.
          </Paragraph>
        </Section>

        <Section number="5" title="Cancellations & Refunds">
          <Paragraph>
            Cancellation and refund requests are handled according to the
            policy set by each seller, where applicable, and subject to the
            nature of the goods ordered (e.g., perishable food items may not
            be eligible for cancellation once preparation has begun). Where
            no seller-specific policy exists, disputes may be raised through
            the in-app support channel or reported to the TUPC-OrderUp
            administrators for mediation.
          </Paragraph>
        </Section>

        <Section number="6" title="Prohibited Conduct">
          <Paragraph>
            You agree not to: (a) use the System for any unlawful purpose;
            (b) upload false, misleading, defamatory, or offensive content;
            (c) attempt to gain unauthorized access to the System, other
            accounts, or University networks; (d) interfere with or disrupt
            the System's operation; or (e) use the System to harass,
            threaten, or defraud another user.
          </Paragraph>
          <Paragraph>
            Violation of this section may result in suspension or
            termination of your account and may be reported to the
            appropriate University office or authorities where warranted.
          </Paragraph>
        </Section>

        <Section number="7" title="Intellectual Property">
          <Paragraph>
            The TUPC-OrderUp name, logo, interface design, and underlying
            software are the property of the Technological University of
            the Philippines – Cavite Campus and/or its developers and are
            protected by applicable intellectual property laws. You may not
            copy, modify, distribute, or create derivative works from the
            System without prior written permission.
          </Paragraph>
        </Section>

        <Section number="8" title="Limitation of Liability">
          <Paragraph>
            TUPC-OrderUp is provided on an "as is" and "as available" basis.
            To the fullest extent permitted by law, the University and the
            developers of TUPC-OrderUp shall not be liable for any indirect,
            incidental, or consequential damages arising from your use of
            the System, including but not limited to order errors, delays,
            food quality issues, or service interruptions caused by
            third-party sellers or technical failures.
          </Paragraph>
        </Section>

        <Section number="9" title="Termination">
          <Paragraph>
            We may suspend or terminate your access to the System at any
            time, with or without notice, for conduct that we believe
            violates these Terms or is otherwise harmful to other users, the
            System, or the University.
          </Paragraph>
        </Section>

        <Section number="10" title="Governing Law">
          <Paragraph>
            These Terms are governed by the laws of the Republic of the
            Philippines. Any disputes arising from the use of TUPC-OrderUp
            shall first be referred to the appropriate University office for
            resolution before pursuing any other remedy available under
            Philippine law.
          </Paragraph>
        </Section>

        <Section number="11" title="Changes to These Terms">
          <Paragraph>
            We may update these Terms from time to time to reflect changes
            in the System or applicable law. Continued use of TUPC-OrderUp
            after changes take effect constitutes your acceptance of the
            revised Terms. Material changes will be indicated by an updated
            "Last updated" date above.
          </Paragraph>
        </Section>

        <Section number="12" title="Contact Us">
          <Paragraph>
            If you have questions about these Terms, please contact the
            TUPC-OrderUp administration through your campus's designated
            support channel or email:
          </Paragraph>
          <Text style={styles.contactLine}>tupc-orderup-support@tup.edu.ph</Text>
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