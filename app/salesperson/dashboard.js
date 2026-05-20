import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  FlatList,
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
import { NotificationBell } from "../../components/NotificationBell";

export default function SalesDashboard() {
  const { user, companyId } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [kpis, setKpis] = useState({
    todayTotal: 0,
    lastTransaction: 0,
    activeCustomers: 0,
    todayTransactions: 0,
  });

  const [recentCustomers, setRecentCustomers] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const txQuery = query(
        collection(db, "transactions"),
        where("enteredBy", "==", user.uid),
        where("companyId", "==", companyId),
        orderBy("createdAt", "desc")
      );

      const txSnap = await getDocs(txQuery);

      let todayTotal = 0;
      let todayTransactions = 0;
      let lastTransaction = 0;
      const customerMap = {};

      txSnap.docs.forEach((docSnap, index) => {
        const data = docSnap.data();
        const created =
          data.createdAt?.toDate?.() || new Date(data.createdAt);

        if (index === 0) {
          lastTransaction = Number(data.amount || 0);
        }

        if (created >= today) {
          todayTotal += Number(data.amount || 0);
          todayTransactions++;
        }

        if (!customerMap[data.customerId]) {
          customerMap[data.customerId] = {
            customerId: data.customerId,
            amount: data.amount,
          };
        }
      });

      setKpis({
        todayTotal,
        lastTransaction,
        activeCustomers: Object.keys(customerMap).length,
        todayTransactions,
      });

      setRecentCustomers(Object.values(customerMap).slice(0, 5));

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
    <FlatList
      data={recentCustomers}
      keyExtractor={(item) => item.customerId}
      ListHeaderComponent={
        <>
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>Sales Dashboard</Text>
          </View>
          <NotificationBell />
        </View>

          <TextInput
            style={styles.search}
            placeholder="Search..."
            value={search}
            onChangeText={setSearch}
          />

          <View style={styles.kpiRow}>
            <KpiCard title="Collected Today" value={kpis.todayTotal} />
            <KpiCard title="Last Transaction" value={kpis.lastTransaction} />
          </View>

          <View style={styles.kpiRow}>
            <KpiCard title="Active Customers" value={kpis.activeCustomers} />
            <KpiCard title="Transactions Today" value={kpis.todayTransactions} />
          </View>

          <View style={styles.actions}>
            <Pressable
              style={styles.primaryBtn}
              onPress={() =>
                router.push("/salesperson/add-transaction")
              }
            >
              <Text style={styles.primaryText}>+ Add Transaction</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryBtn}
              onPress={() =>
                router.push("/salesperson/customers")
              }
            >
              <Text style={styles.secondaryText}>
                View Customers
              </Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>
            Recent Customers
          </Text>
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.customerCard}>
          <Text style={styles.customerText}>
            Customer: {item.customerId}
          </Text>
          <Text style={styles.customerSub}>
            Last Amount: {item.amount}
          </Text>
        </View>
      )}
      contentContainerStyle={{ padding: 16 }}
    />
  );
}

/* COMPONENT */
function KpiCard({ title, value }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiTitle}>{title}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  search: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },

  kpiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  kpiCard: {
    backgroundColor: "#f9fafb",
    width: "48%",
    padding: 16,
    borderRadius: 14,
  },

  kpiTitle: { fontSize: 13, color: "#6b7280" },

  kpiValue: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 6,
  },

  actions: { marginVertical: 16 },

  primaryBtn: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 10,
  },

  primaryText: { color: "#fff", fontWeight: "700" },

  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#2563eb",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  secondaryText: {
    color: "#2563eb",
    fontWeight: "700",
  },

  sectionTitle: {
    fontWeight: "700",
    marginBottom: 12,
    fontSize: 16,
  },

  customerCard: {
    backgroundColor: "#f3f4f6",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },

  customerText: { fontWeight: "600" },

  customerSub: { color: "#6b7280", marginTop: 4 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: 20, backgroundColor: '#fff', borderRadius: 12, paddingRight: 4 },
  logo: { width: 60, height: 60, marginRight: 12 , borderRadius: 12,},
  title: { fontSize: 22, fontWeight: "700" },
});
