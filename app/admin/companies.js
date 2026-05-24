import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  limit,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../../config/firebase";

/* ── helpers ── */
function formatDate(ts) {
  if (!ts?.toDate) return "Never";
  return ts.toDate().toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function timeAgo(ts) {
  if (!ts?.toDate) return "No activity";
  const seconds = Math.floor((Date.now() - ts.toDate().getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const FILTERS = ["All", "Active", "Inactive"];

/* ══════════════════════════════════════════════════════════ */
export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  /* company detail modal */
  const [selected, setSelected] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  /* ── load companies (real-time) ── */
  useEffect(() => {
    const q = query(collection(db, "companies"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setCompanies(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  /* ── filtered list ── */
  const filtered = companies.filter((c) => {
    const matchSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.companyId?.toLowerCase().includes(search.toLowerCase()) ||
      c.ownerName?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All" ||
      (filter === "Active" && c.status === "active") ||
      (filter === "Inactive" && c.status !== "active");
    return matchSearch && matchFilter;
  });

  /* ── KPI counts ── */
  const total = companies.length;
  const active = companies.filter((c) => c.status === "active").length;
  const inactive = total - active;

  /* ── open company detail ── */
  const openDetail = async (company) => {
    setSelected(company);
    setStats(null);
    setStatsLoading(true);
    try {
      const cid = company.companyId || company.id;

      const [staffSnap, txSnap, lastTxSnap] = await Promise.all([
        getCountFromServer(
          query(collection(db, "users"), where("companyId", "==", cid))
        ),
        getCountFromServer(
          query(collection(db, "transactions"), where("companyId", "==", cid))
        ),
        getDocs(
          query(
            collection(db, "transactions"),
            where("companyId", "==", cid),
            orderBy("createdAt", "desc"),
            limit(1)
          )
        ),
      ]);

      const lastActivity =
        lastTxSnap.docs[0]?.data()?.createdAt ?? null;

      setStats({
        staff: staffSnap.data().count,
        transactions: txSnap.data().count,
        lastActivity,
      });
    } catch (e) {
      console.error("Stats fetch error:", e);
      setStats({ staff: "—", transactions: "—", lastActivity: null });
    } finally {
      setStatsLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setStats(null);
  };

  /* ══════════════════════════════════════════════════════════ */
  return (
    <SafeAreaView style={styles.safe}>
      {/* ── header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Companies</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{total}</Text>
        </View>
      </View>

      {/* ── KPI row ── */}
      <View style={styles.kpiRow}>
        <KpiCard label="Total" value={total} color="#2563eb" />
        <KpiCard label="Active" value={active} color="#16a34a" />
        <KpiCard label="Inactive" value={inactive} color="#dc2626" />
      </View>

      {/* ── search bar ── */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, ID or owner…"
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </Pressable>
        )}
      </View>

      {/* ── filter tabs ── */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === f && styles.filterTabTextActive,
              ]}
            >
              {f}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── results label ── */}
      <Text style={styles.resultsLabel}>
        {filtered.length} {filtered.length === 1 ? "company" : "companies"}
        {filter !== "All" ? ` · ${filter}` : ""}
      </Text>

      {/* ── company list ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="business-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No companies found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => openDetail(item)}>
            {/* avatar initial */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(item.name || "?")[0].toUpperCase()}
              </Text>
            </View>

            {/* info */}
            <View style={styles.cardInfo}>
              <Text style={styles.cardName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.cardMeta}>ID: {item.companyId}</Text>
              {item.ownerName ? (
                <Text style={styles.cardMeta}>Owner: {item.ownerName}</Text>
              ) : null}
            </View>

            {/* right: status + chevron */}
            <View style={styles.cardRight}>
              <View
                style={[
                  styles.statusBadge,
                  item.status === "active"
                    ? styles.statusActive
                    : styles.statusInactive,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        item.status === "active" ? "#16a34a" : "#dc2626",
                    },
                  ]}
                >
                  {item.status ?? "inactive"}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color="#d1d5db"
                style={{ marginTop: 6 }}
              />
            </View>
          </Pressable>
        )}
      />

      {/* ══ COMPANY DETAIL MODAL ══ */}
      <Modal
        visible={!!selected}
        animationType="slide"
        transparent
        onRequestClose={closeDetail}
      >
        <Pressable style={styles.overlay} onPress={closeDetail} />

        <View style={styles.sheet}>
          {/* drag handle */}
          <View style={styles.handle} />

          {/* sheet header */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetAvatar}>
              <Text style={styles.sheetAvatarText}>
                {(selected?.name || "?")[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetName} numberOfLines={2}>
                {selected?.name}
              </Text>
              <Text style={styles.sheetId}>ID: {selected?.companyId}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                selected?.status === "active"
                  ? styles.statusActive
                  : styles.statusInactive,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      selected?.status === "active" ? "#16a34a" : "#dc2626",
                  },
                ]}
              >
                {selected?.status ?? "inactive"}
              </Text>
            </View>
          </View>

          {/* ── operational metrics ── */}
          <Text style={styles.sectionLabel}>Platform Usage</Text>

          {statsLoading ? (
            <View style={styles.statsLoading}>
              <ActivityIndicator color="#2563eb" />
              <Text style={styles.statsLoadingText}>Loading metrics…</Text>
            </View>
          ) : (
            <View style={styles.statsGrid}>
              <StatCard
                icon="people-outline"
                label="Staff Members"
                value={stats?.staff ?? "—"}
                color="#2563eb"
              />
              <StatCard
                icon="swap-horizontal-outline"
                label="Transactions"
                value={stats?.transactions ?? "—"}
                color="#7c3aed"
              />
              <StatCard
                icon="time-outline"
                label="Last Active"
                value={timeAgo(stats?.lastActivity)}
                color="#0891b2"
                small
              />
              <StatCard
                icon="calendar-outline"
                label="Registered"
                value={formatDate(selected?.createdAt)}
                color="#059669"
                small
              />
            </View>
          )}

          {/* ── owner info ── */}
          {selected?.ownerName ? (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>
                Account Info
              </Text>
              <View style={styles.infoRow}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color="#9ca3af"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.infoLabel}>Owner</Text>
                <Text style={styles.infoValue}>{selected.ownerName}</Text>
              </View>
            </>
          ) : null}

          {/* close */}
          <Pressable style={styles.closeBtn} onPress={closeDetail}>
            <Text style={styles.closeBtnText}>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ── sub-components ── */
function KpiCard({ label, value, color }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function StatCard({ icon, label, value, color, small }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text
        style={[styles.statValue, small && styles.statValueSmall]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f7fb" },

  /* header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 10,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#111827" },
  headerBadge: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  headerBadgeText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  /* KPI row */
  kpiRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  kpiValue: { fontSize: 24, fontWeight: "800" },
  kpiLabel: { fontSize: 11, color: "#6b7280", marginTop: 2, fontWeight: "500" },

  /* search */
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },

  /* filter tabs */
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterTabActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  filterTabText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  filterTabTextActive: { color: "#fff" },

  /* results */
  resultsLabel: {
    fontSize: 12,
    color: "#9ca3af",
    paddingHorizontal: 20,
    marginBottom: 8,
    fontWeight: "500",
  },

  /* list */
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },

  emptyWrap: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: { fontSize: 15, color: "#9ca3af" },

  /* company card */
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "800", color: "#2563eb" },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 3 },
  cardMeta: { fontSize: 12, color: "#6b7280", marginBottom: 1 },
  cardRight: { alignItems: "flex-end" },

  /* status badge */
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusActive: { backgroundColor: "#dcfce7" },
  statusInactive: { backgroundColor: "#fee2e2" },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },

  /* ── MODAL SHEET ── */
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },

  /* sheet header */
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 24,
  },
  sheetAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#eff6ff",
    justifyContent: "center", alignItems: "center",
  },
  sheetAvatarText: { fontSize: 22, fontWeight: "800", color: "#2563eb" },
  sheetName: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 2 },
  sheetId: { fontSize: 12, color: "#6b7280" },

  /* section label */
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  /* stats loading */
  statsLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 20,
  },
  statsLoadingText: { color: "#6b7280", fontSize: 14 },

  /* stats grid */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "47.5%",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22, fontWeight: "800", color: "#111827", marginBottom: 2,
  },
  statValueSmall: { fontSize: 15, fontWeight: "700" },
  statLabel: { fontSize: 12, color: "#6b7280" },

  /* info row */
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  infoLabel: { fontSize: 14, color: "#6b7280", flex: 1 },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#111827" },

  /* close button */
  closeBtn: {
    marginTop: 24,
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeBtnText: { fontSize: 15, fontWeight: "700", color: "#374151" },
});
