<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h1>DESEC - UNIGRAN</h1>
    <p>Aluno: Apolonio</p>
    <p>Curso: Análise e Desenvolvimento de Sistemas</p>
    <p>Disciplina: Programação Web</p>
    <?php $usuario = $_POST´["usuario"]; 

    ?>
<center>
<form name="meuform" method="post" action="index.php">
<input type="text" name="usuario" placeholder="Digite seu nome">
<input type="submit" value="Enviar">    
<input type="hidden" value="Limpar">
</form>
</center>

Seja bem vindo! <?php print $usuario; ?>
</br>
</br>

<hr>

</body>
</html>