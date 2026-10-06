#!/usr/bin/env python3
import socket
import sys

if len(sys.argv) != 3:
    print(f"Modo de uso: python {sys.argv[0]} IP usuario")
    sys.exit(0)

ip = sys.argv[1]
usuario = sys.argv[2]

try:
    tcp = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    tcp.settimeout(5.0)
    tcp.connect((ip, 25))

    banner = tcp.recv(1024)
    print(banner.decode('utf-8', errors='ignore').strip())

    comando = f"VRFY {usuario}\r\n"
    tcp.send(comando.encode('utf-8'))
    
    resposta = tcp.recv(1024)
    print(resposta.decode('utf-8', errors='ignore').strip())
    
    tcp.close()
except Exception as e:
    print(f"Erro ao conectar ou enviar comando: {e}")