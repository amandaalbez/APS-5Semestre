const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,        // Aumentado de 800
    height: 700,        // Aumentado de 600
    minWidth: 800,      // Largura mínima
    minHeight: 600,     // Altura mínima
    icon: path.join(__dirname, 'img', 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  mainWindow.setMenu(null);
  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});