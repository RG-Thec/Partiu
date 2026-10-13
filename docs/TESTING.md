# 🧪 PARTIU — Mobilidade Urbana: Estratégia de Testes & Qualidade (Enterprise V6.0)

> Especificação da estratégia de testes automatizados, benchmarks de concorrência, testes de carga, linters de governança e homologação contínua para a plataforma **PARTIU — Mobilidade Urbana**.

---

## 1. Visão Geral da Estratégia de Testes

A integridade do **PARTIU MOBE** é garantida por uma pirâmide de testes abrangente e orientada a contratos de missão crítica. O harness principal é executado em TypeScript nativo via TSX (`npm test` / `test/run-all-tests.mjs`).

```text
================================================================================
📊 RESULTADO HOMOLOGADO V6.0: 411/411 TESTES PASSARAM (0 FALHAS)
================================================================================
✅ 39 Suítes Corporativas Validadas
✅ 100% de Aprovação em Despacho, RLS, FinOps Ledger, Criptografia e SaaS
✅ Microbenchmarks de Concorrência: 1.000 splits em 3ms (p95 < 0.003ms)
✅ Testes de Carga Anti-Overbooking: 500 requisições simultâneas para 15 vagas
✅ Benchmarks de Despacho: 50/50 corridas pareadas (p99 7.21ms)
================================================================================
```

---

## 2. Matriz de Cobertura das 39 Suítes Corporativas

| Suíte | Identificador e Escopo | Contratos e Invariantes Validadas |
| :---: | :--- | :--- |
| **01** | **Domain State Machines & Guard Invariants** | Transições de corrida (DRAFT $\to$ REQUESTED $\to$ COMPLETED); bloqueio de transição ilegal; FSM de bilhetes e dispositivos revogados. |
| **02** | **Zero-Trust Multi-Tenancy & Adversarial RLS** | Testes adversariais tentando leitura ou exclusão de recursos do Tenant B pelo Tenant A; isolamento em 100% das listagens. |
| **03** | **Global Idempotency Engine** | Comandos repetidos retornam resultado idêntico sem reprocessamento; reuso de chave com payload diferente lança `IDEMPOTENCY_CONFLICT`. |
| **04** | **FinOps Minor Units Precision & Balanced Ledger** | Split contábil exato em centavos inteiros (Minor Units); estornos geram lançamentos imutáveis de reversão. |
| **05** | **Transactional Outbox, Event Bus & DLQ** | Publicação atômica no banco com despacho assíncrono e encaminhamento para Dead-Letter Queue após falhas repetidas. |
| **06** | **SOS Critical Path State Machine** | FSM de emergência (CREATED $\to$ ACKNOWLEDGED $\to$ DISPATCHED $\to$ RESOLVED). |
| **07** | **Circuit Breaker Fault Isolation Engine** | Isolamento de conexões externas com fallback e Token Bucket Rate Limiter para bloqueio de rajadas. |
| **08** | **Cryptographic Key Lifecycle & Multi-Version Rotation** | Validação com versão ativa da chave e bloqueio imediato com chaves revogadas. |
| **09** | **Offline Queue Sequence Gaps & Hash Chain** | Detecção de saltos de sequência em eventos offline e garantia da integridade criptográfica. |
| **10** | **Multi-Variable Telemetry & Anomaly Scoring** | Detecção e bloqueio de teletransporte anômalo (> 180 km/h). |
| **11** | **Real In-Process Concurrency Benchmark** | 1.000 operações de contabilidade processadas em 3ms com p95 < 0.003ms. |
| **12** | **Authentic Ed25519 Cryptography (RFC 8032)** | Assinatura e verificação de 64 bytes; rejeição imediata de payloads com dados adulterados. |
| **13** | **Financial Webhook HMAC-SHA256 Anti-Tamper & Anti-Replay** | Validação de assinatura HMAC; bloqueio de webhooks expirados (> 5 min) ou alterados. |
| **14** | **Strict Double-Entry Bookkeeping Ledger** | $\sum \text{Débitos} \equiv \sum \text{Créditos}$ em depósitos em garantia (escrow) e liquidações. |
| **15** | **Server-Side Ticket Issuance & Zero Client Key Leak** | Zero vazamento de chave privada no cliente; emissão segura server-side e validação offline em totens com chave pública. |
| **16** | **Atomic Seat Reservation & Concurrency Overbooking** | 100 requisições simultâneas disputando 1 única vaga $\to$ exatamente 1 confirmada e 99 rejeitadas com segurança. |
| **17** | **Outbox Worker Engine & Exponential Backoff** | Backoff progressivo (1s $\to$ 2s $\to$ 4s $\to$ 8s) e transferência atômica para DLQ após estourar tentativas. |
| **18** | **SOS Security Hardening & Tenant Anti-Flood** | Rejeição de chamados de emergência sem dados mínimos de identificação do solicitante. |
| **19** | **GPS Geographic Deadband & Database Write Throttle** | Supressão de 34% de escritas quando o veículo está parado (< 20m e < 15s) e transmissão imediata quando em movimento. |
| **20** | **Continuous GPS Engine & Background Telemetry** | Fila durável offline de telemetria e heartbeat temporal de liveness. |
| **21** | **Cloud Ticket Persistence & Phone Normalization** | Formatação telefônica E.164 (DDD brasileiro) e deduplicação inteligente com cache local. |
| **22** | **Broadcast Notifications & Multi-Category Routing** | Roteamento exclusivo por categoria de usuário (Passageiro, Motorista, Geral). |
| **23 a 33** | **Módulos de Domínio, Tarifação e Frotas Multicategoria** | Fórmulas tarifárias de Carro, Moto, Flash e Vans; filas de aceite atômico e roteamento. |
| **34** | **Monetização SaaS — Catálogo de Planos & Trial** | Parametrização de planos (Diário, Semanal, Mensal, Anual); configurador visual de trial (3, 7 e 30 dias). |
| **35** | **Monetização SaaS — Ciclo de Cobrança PIX & Idempotência** | Geração de cobranças PIX preservando metadados; liquidação idempotente sem duplicação de dias em retentativas. |
| **36** | **Monetização SaaS — Avaliação de Acesso & Vigência** | Motoristas com pendência são avaliados como `PAYMENT_PENDING`; motoristas adimplentes recebem `ACTIVE`. |
| **37** | **Monetização SaaS — Auditoria e Separação Contábil** | Concessão de dias de cortesia com log imutável de auditoria; separação contábil estrita entre saques de corridas e mensalidades. |
| **38** | **Monetização SaaS — Métricas Financeiras Executivas** | Consistência numérica dos cálculos de MRR, ARR, LTV, CAC e Churn. |
| **39** | **Geofencing & Prioridade Territorial de Franquias** | Base canônica de cidades com cálculo Haversine; Matriz Nacional com cobertura irrestrita; Franquias Regionais com bloqueio anti-invasão (`FORA_DO_PERIMETRO`) e licenciamento de expansão de cidades vizinhas pelo Super Admin. |

---

## 3. Benchmarks e Testes de Carga

### A. Benchmark de Despacho Concorrente
```bash
npm run bench:dispatch
```
- **Simulação:** 50 corridas simultâneas disputadas por múltiplos motoristas em tempo real.
- **Métricas:** 100% de sucesso no pareamento, latência média de **0.92ms** e p99 de **7.21ms**.

### B. Teste de Carga e Anti-Overbooking
```bash
npm run test:load
```
- **Simulação:** 500 requisições simultâneas competindo por 15 assentos disponíveis.
- **Métricas:** Exatamente 15 assentos reservados com sucesso e 485 rejeitadas elegantemente, latência p99 de **31.28ms** e **34%** de writes suprimidos com deadband.

### C. Checagem Estática de Tipagem
```bash
npx tsc --noEmit
```
- **Métricas:** 0 erros com TypeScript strict mode integral.

---

## 4. Linters de Governança de Produto (super-ux & Brand Voice)

O projeto adota governança automatizada via scripts em Python que validam documentação e código antes de qualquer publicação:

```bash
# 1. Linter de UX (Telas, Cenários e Fluxos):
python docs/ux/lint.py

# 2. Linter de Brand Voice (Strings, Vocabulário e Invariantes):
python docs/brand/lint.py
```
- **Critério de Aceite:** Ambos devem retornar código de saída `0` (Zero Erros).
