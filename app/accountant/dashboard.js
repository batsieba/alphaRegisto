import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Image,
} from "react-native";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";

export default function AccountantDashboard() {
  const { companyId } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);

  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      /* ================= TRANSACTIONS ================= */
      const txQuery = query(
        collection(db, "transactions"),
        where("companyId", "==", companyId)
      );

      const txSnap = await getDocs(txQuery);
      const transactions = txSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      let revenue = 0;
      transactions.forEach(tx => {
        revenue += Number(tx.amount || 0);
      });

      setTotalRevenue(revenue);
      setTotalTransactions(transactions.length);

      const sorted = transactions.sort(
        (a, b) => b.createdAt?.seconds - a.createdAt?.seconds
      );

      setRecentTransactions(sorted.slice(0, 5));

      /* ================= CUSTOMERS ================= */
      const custQuery = query(
        collection(db, "company_customers"),
        where("companyId", "==", companyId)
      );

      const custSnap = await getDocs(custQuery);
      setTotalCustomers(custSnap.size);

      /* ================= EMPLOYEES ================= */
      const empQuery = query(
        collection(db, "users"),
        where("companyId", "==", companyId)
      );

      const empSnap = await getDocs(empQuery);

      const employees = empSnap.docs.filter(
        d =>
          d.data().role === "salesperson" ||
          d.data().role === "manager"
      );

      setTotalEmployees(employees.length);

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
    <ScrollView style={styles.container}>

        <View style={styles.header}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title} >Accountant Dashboard</Text>
        </View>

      <Text style={styles.headerTxt}>Company Overview</Text>

      {/* KPI CARDS */}
      <View style={styles.kpiContainer}>
        <KPI title="Total Revenue" value={`$${totalRevenue}`} />
        <KPI title="Transactions" value={totalTransactions} />
        <KPI title="Customers" value={totalCustomers} />
        <KPI title="Employees" value={totalEmployees} />
      </View>

      {/* QUICK ACTIONS */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <Pressable style={styles.actionBtn} onPress={loadDashboard}>
        <Text style={styles.actionText}>Refresh Data</Text>
      </Pressable>

      {/* RECENT TRANSACTIONS */}
      <Text style={styles.sectionTitle}>Recent Transactions</Text>

      {recentTransactions.map(tx => (
        <Pressable
          key={tx.id}
          style={styles.txCard}
          onPress={() =>
            router.push({
              pathname: "/accountant/transaction-details",
              params: { id: tx.id },
            })
          }
        >
          <Text style={styles.txTitle}>
            {tx.customerName || "Customer"}
          </Text>
          <Text>${tx.amount} • {tx.method}</Text>
          <Text style={styles.txMeta}>
            Entered by: {tx.enteredByEmail}
          </Text>
        </Pressable>
      ))}

    </ScrollView>
  );
}

/* KPI COMPONENT */
function KPI({ title, value }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiTitle}>{title}</Text>
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

  headerTxt: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },

  kpiContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  kpiCard: {
    width: "48%",
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },

  kpiValue: {
    fontSize: 20,
    fontWeight: "700",
  },

  kpiTitle: {
    color: "#6b7280",
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
  },

  actionBtn: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  actionText: {
    color: "#fff",
    fontWeight: "600",
  },

  txCard: {
    backgroundColor: "#f9fafb",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },

  txTitle: {
    fontWeight: "600",
    fontSize: 15,
  },

  txMeta: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 4,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 12,marginTop: 20, backgroundColor: '#fff', borderRadius: 12,},
  logo: { width: 60, height: 60, marginRight: 12 , borderRadius: 12,},
  title: { fontSize: 22, fontWeight: "700" },
});
