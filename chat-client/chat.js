let isLoggedIn = false;
let currentUser = '';
let socket = null;
let selectedFile = null;

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

            if (data.type === 'file') {
                addFileMessage(data, data.user === currentUser);
            } else {
                addMessage(`${data.user}: ${data.message}`, data.user === currentUser);
            }
        });

        socket.on('history', (messages) => {
            console.log('Histórico recebido:', messages);
            messages.forEach(msg => {
                if (msg.type === 'file') {
                    addFileMessage(msg, msg.user === currentUser);
                } else {
                    addMessage(`${msg.user}: ${msg.message}`, msg.user === currentUser);
                }
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

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

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

function handleSend() {
    if (!socket || !socket.connected) {
        alert('Não conectado ao servidor. Tente fazer login novamente.');
        return;
    }

    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (selectedFile) {
        const maxSize = 5 * 1024 * 1024; // 5MB limite
        if (selectedFile.size > maxSize) {
            alert('Arquivo muito grande. O tamanho máximo é 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const fileData = {
                    type: 'file',
                    user: currentUser,
                    message: e.target.result.split(',')[1],
                    textMessage: message, // Usa a mensagem do campo existente
                    filename: selectedFile.name,
                    mimetype: selectedFile.type,
                    size: selectedFile.size
                };
                
                console.log('Enviando arquivo:', selectedFile.name);
                socket.emit('message', fileData);
                
                // Adicionar mensagem local
                addFileMessage({
                    ...fileData,
                    user: currentUser
                }, true);
                
                // Limpar após envio
                selectedFile = null;
                document.getElementById('preview-area').innerHTML = '';
                document.getElementById('fileInput').value = '';
                messageInput.value = ''; // Limpa o campo de mensagem
                
                console.log('Arquivo enviado com sucesso');
            } catch (error) {
                console.error('Erro ao enviar arquivo:', error);
                alert('Erro ao enviar arquivo. Tente novamente.');
            }
        };

        reader.readAsDataURL(selectedFile);
        return;
    }

    // Se não há arquivo, envia mensagem de texto normal
    if (message) {
        try {
            const messageData = {
                user: currentUser,
                message: message,
                type: 'text'
            };
            socket.emit('message', messageData);
            addMessage(`Você: ${message}`, true);
            messageInput.value = '';
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            alert('Erro ao enviar mensagem. Tente novamente.');
        }
    }
}

// Adicione um listener para o botão de enviar
document.getElementById('sendButton').addEventListener('click', handleSend);

document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    selectedFile = file;
    const previewArea = document.getElementById('preview-area');
    previewArea.innerHTML = '';

    // Criar container para preview
    const previewContainer = document.createElement('div');
    previewContainer.style.padding = '10px';
    previewContainer.style.margin = '10px';
    previewContainer.style.background = 'rgba(0,0,0,0.1)';
    previewContainer.style.borderRadius = '8px';

    // Adicionar nome do arquivo
    const fileName = document.createElement('div');
    fileName.textContent = `Arquivo selecionado: ${file.name}`;
    fileName.style.marginBottom = '8px';
    previewContainer.appendChild(fileName);

    // Se for uma imagem, mostrar preview
    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.style.maxWidth = '200px';
        img.style.maxHeight = '200px';
        img.style.borderRadius = '4px';
        
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        
        previewContainer.appendChild(img);
    }

    // Botão para remover arquivo
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remover';
    removeButton.style.marginTop = '8px';
    removeButton.onclick = function() {
        selectedFile = null;
        previewArea.innerHTML = '';
        document.getElementById('fileInput').value = '';
    };
    previewContainer.appendChild(removeButton);

    previewArea.appendChild(previewContainer);
});

document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleSend();
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

function addMessage(text, isSent) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
    messageElement.textContent = text;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addFileMessage(data, isSent) {
    const messagesDiv = document.getElementById('messages');
    const container = document.createElement('div');
    container.className = `message ${isSent ? 'sent' : 'received'}`;

    const info = document.createElement('p');
    info.textContent = `${isSent ? 'Você' : data.user} enviou: ${data.filename}`;
    container.appendChild(info);

    if (data.mimetype.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = `data:${data.mimetype};base64,${data.message}`;
        img.style.maxWidth = '200px';
        img.style.borderRadius = '8px';
        container.appendChild(img);
    } else {
        const link = document.createElement('a');
        link.href = `data:${data.mimetype};base64,${data.message}`;
        link.download = data.filename;
        link.textContent = 'Clique para baixar';
        container.appendChild(link);
    }

    // Adicionar mensagem de texto se existir
    if (data.textMessage) {
        const messageText = document.createElement('p');
        messageText.textContent = data.textMessage;
        messageText.style.marginTop = '8px';
        messageText.style.fontStyle = 'italic';
        container.appendChild(messageText);
    }

    messagesDiv.appendChild(container);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

document.getElementById('clipButton').addEventListener('click', function() {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    selectedFile = file;
    const previewArea = document.getElementById('preview-area');
    previewArea.innerHTML = '';

    // Criar container para preview
    const previewContainer = document.createElement('div');
    previewContainer.style.padding = '10px';
    previewContainer.style.margin = '10px';
    previewContainer.style.background = 'rgba(0,0,0,0.1)';
    previewContainer.style.borderRadius = '8px';

    // Adicionar nome do arquivo
    const fileName = document.createElement('div');
    fileName.textContent = `Arquivo selecionado: ${file.name}`;
    fileName.style.marginBottom = '8px';
    previewContainer.appendChild(fileName);

    // Se for uma imagem, mostrar preview
    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.style.maxWidth = '200px';
        img.style.maxHeight = '200px';
        img.style.borderRadius = '4px';
        
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        
        previewContainer.appendChild(img);
    }

    // Botão para remover arquivo
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remover';
    removeButton.style.marginTop = '8px';
    removeButton.onclick = function() {
        selectedFile = null;
        previewArea.innerHTML = '';
        document.getElementById('fileInput').value = '';
    };
    previewContainer.appendChild(removeButton);

    previewArea.appendChild(previewContainer);
});
