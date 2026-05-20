import { useRouter } from "expo-router";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator
} from "react-native";
import { NotificationBell } from "../../components/NotificationBell";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";

/* ================= KPI CARD ================= */
function KpiCard({ label, value }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  );
}

/* ================= TRANSACTION ROW ================= */
function TransactionRow({ item, onPress }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View>
        <Text style={styles.rowTitle}>
          {item.customerName || "No Customer"}
        </Text>

        <Text style={styles.rowSub}>
          {item.type?.toUpperCase()} • {item.enteredByEmail || "Unknown"}
        </Text>
      </View>

      <Text style={styles.amount}>
        AED {Number(item.amount).toLocaleString()}
      </Text>
    </Pressable>
  );
}

export default function ManagerDashboard() {

  const router = useRouter();
  const { companyId, loading } = useAuth();

  const [kpis, setKpis] = useState({
    transactions: 0,
    income: 0,
    expense: 0,
    employees: 0,
  });

  const [recentTransactions, setRecentTransactions] = useState([]);

  /* ================= FETCH DATA ================= */
  useEffect(() => {

    if (!companyId) return;

    /* ===== TRANSACTIONS ===== */
    const q = query(
      collection(db, "transactions"),
      where("companyId", "==", companyId)
    );

    const unsubTx = onSnapshot(q, (snapshot) => {

      let total = 0;
      let income = 0;
      let expense = 0;

      const temp = [];

      snapshot.docs.forEach((doc) => {
        const t = doc.data();

        total++;

        const amt = Number(t.amount) || 0;

        if (t.type === "income") income += amt;
        else expense += amt;

        temp.push({
          id: doc.id,
          ...t,
        });
      });

      /* sort by latest */
      const sorted = temp
        .sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        })
        .slice(0, 5);

      setRecentTransactions(sorted);

      setKpis((prev) => ({
        ...prev,
        transactions: total,
        income,
        expense,
      }));

    });

    /* ===== EMPLOYEES (ONLY ACTIVE) ===== */
    const qUsers = query(
      collection(db, "users"),
      where("companyId", "==", companyId),
      where("status", "==", "active")
    );

    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      setKpis((prev) => ({
        ...prev,
        employees: snapshot.size,
      }));
    });

    return () => {
      unsubTx();
      unsubUsers();
    };

  }, [companyId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Manager Dashboard</Text>
        </View>
        <NotificationBell />
      </View>

      <Text style={styles.subtitle}>
        Live overview of your company performance
      </Text>

      {/* KPI */}
      <View style={styles.kpiRow}>
        <KpiCard label="Transactions" value={kpis.transactions} />
        <KpiCard label="Income" value={`AED ${kpis.income.toLocaleString()}`} />
        <KpiCard label="Expenses" value={`AED ${kpis.expense.toLocaleString()}`} />
        <KpiCard label="Employees" value={kpis.employees} />
      </View>

      {/* TOP ACTIVITY */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Text style={styles.sectionSub}>
          Latest transactions across your company
        </Text>

        {recentTransactions.length === 0 ? (
          <Text style={{ color: "#6b7280" }}>No transactions yet</Text>
        ) : (
          recentTransactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              item={tx}
              onPress={() =>
                router.push(`/manager/transactionDetail?id=${tx.id}`)
              }
            />
          ))
        )}
      </View>

      {/* ACTIONS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <Pressable
          style={styles.actionBtn}
          onPress={() => router.push("/manager/add-transaction")}
        >
          <Text style={styles.actionText}>➕ Add Transaction</Text>
        </Pressable>

        <Pressable
          style={styles.actionBtn}
          onPress={() => router.push("/manager/customers")}
        >
          <Text style={styles.actionText}>👥 View Customers</Text>
        </Pressable>

        <Pressable
          style={styles.actionBtnSecondary}
          onPress={() => router.push("/manager/transactions")}
        >
          <Text style={styles.actionTextSecondary}>
            📊 View All Transactions
          </Text>
        </Pressable>

      </View>

    </ScrollView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fb", padding: 20 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  logo: { width: 90, height: 90, marginRight: 12, borderRadius: 50 },

  title: { fontSize: 24, fontWeight: "700" },

  subtitle: {
    color: "#6b7280",
    marginBottom: 16,
    textAlign: "center",
  },

  kpiRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  kpiCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  kpiLabel: { color: "#6b7280", fontSize: 13 },

  kpiValue: { fontSize: 18, fontWeight: "700", marginTop: 6 },

  section: { marginBottom: 24 },

  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },

  sectionSub: {
    color: "#6b7280",
    marginBottom: 12,
    fontSize: 12,
  },

  row: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  rowTitle: { fontWeight: "600" },

  rowSub: { color: "#6b7280", fontSize: 12, marginTop: 2 },

  amount: { fontWeight: "700" },

  actionBtn: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    alignItems: "center",
  },

  actionText: { color: "#fff", fontWeight: "700" },

  actionBtnSecondary: {
    borderWidth: 1,
    borderColor: "#2563eb",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  actionTextSecondary: {
    color: "#2563eb",
    fontWeight: "700",
  },
});