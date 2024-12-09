/*
    Code à coller dans la console du navigateur à l'onglet de WhatsApp Web.
    Il suffit d'actualiser la page le supprimer
  */

let debugMode = true;
let amountToSend = 0;
let receiptPhoneNumber = "";
let paneSideVisible = false;
let currentUser = "";
let fs;
let unsub;
const lastMenuItemSelector = "ul > div > div > div:nth-child(5)";
const dialogClasses = "x10l6tqk x13vifvy xds687c x1ey2m1c x17qophe";
const dialogLabelSelector = "span.xlm9qay.xk50ysn";
const mobileMoneyIcon = `<path d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 0 0-1.138-.432ZM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 0 0-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.202.592.037.051.08.102.128.152Z" /><path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-6a.75.75 0 0 1 .75.75v.316a3.78 3.78 0 0 1 1.653.713c.426.33.744.74.925 1.2a.75.75 0 0 1-1.395.55 1.35 1.35 0 0 0-.447-.563 2.187 2.187 0 0 0-.736-.363V9.3c.698.093 1.383.32 1.959.696.787.514 1.29 1.27 1.29 2.13 0 .86-.504 1.616-1.29 2.13-.576.377-1.261.603-1.96.696v.299a.75.75 0 1 1-1.5 0v-.3c-.697-.092-1.382-.318-1.958-.695-.482-.315-.857-.717-1.078-1.188a.75.75 0 1 1 1.359-.636c.08.173.245.376.54.569.313.205.706.353 1.138.432v-2.748a3.782 3.782 0 0 1-1.653-.713C6.9 9.433 6.5 8.681 6.5 7.875c0-.805.4-1.558 1.097-2.096a3.78 3.78 0 0 1 1.653-.713V4.75A.75.75 0 0 1 10 4Z" clip-rule="evenodd" />`;
const amountFieldSelector = 'div[role="dialog"] div._ald3';
const errorAlertSelector = 'div[role="dialog"] div._ald4';
const amountFieldStyle = `width: 100%; border: none; outline: none; font: inherit; color: var(--primary); max-height: 7.35em; min-height: 1.47em; line-height: 1.47em; font-size: 1.0625rem; padding: 0; margin: 0;`;
const receiptElStyle = `padding: 8px 12px; background-color: rgb(240, 242, 245); color: #54656f; font-size: 15px;border-radius: 42px;`;
const loadingBlockStyle = `position: absolute;inset: 0px;background: white;z-index: 50;display: flex;padding-top: 12%;flex-direction: column;align-items: center;`;
const btnSendSelector = "div[role=dialog] span[data-icon=send]";
const btnCloseSelector = "div[role=dialog] div[role=button]";
const dialogHeaderSelector = 'div[role="dialog"] > div header';
const btnSendDeactiveClasses = ["x7o08j2", "x1rluvsa", "xu306ak", "x1gfkgh9"];
const btnSendActiveClasses = [
  "x1pumdge",
  "x1h6gzvc",
  "x1gnnqk1",
  "x4emqeb",
  "x4xbgct",
  "xbnn667",
  "xpk4wdd",
  "x1yzwbto",
];

function debug(...data) {
  if (!debugMode) return;
  console.log(...data);
}

function hoverItem(event) {
  if (event.target.classList.contains("_aj-s")) {
    event.target.classList.remove("_aj-s");
  } else {
    event.target.classList.add("_aj-s");
  }
}

function handleClick(event) {
  debug("Affichage de la boite de dialogue");
  console.log(event.target.closest("li").parentNode.parentNode);
  event.target
    .closest("li")
    .parentNode.parentNode.querySelector(
      "ul > div > div > div:nth-child(5) > li"
    )
    .click();
}

function cleanError() {
  showError("", false);
}

function showError(msg = "", show = true) {
  const amountFieldParentEl = document.querySelector(amountFieldSelector);
  const errorAlertEl = document.querySelector(errorAlertSelector);
  if (show) {
    amountFieldParentEl.classList.add("_ald0");
    errorAlertEl.innerHTML = `<div class="_aldb">${msg}</div>`;
  } else {
    amountFieldParentEl.classList.remove("_ald0");
    errorAlertEl.innerHTML = "";
  }
}

function validateAmount(event) {
  const amount = event.target.value;
  const regex = /^([1-9][0-9]*)$/;
  debug("amount", typeof amount, amount);
  cleanError();
  activateSendButton(false);

  if (amount.length === 0) return;

  if (!regex.test(amount)) {
    showError("Le montant saisi est invalide.");
    return;
  }

  if (parseInt(amount) < 100) {
    showError("Le montant minimum est 100.");
    return;
  }

  if (parseInt(amount) > 500000) {
    showError("Le montant maximum est 500000.");
    return;
  }

  amountToSend = amount;
  activateSendButton();
}

function activateSendButton(activate = true) {
  const btnSend = document.querySelector(btnSendSelector).parentElement;
  if (activate) {
    btnSend.classList.remove(...btnSendActiveClasses);
    btnSend.classList.add(...btnSendDeactiveClasses);
    btnSend.addEventListener("click", sendMoney);
  } else {
    btnSend.classList.add(...btnSendActiveClasses);
    btnSend.classList.remove(...btnSendDeactiveClasses);
    btnSend.removeEventListener("click", sendMoney);
  }
}

function sendMoney() {
  debug("Envoi de l'argent en cours ...");
  debug("amount to send:", amountToSend);
  debug("receipt phone number:", receiptPhoneNumber);
  showProgressDialog();

  const baseUrl =
    "https://8888-mendoc-ongouawaplus-mqtllwy5054.ws-eu117.gitpod.io";
  const URL = `${baseUrl}/${currentUser}/${receiptPhoneNumber}/${amountToSend}`;

  fetch(URL)
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      listenTransaction();
    })
    .catch(console.log);
}

function listenTransaction() {
  unsub = fs.onSnapshot(
    fs.doc(fs.db, "transactions", currentUser),
    async (d) => {
      console.log(d.id, d.data());
      if (!d.exists) return;
      const tx = d.data();
      if (tx && tx.status && tx.status === "finished") {
        if (tx.amount == amountToSend && tx.receipt == receiptPhoneNumber) {
          console.log("Argent envoyé");
          stopListenTransaction();
          closeDialog();
          sendMessage();
        }
      }
    }
  );
}

function stopListenTransaction() {
  if (!unsub) return;
  console.log("stop listening...");
  unsub();
  unsub = null;
}

function showProgressDialog() {
  // On crée la div de chargement
  const loadingBlock = document.createElement("DIV");
  loadingBlock.classList.add("progress-block");
  loadingBlock.style = loadingBlockStyle;
  loadingBlock.innerHTML = `<span style=" color: var(--primary); font-size: 20px; font-weight: 500; ">Traitement en cours</span> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" width="50" height="50" style="shape-rendering: auto; display: block; background: rgb(255, 255, 255);" xmlns:xlink="http://www.w3.org/1999/xlink"><g><circle fill="#e8e8e8" r="10" cy="50" cx="84"> <animate begin="0s" keySplines="0 0.5 0.5 1" values="10;0" keyTimes="0;1" calcMode="spline" dur="0.8064516129032259s" repeatCount="indefinite" attributeName="r"></animate> <animate begin="0s" values="#e8e8e8;#f0f2f5;#e8e9ea;#d1d1d1;#e8e8e8" keyTimes="0;0.25;0.5;0.75;1" calcMode="discrete" dur="3.2258064516129035s" repeatCount="indefinite" attributeName="fill"></animate> </circle><circle fill="#e8e8e8" r="10" cy="50" cx="16"> <animate begin="0s" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" values="0;0;10;10;10" keyTimes="0;0.25;0.5;0.75;1" calcMode="spline" dur="3.2258064516129035s" repeatCount="indefinite" attributeName="r"></animate> <animate begin="0s" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" values="16;16;16;50;84" keyTimes="0;0.25;0.5;0.75;1" calcMode="spline" dur="3.2258064516129035s" repeatCount="indefinite" attributeName="cx"></animate> </circle><circle fill="#d1d1d1" r="10" cy="50" cx="50"> <animate begin="-0.8064516129032259s" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" values="0;0;10;10;10" keyTimes="0;0.25;0.5;0.75;1" calcMode="spline" dur="3.2258064516129035s" repeatCount="indefinite" attributeName="r"></animate> <animate begin="-0.8064516129032259s" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" values="16;16;16;50;84" keyTimes="0;0.25;0.5;0.75;1" calcMode="spline" dur="3.2258064516129035s" repeatCount="indefinite" attributeName="cx"></animate> </circle><circle fill="#e8e9ea" r="10" cy="50" cx="84"> <animate begin="-1.6129032258064517s" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" values="0;0;10;10;10" keyTimes="0;0.25;0.5;0.75;1" calcMode="spline" dur="3.2258064516129035s" repeatCount="indefinite" attributeName="r"></animate> <animate begin="-1.6129032258064517s" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" values="16;16;16;50;84" keyTimes="0;0.25;0.5;0.75;1" calcMode="spline" dur="3.2258064516129035s" repeatCount="indefinite" attributeName="cx"></animate> </circle><circle fill="#f0f2f5" r="10" cy="50" cx="16"> <animate begin="-2.4193548387096775s" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" values="0;0;10;10;10" keyTimes="0;0.25;0.5;0.75;1" calcMode="spline" dur="3.2258064516129035s" repeatCount="indefinite" attributeName="r"></animate> <animate begin="-2.4193548387096775s" keySplines="0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1" values="16;16;16;50;84" keyTimes="0;0.25;0.5;0.75;1" calcMode="spline" dur="3.2258064516129035s" repeatCount="indefinite" attributeName="cx"></animate> </circle><g></g></g><!-- [ldio] generated by https://loading.io --></svg> <span style=" margin-top: 5%; ">Veuillez finaliser la procédure sur votre téléphone</span> <span class="btn-cancel" style=" margin-top: 10%; padding: 8px 12px; background-color: rgb(240, 242, 245); color: #54656f; font-size: 15px; border-radius: 42px; cursor: pointer; ">Annuler</span>`;
  const dialogHeader = document.querySelector(dialogHeaderSelector);
  dialogHeader.nextElementSibling.appendChild(loadingBlock);

  // Evenement : revenir a la boite de dialogue au click sur Annuler
  loadingBlock
    .querySelector(".btn-cancel")
    .addEventListener("click", hideProgressDialog);

  // On cache le bouton Envoyer
  dialogHeader.nextElementSibling.nextElementSibling.style = "display: none;";
}

function hideProgressDialog() {
  // Suppression du loading
  document
    .querySelector('div[role="dialog"] > div div.progress-block')
    .remove();

  // Affichage du bouton Envoyer
  document.querySelector(
    dialogHeaderSelector
  ).nextElementSibling.nextElementSibling.style = "display: flex;";

  stopListenTransaction();
}

function closeDialog() {
  document.querySelector('div[role="dialog"] [data-icon="x"]').click();
}

function sendMessage(){
    console.log("Envoi du message...")
}

function listenDOMInsertions(mutationsList) {
  for (var mutation of mutationsList) {
    if (mutation.addedNodes.length > 0) {
      const targetEl = mutation.addedNodes[0];
      const classes = targetEl.classList?.value || "";
      //   debug("classes", `#${targetEl.id}`, classes);
      const paneSide = document.querySelector("#pane-side");
      const inputAmountEl = document.querySelector("#input-amount");

      if (!inputAmountEl) {
        stopListenTransaction();
      }

      if (paneSide && !paneSideVisible) {
        //paneSide.addEventListener("click", handlePaneSideClick);
        paneSideVisible = true;
        // injectScript();
        // Démarrer l'initialisation
        initialize();
        debug("Init ...");
      }

      // On verifie si c'est le bouton "+" qui a été cliqué
      if (classes.includes("_ak4w")) {
        addMenuItem(targetEl);
      } else if (classes.includes(dialogClasses)) {
        updateDialogFields(targetEl);
      }
    }
  }
}

function addMenuItem(targetEl) {
  debug("Affichage du menu");

  // Si le numéro n'est pas valide, on désactive l'option
  if (receiptPhoneNumber === "") return;

  // On récupère le dernier élément de la liste
  const lastMenuItem = targetEl.querySelector(lastMenuItemSelector);

  if (lastMenuItem === null) return;

  // On crée une option basée sur le dernier élément de la liste
  const newMenuItem = lastMenuItem.cloneNode(true);

  // On gère le survol de la nouvelle option
  newMenuItem
    .querySelector("li")
    .addEventListener("mouseenter", hoverItem, false);
  newMenuItem
    .querySelector("li")
    .addEventListener("mouseleave", hoverItem, false);

  // On gère le click sur la nouvelle option
  newMenuItem.querySelector("li").addEventListener("click", handleClick, false);

  // On définit l'opacité à 1
  newMenuItem.querySelector("li").style = "opacity: 1";

  // On remplace l'icone de l'option par le logo d'Airtel
  newMenuItem.querySelector("svg").innerHTML = mobileMoneyIcon;
  newMenuItem.querySelector("svg").setAttribute("fill", "currentColor");
  newMenuItem.querySelector("svg").setAttribute("width", "20");
  newMenuItem.querySelector("svg").setAttribute("height", "20");
  newMenuItem.querySelector("svg").setAttribute("viewBox", "0 0 20 20");

  // On modifie le texte de la nouvelle option
  newMenuItem.querySelector("span").textContent = "Envoyer de l'argent";

  // On insère la nouvelle option dans le menu après le dernier élément de la liste
  lastMenuItem.parentNode.insertBefore(newMenuItem, lastMenuItem.nextSibling);

  debug("Ajout de la nouvelle option : ", newMenuItem);
}

function updateDialogFields(targetEl) {
  const dialogParentEl = targetEl;
  const dialogEl = dialogParentEl.querySelector('div[role="dialog"] > div');
  const dialogTitle = dialogParentEl.querySelector("h1");
  if (!dialogTitle) return;
  dialogTitle.textContent = "Envoyer de l'argent";

  // Edition du label du champ de saisie
  const dialogLabel = dialogParentEl.querySelector(dialogLabelSelector);
  if (!dialogLabel) return;
  dialogLabel.textContent = "Montant à envoyer";
  dialogLabel.parentNode.style = "padding-bottom: 10px";

  // Creation du champ de saisie du montant
  const amountEl = document.createElement("INPUT");
  amountEl.setAttribute("id", "input-amount");
  amountEl.setAttribute("type", "text");
  amountEl.setAttribute("placeholder", "Saisissez le montant à envoyer");
  amountEl.style = amountFieldStyle;
  amountEl.addEventListener("keyup", validateAmount);

  // Ajout du champ de saisie dans la boite de dialogue
  const amountParentEl =
    dialogLabel.nextElementSibling.querySelector("div._aldd");
  amountParentEl.innerHTML = "";
  amountParentEl.appendChild(amountEl);

  // Suppression de l'icone de smiley
  dialogLabel.nextElementSibling.querySelector("span._alda").remove();

  // Affichage du nom du beneficiaire
  const dialogReceiptLabelEl =
    dialogLabel.nextElementSibling.nextElementSibling;
  dialogReceiptLabelEl.innerHTML = `Bénéficiaire : <span style="${receiptElStyle}">${numberWithSpaces(
    receiptPhoneNumber,
    2
  ).replace(" ", "")}</span>`;

  // Suppression des autres champs inutiles
  while (dialogReceiptLabelEl.nextElementSibling) {
    dialogReceiptLabelEl.nextElementSibling.remove();
  }

  dialogEl.style = "margin: 250px 0; min-height: 375px; max-height: 380px;";
}

function setReceiptPhoneNumber(contactID) {
  // On supprime le dernier numéro enregistré
  receiptPhoneNumber = "";

  if (contactID.server.includes("g.us")) return;

  // On récupère le numero de téléphone après avoir vérifié si c'est un numéro gabonais
  receiptPhoneNumber = validateNumber(contactID.user);

  console.log("receiptPhoneNumber", receiptPhoneNumber);
}

function validateNumber(number) {
  // Si ce n'est pas un numéro gabonais, on ne continue pas
  if (!number.startsWith("241")) return "";

  // On récupère le numéro sans l'indicatif 241
  let tempPhoneNumber = number.substring(3);

  // On ajoute un 0 au debut s'il n'y en a pas
  if (!tempPhoneNumber.startsWith("0")) tempPhoneNumber = "0" + tempPhoneNumber;

  // On met le numéro à la nouvelle numérotation
  if (tempPhoneNumber.length === 8) {
    if (/^0[265]/.test(tempPhoneNumber)) {
      tempPhoneNumber = "06" + tempPhoneNumber.substring(1);
    } else if (/^0[47]/.test(tempPhoneNumber)) {
      tempPhoneNumber = "07" + tempPhoneNumber.substring(1);
    }
  }

  return tempPhoneNumber;
}

function numberWithSpaces(x, group = 3) {
  if (group == 2) return x.toString().replace(/\B(?=(\d{2})+(?!\d))/g, " ");
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

var observer = new MutationObserver(listenDOMInsertions);
observer.observe(document.querySelector("body"), {
  childList: true,
  subtree: true,
});

function injectScript() {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("inject.js");
  script.type = "text/javascript";
  document.head.appendChild(script);
}

// Écoute les messages du script injecté
window.addEventListener(
  "message",
  function (event) {
    if (event.origin !== "https://web.whatsapp.com") {
      console.log(
        "content.js: Message ignoré car mauvaise origine",
        event.origin
      );
      return;
    }

    if (event.data.type === "USER") {
      console.log("content.js: Current user", event.data.user);
      currentUser = event.data.user;
    } else if (event.data.type === "STORE_READY") {
      console.log("content.js: Store reçu", event.data.contact);
      setReceiptPhoneNumber(event.data.contact);
    } else if (event.data.type === "STORE_ERROR") {
      console.log("content.js: Erreur reçue", event.data.error);
    }
  },
  false
);

async function initFirestore() {
  try {
    const firebaseAppURL = chrome.runtime.getURL("firebase-app.js");
    const { initializeApp } = await import(firebaseAppURL);
    const firebaseFirestoreURL = chrome.runtime.getURL("firebase-firestore.js");
    const { getFirestore, onSnapshot, doc } = await import(
      firebaseFirestoreURL
    );

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

    const app = initializeApp(firebaseConfig);
    const firestore = getFirestore(app);
    return { db: firestore, onSnapshot, doc };
  } catch (error) {
    console.error("Erreur lors de l'initialisation de Firestore:", error);
    throw error;
  }
}

async function initialize() {
  try {
    fs = await initFirestore();
    injectScript();
  } catch (error) {
    console.error("Erreur d'initialisation:", error);
  }
}
