import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Image } from "react-native";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";

/* =========================
   STATUS BADGE
========================= */
const StatusBadge = ({ type }) => {

  const color =
    type === "income"
      ? "#16a34a"
      : type === "expense"
      ? "#dc2626"
      : "#2563eb";

  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>
        {type?.toUpperCase()}
      </Text>
    </View>
  );
};

export default function CustomerTransaction() {

  const { user } = useAuth();
  const navigation = useNavigation();

  const router = useRouter();

  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  /* =========================
      LOAD TRANSACTIONS
  ========================== */
  useEffect(() => {

    if (!user?.uid) return;

    const q = query(
      collection(db, "transactions"),
      where("customerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setTransactions(data);
      setLoading(false);
    });

    return () => unsubscribe();

  }, [user]);

  /* =========================
      SEARCH FILTER
  ========================== */
  const filteredTransactions = transactions.filter((t) =>
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.transactionId?.toLowerCase().includes(search.toLowerCase())
  );

  /* =========================
      RENDER ITEM
  ========================== */
  const renderItem = ({ item }) => {

    const date = item.createdAt?.toDate
      ? item.createdAt.toDate().toLocaleDateString()
      : "";

    return (
      <Pressable
        style={styles.card}
        // onPress={() =>
        //   navigation.navigate("transactionDetail", { transaction: item })
        // }
        onPress={() =>
        router.push(`/customer/transactionDetail?id=${item.id}`)
        }
      >

        <View style={styles.row}>
          <Text style={styles.company}>
            {item.title || "Transaction"}
          </Text>
          <StatusBadge type={item.type} />
        </View>

        <Text style={styles.ref}>
          {item.transactionId}
        </Text>

        <View style={styles.row}>
          <Text style={styles.amount}>
            {item.currency} {Number(item.amount).toLocaleString()}
          </Text>
          <Text style={styles.date}>{date}</Text>
        </View>

      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Image
          style={styles.logo}
          source={require("../../assets/logo.png")}
          resizeMode="contain"
        />
        <Text style={styles.title}>Transactions</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#6b7280" />
        <TextInput
          placeholder="Search transactions..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No Transactions Found.</Text>
        }
      />

    </View>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fb", padding: 16 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16
  },

  logo: { width: 90, height: 90, marginRight: 12, borderRadius: 50, },

  title: { fontSize: 22, fontWeight: "700" },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    backgroundColor: "#fff"
  },

  searchInput: { marginLeft: 8, flex: 1 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },

  company: { fontWeight: "600", fontSize: 15 },

  ref: { marginTop: 6, color: "#6b7280" },

  amount: { fontSize: 16, fontWeight: "700", marginTop: 4 },

  date: { color: "#6b7280", marginTop: 10 },

  badge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999
  },

  badgeText: { fontSize: 12, fontWeight: "600" },

  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: 40
  }
});