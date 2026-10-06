def salvar_notas_em_arquivo(notas, media, situacao):
    try:
        with open("historico_notas.txt", "a", encoding="utf-8") as arquivo:
            arquivo.write("--- Registro de Notas ---\n")
            for i, nota in enumerate(notas, 1):
                arquivo.write(f"Nota {i}: {nota}\n")
            arquivo.write(f"Média: {media:.2f}\n")
            arquivo.write(f"Situação: {situacao}\n")
            arquivo.write("-" * 25 + "\n\n")
        print("Notas salvas com sucesso no arquivo 'historico_notas.txt'.")
    except Exception as e:
        print(f"Erro ao salvar as notas no arquivo: {e}")

def calcular_media():
    print("Calculadora de Média de Notas")
    print("-" * 30)
    
    try:
        nota1 = float(input("Digite a 1ª nota: "))
        nota2 = float(input("Digite a 2ª nota: "))
        nota3 = float(input("Digite a 3ª nota: "))
        nota4 = float(input("Digite a 4ª nota: "))
        
        media = (nota1 + nota2 + nota3 + nota4) / 4
        
        print("-" * 30)
        print(f"A média final do aluno é: {media:.2f}")
        
        if media >= 7.0:
            situacao = "Aprovado!"
        elif media >= 5.0:
            situacao = "Recuperação."
        else:
            situacao = "Reprovado."
            
        print(f"Situação: {situacao}")
        
        salvar_notas_em_arquivo([nota1, nota2, nota3, nota4], media, situacao)
            
    except ValueError:
        print("Erro: Por favor, insira apenas números válidos para as notas.")

if __name__ == "__main__":
    calcular_media()
