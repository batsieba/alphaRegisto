import { Pressable, View, Text, StyleSheet } from "react-native";

function timeAgo(timestamp) {
  if (!timestamp?.toDate) return "";
  const seconds = Math.floor((Date.now() - timestamp.toDate().getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationItem({ item, onPress }) {
  const unread = !item.isRead;

  return (
    <Pressable
      style={[styles.card, unread ? styles.cardUnread : styles.cardRead]}
      onPress={onPress}
    >
      {/* Unread dot */}
      {unread && <View style={styles.dot} />}

      {/* Row 1: title + timestamp */}
      <View style={styles.row}>
        <Text style={[styles.title, unread && styles.titleUnread]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
      </View>

      {/* Row 2: amount + method */}
      <View style={styles.row}>
        <Text style={styles.amount}>
          {item.currency} {Number(item.amount).toLocaleString()}
        </Text>
        {item.method ? (
          <Text style={styles.method}>{item.method}</Text>
        ) : null}
      </View>

      {/* Row 3: customer + transactionNo */}
      <View style={styles.row}>
        <Text style={styles.customer} numberOfLines={1}>
          {item.customerName || ""}
        </Text>
        {item.transactionNo ? (
          <Text style={styles.txNo}>#{item.transactionNo}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardUnread: {
    borderLeftColor: "#2563eb",
  },
  cardRead: {
    borderLeftColor: "transparent",
  },
  dot: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563eb",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
    marginRight: 8,
  },
  titleUnread: {
    color: "#111827",
    fontWeight: "700",
  },
  time: {
    fontSize: 11,
    color: "#9ca3af",
  },
  amount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2563eb",
  },
  method: {
    fontSize: 12,
    color: "#6b7280",
    textTransform: "capitalize",
  },
  customer: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
    marginRight: 8,
  },
  txNo: {
    fontSize: 12,
    color: "#9ca3af",
  },
});
