# 01 - ESTADO ATUAL E VERIFICÁVEL DO PROJETO PARTIU

> **Metodologia de Inspeção:** Auditoria direta do código-fonte em `c:\Users\Suporte\Desktop\NOVO PARTIU-MOBE`, cobrindo dependências, rotas, serviços, banco de dados Supabase e testes unitários existentes.

---

### 1. Visão Geral da Arquitetura de Software
* **Camada Frontend:** Single Page Application (SPA) construída com **React 19.2.0**, **Vite 8.1.5**, **Tailwind CSS 4.2.1** e **TanStack Router 1.170.41** com roteamento determinístico baseado em arquivos (42 rotas compiladas em `src/routeTree.gen.ts`).
* **Gerenciamento de Estado e Cache:** TanStack Query v5 (`@tanstack/react-query`) associado a serviços em memória e máquinas de estado finitas por serviço.
* **Camada Geoespacial:** Mapbox GL JS 3.29.0 como motor cartográfico primário, abstraído pela fachada `MapProviderFactory` com adaptador secundário para Google Maps Platform (`GoogleMapsProvider`).
* **Backend e Persistência:** PostgreSQL 15 com extensão geoespacial **PostGIS**, Row Level Security (RLS) multi-tenant e Supabase Edge Functions no runtime Deno.
* **Comunicação em Tempo Real:** Supabase Realtime (Phoenix Channels / WebSockets) para atualização de posições de motoristas e status de corridas.

---

### 2. Status de Implementação das Funcionalidades Críticas

| Módulo / Funcionalidade | Situação Real no Código | Evidência em Arquivo / Teste | Avaliação Técnica |
| :--- | :--- | :--- | :--- |
| **Validação de CPF Único** | Implementada e validada | `DriverFleetService.ts` + `driver-cpf-unique-and-immutable-name.test.ts` | **Robusto:** Algoritmo Receita Federal e bloqueio de múltiplas contas por CPF. |
| **Nome Oficial Imutável** | Implementada e validada | Trava em `DriverFleetService.updateDriverProfile` | **Robusto:** Proíbe alteração posterior de nome para prevenir fraude de perfil. |
| **Abstração Multi-Mapas** | Implementada e validada | `MapProviderFactory.ts` + `map-provider-abstraction.test.ts` | **Robusto:** Resolve Mapbox vs. Google Maps por tenant ID com fallback seguro. |
| **Navegação Externa Waze** | Implementada e validada | `src/utils/navigation-launcher.ts` + `competitor-features-2026.test.ts` | **Robusto:** Gera deep link canônico `https://www.waze.com/ul?ll=...`. |
| **Taxímetro Virtual de Rua** | Implementada e validada | `VirtualTaximeterService.ts` + `competitor-features-2026.test.ts` | **Robusto:** Ciclo de vida completo com bandeirada, km, tempo e PIX. |
| **Duplo PIN para Entregas** | Implementada e validada | `DeliveryDualPinService.ts` + `partiu-delivery-dual-pin.test.ts` | **Robusto:** Geração de 4 dígitos cega para coleta e entrega com proteção anti-força bruta. |
| **Assistente de Voz (TTS)** | Implementada e validada | `DriverVoiceAssistantService.ts` + `competitor-features-2026.test.ts` | **Funcional:** Web Speech API para leitura de chamadas e instruções de bordo. |
| **Motor de Despacho (Score)** | Implementada e validada | `MatchingEngine.ts` + `partiu-dispatch-engine-v4.test.ts` | **Funcional:** Pondera 40% distância, 25% ETA, 15% plano, 10% aceite, 5% nota, 5% cancelamento. |
| **Despacho em Cascata** | Parcialmente implementada | `DispatchQueueBuilder.ts` | **Atenção:** Lógica de timer de 10s implementada, mas falha em testes quando mock de motoristas está vazio. |
| **Sincronismo em Tempo Real** | Parcialmente implementada | `RealtimeConnectionManager.ts` | **Gargalo:** 100% dependente de WebSockets; sem canal Push FCM nativo para acordar app móvel. |
| **Geofencing de Chegada** | Parcialmente implementada | `gps-geofence-navigation.test.ts` | **Gargalo:** Geofence é calculado em teste, mas a UI ainda exige confirmação manual do motorista. |
| **Bifurcação de Cancelamento**| Interface sem lógica completa| `src/routes/app/passageiro.tsx` | **Gargalo:** Cancelamento direto sem cálculo de taxa de deslocamento ou no-show. |
| **Corridas Consecutivas** | Ausente | Nenhum arquivo ou teste encontrado | **Lacuna:** O motorista precisa encerrar a corrida atual para receber novo chamado. |
| **Gravação de Áudio (Jarvis)**| Ausente | Nenhum serviço de gravação encontrado | **Lacuna:** Apenas botão SOS 190 telefônico disponível. |

---

### 3. Diagnóstico do Modelo de Monetização Implementado
Ao analisar as migrações SQL e os arquivos TypeScript, comprovou-se que o PARTIU passou por uma evolução histórica:
1. **Fase Legada (Comissão):** Registros históricos mencionam comissão de 12% ou plano Driver Club Black a 9,9%.
2. **Fase Atual (Pure SaaS):** A migração `supabase/migrations/20261007_partiu_pure_saas_subscription_zero_take_rate.sql` consolidou no PostgreSQL uma trigger (`trg_rides_zero_commission`) que zera a taxa de intermediação (`platform_fee := 0.00`) e repassa 100% do valor da corrida ao motorista (`driver_net_share := total_fare`).
3. **Fonte de Receita Atual:** O motorista paga pelo direito de uso da plataforma através de planos de acesso via PIX (Diária, Semanal ou Mensal), gerenciados pelo `PixBillingService` e pelo serviço `DriverWalletEngine` com trava automática de débito (`Debt Cutoff Guard` aos R$ 50,00).
