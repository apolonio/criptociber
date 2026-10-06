#!/usr/bin/python
import sys
from scapy.all import *

conf.verb = 0
portas = [21,22,23,25,80,443,110,8080,3306,3389,5432,5672,6379]
pIP = IP(dst=sys.argv[1])
pTCP = TCP(dport=portas, flags="S")
pacote = pIP/pTCP
resp, noresp = sr(pacote, timeout=2)
for resposta in resp:
    ip_alvo = resposta[1][IP].src
    porta = resposta[1][TCP].sport
    flag = resposta[1][TCP].flags
    if (flag =="SA"):
        print("IP %s - Porta %d ABERTA" %(ip_alvo, porta))

    
 # Exemplo de uso: python apoloscan.py 192.168.1.1 ou python apoloscan.py 10.112.182.0/25