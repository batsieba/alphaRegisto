import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../config/firebase";

export async function registerForPushNotifications(userId) {
  try {
    console.log("Starting push registration...");

    if (!Device.isDevice) {
      console.log("Not a physical device");
      return;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    console.log("Existing permission:", existingStatus);

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    console.log("Final permission:", finalStatus);

    if (finalStatus !== "granted") {
      console.log("Permission not granted");
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    console.log("TOKEN:", token);

    await updateDoc(doc(db, "users", userId), {
      fcmTokens: arrayUnion(token),
    });

    console.log("Token saved to Firestore");

  } catch (error) {
    console.log("Push registration error:", error);
  }
}
