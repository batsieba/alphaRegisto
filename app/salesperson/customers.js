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
import { useRouter } from "expo-router";

export default function SalesCustomers() {
  const { user, companyId } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);

      /* =============================
         1️⃣ GET COMPANY CUSTOMERS
      ============================= */
      const relationQuery = query(
        collection(db, "company_customers"),
        where("companyId", "==", companyId),
        where("employeeId", "==", user.uid)
      );

      const relationSnap = await getDocs(relationQuery);

      const customerList = relationSnap.docs.map((doc) => ({
        id: doc.data().customerId,
        name: doc.data().customerName || "No Name",
        email: doc.data().customerEmail || "",
        phone: doc.data().customerPhone || "",
      }));

      /* =============================
         2️⃣ GET SALESPERSON TRANSACTIONS
      ============================= */
      const txQuery = query(
        collection(db, "transactions"),
        where("companyId", "==", companyId),
        where("enteredBy", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const txSnap = await getDocs(txQuery);

      const txMap = {};

      txSnap.docs.forEach((doc) => {
        const data = doc.data();
        const created =
          data.createdAt?.toDate?.() || new Date(data.createdAt);

        if (!txMap[data.customerId]) {
          txMap[data.customerId] = {
            total: 0,
            lastDate: created,
          };
        }

        txMap[data.customerId].total += Number(data.amount || 0);

        if (created > txMap[data.customerId].lastDate) {
          txMap[data.customerId].lastDate = created;
        }
      });

      /* =============================
         3️⃣ MERGE DATA
      ============================= */
      const combined = customerList.map((customer) => ({
        ...customer,
        total: txMap[customer.id]?.total || 0,
        lastDate: txMap[customer.id]?.lastDate || null,
      }));

      setCustomers(combined);

    } catch (e) {
      console.log("Customer load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={
        <>
        <View style={styles.header}>
                    <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
                    <Text style={styles.title}>Customers</Text>
        
                </View>
        <TextInput
          style={styles.search}
          placeholder="Search customers..."
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
              pathname: "/(salesperson)/transactions",
              params: { customerId: item.id },
            })
          }
        >
          <Text style={styles.name}>{item.name}</Text>

          <Text style={styles.sub}>{item.email}</Text>
          <Text style={styles.sub}>{item.phone}</Text>

          <View style={styles.divider} />

          <Text style={styles.total}>
            Total: {item.total}
          </Text>

          <Text style={styles.sub}>
            Last Transaction:{" "}
            {item.lastDate
              ? item.lastDate.toLocaleDateString()
              : "No Transactions"}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

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

  name: {
    fontWeight: "700",
    fontSize: 16,
  },

  sub: {
    color: "#6b7280",
    marginTop: 4,
  },

  total: {
    fontWeight: "700",
    marginTop: 8,
  },

  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 8,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 12,marginTop: 20, backgroundColor: '#fff', borderRadius: 12,},
  logo: { width: 60, height: 60, marginRight: 12 , borderRadius: 12,},
  title: { fontSize: 22, fontWeight: "700" },
});
