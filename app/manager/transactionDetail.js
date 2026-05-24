import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Pressable,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot, deleteDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

/* ── helpers ── */
function formatDate(ts) {
  if (!ts?.toDate) return "—";
  return ts.toDate().toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function capitalize(str) {
  if (!str) return "—";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const TYPE_COLORS = {
  "advance payment": { bg: "#eff6ff", text: "#2563eb" },
  credit:            { bg: "#fef2f2", text: "#dc2626" },
  prepay:            { bg: "#f0fdf4", text: "#16a34a" },
};

/* ══════════════════════════════════════════════════════════ */
export default function ManagerTransactionDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "transactions", id), (snap) => {
      if (snap.exists()) setData({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
    return unsub;
  }, [id]);

  const handleDelete = () => {
    Alert.alert("Delete Transaction", "Are you sure you want to delete this transaction?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "transactions", id));
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={52} color="#d1d5db" />
          <Text style={styles.notFoundText}>Transaction not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const date = formatDate(data.createdAt);
  const typeStyle = TYPE_COLORS[data.type] || { bg: "#f3f4f6", text: "#374151" };
  const hasDriver =
    data.driver?.name || data.driver?.phone ||
    data.driver?.plate || data.driver?.destination;
  const files = Array.isArray(data.files) ? data.files : [];
  const images = files.filter((f) => f.type?.startsWith("image"));
  const documents = files.filter((f) => !f.type?.startsWith("image"));

  return (
    <SafeAreaView style={styles.safe}>
      {/* top bar */}
      <View style={styles.topBar}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/notifications")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>

        <Text style={styles.topBarTitle}>Transaction Detail</Text>

        <View style={styles.topBarActions}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push(`/manager/editTransaction?id=${id}`)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="create-outline" size={20} color="#2563eb" />
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.actionBtnDanger]}
            onPress={handleDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={20} color="#dc2626" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* hero */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroAmount}>
              {data.currency} {Number(data.amount).toLocaleString()}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg }]}>
              <Text style={[styles.typeBadgeText, { color: typeStyle.text }]}>
                {capitalize(data.type)}
              </Text>
            </View>
          </View>
          <Text style={styles.heroTitle} numberOfLines={2}>
            {data.title || "Transaction"}
          </Text>
          <View style={styles.heroDivider} />
          <View style={styles.heroMeta}>
            <View style={styles.heroMetaItem}>
              <Ionicons name="calendar-outline" size={14} color="#c7d2fe" />
              <Text style={styles.heroMetaText}>{date}</Text>
            </View>
            {data.transactionNo ? (
              <View style={styles.heroMetaItem}>
                <Ionicons name="receipt-outline" size={14} color="#c7d2fe" />
                <Text style={styles.heroMetaText}>#{data.transactionNo}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* payment info */}
        <Card title="Payment Info">
          <InfoRow icon="card-outline"           label="Payment Method" value={capitalize(data.method)} />
          <InfoRow icon="swap-horizontal-outline" label="Payment Type"   value={capitalize(data.type)} />
          <InfoRow icon="cash-outline"            label="Currency"       value={data.currency} />
          {data.transactionNo ? (
            <InfoRow icon="receipt-outline" label="Reference No." value={`#${data.transactionNo}`} />
          ) : null}
        </Card>

        {/* customer */}
        {(data.customerName || data.customerId) ? (
          <Card title="Customer">
            <InfoRow icon="person-outline"       label="Name" value={data.customerName} />
            <InfoRow icon="finger-print-outline" label="ID"   value={data.customerId} />
          </Card>
        ) : null}

        {/* driver */}
        {hasDriver ? (
          <Card title="Delivery Details">
            <InfoRow icon="person-outline"   label="Driver"      value={data.driver?.name} />
            <InfoRow icon="call-outline"     label="Phone"       value={data.driver?.phone} />
            <InfoRow icon="car-outline"      label="Plate"       value={data.driver?.plate} />
            <InfoRow icon="location-outline" label="Destination" value={data.driver?.destination} />
          </Card>
        ) : null}

        {/* recorded by */}
        <Card title="Recorded By">
          <InfoRow icon="mail-outline"      label="Email" value={data.enteredByEmail} />
          <InfoRow icon="briefcase-outline" label="Role"  value={capitalize(data.enteredByRole)} />
        </Card>

        {/* attachments */}
        {files.length > 0 ? (
          <Card title={`Attachments (${files.length})`}>
            {images.map((file, i) => (
              <Pressable
                key={`img-${i}`}
                style={styles.attachmentBlock}
                onPress={() => Linking.openURL(file.url)}
              >
                <Image source={{ uri: file.url }} style={styles.imagePreview} resizeMode="cover" />
                <View style={styles.attachmentFooter}>
                  <Ionicons name="image-outline" size={14} color="#6b7280" />
                  <Text style={styles.attachmentName} numberOfLines={1}>{file.name}</Text>
                  <Ionicons name="open-outline" size={14} color="#2563eb" />
                </View>
              </Pressable>
            ))}
            {documents.map((file, i) => (
              <Pressable
                key={`doc-${i}`}
                style={styles.docRow}
                onPress={() => Linking.openURL(file.url)}
              >
                <View style={styles.docIcon}>
                  <Ionicons name="document-text-outline" size={22} color="#2563eb" />
                </View>
                <Text style={styles.docName} numberOfLines={1}>{file.name}</Text>
                <View style={styles.openTag}>
                  <Text style={styles.openTagText}>Open</Text>
                </View>
              </Pressable>
            ))}
          </Card>
        ) : null}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── sub-components ── */
function Card({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  if (!value || value === "—") return null;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={16} color="#9ca3af" style={{ marginRight: 6 }} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f7fb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  notFoundText: { fontSize: 16, color: "#9ca3af", marginTop: 8 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#f3f4f6",
    justifyContent: "center", alignItems: "center",
  },
  topBarTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  topBarActions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#eff6ff",
    justifyContent: "center", alignItems: "center",
  },
  actionBtnDanger: { backgroundColor: "#fef2f2" },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  hero: {
    backgroundColor: "#2563eb",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  heroAmount: { fontSize: 30, fontWeight: "800", color: "#fff", flex: 1, marginRight: 12 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start" },
  typeBadgeText: { fontSize: 12, fontWeight: "700" },
  heroTitle: { fontSize: 16, color: "#dbeafe", fontWeight: "500", marginBottom: 14 },
  heroDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.2)", marginBottom: 12 },
  heroMeta: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  heroMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  heroMetaText: { fontSize: 12, color: "#c7d2fe" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 13, fontWeight: "700", color: "#6b7280",
    textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 14,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  infoLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  infoLabel: { fontSize: 14, color: "#6b7280" },
  infoValue: {
    fontSize: 14, fontWeight: "600", color: "#111827",
    maxWidth: "55%", textAlign: "right",
  },

  attachmentBlock: { marginBottom: 12 },
  imagePreview: {
    width: "100%", height: 200, borderRadius: 12, backgroundColor: "#f3f4f6",
  },
  attachmentFooter: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, paddingHorizontal: 2,
  },
  attachmentName: { flex: 1, fontSize: 12, color: "#6b7280" },

  docRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#f8fafc", borderRadius: 12,
    padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: "#e5e7eb",
  },
  docIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: "#eff6ff",
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  docName: { flex: 1, fontSize: 14, color: "#374151", fontWeight: "500" },
  openTag: { backgroundColor: "#2563eb", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  openTagText: { fontSize: 12, color: "#fff", fontWeight: "600" },
});
