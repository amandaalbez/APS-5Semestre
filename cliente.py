import socket

cliente = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
cliente.connect(('localhost', 8080))

terminado = False
print('Digite tchau para terminar a conversa')

while not terminado:
    cliente.send(input('Mensagem: ').encode('utf-8'))
    msg = cliente.recv(1024).decode('utf-8')
    if msg == 'tchau':
        terminado = True
        print('O servidor encerrou a conversa.')
    else:
        print(f'Servidor: {msg}')

cliente.close()
print('Conversa encerrada pelo cliente.')