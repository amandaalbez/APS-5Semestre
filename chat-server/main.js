const { app, BrowserWindow } = require('electron');
const WebSocket = require('ws');
const path = require('path');

let mainWindow;
const clients = new Set();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
}

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  clients.add(ws);
  
  ws.on('message', (message) => {
    // Broadcast mensagem para todos os clientes
    clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
