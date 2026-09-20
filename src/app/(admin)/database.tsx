import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";

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

type Collection = {
  id: string;
  name: string;
  description: string;
  documents: number;
  size: string;
  icon: keyof typeof Ionicons.glyphMap;
  status: "Healthy" | "Monitoring";
};

type Activity = {
  id: string;
  action: string;
  collection: string;
  detail: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const COLLECTIONS: Collection[] = [
  {
    id: "users",
    name: "users",
    description: "Client, seller, and administrator accounts",
    documents: 1248,
    size: "2.8 MB",
    icon: "people-outline",
    status: "Healthy",
  },
  {
    id: "stores",
    name: "stores",
    description: "Campus stores and seller storefronts",
    documents: 86,
    size: "740 KB",
    icon: "storefront-outline",
    status: "Healthy",
  },
  {
    id: "products",
    name: "products",
    description: "Food, drinks, merchandise, and services",
    documents: 426,
    size: "1.6 MB",
    icon: "fast-food-outline",
    status: "Healthy",
  },
  {
    id: "orders",
    name: "orders",
    description: "Customer orders and transaction records",
    documents: 5832,
    size: "7.4 MB",
    icon: "receipt-outline",
    status: "Healthy",
  },
  {
    id: "payments",
    name: "payments",
    description: "Payment references and transaction status",
    documents: 5718,
    size: "4.1 MB",
    icon: "card-outline",
    status: "Healthy",
  },
  {
    id: "security_logs",
    name: "security_logs",
    description: "Authentication and administrative audit events",
    documents: 18246,
    size: "9.7 MB",
    icon: "shield-checkmark-outline",
    status: "Monitoring",
  },
];

const ACTIVITIES: Activity[] = [
  {
    id: "1",
    action: "Document inserted",
    collection: "orders",
    detail: "New order record created",
    time: "2 min ago",
    icon: "add-circle-outline",
  },
  {
    id: "2",
    action: "Document updated",
    collection: "users",
    detail: "Seller verification status updated",
    time: "8 min ago",
    icon: "create-outline",
  },
  {
    id: "3",
    action: "Document inserted",
    collection: "payments",
    detail: "Payment reference recorded",
    time: "14 min ago",
    icon: "card-outline",
  },
  {
    id: "4",
    action: "Security event",
    collection: "security_logs",
    detail: "Administrator login recorded",
    time: "31 min ago",
    icon: "shield-checkmark-outline",
  },
  {
    id: "5",
    action: "Document updated",
    collection: "products",
    detail: "Product inventory updated",
    time: "46 min ago",
    icon: "cube-outline",
  },
];

export default function AdminDatabaseScreen() {
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);

  const [modalVisible, setModalVisible] = useState(false);

  const totalDocuments = useMemo(
    () =>
      COLLECTIONS.reduce(
        (total, collection) => total + collection.documents,
        0
      ),
    []
  );

  const totalSize = "26.3 MB";

  const openCollection = (collection: Collection) => {
    setSelectedCollection(collection);
    setModalVisible(true);
  };

  const handleRefresh = () => {
    Alert.alert(
      "Database Refreshed",
      "Database metrics have been refreshed successfully."
    );
  };

  const handleBackup = () => {
    Alert.alert(
      "Database Backup",
      "A manual backup request will be connected to the backend later."
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>MASTER ADMIN</Text>

              <Text style={styles.title}>
                Database
              </Text>

              <Text style={styles.subtitle}>
                Monitor your TUPC-OrderUp data layer.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.refreshButton,
                pressed && styles.pressed,
              ]}
              onPress={handleRefresh}
            >
              <Ionicons
                name="refresh-outline"
                size={20}
                color={WHITE}
              />
            </Pressable>
          </View>

          {/* CONNECTION STATUS */}
          <View style={styles.connectionCard}>
            <View style={styles.connectionIcon}>
              <Ionicons
                name="server-outline"
                size={23}
                color={GREEN}
              />
            </View>

            <View style={styles.connectionCopy}>
              <View style={styles.connectionTitleRow}>
                <Text style={styles.connectionTitle}>
                  MongoDB
                </Text>

                <View style={styles.onlineBadge}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>
                    CONNECTED
                  </Text>
                </View>
              </View>

              <Text style={styles.connectionDetail}>
                TUPOrderUp · Primary Database
              </Text>

              <Text style={styles.connectionTime}>
                Last health check: Just now
              </Text>
            </View>
          </View>

          {/* DATABASE METRICS */}
          <Text style={styles.sectionTitle}>
            DATABASE OVERVIEW
          </Text>

          <View style={styles.metricGrid}>
            <MetricCard
              icon="documents-outline"
              label="Documents"
              value={totalDocuments.toLocaleString()}
              detail="Across collections"
            />

            <MetricCard
              icon="pie-chart-outline"
              label="Storage"
              value={totalSize}
              detail="Current usage"
            />

            <MetricCard
              icon="speedometer-outline"
              label="Response"
              value="42 ms"
              detail="Average query"
            />

            <MetricCard
              icon="pulse-outline"
              label="Uptime"
              value="99.99%"
              detail="Last 30 days"
            />
          </View>

          {/* STORAGE */}
          <View style={styles.storageCard}>
            <View style={styles.storageHeader}>
              <View>
                <Text style={styles.storageTitle}>
                  Storage Usage
                </Text>

                <Text style={styles.storageSubtitle}>
                  MongoDB database capacity
                </Text>
              </View>

              <Text style={styles.storagePercentage}>
                26%
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: "26%" },
                ]}
              />
            </View>

            <View style={styles.storageFooter}>
              <Text style={styles.storageUsed}>
                26.3 MB used
              </Text>

              <Text style={styles.storageLimit}>
                100 MB monitoring limit
              </Text>
            </View>
          </View>

          {/* COLLECTIONS */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                COLLECTIONS
              </Text>

              <Text style={styles.sectionSubtitle}>
                MongoDB collections and document counts
              </Text>
            </View>

            <View style={styles.collectionCount}>
              <Text style={styles.collectionCountText}>
                {COLLECTIONS.length}
              </Text>
            </View>
          </View>

          <View style={styles.collectionsCard}>
            {COLLECTIONS.map((collection, index) => (
              <React.Fragment key={collection.id}>
                <Pressable
                  style={({ pressed }) => [
                    styles.collectionRow,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => openCollection(collection)}
                >
                  <View style={styles.collectionIcon}>
                    <Ionicons
                      name={collection.icon}
                      size={20}
                      color={CARDINAL}
                    />
                  </View>

                  <View style={styles.collectionCopy}>
                    <View style={styles.collectionNameRow}>
                      <Text style={styles.collectionName}>
                        {collection.name}
                      </Text>

                      <View
                        style={[
                          styles.healthPill,
                          collection.status === "Monitoring" &&
                            styles.monitoringPill,
                        ]}
                      >
                        <View
                          style={[
                            styles.healthDot,
                            collection.status === "Monitoring" &&
                              styles.monitoringDot,
                          ]}
                        />

                        <Text
                          style={[
                            styles.healthText,
                            collection.status === "Monitoring" &&
                              styles.monitoringText,
                          ]}
                        >
                          {collection.status}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={styles.collectionDescription}
                      numberOfLines={1}
                    >
                      {collection.description}
                    </Text>

                    <View style={styles.collectionMeta}>
                      <Text style={styles.collectionDocuments}>
                        {collection.documents.toLocaleString()} documents
                      </Text>

                      <Text style={styles.collectionSize}>
                        {collection.size}
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#B3B3B3"
                  />
                </Pressable>

                {index < COLLECTIONS.length - 1 && (
                  <View style={styles.collectionDivider} />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* INDEXES */}
          <View style={styles.indexCard}>
            <View style={styles.indexIcon}>
              <Ionicons
                name="git-branch-outline"
                size={22}
                color={CARDINAL}
              />
            </View>

            <View style={styles.indexCopy}>
              <Text style={styles.indexTitle}>
                Database Indexes
              </Text>

              <Text style={styles.indexDescription}>
                12 active indexes are currently supporting
                application queries.
              </Text>

              <View style={styles.indexStatus}>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={GREEN}
                />

                <Text style={styles.indexStatusText}>
                  All indexes operational
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.viewButton}
              onPress={() =>
                Alert.alert(
                  "Database Indexes",
                  "Index management will be connected to MongoDB later."
                )
              }
            >
              <Text style={styles.viewButtonText}>
                View
              </Text>
            </Pressable>
          </View>

          {/* RECENT ACTIVITY */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                RECENT DATABASE ACTIVITY
              </Text>

              <Text style={styles.sectionSubtitle}>
                Latest data-layer events
              </Text>
            </View>

            <Ionicons
              name="time-outline"
              size={18}
              color={MUTED}
            />
          </View>

          <View style={styles.activityCard}>
            {ACTIVITIES.map((activity, index) => (
              <View key={activity.id}>
                <View style={styles.activityRow}>
                  <View style={styles.activityIcon}>
                    <Ionicons
                      name={activity.icon}
                      size={17}
                      color={CARDINAL}
                    />
                  </View>

                  <View style={styles.activityCopy}>
                    <Text style={styles.activityAction}>
                      {activity.action}
                    </Text>

                    <Text style={styles.activityDetail}>
                      {activity.detail}
                    </Text>

                    <View style={styles.activityMeta}>
                      <View style={styles.collectionTag}>
                        <Text style={styles.collectionTagText}>
                          {activity.collection}
                        </Text>
                      </View>

                      <Text style={styles.activityTime}>
                        {activity.time}
                      </Text>
                    </View>
                  </View>
                </View>

                {index < ACTIVITIES.length - 1 && (
                  <View style={styles.activityDivider} />
                )}
              </View>
            ))}
          </View>

          {/* BACKUP */}
          <Text style={styles.sectionTitle}>
            BACKUP & RECOVERY
          </Text>

          <View style={styles.backupCard}>
            <View style={styles.backupTop}>
              <View style={styles.backupIcon}>
                <Ionicons
                  name="cloud-done-outline"
                  size={23}
                  color={GREEN}
                />
              </View>

              <View style={styles.backupCopy}>
                <Text style={styles.backupTitle}>
                  Database Backup
                </Text>

                <Text style={styles.backupDescription}>
                  Automated backup protection is enabled.
                </Text>
              </View>

              <View style={styles.protectedBadge}>
                <Text style={styles.protectedText}>
                  PROTECTED
                </Text>
              </View>
            </View>

            <View style={styles.backupInfo}>
              <View>
                <Text style={styles.backupLabel}>
                  LAST BACKUP
                </Text>

                <Text style={styles.backupValue}>
                  Today, 06:00 AM
                </Text>
              </View>

              <View>
                <Text style={styles.backupLabel}>
                  BACKUP SIZE
                </Text>

                <Text style={styles.backupValue}>
                  24.8 MB
                </Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.backupButton,
                pressed && styles.pressed,
              ]}
              onPress={handleBackup}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={18}
                color={WHITE}
              />

              <Text style={styles.backupButtonText}>
                Create Manual Backup
              </Text>
            </Pressable>
          </View>

          {/* SECURITY NOTICE */}
          <View style={styles.noticeCard}>
            <View style={styles.noticeIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={CARDINAL}
              />
            </View>

            <View style={styles.noticeCopy}>
              <Text style={styles.noticeTitle}>
                Administrative Database Access
              </Text>

              <Text style={styles.noticeText}>
                Database management actions should remain
                restricted to authorized administrators. All
                destructive operations will require additional
                confirmation when connected to the backend.
              </Text>
            </View>
          </View>

          <Text style={styles.footer}>
            TUPC-OrderUp • Database Administration
          </Text>
        </ScrollView>
      </View>

      {/* COLLECTION DETAILS MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setModalVisible(false)}
          />

          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>
                  COLLECTION
                </Text>

                <Text style={styles.modalTitle}>
                  {selectedCollection?.name}
                </Text>
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons
                  name="close"
                  size={21}
                  color={TEXT}
                />
              </Pressable>
            </View>

            {selectedCollection && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalContent}
              >
                <View style={styles.modalCollectionHero}>
                  <View style={styles.modalCollectionIcon}>
                    <Ionicons
                      name={selectedCollection.icon}
                      size={29}
                      color={CARDINAL}
                    />
                  </View>

                  <Text style={styles.modalCollectionName}>
                    {selectedCollection.name}
                  </Text>

                  <Text style={styles.modalCollectionDescription}>
                    {selectedCollection.description}
                  </Text>
                </View>

                <View style={styles.detailGrid}>
                  <DatabaseDetail
                    label="Documents"
                    value={selectedCollection.documents.toLocaleString()}
                    icon="documents-outline"
                  />

                  <DatabaseDetail
                    label="Collection Size"
                    value={selectedCollection.size}
                    icon="pie-chart-outline"
                  />

                  <DatabaseDetail
                    label="Status"
                    value={selectedCollection.status}
                    icon="pulse-outline"
                  />

                  <DatabaseDetail
                    label="Indexes"
                    value="2 active"
                    icon="git-branch-outline"
                  />
                </View>

                <View style={styles.modalInfoCard}>
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color={CARDINAL}
                  />

                  <Text style={styles.modalInfoText}>
                    Collection inspection and document
                    management will be connected to the
                    MongoDB backend in the next development
                    phase.
                  </Text>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.modalAction,
                    pressed && styles.pressed,
                  ]}
                  onPress={() =>
                    Alert.alert(
                      "Collection Explorer",
                      "Document explorer will be connected to the backend later."
                    )
                  }
                >
                  <Ionicons
                    name="search-outline"
                    size={19}
                    color={WHITE}
                  />

                  <Text style={styles.modalActionText}>
                    Open Collection Explorer
                  </Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Ionicons
          name={icon}
          size={18}
          color={CARDINAL}
        />
      </View>

      <Text style={styles.metricLabel}>{label}</Text>

      <Text style={styles.metricValue}>{value}</Text>

      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}

function DatabaseDetail({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.databaseDetail}>
      <View style={styles.databaseDetailIcon}>
        <Ionicons
          name={icon}
          size={17}
          color={CARDINAL}
        />
      </View>

      <Text style={styles.databaseDetailLabel}>
        {label}
      </Text>

      <Text style={styles.databaseDetailValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },

  container: {
    flex: 1,
  },

  content: {
    paddingBottom: 35,
  },

  pressed: {
    opacity: 0.82,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerCopy: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: GOLD,
    letterSpacing: 1.4,
    marginBottom: 4,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: TEXT,
    letterSpacing: -0.7,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: MUTED,
  },

  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: CARDINAL,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },

  connectionCard: {
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 19,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
  },

  connectionIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: GREEN_BG,
    alignItems: "center",
    justifyContent: "center",
  },

  connectionCopy: {
    flex: 1,
    marginLeft: 12,
  },

  connectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  connectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: TEXT,
  },

  onlineBadge: {
    height: 21,
    paddingHorizontal: 7,
    borderRadius: 11,
    backgroundColor: GREEN_BG,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },

  onlineText: {
    fontSize: 8,
    fontWeight: "900",
    color: GREEN,
    letterSpacing: 0.3,
  },

  connectionDetail: {
    fontSize: 11,
    color: TEXT,
    fontWeight: "600",
    marginTop: 4,
  },

  connectionTime: {
    fontSize: 10,
    color: MUTED,
    marginTop: 2,
  },

  sectionTitle: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 9,
    fontSize: 10,
    fontWeight: "900",
    color: MUTED,
    letterSpacing: 1.1,
  },

  sectionHeader: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: MUTED,
  },

  metricGrid: {
    marginHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  metricCard: {
    width: "48%",
    flexGrow: 1,
    minHeight: 119,
    backgroundColor: WHITE,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },

  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#F8EDF0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },

  metricLabel: {
    fontSize: 10,
    color: MUTED,
    fontWeight: "700",
  },

  metricValue: {
    marginTop: 3,
    fontSize: 21,
    fontWeight: "900",
    color: TEXT,
  },

  metricDetail: {
    marginTop: 1,
    fontSize: 9,
    color: "#999999",
  },

  storageCard: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  storageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  storageTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: TEXT,
  },

  storageSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: MUTED,
  },

  storagePercentage: {
    fontSize: 20,
    fontWeight: "900",
    color: CARDINAL,
  },

  progressTrack: {
    height: 9,
    borderRadius: 5,
    backgroundColor: "#EFEFF0",
    overflow: "hidden",
    marginTop: 15,
  },

  progressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: CARDINAL,
  },

  storageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  storageUsed: {
    fontSize: 10,
    color: TEXT,
    fontWeight: "700",
  },

  storageLimit: {
    fontSize: 10,
    color: MUTED,
  },

  collectionCount: {
    width: 27,
    height: 27,
    borderRadius: 10,
    backgroundColor: "#F8EDF0",
    alignItems: "center",
    justifyContent: "center",
  },

  collectionCountText: {
    fontSize: 11,
    fontWeight: "900",
    color: CARDINAL,
  },

  collectionsCard: {
    marginHorizontal: 20,
    backgroundColor: WHITE,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },

  collectionRow: {
    minHeight: 87,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  collectionIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#F8EDF0",
    alignItems: "center",
    justifyContent: "center",
  },

  collectionCopy: {
    flex: 1,
    marginLeft: 11,
    marginRight: 7,
  },

  collectionNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  collectionName: {
    fontSize: 13,
    fontWeight: "800",
    color: TEXT,
  },

  healthPill: {
    height: 19,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: GREEN_BG,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  monitoringPill: {
    backgroundColor: ORANGE_BG,
  },

  healthDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: GREEN,
  },

  monitoringDot: {
    backgroundColor: ORANGE,
  },

  healthText: {
    fontSize: 7,
    fontWeight: "900",
    color: GREEN,
  },

  monitoringText: {
    color: ORANGE,
  },

  collectionDescription: {
    fontSize: 10,
    color: MUTED,
    marginTop: 3,
  },

  collectionMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    gap: 10,
  },

  collectionDocuments: {
    fontSize: 9,
    fontWeight: "700",
    color: TEXT,
  },

  collectionSize: {
    fontSize: 9,
    color: MUTED,
  },

  collectionDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginLeft: 67,
  },

  indexCard: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#FBF7EF",
    borderWidth: 1,
    borderColor: "#EFE1C5",
    flexDirection: "row",
    alignItems: "center",
  },

  indexIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
  },

  indexCopy: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },

  indexTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: TEXT,
  },

  indexDescription: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
    color: MUTED,
  },

  indexStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },

  indexStatusText: {
    fontSize: 9,
    fontWeight: "700",
    color: GREEN,
  },

  viewButton: {
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 10,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E4D4AF",
  },

  viewButtonText: {
    fontSize: 10,
    fontWeight: "800",
    color: CARDINAL,
  },

  activityCard: {
    marginHorizontal: 20,
    backgroundColor: WHITE,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
  },

  activityRow: {
    flexDirection: "row",
    paddingVertical: 13,
  },

  activityIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F8EDF0",
    alignItems: "center",
    justifyContent: "center",
  },

  activityCopy: {
    flex: 1,
    marginLeft: 10,
  },

  activityAction: {
    fontSize: 12,
    fontWeight: "800",
    color: TEXT,
  },

  activityDetail: {
    marginTop: 2,
    fontSize: 10,
    color: MUTED,
  },

  activityMeta: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  collectionTag: {
    paddingHorizontal: 6,
    height: 18,
    borderRadius: 7,
    backgroundColor: "#F2F2F3",
    justifyContent: "center",
  },

  collectionTagText: {
    fontSize: 8,
    fontWeight: "800",
    color: MUTED,
  },

  activityTime: {
    fontSize: 9,
    color: "#9A9A9A",
  },

  activityDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginLeft: 48,
  },

  backupCard: {
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 19,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  backupTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  backupIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: GREEN_BG,
    alignItems: "center",
    justifyContent: "center",
  },

  backupCopy: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
  },

  backupTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: TEXT,
  },

  backupDescription: {
    fontSize: 10,
    color: MUTED,
    marginTop: 3,
  },

  protectedBadge: {
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 11,
    backgroundColor: GREEN_BG,
    justifyContent: "center",
  },

  protectedText: {
    fontSize: 8,
    fontWeight: "900",
    color: GREEN,
    letterSpacing: 0.3,
  },

  backupInfo: {
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    flexDirection: "row",
    gap: 35,
  },

  backupLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: MUTED,
    letterSpacing: 0.5,
  },

  backupValue: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "700",
    color: TEXT,
  },

  backupButton: {
    marginTop: 14,
    height: 46,
    borderRadius: 14,
    backgroundColor: CARDINAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  backupButtonText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "800",
  },

  noticeCard: {
    marginHorizontal: 20,
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#F8EDF0",
    flexDirection: "row",
  },

  noticeIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
  },

  noticeCopy: {
    flex: 1,
    marginLeft: 10,
  },

  noticeTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: TEXT,
  },

  noticeText: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
    color: MUTED,
  },

  footer: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 9,
    color: "#A0A0A0",
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
    maxHeight: "86%",
    backgroundColor: WHITE,
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

  modalEyebrow: {
    fontSize: 8,
    fontWeight: "900",
    color: GOLD,
    letterSpacing: 1,
  },

  modalTitle: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: "900",
    color: TEXT,
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

  modalCollectionHero: {
    alignItems: "center",
    paddingBottom: 20,
  },

  modalCollectionIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: "#F8EDF0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  modalCollectionName: {
    fontSize: 20,
    fontWeight: "900",
    color: TEXT,
  },

  modalCollectionDescription: {
    marginTop: 4,
    maxWidth: 300,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    color: MUTED,
  },

  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  databaseDetail: {
    width: "48%",
    flexGrow: 1,
    minHeight: 100,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
  },

  databaseDetailIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: "#F8EDF0",
    alignItems: "center",
    justifyContent: "center",
  },

  databaseDetailLabel: {
    marginTop: 8,
    fontSize: 9,
    color: MUTED,
    fontWeight: "600",
  },

  databaseDetailValue: {
    marginTop: 2,
    fontSize: 14,
    color: TEXT,
    fontWeight: "900",
  },

  modalInfoCard: {
    marginTop: 13,
    padding: 13,
    borderRadius: 16,
    backgroundColor: "#FBF7EF",
    borderWidth: 1,
    borderColor: "#EFE1C5",
    flexDirection: "row",
  },

  modalInfoText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 10,
    lineHeight: 15,
    color: MUTED,
  },

  modalAction: {
    marginTop: 13,
    height: 48,
    borderRadius: 14,
    backgroundColor: CARDINAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  modalActionText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "800",
  },
});

