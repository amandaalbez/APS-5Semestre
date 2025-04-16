// Variáveis globais
let isLoggedIn = false;
let currentUser = '';
let socket = null;

// Conecta ao WebSocket
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

// Login
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

// Registro
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

// Modificar a função sendMessage
function sendMessage() {
    if (!isLoggedIn || !socket) return;

    const messageInput = document.getElementById('messageInput');
    const fileInput = document.getElementById('fileInput');
    const message = messageInput.value.trim();
    const file = fileInput.files[0];

    if (!message && !file) return;

    if (file) {
        const reader = new FileReader();
        reader.onload = function () {
            const base64Data = reader.result.split(',')[1];

            const fileData = {
                type: 'file',
                user: currentUser,
                message: base64Data,
                filename: file.name,
                mimetype: file.type,
                textMessage: message // Adiciona a mensagem de texto junto com o arquivo
            };

            socket.emit('message', fileData);
            addFileMessage(fileData, true);
            
            // Limpar inputs
            fileInput.value = '';
            messageInput.value = '';
            document.getElementById('filePreview').innerHTML = '';
        };
        reader.readAsDataURL(file);
    } else if (message) {
        const messageData = {
            type: 'text',
            user: currentUser,
            message: message
        };
        socket.emit('message', messageData);
        addMessage(`Você: ${message}`, true);
        messageInput.value = '';
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

// Modificar a função addFileMessage para incluir a mensagem de texto
function addFileMessage(data, isSent) {
    const messagesDiv = document.getElementById('messages');
    const container = document.createElement('div');
    container.className = `message ${isSent ? 'sent' : 'received'}`;

    const info = document.createElement('p');
    info.textContent = `${isSent ? 'Você' : data.user} enviou: ${data.filename}`;
    container.appendChild(info);

    // Adiciona a mensagem de texto se existir
    if (data.textMessage) {
        const textMsg = document.createElement('p');
        textMsg.textContent = data.textMessage;
        textMsg.style.marginBottom = '8px';
        container.appendChild(textMsg);
    }

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

    messagesDiv.appendChild(container);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Eventos

// Enter para enviar mensagem
document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Clique no clipe para abrir seletor de arquivos
document.getElementById('clipButton').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

// Botão enviar envia mensagem ou arquivo
// Mostrar prévia do arquivo selecionado
document.getElementById('fileInput').addEventListener('change', function() {
    const file = this.files[0];
    const filePreview = document.getElementById('filePreview');
    filePreview.innerHTML = ''; // Limpa qualquer conteúdo anterior

    if (file) {
        const reader = new FileReader();
        reader.onload = function () {
            const base64Data = reader.result.split(',')[1];

            const filePreviewDiv = document.createElement('div');
            filePreviewDiv.className = 'file-preview';

            const fileName = document.createElement('p');
            fileName.textContent = `Arquivo selecionado: ${file.name}`;
            filePreviewDiv.appendChild(fileName);

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = `data:${file.type};base64,${base64Data}`;
                img.style.maxWidth = '200px';
                img.style.borderRadius = '8px';
                filePreviewDiv.appendChild(img);
            } else {
                const fileLink = document.createElement('a');
                fileLink.href = `data:${file.type};base64,${base64Data}`;
                fileLink.download = file.name;
                fileLink.textContent = 'Clique para baixar o arquivo';
                filePreviewDiv.appendChild(fileLink);
            }

            filePreview.appendChild(filePreviewDiv);
        };

        reader.readAsDataURL(file);
    }
});

// Modificar a função de envio de mensagem para enviar arquivo se houver
document.getElementById('sendButton').addEventListener('click', () => {
    const message = document.getElementById('messageInput').value.trim();
    const file = document.getElementById('fileInput').files[0];

    if (file) {
        sendFile();
    } else if (message) {
        sendMessage();
    }
});

// Enviar arquivo
function sendFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file || !isLoggedIn || !socket) return;

    const reader = new FileReader();
    reader.onload = function () {
        const base64Data = reader.result.split(',')[1];

        const fileData = {
            type: 'file',
            user: currentUser,
            message: base64Data,
            filename: file.name,
            mimetype: file.type
        };

        socket.emit('message', fileData);
        addFileMessage(fileData, true);
        fileInput.value = ''; // limpa input
        document.getElementById('filePreview').innerHTML = ''; // Limpa a prévia
    };
    reader.readAsDataURL(file);
}

 // Adicionar funções para manipular os emojis
function toggleEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
    
    // Se ainda não inicializamos os emojis
    if (!picker.hasChildNodes()) {
        initializeEmojiPicker();
    }
}

function initializeEmojiPicker() {
    const emojiList = document.querySelector('.emoji-list');
    const emojis = emojiList.textContent.trim().split(' ');
    
    // Limpa o conteúdo atual
    emojiList.innerHTML = '';
    
    // Cria elementos clicáveis para cada emoji
    emojis.forEach(emoji => {
        if (emoji) {
            const span = document.createElement('span');
            span.textContent = emoji;
            span.addEventListener('click', () => addEmojiToMessage(emoji));
            emojiList.appendChild(span);
        }
    });
}

function addEmojiToMessage(emoji) {
    const messageInput = document.getElementById('messageInput');
    const cursorPos = messageInput.selectionStart;
    const textBefore = messageInput.value.substring(0, cursorPos);
    const textAfter = messageInput.value.substring(cursorPos);
    
    messageInput.value = textBefore + emoji + textAfter;
    messageInput.focus();
    messageInput.selectionStart = cursorPos + emoji.length;
    messageInput.selectionEnd = cursorPos + emoji.length;
    
    // Fecha o picker após selecionar
    document.getElementById('emojiPicker').style.display = 'none';
}

// Adicionar evento para fechar o emoji picker quando clicar fora dele
document.addEventListener('click', function(e) {
    const emojiPicker = document.getElementById('emojiPicker');
    const emojiButton = document.getElementById('emojiButton');
    
    if (!emojiPicker.contains(e.target) && e.target !== emojiButton) {
        emojiPicker.style.display = 'none';
    }
});

// Menu tema
document.getElementById('themeButton').addEventListener('click', function() {
    document.getElementById('themeMenu').classList.toggle('show');
});

// Opções tema
document.querySelectorAll('.theme-option').forEach(option => {
    option.addEventListener('click', function() {
        const theme = this.dataset.theme;
        changeTheme(theme);
        document.getElementById('themeMenu').classList.remove('show');
    });
});

// Aplicar tema
function changeTheme(theme) {
    document.body.className = theme;
    document.querySelector('.chat-container').className = 'chat-container ' + theme;
}

// Fecha menu tema se clicar fora
document.addEventListener('click', function(e) {
    if (!e.target.closest('.theme-selector-chat')) {
        document.getElementById('themeMenu').classList.remove('show');
    }
});

// Troca de telas
function showRegister() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'block';
}

function showLogin() {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('register-section').style.display = 'none';
}

// Logout
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
