#!/usr/bin/python
import sys
from scapy.all import *

conf.verb = 0

for ip in range(1,255):
    iprange = "192.168.0.%s" % ip
    print "Varredura em andamento no IP: %s" % iprange
    
    
 #python apoloscan.py ip