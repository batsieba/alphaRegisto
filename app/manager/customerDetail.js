import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  getDoc
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function CustomerDetail() {

  const { id } = useLocalSearchParams();
  const { companyId, loading } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [customer, setCustomer] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  /* ===== FETCH CUSTOMER INFO ===== */
  useEffect(() => {
    if (!id) return;

    const fetchCustomer = async () => {
      const ref = doc(db, "users", id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setCustomer(snap.data());
      }
    };

    fetchCustomer();
  }, [id]);

  /* ===== FETCH TRANSACTIONS ===== */
  useEffect(() => {
    if (!companyId || !id) return;

    const q = query(
      collection(db, "transactions"),
      where("companyId", "==", companyId),
      where("customerId", "==", id)
    );

    const unsub = onSnapshot(q, (snapshot) => {

      let sum = 0;

      const list = snapshot.docs.map((doc) => {
        const t = doc.data();
        const amt = Number(t.amount) || 0;

        if (t.type === "income") sum += amt;
        else sum -= amt;

        return {
          id: doc.id,
          ...t,
        };
      });

      const sorted = list.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setTransactions(sorted);
      setTotal(sum);
      setLoadingData(false);
    });

    return () => unsub();

  }, [companyId, id]);

  if (loading || loadingData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {customer?.name || customer?.email || "Customer"}
        </Text>

        <Text style={styles.total}>
          AED {total.toLocaleString()}
        </Text>
      </View>

      {/* TRANSACTIONS */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.type}>
                {item.type?.toUpperCase()}
              </Text>
              <Text style={styles.sub}>
                {item.enteredByEmail || "Unknown"}
              </Text>
            </View>

            <Text style={styles.amount}>
              AED {Number(item.amount).toLocaleString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No transactions
          </Text>
        }
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fb", padding: 16 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    marginBottom: 16,
  },

  title: { fontSize: 22, fontWeight: "700" },

  total: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 6,
  },

  row: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  type: { fontWeight: "600" },

  sub: { color: "#6b7280", fontSize: 12 },

  amount: { fontWeight: "700" },
});