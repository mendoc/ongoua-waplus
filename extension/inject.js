window.Store = Object.assign({}, window.require("WAWebCollections"));
window.Store.User = window.require("WAWebUserPrefsMeUser");
window.Store.MsgKey = window.require("WAWebMsgKey");
window.Store.SendMessage = window.require("WAWebSendMsgChatAction");

const currentAccount = window.Store.User.getMe();
if (currentAccount) {
  window.postMessage({ type: "USER", user: currentAccount.user }, "*");
}

window.Store.Chat.on("change:active", (chat) => {
  if (!chat.active) return;
  window.postMessage(
    { type: "CHAT_CHANGED", contact: chat.id },
    "*"
  );
  console.log("[inject.js]: Conversation changée", chat);
});

// Écoute les messages du script de contenu
window.addEventListener(
  "message",
  function (event) {
    if (event.data.type === "TX_OK") {
      console.log("[inject.js]: Envoie du SMS de confirmation", event.data);
      sendMessage(event.data.chatId, event.data.content);
    }
  },
  false
);

async function sendMessage(chatId, content, options = {}) {
  const chat = window.Store.Chat.get(chatId._serialized) 
  const meUser = window.Store.User.getMaybeMeUser();
  const newId = await window.Store.MsgKey.newId();

  const newMsgId = new window.Store.MsgKey({
    from: meUser,
    to: chat.id,
    id: newId,
    participant: undefined,
    selfDir: "out",
  });

  const message = {
    ...options,
    id: newMsgId,
    ack: 0,
    body: content,
    from: meUser,
    to: chat.id,
    local: true,
    self: "out",
    t: parseInt(new Date().getTime() / 1000),
    isNewMsg: true,
    type: "chat",
  };

  console.log("[inject.js] Envoi du message...");
  await window.Store.SendMessage.addAndSendMsgToChat(chat, message);
  return window.Store.Msg.get(newMsgId._serialized);
}
