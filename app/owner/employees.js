import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import { db } from "../../config/firebase";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, updateDoc, where, doc } from "firebase/firestore";

export default function ManageEmployees() {

  const { companyId, loading } = useAuth();
  const router = useRouter();

  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');

  /* ================= GET EMPLOYEES ================= */

  useEffect(() => {
    if (loading) return;
    if (!companyId) return;

    const q = query(
      collection(db, 'users'),
      where('companyId', '==', companyId),
      where('role', 'in', ['manager', 'salesperson', 'accountant'])
    );

    const unsub = onSnapshot(q, (snap) => {
      setEmployees(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });

    return unsub;
  }, [companyId, loading]);

  /* ================= DISABLE EMPLOYEE ================= */

  const disableEmployee = async (emp) => {
    Alert.alert(
      "Disable Employee",
      `Disable ${emp.name}? They will no longer be able to log in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            await updateDoc(doc(db, 'users', emp.id), {
              status: 'disabled',
              disabledAt: new Date(),
            });
          },
        },
      ]
    );
  };

  /* ================= SEARCH FILTER ================= */

  const filtered = employees.filter(
    (e) =>
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/logo.png')}
          resizeMode="contain"
          style={styles.logo}
        />
        <Text style={styles.title}>Manage Employees</Text>
      </View>

      {/* SEARCH */}
      <TextInput
        placeholder="Search employees..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      {filtered.length === 0 && (
        <Text style={styles.empty}>
          No employees found.
        </Text>
      )}

      {/* LIST */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              router.push(`/owner/employee-details?id=${item.id}`)
            }
          >
            <View style={{ flex: 1 }}>

              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.email}</Text>

              <View style={styles.roleChip}>
                <Text style={styles.roleText}>{item.role}</Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  item.status === "disabled" && styles.statusDisabled,
                ]}
              >
                <Text style={styles.statusText}>
                  {item.status === "active" ? "Active" : "Disabled"}
                </Text>
              </View>
            </View>

            {item.status === 'active' && (
              <Pressable
                style={styles.disableBtn}
                onPress={() => disableEmployee(item)}
              >
                <Text style={styles.disableText}>Disable</Text>
              </Pressable>
            )}
          </Pressable>
        )}
      />

      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push("/owner/add-employee")}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

    </View>
  );
}


const styles = StyleSheet.create({
    container:{
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header:{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    logo:{
        width: 110,
        height: 110,
        marginRight: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',

    },
    addButton:{
        backgroundColor: '#2563eb',
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
    },
    addText:{
        color: '#fff', 
        textAlign:"center",
        fontWeight: '600',
    },
    search:{
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
    },
    card:{
        backgroundColor: '#f9fafb',
        padding: 16,
        borderRadius: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    name:{
        fontSize: 16,
        fontWeight: '600',

    },
    meta:{
        fontSize: 14,
        color: '#6b7280',
    },
    status:{
        marginTop: 4,
        color: '#16a34a',
        fontWeight: '600',
    },
    disabled:{
        color: '#dc26d6'
    },

    // 
    disableBtn:{
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
},
disableText:{
    color: '#ef4444',
    fontWeight: '600',
},
    fab:{
        position: 'absolute',
        right: 20,
        bottom: 30,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2563eb',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 4,
        shadowOffset:{width:0, height: 2},
    },
    fabText:{
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 2,
    },
    statusBadge:{
        marginTop: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: '#dcfce7'
    },
    statusDisabled:{
        backgroundColor: '#fee2e2'
    },
    statusText:{
        fontSize: 12,
        fontWeight: '600',
        color: '#166534',
    },
    roleChip:{
        alignSelf: 'flex-start',
        marginTop: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: '#e0e7ff',
    },
    roleText:{
        fontSize: 12,
        fontWeight: '600',
        color: '#3730a3'
    },
    empty:{
        textAlign: 'center',
        marginTop: 40,
        color: '#6b7280',
        fontSize: 14,
    }
})