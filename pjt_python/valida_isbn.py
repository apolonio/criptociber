def validar_isbn10(isbn):
    isbn = isbn.replace("-", "").replace(" ", "")
    
    if len(isbn) != 10:
        return False
    
    soma = 0
    
    for i in range(9):
        soma += (i + 1) * int(isbn[i])
    
    # último dígito pode ser X
    if isbn[9] == 'X':
        soma += 10 * 10
    else:
        soma += 10 * int(isbn[9])
    
    return soma % 11 == 0


isbn = "1009277618"

print(validar_isbn10(isbn))

def validar_isbn13(isbn):
    isbn = isbn.replace("-", "").replace(" ", "")
    
    if len(isbn) != 13:
        return False
    
    soma = 0
    
    for i in range(12):
        if i % 2 == 0:
            soma += int(isbn[i]) * 1
        else:
            soma += int(isbn[i]) * 3
    
    digito = (10 - (soma % 10)) % 10
    
    return digito == int(isbn[12])


isbn = "9781009277617"

print(validar_isbn13(isbn))
