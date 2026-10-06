import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
    Alert,
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { ApiUser, getAdminUsers, updateAdminUserStatus } from "../../services/api";

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
const GREEN_BG = "#EAF6EC";

const ORANGE = "#B26A00";
const ORANGE_BG = "#FFF4DF";

const RED = "#B42318";
const RED_BG = "#FDECEC";

type Role = "Client" | "Seller" | "Admin";
type Status = "Active" | "Pending" | "Suspended";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: Role;
  status: Status;
  affiliation: string;
  joined: string;
  store?: string;
  initials: string;
};

function mapApiUser(user: ApiUser): User {
  const id = user.id || String((user as ApiUser & { _id?: string })._id ?? "");
  const status: Status = user.status === "approved" ? "Active" : user.status === "pending" ? "Pending" : "Suspended";
  const role: Role = user.role === "admin" ? "Admin" : user.role === "seller" ? "Seller" : "Client";
  const firstName = user.firstName || "";
  const lastName = user.lastName || "";
  return {
    id,
    firstName,
    lastName,
    username: `@${user.username}`,
    email: user.email,
    role,
    status,
    affiliation: "TUP Account",
    joined: user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) : "—",
    initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U",
  };
}

const FILTERS = ["All", "Client", "Seller", "Admin"] as const;

type Filter = (typeof FILTERS)[number];

export default function AdminUsersScreen() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!token) {
      setUsers([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const records = await getAdminUsers(token);
      setUsers(records.map(mapApiUser));
    } catch (error) {
      Alert.alert("Unable to Load Users", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { loadUsers(); }, [loadUsers]));

  const stats = useMemo(() => {
    return {
      total: users.length,
      clients: users.filter((user) => user.role === "Client").length,
      sellers: users.filter((user) => user.role === "Seller").length,
      pending: users.filter((user) => user.status === "Pending").length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesFilter =
        filter === "All" ? true : user.role === filter;

      if (!query) {
        return matchesFilter;
      }

      const searchableText = [
        user.firstName,
        user.lastName,
        user.username,
        user.email,
        user.role,
        user.status,
        user.affiliation,
        user.store ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilter && searchableText.includes(query);
    });
  }, [users, search, filter]);

  const openDetails = (user: User) => {
    setSelectedUser(user);
    setDetailsVisible(true);
  };

  const updateStatus = async (user: User, status: "approved" | "rejected") => {
    if (!token) return;
    const updated = await updateAdminUserStatus(token, user.id, status);
    const mapped = mapApiUser(updated);
    setUsers((current) => current.map((item) => item.id === mapped.id ? mapped : item));
    setSelectedUser((current) => current?.id === mapped.id ? mapped : current);
  };

  const handleStatusAction = (user: User) => {
    const isSuspended = user.status === "Suspended";

    Alert.alert(
      isSuspended ? "Activate Account" : "Suspend Account",
      isSuspended
        ? `Activate ${user.firstName} ${user.lastName}'s account?`
        : `Suspend ${user.firstName} ${user.lastName}'s account?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: isSuspended ? "Activate" : "Suspend",
          style: isSuspended ? "default" : "destructive",
          onPress: () => void updateStatus(user, isSuspended ? "approved" : "rejected").catch((error) => Alert.alert("Update Failed", error instanceof Error ? error.message : "Please try again.")),
        },
      ]
    );
  };

  const handleApprove = (user: User) => {
    Alert.alert(
      "Approve Seller",
      `Approve ${user.firstName} ${user.lastName}'s seller account?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Approve",
          onPress: () => void updateStatus(user, "approved").then(() => Alert.alert("Seller Approved", `${user.firstName} ${user.lastName} is now an active seller.`)).catch((error) => Alert.alert("Approval Failed", error instanceof Error ? error.message : "Please try again.")),
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={CARDINAL} />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderUser = ({ item }: { item: User }) => (
    <Pressable
      style={({ pressed }) => [
        styles.userCard,
        pressed && styles.pressed,
      ]}
      onPress={() => openDetails(item)}
    >
      <View style={styles.userCardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.initials}</Text>
        </View>

        <View style={styles.userMain}>
          <View style={styles.nameLine}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.firstName} {item.lastName}
            </Text>

            {item.role === "Admin" && (
              <View style={styles.adminBadge}>
                <Ionicons
                  name="shield-checkmark"
                  size={11}
                  color={CARDINAL}
                />
                <Text style={styles.adminBadgeText}>ADMIN</Text>
              </View>
            )}
          </View>

          <Text style={styles.username}>{item.username}</Text>

          <Text style={styles.email} numberOfLines={1}>
            {item.email}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={19}
          color="#B1B1B1"
        />
      </View>

      <View style={styles.userDivider} />

      <View style={styles.userMetaRow}>
        <View style={styles.metaItem}>
          <Ionicons
            name={
              item.role === "Seller"
                ? "storefront-outline"
                : item.role === "Admin"
                  ? "shield-outline"
                  : "person-outline"
            }
            size={15}
            color={CARDINAL}
          />
          <Text style={styles.metaText}>{item.role}</Text>
        </View>

        <View style={styles.metaItem}>
          <Ionicons
            name="school-outline"
            size={15}
            color={MUTED}
          />
          <Text style={styles.metaText} numberOfLines={1}>
            {item.affiliation}
          </Text>
        </View>

        <StatusBadge status={item.status} />
      </View>

      <View style={styles.storeRow}>
        <Ionicons
          name="storefront-outline"
          size={14}
          color={item.store ? GOLD : "#A5A5A5"}
        />
        <Text
          style={[styles.storeText, !item.store && styles.storeTextMuted]}
          numberOfLines={1}
        >
          {item.store ?? "No linked store"}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>MASTER ADMIN</Text>
            <Text style={styles.title} numberOfLines={1}>
              User Management
            </Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              Manage TUPC-OrderUp accounts and access.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
            onPress={() => void loadUsers()}
          >
            <Ionicons name="refresh-outline" size={20} color={WHITE} />
          </Pressable>
        </View>

        {/* STAT CARDS */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Total Users"
            value={stats.total}
            icon="people-outline"
            accent={CARDINAL}
          />

          <StatCard
            label="Clients"
            value={stats.clients}
            icon="person-outline"
            accent="#52606D"
          />

          <StatCard
            label="Sellers"
            value={stats.sellers}
            icon="storefront-outline"
            accent={GOLD}
          />

          <StatCard
            label="Pending"
            value={stats.pending}
            icon="time-outline"
            accent={ORANGE}
          />
        </View>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={20}
            color={MUTED}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, username, email..."
            placeholderTextColor="#A4A4A4"
            style={styles.searchInput}
            autoCapitalize="none"
            returnKeyType="search"
          />

          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={19}
                color="#B0B0B0"
              />
            </Pressable>
          )}
        </View>

        {/* FILTERS */}
        <View style={styles.filterGrid}>
          {FILTERS.map((item) => {
            const active = filter === item;

            return (
              <Pressable
                key={item}
                onPress={() => setFilter(item)}
                style={({ pressed }) => [
                  styles.filterChip,
                  active && styles.filterChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.filterTextActive,
                  ]}
                >
                  {item}
                </Text>

                {item !== "All" && (
                  <View
                    style={[
                      styles.filterCount,
                      active && styles.filterCountActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterCountText,
                        active && styles.filterCountTextActive,
                      ]}
                    >
                      {users.filter((user) => user.role === item).length}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* RESULT HEADER */}
        <View style={styles.resultHeader}>
          <View>
            <Text style={styles.resultTitle}>
              All Accounts
            </Text>
            <Text style={styles.resultSubtitle}>
              {filteredUsers.length}{" "}
              {filteredUsers.length === 1 ? "account" : "accounts"} found
            </Text>
          </View>

          <View style={styles.secureIndicator}>
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color={GREEN}
            />
            <Text style={styles.secureText}>SECURE</Text>
          </View>
        </View>

        {/* USER LIST */}
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="people-outline"
                  size={34}
                  color="#A5A5A5"
                />
              </View>

              <Text style={styles.emptyTitle}>
                No users found
              </Text>

              <Text style={styles.emptyText}>
                Try changing your search or selected role.
              </Text>
            </View>
          }
        />
      </View>

      {/* USER DETAILS MODAL */}
      <Modal
        visible={detailsVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailsVisible(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setDetailsVisible(false)}
          />

          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Details</Text>

              <Pressable
                onPress={() => setDetailsVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={21}
                  color={TEXT}
                />
              </Pressable>
            </View>

            {selectedUser && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalContent}
              >
                {/* PROFILE */}
                <View style={styles.profileHero}>
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>
                      {selectedUser.initials}
                    </Text>
                  </View>

                  <Text style={styles.profileName}>
                    {selectedUser.firstName} {selectedUser.lastName}
                  </Text>

                  <Text style={styles.profileUsername}>
                    {selectedUser.username}
                  </Text>

                  <View style={styles.profileBadges}>
                    <RoleBadge role={selectedUser.role} />
                    <StatusBadge status={selectedUser.status} />
                  </View>
                </View>

                {/* INFORMATION */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>
                    ACCOUNT INFORMATION
                  </Text>

                  <DetailRow
                    icon="mail-outline"
                    label="Email Address"
                    value={selectedUser.email}
                  />

                  <DetailRow
                    icon="school-outline"
                    label="Affiliation"
                    value={selectedUser.affiliation}
                  />

                  <DetailRow
                    icon="calendar-outline"
                    label="Joined"
                    value={selectedUser.joined}
                  />

                  <DetailRow
                    icon="finger-print-outline"
                    label="User ID"
                    value={selectedUser.id}
                  />

                  {selectedUser.store && (
                    <DetailRow
                      icon="storefront-outline"
                      label="Store"
                      value={selectedUser.store}
                    />
                  )}
                </View>

                {/* SECURITY */}
                <View style={styles.securityCard}>
                  <View style={styles.securityIcon}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={21}
                      color={GREEN}
                    />
                  </View>

                  <View style={styles.securityCopy}>
                    <Text style={styles.securityTitle}>
                      Account Security
                    </Text>

                    <Text style={styles.securityText}>
                      Email verification and security checks
                      are managed by the platform.
                    </Text>
                  </View>

                  <View style={styles.verifiedPill}>
                    <Text style={styles.verifiedText}>
                      VERIFIED
                    </Text>
                  </View>
                </View>

                {/* ACTIONS */}
                {selectedUser.status === "Pending" &&
                  selectedUser.role === "Seller" && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.primaryAction,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => handleApprove(selectedUser)}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={20}
                        color={WHITE}
                      />

                      <Text style={styles.primaryActionText}>
                        Approve Seller Account
                      </Text>
                    </Pressable>
                  )}

                {selectedUser.role !== "Admin" && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryAction,
                      selectedUser.status === "Suspended" &&
                        styles.activateAction,
                      pressed && styles.pressed,
                    ]}
                    onPress={() =>
                      handleStatusAction(selectedUser)
                    }
                  >
                    <Ionicons
                      name={
                        selectedUser.status === "Suspended"
                          ? "lock-open-outline"
                          : "ban-outline"
                      }
                      size={19}
                      color={
                        selectedUser.status === "Suspended"
                          ? GREEN
                          : RED
                      }
                    />

                    <Text
                      style={[
                        styles.secondaryActionText,
                        selectedUser.status === "Suspended" &&
                          styles.activateActionText,
                      ]}
                    >
                      {selectedUser.status === "Suspended"
                        ? "Activate Account"
                        : "Suspend Account"}
                    </Text>
                  </Pressable>
                )}

                <Text style={styles.modalFooter}>
                  Administrative actions are logged for
                  security and auditing purposes.
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
}) {
  return (
    <View style={styles.statCard}>
      <View
        style={[
          styles.statIcon,
          { backgroundColor: `${accent}15` },
        ]}
      >
        <Ionicons name={icon} size={19} color={accent} />
      </View>

      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const config = {
    Active: {
      background: GREEN_BG,
      text: GREEN,
      icon: "checkmark-circle" as const,
    },
    Pending: {
      background: ORANGE_BG,
      text: ORANGE,
      icon: "time" as const,
    },
    Suspended: {
      background: RED_BG,
      text: RED,
      icon: "ban" as const,
    },
  }[status];

  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: config.background },
      ]}
    >
      <Ionicons
        name={config.icon}
        size={12}
        color={config.text}
      />

      <Text
        style={[
          styles.statusBadgeText,
          { color: config.text },
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const icon =
    role === "Seller"
      ? "storefront-outline"
      : role === "Admin"
        ? "shield-checkmark-outline"
        : "person-outline";

  return (
    <View style={styles.roleBadge}>
      <Ionicons
        name={icon}
        size={13}
        color={CARDINAL}
      />

      <Text style={styles.roleBadgeText}>{role}</Text>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={18} color={CARDINAL} />
      </View>

      <View style={styles.detailCopy}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F7F8",
  },

  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#737373",
    fontSize: 12,
  },

  container: {
    flex: 1,
  },

  pressed: {
    opacity: 0.82,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerCopy: {
    flex: 1,
    minWidth: 0,
    marginRight: 14,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: GOLD,
    letterSpacing: 1.4,
    marginBottom: 4,
  },

  title: {
    fontSize: 25,
    fontWeight: "900",
    color: "#171717",
    letterSpacing: -0.7,
    flexShrink: 1,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#737373",
  },

  headerButton: {
    flexShrink: 0,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#A6192E",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#A6192E",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },

  statCard: {
    width: "48.5%",
    height: 104,
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E7E7E8",
    padding: 14,
    justifyContent: "space-between",
    marginBottom: 10,
  },

  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  statValue: {
    fontSize: 23,
    fontWeight: "900",
    color: "#171717",
    marginTop: 7,
  },

  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#737373",
  },

  searchBox: {
    marginHorizontal: 20,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E7E8",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#171717",
    paddingVertical: 0,
  },

  filterGrid: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },

  filterChip: {
    flex: 1,
    minWidth: 0,
    height: 38,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7E7E8",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  filterChipActive: {
    backgroundColor: "#A6192E",
    borderColor: "#A6192E",
  },

  filterText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#737373",
  },

  filterTextActive: {
    color: "#FFFFFF",
  },

  filterCount: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },

  filterCountActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  filterCountText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#737373",
  },

  filterCountTextActive: {
    color: "#FFFFFF",
  },

  resultHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  resultTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#171717",
  },

  resultSubtitle: {
    fontSize: 11,
    color: "#737373",
    marginTop: 2,
  },

  secureIndicator: {
    height: 28,
    paddingHorizontal: 9,
    borderRadius: 14,
    backgroundColor: GREEN_BG,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  secureText: {
    fontSize: 9,
    fontWeight: "900",
    color: GREEN,
    letterSpacing: 0.6,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  userCard: {
    height: 174,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7E7E8",
    borderRadius: 18,
    padding: 15,
    marginBottom: 11,
  },

  userCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F5E7EA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EBCDD3",
  },

  avatarText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#A6192E",
  },

  userMain: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  nameLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  userName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#171717",
  },

  username: {
    fontSize: 11,
    color: "#A6192E",
    fontWeight: "600",
    marginTop: 2,
  },

  email: {
    fontSize: 11,
    color: "#737373",
    marginTop: 3,
  },

  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    height: 20,
    borderRadius: 7,
    backgroundColor: "#F8EDF0",
  },

  adminBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#A6192E",
    letterSpacing: 0.4,
  },

  userDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 12,
  },

  userMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 1,
  },

  metaText: {
    fontSize: 10,
    color: "#737373",
    fontWeight: "600",
  },

  statusBadge: {
    minHeight: 23,
    paddingHorizontal: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },

  statusBadgeText: {
    fontSize: 9,
    fontWeight: "800",
  },

  roleBadge: {
    minHeight: 25,
    paddingHorizontal: 9,
    borderRadius: 13,
    backgroundColor: "#F8EDF0",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  roleBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#A6192E",
  },

  storeRow: {
    marginTop: 10,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  storeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#171717",
    flex: 1,
  },

  storeTextMuted: {
    color: "#737373",
    fontWeight: "600",
  },

  emptyState: {
    alignItems: "center",
    paddingTop: 65,
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: "#EEEEEF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#171717",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 12,
    color: "#737373",
    textAlign: "center",
    lineHeight: 18,
  },

  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.48)",
  },

  modalSheet: {
    maxHeight: "91%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 9,
  },

  modalHandle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D6D6D6",
    marginBottom: 7,
  },

  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#171717",
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F2F2F3",
    alignItems: "center",
    justifyContent: "center",
  },

  modalContent: {
    padding: 20,
    paddingBottom: 35,
  },

  profileHero: {
    alignItems: "center",
    paddingBottom: 22,
  },

  profileAvatar: {
    width: 82,
    height: 82,
    borderRadius: 27,
    backgroundColor: "#A6192E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#F3D9DE",
  },

  profileAvatarText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  profileName: {
    fontSize: 21,
    fontWeight: "900",
    color: "#171717",
    textAlign: "center",
  },

  profileUsername: {
    marginTop: 3,
    fontSize: 12,
    color: "#737373",
  },

  profileBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 12,
  },

  detailSection: {
    borderWidth: 1,
    borderColor: "#E7E7E8",
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 4,
  },

  detailSectionTitle: {
    fontSize: 9,
    fontWeight: "900",
    color: "#737373",
    letterSpacing: 1,
    marginBottom: 5,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },

  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#F8EDF0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  detailCopy: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 10,
    color: "#737373",
    fontWeight: "600",
  },

  detailValue: {
    fontSize: 13,
    color: "#171717",
    fontWeight: "700",
    marginTop: 2,
  },

  securityCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 17,
    backgroundColor: GREEN_BG,
    flexDirection: "row",
    alignItems: "center",
  },

  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  securityCopy: {
    flex: 1,
    marginLeft: 10,
    marginRight: 7,
  },

  securityTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#171717",
  },

  securityText: {
    fontSize: 10,
    lineHeight: 15,
    color: "#737373",
    marginTop: 2,
  },

  verifiedPill: {
    paddingHorizontal: 7,
    height: 23,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  verifiedText: {
    fontSize: 8,
    fontWeight: "900",
    color: GREEN,
    letterSpacing: 0.4,
  },

  primaryAction: {
    height: 50,
    marginTop: 15,
    borderRadius: 15,
    backgroundColor: "#A6192E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  secondaryAction: {
    height: 50,
    marginTop: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#F0CACA",
    backgroundColor: "#FFF8F8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  secondaryActionText: {
    color: RED,
    fontSize: 13,
    fontWeight: "800",
  },

  activateAction: {
    borderColor: "#C9E4CC",
    backgroundColor: "#F7FCF8",
  },

  activateActionText: {
    color: GREEN,
  },

  modalFooter: {
    marginTop: 15,
    fontSize: 10,
    lineHeight: 15,
    color: "#999999",
    textAlign: "center",
    paddingHorizontal: 15,
  },
});

