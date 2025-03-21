# Projeto de Chat - APS 5º Semestre

## 📝 Descrição
Sistema de chat com implementações em Python e Electron, oferecendo diferentes versões de cliente e servidor.

## 🚀 Funcionalidades

### Versão Python
- Chat básico cliente-servidor
- Comunicação via socket TCP
- Interface via terminal

### Versão Electron
- Interface gráfica moderna
- Sistema de autenticação
- Múltiplos temas visuais
- Comunicação via WebSocket
- Suporte a múltiplos usuários simultâneos

## 🛠️ Tecnologias Utilizadas
- Python
- Node.js
- Electron
- WebSocket
- HTML/CSS/JavaScript
- Font Awesome (ícones)

## 📁 Estrutura do Projeto
```
APS-5Semestre/
├── chat/
│   ├── cliente.py
│   └── servidor.py
├── chat-server/
│   ├── main.js
│   ├── index.html
│   └── package.json
└── chat-client/
    ├── main.js
    ├── index.html
    ├── styles.css
    └── package.json
```

## ⚙️ Como Executar

### Versão Python
1. Navegue até a pasta `chat/`
2. Execute o servidor:
```bash
python servidor.py
```
3. Execute o cliente em outro terminal:
```bash
python cliente.py
```

### Versão Electron
#### Servidor
1. Navegue até a pasta `chat-server/`
2. Instale as dependências:
```bash
npm install
```
3. Execute o servidor:
```bash
npm start
```

#### Cliente
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
