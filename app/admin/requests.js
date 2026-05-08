import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  FlatList,
  Pressable,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  setDoc,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";

import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { secondaryAuth } from "../../config/secondaryAuth";

// 🔢 GENERATE COMPANY ID
async function generateCompanyId() {
  const snapshot = await getDocs(collection(db, "companies"));
  const count = snapshot.size + 2;
  return `COM-${String(count).padStart(4, "0")}`;
}

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");

  // 🔐 AUTH + LISTENER
  useEffect(() => {
    let unsubscribe;

    const authUnsub = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      const q = query(
        collection(db, "company_requests"),
        where("status", "==", "pending")
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRequests(data);
      });
    });

    return () => {
      authUnsub();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // ✅ APPROVE COMPANY
  const handleApprove = async (request) => {
    try {
      const companyId = await generateCompanyId();
      const tempPassword = Math.random().toString(36).slice(-10);

      // 👤 CREATE OWNER AUTH (secondary)
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        request.email,
        tempPassword
      );

      const uid = cred.user.uid;

      // 📧 SEND RESET EMAIL
      await sendPasswordResetEmail(secondaryAuth, request.email, {
        url: "https://alpharegisto-c4f6e.web.app/login",
        handleCodeInApp: false,
      });

      await secondaryAuth.signOut();

      // 👤 USERS COLLECTION
      await setDoc(doc(db, "users", uid), {
        uid,
        email: request.email,
        name: request.ownerName,
        role: "owner",
        companyId,
        phoneNumber: request.phoneNumber,
        companyName: request.companyName,
        status: "active",
        mustResetPassword: true,
        createdAt: serverTimestamp(),
      });

      // 🏢 COMPANIES COLLECTION ✅ FIXED
      await setDoc(doc(db, "companies", companyId), {
        companyId,
        name: request.companyName,
        ownerUid: uid,
        ownerName: request.ownerName,
        email: request.email,
        phoneNumber: request.phoneNumber,
        status: "active",
        createdAt: serverTimestamp(),
      });

      // 📄 UPDATE REQUEST
      await updateDoc(doc(db, "company_requests", request.id), {
        status: "approved",
        approvedAt: serverTimestamp(),
        ownerUid: uid,
        companyId,
      });

      Alert.alert("Approved", "Company and owner created successfully");
    } catch (error) {
      //  await cred.user.delete();
      Alert.alert("Approval failed", error.message);
    }
  };

  // ❌ REJECT REQUEST
  const handleRejection = async (request) => {
    Alert.alert(
      "Reject Request",
      "Are you sure you want to reject this company?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "company_requests", request.id), {
                status: "rejected",
                rejectedAt: serverTimestamp(),
              });
            } catch (e) {
              Alert.alert("Error", e.message);
            }
          },
        },
      ]
    );
  };

  const filteredRequests = requests.filter((item) =>
    item.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Image
                source={require("../../assets/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Company Requests</Text>
            </View>

            <TextInput
              placeholder="Search companies..."
              value={search}
              onChangeText={setSearch}
              style={styles.search}
            />
          </>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No pending requests</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.company}>{item.companyName}</Text>
              <Text style={styles.meta}>{item.ownerName}</Text>
              <Text style={styles.meta}>{item.email}</Text>
            </View>

            <View style={styles.actions}>
              <Pressable
                style={[styles.button, styles.approve]}
                onPress={() => handleApprove(item)}
              >
                <Text style={styles.buttonText}>Approve</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.reject]}
                onPress={() => handleRejection(item)}
              >
                <Text style={styles.buttonText}>Reject</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  logo: { width: 110, height: 110, marginRight: 12 },
  title: { fontSize: 22, fontWeight: "700" },
  search: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  company: { fontSize: 18, fontWeight: "600" },
  meta: { fontSize: 14, color: "#6b7280" },
  actions: { flexDirection: "row", marginTop: 12 },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  approve: { backgroundColor: "#2563eb", marginRight: 8 },
  reject: { backgroundColor: "#ef4444", marginLeft: 8 },
  buttonText: { color: "#fff", fontWeight: "600" },
  empty: { textAlign: "center", marginTop: 40, color: "#6b7280" },
});
