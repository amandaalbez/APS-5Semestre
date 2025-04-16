let isLoggedIn = false;
let currentUser = '';
let socket = null;

function connectWebSocket() {
    try {
        console.log('Iniciando conexão WebSocket...');
        
        socket = io('http://localhost:5000', {
            transports: ['websocket'],
            upgrade: false,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000
        });
        
        socket.on('connect', () => {
            console.log('Conectado ao servidor Python');
            addMessage('Conectado ao servidor', 'status');
        });

        socket.on('connect_error', (error) => {
            console.error('Erro de conexão:', error);
            addMessage('Erro de conexão com o servidor', 'status');
            alert(error);
        });

        socket.on('disconnect', () => {
            console.log('Desconectado do servidor');
            addMessage('Desconectado do servidor', false);
        });

        socket.on('message', (data) => {
            console.log('Mensagem recebida:', data);
            addMessage(`${data.user}: ${data.message}`, false);
        });

        socket.on('history', (messages) => {
            console.log('Histórico recebido:', messages);
            messages.forEach(msg => {
                addMessage(`${msg.user}: ${msg.message}`, msg.user === currentUser);
            });
        });

    } catch (error) {
        console.error('Erro ao conectar WebSocket:', error);
        alert('Erro ao inicializar conexão WebSocket');
    }
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert('Por favor, preencha usuário e senha');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Resposta do login:', data);
        
        if (data.success) {
            document.querySelector('.auth-container').style.display = 'none';
            document.getElementById('chat-section').style.display = 'block';
            isLoggedIn = true;
            currentUser = username;
            connectWebSocket();
        } else {
            alert(data.message || 'Erro no login');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        alert('Erro ao conectar ao servidor. Verifique se o servidor está rodando na porta 5000.');
    }
}

async function register() {
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    if (password !== confirmPassword) {
        alert('As senhas não coincidem.');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Cadastro realizado com sucesso!');
            showLogin();
        } else {
            alert('Cadastro falhou: ' + data.message);
        }
    } catch (error) {
        console.error('Erro no cadastro:', error);
        alert('Erro ao tentar fazer cadastro');
    }
}

function sendMessage() {
    if (!isLoggedIn || !socket) return;
    
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (message) {
        try {
            const messageData = {
                user: currentUser,
                message: message
            };
            socket.emit('message', messageData);
            addMessage(`Você: ${message}`, true);
            messageInput.value = '';
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            alert('Erro ao enviar mensagem');
        }
    }
}

function addMessage(text, isSent) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
    messageElement.textContent = text;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

document.getElementById('themeButton').addEventListener('click', function() {
    document.getElementById('themeMenu').classList.toggle('show');
});

document.querySelectorAll('.theme-option').forEach(option => {
    option.addEventListener('click', function() {
        const theme = this.dataset.theme;
        changeTheme(theme);
        document.getElementById('themeMenu').classList.remove('show');
    });
});

function changeTheme(theme) {
    document.body.className = theme;
    document.querySelector('.chat-container').className = 'chat-container ' + theme;
}

// Fechar o menu ao clicar fora
document.addEventListener('click', function(e) {
    if (!e.target.closest('.theme-selector-chat')) {
        document.getElementById('themeMenu').classList.remove('show');
    }
});

function showRegister() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'block';
}

function showLogin() {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('register-section').style.display = 'none';
}

function logout() {
    isLoggedIn = false;
    currentUser = '';
    socket.disconnect();
    document.querySelector('.auth-container').style.display = 'flex';
    document.getElementById('chat-section').style.display = 'none';
    document.getElementById('messages').innerHTML = '';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}