#include <iostream>
using namespace std;

int main() {
    int primeiroTermo, razao, nTermos;

    // Solicita os dados ao usuário
    cout << "Digite o primeiro termo da PA: ";
    cin >> primeiroTermo;
    
    cout << "Digite a razao da PA: ";
    cin >> razao;
    
    cout << "Digite o numero de termos que deseja calcular: ";
    cin >> nTermos;

    // Calcula e exibe os termos da PA
    cout << "Os termos da PA são: ";
    for (int i = 0; i < nTermos; i++) {
        // Fórmula do termo da PA: a_n = a_1 + (n - 1) * r
        int termo = primeiroTermo + i * razao;
        cout << termo << " ";
    }
    cout << endl;

    return 0;
}
