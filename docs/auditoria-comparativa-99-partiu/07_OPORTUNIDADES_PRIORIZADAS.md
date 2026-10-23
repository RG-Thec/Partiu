# 07 - RANKING DE OPORTUNIDADES PRIORIZADAS (SCORECARD ESTRATÉGICO)

> **Metodologia de Pontuação Algorítmica:**  
> $$\text{Score Final} = (V_{\text{exp}} \times 0.25) + (A_{\text{prop}} \times 0.20) + (I_{\text{econ}} \times 0.20) + (R_{\text{risco}} \times 0.15) + (V_{\text{tec}} \times 0.10) + (Q_{\text{evid}} \times 0.10)$$
> *Todas as notas são atribuídas de 0 a 100 conforme evidências verificáveis.*

---

### 1. Tabela Geral de Oportunidades Ranqueadas

| Rank | Oportunidade / Funcionalidade | Exp (25%) | Ader (20%) | Econ (20%) | Risco (15%) | Viab (10%) | Evid (10%) | Score Final | Nível de Prioridade |
| :-: | :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| **1º** | **Redundância de Sincronismo (Push FCM + Polling Adaptativo)** | 95 | 100 | 90 | 95 | 80 | 100 | **93.75** | **P0 — Crítico** |
| **2º** | **Saneamento e Unificação dos Catálogos de Monetização** | 80 | 100 | 100 | 95 | 95 | 100 | **93.75** | **P0 — Crítico** |
| **3º** | **Geofencing de Chegada + Tolerância de Espera (No-Show)** | 90 | 95 | 85 | 85 | 90 | 95 | **89.75** | **P1 — Alta Prioridade** |
| **4º** | **Reatribuição Transparente por Cancelamento do Condutor** | 95 | 95 | 80 | 85 | 85 | 90 | **89.00** | **P1 — Alta Prioridade** |
| **5º** | **Bifurcação Justa da Taxa de Cancelamento (Grace Period)** | 85 | 95 | 90 | 80 | 85 | 95 | **88.25** | **P1 — Alta Prioridade** |
| **6º** | **Corridas Consecutivas para Condutores (*Back-to-Back*)** | 85 | 90 | 95 | 75 | 70 | 85 | **85.00** | **P2 — Intermediária** |
| **7º** | **Suavização de Rotação Cartográfica (LERP 60fps na UI)** | 90 | 95 | 60 | 70 | 90 | 95 | **83.50** | **P2 — Intermediária** |
| **8º** | **Módulo PARTIU Prime para Passageiros (Clube Fidelidade)**| 75 | 85 | 90 | 70 | 85 | 80 | **80.75** | **P2 — Intermediária** |
| **9º** | **Gravação de Áudio de Segurança Durante a Corrida** | 90 | 90 | 60 | 75 | 70 | 95 | **80.25** | **P3 — Futuro** |
| **10º**| **Suporte Estruturado a Múltiplas Paradas (Waypoints)** | 80 | 85 | 75 | 70 | 75 | 90 | **79.00** | **P3 — Futuro** |
| **--** | **99 Negocia / Leilão de Preços (Barganha em Tempo Real)** | 20 | 0 | 30 | 10 | 60 | 95 | **26.50** | **DESCARTADA (Anti-Visão)** |

---

### 2. Justificativa das 5 Primeiras Oportunidades

1. **Redundância de Sincronismo (Push FCM + Polling Adaptativo) — Score 93.75 (P0):**  
   * *Problema:* Depender exclusivamente de WebSockets do Supabase causa perda de corridas quando aparelhos móveis entram em modo de economia de bateria.
   * *Solução:* Despacho com envio de Push FCM silencioso prioritário + reconciliação HTTP automática a cada 3s caso o push demore.
2. **Saneamento dos Catálogos de Monetização — Score 93.75 (P0):**  
   * *Problema:* Divergência entre 4 tabelas de preços nos arquivos TypeScript pode gerar cobranças incorretas no gateway PIX.
   * *Solução:* Fixar a tabela `monetization_plans` do banco como fonte canônica única.
3. **Geofencing de Chegada + No-Show — Score 89.75 (P1):**  
   * *Problema:* O motorista precisa avisar manualmente que chegou, gerando discussões de tempo de espera.
   * *Solução:* Chegada automática aos 150m + aviso sonoro no passageiro + cronômetro de 5 min para liberação de taxa de cancelamento.
4. **Reatribuição Transparente por Cancelamento do Condutor — Score 89.00 (P1):**  
   * *Problema:* Se o motorista cancela a caminho, a corrida do passageiro é encerrada bruscamente.
   * *Solução:* Reatribuição silenciosa para o próximo parceiro mais próximo sem perda de contexto.
5. **Bifurcação da Taxa de Cancelamento — Score 88.25 (P1):**  
   * *Problema:* Falta de remuneração ao motorista que gasta combustível para buscar passageiro que cancela na porta.
   * *Solução:* Cancelamento grátis até 2 min; cancelamento cobrado após deslocamento ou no-show.
