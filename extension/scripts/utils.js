import { config } from "./config.js";
import { images } from "./images.js";

function hoverItem(event) {
  if (event.target.classList.contains("_aj-s")) {
    event.target.classList.remove("_aj-s");
  } else {
    event.target.classList.add("_aj-s");
  }
}

function handleClick(event) {
  console.log("Affichage de la boite de dialogue");
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
function _(sel) {
  return document.querySelector(sel);
}

function showError(msg = "", show = true) {
  const amountFieldParentEl = _(config.amountFieldSelector);
  const errorAlertEl = _(config.errorAlertSelector);
  if (show) {
    amountFieldParentEl.classList.add("_ald0");
    errorAlertEl.innerHTML = `<div class="_aldb">${msg}</div>`;
  } else {
    amountFieldParentEl.classList.remove("_ald0");
    errorAlertEl.innerHTML = "";
  }
}
function numberWithSpaces(x, group = 3) {
  if (group == 2) return x.toString().replace(/\B(?=(\d{2})+(?!\d))/g, " ");
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
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
function closeDialog() {
  document.querySelector('div[role="dialog"] [data-icon="x"]').click();
}

function injectScript() {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("scripts/inject.js");
  script.type = "text/javascript";
  document.head.appendChild(script);
}
function sendMessage(content, chatId) {
  console.log("Envoi du message...");
  window.postMessage({ type: "TX_OK", chatId, content }, "*");
}
function addMenuItem(targetEl) {
  console.log("Affichage du menu");

  // On récupère le dernier élément de la liste
  const lastMenuItem = targetEl.querySelector(config.lastMenuItemSelector);

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
  newMenuItem.querySelector("svg").innerHTML = images.mobileMoneyIcon;
  newMenuItem.querySelector("svg").setAttribute("fill", "currentColor");
  newMenuItem.querySelector("svg").setAttribute("width", "20");
  newMenuItem.querySelector("svg").setAttribute("height", "20");
  newMenuItem.querySelector("svg").setAttribute("viewBox", "0 0 20 20");

  // On modifie le texte de la nouvelle option
  newMenuItem.querySelector("span").textContent = "Envoyer de l'argent";

  // On insère la nouvelle option dans le menu après le dernier élément de la liste
  lastMenuItem.parentNode.insertBefore(newMenuItem, lastMenuItem.nextSibling);

  console.log("Ajout de la nouvelle option : ", newMenuItem);
}

function updateDialogFields(targetEl, number, cb) {
  const dialogParentEl = targetEl;
  const dialogEl = dialogParentEl.querySelector('div[role="dialog"] > div');
  const dialogTitle = dialogParentEl.querySelector("h1");
  if (!dialogTitle) return;
  dialogTitle.textContent = "Envoyer de l'argent";

  // Edition du label du champ de saisie
  const dialogLabel = dialogParentEl.querySelector(config.dialogLabelSelector);
  if (!dialogLabel) return;
  dialogLabel.textContent = "Montant à envoyer";
  dialogLabel.parentNode.style = "padding-bottom: 10px";

  // Creation du champ de saisie du montant
  const amountEl = document.createElement("INPUT");
  amountEl.classList.add("input-amount");
  amountEl.setAttribute("type", "text");
  amountEl.setAttribute("placeholder", "Saisissez le montant à envoyer");
  amountEl.style = config.amountFieldStyle;
  amountEl.addEventListener("keyup", cb);

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
  dialogReceiptLabelEl.innerHTML = `Bénéficiaire : <span style="${
    config.receiptElStyle
  }">${numberWithSpaces(number, 2).replace(" ", "")}</span>`;

  // Suppression des autres champs inutiles
  while (dialogReceiptLabelEl.nextElementSibling) {
    dialogReceiptLabelEl.nextElementSibling.remove();
  }

  dialogEl.style = "margin: 250px 0; min-height: 375px; max-height: 380px;";
}

function isValidAmount(amount) {
  const regex = /^([1-9][0-9]*)$/;
  console.log("amount", typeof amount, amount);
  cleanError();

  if (amount.length === 0) return false;

  if (!regex.test(amount)) {
    showError("Le montant saisi est invalide.");
    return false;
  }

  if (parseInt(amount) < 100) {
    showError("Le montant minimum est 100.");
    return false;
  }

  if (parseInt(amount) > 500000) {
    showError("Le montant maximum est 500000.");
    return false;
  }

  return true;
}

function activateSendButton(activate = true, cb) {
  const btnSend = document.querySelector(config.btnSendSelector).parentElement;
  if (activate) {
    btnSend.classList.remove(...config.btnSendActiveClasses);
    btnSend.classList.add(...config.btnSendDeactiveClasses);
    btnSend.addEventListener("click", cb);
  } else {
    btnSend.classList.add(...config.btnSendActiveClasses);
    btnSend.classList.remove(...config.btnSendDeactiveClasses);
    btnSend.removeEventListener("click", cb);
  }
}

export {
  hoverItem,
  handleClick,
  cleanError,
  showError,
  numberWithSpaces,
  validateNumber,
  closeDialog,
  injectScript,
  sendMessage,
  addMenuItem,
  updateDialogFields,
  isValidAmount,
  activateSendButton,
};
