<?php
    // Na vida real, aqui nós verificaríamos se o usuário passou pelo login de verdade 
    // usando "Sessions" (Sessões). Como estamos testando, vamos fixar o nome dele.
    $nomeAluno = "Ricardo"; 
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Painel do Aluno - Sucesso</title>
    <style>
        /* Estilização básica para deixar a página bonita */
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background-color: #f4f7f6; 
            color: #333; 
            margin: 0; 
            padding: 20px; 
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 4px 10px rgba(0,0,0,0.1); 
        }
        .header { 
            border-bottom: 2px solid #2ecc71; 
            padding-bottom: 10px; 
            margin-bottom: 20px; 
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .btn-sair {
            color: #e74c3c;
            text-decoration: none;
            font-weight: bold;
        }
        .perfil { 
            display: flex; 
            align-items: center; 
            gap: 20px; 
            margin-bottom: 30px; 
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
        }
        .avatar { 
            width: 70px; 
            height: 70px; 
            background-color: #2ecc71; 
            color: white; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 28px; 
            font-weight: bold; 
        }
        .cursos { 
            display: grid; 
            gap: 15px; 
        }
        .curso-card { 
            padding: 20px; 
            border: 1px solid #e0e0e0; 
            border-left: 5px solid #3498db; 
            border-radius: 6px; 
            background: #fff;
            transition: transform 0.2s;
        }
        .curso-card:hover {
            transform: translateX(5px);
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .curso-title { 
            font-weight: bold; 
            font-size: 1.2em; 
            color: #2c3e50; 
            margin-bottom: 8px;
        }
        .btn-acessar { 
            display: inline-block; 
            margin-top: 15px; 
            padding: 8px 16px; 
            background: #3498db; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px; 
            font-size: 0.9em;
        }
        .btn-acessar:hover { 
            background: #2980b9; 
        }
    </style>
</head>
<body>

    <div class="container">
        <div class="header">
            <h1>Portal de Cursos</h1>
            <a href="index.php" class="btn-sair">Sair (Logout)</a>
        </div>

        <div class="perfil">
            <div class="avatar"><?php echo substr($nomeAluno, 0, 1); ?></div>
            <div>
                <h2>Bem-vindo(a) de volta, <?php echo $nomeAluno; ?>!</h2>
                <p>Matrícula: <strong>2024-SYS-001</strong> | Status: <strong style="color: #2ecc71;">Ativo</strong></p>
            </div>
        </div>

        <h3>Meus Cursos Matriculados</h3>
        <div class="cursos">
            
            <div class="curso-card">
                <div class="curso-title">1. Fundamentos de Engenharia de Software</div>
                <p>Aprenda os ciclos de vida do software, metodologias ágeis (Scrum/Kanban) e levantamento de requisitos.</p>
                <a href="#" class="btn-acessar">Continuar Assistindo ▶</a>
            </div>

            <div class="curso-card">
                <div class="curso-title">2. Clean Code: Escrevendo Códigos Limpos</div>
                <p>Heurísticas e regras práticas para escrever códigos fáceis de ler, entender e evoluir no dia a dia da programação.</p>
                <a href="#" class="btn-acessar">Iniciar Curso ▶</a>
            </div>

            <div class="curso-card">
                <div class="curso-title">3. Eletrônica Básica para Programadores</div>
                <p>Entenda conceitos de tensão, corrente, e aprenda a alimentar circuitos, LEDs e módulos Arduino com segurança.</p>
                <a href="#" class="btn-acessar">Iniciar Curso ▶</a>
            </div>

        </div>
    </div>

</body>
</html>