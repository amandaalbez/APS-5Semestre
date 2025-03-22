# Projeto de Chat - APS 5º Semestre

## 📝 Descrição
Sistema de chat com backend em Python (Flask) e frontend em Electron

## 🚀 Funcionalidades
- Interface gráfica moderna com Electron
- Backend robusto em Python
- Sistema de autenticação
- Múltiplos temas visuais
- Comunicação via WebSocket
- Suporte a múltiplos usuários simultâneos

## 🛠️ Tecnologias Utilizadas
- Python (Flask, SocketIO)
- Node.js
- Electron
- WebSocket
- HTML/CSS/JavaScript
- Font Awesome (ícones)

## 📁 Estrutura do Projeto
```
APS-5Semestre/
├── server/
│   ├── app.py
│   ├── test_port.py
│   └── requirements.txt
└── chat-client/
    ├── main.js
    ├── index.html
    ├── styles.css
    └── package.json
```

## ⚙️ Como Executar

### Servidor Python
1. Navegue até a pasta `server/`:
```bash
cd server
```
2. Instale as dependências:
```bash
pip install -r requirements.txt
```
3. Execute o servidor:
```bash
python app.py
```

### Cliente Electron
1. Navegue até a pasta `chat-client/`
2. Instale as dependências:
```bash
npm install
```
3. Execute o cliente:
```bash
npm start
```

## 👥 Requisitos
- Python 3.x
- Node.js
- npm (Node Package Manager)

## 🎯 Status do Projeto
Em desenvolvimento

## 📄 Licença
Este projeto está sob a licença MIT.
