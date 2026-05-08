import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../../config/firebase";
import { useAuth } from "../../../context/AuthContext";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable
} from "react-native";

export default function EmployeeDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { companyId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");

  /* ================= LOAD EMPLOYEE ================= */
  useEffect(() => {
    if (!id) return;
    loadEmployee();
  }, [id]);

  const loadEmployee = async () => {
    try {
      const snap = await getDoc(doc(db, "users", id));

      if (!snap.exists()) {
        Alert.alert("Not found", "Employee does not exist");
        router.back();
        return;
      }

      const data = snap.data();

      if (data.companyId !== companyId) {
        Alert.alert("Access denied");
        router.back();
        return;
      }

      setEmployee({ id: snap.id, ...data });

    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOAD TRANSACTIONS ================= */
  useEffect(() => {
    if (!employee || !companyId) return;

    const q = query(
      collection(db, "transactions"),
      where("companyId", "==", companyId),
      where("enteredBy", "==", employee.id) // 🔥 BEST FILTER
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const sorted = list.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setTransactions(sorted);
    });

    return () => unsub();

  }, [employee, companyId]);

  /* ================= SEARCH FILTER ================= */
  const filtered = transactions.filter((t) => {
    const text = search.toLowerCase();

    return (
      t.title?.toLowerCase().includes(text) ||
      t.customerName?.toLowerCase().includes(text) ||
      t.type?.toLowerCase().includes(text)
    );
  });

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!employee) return null;

  /* ================= TRANSACTION CARD ================= */
  const renderTransaction = ({ item }) => {
    // const isIncome = item.type === "income";
    const isPositive =
  item.type === "advance payment" ||
  item.type === "prepay" ||
  item.type === 'payment' ;

const isNegative =
  item.type === "credit";

    const date = item.createdAt?.toDate
      ? item.createdAt.toDate().toLocaleDateString()
      : "";

    return (
      <Pressable
        style={styles.txCard}
        onPress={() =>
          router.push(`/manager/transactionDetail?id=${item.id}`)
        }
      >
        <View>
          <Text style={styles.txTitle}>
            {item.title || "Transaction"}
          </Text>

          <Text style={styles.txSub}>
            {item.customerName || "No customer"} • {item.method || "N/A"}
          </Text>

          <Text style={styles.txMeta}>
            {item.enteredByRole} • {date}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={[
              styles.amount,
              { color: isPositive ? "#16a34a" : "#dc2626" },
            ]}
          >
            AED {Number(item.amount).toLocaleString()}
          </Text>

          <View
            style={[
              styles.badge,
              { backgroundColor: isPositive ? "#dcfce7" : "#fee2e2" },
            ]}
          >
            <Text
              style={{
                color: isPositive ? "#16a34a" : "#dc2626",
                fontSize: 11,
                fontWeight: "600",
              }}
            >
              {item.type}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require("../../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Employee Details</Text>
      </View>

      {/* PROFILE */}
      <View style={styles.card}>
        <Text style={styles.name}>{employee.name}</Text>
        <Text style={styles.role}>{employee.role}</Text>

        <View style={styles.meta}>
          <Text style={styles.metaText}>{employee.email}</Text>
          {employee.phoneNumber && (
            <Text style={styles.metaText}>{employee.phoneNumber}</Text>
          )}
          <Text style={styles.metaText}>
            Status: {employee.status || "active"}
          </Text>
        </View>
      </View>

      {/* SEARCH */}
      <TextInput
        placeholder="Search transactions..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      {/* LIST */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              No transactions found
            </Text>
            <Text style={styles.emptySub}>
              Transactions entered by this employee will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fb", padding: 16 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "center",
  },

  logo: { width: 90, height: 90, marginRight: 10, borderRadius:50 },

  title: { fontSize: 22, fontWeight: "700", color: "#111827" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },

  name: { fontSize: 18, fontWeight: "600" },

  role: {
    fontSize: 14,
    color: "#2563eb",
    marginTop: 4,
    textTransform: "capitalize",
  },

  meta: { marginTop: 10 },

  metaText: { fontSize: 13, color: "#6b7280" },

  search: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    backgroundColor: "#fff",
  },

  txCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  txTitle: { fontWeight: "600" },

  txSub: { color: "#6b7280", fontSize: 12 },

  txMeta: { fontSize: 11, color: "#9ca3af", marginTop: 2 },

  amount: { fontWeight: "700" },

  badge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  emptyBox: { alignItems: "center", marginTop: 40 },

  emptyText: { fontSize: 16, fontWeight: "600" },

  emptySub: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 6,
    textAlign: "center",
  },
});