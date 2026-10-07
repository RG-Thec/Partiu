# 10. Guia de Desenvolvimento, Testes, Deploy e Operação

---

## 1. Pré-Requisitos de Ambiente

Para executar, testar e contribuir com o projeto **PARTIU MOBE**, certifique-se de possuir instalado em sua estação de trabalho:

- **Node.js:** Versão 20.x LTS ou superior.
- **npm:** Versão 10.x ou superior.
- **Git:** Versão 2.40 ou superior.
- **Supabase CLI:** (Opcional, para testes locais de banco de dados).
- **Navegador Moderno:** Chrome, Edge ou Safari com suporte a WebGL e WebSockets.

---

## 2. Instalação e Execução Local

### A. Clonar o Repositório e Instalar Dependências
```bash
# 1. Clone o repositório
git clone https://github.com/partiu-mobe/plataforma.git
cd plataforma

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
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

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
# AMBIENTE & DOMÍNIO
# =============================================================================
VITE_APP_ENV=development
VITE_APP_URL=http://localhost:5173
```

### C. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
A aplicação estará disponível em `http://localhost:5173`.

---

## 3. Suíte de Testes Automatizados e Homologação Contínua

O projeto possui uma rigorosa suíte de testes de missão crítica inspirada em engenharia financeira e de mobilidade de larga escala.

```bash
# Executar a Suíte Completa Corporativa (315 testes automatizados):
npm test
```

### Cobertura da Suíte de Testes (`run-all-tests.mjs`):
1. **Domain State Machines:** Validação de transições estritas em Corridas, Bilhetes e Dispositivos.
2. **Zero-Trust Multi-Tenancy & RLS:** Testes adversariais garantindo isolamento total entre franquias.
3. **Global Idempotency Engine:** Prevenção de duplicidade em rajadas concorrentes de chamadas.
4. **FinOps Minor Units Ledger:** Balanço contábil exato de dupla entrada em centavos inteiros.
5. **Transactional Outbox & DLQ:** Garantia de entrega e resiliência de eventos.
6. **Criptografia Autêntica Ed25519 (RFC 8032):** Assinatura e verificação digital de bilhetes e tickets.
7. **HMAC-SHA256 Anti-Tamper:** Validação de integridade de webhooks contra ataques de injeção ou replay.
8. **Algoritmo de Despacho Concorrente (Race Condition):** Simulação de 100 requisições simultâneas disputando uma corrida — exatamente 1 vence e 99 são rejeitadas de forma elegante.
9. **Telemetria GPS com Deadband:** Otimização de I/O bloqueando escritas redundantes de veículos parados.
10. **Blindagem de Modelo de Negócio (Taxa Zero 0%):** Garantia de que nenhuma taxa percentual seja deduzida de corridas.

```bash
# Checagem Estática de Tipos TypeScript (Zero Erros):
npx tsc --noEmit
```

---

## 4. Banco de Dados e Aplicação de Migrations

Todas as migrações estruturais do banco de dados residem no diretório `/supabase/migrations/`:

```bash
# Aplicar todas as migrações no projeto remoto do Supabase:
npx supabase db push

# Ou via conexão direta com PostgreSQL (psql):
psql "$DATABASE_URL" -f supabase/migrations/20261007_partiu_pure_saas_subscription_zero_take_rate.sql
```

---

## 5. Build e Deploy em Produção

### A. Compilação do Frontend SPA
```bash
# Gerar build otimizado para produção:
npm run build
```
Os arquivos finais minificados e compactados serão gerados na pasta `/dist`.

### B. Plataformas de Hospedagem Recomendadas
- **Vercel / Netlify / Cloudflare Pages:**  
  Configurar comando de build como `npm run build` e diretório de saída como `dist`.  
  Configurar regra de reescrita SPA (`/* -> /index.html` com código 200).
- **Supabase Cloud:**  
  Hospeda o banco de dados PostgreSQL, WebSockets Realtime, autenticação e armazenamento de fotos/documentos.

---

## 6. Observabilidade, Resiliência e Plano de Contingência

### Metas de Confiabilidade (SLO / SLA)
- **Disponibilidade da API Core:** 99,95%
- **Tempo de Resposta de Despacho (p95):** $< 150 \text{ ms}$
- **Tempo de Ativação do Pix SaaS:** $< 2,5 \text{ segundos}$
- **RPO (Recovery Point Objective):** $< 5 \text{ minutos}$ (via PostgreSQL WAL / Point-in-Time Recovery)
- **RTO (Recovery Time Objective):** $< 30 \text{ minutos}$ em caso de falha catastrófica de datacenter

### Circuit Breakers e Degradação Graciosa
- Caso o serviço externo de mapas (Mapbox) sofra indisponibilidade momentânea, o sistema chaveia automaticamente para o motor de fallback **OSRM / OpenStreetMap** sem derrubar as solicitações de corridas.
- Caso o gateway primário Pix apresente instabilidade de rede, as requisições de checkout chaveiam dinamicamente para o gateway secundário configurado na Central de Monetização.
