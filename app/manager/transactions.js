import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Pressable,
  Image
} from "react-native";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";

export default function Transactions() {
  const { companyId, loading } = useAuth();
  const router = useRouter();

  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  /* ================= LOAD TRANSACTIONS ================= */
  useEffect(() => {
    if (!companyId) return;

    const q = query(
      collection(db, "transactions"),
      where("companyId", "==", companyId)
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
      setLoadingData(false);
    });

    return () => unsub();
  }, [companyId]);

  /* ================= SEARCH ================= */
  const filtered = transactions.filter((t) => {
    const text = search.toLowerCase();

    return (
      t.title?.toLowerCase().includes(text) ||
      t.customerName?.toLowerCase().includes(text) ||
      t.method?.toLowerCase().includes(text)
    );
  });

  /* ================= FINANCIAL LOGIC ================= */
  const getImpact = (t) => {
    if (t.type === "credit") return "negative";
    if (t.type === "advance payment") return "positive";
    if (t.type === "prepay") return "positive";
    if (t.type === 'payment') return 'positive';

    // fallback
    if (t.type === "income") return "positive";
    return "negative";
  };

  /* ================= LOADING ================= */
  if (loading || loadingData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /* ================= CARD ================= */
  const renderItem = ({ item }) => {
    const impact = getImpact(item);

    const date = item.createdAt?.toDate
      ? item.createdAt.toDate().toLocaleDateString()
      : "";

    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          router.push(`/manager/transactionDetail?id=${item.id}`)
        }
      >
        <View>
          <Text style={styles.title}>
            {item.title || "Transaction"}
          </Text>

          <Text style={styles.sub}>
            {item.customerName || "No customer"} • {item.method}
          </Text>

          <Text style={styles.meta}>
            {item.enteredByEmail} • {date}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={[
              styles.amount,
              {
                color:
                  impact === "positive" ? "#16a34a" : "#dc2626",
              },
            ]}
          >
            AED {Number(item.amount).toLocaleString()}
          </Text>

          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  impact === "positive"
                    ? "#dcfce7"
                    : "#fee2e2",
              },
            ]}
          >
            <Text
              style={{
                color:
                  impact === "positive"
                    ? "#16a34a"
                    : "#dc2626",
                fontSize: 11,
                fontWeight: "600",
              }}
            >
              {item.method}
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
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.pageTitle}>Transactions</Text>
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
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No transactions found
          </Text>
        }
      />

      {/* FLOATING BUTTON */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push("/manager/add-transaction")}
      >
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
    padding: 16,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },

  search: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    backgroundColor: "#fff",
  },

  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  title: {
    fontWeight: "600",
    fontSize: 14,
  },

  sub: {
    color: "#6b7280",
    fontSize: 12,
  },

  meta: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },

  amount: {
    fontWeight: "700",
    fontSize: 14,
  },

  badge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#6b7280",
  },

  /* FAB */
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#2563eb",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  fabText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "600",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  logo: {
    width: 90,
    height: 90,
    marginRight: 10,
    borderRadius:50,
  },
});