import socket 

servidor = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
servidor.bind(('localhost',  8080))

servidor.listen()
cliente, end = servidor.accept()

terminado = False

while not terminado:
    msg = cliente.recv(1024).decode('utf-8')
    if msg == 'tchau':
        terminado = True
        print('O cliente encerrou a conversa.')
        break
    print(f'Cliente: {msg}')
    mensagem = input('Mensagem: ')
    cliente.send(mensagem.encode('utf-8'))

cliente.close()
servidor.close()
print('Conversa encerrada pelo servidor.')