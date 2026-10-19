# 10. Guia de Desenvolvimento, Testes, Deploy e Operação (Enterprise V6.0)

---

## 1. Pré-Requisitos de Ambiente

Para executar, testar e contribuir com o projeto **PARTIU MOBE**, certifique-se de possuir instalado em sua estação de trabalho:

- **Node.js:** Versão 20.x ou superior (Recomendado: 22.x LTS).
- **npm:** Versão 10.x ou superior.
- **Python:** Versão 3.12+ (Obrigatório para execução dos linters de governança de UX e Marca).
- **Git:** Versão 2.40 ou superior.
- **Supabase CLI:** (Opcional, para testes locais de banco de dados e Edge Functions).
- **Navegador Moderno:** Chrome, Edge ou Safari com suporte a WebGL e WebSockets.

---

## 2. Instalação e Execução Local

### A. Clonar o Repositório e Instalar Dependências

```bash
# 1. Clone o repositório
git clone https://github.com/RG-Thec/Partiu.git
cd "NOVO PARTIU-MOBE"

# 2. Instale as dependências com npm
npm install
```

### B. Configuração de Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto baseado no modelo abaixo:

```env
# =============================================================================
# SUPABASE CONFIGURATION (POSTGRESQL & REALTIME)
# =============================================================================
VITE_SUPABASE_URL=https://sua-instancia.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres.xxx:senha_segura@aws-0-sa-east-1.pooler.supabase.com:6543/postgres

# =============================================================================
# GEOESPACIAL & MAPAS (MAPBOX / OSRM)
# =============================================================================
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoicGFydGl1LW1vYmUiLCJhIjoiY2...

# =============================================================================
# GATEWAYS DE PAGAMENTO PIX (SAAS MENSALIDADES)
# =============================================================================
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_WEBHOOK_SECRET=mp_sec_...
ASAAS_API_KEY=$aact_...
ASAAS_WEBHOOK_SECRET=asaas_sec_...

# =============================================================================
# AMBIENTE & DEPLOY SERVERLESS
# =============================================================================
VITE_APP_ENV=development
VITE_APP_URL=http://localhost:8080
NITRO_PRESET=vercel
```

> **Aviso de Segurança (P0):** Nenhuma credencial de banco de dados ou chave privada deve ser commitada em código-fonte. O sistema rejeita strings de conexão estáticas e consome exclusivamente variáveis de ambiente (`DATABASE_URL`).

### C. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:8080`.

---

## 3. Suíte de Testes Automatizados e Homologação Contínua

O projeto possui uma rigorosa suíte de testes de missão crítica inspirada em engenharia financeira e de mobilidade de larga escala.

```bash
# Executar a Suíte Completa Corporativa (411 testes em 39 suítes):
npm test
```

### Matriz de Cobertura das 39 Suítes de Teste:

1. **Domain State Machines & Guard Invariants:** Transições estritas de Corridas, Bilhetes e Dispositivos.
2. **Zero-Trust Multi-Tenancy & RLS:** Testes adversariais garantindo isolamento total entre franquias.
3. **Global Idempotency Engine:** Prevenção de duplicidade em requisições financeiras e operacionais.
4. **FinOps Minor Units Precision & Balanced Ledger:** Balanço contábil exato de dupla entrada em centavos inteiros.
5. **Transactional Outbox & DLQ:** Garantia atômica de persistência e despacho resiliente de eventos.
6. **SOS Critical Path & Priority Queue:** Transição de chamados de emergência e canal prioritário.
7. **Circuit Breaker Fault Isolation:** Isolamento automático de falhas externas com fallback gracioso.
8. **Cryptographic Key Lifecycle & Multi-Version Rotation:** Rotação de chaves ativas e revogadas.
9. **Offline Queue Sequence Gaps & Hash Chain:** Detecção de eventos suprimidos e integridade de cadeia.
10. **Multi-Variable Telemetry & Anomaly Scoring:** Detecção de saltos de teletransporte (> 180 km/h).
11. **Real In-Process Concurrency Benchmark:** 1.000 operações em 3ms com p95 < 0.003ms.
12. **Authentic Ed25519 Cryptography (RFC 8032):** Assinatura e verificação digital de bilhetes e tickets.
13. **Financial Webhook HMAC-SHA256 Anti-Tamper:** Validação de integridade e rejeição de replays expirados (> 5 min).
14. **Strict Double-Entry Bookkeeping Ledger:** Garantia matemática de `SUM(Débitos) === SUM(Créditos)`.
15. **Server-Side Ticket Issuance:** Emissão segura com chave privada isolada no servidor.
16. **Atomic Seat Reservation & Concurrency Overbooking:** 100 requisições simultâneas disputando 1 vaga.
17. **Outbox Worker Engine & Exponential Backoff:** Retentativas progressivas com transferência para DLQ.
18. **SOS Security Hardening:** Validação de integridade de dados mínimos do solicitante.
19. **GPS Geographic Deadband & Write Throttle:** Otimização de I/O bloqueando escritas repetitivas de veículos parados.
20. **Continuous GPS Engine & Background Telemetry:** Fila durável offline e heartbeat de liveness.
21. **Cloud Ticket Persistence & Phone Normalization:** Formatação E.164 e mesclagem entre nuvem e cache local.
22. **Broadcast Notifications & Multi-Category Routing:** Segmentação precisa por perfil de usuário.
23. a 33. **Módulos de Domínio e Frotas Multicategoria.**
24. **Monetização SaaS — Catálogo de Planos & Configurador de Trial (3, 7 e 30 dias).**
25. **Monetização SaaS — Ciclo de Cobrança PIX & Idempotência Transacional.**
26. **Monetização SaaS — Avaliação de Acesso & Controle de Vigência (`ACTIVE` vs `PAYMENT_PENDING`).**
27. **Monetização SaaS — Auditoria Administrativa, Concessão de Cortesia & Separação Contábil.**
28. **Monetização SaaS — Métricas Financeiras Executivas (MRR, ARR, LTV, CAC, Churn).**
29. **Geofencing & Prioridade Territorial de Franquias:** Base canônica de cidades, Matriz Nacional irrestrita, bloqueio anti-invasão (`FORA_DO_PERIMETRO`) e expansão de cidades vizinhas.

---

## 4. Benchmarks e Testes de Carga Concorrente

```bash
# 1. Benchmark de Despacho Concorrente em Tempo Real:
npm run bench:dispatch
# Resultado: 50/50 corridas pareadas com 100% sucesso, latência média 0.92ms, p99 7.21ms

# 2. Teste de Carga de Alta Concorrência (Anti-Overbooking):
npm run test:load
# Resultado: 500 requisições disputando 15 vagas -> 15 aprovadas, p99 31.28ms, 34% de GPS suprimido via deadband

# 3. Verificação Estática de Tipagem TypeScript:
npx tsc --noEmit
# Resultado: 0 erros em modo estrito integral
```

---

## 5. Linters de Governança de Produto (super-ux & Brand Voice)

Antes de qualquer entrega ou commit em produção, os linters oficiais de UX e Marca devem ser executados:

```bash
# 1. Linter de UX (Telas, Cenários e Fluxos):
python docs/ux/lint.py
# Saída esperada: OK — docs/ux is consistent (exit code 0)

# 2. Linter de Brand Voice (Strings, Terminologia e Invariantes):
python docs/brand/lint.py
# Saída esperada: 0 error(s) (exit code 0)
```

---

## 6. Build e Deploy em Produção (Vercel / Nitro SSR)

### A. Compilação do Artefato Serverless

```bash
npm run build
```

O build compila o frontend com Vite e gera o motor SSR Nitro em `.vercel/output/nitro.json` em menos de 3 segundos.

### B. Plataformas de Hospedagem e Configurações

- **Vercel:**
  - Conectar repositório GitHub.
  - Vercel detecta automaticamente a configuração Nitro/TanStack Start.
  - Variáveis de ambiente configuradas no painel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAPBOX_TOKEN`, `DATABASE_URL` e `NITRO_PRESET=vercel`.
- **Supabase Cloud:**
  - Hospeda PostgreSQL 15+ com PostGIS, WebSockets Realtime, Edge Functions e autenticação.

---

## 7. Observabilidade, Resiliência e Plano de Contingência

### Metas de Confiabilidade (SLO / SLA)

- **Disponibilidade da API Core:** 99,95%
- **Tempo de Resposta de Despacho (p95):** $< 100 \text{ ms}$
- **Tempo de Ativação do Pix SaaS:** $< 2,0 \text{ segundos}$
- **RPO (Recovery Point Objective):** $< 5 \text{ minutos}$ (via PostgreSQL WAL / Point-in-Time Recovery)
- **RTO (Recovery Time Objective):** $< 15 \text{ minutos}$ em caso de contingência catastrófica

### Circuit Breakers e Degradação Graciosa

- Caso a API Mapbox apresente indisponibilidade, a Edge Function `/functions/v1/verify-and-create-ride` aciona automaticamente o cálculo geodésico Haversine.
- Caso o gateway primário Pix apresente instabilidade de rede, as requisições de checkout chaveiam dinamicamente para o gateway secundário configurado.
