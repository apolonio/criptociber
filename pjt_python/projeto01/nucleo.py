#codigo do santiaog

import pandas as pd

lista_cidades = ["BH", "DF", "Rio", "Salvador", "Manaus"]

# Lendo os arquivos de cada cidade
for item in lista_cidades:
    vendas_df = pd.read_excel(f"Loja {item}.xlsx") #df data frame
    print(f"--- Vendas da Loja {item} ---")
    print(vendas_df)
