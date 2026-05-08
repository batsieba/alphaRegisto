import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();

  const displayName =
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Admin";

  const [stats, setStats] = useState({
    totalCompanies: 0,
    activeCompanies: 0,
    pendingRequests: 0,
    totalUsers: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Total Companies
        const companiesSnap = await getDocs(collection(db, "companies"));

        // Active Companies
        const activeCompaniesSnap = await getDocs(
          query(collection(db, "companies"), where("status", "==", "active"))
        );

        // Pending Requests
        const pendingSnap = await getDocs(
          query(
            collection(db, "company_requests"),
            where("status", "==", "pending")
          )
        );

        // Total Users
        const usersSnap = await getDocs(collection(db, "users"));

        setStats({
          totalCompanies: companiesSnap.size,
          activeCompanies: activeCompaniesSnap.size,
          pendingRequests: pendingSnap.size,
          totalUsers: usersSnap.size,
        });
      } catch (error) {
        console.log("Admin dashboard stats error:", error.message);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Dashboard</Text>
      </View>

      {/* Greeting */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Welcome back, {displayName} 👋
        </Text>
        <Text style={styles.subtitle}>
          Here’s what’s happening on Alpha Registo today
        </Text>
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>
            {loading ? "—" : stats.totalCompanies}
          </Text>
          <Text style={styles.kpiLabel}>Total Companies</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>
            {loading ? "—" : stats.activeCompanies}
          </Text>
          <Text style={styles.kpiLabel}>Active Companies</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>
            {loading ? "—" : stats.pendingRequests}
          </Text>
          <Text style={styles.kpiLabel}>Pending Requests</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>
            {loading ? "—" : stats.totalUsers}
          </Text>
          <Text style={styles.kpiLabel}>Total Users</Text>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>What you can do</Text>
        <Text style={styles.infoText}>
          • Review company signup requests{"\n"}
          • Register new companies{"\n"}
          • Monitor active companies{"\n"}
          • Track system usage (coming later)
        </Text>
      </View>

    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    padding: 20,
    
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 16,
  },
  
  /* Top bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    
  },
  logo: {
    width: 110,
    height: 110,
  },

  /* Header */
  header: {
    marginBottom: 28,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  kpiCard: {
    width: "48%",
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: 'center'
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2563eb",
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 14,
    color: "#374151",
  },
  infoBox: {
    marginTop: 20,
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e3a8a",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#1e40af",
    lineHeight: 22,
  },
});
