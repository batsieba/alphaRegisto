import { Text, View, StyleSheet, ScrollView, Image } from "react-native";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { getDocs, doc, updateDoc, getDoc } from "firebase/firestore";


export default function CustomerDashboard() {

  const { user } = useAuth();

  const [kpis, setKpis] = useState({
    companies: 0,
    openBalance: 0,
    paidMonth: 0,
    pendingInvoices: 0,
  });

  const [companies, setCompanies] = useState([]);

  

  useEffect(() => {
    if (!user) return;

    

    const q = query(
      collection(db, "transactions"),
      where("customerId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {

      const txns = snap.docs.map(doc => doc.data());

      let openBalance = 0;
      let paidMonth = 0;
      let pendingInvoices = 0;

      const companyMap = {};

      const currentMonth = new Date().getMonth();

      txns.forEach(tx => {

        const amount = Number(tx.amount) || 0;

        /* OPEN BALANCE */
        if (tx.type === "invoice") {
          openBalance += amount;
          pendingInvoices += 1;
        }

        if (tx.type === "payment") {
          openBalance -= amount;

          const txnMonth = tx.createdAt?.toDate()?.getMonth();
          if (txnMonth === currentMonth) {
            paidMonth += amount;
          }
        }

        /* COMPANY AGGREGATION */

        if (!companyMap[tx.companyId]) {
          companyMap[tx.companyId] = {
            id: tx.companyId,
            name: tx.companyName || "Company",
            balance: 0,
            lastDate: tx.createdAt?.toDate() || new Date()
          };
        }

        if (tx.type === "invoice") companyMap[tx.companyId].balance += amount;
        if (tx.type === "payment") companyMap[tx.companyId].balance -= amount;

        const date = tx.createdAt?.toDate();
        if (date > companyMap[tx.companyId].lastDate) {
          companyMap[tx.companyId].lastDate = date;
        }

      });

      const companyList = Object.values(companyMap)
        .sort((a,b)=> b.lastDate - a.lastDate)
        .slice(0,5);

      setCompanies(companyList);

      setKpis({
        companies: Object.keys(companyMap).length,
        openBalance,
        paidMonth,
        pendingInvoices
      });

    });

    return unsub;

  }, [user]);


  const getBalanceColor = (balance) => {
    if (balance > 0) return "#ef4444";
    if (balance < 0) return "#16a34a";
    return "#6b7280";
  };

  const getBalanceLabel = (balance) => {
    if (balance > 0) return "Outstanding";
    if (balance < 0) return "Credit";
    return "Settled";
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Your financial overview</Text>
        </View>
      </View>

      {/* KPI GRID */}
      <View style={styles.kpiGrid}>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{kpis.companies}</Text>
          <Text style={styles.kpiLabel}>Companies</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>${kpis.openBalance.toLocaleString()}</Text>
          <Text style={styles.kpiLabel}>Open Balance</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>${kpis.paidMonth.toLocaleString()}</Text>
          <Text style={styles.kpiLabel}>Paid This Month</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{kpis.pendingInvoices}</Text>
          <Text style={styles.kpiLabel}>Pending Invoices</Text>
        </View>

      </View>


      {/* RECENT COMPANIES */}

      <Text style={styles.sectionTitle}>Recent Companies</Text>

      {companies.map((company) => (

        <View key={company.id} style={styles.companyCard}>

          <View style={{flex:1}}>
            <Text style={styles.companyName}>{company.name} - {company.id}</Text>

            <View
              style={[
                styles.balanceBadge,
                { backgroundColor: getBalanceColor(company.balance) + "20" }
              ]}
            >
              <Text
                style={[
                  styles.balanceStatus,
                  { color: getBalanceColor(company.balance) }
                ]}
              >
                {getBalanceLabel(company.balance)}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.companyBalance,
              { color: getBalanceColor(company.balance) }
            ]}
          >
            ${company.balance.toLocaleString()}
          </Text>

        </View>

      ))}

    </ScrollView>
  );
}


const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:"#f9fafb",
padding:20
},

header:{
flexDirection:"row",
alignItems:"center",
marginBottom:20,
marginTop:10,
},

logo:{
width:70,
height:70,
marginRight:10,
borderRadius: 40,
},

title:{
fontSize:22,
fontWeight:"700",
color:"#111827"
},

subtitle:{
fontSize:13,
color:"#6b7280"
},

kpiGrid:{
flexDirection:"row",
flexWrap:"wrap",
justifyContent:"space-between",
marginBottom:26
},

kpiCard:{
width:"48%",
backgroundColor:"#fff",
padding:18,
borderRadius:16,
marginBottom:14,
borderWidth:1,
borderColor:"#e5e7eb"
},

kpiValue:{
fontSize:20,
fontWeight:"700",
color:"#111827"
},

kpiLabel:{
marginTop:6,
fontSize:13,
color:"#6b7280"
},

sectionTitle:{
fontSize:18,
fontWeight:"700",
marginBottom:14,
color:"#111827"
},

companyCard:{
backgroundColor:"#fff",
padding:16,
borderRadius:16,
marginBottom:14,
flexDirection:"row",
alignItems:"center",
justifyContent:"space-between",
borderWidth:1,
borderColor:"#e5e7eb"
},

companyName:{
fontSize:15,
fontWeight:"600",
color:"#111827",
marginBottom:6
},

balanceBadge:{
alignSelf:"flex-start",
paddingHorizontal:10,
paddingVertical:4,
borderRadius:999
},

balanceStatus:{
fontSize:12,
fontWeight:"600"
},

companyBalance:{
fontSize:16,
fontWeight:"700"
}

});