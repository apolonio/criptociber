<?php
    if ($_POST["username"] == "ricardo" && $_POST["password"] == "1234")
        header("Location: sucesso.php");
    else if ($_POST["username"] == "longatto" && $_POST["password"] == "1234")
        header("Location: limitado.php");
    else {
?>
<center>
</br><hr></br>
<form method="POST">
    Username: <input name="username" type="text" /><br /><br/>
    Password: <input name="password" type="password" /><br /><br/>
    <input type="submit" value="Entrar" />
</br><hr>
</center>
<?php
    }
?>