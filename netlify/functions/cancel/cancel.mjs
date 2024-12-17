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
    const { device } = context.params;

    console.log(context);

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    await setDoc(doc(db, "transactions", device), null);

    return Response.json(
      {
        message: `Transaction de ${device} annulée.`,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    return Response.json(
      { message: error.toString() },
      {
        status: 500,
      }
    );
  }
};

export const config = {
  path: "/cancel/:device",
};
