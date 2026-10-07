import { Ionicons } from "@expo/vector-icons";
import { LIGHT_COLORS, type AppColors, useAppTheme } from "../../context/ThemeContext";
import { createThemedStyleSheet } from "../../utils/themeStyles";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { AdminFinance, getAdminFinance, updateAdminRentStatus } from "../../services/api";

const RED = "#A6192E"; const GOLD = "#D8B56A"; const BG = "#F7F7F8"; const WHITE = "#FFFFFF"; const TEXT = "#171717"; const MUTED = "#737373";
const peso = (value: number) => `₱${value.toLocaleString("en-PH")}`;

export default function AdminFinanceScreen() {
  const { colors } = useAppTheme();
  styles = createStyles(colors);
  const { token } = useAuth();
  const [data, setData] = useState<AdminFinance | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { if (!token) return; try { setLoading(true); setData(await getAdminFinance(token)); } catch (error) { Alert.alert("Unable to Load Finance", error instanceof Error ? error.message : "Please try again."); } finally { setLoading(false); } }, [token]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const collected = useMemo(() => data?.rents.filter((rent) => rent.status === "Paid").reduce((sum, rent) => sum + rent.amount, 0) ?? 0, [data]);
  const verify = async (id: string) => { if (!token) return; try { await updateAdminRentStatus(token, id, "Paid"); await load(); } catch (error) { Alert.alert("Verification Failed", error instanceof Error ? error.message : "Please try again."); } };
  if (loading) return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator color={RED} /><Text style={styles.muted}>Loading finance data...</Text></View></SafeAreaView>;
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.eyebrow}>MASTER ADMIN</Text><Text style={styles.title}>Rent & Stalls</Text><Text style={styles.subtitle}>Live records from the platform database.</Text>
    <View style={styles.summary}><Text style={styles.summaryLabel}>RENT COLLECTED</Text><Text style={styles.summaryValue}>{peso(collected)}</Text><Text style={styles.summaryText}>{data?.rents.length ?? 0} rent record(s) · {data?.pendingSellerCount ?? 0} pending seller approval(s)</Text></View>
    <Text style={styles.section}>Rent Records</Text>{data?.rents.length ? data.rents.map((rent) => <View style={styles.card} key={rent._id}><View style={styles.flex}><Text style={styles.name}>{rent.seller.firstName} {rent.seller.lastName}</Text><Text style={styles.muted}>Stall {rent.stall?.code ?? "Unassigned"} · Due {new Date(rent.dueDate).toLocaleDateString("en-PH")}</Text><Text style={styles.amount}>{peso(rent.amount)}</Text></View><View style={styles.align}><Text style={[styles.status, rent.status === "Paid" ? styles.paid : styles.due]}>{rent.status}</Text>{rent.status !== "Paid" && <Pressable style={styles.verify} onPress={() => verify(rent._id)}><Text style={styles.verifyText}>Mark paid</Text></Pressable>}</View></View>) : <Empty icon="receipt-outline" text="No rent records in the database." />}
    <Text style={styles.section}>Stall Occupancy</Text>{data?.stalls.length ? data.stalls.map((stall) => <View style={styles.card} key={stall._id}><View style={styles.stall}><Text style={styles.stallText}>{stall.code}</Text></View><View style={styles.flex}><Text style={styles.name}>{stall.seller ? `${stall.seller.firstName} ${stall.seller.lastName}` : "Available stall"}</Text><Text style={styles.muted}>{stall.location} · {peso(stall.monthlyRent)}/month</Text></View><Ionicons name={stall.seller ? "checkmark-circle" : "ellipse-outline"} size={20} color={stall.seller ? "#2E7D32" : GOLD} /></View>) : <Empty icon="business-outline" text="No stalls in the database." />}
  </ScrollView></SafeAreaView>;
}
function Empty({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) { return <View style={styles.empty}><Ionicons name={icon} size={26} color={RED} /><Text style={styles.muted}>{text}</Text></View>; }
const createStyles = (colors: AppColors) => createThemedStyleSheet(colors, { safe:{flex:1,backgroundColor:BG},content:{padding:18,paddingBottom:40},center:{flex:1,alignItems:"center",justifyContent:"center"},eyebrow:{fontSize:10,fontWeight:"900",letterSpacing:1.5,color:RED},title:{fontSize:29,fontWeight:"900",color:TEXT,marginTop:3},subtitle:{fontSize:12,color:MUTED,marginTop:4},summary:{backgroundColor:RED,borderRadius:18,padding:18,marginTop:20},summaryLabel:{fontSize:10,fontWeight:"800",color:"#F7DDE1",letterSpacing:1},summaryValue:{fontSize:30,fontWeight:"900",color:WHITE,marginTop:5},summaryText:{fontSize:11,color:"#F7DDE1",marginTop:5},section:{fontSize:17,fontWeight:"900",color:TEXT,marginTop:23,marginBottom:10},card:{backgroundColor:WHITE,borderRadius:15,padding:14,marginBottom:9,flexDirection:"row",alignItems:"center",borderWidth:1,borderColor:"#E7E7E8"},flex:{flex:1},align:{alignItems:"flex-end"},name:{fontSize:13,fontWeight:"800",color:TEXT},muted:{fontSize:10.5,color:MUTED,marginTop:4},amount:{fontSize:16,fontWeight:"900",color:TEXT,marginTop:8},status:{fontSize:9,fontWeight:"900",borderRadius:10,paddingHorizontal:8,paddingVertical:5,overflow:"hidden"},paid:{backgroundColor:"#EAF6EC",color:"#2E7D32"},due:{backgroundColor:"#FFF4DF",color:"#B26A00"},verify:{backgroundColor:RED,borderRadius:8,paddingHorizontal:9,paddingVertical:7,marginTop:9},verifyText:{color:WHITE,fontSize:10,fontWeight:"800"},stall:{width:43,height:43,borderRadius:12,backgroundColor:"#F8E9EC",alignItems:"center",justifyContent:"center",marginRight:11},stallText:{color:RED,fontSize:12,fontWeight:"900"},empty:{backgroundColor:WHITE,borderRadius:15,padding:23,alignItems:"center",gap:8,borderWidth:1,borderColor:"#E7E7E8"} });

let styles = createStyles(LIGHT_COLORS);
