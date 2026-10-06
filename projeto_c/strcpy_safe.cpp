#include <stdio.h>
#include <string.h>

int main(int argc, char *argcv[]){

    char nome[16];

    if (argc < 2) {

        printf("Modo de uso: check.exe username\n");
        return 0;
    
    }
    strncpy(nome, argv[1],15);
    printf("Seja bem vindo: %s \n Seu usuário foi adicionado!\n",nome);

    return 0;
}