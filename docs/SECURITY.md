# 🛡️ PARTIU — Mobilidade Urbana: Especificação de Segurança & OWASP (Enterprise V6.0)

> Diretrizes oficiais de segurança cibernética, conformidade OWASP Top 10, sanitização de credenciais, criptografia assimétrica, isolamento Zero-Trust e governança de dados para a plataforma **PARTIU — Mobilidade Urbana**.

---

## 1. Princípios de Segurança Corporativa

1. **Defense in Depth (Defesa em Profundidade):**  
   Validação obrigatória em todas as camadas da aplicação:
   `Client PWA/Mobile -> TLS 1.3 -> Supabase Auth -> Tenant Context -> Input Sanitization -> Domain Guards -> Database Constraints -> PostgreSQL RLS -> Immutability Audit Logs`.
2. **Fail Closed (Falha Segura):**  
   Qualquer anomalia de autorização, expiração de token JWT, violação de perímetro de franquia ou assinatura inválida encerra imediatamente o fluxo com rejeição segura e log de auditoria.
3. **Zero-Trust Multi-Tenancy:**  
   Nenhum usuário ou operador regional confia tacitamente em outro. O isolamento entre franquias e cooperativas é garantido nativamente no kernel do banco de dados via Row Level Security (RLS).
4. **Redaction Automática de PII (LGPD):**  
   Mascaramento de dados sensíveis (números de cartão de crédito, senhas, CPF e telefones) em 100% dos canais de chat e logs estruturados.

---

## 2. Auditoria e Sanitização de Credenciais (P0 Saneado)

### 2.1 Política de Armazenamento de Segredos
- **Proibição Estrita de Senhas em Código-Fonte:**  
  Nenhum script de provisionamento, migração, teste ou função de backend pode conter strings de conexão hardcoded com credenciais de acesso ao banco de dados.
- **Carregamento Dinâmico Seguro:**  
  Todas as rotinas administrativas que demandam conexão direta com o PostgreSQL (ex: `update-branding-db.ts`, `provision-superadmin-users.ts`) consomem estritamente `process.env.DATABASE_URL` carregado de forma protegida via variáveis de ambiente em tempo de execução.
- **Varredura Automatizada:**  
  Verificações de integridade estática no repositório asseguram zero ocorrências de credenciais em texto puro.

### 2.2 Rotação de Credenciais e Gestão de Chaves
- Chaves de conexão ao PostgreSQL e chaves de API de terceiros (Mapbox, gateways Pix) devem ser rotacionadas periodicamente.
- A chave mestra do Supabase (`SUPABASE_SERVICE_ROLE_KEY`) nunca é exposta no bundle público do cliente frontend, ficando restrita ao ambiente de servidor seguro.

---

## 3. Matriz de Mitigação OWASP Top 10

| Vulnerabilidade OWASP | Risco Potencial | Mecanismo de Proteção Implementado no PARTIU |
| :--- | :--- | :--- |
| **A01: Broken Access Control** | Vazamento entre franquias | Políticas ativas de PostgreSQL Row Level Security (RLS) condicionadas a `tenant_id` e papel do usuário. |
| **A02: Cryptographic Failures** | Interceptação de dados | TLS 1.3 em trânsito; Assinatura digital assimétrica Ed25519 (RFC 8032); HMAC-SHA256 para webhooks. |
| **A03: Injection** | SQL Injection / NoSQL | Uso exclusivo de consultas parametrizadas via PostgREST / Supabase Client e RPCs PostgreSQL estritamente tipadas. |
| **A04: Insecure Design** | Race conditions no despacho | Bloqueio pessimista `SELECT FOR UPDATE` para aceite atômico de corridas e prevenção de overbooking de assentos. |
| **A05: Security Misconfiguration** | Headers permissivos | Headers HTTP restritivos: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`. |
| **A06: Vulnerable Components** | Falhas em pacotes npm | Dependências atualizadas (React 19.2, Vite 8.1, Tailwind 4.2), auditoria contínua via `npm audit` e zero vulnerabilidades críticas. |
| **A07: Identification and Auth** | Força bruta / Sessão | Tokens JWT com tempo de expiração curto, suporte a MFA no Supabase Auth e revogação imediata de dispositivos suspeitos. |
| **A08: Software & Data Integrity** | Payloads adulterados | Validação de integridade HMAC-SHA256 com janela de tolerância de 5 minutos contra ataques de replay. |
| **A09: Logging & Monitoring** | Falta de rastreabilidade | Transactional Outbox com Dead-Letter Queue (DLQ), logs estruturados e auditoria de concessão de cortesia. |
| **A10: Server-Side Request Forgery** | Requisições maliciosas | Validação rigorosa de URLs de saída com restrição de portas e endereços IP permitidos para gateways Pix autorizados. |

---

## 4. Criptografia Assimétrica e Bilhetagem Offline (Ed25519)

Para o transporte complementar e emissão de bilhetes eletrônicos:
- **Isolamento de Chaves:** O módulo do cliente (`offline-ticket-crypto.ts`) **NÃO exporta nenhuma chave privada**. A emissão e assinatura do bilhete ocorrem estritamente no servidor via algoritmo Ed25519 (RFC 8032).
- **Validação Offline em Totens:** Os validadores veiculares (vans e lotações) recebem apenas a **chave pública** para verificação instantânea da assinatura de 64 bytes em milissegundos sem necessidade de conexão com a internet.
- **Detecção de Fraude:** Qualquer alteração em um único byte do bilhete invalida a assinatura criptográfica imediatamente.

---

## 5. Webhooks Financeiros com HMAC-SHA256 Anti-Replay

Os pagamentos de assinaturas de motoristas recebidos via Pix de múltiplos gateways (Mercado Pago, Asaas, PicPay, EFI Bank) possuem camadas de proteção estritas:
1. **Assinatura HMAC-SHA256:** Cada notificação recebida deve conter a assinatura válida gerada com o segredo compartilhado configurado no tenant.
2. **Janela Temporal de Tolerância (5 Minutos):** Requisições com timestamp divergente em mais de 300 segundos são descartadas imediatamente para anular ataques de repetição (*replay attacks*).
3. **Idempotência Transacional:** O processamento grava o identificador do pagamento e impede duplicações em caso de disparos repetidos pelo gateway.

---

## 6. Prevenção de Concorrência & Anti-Overbooking

Em situações de alta demanda:
- **Aceite Atômico de Corridas:** Se múltiplos condutores tentarem aceitar a mesma viagem simultaneamente, a transação utiliza lock em nível de linha no PostgreSQL. Exatamente um condutor obtém o aceite e os demais recebem notificação limpa sem lock wait prolongado.
- **Reserva Atômica de Vagas:** Homologada em testes de carga onde 500 requisições simultâneas disputam 15 vagas disponíveis, confirmando exatamente as 15 vagas sem overbooking (p99 de 31.28ms).

---

## 7. Conformidade com a Lei Geral de Proteção de Dados (LGPD)

- **Minimização de Dados:** Coleta restrita aos dados estritamente indispensáveis para a execução do transporte urbano e faturamento.
- **Direito ao Esquecimento:** Procedimento automatizado para anonimização de dados do passageiro mediante solicitação, preservando apenas os registros fiscais e contábeis legalmente exigidos.
- **Proteção no Chat Interno:** Supressão automática de números de telefone e dados de pagamento transmitidos nas mensagens em tempo real entre condutor e passageiro.
