let fn = function(msg, n) {
     console.log(`${msg}: ${this.a ** n}`);
}
let bfn = fn.bind({a: 5}, 'result');
bfn(2, 3);
