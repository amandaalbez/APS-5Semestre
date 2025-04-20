# 💬 TieteNet Chat

<div align="center">
  <img src="chat-client/img/logo.png" alt="TieteNet Logo" width="200"/>
  <br/>
  <p><i>Um chat moderno e elegante desenvolvido com Python e Electron</i></p>
</div>

## ✨ Características

### Interface Moderna
- 🎨 5 temas diferentes (Escuro, Claro, Azul, Verde, Roxo)
- 💅 Design responsivo e intuitivo
- 🌟 Animações suaves
- 😊 Suporte a emojis e figurinhas

### Funcionalidades
- 🔐 Sistema de autenticação seguro
- 📁 Compartilhamento de arquivos
- 📸 Preview de imagens
- 💾 Histórico de mensagens
- 👥 Suporte a múltiplos usuários
- 🔄 Conexão em tempo real via WebSocket

## 🛠️ Tecnologias

### Backend
- ![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white) Python 3.x
- ![Flask](https://img.shields.io/badge/Flask-000000?style=flat&logo=flask&logoColor=white) Flask
- ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white) MySQL
- ![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=flat&logo=socket.io&logoColor=white) WebSocket

### Frontend
- ![Electron](https://img.shields.io/badge/Electron-47848F?style=flat&logo=electron&logoColor=white) Electron
- ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white) HTML5
- ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white) CSS3
- ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black) JavaScript

## 🚀 Instalação

### Requisitos Prévios
- Python 3.x
- Node.js
- MySQL Server
- Git

### Configuração do Backend
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/APS-5Semestre.git
cd APS-5Semestre

# Configure o ambiente virtual Python
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
.\venv\Scripts\activate  # Windows

# Instale as dependências
cd server
pip install -r requirements.txt

# Configure o banco de dados
mysql -u root -p < database_setup.sql

# Inicie o servidor
python app.py
```

### Configuração do Frontend
```bash
# Na pasta do projeto
cd chat-client

# Instale as dependências
npm install

# Inicie o cliente
npm start
```

## 📸 Screenshots

<div align="center">
  <img src="chat-client/img/img/login.png" alt="Tela de Login" width="400"/>
  <img src="chat-client/img/cadastro.png" alt="Tela de Cadastro" width="400"/>
  <img src="chat-client/img/chat.png" alt="Tela do Chat" width="400"/>
</div>

## 🔧 Configuração

### Variáveis de Ambiente
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=sua_senha
DB_NAME=chatAps
```

## 👥 Contribuição
Contribuições são bem-vindas! Por favor, leia as [diretrizes de contribuição](CONTRIBUTING.md) antes de submeter um Pull Request.

## 📝 Licença
Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---
<div align="center">
  <p>Desenvolvido com ❤️ pela equipe TieteNet</p>
</div>
