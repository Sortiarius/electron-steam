const { app, BrowserWindow, ipcMain} = require("electron");
const ElectronSteam  = require("../../lib/index");

let user;
let token;

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        height: 600,
        width: 800,
        webPreferences: {
            nodeIntegration: true
        }
    });
    mainWindow.loadFile('index.html');
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.handle("authenticate", async (event, ...args) => {
    const steam = new ElectronSteam("17CC77F7147091021CB30878463AF95B");
    try{
        await steam.authenticate((steamUser, steamToken) => {
            user = steamUser;
            token = steamToken;
        });
    } catch (e){
        e.preventDefault();
        console.log(e);
    }
});

ipcMain.handle("user", async (event, ...args) => {
    if(!user){
        console.log("User not found!");
        return;
    }
    console.log(user);
});

ipcMain.handle("token", async (event, ...args) => {
    if(!token){
        console.log("Token not found!");
        return;
    }
    console.log(token);
});