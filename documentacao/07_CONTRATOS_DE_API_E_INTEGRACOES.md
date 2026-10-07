# 07. Contratos de API e Interfaces de Integração

---

## 1. Padrões Gerais de Comunicação da API

A camada de integração do **PARTIU MOBE** é exposta através de **REST / JSON APIs**, **Edge Functions Serverless** e **RPCs PostgreSQL Atômicas**, complementadas por canais bidirecionais de alta velocidade via **Supabase Realtime WebSockets**.

### Cabeçalhos Padrão de Requisição (Headers)
| Cabeçalho | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `Authorization` | `string` | Sim (Rotas autenticadas) | Token JWT emitido pelo Supabase Auth: `Bearer <token>` |
| `apikey` | `string` | Sim | Chave pública anônima do Supabase (`SUPABASE_ANON_KEY`) |
| `Content-Type` | `string` | Sim | `application/json` |
| `Idempotency-Key` | `UUIDv4` | Sim (Operações financeiras/aceite) | Chave única para evitar dupla cobrança ou despacho duplicado |
| `X-Tenant-ID` | `UUIDv4` | Opcional | Identificador da franquia/praça para isolamento de dados |

---

## 2. Endpoints Core de Mobilidade e Corridas

### A. Solicitar Corrida (Passageiro)
- **Método / Rota:** `POST /api/rides/request`
- **Cabeçalhos:** `Authorization`, `Idempotency-Key`
- **Payload de Entrada (JSON):**
```json
{
  "tenant_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "category_id": "economico",
  "origin": {
    "address": "Av. Fernandes Lima, 1200 - Farol, Maceió - AL",
    "latitude": -9.649832,
    "longitude": -35.708945
  },
  "destination": {
    "address": "Rua Engenheiro Paulo Brandão Nogueira, 85 - Jatiúca, Maceió - AL",
    "latitude": -9.658210,
    "longitude": -35.698420
  },
  "payment_method": "direct_pix_driver"
}
```
- **Resposta de Sucesso (201 Created):**
```json
{
  "ride_id": "4a7f293b-18a2-4a02-b258-3691ac9e248b",
  "status": "REQUESTED",
  "fare_price_cents": 2850,
  "driver_net_cents": 2850,
  "platform_fee_cents": 0,
  "estimated_duration_seconds": 720,
  "estimated_distance_meters": 4350,
  "searching_wave": 1,
  "created_at": "2026-10-07T16:00:00Z"
}
```

---

### B. Aceitar Oferta de Corrida (Motorista - RPC Atômica)
- **Método / Rota:** `POST /rest/v1/rpc/rpc_driver_accept_ride`
- **Descrição:** Garante atomicidade em condições de alta concorrência com bloqueio exclusivo de linha.
- **Payload de Entrada (JSON):**
```json
{
  "p_ride_id": "4a7f293b-18a2-4a02-b258-3691ac9e248b",
  "p_driver_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "p_driver_lat": -9.650110,
  "p_driver_lng": -35.709210
}
```
- **Resposta de Sucesso (200 OK):**
```json
{
  "success": true,
  "ride_id": "4a7f293b-18a2-4a02-b258-3691ac9e248b",
  "status": "ACCEPTED",
  "passenger_name": "Carlos Silva",
  "passenger_rating": 4.95,
  "pickup_address": "Av. Fernandes Lima, 1200 - Farol"
}
```
- **Resposta de Conflito Concorrente (409 Conflict):**
```json
{
  "success": false,
  "code": "RIDE_ALREADY_ACCEPTED_BY_ANOTHER_DRIVER",
  "message": "Outro condutor foi mais rápido e assumiu esta chamada."
}
```

---

### C. Concluir Corrida (Finalização com Repasse 100%)
- **Método / Rota:** `POST /rest/v1/rpc/rpc_finish_ride_p0`
- **Payload de Entrada (JSON):**
```json
{
  "p_ride_id": "4a7f293b-18a2-4a02-b258-3691ac9e248b",
  "p_final_lat": -9.658210,
  "p_final_lng": -35.698420
}
```
- **Resposta de Sucesso (200 OK):**
```json
{
  "success": true,
  "status": "COMPLETED",
  "gross_fare_cents": 2850,
  "driver_earnings_cents": 2850,
  "platform_fee_cents": 0,
  "message": "Viagem concluída. 100% do valor retido pelo condutor com Taxa Zero."
}
```

---

## 3. Endpoints de Assinaturas e Monetização SaaS

### A. Consultar Status e Validade da Assinatura do Motorista
- **Método / Rota:** `GET /api/driver/status-assinatura`
- **Resposta de Sucesso (200 OK):**
```json
{
  "driver_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "status": "active",
  "is_eligible_for_dispatch": true,
  "current_plan": {
    "plan_code": "plano_mensal_pro",
    "name": "Mensal Pro",
    "price_cents": 14990,
    "commission_rate": 0.00
  },
  "expires_at": "2026-11-05T23:59:59Z",
  "days_remaining": 29,
  "courtesy_days": 0
}
```

---

### B. Gerar Cobrança Pix para Renovação de Assinatura
- **Método / Rota:** `POST /api/subscription/checkout-pix`
- **Payload de Entrada (JSON):**
```json
{
  "driver_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "plan_code": "plano_mensal_pro"
}
```
- **Resposta de Sucesso (200 OK):**
```json
{
  "invoice_id": "d3b07384-d113-4f44-8456-e9e9c5f874f6",
  "amount_cents": 14990,
  "expires_at": "2026-10-07T16:30:00Z",
  "pix_qr_code_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "pix_copy_paste": "00020101021226840014br.gov.bcb.pix2562pix.mercadopago.com/qr/d3b073845204000053039865406149.905802BR5925PARTIU MOBE TECNOLOGIA6009SAO PAULO62070503***6304ABCD"
}
```

---

### C. Webhook de Confirmação do Gateway Pix
- **Método / Rota:** `POST /api/webhooks/pix-subscription`
- **Cabeçalhos de Segurança:**
  - `X-Signature: <HMAC-SHA256 signature>`
  - `X-Request-Timestamp: 1791400000`
- **Payload de Exemplo (Mercado Pago / Asaas):**
```json
{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "id": "pay_98234710293",
    "status": "CONFIRMED",
    "value": 149.90,
    "externalReference": "d3b07384-d113-4f44-8456-e9e9c5f874f6",
    "paymentDate": "2026-10-07T16:05:12Z"
  }
}
```
- **Resposta da API:** Retorna imediatamente `200 OK {"received": true}` e dispara a ativação via background worker.

---

## 4. Canais Supabase Realtime (WebSockets)

A aplicação conecta-se aos seguintes canais pub/sub para sincronização de eventos:

| Canal WebSocket | Eventos Emitidos | Direção / Destinatários |
| :--- | :--- | :--- |
| `realtime:rides:${ride_id}` | `STATUS_CHANGED`, `LOCATION_UPDATED`, `CHAT_MESSAGE` | Passageiro $\leftrightarrow$ Motorista |
| `realtime:driver_offers:${driver_id}` | `NEW_OFFER`, `OFFER_EXPIRED`, `OFFER_CANCELLED` | Despacho PostGIS $\to$ Motorista |
| `realtime:subscription:${driver_id}` | `SUBSCRIPTION_ACTIVATED`, `ACCESS_UNBLOCKED` | Gateway Webhook $\to$ Motorista |
| `realtime:admin_fleet:${tenant_id}` | `DRIVER_ONLINE`, `DRIVER_OFFLINE`, `SOS_ALERT` | Telemetria $\to$ Painel Operador |
