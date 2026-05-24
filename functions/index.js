const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const axios = require("axios");

admin.initializeApp();

const db = admin.firestore();

/* ========= EMAIL CONFIG ========= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "infoalpharegisto@gmail.com",
    pass: "idkynamucnqwcvhp",
  },
});

/* ========= WHATSAPP CONFIG ========= */
const WA_PHONE_ID = "1149455611576079";
const WA_TOKEN = "EAAULIDF1fZC8BRkL6vGillZBvjs2RqbKbbGJQ4eoWQcDfu3H9CEDe2w8Q8cCpZAgjHJ0gjxIORD2NEPpZC0kNkQjC3Am6UHJksFAzFGIpQk0qyo1ZCZAvQ8ZAmwC05paL7DnQISKAmBA58l4Tl8GKdRXtkd6Uzzp2uoQrg3u66qykOgYaRIBMZAW2VO5rhFz12cBt0VcdiY2dDevIEZCRO1zmHzG8fObSwMALKLLb";

const sendWhatsApp = async (phoneNumber, customerName, amount, currency) => {
  const to = String(phoneNumber).replace(/\D/g, "");
  if (!to) return;
  try {
    await axios.post(
        `https://graph.facebook.com/v20.0/${WA_PHONE_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: "transactional",
            language: {code: "en"},
            components: [
              {
                type: "body",
                parameters: [
                  {type: "text", text: customerName || "N/A"},
                  {type: "text", text: String(amount || 0)},
                  {type: "text", text: currency || "USD"},
                ],
              },
            ],
          },
        },
        {
          headers: {
            "Authorization": "Bearer " + WA_TOKEN,
            "Content-Type": "application/json",
          },
        },
    );
  } catch (err) {
    console.error(
        "WhatsApp failed for", phoneNumber, ":",
        err.response?.data || err.message,
    );
  }
};

/* ========= TRIGGER: transaction updated ========= */
exports.onTransactionUpdated = functions.firestore
    .document("transactions/{transactionId}")
    .onUpdate(async (change, context) => {
      const tx = change.after.data();
      const transactionId = context.params.transactionId;

      if (!tx.companyId) return null;

      try {
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

        const recipientMap = new Map();
        ownersSnap.docs.forEach((d) =>
          recipientMap.set(d.id, {uid: d.id, ...d.data()}),
        );
        managersSnap.docs.forEach((d) =>
          recipientMap.set(d.id, {uid: d.id, ...d.data()}),
        );

        const recipients = Array.from(recipientMap.values());
        if (recipients.length === 0) return null;

        const now = admin.firestore.FieldValue.serverTimestamp();
        const batch = db.batch();

        recipients.forEach((recipient) => {
          const ref = db.collection("notifications").doc();
          batch.set(ref, {
            notificationId: ref.id,
            recipientId: recipient.uid,
            recipientRole: recipient.role || "",
            companyId: tx.companyId,
            transactionId,
            transactionNo: tx.transactionNo || "",
            title: "Transaction Updated",
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

        const emailPromises = recipients
            .filter((r) => r.email)
            .map((r) => {
              const htmlBody =
                "<h2 style='color:#f59e0b'>Transaction Updated</h2>" +
                "<p>A transaction in your company has been modified.</p>" +
                "<table style='border-collapse:collapse;width:100%'>" +
                "<tr><td style='padding:8px;border:1px solid #e5e7eb'>" +
                "<b>Title</b></td>" +
                "<td style='padding:8px;border:1px solid #e5e7eb'>" +
                (tx.title || "N/A") + "</td></tr>" +
                "<tr><td style='padding:8px;border:1px solid #e5e7eb'>" +
                "<b>Customer</b></td>" +
                "<td style='padding:8px;border:1px solid #e5e7eb'>" +
                (tx.customerName || "N/A") + "</td></tr>" +
                "<tr><td style='padding:8px;border:1px solid #e5e7eb'>" +
                "<b>Amount</b></td>" +
                "<td style='padding:8px;border:1px solid #e5e7eb'>" +
                (tx.currency || "USD") + " " +
                (tx.amount || 0) + "</td></tr>" +
                "</table>" +
                "<p style='color:#6b7280;font-size:12px;margin-top:16px'>" +
                "Alpha Registo — Transaction Management</p>";
              return transporter
                  .sendMail({
                    from: "Alpha Registo <infoalpharegisto@gmail.com>",
                    to: r.email,
                    subject: "Transaction Updated: " + (tx.title || ""),
                    html: htmlBody,
                  })
                  .catch((err) =>
                    console.error(
                        "Email failed for", r.email, ":", err.message,
                    ),
                  );
            });

        await Promise.all(emailPromises);

        console.log(
            "Update notifications sent for " + recipients.length +
            " recipients on transaction " + transactionId,
        );
        return null;
      } catch (error) {
        console.error("onTransactionUpdated error:", error);
        return null;
      }
    });

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
        const [ownersSnap, managersSnap, accountantsSnap] = await Promise.all([
          db.collection("users")
              .where("companyId", "==", tx.companyId)
              .where("role", "==", "owner")
              .get(),
          db.collection("users")
              .where("companyId", "==", tx.companyId)
              .where("role", "==", "manager")
              .get(),
          db.collection("users")
              .where("companyId", "==", tx.companyId)
              .where("role", "==", "accountant")
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
        accountantsSnap.docs.forEach((d) =>
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

        /* ---- 4. Send email to each recipient ---- */
        const emailPromises = recipients
            .filter((r) => r.email)
            .map((r) => {
              const isSubmitter = r.uid === tx.enteredBy;
              const subject = isSubmitter ?
                "Submission Confirmed: " + (tx.title || "Transaction") :
                "New Transaction: " + (tx.title || "Transaction");
              const bodyMsg = isSubmitter ?
                "Your transaction has been recorded successfully." :
                "A new transaction has been entered in your company.";
              const htmlBody =
                "<h2 style='color:#2563eb'>" + subject + "</h2>" +
                "<p>" + bodyMsg + "</p>" +
                "<table style='border-collapse:collapse;width:100%'>" +
                "<tr><td style='padding:8px;border:1px solid #e5e7eb'>" +
                "<b>Customer</b></td>" +
                "<td style='padding:8px;border:1px solid #e5e7eb'>" +
                (tx.customerName || "N/A") + "</td></tr>" +
                "<tr><td style='padding:8px;border:1px solid #e5e7eb'>" +
                "<b>Amount</b></td>" +
                "<td style='padding:8px;border:1px solid #e5e7eb'>" +
                (tx.currency || "USD") + " " +
                (tx.amount || 0) + "</td></tr>" +
                "<tr><td style='padding:8px;border:1px solid #e5e7eb'>" +
                "<b>Payment Method</b></td>" +
                "<td style='padding:8px;border:1px solid #e5e7eb'>" +
                (tx.method || "N/A") + "</td></tr>" +
                "<tr><td style='padding:8px;border:1px solid #e5e7eb'>" +
                "<b>Transaction No</b></td>" +
                "<td style='padding:8px;border:1px solid #e5e7eb'>" +
                (tx.transactionNo || "N/A") + "</td></tr>" +
                "</table>" +
                "<p style='color:#6b7280;font-size:12px;margin-top:16px'>" +
                "Alpha Registo — Transaction Management</p>";
              return transporter
                  .sendMail({
                    from: "Alpha Registo <infoalpharegisto@gmail.com>",
                    to: r.email,
                    subject,
                    html: htmlBody,
                  })
                  .catch((err) =>
                    console.error(
                        "Email failed for", r.email, ":", err.message,
                    ),
                  );
            });

        await Promise.all(emailPromises);

        /* ---- 5. Send WhatsApp to each recipient with a phone ---- */
        const waRecipients = recipients.filter((r) => r.phoneNumber);
        console.log(
            "WhatsApp: " + waRecipients.length + " of " +
            recipients.length + " recipients have a phoneNumber.",
        );

        await Promise.all(waRecipients.map((r) => sendWhatsApp(
            r.phoneNumber,
            tx.customerName,
            tx.amount,
            tx.currency,
        )));

        console.log(
            "Done: notifications + emails + WhatsApp for " +
            recipients.length + " recipients on " + transactionId,
        );
        return null;
      } catch (error) {
        console.error("onTransactionCreated error:", error);
        return null;
      }
    });
