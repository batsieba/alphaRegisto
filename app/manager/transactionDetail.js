import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Pressable,
  Linking,
  Alert
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot, deleteDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useEffect, useState } from "react";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

/* ================= COMPONENT ================= */
export default function TransactionDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */
  useEffect(() => {
    if (!id) return;

    const ref = doc(db, "transactions", id);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setData({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    });

    return () => unsub();
  }, [id]);

  /* ================= FINANCIAL LOGIC ================= */
  const getImpact = (t) => {
    if (t.type === "credit") return "negative";
    if (t.type === "advance payment") return "positive";
    if (t.type === "prepay") return "positive";
    if(t.type === 'payment') return 'positive';
    return "negative";
  };

  /* ================= DELETE ================= */
  const handleDelete = () => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "transactions", id));
          router.back();
        },
      },
    ]);
  };

//   /* ================= PDF EXPORT ================= */
//   const handleExportPDF = async () => {
//     const html = `
//       <h1>${data.title}</h1>
//       <p>Amount: ${data.currency} ${data.amount}</p>
//       <p>Transaction Id: ${data.transactionId}</p>
//       <p>Customer: ${data.customerName}</p>
//       <p>Method: ${data.method}</p>
//       <p>Payment Type: ${data.type}</p>
//       <h3>Company Info </h3>
//       <p>Company ID: ${data.companyId}</p>
//       <p>Company Name: ${data.companyName}</p>
//       <p>Date: ${new Date().toLocaleString()}</p>
//       <h3>Employee Info </h3>
//       <p>Employee ID: ${data.enteredBy}</p>
//       <p>Employee Email: ${data.enteredByEmail}</p>
//       <p>Employee Role: ${data.enteredByRole}</p>
//       <h3>Driver Info</h3>
//       <p>Driver Name: ${data.driver.name}</p>
//       <p>Driver Phone: ${data.driver.phone}</p>
//       <p>Plate Number: ${data.driver.plate}</p>
//       <p>Destination: ${data.driver.destination}</p>
      
//     `;

//     const { uri } = await Print.printToFileAsync({ html });
//     await Sharing.shareAsync(uri);
//   };



const handleExportPDF = async () => {
  const filesArray = data.Files ? Object.values(data.Files) : [];

  const imagesHTML = filesArray
    .filter(f => f.type?.includes("image"))
    .map(
      f => `<img src="${f.url}" style="width:100%;margin-top:10px;border-radius:8px;" />`
    )
    .join("");

  const html = `
  <html>
    <body style="font-family: Arial; padding: 20px; color:#111;">
      
      <h1 style="color:#2563eb;">${data.companyName || "Company"}</h1>
      <p>Invoice ID: ${data.transactionId}</p>

      <hr/>

      <h2>${data.title}</h2>
      <h1 style="color:${data.type === "credit" ? "red" : "green"};">
        ${data.currency} ${data.amount}
      </h1>

      <p><b>Customer:</b> ${data.customerName}</p>
      <p><b>Method:</b> ${data.method}</p>
      <p><b>Type:</b> ${data.type}</p>

      <hr/>

      <h3>Driver Info</h3>
      <p>${data.driver?.name || ""}</p>
      <p>${data.driver?.phone || ""}</p>
      <p>${data.driver?.plate || ""}</p>
      <p>${data.driver?.destination || ""}</p>

      <hr/>

      <h3>Handled By</h3>
      <p>${data.enteredByEmail}</p>

      <hr/>

      <h3>Attachments</h3>
      ${imagesHTML || "<p>No images</p>"}

      <br/><br/>

      <p style="font-size:12px;color:#6b7280;">
        Generated on ${new Date().toLocaleString()}
      </p>

    </body>
  </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri);
};
  /* ================= SHARE ================= */
  const handleShare = async () => {
    const message = `
Transaction: ${data.title}
Amount: ${data.currency} ${data.amount}
Customer: ${data.customerName}
Method: ${data.method}
    `;

    const { uri } = await Print.printToFileAsync({
      html: `<pre>${message}</pre>`,
    });

    await Sharing.shareAsync(uri);
  };

  /* ================= LOADING ================= */
  if (loading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const impact = getImpact(data);
  const date = data.createdAt?.toDate?.().toLocaleString() || "N/A";

  const filesArray = data.Files
    ? Object.values(data.Files)
    : [];

  /* ================= FILE ================= */
  const renderFile = (file, index) => {
    const isImage = file.type?.includes("image");

    return (
      <Pressable
        key={index}
        style={styles.fileCard}
        onPress={() => Linking.openURL(file.url)}
      >
        {isImage ? (
          <Image source={{ uri: file.url }} style={styles.image} />
        ) : (
          <View style={styles.fileBox}>
            <Text style={{ fontSize: 24 }}>PDF</Text>
          </View>
        )}
        <Text numberOfLines={1}>{file.name}</Text>
      </Pressable>
    );
  };

  

  return (
    <ScrollView style={styles.container}>
        <View style={styles.topHeaderSec}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.headerTitle}>Transaction Detail</Text>
        </View>
      
      {/* HEADER WITH ACTIONS */}
      <View style={styles.header}>
        <View style={styles.rowBetween}>
          <Text style={styles.title}>{data.title}</Text>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable onPress={() => router.push(`/manager/editTransaction?id=${id}`)}>
              <Text style={styles.action}>✏️</Text>
            </Pressable>

            <Pressable onPress={handleDelete}>
              <Text style={styles.action}>🗑</Text>
            </Pressable>
          </View>
        </View>

        <Text style={[
          styles.amount,
          { color: impact === "positive" ? "green" : "red" }
        ]}>
          {data.currency} {data.amount}
        </Text>

        <Text style={styles.date}>{date}</Text>

        {/* ACTION BUTTONS */}
        <View style={styles.actionRow}>
          <Pressable style={styles.btn} onPress={handleExportPDF}>
            <Text style={styles.btnText}>Export PDF</Text>
          </Pressable>

          <Pressable style={styles.btn} onPress={handleShare}>
            <Text style={styles.btnText}>Share</Text>
          </Pressable>
        </View>
      </View>

      {/* INFO SECTIONS */}

      <Section title='Transaction Info'>
         <Info label="Transaction ID" value={data.transactionId} />
        <Info label="Type" value={data.type} />
        <Info label="Currency" value={data.currency} />
        <Info label="Company ID" value={data.companyId} />
      </Section>

      <Section title="Customer">
        <Info label="Name" value={data.customerName} />
        <Info label="ID" value={data.customerId} />
      </Section>

      <Section title="Driver">
        <Info label="Name" value={data.driver?.name} />
        <Info label="Phone" value={data.driver?.phone} />
        <Info label="Plate" value={data.driver?.plate} />
        <Info label="Destination" value={data.driver?.destination} />
      </Section>

      <Section title="Employee">
        <Info label="Email" value={data.enteredByEmail} />
        <Info label="Role" value={data.enteredByRole} />
      </Section>

      {/* FILES */}
      {filesArray.length > 0 && (
        <Section title="Attachments">
          <ScrollView horizontal>
            {filesArray.map(renderFile)}
          </ScrollView>
        </Section>
      )}
    </ScrollView>
  );
}

/* ================= SMALL COMPONENTS ================= */
const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Info = ({ label, value }) => {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fb", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  title: { fontSize: 18, fontWeight: "600" },
  amount: { fontSize: 24, fontWeight: "700", marginTop: 6 },
  date: { fontSize: 12, color: "#6b7280" },

  action: { fontSize: 18 },

  actionRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 10,
  },

  btn: {
    backgroundColor: "#2563eb",
    padding: 10,
    borderRadius: 10,
  },

  btnText: { color: "#fff", fontSize: 12 },

  section: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },

  sectionTitle: {
    fontWeight: "700",
    marginBottom: 10,
  },

  infoRow: { marginBottom: 6 },
  label: { fontSize: 12, color: "#6b7280" },
  value: { fontSize: 14 },

  fileCard: { width: 100, marginRight: 10 },
  image: { width: 100, height: 80, borderRadius: 10 },
  fileBox: {
    width: 100,
    height: 80,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  topHeaderSec:{
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  logo:{
    width: 90,
    height: 90,
    marginRight: 10,
    borderRadius:50,
  },
  headerTitle:{
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
});