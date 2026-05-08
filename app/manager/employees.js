import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function ManagerEmployees() {
  const router = useRouter();
  const { companyId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    if (!companyId) return;
    loadEmployees();
  }, [companyId]);

  const loadEmployees = async () => {
    try {
      setLoading(true);

      const q = query(
        collection(db, "users"),
        where("companyId", "==", companyId),
        where("role", "in", ["manager", "salesperson", "accountant"])
      );

      const snap = await getDocs(q);

      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setEmployees(list);
    } catch (e) {
      Alert.alert("Error", "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  /* ===== FILTERING ===== */
  const activeEmployees = employees.filter((e) => e.status === "active");
  const disabledEmployees = employees.filter((e) => e.status !== "active");

  const displayed =
    activeTab === "active" ? activeEmployees : disabledEmployees;

  /* ===== CARD ===== */
  const renderEmployee = ({ item }) => {
    const isActive = item.status === "active";

    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: "/manager/employee/[id]",
            params: { id: item.id },
          })
        }
      >
        {/* TOP ROW */}
        <View style={styles.row}>
          <Text style={styles.name}>
            {item.name || "Unnamed"}
          </Text>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isActive ? "#dcfce7" : "#fee2e2" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: isActive ? "#16a34a" : "#dc2626" },
              ]}
            >
              {isActive ? "Active" : "Disabled"}
            </Text>
          </View>
        </View>

        {/* ROLE */}
        <Text style={styles.role}>
          {item.role}
        </Text>

        {/* META */}
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            {item.email}
          </Text>

          {item.phoneNumber && (
            <Text style={styles.metaText}>
              {item.phoneNumber}
            </Text>
          )}
        </View>
      </Pressable>
    );
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
        <Text style={styles.title}>Employees</Text>
      </View>

      {/* TABS */}
      <View style={styles.tabs}>
        <Pressable
          onPress={() => setActiveTab("active")}
          style={[
            styles.tab,
            activeTab === "active" && styles.activeTab,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "active" && styles.activeTabText,
            ]}
          >
            Active ({activeEmployees.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("disabled")}
          style={[
            styles.tab,
            activeTab === "disabled" && styles.activeTab,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "disabled" && styles.activeTabText,
            ]}
          >
            Disabled ({disabledEmployees.length})
          </Text>
        </Pressable>
      </View>

      {/* LIST */}
      <FlatList
        data={displayed}
        keyExtractor={(item) => item.id}
        renderItem={renderEmployee}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No {activeTab} employees
          </Text>
        }
      />
    </View>
  );
}

/* ===== STYLES ===== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
    padding: 16,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  logo: {
    width: 90,
    height: 90,
    marginRight: 10,
    borderRadius:50,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  /* TABS */
  tabs: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    padding: 4,
  },

  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },

  activeTab: {
    backgroundColor: "#fff",
  },

  tabText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
  },

  activeTabText: {
    color: "#111827",
  },

  /* CARD */
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },

  role: {
    fontSize: 13,
    color: "#2563eb",
    marginTop: 4,
    textTransform: "capitalize",
    fontWeight: "500",
  },

  meta: {
    marginTop: 8,
  },

  metaText: {
    fontSize: 13,
    color: "#6b7280",
  },

  /* STATUS BADGE */
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: 40,
  },
});