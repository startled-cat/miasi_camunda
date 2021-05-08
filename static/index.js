window.addEventListener("load", () => {
  console.log("loaded");

  setInterval(getMessages, 500);
});

const shopUrl = "http://localhost:80/";

const shopResources = {
  confirmCartContents: shopUrl + "confirmCartContents",
  submitClientData: shopUrl + "submitClientData",
  messages: shopUrl + "messages",
};

function onConfirmCartContents() {
  console.log("onConfirmCartContents");

  fetch(shopResources.confirmCartContents)
    .then((response) => response.json())
    .then((data) => {
      localStorage.setItem("id", data.id);
      console.log("Success");
    });
}

function onSubmitClientData(e) {
  console.log("onSubmitClientData");
  e.preventDefault();

  const formData = new FormData(e.target);

  const payload = {
    id: localStorage.getItem("id"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
  };

  fetch(shopResources.submitClientData, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  }).then(() => {
    console.log("Success");
    localStorage.removeItem("id");
  });
}

function getMessages() {
  fetch(shopResources.messages)
    .then((response) => response.json())
    .then((json) => {
      let messages = document.getElementById("messages");
      messages.innerHTML = "";
      json.messages.forEach((m) => {
        let newMessage = document.createElement("div");
        newMessage.innerHTML = `${m.when} : "${m.msg}"`;
        messages.appendChild(newMessage);
      });
    });
}
