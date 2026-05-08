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

export default function AccountantEmployees() {
  const { companyId } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);

      const empQuery = query(
        collection(db, "users"),
        where("companyId", "==", companyId)
      );

      const snap = await getDocs(empQuery);

      const list = snap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        // Exclude owner from list
        .filter(user => user.role !== "owner" && user.role !== 'customer');

      setEmployees(list);

    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = employees.filter(emp =>
    (emp.name || "")
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

      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Employees</Text>
      </View>

      {/* SEARCH */}
      <TextInput
        placeholder="Search employee..."
        style={styles.search}
        value={search}
        onChangeText={setSearch}
      />

      {/* LIST */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/accountant/employee-detail",
                params: { id: item.id },
              })
            }
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text>Role: {item.role}</Text>
            <Text>Email: {item.email}</Text>
            <Text>Status: {item.status}</Text>
          </Pressable>
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
  search: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginVertical: 16,
  },
  card: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  name: { fontWeight: "600", fontSize: 16, marginBottom: 4 },
});
