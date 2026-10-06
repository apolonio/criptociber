#!//usr/bin/python3
import socket

# Get user input for IP and port
ip = input("Digite um IP: ")
porta = input("Digite uma porta: ")

# Convert the port input to an integer
# The connect method expects the port to be a number, not a string
try:
    porta_int = int(porta)
except ValueError:
    print("Erro: A porta deve ser um número inteiro.")
    exit()

# Create a socket object
meusocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)


try:
    meusocket.connect((ip, porta_int))
    print(f"Conectado a {ip}:{porta_int}")
    
    # Receive the banner (first 1024 bytes of data)
    banner = meusocket.recv(1024)
    print("Banner recebido:")
    print(banner.decode('utf-8', errors='ignore')) # Decode the bytes to a string for printing

except socket.error as e:
    print(f"Erro de conexão: {e}")

finally:
    # Close the socket connection
    meusocket.close()
    print("Conexão fechada.")