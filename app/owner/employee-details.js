import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  FlatList
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";


export default function EmployeeDetails() {

  const { id } = useLocalSearchParams();
  const { companyId } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [totalCollected, setTotalCollected] = useState(0);

  /* ================= FETCH EMPLOYEE ================= */

  useEffect(() => {
    if (!id) return;

    const fetchEmployee = async () => {
      const snap = await getDoc(doc(db, "users", id));
      if (snap.exists()) {
        setEmployee({ id: snap.id, ...snap.data() });
      }
    };

    fetchEmployee();
  }, [id]);

  /* ================= FETCH TRANSACTIONS ================= */

  useEffect(() => {
    if (!id || !companyId) return;

    const q = query(
  collection(db, "transactions"),
  where("companyId", "==", companyId),
  where("enteredBy", "==", id)
);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort latest first
      list.sort((a, b) =>
        (b.createdAt?.seconds || 0) -
        (a.createdAt?.seconds || 0)
      );

      setTransactions(list);

      // Calculate total collected
      let total = 0;

      list.forEach(tx => {
        if (tx.type === "payment" || tx.type === "advance" || tx.type === "credit") {
          total += tx.amount || 0;
        }
      });

      setTotalCollected(total);
    });

    return () => unsubscribe();
  }, [id, companyId]);

  if (!employee) {
    return (
      <View style={styles.center}>
        <Text>Loading employee...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/logo.png')}
          resizeMode="contain"
          style={styles.logo}
        />
        <Text style={styles.title}>Employee Details</Text>
      </View>

      {/* ================= EMPLOYEE CARD ================= */}

      <View style={styles.card}>

        <Text style={styles.name}>{employee.name}</Text>
        <Text style={styles.meta}>{employee.email}</Text>

        <View style={styles.roleChip}>
          <Text style={styles.roleText}>{employee.role}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            employee.status === "disabled" && styles.statusDisabled,
          ]}
        >
          <Text style={styles.statusText}>
            {employee.status === "active" ? "Active" : "Disabled"}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.summaryText}>
          Transactions Handled: {transactions.length}
        </Text>

        <Text style={styles.summaryText}>
          Total Collected: {totalCollected}
        </Text>

      </View>

      {/* ================= TRANSACTION HISTORY ================= */}

      <Text style={styles.sectionTitle}>
        Transaction History
      </Text>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.txCard}>
            <View style={styles.txRow}>
              <Text style={styles.txType}>
                {item.type?.toUpperCase()}
              </Text>
              <Text
                style={[
                  styles.txAmount,
                  {
                    color:
                      item.type === "invoice"
                        ? "#dc2626"
                        : "#16a34a"
                  }
                ]}
              >
                {item.amount}
              </Text>
            </View>

            {item.customerName && (
              <Text style={styles.txMeta}>
                Customer: {item.customerName}
              </Text>
            )}

            <Text style={styles.txMeta}>
              {item.createdAt
                ? new Date(item.createdAt.seconds * 1000).toLocaleDateString()
                : ""}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No transactions handled yet.
          </Text>
        }
      />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 20
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20
  },
  logo: {
    width: 70,
    height: 70,
    marginRight: 10
  },
  title: {
    fontSize: 20,
    fontWeight: "700"
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 18,
    marginBottom: 25,
    elevation: 3
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6
  },
  meta: {
    fontSize: 14,
    color: "#6b7280"
  },
  roleChip: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#e0e7ff"
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3730a3"
  },
  statusBadge: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#dcfce7"
  },
  statusDisabled: {
    backgroundColor: "#fee2e2"
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#166534"
  },
  divider: {
    marginVertical: 15,
    height: 1,
    backgroundColor: "#e5e7eb"
  },
  summaryText: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12
  },
  txCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 2
  },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6
  },
  txType: {
    fontWeight: "600"
  },
  txAmount: {
    fontWeight: "700"
  },
  txMeta: {
    fontSize: 13,
    color: "#6b7280"
  },
  empty: {
    textAlign: "center",
    marginTop: 20,
    color: "#9ca3af"
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  }
});