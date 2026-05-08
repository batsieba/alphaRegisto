import { useState, useEffect } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { auth,db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { sendPasswordResetEmail, signOut } from "firebase/auth";


export default function CustomerProfile(){

    const {user} = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({
        name: '',
        phoneNumber: '',
        email: '',
        companyName: '',
        role: '',
        roles: [''],
    });


    useEffect(()=>{
        if(!user) return;

        const loadProfile = async () =>{
            try{
                const snap = await getDoc(doc(db, 'users', user.uid));
                if(snap.exists()){
                    setProfile(snap.data());
                }
            }catch(e){
                Alert.alert("Error", e.message);
            }finally{
                setLoading(false);
            }
        };

        loadProfile();
    }, [user]);

    const handleSave = async()=>{
        try{
            await updateDoc(doc(db,'users', user.uid),{
                name: profile.name,
                phoneNumber: profile.phoneNumber,

            });
            Alert.alert("Success", "Profile updated successfully.")
        }catch(e){
            Alert.alert("Error",e.message);
        }
    };

    const handleResetPassword = async ()=>{
        try{
            await sendPasswordResetEmail(auth, profile.email);
            Alert.alert("Email Sent", 'Password reset email sent to your inbox.')
        }catch(e){
            Alert.alert("Error", e.message);
        }
    };

    const switchToOwner = async () => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        role: "owner",
      });

      await signOut(auth);

      router.replace("/owner/dashboard");
    } catch (err) {
      Alert.alert("Error", "Failed to switch role");
    }
  };

    const handleLogout = async ()=>{
        await signOut(auth);
        router.replace('/login');
    };

    if (loading) return null;

    return(
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

            {/* HEADER */}
            <View style={styles.header}>
                <Image 
                    source={require('../../assets/logo.png')}
                    style={styles.logo}
                    resizeMode="contain" />

                <Text style={styles.title}>Profile</Text>
            </View>

            {/* avatar */}
                  <View style={styles.avatarSection}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {profile.name?.charAt(0)}
                      </Text>
                    </View>
                    </View>
                    

            {/* INFO */}
            <View style={styles.card}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    style={styles.input}
                    value={profile.name}
                    onChangeText={(v) => setProfile({...profile, name:v})}
                    />

                <Text style={styles.label}> Email</Text>
                <TextInput style={[styles.input, styles.disabled]} value={profile.email} editable={false} />

                <Text style={styles.label}> Phone Number</Text>
                <TextInput style={styles.input} value={profile.phoneNumber}  onChangeText={(v) => setProfile({...profile, phoneNumber:v})}/>


                <Text style={styles.label}>Company</Text>
                <TextInput
                style={[styles.input, styles.disabled]}
                value={profile.companyName}
                editable={false} 
                />

                <Text style={styles.label}>Role</Text>
                <TextInput style={[styles.input,styles.disabled]} value={profile.role} editable={false} />

                <Text style={styles.label}>All Roles</Text>
                <TextInput style={[styles.input, styles.disabled]} value={profile.roles?.join(", ") || "—"} editable={false} />

            </View>

            {/* ACTIONS */}
            <Pressable style={styles.primaryBtn} onPress={handleSave}>
                <Text style={styles.primaryText}>Save Changes</Text>
            </Pressable>

            {/* Role Switch */}
      {profile.roles?.includes("owner") && profile.roles?.includes("customer") && (
        <Pressable style={styles.switchBtn} onPress={switchToOwner}>
          <Text style={styles.switchText}>Switch to Owner View</Text>
        </Pressable>
      )}

            <Pressable style={styles.secondaryBtn} onPress={handleResetPassword}>
                <Text style={styles.secondaryText}>Change Password</Text>
            </Pressable>

            <Pressable style={styles.logoutBtn} onPress={handleLogout}> 
                <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
        
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: '#fff',
        
    },
    content:{
        padding: 15,
    },
    header:{
        flexDirection: 'row',
        alignItems: 'center',
        // marginBottom: 5,
    },
    logo:{
        width: 110,
        height: 110,
        marginRight: 12,
    },
    title:{
        fontSize: 22,
        fontWeight: '700',

    },
    avatarSection:{
        alignItems: "center",
        marginBottom: 15,
        
    },
    avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#259cebff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12
  },

  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700"
  },

    card:{
        backgroundColor: '#f9fafb',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 20,
    },
    label:{
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 4,
    },
    input:{
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        padding: 12,
        marginBottom: 14,
        fontSize: 15,
        backgroundColor: '#fff',
    },
    disabled:{
        backgroundColor: '#f3f4f6',
        color: '#6b7280',
    },
    primaryBtn:{
        backgroundColor: '#2563eb',
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
    },
    primaryText:{
        color: '#fff',
        fontWeight: '600',
        textAlign: 'center',
        fontSize: 16,
    },
    secondaryBtn:{
        borderWidth: 1,
        borderColor: '#2563eb',
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
    },
    secondaryText:{
        color: '#2563eb',
        fontWeight: '600',
        textAlign: 'center',
    },
    logoutBtn:{
        backgroundColor: '#ef4444',
        padding: 14,
        borderRadius: 12,
    },
    logoutText:{
        color: '#fff',
        fontWeight: '600',
        textAlign: 'center',
    },
    switchBtn: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  switchText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});