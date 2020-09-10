const ipc = require("electron").ipcRenderer;

document.getElementById("authenticator").addEventListener("click", auth);
function auth(){
    ipc.invoke("authenticate");
}

document.getElementById("user").addEventListener("click", user);
function user(){
    ipc.invoke("user");
}

document.getElementById("token").addEventListener("click", token);
function token(){
    ipc.invoke("token");
}