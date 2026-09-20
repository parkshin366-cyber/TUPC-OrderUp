import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CARDINAL = "#A6192E";
const CARDINAL_DARK = "#7D1021";
const CARDINAL_DEEP = "#570B17";
const GOLD = "#D8B56A";

const TEXT = "#171717";
const MUTED = "#737373";
const BORDER = "#E7E7E8";
const BG = "#F7F7F8";
const WHITE = "#FFFFFF";

const GREEN = "#2E7D32";
const ORANGE = "#B26A00";
const RED = "#B42318";

type IconName = keyof typeof Ionicons.glyphMap;

export default function AdminSettings() {
  const [platformNotifications, setPlatformNotifications] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [newUserApproval, setNewUserApproval] = useState(true);
  const [sellerApproval, setSellerApproval] = useState(true);
  const [otpRequired, setOtpRequired] = useState(true);
  const [biometricRequired, setBiometricRequired] = useState(true);
  const [cashPayment, setCashPayment] = useState(true);
  const [gcashPayment, setGcashPayment] = useState(true);

  const [campusName, setCampusName] = useState("Technological University of the Philippines");
  const [campusCode, setCampusCode] = useState("TUPC");
  const [supportEmail, setSupportEmail] = useState("support@tupc-orderup.local");

  const [editModal, setEditModal] = useState<
    "platform" | "support" | "password" | null
  >(null);

  const [tempCampusName, setTempCampusName] = useState(campusName);
  const [tempCampusCode, setTempCampusCode] = useState(campusCode);
  const [tempSupportEmail, setTempSupportEmail] = useState(supportEmail);

  const savePlatformSettings = () => {
    setCampusName(tempCampusName.trim() || campusName);
    setCampusCode(tempCampusCode.trim() || campusCode);
    setEditModal(null);

    Alert.alert(
      "Settings Saved",
      "Platform information has been updated successfully."
    );
  };

  const saveSupportSettings = () => {
    setSupportEmail(tempSupportEmail.trim() || supportEmail);
    setEditModal(null);

    Alert.alert(
      "Support Settings Saved",
      "Support contact information has been updated."
    );
  };

  const handleMaintenanceToggle = (value: boolean) => {
    if (value) {
      Alert.alert(
        "Enable Maintenance Mode?",
        "Clients and sellers may temporarily lose access to platform features.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Enable",
            style: "destructive",
            onPress: () => setMaintenanceMode(true),
          },
        ]
      );
      return;
    }

    setMaintenanceMode(false);
  };

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of the Master Admin account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => router.replace("/"),
        },
      ]
    );
  };

  const handleDangerAction = (
    title: string,
    message: string,
    action: () => void
  ) => {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Continue",
        style: "destructive",
        onPress: action,
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>MASTER ADMIN</Text>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>
              Manage platform configuration and controls.
            </Text>
          </View>

          <View style={styles.headerBadge}>
            <Ionicons name="settings-outline" size={20} color={CARDINAL} />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* SYSTEM STATUS */}
          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <Ionicons name="shield-checkmark" size={24} color={GREEN} />
            </View>

            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Platform Operational</Text>
              <Text style={styles.statusText}>
                Core services are currently running normally.
              </Text>
            </View>

            <View style={styles.onlineDot} />
          </View>

          {/* PLATFORM */}
          <SectionTitle
            icon="business-outline"
            title="Platform"
            subtitle="General platform information"
          />

          <View style={styles.card}>
            <SettingRow
              icon="school-outline"
              title="Campus Information"
              subtitle={`${campusCode} • ${campusName}`}
              type="action"
              onPress={() => {
                setTempCampusName(campusName);
                setTempCampusCode(campusCode);
                setEditModal("platform");
              }}
            />

            <Divider />

            <SettingRow
              icon="globe-outline"
              title="Platform Status"
              subtitle="TUPC-OrderUp is online"
              type="status"
              statusText="Online"
              statusColor={GREEN}
            />

            <Divider />

            <SettingRow
              icon="people-outline"
              title="New User Approval"
              subtitle="Require admin review for new accounts"
              type="switch"
              value={newUserApproval}
              onValueChange={setNewUserApproval}
            />

            <Divider />

            <SettingRow
              icon="storefront-outline"
              title="Seller Approval"
              subtitle="Require approval before sellers go live"
              type="switch"
              value={sellerApproval}
              onValueChange={setSellerApproval}
            />
          </View>

          {/* ORDERING */}
          <SectionTitle
            icon="bag-handle-outline"
            title="Ordering"
            subtitle="Control ordering behavior"
          />

          <View style={styles.card}>
            <SettingRow
              icon="cash-outline"
              title="Cash Payment"
              subtitle="Allow cash-on-pickup payments"
              type="switch"
              value={cashPayment}
              onValueChange={setCashPayment}
            />

            <Divider />

            <SettingRow
              icon="phone-portrait-outline"
              title="GCash Payment"
              subtitle="Allow GCash payments"
              type="switch"
              value={gcashPayment}
              onValueChange={setGcashPayment}
            />

            <Divider />

            <SettingRow
              icon="notifications-outline"
              title="Order Notifications"
              subtitle="Notify admins about important order events"
              type="switch"
              value={orderAlerts}
              onValueChange={setOrderAlerts}
            />

            <Divider />

            <SettingRow
              icon="time-outline"
              title="Order Processing"
              subtitle="Standard platform order processing"
              type="action"
              onPress={() =>
                Alert.alert(
                  "Order Processing",
                  "Advanced order processing rules will be configurable here once the backend is connected."
                )
              }
            />
          </View>

          {/* SECURITY */}
          <SectionTitle
            icon="shield-checkmark-outline"
            title="Security"
            subtitle="Authentication and account protection"
          />

          <View style={styles.card}>
            <SettingRow
              icon="key-outline"
              title="OTP Verification"
              subtitle="Require OTP verification for authentication"
              type="switch"
              value={otpRequired}
              onValueChange={setOtpRequired}
            />

            <Divider />

            <SettingRow
              icon="finger-print-outline"
              title="Biometric Authentication"
              subtitle="Allow Face ID or fingerprint verification"
              type="switch"
              value={biometricRequired}
              onValueChange={setBiometricRequired}
            />

            <Divider />

            <SettingRow
              icon="warning-outline"
              title="Security Alerts"
              subtitle="Receive alerts for important security events"
              type="switch"
              value={securityAlerts}
              onValueChange={setSecurityAlerts}
            />

            <Divider />

            <SettingRow
              icon="lock-closed-outline"
              title="Change Admin Password"
              subtitle="Update the Master Admin password"
              type="action"
              onPress={() => setEditModal("password")}
            />

            <Divider />

            <SettingRow
              icon="phone-portrait-outline"
              title="Trusted Devices"
              subtitle="Manage devices authorized for admin access"
              type="action"
              onPress={() =>
                Alert.alert(
                  "Trusted Devices",
                  "Trusted device management will be connected to the authentication backend later."
                )
              }
            />
          </View>

          {/* NOTIFICATIONS */}
          <SectionTitle
            icon="notifications-outline"
            title="Notifications"
            subtitle="Choose which admin alerts to receive"
          />

          <View style={styles.card}>
            <SettingRow
              icon="notifications-circle-outline"
              title="Platform Notifications"
              subtitle="General platform announcements"
              type="switch"
              value={platformNotifications}
              onValueChange={setPlatformNotifications}
            />

            <Divider />

            <SettingRow
              icon="shield-outline"
              title="Security Notifications"
              subtitle="Security and authentication events"
              type="switch"
              value={securityAlerts}
              onValueChange={setSecurityAlerts}
            />

            <Divider />

            <SettingRow
              icon="receipt-outline"
              title="Order Notifications"
              subtitle="Important ordering activity"
              type="switch"
              value={orderAlerts}
              onValueChange={setOrderAlerts}
            />
          </View>

          {/* SUPPORT */}
          <SectionTitle
            icon="help-circle-outline"
            title="Support"
            subtitle="Platform support information"
          />

          <View style={styles.card}>
            <SettingRow
              icon="mail-outline"
              title="Support Contact"
              subtitle={supportEmail}
              type="action"
              onPress={() => {
                setTempSupportEmail(supportEmail);
                setEditModal("support");
              }}
            />

            <Divider />

            <SettingRow
              icon="document-text-outline"
              title="System Documentation"
              subtitle="View platform documentation"
              type="action"
              onPress={() =>
                Alert.alert(
                  "System Documentation",
                  "Documentation section will be connected to the project's admin documentation later."
                )
              }
            />

            <Divider />

            <SettingRow
              icon="chatbubble-ellipses-outline"
              title="Contact Developer"
              subtitle="Report technical issues"
              type="action"
              onPress={() =>
                Alert.alert(
                  "Developer Support",
                  "Developer support contact will be configured later."
                )
              }
            />
          </View>

          {/* MAINTENANCE */}
          <SectionTitle
            icon="construct-outline"
            title="System Controls"
            subtitle="Administrative platform controls"
          />

          <View style={styles.card}>
            <View
              style={[
                styles.maintenanceBanner,
                maintenanceMode && styles.maintenanceBannerActive,
              ]}
            >
              <View
                style={[
                  styles.maintenanceIcon,
                  maintenanceMode && styles.maintenanceIconActive,
                ]}
              >
                <Ionicons
                  name="build-outline"
                  size={21}
                  color={maintenanceMode ? ORANGE : CARDINAL}
                />
              </View>

              <View style={styles.maintenanceContent}>
                <Text style={styles.maintenanceTitle}>
                  {maintenanceMode
                    ? "Maintenance Mode Active"
                    : "Maintenance Mode"}
                </Text>

                <Text style={styles.maintenanceText}>
                  {maintenanceMode
                    ? "Platform access is temporarily restricted."
                    : "Temporarily restrict platform access for maintenance."}
                </Text>
              </View>

              <Switch
                value={maintenanceMode}
                onValueChange={handleMaintenanceToggle}
                trackColor={{
                  false: "#D6D6D8",
                  true: CARDINAL,
                }}
                thumbColor={WHITE}
              />
            </View>

            <Divider />

            <SettingRow
              icon="refresh-outline"
              title="Refresh Platform Configuration"
              subtitle="Reload local configuration values"
              type="action"
              onPress={() =>
                Alert.alert(
                  "Configuration Refreshed",
                  "Platform configuration has been refreshed."
                )
              }
            />

            <Divider />

            <SettingRow
              icon="cloud-upload-outline"
              title="Backup Configuration"
              subtitle="Create a platform configuration backup"
              type="action"
              onPress={() =>
                Alert.alert(
                  "Backup",
                  "Configuration backup will be connected to the backend later."
                )
              }
            />
          </View>

          {/* DANGER ZONE */}
          <SectionTitle
            icon="alert-circle-outline"
            title="Danger Zone"
            subtitle="Actions that require extra confirmation"
          />

          <View style={styles.dangerCard}>
            <DangerRow
              icon="trash-outline"
              title="Clear Temporary Data"
              subtitle="Remove temporary local platform data"
              onPress={() =>
                handleDangerAction(
                  "Clear Temporary Data?",
                  "This will remove temporary local settings. This action cannot be undone.",
                  () =>
                    Alert.alert(
                      "Completed",
                      "Temporary data has been cleared."
                    )
                )
              }
            />

            <View style={styles.dangerDivider} />

            <DangerRow
              icon="power-outline"
              title="Deactivate Platform"
              subtitle="Temporarily disable the platform"
              onPress={() =>
                handleDangerAction(
                  "Deactivate Platform?",
                  "Platform access may become unavailable for clients and sellers.",
                  () =>
                    Alert.alert(
                      "Action Pending",
                      "Platform deactivation will require backend authorization."
                    )
                )
              }
            />
          </View>

          {/* ADMIN ACCOUNT */}
          <SectionTitle
            icon="person-circle-outline"
            title="Admin Account"
            subtitle="Current administrator session"
          />

          <View style={styles.accountCard}>
            <View style={styles.avatar}>
              <Ionicons name="shield-checkmark" size={27} color={WHITE} />
            </View>

            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>Master Administrator</Text>
              <Text style={styles.accountRole}>MASTER ADMIN</Text>
              <Text style={styles.accountMeta}>
                Full platform administration access
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
            ]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={RED} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>

          {/* FOOTER */}
          <View style={styles.footer}>
            <View style={styles.footerLogo}>
              <Text style={styles.footerLogoText}>TUPC</Text>
            </View>

            <Text style={styles.footerTitle}>TUPC-OrderUp</Text>
            <Text style={styles.footerText}>
              Master Admin Control Center
            </Text>
            <Text style={styles.version}>Version 1.0.0 • Administration</Text>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>

        {/* PLATFORM MODAL */}
        <Modal
          visible={editModal === "platform"}
          transparent
          animationType="fade"
          onRequestClose={() => setEditModal(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalEyebrow}>PLATFORM</Text>
                  <Text style={styles.modalTitle}>Campus Information</Text>
                </View>

                <Pressable
                  style={styles.closeButton}
                  onPress={() => setEditModal(null)}
                >
                  <Ionicons name="close" size={21} color={MUTED} />
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Campus Code</Text>
              <TextInput
                value={tempCampusCode}
                onChangeText={setTempCampusCode}
                placeholder="TUPC"
                placeholderTextColor="#A0A0A0"
                style={styles.input}
                autoCapitalize="characters"
              />

              <Text style={styles.inputLabel}>Campus Name</Text>
              <TextInput
                value={tempCampusName}
                onChangeText={setTempCampusName}
                placeholder="Campus name"
                placeholderTextColor="#A0A0A0"
                style={styles.input}
              />

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.pressed,
                ]}
                onPress={savePlatformSettings}
              >
                <Text style={styles.primaryButtonText}>Save Changes</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* SUPPORT MODAL */}
        <Modal
          visible={editModal === "support"}
          transparent
          animationType="fade"
          onRequestClose={() => setEditModal(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalEyebrow}>SUPPORT</Text>
                  <Text style={styles.modalTitle}>Support Contact</Text>
                </View>

                <Pressable
                  style={styles.closeButton}
                  onPress={() => setEditModal(null)}
                >
                  <Ionicons name="close" size={21} color={MUTED} />
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Support Email</Text>
              <TextInput
                value={tempSupportEmail}
                onChangeText={setTempSupportEmail}
                placeholder="support@example.com"
                placeholderTextColor="#A0A0A0"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.pressed,
                ]}
                onPress={saveSupportSettings}
              >
                <Text style={styles.primaryButtonText}>Save Changes</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* PASSWORD MODAL */}
        <Modal
          visible={editModal === "password"}
          transparent
          animationType="fade"
          onRequestClose={() => setEditModal(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalEyebrow}>SECURITY</Text>
                  <Text style={styles.modalTitle}>Change Password</Text>
                </View>

                <Pressable
                  style={styles.closeButton}
                  onPress={() => setEditModal(null)}
                >
                  <Ionicons name="close" size={21} color={MUTED} />
                </Pressable>
              </View>

              <Text style={styles.modalDescription}>
                Password changes will be connected to the authentication
                backend later.
              </Text>

              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                secureTextEntry
                placeholder="Enter current password"
                placeholderTextColor="#A0A0A0"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                secureTextEntry
                placeholder="Enter new password"
                placeholderTextColor="#A0A0A0"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                secureTextEntry
                placeholder="Confirm new password"
                placeholderTextColor="#A0A0A0"
                style={styles.input}
              />

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => {
                  setEditModal(null);
                  Alert.alert(
                    "Password Update",
                    "Password update will be connected to the backend authentication service."
                  );
                }}
              >
                <Text style={styles.primaryButtonText}>Update Password</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={19} color={CARDINAL} />
      </View>

      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function SettingRow({
  icon,
  title,
  subtitle,
  type,
  value,
  onValueChange,
  onPress,
  statusText,
  statusColor,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  type: "switch" | "action" | "status";
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
  statusText?: string;
  statusColor?: string;
}) {
  const content = (
    <>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color={CARDINAL} />
      </View>

      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>

      {type === "switch" && (
        <Switch
          value={Boolean(value)}
          onValueChange={onValueChange}
          trackColor={{
            false: "#D6D6D8",
            true: CARDINAL,
          }}
          thumbColor={WHITE}
        />
      )}

      {type === "action" && (
        <Ionicons name="chevron-forward" size={19} color="#A0A0A0" />
      )}

      {type === "status" && (
        <View style={styles.statusPill}>
          <View
            style={[
              styles.statusPillDot,
              { backgroundColor: statusColor || GREEN },
            ]}
          />
          <Text
            style={[
              styles.statusPillText,
              { color: statusColor || GREEN },
            ]}
          >
            {statusText}
          </Text>
        </View>
      )}
    </>
  );

  if (type === "switch") {
    return <View style={styles.settingRow}>{content}</View>;
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingRow,
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}
    >
      {content}
    </Pressable>
  );
}

function DangerRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.dangerRow,
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.dangerIcon}>
        <Ionicons name={icon} size={20} color={RED} />
      </View>

      <View style={styles.dangerContent}>
        <Text style={styles.dangerTitle}>{title}</Text>
        <Text style={styles.dangerSubtitle}>{subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={19} color="#C5C5C5" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },

  container: {
    flex: 1,
    backgroundColor: BG,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: CARDINAL,
    marginBottom: 4,
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: TEXT,
    letterSpacing: -0.7,
  },

  subtitle: {
    marginTop: 3,
    fontSize: 12,
    color: MUTED,
    fontWeight: "500",
  },

  headerBadge: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#F9E9EC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1CCD2",
  },

  scrollContent: {
    padding: 16,
  },

  statusCard: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: "#DDEBDD",
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  statusIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "#EAF5EA",
    alignItems: "center",
    justifyContent: "center",
  },

  statusContent: {
    flex: 1,
    marginLeft: 12,
  },

  statusTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: TEXT,
  },

  statusText: {
    marginTop: 3,
    fontSize: 11,
    color: MUTED,
    lineHeight: 16,
  },

  onlineDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: GREEN,
    marginLeft: 8,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
    marginTop: 4,
  },

  sectionIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: "#F9E9EC",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeaderText: {
    marginLeft: 10,
    flex: 1,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: TEXT,
  },

  sectionSubtitle: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
  },

  card: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 22,
    overflow: "hidden",
  },

  settingRow: {
    minHeight: 72,
    paddingHorizontal: 15,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  rowPressed: {
    backgroundColor: "#FAFAFA",
  },

  settingIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: "#F9E9EC",
    alignItems: "center",
    justifyContent: "center",
  },

  settingContent: {
    flex: 1,
    marginLeft: 11,
    marginRight: 10,
  },

  settingTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: TEXT,
  },

  settingSubtitle: {
    fontSize: 10.5,
    color: MUTED,
    lineHeight: 15,
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: "#F0F0F1",
    marginLeft: 65,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#EEF7EE",
  },

  statusPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  statusPillText: {
    fontSize: 10,
    fontWeight: "800",
  },

  maintenanceBanner: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFDF8",
  },

  maintenanceBannerActive: {
    backgroundColor: "#FFF7E8",
  },

  maintenanceIcon: {
    width: 41,
    height: 41,
    borderRadius: 12,
    backgroundColor: "#F9E9EC",
    alignItems: "center",
    justifyContent: "center",
  },

  maintenanceIconActive: {
    backgroundColor: "#FFF0D1",
  },

  maintenanceContent: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  maintenanceTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: TEXT,
  },

  maintenanceText: {
    fontSize: 10.5,
    color: MUTED,
    lineHeight: 15,
    marginTop: 3,
  },

  dangerCard: {
    backgroundColor: "#FFF9F8",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F2D5D1",
    marginBottom: 22,
    overflow: "hidden",
  },

  dangerRow: {
    minHeight: 76,
    paddingHorizontal: 15,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  dangerIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: "#FCEDEA",
    alignItems: "center",
    justifyContent: "center",
  },

  dangerContent: {
    flex: 1,
    marginLeft: 11,
    marginRight: 10,
  },

  dangerTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: RED,
  },

  dangerSubtitle: {
    fontSize: 10.5,
    color: MUTED,
    lineHeight: 15,
    marginTop: 3,
  },

  dangerDivider: {
    height: 1,
    backgroundColor: "#F2D5D1",
    marginLeft: 65,
  },

  accountCard: {
    backgroundColor: CARDINAL_DEEP,
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(216,181,106,0.45)",
  },

  accountInfo: {
    flex: 1,
    marginLeft: 13,
  },

  accountName: {
    color: WHITE,
    fontSize: 15,
    fontWeight: "900",
  },

  accountRole: {
    color: GOLD,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginTop: 4,
  },

  accountMeta: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    marginTop: 5,
  },

  logoutButton: {
    height: 52,
    borderRadius: 15,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: "#F0D2CF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
  },

  logoutText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "800",
    color: RED,
  },

  footer: {
    alignItems: "center",
    paddingVertical: 10,
  },

  footerLogo: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  footerLogoText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  footerTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: TEXT,
  },

  footerText: {
    fontSize: 10,
    color: MUTED,
    marginTop: 3,
  },

  version: {
    fontSize: 9,
    color: "#A0A0A0",
    marginTop: 7,
  },

  modalBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.48)",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    backgroundColor: WHITE,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },

  modalEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    color: CARDINAL,
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: TEXT,
  },

  modalDescription: {
    fontSize: 11,
    color: MUTED,
    lineHeight: 17,
    marginBottom: 15,
  },

  closeButton: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
  },

  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 7,
  },

  input: {
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 13,
    fontSize: 13,
    color: TEXT,
    marginBottom: 14,
  },

  primaryButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  primaryButtonText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: "900",
  },

  pressed: {
    opacity: 0.8,
  },
});

