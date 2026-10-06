#include <iostream>
using namespace std;

int main() {
    float n1, n2, n3, n4;
    float media;

    // Entrada das notas
    cout << "Digite a primeira nota: ";
    cin >> n1;

    cout << "Digite a segunda nota: ";
    cin >> n2;

    cout << "Digite a terceira nota: ";
    cin >> n3;

    cout << "Digite a quarta nota: ";
    cin >> n4;

    // Cálculo da média
    media = (n1 + n2 + n3 + n4) / 4;

    // Exibe a média
    cout << "Media final: " << media << endl;

    // Verificação da aprovação
    if (media >= 7) {
        cout << "Parabens! Voce passou de ano." << endl;
    } else {
        cout << "Voce foi reprovado." << endl;
    }

    return 0;
}
