import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { ChatMessage, Conversation, getConversationMessages, getConversations, sendChatMessage } from "../services/api";

const CARDINAL = "#A6192E";
const BG = "#F7F7F8";
const TEXT = "#171717";
const MUTED = "#737373";
const BORDER = "#E7E7E8";

type Props = { role: "client" | "seller" };

function personName(person: any) {
  return `${person?.firstName ?? ""} ${person?.lastName ?? ""}`.trim() || person?.username || "OrderUp user";
}

function personId(person: any) {
  return String(person?._id ?? person?.id ?? "");
}

export default function MessagesScreen({ role }: Props) {
  const { token, user } = useAuth();
  const params = useLocalSearchParams<{ recipientId?: string; recipientName?: string }>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const recipientId = typeof params.recipientId === "string" ? params.recipientId : "";

  const currentRecipient = useMemo(() => {
    if (!active) return recipientId ? { _id: recipientId, firstName: params.recipientName || "" } : null;
    return role === "client" ? active.seller : active.client;
  }, [active, recipientId, params.recipientName, role]);

  const loadConversations = useCallback(async () => {
    if (!token) return;
    try {
      const result = await getConversations(token);
      setConversations(result);
      if (recipientId) {
        const found = result.find((item) => personId(role === "client" ? item.seller : item.client) === recipientId);
        if (found) setActive(found);
      }
    } catch (error) {
      Alert.alert("Messages", error instanceof Error ? error.message : "Unable to load conversations.");
    } finally {
      setLoading(false);
    }
  }, [recipientId, role, token]);

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!token) return;
    try {
      const result = await getConversationMessages(token, conversationId);
      setMessages(result.messages);
    } catch (error) {
      Alert.alert("Messages", error instanceof Error ? error.message : "Unable to load messages.");
    }
  }, [token]);

  useFocusEffect(useCallback(() => { void loadConversations(); }, [loadConversations]));
  useEffect(() => { if (active?._id) void loadMessages(active._id); }, [active?._id, loadMessages]);
  useEffect(() => {
    if (!active?._id) return;
    const interval = setInterval(() => { void loadMessages(active._id); void loadConversations(); }, 3500);
    return () => clearInterval(interval);
  }, [active?._id, loadConversations, loadMessages]);

  const openConversation = (conversation: Conversation) => setActive(conversation);
  const send = async () => {
    const clean = draft.trim();
    const to = personId(currentRecipient);
    if (!clean || !to || !token || sending) return;
    try {
      setSending(true);
      const result = await sendChatMessage(token, to, clean);
      setDraft("");
      setActive(result.conversation);
      setMessages((current) => [...current, result.message]);
      await loadConversations();
    } catch (error) {
      Alert.alert("Message not sent", error instanceof Error ? error.message : "Please try again.");
    } finally { setSending(false); }
  };

  if (loading) return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator size="large" color={CARDINAL} /><Text style={styles.muted}>Loading messages…</Text></View></SafeAreaView>;

  if (!active && !recipientId) return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.listHeader}><View><Text style={styles.title}>Messages</Text><Text style={styles.subtitle}>Your conversations with {role === "client" ? "sellers" : "clients"}.</Text></View><Pressable onPress={() => router.back()} style={styles.close}><Ionicons name="close" size={21} color={TEXT} /></Pressable></View>
      <FlatList data={conversations} keyExtractor={(item) => item._id} contentContainerStyle={conversations.length ? styles.list : styles.emptyList} renderItem={({ item }) => { const other = role === "client" ? item.seller : item.client; return <Pressable style={styles.conversation} onPress={() => openConversation(item)}><View style={styles.avatar}><Text style={styles.avatarText}>{personName(other).slice(0, 1).toUpperCase()}</Text></View><View style={styles.conversationText}><Text style={styles.name}>{personName(other)}</Text><Text numberOfLines={1} style={styles.preview}>{item.lastMessage || "Start a conversation"}</Text></View><Ionicons name="chevron-forward" size={18} color={MUTED} /></Pressable>; }} ListEmptyComponent={<View style={styles.empty}><Ionicons name="chatbubbles-outline" size={44} color={CARDINAL} /><Text style={styles.emptyTitle}>No conversations yet</Text><Text style={styles.emptyText}>Open an order and tap Message to contact the other person.</Text></View>} />
    </SafeAreaView>
  );

  const otherName = personName(currentRecipient);
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.threadHeader}><Pressable onPress={() => { setActive(null); router.setParams({ recipientId: undefined, recipientName: undefined }); }} style={styles.back}><Ionicons name="chevron-back" size={25} color={TEXT} /></Pressable><View style={styles.avatarSmall}><Text style={styles.avatarText}>{otherName.slice(0, 1).toUpperCase()}</Text></View><View style={styles.threadTitle}><Text style={styles.name}>{otherName}</Text><Text style={styles.online}>Active conversation</Text></View></View>
        <FlatList ref={listRef} data={messages} keyExtractor={(item) => item._id} onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })} contentContainerStyle={styles.messages} renderItem={({ item }) => { const mine = personId(item.sender) === user?.id; return <View style={[styles.messageRow, mine && styles.messageMine]}><View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}><Text style={[styles.messageText, mine && styles.messageTextMine]}>{item.body}</Text><Text style={[styles.time, mine && styles.timeMine]}>{new Date(item.createdAt).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}</Text></View></View>; }} ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>Start the conversation</Text><Text style={styles.emptyText}>Messages refresh automatically while this chat is open.</Text></View>} />
        <View style={styles.composer}><TextInput value={draft} onChangeText={setDraft} placeholder="Type a message…" placeholderTextColor="#9A9A9A" multiline maxLength={1000} style={styles.input} /><Pressable onPress={send} disabled={!draft.trim() || sending} style={[styles.send, (!draft.trim() || sending) && styles.sendDisabled]}>{sending ? <ActivityIndicator color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}</Pressable></View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG }, flex: { flex: 1 }, center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }, muted: { color: MUTED, fontWeight: "600" }, listHeader: { padding: 20, paddingTop: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", borderBottomWidth: 1, borderColor: BORDER }, title: { color: TEXT, fontSize: 26, fontWeight: "900" }, subtitle: { marginTop: 4, color: MUTED, fontSize: 12 }, close: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F4F5" }, list: { padding: 16 }, emptyList: { flexGrow: 1, justifyContent: "center", padding: 24 }, conversation: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 14, borderRadius: 16, borderWidth: 1, borderColor: BORDER, marginBottom: 10 }, avatar: { width: 45, height: 45, borderRadius: 23, backgroundColor: "#FBECEF", alignItems: "center", justifyContent: "center" }, avatarSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#FBECEF", alignItems: "center", justifyContent: "center", marginLeft: 10 }, avatarText: { color: CARDINAL, fontWeight: "900", fontSize: 17 }, conversationText: { flex: 1, marginLeft: 11 }, name: { color: TEXT, fontWeight: "800", fontSize: 14 }, preview: { marginTop: 3, color: MUTED, fontSize: 12 }, empty: { alignItems: "center", padding: 28 }, emptyTitle: { marginTop: 12, color: TEXT, fontWeight: "900", fontSize: 16 }, emptyText: { marginTop: 5, color: MUTED, textAlign: "center", lineHeight: 18, fontSize: 12 }, threadHeader: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderBottomWidth: 1, borderColor: BORDER }, back: { width: 30, height: 36, justifyContent: "center" }, threadTitle: { marginLeft: 10, flex: 1 }, online: { marginTop: 1, fontSize: 10, color: CARDINAL, fontWeight: "700" }, messages: { padding: 14, paddingBottom: 18, flexGrow: 1 }, messageRow: { flexDirection: "row", marginBottom: 8 }, messageMine: { justifyContent: "flex-end" }, bubble: { maxWidth: "82%", paddingHorizontal: 13, paddingVertical: 9, borderRadius: 17 }, bubbleMine: { backgroundColor: CARDINAL, borderBottomRightRadius: 4 }, bubbleOther: { backgroundColor: "#fff", borderWidth: 1, borderColor: BORDER, borderBottomLeftRadius: 4 }, messageText: { color: TEXT, fontSize: 13, lineHeight: 18 }, messageTextMine: { color: "#fff" }, time: { marginTop: 4, color: MUTED, fontSize: 9, alignSelf: "flex-end" }, timeMine: { color: "#F9D9DF" }, composer: { padding: 10, paddingHorizontal: 14, flexDirection: "row", gap: 9, alignItems: "flex-end", backgroundColor: "#fff", borderTopWidth: 1, borderColor: BORDER }, input: { flex: 1, minHeight: 43, maxHeight: 110, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#F4F4F5", borderRadius: 18, color: TEXT, fontSize: 13 }, send: { width: 43, height: 43, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: CARDINAL }, sendDisabled: { opacity: 0.45 },
});
