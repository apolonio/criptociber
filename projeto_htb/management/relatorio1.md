# Relatório de reconhecimento — management.htb

**Alvo:** `10.129.122.134` (`management.htb`)  
**Fonte:** arquivos `nmap-all-management`, `nmap-services-management` e `nmap-so-management` nos formatos `.nmap`, `.gnmap` e `.xml`  
**Data das varreduras:** 1º de outubro de 2026  
**Escopo deste relatório:** análise dos resultados já registrados, sem nova interação com o alvo.

Os nove arquivos representam **três varreduras**: cada uma foi salva nos formatos `.nmap`, `.gnmap` e `.xml`. Os formatos não constituem nove confirmações independentes.

## Resumo executivo

O host respondeu às varreduras e apresentou **seis portas TCP abertas**: 22, 80, 443, 4444, 35247 e 50389. Os serviços identificados incluem SSH, nginx com HTTP/HTTPS, LDAP sobre TLS, Java RMI e LDAP. O Nmap informou que a porta **50389 aceita bind anônimo**. Isso merece validação prioritária para determinar se usuários sem autenticação também conseguem consultar dados; o bind, por si só, não comprova exposição de informações.

Não há comprovação de exploração, acesso não autorizado ou vulnerabilidade específica nos arquivos analisados. As versões e a estimativa do sistema operacional são identificações feitas pelo Nmap e devem ser confirmadas antes de associá-las a falhas conhecidas.

## Superfície exposta

| Porta TCP | Estado | Identificação registrada | Observações |
|---|---|---|---|
| 22 | Aberta | OpenSSH 9.6p1 Ubuntu 3ubuntu13.19 | Protocolo SSH 2.0. |
| 80 | Aberta | nginx 1.24.0 (Ubuntu), HTTP | Redireciona para `https://10.129.122.134/`; o Nmap não seguiu o redirecionamento. |
| 443 | Aberta | nginx 1.24.0 (Ubuntu), HTTPS | Redireciona para `https://management.htb/`; o Nmap não seguiu o redirecionamento. Certificado com CN `management.htb` e SANs `management.htb` e `*.management.htb`. |
| 4444 | Aberta | Serviço TLS identificado como LDAP | Certificado com CN `sso.management.htb`, descrito como autoassinado. O Nmap não identificou uma versão do serviço. |
| 35247 | Aberta | Java RMI | Identificado na varredura direcionada de serviços; não aparece na varredura posterior limitada às portas padrão. |
| 50389 | Aberta | LDAP | O Nmap registrou `Anonymous bind OK`; permissões de busca não foram demonstradas. |

Na primeira varredura, a porta 4444 apareceu como `krb524` por associação ao número da porta, sem identificação ativa do serviço. As duas varreduras posteriores sondaram a resposta e a identificaram como **LDAP sobre TLS**; esta é a identificação mais informativa dos arquivos.

O certificado apresentado na porta 443 tem validade registrada de **2 de junho de 2026 a 9 de maio de 2126**. O da porta 4444 tem validade registrada de **2 de junho de 2026 a 28 de maio de 2046**. Essas durações devem ser revisadas à luz da política de certificados do ambiente. A identificação de `sso.management.htb` também indica um nome de serviço adicional a incluir na revisão de exposição.

## Pontos de atenção e próximos passos

1. **LDAP na porta 50389:** verificar quais operações e atributos, se houver, podem ser consultados após o bind anônimo. Revisar controles de acesso e necessidade de exposição dessa porta.
2. **Java RMI na porta 35247:** confirmar qual aplicação o utiliza, quem precisa acessá-la e se há controles de acesso adequados. A presença do serviço não comprova uma falha.
3. **Serviço na porta 4444:** identificar a implementação e verificar a configuração de TLS, autenticação e acesso. Revisar a confiança e o ciclo de vida do certificado autoassinado.
4. **Aplicação web:** inspecionar os destinos HTTPS com o nome de host correto (`management.htb`) para entender o conteúdo e os controles expostos. As varreduras registradas não seguiram os redirecionamentos.
5. **SSH e nginx:** confirmar versões instaladas e atualizações aplicadas no host; a informação de banner não é suficiente para concluir se há vulnerabilidades.

## Limitações da evidência

- A varredura de todas as portas registrou **37.064 portas fechadas** e **28.465 filtradas/sem resposta**, além de um aviso de limite de retransmissões atingido. Latência e perda de respostas podem afetar a completude do resultado.
- A varredura de sistema operacional estimou Linux com kernel na faixa **4.15–5.19**; isso é uma estimativa, não uma versão confirmada.
- A varredura de sistema operacional examinou as portas padrão, razão pela qual não reapresentou a porta 35247. A varredura de todas as portas e a varredura direcionada de serviços a registraram como aberta.
- Os arquivos não incluem análise autenticada, revisão de configuração ou teste da aplicação. As prioridades acima são sugestões de investigação, não classificação definitiva de vulnerabilidades.

## Arquivos de evidência

- `nmap-all-management.nmap`: varredura de todas as portas TCP.
- `nmap-services-management.nmap`: detecção de serviços e scripts padrão nas seis portas identificadas.
- `nmap-so-management.nmap`: detecção adicional de serviços e estimativa de sistema operacional.
- Arquivos `.xml` e `.gnmap` correspondentes: formatos estruturado e compacto das mesmas varreduras.
