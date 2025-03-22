from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import json
import gevent
import logging
import sys
import os
import socket

# Exibe informações do ambiente
print(f"Python version: {sys.version}")
print(f"Python executable: {sys.executable}")
print(f"Working directory: {os.getcwd()}")

# Configuração de logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Logger específico para Socket.IO
socket_logger = logging.getLogger('socketio')
socket_logger.setLevel(logging.DEBUG)
fh = logging.FileHandler('socket_debug.log')
fh.setLevel(logging.DEBUG)
socket_logger.addHandler(fh)

# Configuração do Flask e CORS
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
CORS(app, resources={r"/*": {"origins": "*"}})

# Inicializa o SocketIO com gevent e permite todas as origens
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='gevent',
    logger=True,
    engineio_logger=True,
    ping_timeout=5000,
    ping_interval=25000
)

# Usuários predefinidos
users = {
    "admin": {"password": "admin123", "email": "admin@chat.com"},
    "teste": {"password": "teste123", "email": "teste@chat.com"}
}

messages = []

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        print(f"Tentativa de login - Usuário: {username}")
        
        if username in users and users[username]['password'] == password:
            print(f"Login bem-sucedido para {username}")
            return jsonify({
                'success': True, 
                'message': 'Login successful',
                'user': username
            })
        
        print(f"Login falhou para {username}")
        return jsonify({
            'success': False, 
            'message': 'Usuário ou senha inválidos'
        })
    except Exception as e:
        print(f"Erro no login: {str(e)}")
        return jsonify({
            'success': False, 
            'message': f'Erro no servidor: {str(e)}'
        }), 500

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    
    if username in users:
        return jsonify({'success': False, 'message': 'Username already exists'})
    
    users[username] = {'password': password, 'email': email}
    return jsonify({'success': True, 'message': 'Registration successful'})

@socketio.on('connect')
def handle_connect():
    logger.info(f'Cliente conectado. SID: {request.sid}')
    logger.info(f'Headers: {request.headers}')
    emit('history', messages)

@socketio.on('disconnect')
def handle_disconnect():
    logger.info(f'Cliente desconectado. SID: {request.sid}')

@socketio.on_error()
def error_handler(e):
    logger.error(f'Erro no Socket.IO: {str(e)}')

@socketio.on('message')
def handle_message(data):
    try:
        if isinstance(data, str):
            data = json.loads(data)
        logger.info(f'Mensagem recebida: {data}')
        messages.append(data)
        emit('message', data, broadcast=True, include_self=False)
    except Exception as e:
        logger.error(f"Erro ao processar mensagem: {str(e)}", exc_info=True)

if __name__ == '__main__':
    logger.info("=== Iniciando Servidor de Chat ===")
    logger.info(f"Python version: {sys.version}")
    logger.info(f"Python path: {sys.executable}")
    logger.info(f"Working directory: {os.getcwd()}")
    
    # Teste de porta 5000
    try:
        test_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        test_socket.bind(('0.0.0.0', 5000))
        test_socket.close()
        logger.info("Porta 5000 está disponível e pronta para uso")
    except Exception as e:
        logger.error(f"Erro crítico ao testar porta 5000: {e}", exc_info=True)
        sys.exit(1)
    
    logger.info("=== Configurações do Servidor ===")
    logger.info(f"Modo Debug: {app.debug}")
    logger.info(f"Modo Async: {socketio.async_mode}")
    logger.info(f"CORS Configurado: {app.config.get('CORS_ALLOW_ALL_ORIGINS', '*')}")
    
    print("\n=== Servidor iniciado ===")
    print("Usuários disponíveis para teste:")
    print("1. admin/admin123")
    print("2. teste/teste123")
    print("Log completo disponível em: socket_debug.log\n")
    
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)