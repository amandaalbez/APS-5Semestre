import socket

def test_port(port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.bind(('0.0.0.0', port))
        print(f"Porta {port} está disponível")
        return True
    except socket.error as e:
        print(f"Porta {port} não está disponível: {e}")
        return False
    finally:
        sock.close()

if __name__ == '__main__':
    test_port(5000)
