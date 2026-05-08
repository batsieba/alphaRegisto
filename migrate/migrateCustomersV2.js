const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateCompanyCustomers() {
  try {
    const snapshot = await db.collection("company_customers").get();

    console.log(`Found ${snapshot.size} documents`);

    let batch = db.batch();
    let operationCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();

      const updateData = {};

      /* ================= GET CUSTOMER PHONE ================= */
      if (!data.customerPhone) {
        const userSnap = await db
          .collection("users")
          .doc(data.customerId)
          .get();

        if (userSnap.exists) {
          updateData.customerPhone =
            userSnap.data().phoneNumber || "";
        }
      }

      /* ================= GET COMPANY INFO ================= */
      if (!data.companyName || !data.companyOwner || !data.companyOwnerUid) {
        const companySnap = await db
          .collection("companies")
          .doc(data.companyId)
          .get();

        if (companySnap.exists) {
          const companyData = companySnap.data();

          updateData.companyName = companyData.name || "";
          updateData.companyOwner = companyData.ownerName || "";
          updateData.companyOwnerUid = companyData.ownerUid || "";
        }
      }

      /* ================= APPLY UPDATE ================= */
      if (Object.keys(updateData).length > 0) {
        batch.update(doc.ref, updateData);
        operationCount++;

        // Firestore batch limit = 500
        if (operationCount === 450) {
          await batch.commit();
          console.log("Committed 450 updates...");
          batch = db.batch();
          operationCount = 0;
        }
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    console.log("Migration complete ✅");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

migrateCompanyCustomers();
