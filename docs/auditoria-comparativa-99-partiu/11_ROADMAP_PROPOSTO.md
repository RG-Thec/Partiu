# 11 - ROADMAP ESTRATÉGICO DE EVOLUÇÃO EM 4 ONDAS

> **Execução Planejada:** Sequenciamento de engenharia priorizando estabilidade operacional, justiça comercial e expansão de faturamento.

---

### Onda 1: Estabilização de Infraestrutura e Blindagem Operacional (P0)
* **Objetivo:** Acabar com quedas de corridas e inconsistências financeiras.
* **Entregas:**
  1. Implementação do canal híbrido Push FCM de alta prioridade associado a Polling adaptativo de contingência a cada 3s.
  2. Saneamento dos arquivos de catálogo, tornando a tabela `monetization_plans` a fonte canônica única de planos e eliminando referências legadas de comissão.
  3. Geofencing automático de chegada aos 150m do ponto de coleta com disparo de alerta no passageiro.
* **Critério de Conclusão:** Zero corridas perdidas por queda de sinal 4G em testes de estresse; catálogo unificado e validado por testes de integração.

---

### Onda 2: Retenção de Passageiros e Justiça para Motoristas (P1)
* **Objetivo:** Proteger a experiência do usuário e remunerar o tempo do condutor.
* **Entregas:**
  1. Reatribuição transparente de corrida quando o condutor cancelar durante o deslocamento de coleta (*On-Service Reassign*).
  2. Cronômetro de tolerância de espera (5 minutos) com liberação automática de taxa de cancelamento por não comparecimento (*No-Show*).
  3. Bifurcação formal da taxa de cancelamento (gratuita nos primeiros 2 minutos; cobrada após deslocamento relevante).
* **Critério de Conclusão:** Queda de pelo menos 40% nas perdas de passageiros por cancelamento de condutores; aumento da satisfação dos motoristas parceiros.

---

### Onda 3: Produtividade da Frota e Excelência Cartográfica (P2)
* **Objetivo:** Maximizar os ganhos dos motoristas e a fluidez da interface.
* **Entregas:**
  1. Despacho de Corridas Consecutivas (*Back-to-Back Dispatch*): envio de nova oportunidade nos últimos 2 km / 3 min da corrida atual.
  2. Polimento da interpolação contínua de orientação do veículo (*bearing smoothing*) na interface a 60 FPS com rotação realista do ícone do carro.
  3. Estruturação do programa PARTIU Prime para passageiros recorrentes.
* **Critério de Conclusão:** Redução comprovada do tempo ocioso entre viagens de 12 para menos de 4 minutos; rotação cartográfica fluida sem giros bruscos.

---

### Onda 4: Recursos Avançados de Segurança e Conveniência (P3)
* **Objetivo:** Criar barreira competitiva de segurança frente à concorrência.
* **Entregas:**
  1. Módulo Jarvis de gravação de áudio contínua em buffer local criptografado durante viagens críticas.
  2. Suporte estruturado e visual a múltiplas paradas intermediárias (Waypoints).
  3. Consolidação do dashboard analítico executivo para franqueados regionais.
