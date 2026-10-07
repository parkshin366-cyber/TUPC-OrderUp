import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { getMyOrders, type Order } from "../services/api";
import { LIGHT_COLORS, type AppColors, useAppTheme } from "../context/ThemeContext";
import { createThemedStyleSheet } from "../utils/themeStyles";

const CARDINAL = "#A6192E";
const TEXT = "#171717";
const MUTED = "#737373";
const SIZE = 58;
const OPEN_WIDTH = 300;
const OPEN_HEIGHT = 210;
const GAP = 12;
const BOTTOM_CLEARANCE = 82;

function storeName(order: Order) {
  return typeof order.store === "object" ? order.store.name : "Your order";
}

export default function ClientEtaBubble() {
  const { colors } = useAppTheme();
  styles = createStyles(colors);
  const { token } = useAuth();
  const { width, height } = useWindowDimensions();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expanded, setExpandedState] = useState(false);
  const [now, setNow] = useState(Date.now());
  const expandedRef = useRef(false);
  const sideRef = useRef<"left" | "right">("right");
  const lastEta = useRef<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sizeAnimation = useRef(new Animated.Value(0)).current;
  const positionValue = useRef({
    x: Math.max(GAP, width - SIZE - GAP),
    y: Math.max(GAP, height - SIZE - BOTTOM_CLEARANCE),
  });
  const position = useRef(new Animated.ValueXY(positionValue.current)).current;

  const clearIdleTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = null;
  }, []);

  const moveTo = useCallback((x: number, y: number) => {
    positionValue.current = { x, y };
    Animated.spring(position, {
      toValue: { x, y }, useNativeDriver: false, friction: 8, tension: 75,
    }).start();
  }, [position]);

  const edgeX = useCallback((side: "left" | "right", open: boolean) => {
    const bubbleWidth = open ? OPEN_WIDTH : SIZE;
    return side === "left" ? GAP : Math.max(GAP, width - bubbleWidth - GAP);
  }, [width]);

  const schedulePeek = useCallback(() => {
    clearIdleTimer();
    if (expandedRef.current) return;
    idleTimer.current = setTimeout(() => {
      const y = positionValue.current.y;
      moveTo(sideRef.current === "left" ? -14 : width - SIZE + 14, y);
    }, 4_000);
  }, [clearIdleTimer, moveTo, position.y, width]);

  const wake = useCallback((open: boolean) => {
    clearIdleTimer();
    const maxY = Math.max(GAP, height - (open ? OPEN_HEIGHT : SIZE) - BOTTOM_CLEARANCE);
    const y = Math.min(maxY, Math.max(GAP, positionValue.current.y));
    moveTo(edgeX(sideRef.current, open), y);
  }, [clearIdleTimer, edgeX, height, moveTo, position.y]);

  const setExpanded = useCallback((open: boolean) => {
    expandedRef.current = open;
    setExpandedState(open);
    wake(open);
    if (!open) schedulePeek();
  }, [schedulePeek, wake]);

  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,
    onPanResponderGrant: () => {
      clearIdleTimer();
      if (expandedRef.current) {
        expandedRef.current = false;
        setExpandedState(false);
      }
      dragStart.current = { ...positionValue.current };
    },
    onPanResponderMove: (_event, gesture) => {
      const next = {
        x: Math.min(width - SIZE, Math.max(0, dragStart.current.x + gesture.dx)),
        y: Math.min(height - SIZE - BOTTOM_CLEARANCE, Math.max(GAP, dragStart.current.y + gesture.dy)),
      };
      positionValue.current = next;
      position.setValue(next);
    },
    onPanResponderRelease: () => {
      const { x, y } = positionValue.current;
      const side = x + SIZE / 2 < width / 2 ? "left" : "right";
      sideRef.current = side;
      moveTo(edgeX(side, false), y);
      schedulePeek();
    },
    onPanResponderTerminate: schedulePeek,
  }), [clearIdleTimer, edgeX, height, moveTo, position, schedulePeek, width]);

  const trackedOrders = useMemo(() => orders
    .filter((order) => order.estimatedReadyAt && !["Completed", "Cancelled"].includes(order.status))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), [orders]);

  useEffect(() => {
    if (!token) { setOrders([]); return; }
    let mounted = true;
    const load = async () => {
      try { const result = await getMyOrders(token); if (mounted) setOrders(result); } catch { /* Retry on the next poll. */ }
    };
    void load();
    const poll = setInterval(() => void load(), 5_000);
    return () => { mounted = false; clearInterval(poll); };
  }, [token]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const signature = trackedOrders.map((order) => `${order._id}:${order.status}:${order.estimatedReadyAt}`).join("|");
    if (signature && signature !== lastEta.current) { lastEta.current = signature; setExpanded(true); }
    if (!signature) { lastEta.current = null; setExpanded(false); }
  }, [setExpanded, trackedOrders]);

  useEffect(() => {
    Animated.spring(sizeAnimation, { toValue: expanded ? 1 : 0, useNativeDriver: false, friction: 9, tension: 75 }).start();
    if (!expanded) return;
    const timer = setTimeout(() => setExpanded(false), 6_000);
    return () => clearTimeout(timer);
  }, [expanded, setExpanded, sizeAnimation]);

  useEffect(() => { wake(expandedRef.current); }, [height, wake, width]);
  useEffect(() => () => clearIdleTimer(), [clearIdleTimer]);

  if (trackedOrders.length === 0) return null;

  return (
    <Animated.View {...responder.panHandlers} style={[styles.container, position.getLayout(), {
      width: sizeAnimation.interpolate({ inputRange: [0, 1], outputRange: [SIZE, OPEN_WIDTH] }),
      height: sizeAnimation.interpolate({ inputRange: [0, 1], outputRange: [SIZE, OPEN_HEIGHT] }),
      borderRadius: sizeAnimation.interpolate({ inputRange: [0, 1], outputRange: [29, 20] }),
    }]}>
      <Pressable style={styles.pressable} onPress={() => setExpanded(!expandedRef.current)}>
        <View style={styles.clock}><Ionicons name="time" size={25} color="#FFFFFF" /></View>
        {expanded ? <View style={styles.details}>
          <View style={styles.topRow}><Text style={styles.eyebrow}>{trackedOrders.length} ACTIVE {trackedOrders.length === 1 ? "ORDER" : "ORDERS"}</Text><Ionicons name="chevron-forward" size={17} color={MUTED} /></View>
          <ScrollView style={styles.timerList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {trackedOrders.map((order, index) => {
              const target = new Date(order.estimatedReadyAt!).getTime();
              const originalMinutes = Math.max(1, order.estimatedMinutes ?? 10);
              const overdue = now >= target && order.status !== "Ready" && order.status !== "On the Way";
              const extensionNumber = overdue ? Math.floor((now - target) / 600_000) + 1 : 0;
              const effectiveTarget = overdue ? target + extensionNumber * 600_000 : target;
              const minutesLeft = Math.max(0, Math.ceil((effectiveTarget - now) / 60_000));
              const label = order.status === "Ready"
                ? (order.fulfillmentMethod === "delivery" ? "Ready for delivery" : "Ready for pickup")
                : order.status === "On the Way"
                  ? "On the way"
                  : `${minutesLeft} min left${overdue ? " · +10 min" : ""}`;
              const progress = order.status === "Ready" || order.status === "On the Way"
                ? 100
                : Math.max(5, Math.min(100, 100 - (minutesLeft / (overdue ? 10 : originalMinutes)) * 100));
              return <View key={order._id} style={[styles.timerItem, index > 0 && styles.timerDivider]}>
                <View style={styles.timerCopy}>
                  <Text style={styles.orderCode}>#{order._id.slice(-6).toUpperCase()} · {order.status === "Pending" ? "Waiting" : order.status}</Text>
                  <Text style={styles.time}>{label}</Text>
                  <Text style={styles.store} numberOfLines={1}>{storeName(order)}</Text>
                  <View style={styles.track}><View style={[styles.progress, { width: `${progress}%` }]} /></View>
                </View>
              </View>;
            })}
          </ScrollView>
        </View> : null}
      </Pressable>
    </Animated.View>
  );
}

const createStyles = (colors: AppColors) => createThemedStyleSheet(colors, {
  container: { position: "absolute", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E7E7E8", shadowColor: "#000000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 12, overflow: "hidden" },
  pressable: { flex: 1, flexDirection: "row", alignItems: "center", padding: 7 },
  clock: { width: 44, height: 44, borderRadius: 22, backgroundColor: CARDINAL, alignItems: "center", justifyContent: "center" },
  details: { flex: 1, alignSelf: "stretch", marginLeft: 11, marginRight: 5, paddingVertical: 5 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eyebrow: { fontSize: 8.5, fontWeight: "900", letterSpacing: 0.6, color: CARDINAL },
  timerList: { flex: 1, marginTop: 3 },
  timerItem: { paddingVertical: 6 },
  timerDivider: { borderTopWidth: 1, borderTopColor: "#EEEEEF" },
  timerCopy: { flex: 1 },
  orderCode: { fontSize: 7.5, fontWeight: "900", color: MUTED },
  time: { marginTop: 2, fontSize: 14, fontWeight: "900", color: TEXT },
  store: { marginTop: 2, fontSize: 10, fontWeight: "600", color: MUTED },
  track: { height: 4, marginTop: 9, borderRadius: 2, backgroundColor: "#F0DCE0", overflow: "hidden" },
  progress: { height: 4, borderRadius: 2, backgroundColor: CARDINAL },
});
let styles = createStyles(LIGHT_COLORS);
