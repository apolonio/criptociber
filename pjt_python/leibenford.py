#pip install matplotlib numpy
import sys
import io

# Garante que o terminal aceite caracteres especiais do banner
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import matplotlib.pyplot as plt
import numpy as np
import collections

def print_banner():
    try:
        banner = """
        ###########################
        #    BENFORD ANALYZER     #
        ###########################
        """
        print(banner)
    except Exception:
        print("Iniciando programa... (Erro ao carregar banner)")

# Chame a função no início do código
print_banner()



# 1. Função para extrair o primeiro dígito
def get_first_digit(number):
    s = str(abs(number)).replace('.', '').lstrip('0')
    return int(s[0]) if s else None

# 2. Dados de Teste (Exemplo: 10.000 números seguindo uma distribuição logarítmica)
# Você pode substituir 'data' por uma lista de valores do seu servidor ou blockchain
data = np.random.lognormal(mean=0, sigma=1, size=10000)

first_digits = [get_first_digit(n) for n in data]
counts = collections.Counter(filter(None, first_digits))
total = sum(counts.values())

# 3. Preparação das frequências observadas vs teóricas
observed = [counts[d] / total * 100 for d in range(1, 10)]
benford = [30.1, 17.6, 12.5, 9.7, 7.9, 6.7, 5.8, 5.1, 4.6]

# 4. Plotagem do Gráfico
plt.figure(figsize=(10, 6))
plt.bar(range(1, 10), observed, alpha=0.7, label='Dados Observados', color='skyblue')
plt.step(range(1, 10), benford, where='mid', label='Curva de Benford', color='red', linestyle='--', linewidth=2)

plt.xlabel('Primeiro Dígito')
plt.ylabel('Frequência (%)')
plt.title('Análise da Lei de Benford')
plt.xticks(range(1, 10))
plt.legend()
plt.grid(axis='y', linestyle='--', alpha=0.6)
plt.show()