import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import { db } from "../../config/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function OwnerCustomers() {

//   const { user } = useAuth();
  const { companyId, loading } = useAuth();
  const router = useRouter();

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");

//   useEffect(() => {
//     if (!user?.companyId) return;

//     const q = query(
//       collection(db, "company_customers"),
//       where("companyId", "==", user.companyId),
//       orderBy("createdAt", "desc")
//     );

//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const list = snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       }));
//       setCustomers(list);
//     });

//     return () => unsubscribe();
//   }, [user]);


  useEffect(() => {
  if (loading) return;
  if (!companyId) return;

  const q = query(
    collection(db, "company_customers"),
    where("companyId", "==", companyId),
    orderBy("createdAt", "desc")
    
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

//      list.sort((a, b) =>
//     (b.createdAt?.seconds || 0) -
//     (a.createdAt?.seconds || 0)
//   );

    setCustomers(list);
  });

  return () => unsubscribe();
}, [companyId, loading]);


  const filteredCustomers = customers.filter(customer =>
    customer.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    customer.customerPhone?.includes(search) ||
    customer.customerEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/logo.png')}
          resizeMode="contain"
          style={styles.logo}
        />
        <View>
          <Text style={styles.title}>Customers</Text>
          <Text style={styles.subtitle}>
            Manage your company clients
          </Text>
        </View>
      </View>

      {/* SEARCH */}
      <TextInput
        placeholder="Search by name, phone, or email..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      {/* CUSTOMER LIST */}
      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              router.push(`/owner/customer-details?id=${item.id}`)
            }
          >
            <View style={styles.cardHeader}>
              <Text style={styles.name}>
                {item.customerName || "Unnamed Customer"}
              </Text>

              {item.totalAmount !== undefined && (
                <Text
                  style={[
                    styles.balance,
                    {
                      color:
                        item.totalAmount > 0
                          ? "#dc2626"
                          : item.totalAmount < 0
                          ? "#16a34a"
                          : "#2563eb"
                    }
                  ]}
                >
                  {item.totalAmount}
                </Text>
              )}
            </View>

            <Text style={styles.meta}>
              📞 {item.customerPhone || "No phone"}
            </Text>

            {item.customerEmail && (
              <Text style={styles.meta}>
                ✉️ {item.customerEmail}
              </Text>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No customers found
          </Text>
        }
      />

    </View>
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
    width: 110,
    height: 110,
    marginRight: 12,
    borderRadius: 50
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827"
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280"
  },
  search: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    marginBottom: 18
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    elevation: 3
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827"
  },
  balance: {
    fontSize: 15,
    fontWeight: "700"
  },
  meta: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#9ca3af"
  }
});