import base64

def xor_data(data: bytes, key: bytes) -> bytes:
    # A função XOR é simétrica e pode ser usada para descriptografar.
    return bytes([b ^ key[i % len(key)] for i, b in enumerate(data)])

def decifrar_saida(saida_b64: str, chave_k: str) -> str:
    # 1. Reversa da Base64: Obtém os bytes do XOR (st3)
    try:
        st3 = base64.b64decode(saida_b64)
    except Exception:
        return "Erro: Falha na decodificação Base64. A string pode ser inválida."

    # 2. Reversa do XOR: Obtém os bytes ofuscados e invertidos (st2)
    chave_bytes = chave_k.encode()
    st2 = xor_data(st3, chave_bytes)

    # 3. Reversa da Dupla Codificação Hex e Inversão
    
    # Reverte o .encode().hex()[::-1].encode()
    try:
        # Decodifica para string e inverte (reverte o [::-1])
        # Usamos latin-1 pois a string resultante do XOR pode conter bytes que não são UTF-8 válidos
        string_hex_dupla = st2.decode('latin-1')[::-1] 
    except Exception:
        return "Erro: Falha ao decodificar st2 para string (passo 3a)."
        
    # Reverte o .encode().hex() para obter st1 como bytes
    try:
        st1_bytes = bytes.fromhex(string_hex_dupla)
    except Exception:
        return "Erro: Falha na decodificação Hex Dupla (passo 3b). A chave K pode estar incorreta."

    # 4. Reversa da Codificação Hex Inicial
    
    # Transforma os bytes de st1 na string hex original
    try:
        st1_hex_string = st1_bytes.decode('latin-1')
    except Exception:
        return "Erro: Falha ao decodificar st1_bytes para string hex (passo 4a)."
        
    # Reverte o .hex() inicial: obtém a string original T1
    try:
        T1_bytes = bytes.fromhex(st1_hex_string)
        T1 = T1_bytes.decode('utf-8')
        return T1
    except Exception:
        return "Erro: Falha na decodificação Hex Inicial para T1. Dados corrompidos ou chave errada."


# --- Dados Fornecidos ---
CHAVE = "4002-8922"
SAIDA_B64 = "AAYHAR4LDwEGBwMDAx4LCgIBBwMEARsLDAEEBwADAR4OCgQBBwMGAR4LDwEKBwMDAx4OCgQBAgMGAR4LDAEBBwEDAR4MCgQBBwMDARwLCgEABwMDAx4OCgEBBwMDARsLCAEBBwcDAR4KCgEBDQMDAR4LDwEABwMDBh4LCgYBBwMCAR4LCwQFBwEDBx4LDwYBBQMEAQ=="

# Executar a decifração
resultado = decifrar_saida(SAIDA_B64, CHAVE)

print("--- Resultado da Decifração ---")
print(f"Chave (K): {CHAVE}")
print(f"Saída Base64 (C): {SAIDA_B64}")
print(f"\nString Original (T1): **{resultado}**")