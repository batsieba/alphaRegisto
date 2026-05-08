const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateCompanyCustomers() {
  try {
    const snapshot = await db.collection("company_customers").get();

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Skip if already upgraded
      if (data.customerName) {
        continue;
      }

      console.log("Upgrading:", doc.id);

      const userSnap = await db
        .collection("users")
        .doc(data.customerId)
        .get();

      if (!userSnap.exists) {
        console.log("User not found for:", doc.id);
        continue;
      }

      const userData = userSnap.data();

      await doc.ref.update({
        customerName: userData.name || "",
        customerEmail: userData.email || "",
        customerPhone: userData.phone || "",
        companyName: userData.companyName || "",
        companyOwner: userData.companyOwner || "",
        companyOwnerUid: userData.companyOwnerUid || "",
      });
    }

    console.log("Migration complete ✅");
  } catch (error) {
    console.error(error);
  }
}

migrateCompanyCustomers();
