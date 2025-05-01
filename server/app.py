from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_sqlalchemy import SQLAlchemy
from flask import send_from_directory
from flask_cors import CORS
from datetime import datetime
import base64
import bcrypt
import json
import gevent
import logging
import sys
import atexit
import signal
import os
import socket

# Exibe informações do ambiente
print(f"Python version: {sys.version}")
print(f"Python executable: {sys.executable}")
print(f"Working directory: {os.getcwd()}")

UPLOAD_FOLDER = 'arquivos'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

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
    logged = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f'<User {self.username}>'

# Modelo para a tabela de mensagens
class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(500), nullable=False)
    username = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.now)

    def __repr__(self):
        return f'<Message {self.content[:20]}>'

class File(db.Model):
    __tablename__ = 'files'
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    path = db.Column(db.String(255), nullable=False)
    mimetype = db.Column(db.String(100), nullable=False)
    size = db.Column(db.Integer, nullable=False)
    username = db.Column(db.String(100), nullable=False)
    text_message = db.Column(db.String(500))  
    timestamp = db.Column(db.DateTime, default=datetime.now)

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

# Função de login
@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')

        print(f"Tentativa de login - Usuário: {username}")
            
        user = User.query.filter_by(username=username).first()
        if user:
            if user.logged:
                return jsonify({
                    'success': False,
                    'message': 'Usuário já está logado em outra sessão.'
                })

            if bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
                user.logged = True
                db.session.commit()

                print(f"Login bem-sucedido para {username}")
                return jsonify({
                    'success': True,
                    'message': 'Login bem-sucedido',
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
            return jsonify({'success': False, 'message': 'Nome de usuario ja cadastrado.'})

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        new_user = User(username=username, password=hashed_password.decode('utf-8'), email=email)
        db.session.add(new_user)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Registrado com sucesso.'})
    except Exception as e:
        return jsonify({'success': False, 'message': 'Erro no servidor'}), 500
    
@socketio.on('connect')
def handle_connect():
    logger.info(f'Cliente conectado. SID: {request.sid}')
    logger.info(f'Headers: {request.headers}')

    try:
        messages = [
            {
                'type': 'text',
                'user': msg.username,
                'message': msg.content,
                'timestamp': msg.timestamp.isoformat()
            }
            for msg in Message.query.order_by(Message.timestamp.asc()).limit(100).all()
        ]

        files = []
        for file in File.query.order_by(File.timestamp.asc()).limit(100).all():
            file_data = None
            try:
                if os.path.exists(file.path):
                    with open(file.path, 'rb') as f:
                        file_data = base64.b64encode(f.read()).decode('utf-8')
                else:
                    logger.warning(f"Arquivo não encontrado: {file.path}")
            except Exception as e:
                logger.error(f"Erro ao ler arquivo {file.filename}: {e}", exc_info=True)

            files.append({
                'type': 'file',
                'filename': file.filename,
                'path': file.path,
                'mimetype': file.mimetype,
                'size': file.size,
                'user': file.username,
                'message': file_data,  
                'textMessage': file.text_message,
                'timestamp': file.timestamp.isoformat()
            })

        combined_history = messages + files
        combined_history.sort(key=lambda x: x['timestamp'])

        emit('chat_history', combined_history)

    except Exception as e:
        logger.error(f'Erro ao carregar histórico para novo cliente: {e}', exc_info=True)
        emit('error', {'message': 'Erro ao carregar histórico'})

@socketio.on('disconnect')
def handle_disconnect():
    logger.info(f'Cliente desconectado. SID: {request.sid}')
    
    user = User.query.filter_by(logged=True).first()  
    if user:
        user.logged = False
        db.session.commit()
        logger.info(f'Usuário {user.username} deslogado após desconexão')

@socketio.on_error()
def error_handler(e):
    logger.error(f'Erro no Socket.IO: {str(e)}')

@socketio.on('message')
def handle_message(data):
    try:
        if isinstance(data, str):
            data = json.loads(data)

        logger.info(f'Mensagem recebida: {data.get("type", "text")}')

        if data.get('type') == 'file':
            filename = data.get('filename')
            mimetype = data.get('mimetype')
            base64_data = data.get('message')  
            username = data.get('user')
            text_message = data.get('textMessage', '')
            file_size = data.get('size', 0)

            # Criar nome único para evitar conflito
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            safe_filename = f"{username}_{timestamp}_{filename}"
            file_path = os.path.join(UPLOAD_FOLDER, safe_filename)

            try:
                # Decodificar e salvar o arquivo
                with open(file_path, "wb") as f:
                    f.write(base64.b64decode(base64_data))

                # Salvar no banco de dados
                file_record = File(
                    filename=filename,
                    path=file_path,
                    mimetype=mimetype,
                    size=file_size,
                    username=username,
                    text_message=text_message
                )
                db.session.add(file_record)
                db.session.commit()

                logger.info(f'Arquivo salvo: {file_path}')

            except Exception as e:
                logger.error(f'Erro ao salvar arquivo: {e}', exc_info=True)
                emit('error', {'message': 'Erro ao salvar arquivo'})

        else:
            # Mensagem de texto
            new_message = Message(
                username=data.get('user'),
                content=data.get('message')
            )
            db.session.add(new_message)
            db.session.commit()

            logger.info(f'Mensagem de texto salva: {new_message.content}')

        emit('message', data, broadcast=True, include_self=False)
        logger.info('Mensagem processada e enviada com sucesso')

    except Exception as e:
        logger.error(f"Erro ao processar mensagem: {str(e)}", exc_info=True)
        emit('error', {'message': 'Erro ao processar mensagem'})

@app.route('/arquivos/<path:filename>')
def download_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)

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

    # Desconectar todos usuarios ao finalizar o servidor
    def desconectar_todos_usuarios():
        with app.app_context():
            logger.info("Deslogando todos os usuários antes de encerrar o servidor...")
        try:
            User.query.update({User.logged: False})
            db.session.commit()
            logger.info("Todos os usuários foram deslogados com sucesso.")
        except Exception as e:
            logger.error(f"Erro ao deslogar usuários: {e}")

    atexit.register(desconectar_todos_usuarios)
        
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)