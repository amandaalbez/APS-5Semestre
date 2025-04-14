from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import bcrypt
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
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:root@localhost:3306/chatAps' 
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'secret!'
CORS(app, resources={r"/*": {"origins": "*"}})

# Inicializa o SQLAlchemy
db = SQLAlchemy(app)

# Modelo para a tabela de usuários
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'

# Modelo para a tabela de mensagens
class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(500), nullable=False)
    username = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp())

    def __repr__(self):
        return f'<Message {self.content[:20]}>'

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

messages = []

# Função de login
@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')

        print(f"Tentativa de login - Usuário: {username}")

        user = User.query.filter_by(username=username).first()
        if user and bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
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
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')

        # Verifique se o nome de usuário já existe
        user = User.query.filter_by(username=username).first()
        if user:
            return jsonify({'success': False, 'message': 'Username already exists'})

        # Criptografe a senha
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        new_user = User(username=username, password=hashed_password.decode('utf-8'), email=email)
        db.session.add(new_user)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Registration successful'})
    except Exception as e:
        return jsonify({'success': False, 'message': 'Erro no servidor'}), 500
    
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
    print("Log completo disponível em: socket_debug.log\n")

    # Criar as tabelas no banco de dados
    with app.app_context():
        db.create_all()
    
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)