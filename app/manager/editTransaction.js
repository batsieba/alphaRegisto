import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Image
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useEffect, useState } from "react";

export default function EditTransaction() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({});

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const snap = await getDoc(doc(db, "transactions", id));
    if (snap.exists()) {
      setForm(snap.data());
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, "transactions", id), form);
      Alert.alert("Success", "Transaction updated");
      router.back();
    } catch (e) {
      Alert.alert("Error", e.message);
    }
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

  if (loading) return null;

  return (
    <ScrollView style={styles.container}>
        <View style={styles.header}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>Edit Transaction</Text>
        </View>
      

      {/* BASIC */}
      <Input label="Title" value={form.title} onChange={(v)=>setField("title",v)} />
      <Input label="Amount" value={String(form.amount)} onChange={(v)=>setField("amount",Number(v))} />
      <Input label="Currency" value={form.currency} onChange={(v)=>setField("currency",v)} />
      <Input label="Method" value={form.method} onChange={(v)=>setField("method",v)} />
      <Input label="Type" value={form.type} onChange={(v)=>setField("type",v)} />

      {/* CUSTOMER */}
      <Section title="Customer">
        <Input label="Name" value={form.customerName} onChange={(v)=>setField("customerName",v)} />
      </Section>

      {/* DRIVER */}
      <Section title="Driver">
        <Input label="Name" value={form.driver?.name} onChange={(v)=>setDriver("name",v)} />
        <Input label="Phone" value={form.driver?.phone} onChange={(v)=>setDriver("phone",v)} />
        <Input label="Plate" value={form.driver?.plate} onChange={(v)=>setDriver("plate",v)} />
        <Input label="Destination" value={form.driver?.destination} onChange={(v)=>setDriver("destination",v)} />
      </Section>

      {/* SAVE */}
      <Pressable style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>Save Changes</Text>
      </Pressable>
    </ScrollView>
  );
}

/* COMPONENTS */
const Input = ({ label, value, onChange }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      style={styles.input}
    />
  </View>
);

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

/* STYLES */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f7fb" },
  title: { fontSize: 22, fontWeight: "700",  color: "#111827", },
  header:{
    alignItems:'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  logo:{
    width: 90,
    height:90,
    marginRight: 10,
    borderRadius: 50,

  },

  label: { fontSize: 12, color: "#6b7280" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },

  section: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    border: 2,
    borderColor: '#fff',
  },

  sectionTitle: {
    fontWeight: "700",
    marginBottom: 10,
  },

  saveBtn: {
    backgroundColor: "#16a34a",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  saveText: {
    color: "#fff",
    fontWeight: "700",
  },
});