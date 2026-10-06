#include <iostream>
#include <fstream>   // Biblioteca para trabalhar com arquivos
using namespace std;

int main() {
    string produto;
    float preco;
    int quantidade;

    // Cria e abre o arquivo para escrita
    ofstream arquivo("base.txt");

    // Verifica se o arquivo foi criado corretamente
    if (!arquivo) {
        cout << "Erro ao criar o arquivo!" << endl;
        return 1;
    }

    // Entrada de dados
    cout << "Digite o nome do produto: ";
    cin.ignore();            // Limpa o buffer
    getline(cin, produto);

    cout << "Digite o preco do produto: ";
    cin >> preco;

    cout << "Digite a quantidade: ";
    cin >> quantidade;

    // Grava os dados no arquivo
    arquivo << "Produto: " << produto << endl;
    arquivo << "Preco: " << preco << endl;
    arquivo << "Quantidade: " << quantidade << endl;

    // Fecha o arquivo
    arquivo.close();

    cout << "Dados gravados com sucesso no arquivo base.txt" << endl;

    return 0;
}
