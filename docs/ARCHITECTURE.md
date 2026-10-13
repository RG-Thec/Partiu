# 🏛️ PARTIU — Mobilidade Urbana: Arquitetura Técnica Oficial (Enterprise V6.0)

> Especificação de Arquitetura de Software, Engenharia Cartográfica, Despacho Espacial, Monetização SaaS (Taxa Zero 0%), Governança Territorial de Franquias, FinOps Ledger e Segurança Zero-Trust para a plataforma **PARTIU — Mobilidade Urbana**.

---

## 1. Identificação e Escopo do Sistema

* **Nome Oficial**: PARTIU — Mobilidade Urbana
* **Versão Canônica**: V6.0 Enterprise Hardened
* **Modalidades Atendidas**:
  1. **Carro Particular (Partiu Pop / Premium)**: Viagens urbanas individuais sob demanda.
  2. **Moto-Táxi (Partiu Moto)**: Mobilidade ágil de baixo custo e alta capilaridade.
  3. **Entregas Expressas (Partiu Flash / Delivery)**: Encomendas com autenticação por duplo PIN (Coleta e Entrega).
  4. **Transporte Complementar (Vans / Lotação)**: Linhas fixas, bilhetagem eletrônica offline com assinatura Ed25519 e passe estudantil/universitário.

---

## 2. Camadas da Plataforma (Clean Architecture & DDD)

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     1. EXPERIENCE & PRESENTATION LAYER                          │
│  - Web / PWA / SSR: React 19, Vite 8, TanStack Router & Start (Nitro SSR),      │
│    Tailwind CSS v4.2, Lucide React, Radix UI                                    │
│  - Mobile Engine: React Native (@rnmapbox/maps), Reanimated & Animated 60 FPS   │
│  - Cockpits: Passageiro, Motorista Parceiro, Lojista/Remetente, Admin Nacional  │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼────────────────────────────────────────┐
│                        2. API & BFF (BACKEND FOR FRONTEND)                      │
│  - Autenticação e Gestão de Sessão (Supabase Auth / JWT / MFA)                  │
│  - Gateway de Idempotência Global (Idempotency-Key com SHA-256 Hash Chain)      │
│  - Rate Limiting e Circuit Breaker (Token Bucket + Fault Isolation)             │
│  - Sanitização P0: Uso estrito de DATABASE_URL em variáveis de ambiente         │
│  - Sanitização de PII (Proteção automática de dados sensíveis e senhas)         │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼────────────────────────────────────────┐
│                         3. DOMAIN & LOGISTICS CORE                              │
│  - Dispatch Engine: ST_DWithin PostGIS, Ondas de 2km/4km/6km, DispatchScore     │
│  - Territorial Geofencing: Matriz Nacional vs Franquias Regionais (Anti-Invasão)│
│  - SaaS Subscription Service: Taxa Zero (0% Take Rate) & Controle de Vigência   │
│  - En Route Experience: Tolerância de 2min, Smart Camera Padding (320px), SOS   │
│  - Telemetry Pipeline: Continuous GPS, Snap to Route, Deadband e Heartbeat      │
│  - Chat Engine: Supabase Realtime, Outbox Offline, Anti-Flood e Smart Replies   │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼────────────────────────────────────────┐
│                     4. TRANSACTIONAL OUTBOX & EVENT BUS                         │
│  - Outbox Pattern Atômico: Escrita unificada de eventos de domínio no Postgres   │
│  - Dispatcher com Exponential Backoff (1s, 2s, 4s, 8s) e Dead-Letter Queue (DLQ)│
│  - Replay Criptográfico e Detecção de Sequence Gaps                             │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼────────────────────────────────────────┐
│                         5. FINOPS LEDGER & SECURITY                             │
│  - Strict Double-Entry Bookkeeping: SUM(Débitos) === SUM(Créditos)              │
│  - Minor Units Precision: Contabilidade estrita em centavos inteiros            │
│  - Separação Contábil Estrita: Saques de corridas isolados de mensalidades SaaS │
│  - Webhook Engine: Assinatura HMAC-SHA256 e janela de tolerância de 5 minutos   │
│  - Criptografia Ed25519: Emissão e validação offline de bilhetes                │
│  - PostgreSQL 15+ com PostGIS e RLS Multi-Tenant Zero-Trust                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Engenharia Cartográfica & Mapbox 3D (Padrão Uber/99)

A camada cartográfica do **PARTIU** foi projetada para alto contraste, zero ruído visual e renderização em 60 FPS direta na GPU.

### 3.1 Estilo Visual Monocromático (`light-v11`)
* **URL Canônica**: `mapbox://styles/mapbox/light-v11`
* **Estética**: Asfalto e quarteirões em tons suaves de cinza, branco e gelo, eliminando a poluição cromática de mapas convencionais.
* **Supressão Ativa de POIs**:
  No carregamento do mapa (`onDidFinishLoadingStyle`), as camadas de ruído visual são ocultadas em tempo de execução:
  - `poi-label`: Remove ícones de estabelecimentos comerciais.
  - `transit-label`: Remove ícones e rótulos de estações e paradas de transporte público.
  - `settlement-subdivision-label`: Remove rótulos densos de pequenas divisões.
* **Prédios 3D Volumétricos (`FillExtrusionLayer`)**:
  Ativados a partir do zoom 15 para dar tridimensionalidade sem obstruir as vias (`fillExtrusionColor: '#E2E8F0'`, `fillExtrusionOpacity: 0.3`).

### 3.2 Linha de Rota (Polyline de Alto Contraste)
* **Casing Inferior (`partiu-route-casing`)**:
  - `lineColor: '#FFFFFF'` (Branco puro)
  - `lineWidth: 7.5px`
  - `lineCap: 'round'`, `lineJoin: 'round'`
* **Linha Principal (`partiu-route-line`)**:
  - `lineColor: '#1A1A1A'` (Preto profundo)
  - `lineWidth: 4.8px`
  - `lineCap: 'round'`, `lineJoin: 'round'`

### 3.3 Veículos 3D com Billboarding 2.5D
* **SUV Branco Crossover (`car-premium`)**:
  - Asset verticalizado (0° Norte), 197x368 pixels, canal alfa 100% transparente.
  - Incorporado via Base64 Data URI (`car-premium-base64.ts`).
* **Motocicleta com Piloto (`moto-premium`)**:
  - Fundo azul e sombra de piso removidos com algoritmo multissemente.
  - Raios das rodas e vão do guidão desobstruídos.
  - Calça jeans e detalhes do piloto 100% preservados.
  - Incorporado via Base64 Data URI (`moto-premium-base64.ts`).
* **Parâmetros do `SymbolLayer`**:
  - `iconPitchAlignment: 'viewport'`: Mantém os veículos em pé (sem achatamento) com pitch de até 60°.
  - `iconRotationAlignment: 'map'`: O veículo vira o bico acompanhando as curvas da rua.
  - `iconAnchor: 'center'`: Eixo de rotação no centro exato do veículo.
  - `iconRotate: ['coalesce', ['get', 'heading'], ['get', 'bearing'], 0]`: Leitura angular fluida.
  - `iconSize`: Interpolação de `0.08` (zoom 10) até `0.25` (zoom 18).

### 3.4 Marcador de Passageiro em Tempo Real (`PulsingUserDot`)
* Passado como componente nativo dentro de `<MapboxGL.UserLocation>`.
* **Motor de Animação**: Loop infinito de 1800ms executado no thread de UI nativo a 60 FPS (`useNativeDriver: true`).
* **Radar Expansivo**: Escala cresce de 1.0x para 2.8x enquanto a opacidade dissipa de 0.65 para 0.0.
* **Ponto Central**: Círculo grafite escuro com borda branca de 3px e sombra de elevação.

---

## 4. Motor de Despacho & Logística Territorial

### 4.1 Ondas Expansivas de Despacho (PostGIS)
O matching de motoristas parceiros opera em 3 ondas concêntricas:
1. **Onda 1**: Raio de **2.000 metros** (prioridade máxima).
2. **Onda 2**: Raio de **4.000 metros** (expansão aos 15 segundos).
3. **Onda 3**: Raio de **6.000 metros** (expansão aos 30 segundos).

### 4.2 Algoritmo de Ranking (`DispatchScore`)
Os motoristas dentro do raio são ordenados pela fórmula:
$$\text{Score} = (\text{Distância} \times 0.40) + (\text{ETA} \times 0.25) + (\text{Plano/Fidelidade} \times 0.15) + (\text{Avaliação} \times 0.20)$$

### 4.3 Geofencing & Prioridade Territorial de Franquias
- **Matriz Nacional:** Atua com cobertura irrestrita em todo o território nacional.
- **Franquias Regionais:** Possuem perímetro restrito às cidades licenciadas. Chamadas de fora do perímetro são bloqueadas com `FORA_DO_PERIMETRO`.
- **Direito de Expansão:** O Super Admin pode licenciar cidades vizinhas para uma franquia regional já estabelecida.

---

## 5. FinOps & Monetização SaaS (Taxa Zero 0%)

### 5.1 Regra Fundamental da Contabilidade
Nenhuma transação financeira pode ser criada sem balanceamento contábil rigoroso:
$$\sum \text{Débitos} \equiv \sum \text{Créditos}$$

### 5.2 Minor Units (Centavos Inteiros)
Todos os valores monetários no banco de dados e na memória do sistema são expressos em centavos inteiros (tipo `integer` ou `bigint`), eliminando imprecisões de arredondamento IEEE 754 de ponto flutuante:
* Exemplo: Uma corrida de **R$ 38,00** é processada estritamente como **`3800` centavos**.

### 5.3 Modelo SaaS com Repasse Líquido Integral
- **Corridas:** 100% repassado diretamente ao motorista (0% de comissão retida pela plataforma).
- **Assinaturas Periódicas:** Planos Diário, Semanal, Mensal, Trimestral e Anual com ativação via Pix dinâmico e webhook HMAC com idempotência estrita.
- **Isolamento de Contas:** Rendimentos de corridas nunca são debitados para pagamento compulsório de planos.

---

## 6. Segurança, Criptografia & RLS Multi-Tenant

* **Sanitização de Credenciais (P0):** Nenhuma credencial estática em scripts ou funções. Uso estrito de `process.env.DATABASE_URL`.
* **Row Level Security (RLS)**: Cada tabela do banco possui políticas ativas com cláusula `tenant_id`. Tentativas de acesso cross-tenant são bloqueadas pelo kernel do PostgreSQL.
* **Criptografia Assimétrica Ed25519 (RFC 8032)**:
  - Chaves privadas mantidas exclusivamente em variáveis de ambiente protegidas no servidor.
  - Validação de bilhetes de passagem em totens offline utilizando apenas a chave pública.
* **Assinatura HMAC-SHA256**:
  - Todos os webhooks de pagamento (Pix / Cartão) exigem cabeçalho de assinatura criptográfica.
  - Payloads com timestamp superior a 5 minutos são descartados para prevenir ataques de replay.

---

## 7. Qualidade de Software & Suíte de Testes (39 Suítes / 411 Testes)

O repositório inclui suíte automatizada de testes corporativos executada via `npm test` (`npx tsx test/run-all-tests.mjs`):

```text
================================================================================
📊 RESULTADO FINAL V6.0 ENTERPRISE: 411/411 TESTES PASSARAM (0 FALHAS)
================================================================================
📂 Suíte 1:  Domain State Machines & Guard Invariants
📂 Suíte 2:  Zero-Trust Multi-Tenancy & Adversarial RLS Guards
📂 Suíte 3:  Global Idempotency Engine (Anti-Duplication)
📂 Suíte 4:  FinOps Minor Units Precision & Balanced Ledger
📂 Suíte 5:  Transactional Outbox, Event Bus & DLQ
📂 Suíte 6:  SOS Critical Path State Machine & Priority Queue
📂 Suíte 7:  Circuit Breaker Fault Isolation Engine
📂 Suíte 8:  Cryptographic Key Lifecycle & Multi-Version Rotation
📂 Suíte 9:  Offline Queue Sequence Gaps & Hash Chain
📂 Suíte 10: Multi-Variable Telemetry & Anomaly Scoring Engine
📂 Suíte 11: Real In-Process Concurrency Benchmark (1,000 ops em 3ms, p95 < 0.003ms)
📂 Suíte 12: Authentic Ed25519 Cryptography (RFC 8032)
📂 Suíte 13: Financial Webhook HMAC-SHA256 Anti-Tamper & Anti-Replay
📂 Suíte 14: Strict Double-Entry Bookkeeping Ledger
📂 Suíte 15: Server-Side Ticket Issuance & Zero Private Key Client Leak
📂 Suíte 16: Atomic Seat Reservation & Concurrency Overbooking Preventor
📂 Suíte 17: Outbox Worker Engine, Exponential Backoff & DLQ Dispatch
📂 Suíte 18: SOS Security Hardening & Tenant Anti-Flood Guards
📂 Suíte 19: GPS Geographic Deadband & Database Write Throttle (34% suprimido)
📂 Suíte 20: Continuous GPS Engine & Resilient Background Telemetry
📂 Suíte 21: Cloud Ticket Persistence & Phone Identity Normalization
📂 Suíte 22: Broadcast Notifications & Multi-Category Routing Engine
📂 Suíte 23: Fare Pricing Engine & Ride Cost Estimation
📂 Suíte 24: Driver Acceptance Queue & Atomic Ride Claim
📂 Suíte 25 a 33: Frotas Corporativas & Módulos Logísticos
📂 Suíte 34: Monetização SaaS — Módulo 1: Catálogo de Planos & Trial Configurável
📂 Suíte 35: Monetização SaaS — Módulo 2: Ciclo de Cobrança PIX & Idempotência
📂 Suíte 36: Monetização SaaS — Módulo 3: Avaliação de Acesso & Controle de Vigência
📂 Suíte 37: Monetização SaaS — Módulo 4: Auditoria Administrativa & Cortesia
📂 Suíte 38: Monetização SaaS — Módulo 5: Métricas Financeiras Executivas
📂 Suíte 39: Geofencing & Prioridade Territorial de Franquias (Super Admin)
================================================================================
```
