import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function SalespersonEditTransaction() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const snap = await getDoc(doc(db, "transactions", id));
    if (!snap.exists()) {
      Alert.alert("Error", "Transaction not found");
      router.back();
      return;
    }
    const data = snap.data();
    if (data.enteredBy !== user?.uid) {
      Alert.alert("Permission Denied", "You can only edit your own transactions.");
      router.back();
      return;
    }
    setForm(data);
    setLoading(false);
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setDriver = (key, value) => {
    setForm((prev) => ({
      ...prev,
      driver: { ...prev.driver, [key]: value },
    }));
  };

  const handleSave = async () => {
    if (!form.title || !form.amount) {
      Alert.alert("Missing fields", "Title and amount are required.");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "transactions", id), {
        title: form.title,
        amount: Number(form.amount) || 0,
        currency: form.currency,
        method: form.method,
        type: form.type,
        transactionNo: form.transactionNo,
        customerName: form.customerName,
        driver: form.driver || {},
      });
      Alert.alert("Saved", "Transaction updated successfully.");
      router.back();
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
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

  return (
    <SafeAreaView style={styles.safe}>
      {/* top bar */}
      <View style={styles.topBar}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.topBarTitle}>Edit Transaction</Text>
        <Pressable
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save"}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card title="Transaction Info">
          <Field
            label="Title"
            value={form.title}
            onChange={(v) => setField("title", v)}
          />
          <Field
            label="Amount"
            value={String(form.amount ?? "")}
            onChange={(v) => setField("amount", v)}
            keyboardType="numeric"
          />
          <Field
            label="Currency"
            value={form.currency}
            onChange={(v) => setField("currency", v)}
          />
          <Field
            label="Payment Method"
            value={form.method}
            onChange={(v) => setField("method", v)}
          />
          <Field
            label="Payment Type"
            value={form.type}
            onChange={(v) => setField("type", v)}
          />
          <Field
            label="Reference No."
            value={form.transactionNo}
            onChange={(v) => setField("transactionNo", v)}
          />
        </Card>

        <Card title="Customer">
          <Field
            label="Customer Name"
            value={form.customerName}
            onChange={(v) => setField("customerName", v)}
          />
        </Card>

        <Card title="Delivery Details">
          <Field
            label="Driver Name"
            value={form.driver?.name}
            onChange={(v) => setDriver("name", v)}
          />
          <Field
            label="Driver Phone"
            value={form.driver?.phone}
            onChange={(v) => setDriver("phone", v)}
          />
          <Field
            label="Plate"
            value={form.driver?.plate}
            onChange={(v) => setDriver("plate", v)}
          />
          <Field
            label="Destination"
            value={form.driver?.destination}
            onChange={(v) => setDriver("destination", v)}
          />
        </Card>

        <View style={{ height: 40 }} />
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

function Field({ label, value, onChange, keyboardType }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value ?? ""}
        onChangeText={onChange}
        keyboardType={keyboardType || "default"}
        placeholderTextColor="#9ca3af"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f7fb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

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
  saveBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

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

  fieldWrap: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, color: "#6b7280", marginBottom: 4 },
  fieldInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fafafa",
  },
});
