import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";

export default function EmployeeDetail() {
  const { id } = useLocalSearchParams();
  const { companyId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      /* ================= EMPLOYEE INFO ================= */
      const empRef = doc(db, "users", id);
      const empSnap = await getDoc(empRef);

      if (empSnap.exists()) {
        setEmployee(empSnap.data());
      }

      /* ================= TRANSACTIONS ENTERED ================= */
      const txQuery = query(
        collection(db, "transactions"),
        where("companyId", "==", companyId),
        where("enteredBy", "==", id),
        orderBy("createdAt", "desc")
      );

      const txSnap = await getDocs(txQuery);

      let total = 0;

      const list = txSnap.docs.map(doc => {
        const data = doc.data();
        total += Number(data.amount || 0);
        return { id: doc.id, ...data };
      });

      setTransactions(list);
      setTotalAmount(total);

    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
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

      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Employee Details</Text>
      </View>

      {/* INFO CARD */}
      <View style={styles.infoCard}>
        <Text style={styles.name}>{employee?.name}</Text>
        <Text>Role: {employee?.role}</Text>
        <Text>Email: {employee?.email}</Text>
        <Text>Phone: {employee?.phoneNumber}</Text>
        <Text style={{ marginTop: 8, fontWeight: "600" }}>
          Total Transactions Amount: ${totalAmount}
        </Text>
      </View>

      {/* TRANSACTION LIST */}
      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text>No transactions entered.</Text>}
        renderItem={({ item }) => (
          <View style={styles.txCard}>
            <Text>{item.title || "Transaction"}</Text>
            <Text>${item.amount}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", marginTop: 20 },
  logo: { width: 110, height: 110, marginRight: 12 },
  title: { fontSize: 22, fontWeight: "700" },
  infoCard: {
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  name: { fontSize: 20, fontWeight: "700", marginBottom: 6 },
  txCard: {
    backgroundColor: "#f9fafb",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
