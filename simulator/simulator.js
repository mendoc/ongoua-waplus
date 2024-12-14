import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  doc,
  updateDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

(async () => {
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

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  let transaction = null;
  const toast = _("ion-toast");
  let unsub = null;

  showProgressBar(false);
  _v("phone-id", phoneId());
  listenTransaction();
  loadIncludeBalanceCheckbox();

  _("#phone-id").addEventListener("ionBlur", () => {
    _("#phone-id").classList.add("ion-touched");
  });

  _("#phone-id").addEventListener("ionInput", (e) => {
    listenTransaction();
  });

  _("#includeBalance").addEventListener("ionChange", (e) => {
    localStorage.setItem("includeBalance", e.target.checked);
    updateSMS(e.target.checked);
  });

  __("ion-chip").forEach((statusEl) => {
    statusEl.addEventListener("click", toggleStatus);
  });

  function loadIncludeBalanceCheckbox() {
    let isInclude = localStorage.getItem("includeBalance") || false;
    isInclude = isInclude == "true";
    _("#includeBalance").checked = isInclude;
    updateSMS(isInclude);
  }

  function updateSMS(includeBalance) {
    console.log("includeBalance", includeBalance == true);
    const txt = includeBalance == true ? "Nouveau Solde 30815.43F." : "";
    _("#balance-sms").textContent = txt;
    if (transaction) transaction.sms = _t("sms");
  }

  function listenTransaction() {
    if (unsub) {
      console.log("unsub...");
      unsub();
      unsub = null;
    }
    if (!_v("phone-id")) return;
    showProgressBar(true);
    unsub = onSnapshot(doc(db, "transactions", _v("phone-id")), async (d) => {
      if (!d.exists()) {
        _("#phone-id").classList.add("ion-invalid");
        _("#phone-id").classList.add("ion-touched");
        clearData();
        showProgressBar(false);
        return;
      }
      _("#phone-id").classList.remove("ion-invalid");
      _("#phone-id").classList.remove("ion-touched");
      phoneId(d.id);
      transaction = d.data();
      updateData();
      showProgressBar(false);
    });
  }

  function toggleStatus(e) {
    if (!transaction) return;
    showProgressBar(true);
    _(`[outline="true"]`)?.removeAttribute("outline");
    e.target.setAttribute("outline", true);
    transaction.status = e.target.getAttribute("value");
    updateTransaction();
  }

  function phoneId(id) {
    if (id) localStorage.setItem("phoneId", id);
    else {
      return localStorage.getItem("phoneId");
    }
  }

  function showMessage(msg) {
    toast.message = msg;
    toast.present();
  }

  function showProgressBar(visible) {
    _("ion-progress-bar").style.display = visible ? "block" : "none";
  }

  function updateData() {
    if (transaction && transaction.amount && transaction.status) {
      _t("receipt", transaction.receipt);
      _t("receipt-sms", transaction.receipt);
      _t("amount", transaction.amount);
      _t("amount-sms", transaction.amount);
      _t("id-tx", getTId());
      _(`[outline="true"]`)?.removeAttribute("outline");
      _(`[value="${transaction.status}"]`)?.setAttribute("outline", true);
      transaction.sms = _t("sms");
    }
  }

  function clearData() {
    _t("receipt", "XXXXXXXXX");
    _t("receipt-sms", "XXXXXXXXX");
    _t("amount", "XXX");
    _t("amount-sms", "XXX");
    _t("id-tx", getTId());
    _(`[outline="true"]`)?.removeAttribute("outline");
    transaction = null;
  }

  async function updateTransaction() {
    console.log("updateTransaction", transaction);
    const transactionRef = doc(db, "transactions", _v("phone-id"));
    await updateDoc(transactionRef, transaction).catch((e) => {
      showProgressBar(false);
      showMessage(e.message);
    });
    showProgressBar(false);
    showMessage("Statut modifié.");
  }

  function getTId() {
    let currentDate = new Date().toISOString();
    currentDate = currentDate
      .replaceAll("-", "")
      .replace("T", "")
      .replace(":", "");
    return `PP${currentDate.substring(2, 8)}.${currentDate.substring(8, 12)}.${
      ["A", "B", "C"][Math.round(Math.random() * 2)]
    }${Math.floor(Math.random() * 90000) + 10000}`;
  }

  function _(elsel) {
    return document.querySelector(elsel);
  }

  function __(sel) {
    return document.querySelectorAll(sel);
  }

  function _t(elid, t) {
    const el = document.getElementById(elid);
    if (el == null) return;
    if (t) {
      el.textContent = t;
    } else return el.textContent;
  }

  function _v(elid, v) {
    const el = document.getElementById(elid);
    if (el && v) {
      el.value = v;
    } else return el.value;
  }
})();
