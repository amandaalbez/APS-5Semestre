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

const wss = new WebSocket.Server({ port: 8080 }, () => {
  console.log('Servidor WebSocket iniciado na porta 8080');
});

wss.on('connection', (ws, req) => {
  console.log(`Nova conexão recebida de ${req.socket.remoteAddress}`);
  clients.add(ws);
  
  // Envia mensagem de boas-vindas
  ws.send('Bem-vindo ao chat!');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`Mensagem recebida de ${data.user}: ${data.message}`);
      
      // Broadcast mensagem para todos os clientes
      const broadcastMessage = `${data.user}: ${data.message}`;
      clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          try {
            client.send(broadcastMessage);
          } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
          }
        }
      });
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('Erro na conexão WebSocket:', error);
  });

  ws.on('close', () => {
    console.log('Cliente desconectado');
    clients.delete(ws);
  });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});