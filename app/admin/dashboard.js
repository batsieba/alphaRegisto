import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, getCountFromServer } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function AdminDashboard() {
  const { user } = useAuth();
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Admin";

  const [stats, setStats] = useState({
    totalCompanies: 0,
    activeCompanies: 0,
    pendingRequests: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pendingQ = query(
      collection(db, "company_requests"),
      where("status", "==", "pending")
    );

    const unsub = onSnapshot(pendingQ, async (pendingSnap) => {
      try {
        const [totalCompanies, activeCompanies, totalUsers] = await Promise.all([
          getCountFromServer(collection(db, "companies")),
          getCountFromServer(query(collection(db, "companies"), where("status", "==", "active"))),
          getCountFromServer(collection(db, "users")),
        ]);

        setStats({
          totalCompanies: totalCompanies.data().count,
          activeCompanies: activeCompanies.data().count,
          pendingRequests: pendingSnap.size,
          totalUsers: totalUsers.data().count,
        });
      } catch (error) {
        console.log("Dashboard stats error:", error.message);
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  const kpiCards = [
    { label: "Total Companies", value: stats.totalCompanies, icon: "business-outline",         color: "#2563eb", bg: "#eff6ff" },
    { label: "Active Companies", value: stats.activeCompanies, icon: "checkmark-circle-outline", color: "#16a34a", bg: "#f0fdf4" },
    { label: "Pending Requests", value: stats.pendingRequests, icon: "time-outline",             color: "#d97706", bg: "#fffbeb" },
    { label: "Total Users",      value: stats.totalUsers,      icon: "people-outline",            color: "#7c3aed", bg: "#f5f3ff" },
  ];

  const capabilities = [
    { icon: "checkmark-circle-outline", text: "Review and approve company signup requests", color: "#2563eb" },
    { icon: "add-circle-outline",        text: "Register new companies directly",            color: "#16a34a" },
    { icon: "business-outline",          text: "Monitor company activity and status",        color: "#7c3aed" },
    { icon: "people-outline",            text: "Oversee all platform users across companies", color: "#d97706" },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.displayName}>{displayName}</Text>
          </View>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#2563eb" />
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Platform Overview</Text>

        {/* KPI Grid */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <View style={styles.kpiGrid}>
            {kpiCards.map((card) => (
              <View key={card.label} style={styles.kpiCard}>
                <View style={[styles.kpiIcon, { backgroundColor: card.bg }]}>
                  <Ionicons name={card.icon} size={22} color={card.color} />
                </View>
                <Text style={[styles.kpiValue, { color: card.color }]}>{card.value}</Text>
                <Text style={styles.kpiLabel}>{card.label}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionLabel}>Admin Capabilities</Text>
        <View style={styles.infoCard}>
          {capabilities.map((item, i) => (
            <View key={i} style={styles.infoRow}>
              <View style={[styles.infoIconWrap, { backgroundColor: item.color + "18" }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={styles.infoText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f7fb" },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  greeting: { fontSize: 14, color: "#6b7280" },
  displayName: { fontSize: 26, fontWeight: "800", color: "#111827", marginTop: 2 },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  adminBadgeText: { fontSize: 13, fontWeight: "600", color: "#2563eb" },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 14,
  },

  loadingBox: { height: 180, justifyContent: "center", alignItems: "center" },

  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  kpiCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  kpiIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  kpiValue: { fontSize: 30, fontWeight: "800", marginBottom: 4 },
  kpiLabel: { fontSize: 13, color: "#6b7280" },

  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: { flex: 1, fontSize: 14, color: "#374151", lineHeight: 20 },
});
