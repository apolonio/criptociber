let car = {
  make: 'Dodge',
  model:'Dakota'
}

// Insert line here (qualquer linha, opcional)
// console.log(car);

car.color = 'red';
car.model= 'Viper';

function executar() {
    console.log(`${car.make} ${car.model}, color: ${car.color}`);

    // Escrevendo na tela SEM ERRO
    document.getElementById("saida").innerText =
        `${car.make} ${car.model}, cor: ${car.color}`;

    let fn = function(msg, n) {
  console.log(`${msg}: ${this.a ** n}`);
}
let bfn = fn.bind({a: 5}, 'result');
bfn(2, 3);

}
