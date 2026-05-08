const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateTransactions() {

  console.log("Starting migration...");

  const transactionsSnap = await db.collection("transactions").get();

  let updated = 0;
  let skipped = 0;

  for (const doc of transactionsSnap.docs) {

    const data = doc.data();

    if (data.companyName) {
      skipped++;
      continue;
    }

    if (!data.companyId) {
      console.log(`Missing companyId in transaction ${doc.id}`);
      skipped++;
      continue;
    }

    try {

      const companyQuery = await db
        .collection("companies")
        .where("companyId", "==", data.companyId)
        .limit(1)
        .get();

      if (companyQuery.empty) {
        console.log(`Company not found for transaction ${doc.id}`);
        skipped++;
        continue;
      }

      const companyName = companyQuery.docs[0].data().name;

      await db.collection("transactions").doc(doc.id).update({
        companyName: companyName
      });

      console.log(`Updated ${doc.id} -> ${companyName}`);
      updated++;

    } catch (err) {
      console.error(`Error updating ${doc.id}`, err);
    }

  }

  console.log("\nMigration complete");
  console.log("Updated:", updated);
  console.log("Skipped:", skipped);

  process.exit();
}

migrateTransactions();