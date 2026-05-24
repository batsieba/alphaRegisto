import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  collection,
} from "firebase/firestore";
import { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../config/firebase";
import { secondaryAuth } from "../../config/secondaryAuth";
import { Ionicons } from "@expo/vector-icons";

function generateTempPassword() {
  return Math.random().toString(36).slice(-10);
}

async function generateCompanyId() {
  const snapshot = await getDocs(collection(db, "companies"));
  const count = snapshot.size + 1;
  return `COM-${String(count).padStart(4, "0")}`;
}

function FieldInput({ icon, label, last, ...props }) {
  return (
    <View style={last ? null : styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <Ionicons name={icon} size={18} color="#9ca3af" style={styles.inputIcon} />
        <TextInput style={styles.input} placeholderTextColor="#9ca3af" {...props} />
      </View>
    </View>
  );
}

export default function AddCompany() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateCompany = async () => {
    if (!companyName || !ownerName || !email || !phoneNumber) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    setLoading(true);
    try {
      const companyId = await generateCompanyId();
      const tempPassword = generateTempPassword();

      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        tempPassword
      );
      const uid = cred.user.uid;

      await setDoc(doc(db, "companies", companyId), {
        companyId,
        name: companyName,
        ownerUid: uid,
        ownerName,
        email,
        phoneNumber,
        status: "active",
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, "users", uid), {
        uid,
        role: "owner",
        companyId,
        companyName,
        name: ownerName,
        email,
        phoneNumber,
        mustResetPassword: true,
        createdAt: serverTimestamp(),
      });

      await sendPasswordResetEmail(secondaryAuth, email, {
        url: "https://alpharegisto-c4f6e.web.app/login",
        handleCodeInApp: false,
      });

      await secondaryAuth.signOut();

      Alert.alert("Success", "Company created. Password reset email sent.");
      router.replace("/admin/companies");
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Add New Company</Text>
          <Text style={styles.pageSubtitle}>
            Fill in the details below to register a new company and owner account.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Company Details</Text>

          <FieldInput
            icon="business-outline"
            label="Company Name"
            placeholder="e.g. Acme Trading Ltd"
            value={companyName}
            onChangeText={setCompanyName}
          />

          <FieldInput
            icon="person-outline"
            label="Owner Name"
            placeholder="e.g. John Doe"
            value={ownerName}
            onChangeText={setOwnerName}
          />

          <FieldInput
            icon="mail-outline"
            label="Email Address"
            placeholder="owner@company.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <FieldInput
            icon="call-outline"
            label="Phone Number"
            placeholder="+1 (555) 000-0000"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            last
          />
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={20} color="#2563eb" />
          <Text style={styles.noteText}>
            A password reset email will be sent to the owner so they can set their own password before first login.
          </Text>
        </View>

        <Pressable
          style={[styles.createBtn, loading && styles.createBtnDisabled]}
          onPress={handleCreateCompany}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.createBtnText}>Create Company</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f7fb" },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  pageHeader: { marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: "800", color: "#111827", marginBottom: 6 },
  pageSubtitle: { fontSize: 14, color: "#6b7280", lineHeight: 20 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 18,
  },

  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 7 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#111827" },

  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  noteText: { flex: 1, fontSize: 13, color: "#1d4ed8", lineHeight: 18 },

  createBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 14,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
