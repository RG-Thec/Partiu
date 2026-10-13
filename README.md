# 🚗 PARTIU — Mobilidade Urbana (Enterprise V6.0)

> Plataforma corporativa de mobilidade urbana multicategoria (Carro Particular, Moto-Táxi, Entregas Expressas/Flash e Transporte Complementar) com renderização cartográfica de alta performance (Mapbox GL 3D / React Native), despacho geográfico via PostGIS, monetização SaaS com Taxa Zero por corrida (0% Take Rate), governança territorial de franquias, ledger financeiro de partidas dobradas e arquitetura Zero-Trust.

---

## 📋 Sumário
1. [Visão Geral e Arquitetura](#-visão-geral-e-arquitetura)
2. [Stack Tecnológica](#-stack-tecnológica)
3. [Modelo de Monetização SaaS (Taxa Zero 0%)](#-modelo-de-monetização-saas-taxa-zero-0)
4. [Geofencing & Prioridade Territorial de Franquias](#-geofencing--prioridade-territorial-de-franquias)
5. [Motor Cartográfico & Mapbox 3D (Padrão Uber/99)](#-motor-cartográfico--mapbox-3d-padrão-uber99)
6. [Módulos e Recursos do Sistema](#-módulos-e-recursos-do-sistema)
7. [Segurança, RLS & Auditoria Criptográfica](#-segurança-rls--auditoria-criptográfica)
8. [FinOps & Ledger de Partidas Dobradas](#-finops--ledger-de-partidas-dobradas)
9. [Suíte de Testes, Benchmarks & Concorrência](#-suíte-de-testes-benchmarks--concorrência)
10. [Como Executar e Fazer Deploy](#-como-executar-e-fazer-deploy)

---

## 🏛️ Visão Geral e Arquitetura

O **PARTIU** foi construído sob os princípios de **Clean Architecture**, **Domain-Driven Design (DDD)** e **Transactional Outbox/Inbox Pattern**, garantindo resiliência offline, isolamento multi-inquilino (*multi-tenant*), conformidade com as diretrizes *ByteByteGo 2025* e processamento em lote acelerado por GPU.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   EXPERIENCE LAYER (Web, PWA, Mobile)                  │
│     React 19 + TanStack Router + TanStack Start (SSR Nitro) + Tailwind  │
│                React Native Mobile (@rnmapbox/maps)                    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│                       APPLICATION & DOMAIN CORE                        │
│   MatchingEngine (PostGIS ST_DWithin) • SaaS DriverSubscriptionService │
│   Territorial Geofencing (Franquia Mãe vs Regional) • SOS 190          │
│   Continuous GPS & Snap to Route • En Route Experience • Chat Realtime │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│                    FINOPS & PERSISTÊNCIA RELACIONAL                     │
│    Double-Entry Ledger (Minor Units) • Pix Split • Webhook HMAC        │
│          Supabase (PostgreSQL 15+ & PostGIS) • RLS Zero-Trust          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Stack Tecnológica

* **Frontend Web/PWA & SSR**: React 19.2.0, Vite 8.1.5, TanStack Router (`@tanstack/react-router` 1.170), TanStack Start com motor SSR Nitro (`.vercel/output/nitro.json`), Tailwind CSS v4.2, Lucide React, Radix UI.
* **Mobile Runtime**: PWA Standalone com Service Worker, cache de rotas offline, Push Notifications, suporte a empacotamento Android/APK.
* **Motor Cartográfico**: Mapbox GL JS v3.29, `@types/mapbox-gl`, indexação espacial hexagonal Uber H3 (`h3-js`).
* **Backend as a Service & Edge**: Supabase (`@supabase/supabase-js` v2.112.4), PostgreSQL 15+ com extensão PostGIS, Edge Functions com fallback geodésico Haversine e RLS Zero-Trust.
* **Criptografia & Assinaturas**: Ed25519 (RFC 8032), HMAC-SHA256 para webhooks de pagamentos e transações financeiras.
* **Test Harness & Concorrência**: Runner assíncrono via TSX (`npm test`) — **411 testes corporativos distribuídos em 39 suítes** com 100% de sucesso.
* **Governança de Código & Qualidade**: Linters dedicados de UX (`python docs/ux/lint.py`) e Brand Voice (`python docs/brand/lint.py`), TypeScript em modo estrito integral (`npx tsc --noEmit`).

---

## 💳 Modelo de Monetização SaaS (Taxa Zero 0%)

Diferente de aplicativos convencionais que retêm 20% a 40% do valor de cada viagem, o **PARTIU opera com 0% de comissão por corrida**:
- **100% Líquido para o Condutor:** O motorista recebe o valor integral pago pelo passageiro diretamente (D+0).
- **Assinaturas Periódicas:** O acesso ao recebimento de corridas é monetizado via planos de assinatura (*Software as a Service*):
  - `plano_diario_24h`: Diária Express (R$ 12,00/dia)
  - `plano_semanal`: Semanal Flex (R$ 45,00/semana)
  - `plano_mensal_pro`: Mensal Pro (R$ 149,90/mês)
  - `plano_trimestral`: Trimestral Fidelidade (R$ 389,00/trimestre)
  - `plano_anual_vip`: Anual VIP Platinum (R$ 1.290,00/ano)
- **Trial & Carência Configuráveis:** Degustação de 3, 7 ou 30 dias para novos motoristas aprovados e carência com avisos não bloqueantes antes da suspensão.
- **Cobrança PIX com Idempotência:** Liquidações via webhook HMAC com idempotência de transação, evitando duplicidade de dias em retentativas.
- **Avaliação de Acesso em Tempo Real:** Motorista com pendência transita para `PAYMENT_PENDING`, desabilitando o botão "Ficar Online" e excluindo-o do radar PostGIS até a quitação.
- **Separação Contábil Estrita:** Saques e valores de corridas dos motoristas são isolados contavelmente e não sofrem dedução automática de mensalidades.

---

## 🗺️ Geofencing & Prioridade Territorial de Franquias

O ecossistema implementa governança territorial rigorosa entre a Matriz e as Franquias Regionais:

1. **Base Canônica de Municípios Brasileiros:**
   - Base de cidades com coordenadas geodésicas centrais e cálculo esférico Haversine.
2. **Matriz Nacional (Franquia Mãe):**
   - Cobertura irrestrita em todo o território nacional. Atua como fallback quando não há franquia regional licenciada na localidade.
3. **Franquias Regionais (Anti-Invasão de Perímetro):**
   - Uma franquia regional possui perímetro geográfico estritamente delimitado.
   - O `MatchingEngine` bloqueia chamadas originadas fora do perímetro autorizado (`FORA_DO_PERIMETRO`).
4. **Direito de Expansão Territorial (Licenciamento Super Admin):**
   - O Super Administrador pode licenciar cidades vizinhas para uma franquia regional já existente, expandindo formalmente o raio operacional da praça.

---

## 🗺️ Motor Cartográfico & Mapbox 3D (Padrão Uber/99)

A camada cartográfica do **PARTIU** segue o padrão visual e de performance das principais referências globais de mobilidade:

### 1. Estilo Monocromático Ultra-Minimalista
* **Base Map**: `mapbox://styles/mapbox/light-v11` (tons suaves de cinza claro, branco e gelo).
* **Supressão Ativa de POIs**: Eliminação em tempo de execução de pontos de interesse comercial (`poi-label`), transporte coletivo (`transit-label`) e divisões administrativas (`settlement-subdivision-label`).
* **Prédios 3D Sutis**: Extrusão volumétrica (`FillExtrusionLayer`) em cinza gelo (`#E2E8F0`) com opacidade 0.3 a partir do zoom 15.

### 2. Linha de Rota (Polyline de Alto Contraste)
* **Linha Principal**: Preto profundo (`#1A1A1A`), largura `4.8px`, com terminações e curvas arredondadas (`lineCap: 'round'`, `lineJoin: 'round'`).
* **Casing Inferior**: Borda branca sólida (`#FFFFFF`), largura `7.5px`, garantindo separação visual absoluta contra o asfalto do mapa.

### 3. Frota 3D com Billboarding 2.5D
* **Carro (SUV Branco Crossover)**: Asset 3D verticalizado (350x438, recortado em 197x368), 100% canal alfa transparente, calibrado a 0° (Norte).
* **Moto (Piloto com Capacete e Scooter)**: Asset 3D desobstruído com remoção de fundo multissemente em raios de rodas e guidão.
* **Injeção GPU Instantânea**: Disponibilizados via Base64 Data URI (`car-premium-base64.ts` e `moto-premium-base64.ts`), eliminando latência de rede.
* **Escala Inteligente (`iconSize`)**: Interpolação proporcional ao nível de zoom (`zoom 10: 0.08` a `zoom 18: 0.25`).
* **Billboarding Viewport**: `iconPitchAlignment: 'viewport'` mantém o veículo volumétrico e sem distorção mesmo com inclinação de câmera a 60°.

### 4. Marcador do Passageiro (`PulsingUserDot`)
* **Substituição do marcador padrão do SO**: Passado como componente nativo fixado no GPS.
* **Pulso Contínuo**: Anel com expansão de escala (1.0x a 2.8x) e dissipação de opacidade (0.65 a 0.0) em loop de 1800ms.
* **Ponto Central Sólido**: Círculo escuro (`#0F172A`) envolto por borda branca de 3px e sombra de elevação.

---

## 🚀 Módulos e Recursos do Sistema

* **Despacho em Ondas Expansivas (PostGIS)**: Busca concêntrica de motoristas parceiros em raios de 2 km, 4 km e 6 km com `ST_DWithin`, ranqueados por fórmula algorítmica (`DispatchScore`).
* **En Route Experience**: Experiência do passageiro enquanto o motorista está a caminho, tolerância gratuita de 2 minutos para cancelamento, Bottom Sheet com smart camera padding (320px) e botão SOS 190.
* **Chat em Tempo Real**: Mensageria de baixa latência via Supabase Realtime, com proteção contra vazamento de PII (mascaramento de cartões e senhas), rate-limiting anti-flood e respostas rápidas.
* **Snap to Route & Deadband**: Telemetria do motorista filtrada contra ruído de GPS, projetando o veículo na via e suprimindo mais de 34% de escritas repetitivas no banco quando parado.

---

## 🔒 Segurança, RLS & Auditoria Criptográfica

* **Sanitização de Credenciais (P0 Saneado)**: Zero senhas hardcoded em código-fonte. Todas as conexões administrativas utilizam `process.env.DATABASE_URL` seguro.
* **Row Level Security (RLS)**: Isolamento criptográfico e lógico rigoroso entre franquias (*multi-tenant*). Nenhuma transação ou leitura vaza dados entre tenants diferentes.
* **Criptografia Ed25519 (RFC 8032)**: Assinatura digital assimétrica para validação e emissão offline de bilhetes de transporte.
* **Webhooks Protegidos com HMAC-SHA256**: Validação contra ataques de repetição (*replay*) e adulteração de payloads financeiros com tolerância máxima de 5 minutos.
* **Idempotency Engine**: Cabeçalho `Idempotency-Key` com hash chain que bloqueia cobranças ou despachos duplicados.
* **Circuit Breaker**: Isolamento automático de falhas em conexões externas com fallback gracioso.

---

## 💰 FinOps & Ledger de Partidas Dobradas

* **Livro-Razão Imutável**: Registro contábil com garantia matemática `SUM(Débitos) === SUM(Créditos)`.
* **Precisão em Centavos (Minor Units)**: Eliminação de erros de arredondamento float IEEE 754 operando estritamente com inteiros (ex: R$ 38,00 = 3800 centavos).
* **Split Automático Multi-Party**: Divisão instantânea de repasses de royalties de franquias e tecnologia.
* **Motor de Estorno Auditável**: Geração de lançamentos de reversão sem exclusão física de registros históricos.

---

## 🧪 Suíte de Testes, Benchmarks & Concorrência

O sistema conta com suíte de testes de ponta a ponta que valida contratos de domínio, segurança, monetização e concorrência:

```sh
# Executar suíte completa corporativa (39 suítes / 411 testes):
npm test

# Executar benchmark de despacho em tempo real:
npm run bench:dispatch

# Executar teste de carga com anti-overbooking concorrente:
npm run test:load

# Executar linters de governança de produto:
python docs/ux/lint.py
python docs/brand/lint.py
```

### Resultados Homologados:
```text
================================================================================
📊 RESULTADO FINAL V6.0 ENTERPRISE: 411/411 TESTES PASSARAM (0 FALHAS)
================================================================================
✅ 39 Suítes Corporativas Validadas (100% de Aprovação)
✅ Concorrência: 1.000 operações em 3ms com p95 < 0.003ms
✅ Anti-Overbooking: 500 requisições simultâneas disputando 15 vagas -> 15 aprovadas (p99 31.28ms)
✅ Despacho Concorrente: 50/50 corridas pareadas com latência média de 0.92ms (p99 7.21ms)
✅ Telemetria: 34% de escritas de GPS suprimidas com deadband sem perda de rastreabilidade
```

---

## 🚀 Como Executar e Fazer Deploy

### Pré-requisitos
* Node.js 20+ instalado
* NPM ou PNPM
* Python 3.12+ (para linters de governança `docs/ux` e `docs/brand`)

### Instalação e Execução Local
```sh
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev

# 3. Rodar suíte de testes corporativos
npm test
```
O aplicativo estará acessível em `http://localhost:8080/`.

### Deploy em Produção (Vercel / Nitro SSR)
O projeto possui suporte nativo para deploy serverless na **Vercel** via TanStack Start e Nitro:
1. Conecte o repositório GitHub na [Vercel](https://vercel.com).
2. Configure as Variáveis de Ambiente no painel do projeto:
   * `VITE_SUPABASE_URL`: URL do seu projeto Supabase
   * `VITE_SUPABASE_ANON_KEY`: Chave anônima pública do Supabase
   * `VITE_MAPBOX_TOKEN`: Token público do Mapbox
   * `DATABASE_URL`: String de conexão segura com o PostgreSQL
   * `NITRO_PRESET`: `vercel`
3. O build gera automaticamente a saída SSR em `.vercel/output/nitro.json` através de `npm run build`.
