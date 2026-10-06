<?php
// UNIGRAN - ALUNO APOLONIO 
// 1. Definição das variáveis de entrada
$peso = 70; // Peso em kg
$altura = 1.75; // Altura em metros

// 2. Cálculo do IMC
// A fórmula é: IMC = peso / (altura * altura)
$imc = $peso / ($altura * $altura);

// 3. Exibição do resultado do cálculo
echo "Seu peso: " . $peso . " kg<br>";
echo "Sua altura: " . $altura . " m<br>";
echo "Seu IMC é: " . number_format($imc, 2) . "<br><br>";

// 4. Classificação do IMC
if ($imc < 18.5) {
    echo "Classificação: Abaixo do peso";
} elseif ($imc >= 18.5 && $imc <= 24.9) {
    echo "Classificação: Peso normal";
} elseif ($imc >= 25.0 && $imc <= 29.9) {
    echo "Classificação: Sobrepeso";
} else {
    echo "Classificação: Obesidade";
}

?>