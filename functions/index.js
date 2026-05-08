const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const nodemailer = require("nodemailer");

admin.initializeApp();

/* ========= EMAIL CONFIG ========= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "infoalpharegisto@gmail.com",
    pass: "bgzapfefdffpjwue",
  },
});

/* ========= TRIGGER ========= */
exports.sendTransactionNotification = functions.firestore
  .document("notifications/{id}")
  .onCreate(async (snap, context) => {
    const data = snap.data();

    try {
      /* ========= GET CUSTOMER ========= */
      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(data.receivers[0])
        .get();

      const user = userDoc.data();

      /* ========= EMAIL ========= */
    if (data.channels && data.channels.email && user && user.email)        {
        await transporter.sendMail({
          from: "infoalpharegisto@gmail.com",
          to: user.email,
          subject: "Transaction Receipt",
          html: `
            <h2>${data.title}</h2>
            <p>${data.message}</p>
          `,
        });
      }

      /* ========= WHATSAPP ========= */
    if (data.channels && data.channels.whatsapp && user && user.phone)        {
        await axios.post("https://api.twilio.com/...", {
          to: `whatsapp:${user.phone}`,
          from: "whatsapp:+14155238886",
          body: data.message,
        });
      }

      /* ========= UPDATE STATUS ========= */
      await snap.ref.update({ status: "sent" });

    } catch (error) {
      console.error(error);
      await snap.ref.update({ status: "failed" });
    }
  });