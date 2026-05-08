import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  FlatList,
  Pressable,
  Image,
} from "react-native";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function SalesTransactions() {
  const { user, companyId, companyName } = useAuth();
  const router = useRouter();
  const { customerId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadTransactions();
  }, [customerId]);

  const loadTransactions = async () => {
    try {
      setLoading(true);

      let txQuery = query(
        collection(db, "transactions"),
        where("companyId", "==", companyId),
        where("enteredBy", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(txQuery);

      let list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Optional filter if coming from customer page
      if (customerId) {
        list = list.filter((t) => t.customerId === customerId);
      }

      setTransactions(list);
    } catch (e) {
      console.log("Transaction Load Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = transactions.filter(
    (t) =>
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      t.transactionId?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            {/* HEADER */}
            <View style={styles.header}>
                <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
                <Text style={styles.title}>My Transaction</Text>  
                
            
            </View>

            {/* SEARCH */}
            <TextInput
              style={styles.search}
              placeholder="Search transactions..."
              value={search}
              onChangeText={setSearch}
            />
          </>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              router.push({
                pathname:
                  "/salesperson/transaction-details",
                params: { id: item.id },
              })
            }
          >
            <View style={styles.rowBetween}>
              <Text style={styles.title}>
                {item.title}
              </Text>
              <Text style={styles.amount}>
                {item.amount} {item.currency}
              </Text>
            </View>

            <Text style={styles.sub}>
              Customer: {item.customerName || "N/A"}
            </Text>

            <Text style={styles.sub}>
              Method: {item.method}
            </Text>

            <Text style={styles.sub}>
              Date:{" "}
              {item.createdAt?.toDate
                ? item.createdAt
                    .toDate()
                    .toLocaleDateString()
                : ""}
            </Text>
          </Pressable>
        )}
      />

      {/* FLOATING BUTTON */}
      <Pressable
        style={styles.floatingBtn}
        onPress={() =>
          router.push("/salesperson/add-transaction")
        }
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  

  header: { flexDirection: "row", alignItems: "center", marginBottom: 12,marginTop: 20, backgroundColor: '#fff', borderRadius: 12,},
  logo: { width: 60, height: 60, marginRight: 12 , borderRadius: 12,},
  title: { fontSize: 22, fontWeight: "700" },
  search: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },

  card: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  title: {
    fontWeight: "700",
    fontSize: 15,
  },

  amount: {
    fontWeight: "700",
    color: "#2563eb",
  },

  sub: {
    color: "#6b7280",
    marginTop: 4,
  },

  floatingBtn: {
    position: "absolute",
    bottom: 25,
    right: 25,
    backgroundColor: "#2563eb",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
});
