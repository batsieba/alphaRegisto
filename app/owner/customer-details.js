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

export default function OwnerCustomerDetails() {

  const { id } = useLocalSearchParams();

  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [openBalance, setOpenBalance] = useState(0);

  /* ================= FETCH CUSTOMER ================= */

  useEffect(() => {
    if (!id) return;

    const fetchCustomer = async () => {
      const snap = await getDoc(doc(db, "company_customers", id));
      if (snap.exists()) {
        setCustomer({ id: snap.id, ...snap.data() });
      }
    };

    fetchCustomer();
  }, [id]);

  /* ================= FETCH TRANSACTIONS ================= */

  useEffect(() => {
    if (!customer?.customerUid) return;

    const q = query(
      collection(db, "transactions"),
      where("customerUid", "==", customer.customerUid)
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

      /* Calculate Open Balance */
      let balance = 0;

      list.forEach(tx => {
        if (tx.type === "invoice") {
          balance += tx.amount || 0;
        } else if (tx.type === "payment" || tx.type === "credit" || tx.type === "advance") {
          balance -= tx.amount || 0;
        }
      });

      setOpenBalance(balance);
    });

    return () => unsubscribe();
  }, [customer]);

  if (!customer) {
    return (
      <View style={styles.center}>
        <Text>Loading customer...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Customer Details</Text>
      </View>

      {/* ================= OVERVIEW CARD ================= */}
      <View style={styles.card}>

        <Text style={styles.name}>
          {customer.customerName}
        </Text>

        <Text style={styles.meta}>
          📞 {customer.customerPhone || "No phone"}
        </Text>

        {customer.customerEmail && (
          <Text style={styles.meta}>
            ✉️ {customer.customerEmail}
          </Text>
        )}

        <Text style={styles.meta}>
          🏢 {customer.companyName || "—"}
        </Text>

        <Text style={styles.meta}>
          👤 {customer.companyOwner || "—"}
        </Text>

        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Open Balance</Text>
          <Text
            style={[
              styles.balanceValue,
              {
                color:
                  openBalance > 0
                    ? "#dc2626"
                    : openBalance < 0
                    ? "#16a34a"
                    : "#2563eb"
              }
            ]}
          >
            {openBalance}
          </Text>
        </View>
      </View>

      {/* ================= TRANSACTIONS ================= */}

      <Text style={styles.sectionTitle}>Transaction History</Text>

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
                {item.type === "invoice" ? "+" : "-"}{item.amount}
              </Text>
            </View>

            <Text style={styles.txMeta}>
              {item.createdAt
                ? new Date(item.createdAt.seconds * 1000).toLocaleDateString()
                : ""}
            </Text>

            {item.enteredByName && (
              <Text style={styles.txMeta}>
                Entered by: {item.enteredByName}
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No transactions yet
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
    marginBottom: 20,
    marginTop: 5,
  },
  logo: {
    width: 70,
    height: 70,
    marginRight: 10,
    borderRadius: 40
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
    marginBottom: 8
  },
  meta: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4
  },
  balanceContainer: {
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb"
  },
  balanceLabel: {
    fontSize: 14,
    color: "#6b7280"
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4
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