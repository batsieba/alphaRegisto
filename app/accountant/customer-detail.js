//accountant/customer-detail
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
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";

export default function CustomerDetail() {
  const { id } = useLocalSearchParams();
  const { companyId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [totalCredit, setTotalCredit] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);

//   useEffect(() => {
//     loadData();
//   }, []);

useEffect(() => {
  if (id) {
    loadData();
  }
}, [id]);


  const loadData = async () => {
    try {
      setLoading(true);

      /* ================= FETCH CUSTOMER ================= */
      const custRef = doc(db, "company_customers", id);
      const custSnap = await getDoc(custRef);

      if (custSnap.exists()) {
        setCustomer(custSnap.data());
      }

      /* ================= FETCH TRANSACTIONS ================= */
      const txQuery = query(
        collection(db, "transactions"),
        where("companyId", "==", companyId),
        where("customerId", "==", custSnap.data().customerId),
        orderBy("createdAt", "desc")
      );

      const txSnap = await getDocs(txQuery);

      let credit = 0;
      let payment = 0;

      const txList = txSnap.docs.map(doc => {
        const data = doc.data();

        if (data.type === "credit") {
          credit += Number(data.amount || 0);
        } else if (data.type === "payment") {
          payment += Number(data.amount || 0);
        }

        return {
          id: doc.id,
          ...data,
        };
      });

      setTransactions(txList);
      setTotalCredit(credit);
      setTotalPayment(payment);

    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const openBalance = totalCredit - totalPayment;

  const balanceColor =
    openBalance > 0
      ? "#dc2626"   // red (customer owes)
      : openBalance < 0
      ? "#16a34a"   // green (overpaid)
      : "#111827";  // neutral

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
            <Text style={styles.title}>Customer Details</Text>
        </View>

      {/* ================= CUSTOMER INFO ================= */}
      <View style={styles.summaryCard}>
      <Text style={styles.name}>{customer?.customerName}</Text>
      <Text>Email: {customer?.customerEmail}</Text>
      <Text>Phone Number: {customer?.customerPhone}</Text>

      {/* ================= SUMMARY CARD ================= */}
      
        <Text>Total Credits: ${totalCredit}</Text>
        <Text>Total Payments: ${totalPayment}</Text>

        <Text style={[styles.balance, { color: balanceColor }]}>
          Open Balance: ${openBalance}
        </Text>
      </View>

      {/* ================= TRANSACTION LIST ================= */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text>No transactions yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.txCard}>
            <Text style={{ fontWeight: "600" }}>
              {item.type?.toUpperCase()}
            </Text>

            <Text
              style={{
                color:
                  item.type === "credit"
                    ? "#dc2626"
                    : "#16a34a",
              }}
            >
              ${item.amount}
            </Text>
          </View>
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
  name: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  summaryCard: {
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  balance: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
  },
  txCard: {
    backgroundColor: "#f9fafb",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 3,marginTop: 20, backgroundColor: '#fff', borderRadius: 12,},
  logo: { width: 110, height: 110, marginRight: 12 , borderRadius: 12,},
  title: { fontSize: 22, fontWeight: "700" },
});
