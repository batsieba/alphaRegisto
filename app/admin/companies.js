import { collection, onSnapshot , query, orderBy} from "firebase/firestore";
import { useEffect, useState } from "react";
import {db} from '../../config/firebase';
import { FlatList, Image, StyleSheet, Text, TextInput, View } from "react-native";


export default function AdminCompanies(){
    const [companies, setCompanies] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(()=>{
        const q = query(
            collection(db, 'companies'),
            orderBy('createdAt', 'asc')
        );

        const unsub = onSnapshot(q,(snapshot) =>{
            const data = snapshot.docs.map(doc =>({
                id: doc.id,
                ...doc.data()
            }));
            setCompanies(data);
        });

        return () => unsub();
    }, []);

    const filtered = companies.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.companyId?.toLowerCase().includes(search.toLowerCase())
    );

    const total = companies.length;
    const active = companies.filter(c => c.status === 'active').length;


    return(
        <View style={styles.container}>
            
            {/* header */}
            <View style={styles.header}>
                <Image
                    source={require('../../assets/logo.png')}
                    resizeMode="contain"
                    style={styles.logo} />
                
                <Text style={styles.title}>Companies</Text>
            </View>

            {/* kpis */}
            <View style={styles.kpis}>
                <View style={styles.kpiCard}>
                    <Text style={styles.kpiValue}>{total}</Text>
                    <Text style={styles.kpiLabel}>Total Companies</Text>
                </View>

                <View style={styles.kpiCard}>
                    <Text style={styles.kpiValue}>{active}</Text>
                    <Text style={styles.kpiLabel}>Active Companies</Text>
                </View>
            </View>

            {/* search */}
            <TextInput
                placeholder="Search by name or ID..."
                value={search}
                onChangeText={setSearch}
                style={styles.search} />


            {/* list of companies */}
            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                ListEmptyComponent={
                    <Text style={styles.empty}>No companies found</Text>
                }
                renderItem={({item})=>(
                    <View style={styles.card}>
                        <View style={styles.cardLeft}>
                            <Text style={styles.company}>{item.name}</Text>
                            <Text style={styles.meta}>{item.companyId}</Text>
                            <Text style={styles.meta}>{item.ownerName}</Text>
                        </View>

                        {/* <View style={[styles.status, item.status === 'active' ? styles.active : styles.inactive]}>
                            <Text style={styles.statusText}>{item.status}</Text>
                        </View> */}

                        <View
                        style={[
                            styles.status,
                            item.status === "active" ? styles.active : styles.inactive,
                        ]}
                        >
                        <Text
                            style={[
                            styles.statusText,
                            { color: item.status === "active" ? "#16a34a" : "#dc2626" },
                            ]}
                        >
                            {item.status}
                        </Text>
                        </View>

                    </View>
                )}
                />

        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: "#f3f4f6",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  logo: {
    width: 90,
    height: 90,
    marginRight: 12,
    borderRadius: 50,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },

  /* KPI SECTION */
  kpis: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },

  kpiCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingVertical: 20,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  kpiValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },

  kpiLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },

  /* SEARCH */
  search: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  /* COMPANY CARD */
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  cardLeft: {
    flex: 1,
  },

  company: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    textTransform: "capitalize",
  },

  meta: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 2,
  },

  /* STATUS BADGE */
  status: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 50,
    alignSelf: "flex-start",
  },

  active: {
    backgroundColor: "#dcfce7",
  },

  inactive: {
    backgroundColor: "#fee2e2",
  },

  statusText: {
    fontWeight: "700",
    fontSize: 12,
    textTransform: "capitalize",
  },

  empty: {
    textAlign: "center",
    marginTop: 60,
    color: "#9ca3af",
  },
});
