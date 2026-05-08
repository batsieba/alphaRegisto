//accountant/customers
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  Pressable,
  Image,
} from "react-native";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";

export default function AccountantCustomers() {
  const { companyId } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);

      /* ================= FETCH CUSTOMERS ================= */
      const custQuery = query(
        collection(db, "company_customers"),
        where("companyId", "==", companyId)
      );

      const custSnap = await getDocs(custQuery);

      const customerList = custSnap.docs.map(doc => ({
        id: doc.id,
        // name:doc.data().customerName,
        ...doc.data(),
        totalAmount: 0,
        totalTransactions: 0,
      }));

      /* ================= FETCH TRANSACTIONS ================= */
      const txQuery = query(
        collection(db, "transactions"),
        where("companyId", "==", companyId)
      );

      const txSnap = await getDocs(txQuery);
      const transactions = txSnap.docs.map(doc => doc.data());

      /* ================= AGGREGATE ================= */
      const totalsMap = {};

      transactions.forEach(tx => {
        if (!totalsMap[tx.customerId]) {
          totalsMap[tx.customerId] = {
            amount: 0,
            count: 0,
          };
        }

        totalsMap[tx.customerId].amount += Number(tx.amount || 0);
        totalsMap[tx.customerId].count += 1;
      });

      /* ================= MERGE ================= */
      const merged = customerList.map(customer => ({
        ...customer,
        totalAmount: totalsMap[customer.id]?.amount || 0,
        totalTransactions: totalsMap[customer.id]?.count || 0,
      }));

      setCustomers(merged);
    //   console.log("CUSTOMERS:", merged);


    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

//   const filtered = customers.filter(c =>
//     c.name?.toLowerCase().includes(search.toLowerCase())
//   );

const filtered = customers.filter(c =>
  (c.customerName || "")
    .toLowerCase()
    .includes(search.toLowerCase())
);


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
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>Customers</Text>
        </View>

      

      {/* SEARCH */}
      <TextInput
        placeholder="Search customer..."
        style={styles.search}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/accountant/customer-detail",
                params: { id: item.id },
              })
            }
          >
            <Text style={styles.name}>{item.customerName}</Text>
            <Text>ID: {item.customerId}</Text>
            <Text>Total Transactions: {item.totalTransactions}</Text>
            <Text>Total Amount: ${item.totalAmount}</Text>
            <Text>Open Balance: ${item.openBalance || 0}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  search: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  name: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 6,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 12,marginTop: 20, backgroundColor: '#fff', borderRadius: 12,},
  logo: { width: 110, height: 110, marginRight: 12 , borderRadius: 12,},
  title: { fontSize: 22, fontWeight: "700" },
});
