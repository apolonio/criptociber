#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import ctypes  # Necessário para interagir com a API do Windows

def print_banner():
    # Usando aspas duplas triplas como você pontuou
    banner = """
    #################################################
    #        SISTEMA: PC-SERVER (WIN 11)            #
    #        PROJETO: BANNER / AUDITORIA            #
    #################################################
    """
    print(banner)

def is_admin():
    """ Verifica se o script está rodando como Administrador no Windows """
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except AttributeError:
        return False

def main():
    print_banner()
    
    # Substituindo o os.geteuid() que causou o erro:
    if not is_admin():
        print("[!] AVISO: Você NÃO está rodando como Administrador.")
        print("[*] Algumas funções de rede do CPTS podem exigir privilégios elevados.")
    else:
        print("[+] Sucesso: Rodando com privilégios de ADMINISTRADOR.")

    print(f"[#] Caminho do Script: {os.path.abspath(__file__)}")

if __name__ == "__main__":
    main()