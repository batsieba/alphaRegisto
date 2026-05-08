import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Pressable,
  Linking
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useEffect, useState } from "react";

export default function TransactionDetail() {

  const { id } = useLocalSearchParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     FETCH TRANSACTION
  ========================== */
  useEffect(() => {

    if (!id) return;

    const ref = doc(db, "transactions", id);

    const unsubscribe = onSnapshot(ref, (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      }
      setLoading(false);
    });

    return () => unsubscribe();

  }, [id]);

  if (loading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const date = data.createdAt?.toDate
    ? data.createdAt.toDate().toLocaleString()
    : "";

  const openFile = (url) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>Transaction Details</Text>
      </View>

      {/* BANK STYLE SUMMARY */}
      <View style={styles.summaryCard}>
        <Text style={styles.amount}>
          {data.currency} {Number(data.amount).toLocaleString()}
        </Text>
        <Text style={styles.title}>{data.title || "Transaction"}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>

      {/* DETAILS */}
      <View style={styles.card}>
        <Text style={styles.section}>Transaction Info</Text>

        <Row label="Type" value={data.type} />
        <Row label="Method" value={data.method} />
        <Row label="Transaction ID" value={data.transactionId} />
        <Row label="Company" value={data.companyName} />
      </View>

      {/* DRIVER INFO */}
      {data.driver && (
        <View style={styles.card}>
          <Text style={styles.section}>Driver Info</Text>

          <Row label="Name" value={data.driver?.name} />
          <Row label="Phone" value={data.driver?.phone} />
          <Row label="Plate" value={data.driver?.plate} />
          <Row label="Destination" value={data.driver?.destination} />
        </View>
      )}

      {/* FILES / ATTACHMENTS */}
      {data.files?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.section}>Attachments</Text>

          {data.files.map((file, index) => (
            <Pressable
              key={index}
              style={styles.fileContainer}
              onPress={() => openFile(file.url)}
            >

              {/* IMAGE PREVIEW */}
              {file.type?.includes("image") ? (
                <Image
                  source={{ uri: file.url }}
                  style={styles.imagePreview}
                />
              ) : (
                <View style={styles.fileBox}>
                  <Text style={styles.fileIcon}>📄</Text>
                  <Text style={styles.fileName}>{file.name}</Text>
                </View>
              )}

              <Text style={styles.openBtn}>Open / Download</Text>

            </Pressable>
          ))}

        </View>
      )}

      {/* RECORDED BY */}
      <View style={styles.card}>
        <Text style={styles.section}>Recorded By</Text>

        <Row label="User ID" value={data.enteredBy} />
        <Row label="Email" value={data.enteredByEmail} />
        <Row label="Role" value={data.enteredByRole} />
      </View>

    </ScrollView>
  );
}

/* =========================
   REUSABLE ROW
========================= */
const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || "-"}</Text>
  </View>
);

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
    padding: 16
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16
  },

  logo: {
    width: 90,
    height: 90,
    marginRight: 12,
    borderRadius: 50,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700"
  },

  summaryCard: {
    backgroundColor: "#2563eb",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16
  },

  amount: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff"
  },

  title: {
    color: "#e0e7ff",
    marginTop: 4
  },

  date: {
    color: "#c7d2fe",
    marginTop: 6
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12
  },

  section: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },

  label: {
    color: "#6b7280"
  },

  value: {
    fontWeight: "600"
  },

  fileContainer: {
    marginBottom: 12
  },

  fileBox: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center"
  },

  fileIcon: {
    fontSize: 20,
    marginRight: 8
  },

  fileName: {
    fontSize: 14
  },

  imagePreview: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginBottom: 6
  },

  openBtn: {
    color: "#2563eb",
    fontWeight: "600",
    marginTop: 4
  }

});