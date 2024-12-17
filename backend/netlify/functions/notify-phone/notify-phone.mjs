import { initializeApp } from "firebase/app";
import { getFirestore, setDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAv7GsdNRBtVl7cDtSxnZzI0En3GA69wGQ",
  authDomain: "enonce-4c66f.firebaseapp.com",
  databaseURL: "https://enonce-4c66f.firebaseio.com",
  projectId: "enonce-4c66f",
  storageBucket: "enonce-4c66f.firebasestorage.app",
  messagingSenderId: "708241487718",
  appId: "1:708241487718:web:623c6846f18a7423347aa7",
  measurementId: "G-RYJY9RQGNG",
};

export default async (request, context) => {
  try {
    const { device, receipt, amount } = context.params;

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const transactionObj = {
      receipt: receipt,
      createdAt: new Date(),
      amount: parseInt(amount),
      status: "pending",
    };

    await setDoc(doc(db, "transactions", device), transactionObj);

    return Response.json(
      {
        message: `${device} envoie ${amount} F CFA au ${receipt}!`,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    return new Response(error.toString(), {
      status: 500,
    });
  }
};

export const config = {
  path: "/:device/:receipt/:amount",
};
