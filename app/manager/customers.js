import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image
} from "react-native";
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";

export default function Customers() {
  const { companyId, loading } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const router = useRouter();

  useEffect(() => {
    if (!companyId) return;

    /* ===== FETCH CUSTOMERS (users with role=customer) ===== */
    const qUsers = query(
      collection(db, "users"),
      where("companyId", "==", companyId),
      where("role", "==", "customer")
    );

    let customersList = [];

    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      customersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        total: 0,
      }));

      setCustomers(customersList);
      setLoadingData(false);
    });

    /* ===== FETCH TRANSACTIONS ===== */
    const qTx = query(
      collection(db, "transactions"),
      where("companyId", "==", companyId)
    );

    const unsubTx = onSnapshot(qTx, (snapshot) => {

      const totalsMap = {};

      snapshot.docs.forEach((doc) => {
        const t = doc.data();

        if (!t.customerId) return;

        const amt = Number(t.amount) || 0;

        if (!totalsMap[t.customerId]) {
          totalsMap[t.customerId] = 0;
        }

        if (t.type === "income") {
          totalsMap[t.customerId] += amt;
        } else {
          totalsMap[t.customerId] -= amt;
        }
      });

      setCustomers((prev) =>
        prev.map((c) => ({
          ...c,
          total: totalsMap[c.id] || 0,
        }))
      );
    });

    return () => {
      unsubUsers();
      unsubTx();
    };

  }, [companyId]);

  if (loading || loadingData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={customers}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
            <Image source={require('../../assets/logo.png')} resizeMode="contain" style={styles.logo} />
            <Text style={styles.title}>Customers</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() =>
            router.push(`/manager/customerDetail?id=${item.id}`)
          }
        >
          <View>
            <Text style={styles.name}>
              {item.name || item.email}
            </Text>
            <Text style={styles.sub}>
              Net Balance
            </Text>
          </View>

          <Text style={styles.amount}>
            AED {item.total.toLocaleString()}
          </Text>
        </Pressable>
      )}
      ListEmptyComponent={
        <Text style={{ textAlign: "center", marginTop: 20 }}>
          No customers found
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fb", padding: 16 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header:{
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  logo:{
    height: 90,
    width: 90,
    marginRight: 12,
    borderRadius: 50,
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  name: { fontSize: 16, fontWeight: "600" },

  sub: { color: "#6b7280", fontSize: 12 },

  amount: { fontWeight: "700", fontSize: 16 },
});