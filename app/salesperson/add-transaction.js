import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Image,
  Modal,
  FlatList,
} from "react-native";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../config/firebase";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const PAYMENT_TYPES = ["advance payment", "credit", "prepay"];
const PAYMENT_METHODS = ["cash", "bank transfer", "mobile money", "cheque", "card"];
const CURRENCIES = ["USD", "EUR", "KZ"];

const storage = getStorage();

export default function AddTransaction() {
  const { user, companyId, role } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [customerModal, setCustomerModal] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    title: "",
    type: "advance payment",
    method: "",
    amount: "",
    currency: "USD",
    transactionNo: "",
    customerId: "",
    customerName: "",
  });

  const [driver, setDriver] = useState({
    name: "",
    phone: "",
    plate: "",
    destination: "",
  });

  const [files, setFiles] = useState([]);

  /* ================= LOAD ONLY SALESPERSON CUSTOMERS ================= */
  useEffect(() => {
    if (!companyId || !user?.uid) return;
    loadCustomers();
  }, [companyId]);

  const loadCustomers = async () => {
    try {
      const snap = await getDocs(
        query(
          collection(db, "company_customers"),
          where("companyId", "==", companyId),
          where("employeeId", "==", user.uid)
        )
      );

      const list = snap.docs.map((d) => ({
        id: d.data().customerId,
        name: d.data().customerName || "Unnamed",
        email: d.data().customerEmail || "",
        phone: d.data().customerPhone || "",
      }));

      setCustomers(list);
    } catch (e) {
      console.log("Customer Load Error:", e);
      Alert.alert("Error loading customers");
    }
  };

  /* ================= FILE PICKERS ================= */
  const pickDocument = async () => {
    const res = await DocumentPicker.getDocumentAsync({});
    if (!res.canceled) {
      setFiles((p) => [...p, res.assets[0]]);
    }
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!res.canceled) {
      setFiles((p) => [...p, res.assets[0]]);
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!form.title || !form.amount || !form.customerId) {
      Alert.alert("Please fill all required fields");
      return;
    }

    try {
      const tranRef = doc(collection(db, "transactions"));

      let uploadedFiles = [];

      for (const file of files) {
        const response = await fetch(file.uri);
        const blob = await response.blob();

        const fileRef = ref(
          storage,
          `transactions/${companyId}/${tranRef.id}/${file.name}`
        );

        await uploadBytes(fileRef, blob);
        const downloadURL = await getDownloadURL(fileRef);

        uploadedFiles.push({
          name: file.name,
          url: downloadURL,
          type: file.mimeType || "file",
        });
      }

      await setDoc(tranRef, {
        transactionId: tranRef.id,
        title: form.title || "",
        type: form.type || "",
        method: form.method || "",
        amount: Number(form.amount) || 0,
        currency: form.currency || "USD",
        transactionNo: form.transactionNo || "",

        customerId: form.customerId || "",
        customerName: form.customerName || "",

        companyId: companyId || "",

        enteredBy: user?.uid || "",
        enteredByEmail: user?.email || "",
        enteredByRole: role || "salesperson",

        driver: {
          name: driver.name || "",
          phone: driver.phone || "",
          plate: driver.plate || "",
          destination: driver.destination || "",
        },

        files: uploadedFiles || [],
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Transaction added successfully");
      setFiles([]);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", e.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>Add Transaction</Text>
      </View>

      <Section title="Transaction Info">
        <Input label="Title *" value={form.title}
          onChange={(v) => setForm({ ...form, title: v })} />

        <Input label="Transaction No"
          value={form.transactionNo}
          onChange={(v) => setForm({ ...form, transactionNo: v })} />

        <Dropdown label="Payment Type"
          value={form.type}
          options={PAYMENT_TYPES}
          onSelect={(v) => setForm({ ...form, type: v })} />

        <Dropdown label="Payment Method"
          value={form.method}
          options={PAYMENT_METHODS}
          onSelect={(v) => setForm({ ...form, method: v })} />

        <Input label="Amount *"
          keyboardType="numeric"
          value={form.amount}
          onChange={(v) => setForm({ ...form, amount: v })} />

        <Dropdown label="Currency"
          value={form.currency}
          options={CURRENCIES}
          onSelect={(v) => setForm({ ...form, currency: v })} />

        <Pressable style={styles.selector}
          onPress={() => setCustomerModal(true)}>
          <Text>
            {form.customerName || "Select Customer *"}
          </Text>
        </Pressable>
      </Section>

      <Section title="Driver Details">
        <Input label="Driver Name"
          value={driver.name}
          onChange={(v) => setDriver({ ...driver, name: v })} />

        <Input label="Phone"
          value={driver.phone}
          onChange={(v) => setDriver({ ...driver, phone: v })} />

        <Input label="Plate"
          value={driver.plate}
          onChange={(v) => setDriver({ ...driver, plate: v })} />

        <Input label="Destination"
          value={driver.destination}
          onChange={(v) => setDriver({ ...driver, destination: v })} />
      </Section>

      <Section title="Attachments">
        <Pressable style={styles.fileBtn} onPress={pickImage}>
          <Text>Add Image</Text>
        </Pressable>
        <Pressable style={styles.fileBtn} onPress={pickDocument}>
          <Text>Add Document</Text>
        </Pressable>
        {files.map((f, i) => (
          <Text key={i}>{f.name}</Text>
        ))}
      </Section>

      <Pressable style={styles.submitBtn}
        onPress={handleSubmit}>
        <Text style={styles.submitText}>
          Save Transaction
        </Text>
      </Pressable>

      {/* CUSTOMER MODAL */}
      <Modal visible={customerModal} animationType="slide">
        <View style={styles.modal}>

            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Customer</Text>
                    <Pressable onPress={() => setCustomerModal(false)}>
                        <Text style={styles.close}>Close</Text>
                    </Pressable>
            </View>
          <TextInput
            placeholder="Search customer..."
            style={styles.search}
            value={search}
            onChangeText={setSearch}
          />

          <FlatList
            data={customers.filter((c) =>
              c.name.toLowerCase().includes(search.toLowerCase())
            )}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.customerItem}
                onPress={() => {
                  setForm({
                    ...form,
                    customerId: item.id,
                    customerName: item.name,
                  });
                  setCustomerModal(false);
                }}
              >
                <Text style={{ fontWeight: "600" }}>
                  {item.name}
                </Text>
                <Text>{item.email}</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

/* ===== REUSABLE COMPONENTS ===== */
function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Input({ label, value, onChange, ...props }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        {...props}
      />
    </>
  );
}

function Dropdown({ label, value, options, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.selector}
        onPress={() => setOpen(!open)}>
        <Text>{value}</Text>
      </Pressable>
      {open &&
        options.map((o) => (
          <Pressable key={o}
            style={styles.option}
            onPress={() => {
              onSelect(o);
              setOpen(false);
            }}>
            <Text>{o}</Text>
          </Pressable>
        ))}
    </>
  );
}

/* ===== STYLES ===== */
const styles = StyleSheet.create({
  container: { backgroundColor: "#fff", padding: 16, marginTop: 16 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  logo: { width: 90, height: 90, marginRight: 12 },
  title: { fontSize: 22, fontWeight: "700" },

  section: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  sectionTitle: { fontWeight: "700", marginBottom: 10 },
  label: { fontSize: 13, color: "#6b7280", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  selector: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  option: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  fileBtn: {
    borderWidth: 1,
    borderColor: "#2563eb",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    alignItems: "center",
  },
  submitBtn: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 40,
  },
  submitText: { color: "#fff", fontWeight: "700" },

  modal: { flex: 1, padding: 16, backgroundColor: "#fff", marginTop: 18 },
  search: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  customerItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12, paddingTop: 50, },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  close: { color: "#2563eb", fontWeight: "600" },
});
