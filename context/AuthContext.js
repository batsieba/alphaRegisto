import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { auth, app } from "../config/firebase";
import { Alert } from "react-native";
// import { registerForPushNotifications } from "../utils/registerForPushNotifications";

const AuthContext = createContext();
const db = getFirestore(app);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [companyName, setCompanyName] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setLoading(true);

      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setCompanyName(null);
        setLoading(false);
        return;
      }




      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          console.warn("No Firestore user document found");
          setUser(firebaseUser);
          setRole(null);
        //   setCompanyName(null);
        //   setCompanyId(null);
          setLoading(false);
          return;
        } 
        // if (!snap.exists()) {
        //     console.warn("User doc not ready yet, waiting...");
        //     setLoading(true);
        //     return;
        // }


        const data= snap.data();

          
        


        if (data.status === "disabled") {
        await auth.signOut();
        Alert.alert(
            "Account Disabled",
            "Your account has been disabled. Contact your company admin."
        );
        setUser(null);
        setRole(null);
        setCompanyName(null);
        setLoading(false);
        return;
        }

        setUser(firebaseUser);
        setRole(data.role);
        setCompanyName(data.companyName || null);
        setCompanyId(data.companyId)

        setLoading(false);


        //for testing only
        // console.log("AUTH STATE:", {
        // uid: firebaseUser?.uid,
        // role: data?.role,
        // loading,
        // });


      } catch (e) {
        console.error("AuthContext error:", e);
      }
    });

    return unsubscribe;
  }, []);

  //for push notification
  // useEffect(()=> {
  //   if(user?.uid){
  //     registerForPushNotifications(user.uid);
  //   }
  // }, [user]);

  return (
    <AuthContext.Provider value={{ user, role, companyName, loading, companyId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
