import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { Ionicons } from "@expo/vector-icons";

async function generateCompanyId() {
  const snapshot = await getDocs(collection(db, "companies"));
  const count = snapshot.size + 2;
  return `COM-${String(count).padStart(4, "0")}`;
}

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [approving, setApproving] = useState(null);

  useEffect(() => {
    let unsubscribe;

    const authUnsub = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      const q = query(
        collection(db, "company_requests"),
        where("status", "==", "pending")
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRequests(data);
      });
    });

    return () => {
      authUnsub();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleApprove = async (request) => {
    setApproving(request.id);
    try {
      const companyId = await generateCompanyId();
      const tempPassword = Math.random().toString(36).slice(-10);

      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        request.email,
        tempPassword
      );
      const uid = cred.user.uid;

      await sendPasswordResetEmail(secondaryAuth, request.email, {
        url: "https://alpharegisto-c4f6e.web.app/login",
        handleCodeInApp: false,
      });

      await secondaryAuth.signOut();

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

      await updateDoc(doc(db, "company_requests", request.id), {
        status: "approved",
        approvedAt: serverTimestamp(),
        ownerUid: uid,
        companyId,
      });

      Alert.alert("Approved", "Company and owner created successfully.");
    } catch (error) {
      Alert.alert("Approval failed", error.message);
    } finally {
      setApproving(null);
    }
  };

  const handleRejection = async (request) => {
    Alert.alert(
      "Reject Request",
      `Are you sure you want to reject "${request.companyName}"?`,
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

  const filteredRequests = requests.filter(
    (item) =>
      item.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      item.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
      item.email?.toLowerCase().includes(search.toLowerCase())
  );

  function RequestCard({ item }) {
    const initial = item.companyName?.charAt(0)?.toUpperCase() || "?";
    const isApproving = approving === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.companyName} numberOfLines={1}>
              {item.companyName}
            </Text>
            <Text style={styles.ownerName}>{item.ownerName}</Text>
            <Text style={styles.metaEmail} numberOfLines={1}>
              {item.email}
            </Text>
            {item.phoneNumber ? (
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={13} color="#9ca3af" />
                <Text style={styles.metaPhone}>{item.phoneNumber}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.actions}>
          <Pressable
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => handleRejection(item)}
            disabled={isApproving}
          >
            <Ionicons name="close-circle-outline" size={16} color="#dc2626" />
            <Text style={styles.rejectText}>Reject</Text>
          </Pressable>
          <Pressable
            style={[
              styles.actionBtn,
              styles.approveBtn,
              isApproving && styles.btnDisabled,
            ]}
            onPress={() => handleApprove(item)}
            disabled={isApproving}
          >
            {isApproving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={styles.approveText}>Approve</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.pageHeader}>
              <Text style={styles.pageTitle}>Company Requests</Text>
              {requests.length > 0 ? (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{requests.length}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.searchRow}>
              <Ionicons
                name="search-outline"
                size={18}
                color="#9ca3af"
                style={styles.searchIcon}
              />
              <TextInput
                placeholder="Search by company, owner or email..."
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
                placeholderTextColor="#9ca3af"
              />
              {search.length > 0 ? (
                <Pressable
                  onPress={() => setSearch("")}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color="#9ca3af" />
                </Pressable>
              ) : null}
            </View>

            {filteredRequests.length > 0 ? (
              <Text style={styles.resultsLabel}>
                {filteredRequests.length} pending request
                {filteredRequests.length !== 1 ? "s" : ""}
              </Text>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="checkmark-done-circle-outline"
              size={56}
              color="#d1d5db"
            />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>
              No pending company requests right now.
            </Text>
          </View>
        }
        renderItem={({ item }) => <RequestCard item={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f7fb" },
  listContent: { padding: 20, paddingBottom: 40 },

  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  pageTitle: { fontSize: 24, fontWeight: "800", color: "#111827" },
  countBadge: {
    backgroundColor: "#fef3c7",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  countBadgeText: { fontSize: 13, fontWeight: "700", color: "#92400e" },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 14,
    marginBottom: 12,
    height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },

  resultsLabel: { fontSize: 13, color: "#6b7280", marginBottom: 16 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: { flexDirection: "row", gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "800", color: "#fff" },
  cardInfo: { flex: 1 },
  companyName: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 2 },
  ownerName: { fontSize: 13, color: "#374151", marginBottom: 2 },
  metaEmail: { fontSize: 12, color: "#6b7280" },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  metaPhone: { fontSize: 12, color: "#6b7280" },

  cardDivider: { height: 1, backgroundColor: "#f3f4f6", marginVertical: 12 },

  actions: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
  },
  rejectBtn: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  approveBtn: { backgroundColor: "#2563eb" },
  btnDisabled: { opacity: 0.6 },
  rejectText: { fontSize: 14, fontWeight: "600", color: "#dc2626" },
  approveText: { fontSize: 14, fontWeight: "600", color: "#fff" },

  emptyState: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#374151" },
  emptySubtitle: { fontSize: 14, color: "#9ca3af", textAlign: "center" },
});
