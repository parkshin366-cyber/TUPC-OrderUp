import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { getOrderReceipt, type OrderReceipt } from "../services/api";

const money = (value: number) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OrderReceiptCard({ orderId }: { orderId: string }) {
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setReceipt(null);
    setError("");
    if (!token) { setError("Please sign in again."); return; }
    const load = () => getOrderReceipt(token, orderId).then(value => {
      if (active) { setReceipt(value); setError(""); }
    }).catch(reason => { if (active) { setError(reason.message || "Unable to load receipt"); setReceipt(null); } });
    void load();
    const timer = setInterval(load, 10000);
    return () => { active = false; clearInterval(timer); };
  }, [token, orderId, retry]);

  const label = { color: colors.muted, fontSize: 12 };
  const body = { color: colors.text, fontSize: 13 };
  const row = { flexDirection: "row" as const, justifyContent: "space-between" as const, gap: 12, alignItems: "flex-start" as const };
  const rule = { height: 1, backgroundColor: colors.border, marginVertical: 4 };
  const pickup = receipt?.fulfillmentMethod === "delivery" ? "Delivery location" : "Pickup location";
  const address = receipt?.fulfillmentMethod === "delivery" ? receipt.deliveryAddress || "See order details" : receipt?.pickupLocation;

  return <View style={{ marginVertical: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: "hidden" }}>
    <View style={{ padding: 18, backgroundColor: colors.softRed, flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="receipt-outline" size={22} color={colors.cardinal} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.cardinal, fontSize: 11, fontWeight: "800", letterSpacing: 1 }}>TUPC-ORDERUP</Text>
        <Text style={{ color: colors.text, fontSize: 19, fontWeight: "800", marginTop: 2 }}>Order receipt</Text>
      </View>
    </View>
    <View style={{ padding: 18, gap: 15 }}>
      {error ? <View style={{ gap: 10 }}><Text style={body}>{error}</Text><Pressable onPress={() => setRetry(n => n + 1)} accessibilityRole="button"><Text style={{ color: colors.cardinal, fontWeight: "700" }}>Try again</Text></Pressable></View> : !receipt ? <ActivityIndicator color={colors.cardinal} /> : <>
        <View style={{ gap: 5 }}>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: "800" }}>{receipt.storeName}</Text>
          <Text style={label}>{new Date(receipt.createdAt).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</Text>
          <Text selectable style={label}>Order ID: {receipt.orderId}</Text>
        </View>
        <View style={rule} />
        <View style={{ gap: 10 }}>
          <View style={row}><Text style={label}>Ordered by</Text><Text style={{ ...body, fontWeight: "700", textAlign: "right", flex: 1 }}>{receipt.customerName}</Text></View>
          <View style={row}><Text style={label}>Order status</Text><Text style={{ ...body, fontWeight: "700" }}>{receipt.status}</Text></View>
          <View style={row}><Text style={label}>{pickup}</Text><Text style={{ ...body, textAlign: "right", flex: 1 }}>{address}</Text></View>
        </View>
        <View style={rule} />
        <Text style={{ ...body, fontWeight: "800", fontSize: 14 }}>Items ordered</Text>
        <View style={{ gap: 12 }}>
          {receipt.items.map((item, i) => <View key={`${item.name}-${i}`} style={row}>
            <View style={{ flex: 1, flexDirection: "row", gap: 9 }}><Text style={{ ...body, color: colors.cardinal, fontWeight: "800" }}>{item.quantity}×</Text><View style={{ flex: 1 }}><Text style={{ ...body, fontWeight: "600" }}>{item.name}</Text><Text style={label}>{money(item.price)} each</Text></View></View>
            <Text style={{ ...body, fontWeight: "700" }}>{money(item.price * item.quantity)}</Text>
          </View>)}
        </View>
        <View style={rule} />
        <View style={{ gap: 8 }}>
          <View style={row}><Text style={label}>Subtotal</Text><Text style={body}>{money(receipt.subtotal)}</Text></View>
          {receipt.discount > 0 && <View style={row}><Text style={label}>Discount</Text><Text style={{ ...body, color: colors.success }}>−{money(receipt.discount)}</Text></View>}
          <View style={{ ...row, paddingTop: 9, borderTopWidth: 1, borderTopColor: colors.border, alignItems: "center" }}><Text style={{ ...body, fontSize: 15, fontWeight: "800" }}>Total</Text><Text style={{ color: colors.cardinal, fontSize: 20, fontWeight: "900" }}>{money(receipt.total)}</Text></View>
        </View>
        <View style={{ padding: 12, borderRadius: 10, backgroundColor: colors.surfaceSecondary }}><Text style={{ ...label, lineHeight: 17 }}>Show this receipt to the seller when collecting your order.</Text></View>
      </>}
    </View>
  </View>;
}
