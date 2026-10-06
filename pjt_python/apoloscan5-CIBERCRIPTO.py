#!/usr/bin/python3
import asyncio
import socket

async def testar_porta_assincrona(ip, porta, timeout=1.5):
    """
    Tenta estabelecer uma conexão TCP assíncrona com o IP e porta especificados.
    """
    try:
        # Abre a conexão TCP com um limite de tempo (timeout)
        conexao = asyncio.open_connection(ip, porta)
        leitor, escritor = await asyncio.wait_for(conexao, timeout=timeout)
        
        print(f"[+] Conectado a {ip}:{porta} - Aberta")
        
        # Tenta receber dados do banner (serviço) caso sejam enviados imediatamente
        try:
            dados_banner = await asyncio.wait_for(leitor.read(1024), timeout=1.5)
            if dados_banner:
                banner_texto = dados_banner.decode('utf-8', errors='ignore').strip()
                print(f"    [Banner {porta}]: {banner_texto}")
        except asyncio.TimeoutError:
            pass  # Conexão estabelecida, mas o serviço não enviou banner espontaneamente
            
        escritor.close()
        await escritor.wait_closed()
        return porta, True
        
    except (asyncio.TimeoutError, ConnectionRefusedError, OSError):
        # Porta fechada ou conexão recusada/timeout
        return porta, False

async def main():
    ip = input("Digite o IP do alvo: ").strip()
    portas_input = input("Digite as portas (ex: 22,80,443 ou intervalo como 20-100): ").strip()
    
    portas = []
    
    # Processa a entrada de portas digitada pelo usuário
    if "-" in portas_input:
        try:
            inicio, fim = map(int, portas_input.split("-"))
            portas = list(range(inicio, fim + 1))
        except ValueError:
            print("Formato de intervalo inválido. Use algo como 20-80.")
            return
    else:
        try:
            portas = [int(p.strip()) for p in portas_input.split(",") if p.strip()]
        except ValueError:
            print("Formato de portas inválido. Use números separados por vírgula.")
            return

    if not portas:
        print("Nenhuma porta válida especificada.")
        return

    print(f"\nIniciando teste assíncrono em {ip} para {len(portas)} porta(s)...")
    
    # Cria tarefas concorrentes para otimizar o tempo de varredura
    tarefas = [testar_porta_assincrona(ip, porta) for porta in portas]
    await asyncio.gather(*tarefas)
    print("\nVarredura concluída.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nOperação cancelada pelo usuário.")