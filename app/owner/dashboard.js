import { 
  Image, 
  Pressable, 
  ScrollView, 
  StyleSheet, 
  Text, 
  View 
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import { NotificationBell } from "../../components/NotificationBell";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
 import { db } from "../../config/firebase";

export default function OwnerDashboard() {
  const { user,companyId, companyName } = useAuth();
  const router = useRouter();

  const [collectedToday, setCollectedToday] = useState(0);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

//   const fetchDashboardData = async () => {
//     try {
//       // Fetch Employees
//       const employeeSnap = await getDocs(
//         query(collection(db, "users"), where("role", "==", "employee"))
//       );
//       setEmployeeCount(employeeSnap.size);

//       // Fetch Customers
//       const customerSnap = await getDocs(collection(db, "customers"));
//       setCustomerCount(customerSnap.size);

//       // Fetch Transactions
//       const transactionSnap = await getDocs(collection(db, "transactions"));
//       let todayTotal = 0;
//       let last = null;

//       const today = new Date().toDateString();

//       transactionSnap.forEach(doc => {
//         const data = doc.data();
//         const date = new Date(data.createdAt?.seconds * 1000).toDateString();

//         if (date === today) {
//           todayTotal += data.amount;
//         }

//         if (!last || data.createdAt?.seconds > last.createdAt?.seconds) {
//           last = data;
//         }
//       });

//       setCollectedToday(todayTotal);
//       setLastTransaction(last);

//     } catch (error) {
//       console.log("Dashboard Error:", error);
//     }
//   };


useEffect(() => {
  if (companyId) {
    fetchDashboardData();
  }
}, [user]);

const fetchDashboardData = async () => {
  try {
    

    /* EMPLOYEES */
    const employeeSnap = await getDocs(
      query(
        collection(db, "users"),
        where("companyId", "==", companyId),
        where("role", "in", ["manager", "salesperson", "accountant"])
      )
    );
    setEmployeeCount(employeeSnap.size);

    /* CUSTOMERS */
    const customerSnap = await getDocs(
      query(
        collection(db, "company_customers"),
        where("companyId", "==", companyId)
      )
    );
    setCustomerCount(customerSnap.size);

    /* TRANSACTIONS */
    const transactionSnap = await getDocs(
      query(
        collection(db, "transactions"),
        where("companyId", "==", companyId)
      )
    );

    let todayTotal = 0;
    let last = null;
    const today = new Date().toDateString();

    transactionSnap.forEach(doc => {
      const data = doc.data();
      if (!data.createdAt) return;

      const date = new Date(data.createdAt.seconds * 1000).toDateString();

      if (date === today) {
        todayTotal += data.amount || 0;
      }

      if (!last || data.createdAt.seconds > last.createdAt?.seconds) {
        last = data;
      }
    });

    setCollectedToday(todayTotal);
    setLastTransaction(last);

  } catch (error) {
    console.log("Dashboard Error:", error);
  }
};



  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Owner Dashboard</Text>
        </View>
        <NotificationBell />
      </View>

      {/* COMPANY INFO */}
      <View style={styles.header}>
        <Text style={styles.companyName}>
          {companyName || "Your Company"}
        </Text>
        <Text style={styles.subtitle}>
          Business overview & activity
        </Text>
      </View>

      {/* KPI GRID */}
      <View style={styles.kpiGrid}>
        
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>
            {collectedToday.toLocaleString()}
          </Text>
          <Text style={styles.kpiLabel}>Collected Today</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>
            {lastTransaction?.amount || "--"}
          </Text>
          <Text style={styles.kpiLabel}>Last Transaction</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>
            {employeeCount}
          </Text>
          <Text style={styles.kpiLabel}>Active Employees</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>
            {customerCount}
          </Text>
          <Text style={styles.kpiLabel}>Active Customers</Text>
        </View>

      </View>

      {/* QUICK ACTIONS */}
      <View style={styles.actionBox}>
        <Text style={styles.actionTitle}>Quick Actions</Text>

        <Pressable 
          style={styles.actionButton}
          onPress={() => router.push('/owner/add-employee')}
        >
          <Text style={styles.actionText}>➕ Add Employee</Text>
        </Pressable>

        <Pressable 
          style={styles.actionButton}
          onPress={() => router.push('/owner/customers')}
        >
          <Text style={styles.actionText}>👥 View Customers</Text>
        </Pressable>

        <Pressable 
          style={styles.actionButton}
          onPress={() => router.push('/owner/reports')}
        >
          <Text style={styles.actionText}>📊 Financial Reports</Text>
        </Pressable>

      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 10,
  },
  logo: {
    width: 110,
    height: 110,
    marginRight: 12,
    borderRadius: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827'
  },
  header: {
    marginBottom: 24
  },
  companyName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827'
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280'
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  actionBox: {
    marginTop: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionButton: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  actionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e40af'
  }
});
