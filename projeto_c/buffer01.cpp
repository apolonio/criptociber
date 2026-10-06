#include <stdio.h>
#include <string.h>

int main(int argc, char *argv[]){
    char nome[16];
    //Função que copia dados de um lado para outro
    //copiando o parametro dentro de argv para dentro de nome
    strcpy(nome, argv[1]);
    
    return 0;
}
