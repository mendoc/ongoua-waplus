(async () => {
  const configURL = chrome.runtime.getURL("scripts/config.js");
  const imagesURL = chrome.runtime.getURL("scripts/images.js");
  const utilsURL = chrome.runtime.getURL("scripts/utils.js");
  const firebaseConfigURL = chrome.runtime.getURL("scripts/firebase-config.js");
  const firebaseAppURL = chrome.runtime.getURL("scripts/firebase-app.js");
  const firebaseFirestoreURL = chrome.runtime.getURL(
    "scripts/firebase-firestore.js"
  );

  const { firebaseConfig } = await import(firebaseConfigURL);
  const { initializeApp } = await import(firebaseAppURL);
  const { getFirestore, onSnapshot, doc } = await import(firebaseFirestoreURL);
  const { config } = await import(configURL);
  const { images } = await import(imagesURL);
  const {
    updateDialogFields,
    validateNumber,
    closeDialog,
    injectScript,
    sendMessage,
    addMenuItem,
    isValidAmount,
    activateSendButton,
  } = await import(utilsURL);

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  let debugMode = true;
  let amountToSend = 0;
  let receiptPhoneNumber = "";
  let currentChatId;
  let paneSideVisible = false;
  let currentUser = "";
  let unsub;
  let timeoutID = undefined;

  if (!debugMode) console.log = () => {};

  function sendMoney() {
    console.log("Envoi de l'argent en cours ...");
    console.log("amount to send:", amountToSend);
    console.log("receipt phone number:", receiptPhoneNumber);
    showProgressDialog();

    timeoutID = setTimeout(() => {
      showProgressDialog("timeout");
    }, 60 * 1000);

    const baseUrl = "https://ongoua-waplus.netlify.app";
    const URL = `${baseUrl}/${currentUser}/${receiptPhoneNumber}/${amountToSend}`;

    fetch(URL, { method: "POST" })
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        listenTransaction();
      })
      .catch((err) => {
        console.warn(err);
        showProgressDialog("error");
      });
  }

  async function cancelTransaction() {
    console.log("Annulation de la transaction ...");

    const baseUrl = "https://ongoua-waplus.netlify.app";
    const URL = `${baseUrl}/cancel/${currentUser}`;

    await fetch(URL).catch((err) => {
      console.warn(err);
      showProgressDialog("error");
    });
  }

  function listenTransaction() {
    unsub = onSnapshot(doc(db, "transactions", currentUser), async (d) => {
      console.log(d.id, d.data());
      if (!d.exists()) return;
      const tx = d.data();

      if (tx && tx.status) {
        if (tx.status != "pending" && typeof timeoutID === "number") {
          console.log("Annulation du timeout");
          clearTimeout(timeoutID);
          timeoutID = undefined;
        }
        showProgressDialog(tx.status);
        if (
          tx.amount == amountToSend &&
          tx.status === "ok" &&
          tx.receipt == receiptPhoneNumber
        ) {
          console.log("Argent envoyé");
          stopListenTransaction();
          setTimeout(closeDialog, 3 * 1000);
          const msg = tx.sms
            ? tx.sms
            : `Vous avez envoyé ${tx.amount}F au ${tx.receipt}`;
          sendMessage(msg, currentChatId);
        }
      }
    });
  }

  function stopListenTransaction() {
    if (!unsub) return;
    console.log("stop listening...");
    unsub();
    unsub = null;
  }

  function showProgressDialog(status = "pending") {
    let title = "";
    let subtitle = "";
    let icon = images.loading;
    // On crée la div de chargement
    let loadingBlock = document.querySelector(".progress-block");
    if (!loadingBlock) {
      console.log("Creation de loadingBlock...");
      loadingBlock = document.createElement("DIV");
      loadingBlock.classList.add("progress-block");
      loadingBlock.style = config.loadingBlockStyle;

      const dialogHeader = document.querySelector(config.dialogHeaderSelector);
      if (!dialogHeader) return;
      dialogHeader.nextElementSibling.appendChild(loadingBlock);

      loadingBlock.innerHTML = `<span class="dialog-title" style=" color: var(--primary); font-size: 20px; font-weight: 500; "></span><span class="dialog-icon"></span><span class="dialog-subtitle" style=" margin-top: 5%; ">${subtitle}</span> <span class="btn-retry" style="visibility: hidden; margin-top: 5%; padding: 8px 12px; background-color: rgb(240, 242, 245); color: #54656f; font-size: 15px; border-radius: 42px; cursor: pointer;">Réessayer</span>`;

      // Evenement : revenir a la boite de dialogue au click sur Annuler
      loadingBlock
        .querySelector(".btn-retry")
        .addEventListener("click", hideProgressDialog);

      // On cache le bouton Envoyer
      dialogHeader.nextElementSibling.nextElementSibling.style =
        "display: none;";
    }
    loadingBlock.querySelector(".btn-retry").style.visibility = "hidden";

    switch (status) {
      case "pending":
        title = "Traitement en attente";
        subtitle = "Veuillez finaliser la procédure sur votre téléphone";
        break;
      case "progress":
        title = "Traitement en cours";
        subtitle = "Traitement en cours sur le téléphone";
        break;
      case "cancel":
        title = "Transaction annulée";
        subtitle = "La transaction a été annulée";
        icon = images.cancel
        break;
      case "ok":
        title = "Transaction effectuée";
        subtitle = "La transaction a été effectuée avec succès";
        icon = images.ok
        break;
      case "error":
        title = "Traitement échoué";
        subtitle =
          "Une erreur s'est produite lors du traitement de la transaction";
        icon = images.error
        loadingBlock.querySelector(".btn-retry").style.visibility = "visible";
        cancelTransaction();
        // stopListenTransaction();
        break;
      case "timeout":
        title = "Traitement trop long";
        subtitle = "Le traitement a pris trop de temps. Veuillez réessayer.";
        icon = images.timeout
        loadingBlock.querySelector(".btn-retry").style.visibility = "visible";
        cancelTransaction();
        // stopListenTransaction();
        break;
      default:
        break;
    }

    loadingBlock.querySelector(".dialog-title").textContent = title;
    loadingBlock.querySelector(".dialog-icon").innerHTML = icon;
    loadingBlock.querySelector(".dialog-subtitle").textContent = subtitle;
  }

  function hideProgressDialog() {
    // Suppression du loading
    document
      .querySelector('div[role="dialog"] > div div.progress-block')
      .remove();

    // Affichage du bouton Envoyer
    document.querySelector(
      config.dialogHeaderSelector
    ).nextElementSibling.nextElementSibling.style = "display: flex;";

    stopListenTransaction();
  }

  var observer = new MutationObserver(listenDOMInsertions);
  observer.observe(document.querySelector("body"), {
    childList: true,
    subtree: true,
  });

  function listenDOMInsertions(mutationsList) {
    for (var mutation of mutationsList) {
      if (mutation.addedNodes.length > 0) {
        const targetEl = mutation.addedNodes[0];
        const classes = targetEl.classList?.value || "";
        //   console.log("classes", `#${targetEl.id}`, classes);
        const paneSide = document.querySelector("#pane-side");
        const inputAmountEl = document.querySelector(".input-amount");

        if (!inputAmountEl) {
          stopListenTransaction();
        }

        if (paneSide && !paneSideVisible) {
          paneSideVisible = true;
          injectScript();
          console.log("Init ...");
        }

        // On verifie si c'est le bouton "+" qui a été cliqué
        if (classes.includes("_ak4w")) {
          if (receiptPhoneNumber != "") addMenuItem(targetEl);
        } else if (classes.includes(config.dialogClasses)) {
          updateDialogFields(targetEl, receiptPhoneNumber, validateAmount);
        }
      }
    }
  }

  function validateAmount(event) {
    if (isValidAmount(event.target.value)) {
      amountToSend = event.target.value;
      activateSendButton(true, sendMoney);
    } else {
      activateSendButton(false, sendMoney);
    }
  }

  // Écoute les messages du script injecté
  window.addEventListener(
    "message",
    function (event) {
      switch (event.data.type) {
        case "USER":
          console.log("content.js: Current user", event.data.user);
          currentUser = event.data.user;
          break;
        case "CHAT_CHANGED":
          console.log("content.js: Chat changé", event.data.contact);
          currentChatId = event.data.contact;
          receiptPhoneNumber = "";
          if (currentChatId.server.includes("g.us")) return;
          receiptPhoneNumber = validateNumber(currentChatId.user);
          console.log("receiptPhoneNumber", receiptPhoneNumber);
          break;
      }
    },
    false
  );
})();
