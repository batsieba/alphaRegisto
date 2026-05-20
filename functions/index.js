const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
// const nodemailer = require("nodemailer"); // email disabled for now

admin.initializeApp();

const db = admin.firestore();

/* ========= TRIGGER: new transaction created ========= */
exports.onTransactionCreated = functions.firestore
    .document("transactions/{transactionId}")
    .onCreate(async (snap, context) => {
      const tx = snap.data();
      const transactionId = context.params.transactionId;

      if (!tx.companyId) {
        console.error("Missing companyId on transaction:", transactionId);
        return null;
      }

      try {
        /* ---- 1. Fetch recipients ---- */
        const [ownersSnap, managersSnap] = await Promise.all([
          db.collection("users")
              .where("companyId", "==", tx.companyId)
              .where("role", "==", "owner")
              .get(),
          db.collection("users")
              .where("companyId", "==", tx.companyId)
              .where("role", "==", "manager")
              .get(),
        ]);

        let enteredByUser = null;
        if (tx.enteredBy) {
          const s = await db.collection("users").doc(tx.enteredBy).get();
          if (s.exists) enteredByUser = {uid: s.id, ...s.data()};
        }

        let customerUser = null;
        if (tx.customerId) {
          const s = await db.collection("users").doc(tx.customerId).get();
          if (s.exists && s.data().role === "customer") {
            customerUser = {uid: s.id, ...s.data()};
          }
        }

        /* ---- 2. Deduplicate by uid ---- */
        const recipientMap = new Map();
        ownersSnap.docs.forEach((d) =>
          recipientMap.set(d.id, {uid: d.id, ...d.data()}),
        );
        managersSnap.docs.forEach((d) =>
          recipientMap.set(d.id, {uid: d.id, ...d.data()}),
        );
        if (enteredByUser) {
          recipientMap.set(enteredByUser.uid, enteredByUser);
        }
        if (customerUser) {
          recipientMap.set(customerUser.uid, customerUser);
        }

        const recipients = Array.from(recipientMap.values());

        if (recipients.length === 0) {
          console.log("No recipients for transaction:", transactionId);
          return null;
        }

        /* ---- 3. Write one notification per recipient ---- */
        const now = admin.firestore.FieldValue.serverTimestamp();
        const batch = db.batch();

        recipients.forEach((recipient) => {
          const isSubmitter = recipient.uid === tx.enteredBy;
          const isCustomer = recipient.role === "customer";

          let title = "New Transaction";
          if (isSubmitter && !isCustomer) title = "Transaction Submitted";
          else if (isCustomer) title = "Payment Recorded";

          const ref = db.collection("notifications").doc();
          batch.set(ref, {
            notificationId: ref.id,
            recipientId: recipient.uid,
            recipientRole: recipient.role || "",
            companyId: tx.companyId,
            transactionId,
            transactionNo: tx.transactionNo || "",
            title,
            amount: tx.amount || 0,
            currency: tx.currency || "USD",
            method: tx.method || "",
            customerName: tx.customerName || "",
            type: "transaction",
            isRead: false,
            createdAt: now,
          });
        });

        await batch.commit();

        /* ---- 4. Email (disabled — uncomment when ready) ----
        const nodemailer = require("nodemailer");
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "infoalpharegisto@gmail.com",
            pass: "bgzapfefdffpjwue",
          },
        });
        await Promise.all(
          recipients.filter((r) => r.email).map((r) =>
            transporter.sendMail({ ... }).catch((e) => console.error(e))
          )
        );
        ---- end email ---- */

        console.log(
            "Notifications created for " + recipients.length +
            " recipients on transaction " + transactionId,
        );
        return null;
      } catch (error) {
        console.error("onTransactionCreated error:", error);
        return null;
      }
    });
