import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsub = onSnapshot(
      q,
      snap => {
        setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      err => {
        console.error("useNotifications error:", err);
        setLoading(false);
      }
    );

    return unsub;
  }, [user?.uid]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = notificationId => {
    updateDoc(doc(db, "notifications", notificationId), { isRead: true }).catch(
      err => console.error("markAsRead error:", err)
    );
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (!unread.length) return;
    const batch = writeBatch(db);
    unread.forEach(n =>
      batch.update(doc(db, "notifications", n.id), { isRead: true })
    );
    await batch.commit();
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}
