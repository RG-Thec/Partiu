# 10 - PLANO DE TESTES, CRITÉRIOS DE ACEITAÇÃO E MÉTRICAS DE SUCESSO

> **Governança por Indicadores:** 20 Métricas de Sucesso (KPIs) essenciais para a operação do PARTIU e matriz de testes de homologação.

---

### 1. Catálogo de 20 Métricas de Sucesso Operacional e Financeiro

| # | Indicador (KPI) | Definição / Fórmula | Fonte de Dados | Status no PARTIU |
| :- | :--- | :--- | :--- | :--- |
| **1** | **Taxa de Atendimento de Corridas** | $\frac{\text{Corridas Aceitas}}{\text{Corridas Solicitadas}} \times 100$ | Tabela `rides` | Disponível no banco |
| **2** | **Tempo Médio de Despacho (TTA)** | Média de $(\text{accepted\_at} - \text{created\_at})$ em segundos | Tabela `rides` | Disponível no banco |
| **3** | **Tempo Estimado vs Real de Coleta** | Média de $(\text{arrived\_at} - \text{accepted\_at}) - \text{eta\_seconds}$ | Telemetria / `rides` | Parcial (requer `arrived_at`) |
| **4** | **Taxa de Aceite dos Motoristas** | $\frac{\text{Ofertas Aceitas}}{\text{Ofertas Despachadas}} \times 100$ | `DispatchQueueBuilder` | Implementado em memória |
| **5** | **Taxa de Cancelamento Pré-Embarque** | $\frac{\text{Canceladas antes do embarque}}{\text{Total de Aceites}} \times 100$ | Tabela `rides` | Disponível no banco |
| **6** | **Taxa de Cancelamento em Rota (No-Show)**| $\frac{\text{Canceladas após chegada no ponto}}{\text{Total de Chegadas}} \times 100$ | Tabela `rides` | Requer geofence |
| **7** | **Taxa de Conclusão da Viagem** | $\frac{\text{Viagens Concluídas}}{\text{Viagens Iniciadas}} \times 100$ | Tabela `rides` | Disponível no banco |
| **8** | **Corridas por Motorista Ativo / Dia** | $\frac{\text{Total de Corridas Concluídas}}{\text{Motoristas Únicos Online}}$ | RPCs de relatório | Disponível no banco |
| **9** | **Tempo Ocioso Entre Viagens** | Tempo online sem corrida atribuída (minutos) | Telemetria | Requer consolidação |
| **10**| **Retenção Semanal de Motoristas** | % de motoristas que pagam o plano semana a semana | `PixBillingService` | Disponível no banco |
| **11**| **Retenção Mensal de Passageiros** | % de passageiros que realizam $\ge 2$ corridas no mês | Tabela `rides` | Disponível no banco |
| **12**| **Receita Média por Motorista (ARPU)** | $\frac{\text{Total Receita SaaS}}{\text{Total Motoristas Ativos}}$ | `monetization_plans` | Disponível no banco |
| **13**| **Receita Recorrente Mensal (MRR)** | $\sum \text{Mensalidades} + (\sum \text{Semanais} \times 4) + (\sum \text{Diárias} \times 20)$ | Painel Admin | Implementado na Suíte 38 |
| **14**| **Conversão de Trial em Pagante** | $\frac{\text{Primeira Diária/Mensalidade Paga}}{\text{Total de Cadastros Trial}} \times 100$ | `driver_subscriptions` | Disponível no banco |
| **15**| **Inadimplência de Diárias** | % de motoristas bloqueados pela trava de débito (R$ 50) | `DriverWalletEngine` | Implementado e testado |
| **16**| **Custo de Mapas por Corrida** | $\frac{\text{Fatura Mensal Mapbox}}{\text{Total de Corridas Orçadas}}$ | FinOps / Fatura | Métrica externa |
| **17**| **Margem de Contribuição Líquida** | $\frac{\text{Receita Líquida SaaS}}{\text{Receita Bruta SaaS}} \times 100$ | FinOps | Métrica gerencial |
| **18**| **Incidentes de Desconexão 4G** | Número de quedas de canal WebSocket registradas por hora | `RealtimeConnectionManager` | Implementado em teste |
| **19**| **Erros de Transição de Estado** | Tentativas de transições ilegais bloqueadas | FSM / RPCs | Monitorado em logs |
| **20**| **Aderência ao Waze** | % de motoristas que acionam o deep link do Waze | `navigation-launcher` | Requer evento analítico |

---

### 2. Matriz de Testes de Homologação para Novas Implementações
* **TC-SINC-01 (Falha de WebSocket):** Desconectar socket durante corrida ativa -> Garantir que o polling de 3s assuma a atualização sem perda de estado.
* **TC-GEO-01 (Geofencing de Chegada):** Injetar coordenadas a 100m do ponto de coleta -> Transitar estado automaticamente para `ARRIVED` e disparar som no passageiro.
* **TC-REASSIGN-01 (Cancelamento em Rota):** Motorista cancela em `EN_ROUTE` -> Reatribuir corrida para o segundo motorista da fila sem resetar o passageiro.
* **TC-FEE-01 (Bifurcação de Taxa):** Passageiro cancela com 60s -> Taxa R$ 0,00. Passageiro cancela após 4 minutos ou no-show -> Taxa de R$ 6,00 lançada no banco.
