window.Store = Object.assign({}, window.require("WAWebCollections"));
window.Store.User = window.require("WAWebUserPrefsMeUser");
const currentAccount = window.Store.User.getMe();
if (currentAccount) {
  window.postMessage({ type: "USER", user: currentAccount.user }, "*");
}

window.Store.Chat.on("change:active", (chat) => {
  if (!chat.active) return;
  window.postMessage({ type: "STORE_READY", contact: chat.id }, "*");
  console.log("Conversation changée", chat);
});


