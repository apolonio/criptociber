# Passo a passo do projeto
# Passo 1: Pegar cada base de dados - OK
# Passo 2: Para cada base de dados - OK
    # Calcular o faturamento total (somar todos os valores da coluna de vendas)
# Passo 3: Criar um ranking com o faturamento total de todas as lojas
# Passo 4: Enviar por e-mail esse ranking para a diretoria

import pandas as pd
import os

# extensão .xlsx -> arquivo em excel
# openpyxl -> integra o python com o Excel

# como pegar a lista de cidades se não for criar manualmente
lista_arquivos = os.listdir()
lista_cidades2 = []
for arquivo in lista_arquivos:
    if ".xlsx" in arquivo:
        nome_cidade = arquivo.replace("Loja ", "").replace(".xlsx", "")
        lista_cidades2.append(nome_cidade) # arquivo: Loja DF.xlsx

print(lista_cidades2)
# fim de como pegar a lista de cidades

# A lista manual não será mais necessária, pois pegamos de forma automática
# lista_cidades = ["BH", "DF", "Manaus", "Rio", "Salvador", "SP"]

faturamentos = {}
# faturamentos = {"BH": 3000, "DF": 5000, "Manaus": 2500}
# dicionario = {chave: valor, chave: valor, chave: valor}
# para criar um valor no dicionario:
    # dicionario[chave] = valor
    
# Agora usando a lista dinâmica (lista_cidades2):
for cidade in lista_cidades2:
    vendas_df = pd.read_excel(f"Loja {cidade}.xlsx") # df = dataframe
    faturamento_cidade = sum(vendas_df["Vendas"])
    faturamentos[cidade] = faturamento_cidade

print(faturamentos)

# criar o ranking
# transformar o dicionario em uma tabela e ordenar a tabela
# pandas -> 
    # colunas = columns
    # linhas = index
ranking_df = pd.DataFrame.from_dict(faturamentos, 
                                    orient="index", 
                                    columns=["Vendas"])
ranking_df = ranking_df.sort_values(by="Vendas", ascending=True)
ranking_df = ranking_df.map("${:,.2f}".format)
print(ranking_df)

mensagem = f"""
Prezados,
Segue em anexo o ranking de vendas das Lojas:
Ranking:

{ranking_df.to_string().replace(" ", "-")}

Qualquer dúvida, estou à disposição.
Att.,
Lira
"""

# como enviar por email
# 4 grandes formas
# yagmail - a mais direta e simples
# smtplib - não é tão direto, mas é BEM personalizado
# pyautogui - automação por RPA -> só uso em automações que já são RPA
# outlook -> uso quando a empresa usa outlook
import yagmail
from chave import senha

usuario = yagmail.SMTP("apoloinsider@gmail.com", senha)
usuario.send(
    to="gciber335@gmail.com",
    subject="Ranking das Lojas",
    contents=mensagem
)
