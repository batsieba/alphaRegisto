import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../../config/firebase";

export default function CustomerCompanies() {
  const { user } = useAuth();

  const [tab, setTab] = useState("active");
  const [loading, setLoading] = useState(true);

  const [activeCompanies, setActiveCompanies] = useState([]);
  const [availableCompanies, setAvailableCompanies] = useState([]);

  const [selectedEmployee, setSelectedEmployee] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  /* =========================
        LOAD DATA
  ========================== */
  // const loadData = async () => {
  //   try {
  //     setLoading(true);

  //     const userSnap = await getDoc(doc(db, "users", user.uid));
  //     const customerCompanyIds = userSnap.data()?.companyIds || [];

  //     const companySnap = await getDocs(collection(db, "companies"));
  //     const companies = companySnap.docs.map((d) => ({
  //       id: d.id, // Firestore doc ID
  //       ...d.data(),
  //     }));

  //     const active = [];
  //     const available = [];

  //     for (const company of companies) {
  //       if (!company.companyId) continue;

  //       if (customerCompanyIds.includes(company.companyId)) {
  //         active.push(company);
  //         continue;
  //       }

  //       const staffQuery = query(
  //         collection(db, "users"),
  //         where("companyId", "==", company.companyId),
  //         where("role", "in", ["manager", "salesperson"]),
  //         where("status", '==', 'active')
  //       );

  //       const staffSnap = await getDocs(staffQuery);

  //       available.push({
  //         ...company,
  //         employees: staffSnap.docs.map((d) => ({
  //           id: d.id,
  //           name: d.data().name,
  //           role: d.data().role,
  //         })),
  //       });
  //     }

  //     setActiveCompanies(active);
  //     setAvailableCompanies(available);
  //   } catch (e) {
  //     console.error(e);
  //     Alert.alert("Error loading companies");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const loadData = async () => {

  try {

    setLoading(true);

    const userSnap = await getDoc(doc(db,"users",user.uid));
    const customerCompanyIds = userSnap.data()?.companyIds || [];

    /* -------------------------
       1️⃣ LOAD ALL COMPANIES
    ------------------------- */

    const companiesSnap = await getDocs(collection(db,"companies"));

    const companies = companiesSnap.docs.map(d => ({
      id:d.id,
      ...d.data()
    }));


  

    /* -------------------------
      2️⃣ LOAD ALL EMPLOYEES
    ------------------------- */

    const employeesQuery = query(
      collection(db, "users"),
      where("role", "in", ["manager", "salesperson"]),
      where("status", "==", "active")
    );

    const employeesSnap = await getDocs(employeesQuery);

    const employees = employeesSnap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    /* -------------------------
       3️⃣ GROUP EMPLOYEES
    ------------------------- */

    const employeeMap = {};

    employees.forEach(emp=>{

      if(!employeeMap[emp.companyId]){
        employeeMap[emp.companyId] = [];
      }

      employeeMap[emp.companyId].push(emp);

    });


    /* -------------------------
       4️⃣ BUILD LISTS
    ------------------------- */

    const active = [];
    const available = [];

    for(const company of companies){

      if(customerCompanyIds.includes(company.companyId)){
        active.push(company);
      }else{

      // if(customerCompanyIds.includes(company.companyId)){

      //   active.push({
      //     ...company,
      //     employees: employeeMap[company.companyId] || []
      //   });

      // }else{

        available.push({
          ...company,
          employees: employeeMap[company.companyId] || []
        });

      }

    }

    setActiveCompanies(active);
    setAvailableCompanies(available);

  } catch(e){

    console.error(e);
    Alert.alert("Error loading companies");

  } finally {

    setLoading(false);

  }

};

  /* =========================
          JOIN COMPANY
  ========================== */
  const handleJoin = (company) => {
    const employeeId = selectedEmployee[company.id];

    if (!employeeId) {
      Alert.alert("Please select an employee");
      return;
    }

    Alert.alert("Confirm", `Join ${company.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Join",
        onPress: async () => {
          try {

            //get user data
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data() ||{};


            //get company data
            const companyDoc = await getDoc(doc(db, 'companies', company.id));
            const companyData = companyDoc.data() || {};




            // ✅ FIXED: use company.companyId
            await updateDoc(doc(db, "users", user.uid), {
              companyIds: arrayUnion(company.companyId),
            });

            // await updateDoc(doc(db, "users", employeeId), {
            //   customers: arrayUnion(user.uid),
            // });
            await addDoc(collection(db, "company_customers"), {
                companyId: company.companyId || '',
                customerId: user.uid,
                employeeId: employeeId || '',
                createdAt: new Date(),

                customerName: userData.name || '',
                customerEmail: userData.email || '',
                customerPhone: userData.phoneNumber || '',

                companyName: companyData.name || '',
                companyOwner: companyData.ownerName || '',
                companyOwnerUid: companyData.ownerUid || '',
                });


            loadData();
          } catch (e) {
            console.error(e);
            Alert.alert("Join failed");
          }
        },
      },
    ]);
  };

  /* =========================
          RENDER ITEM
  ========================== */
  // const renderCompany = ({ item }) => (
  //   <View style={styles.card}>
  //     <Text style={styles.companyName}>{item.name}</Text>

  //     {tab === "available" && (
  //       <>
  //         {/* DROPDOWN */}
  //         <Pressable
  //           style={styles.dropdown}
  //           onPress={() =>
  //             setOpenDropdown(openDropdown === item.id ? null : item.id)
  //           }
  //         >
  //           <Text style={styles.dropdownText}>
  //             {selectedEmployee[item.id]
  //               ? item.employees.find(
  //                   (e) => e.id === selectedEmployee[item.id]
  //                 )?.name
  //               : "Select employee"}
  //           </Text>
  //         </Pressable>

  //         {openDropdown === item.id && (
  //           <View style={styles.dropdownList}>
  //             {item.employees.map((emp) => (
  //               <Pressable
  //                 key={emp.id}
  //                 style={styles.dropdownItem}
  //                 onPress={() => {
  //                   setSelectedEmployee((p) => ({
  //                     ...p,
  //                     [item.id]: emp.id,
  //                   }));
  //                   setOpenDropdown(null);
  //                 }}
  //               >
  //                 <Text>
  //                   {emp.name} • {emp.role}
  //                 </Text>
  //               </Pressable>
  //             ))}
  //           </View>
  //         )}

  //         <Pressable style={styles.joinBtn} onPress={() => handleJoin(item)}>
  //           <Text style={styles.joinText}>Join Company</Text>
  //         </Pressable>
  //       </>
  //     )}
  //   </View>
  // );



  const renderCompany = ({ item }) => {

  const employeeCount = item.employees ? item.employees.length : 0;

  const selectedEmp =
    item.employees?.find(e => e.id === selectedEmployee[item.id]);

  return (
    <View style={styles.companyCard}>

      {/* HEADER */}
      <View style={styles.companyHeader}>
        <Text style={styles.companyTitle}>{item.name}</Text>

        <View style={[
          styles.statusBadge,
          tab === "active" ? styles.activeBadge : styles.availableBadge
        ]}>
          <Text style={styles.statusText}>
            {tab === "active" ? "ACTIVE" : "AVAILABLE"}
          </Text>
        </View>
      </View>

      {/* COMPANY INFO */}
      <View style={styles.companyInfo}>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Owner</Text>
          <Text style={styles.infoValue}>{item.ownerName || "—"}</Text>
        </View>

        <View style={styles.infoRow}>
          {tab == 'available' && (
            <>
          <Text style={styles.infoLabel}>Employees</Text>
          <Text style={styles.infoValue}>{employeeCount}</Text>
          </>
          )
  }
          
        </View>

      </View>

      {/* AVAILABLE TAB */}
      {tab === "available" && (
        <>

          <Pressable
            style={styles.employeeSelector}
            onPress={() =>
              setOpenDropdown(openDropdown === item.id ? null : item.id)
            }
          >
            <Text style={styles.employeeSelectorText}>
              {selectedEmp
                ? `${selectedEmp.name} • ${selectedEmp.role}`
                : "Select employee to manage your finances"}
            </Text>
          </Pressable>

          {openDropdown === item.id && (
            <View style={styles.employeeDropdown}>
              {item.employees.map(emp => (
                <Pressable
                  key={emp.id}
                  style={styles.employeeItem}
                  onPress={() => {
                    setSelectedEmployee(p => ({
                      ...p,
                      [item.id]: emp.id
                    }));
                    setOpenDropdown(null);
                  }}
                >
                  <Text style={styles.employeeName}>
                    {emp.name}
                  </Text>

                  <Text style={styles.employeeRole}>
                    {emp.role}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <Pressable
            style={styles.joinButton}
            onPress={() => handleJoin(item)}
          >
            <Text style={styles.joinButtonText}>Join Company</Text>
          </Pressable>

        </>
      )}

      {/* ACTIVE TAB */}
      {tab === "active" && (
        <View style={styles.assignedEmployee}>
          <Text style={styles.infoLabel}>Assigned Employee</Text>
          <Text style={styles.infoValue}>
            {item.employeeName || "Financial manager assigned"}
          </Text>
        </View>
      )}

    </View>
  );
};



/* =========================
         END
========================= */


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Companies</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {["active", "available"].map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.activeTab]}
            onPress={() => setTab(t)}
          >
            <Text>{t === "active" ? "Active" : "Available"}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={tab === "active" ? activeCompanies : availableCompanies}
        keyExtractor={(item) => item.id}
        renderItem={renderCompany}
      />
    </View>
  );
}

/* =========================
            STYLES
========================== */
const styles = StyleSheet.create({

container:{
flex:1,
padding:16,
backgroundColor:"#f5f7fb"
},

header:{
flexDirection:"row",
alignItems:"center",
marginBottom:20,
marginTop:12
},

logo:{
width:60,
height:60,
marginRight:12
},

title:{
fontSize:24,
fontWeight:"700",
color:"#111827"
},

tabs:{
flexDirection:"row",
marginBottom:18,
backgroundColor:"#eef2ff",
borderRadius:12,
padding:4
},

tab:{
flex:1,
padding:10,
alignItems:"center",
borderRadius:10
},

activeTab:{
backgroundColor:"#ffffff",
shadowColor:"#000",
shadowOpacity:0.08,
shadowRadius:4
},

/* COMPANY CARD */

companyCard:{
backgroundColor:"#ffffff",
borderRadius:16,
padding:18,
marginBottom:14,
shadowColor:"#000",
shadowOpacity:0.05,
shadowRadius:8,
elevation:2
},

companyHeader:{
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center",
marginBottom:10
},

companyTitle:{
fontSize:17,
fontWeight:"700",
color:"#111827"
},

statusBadge:{
paddingHorizontal:10,
paddingVertical:4,
borderRadius:20
},

activeBadge:{
backgroundColor:"#d1fae5"
},

availableBadge:{
backgroundColor:"#e0e7ff"
},

statusText:{
fontSize:12,
fontWeight:"700",
color:"#374151"
},

/* COMPANY INFO */

companyInfo:{
marginTop:4,
marginBottom:12
},

infoRow:{
flexDirection:"row",
justifyContent:"space-between",
marginBottom:6
},

infoLabel:{
fontSize:13,
color:"#6b7280"
},

infoValue:{
fontSize:14,
fontWeight:"600",
color:"#111827"
},

/* EMPLOYEE SELECTOR */

employeeSelector:{
borderWidth:1,
borderColor:"#e5e7eb",
borderRadius:10,
padding:12,
marginTop:6
},

employeeSelectorText:{
color:"#374151"
},

employeeDropdown:{
borderWidth:1,
borderColor:"#e5e7eb",
borderRadius:10,
marginTop:6,
backgroundColor:"#fff"
},

employeeItem:{
padding:12,
borderBottomWidth:1,
borderColor:"#f3f4f6"
},

employeeName:{
fontWeight:"600"
},

employeeRole:{
fontSize:12,
color:"#6b7280"
},

/* JOIN BUTTON */

joinButton:{
marginTop:14,
backgroundColor:"#2563eb",
padding:14,
borderRadius:10,
alignItems:"center"
},

joinButtonText:{
color:"#fff",
fontWeight:"700"
},

/* ACTIVE COMPANY */

assignedEmployee:{
marginTop:12,
borderTopWidth:1,
borderColor:"#f3f4f6",
paddingTop:10
}

});