# 12 - DECISÕES ESTRATÉGICAS QUE EXIGEM APROVAÇÃO DO USUÁRIO

> **Ponto de Parada e Alinhamento:** Lista explícita das decisões de arquitetura e produto que dependem exclusivamente da sua autorização prévia antes de qualquer modificação de código.

---

### Lista de Decisões para Aprovação

1. **Aprovação do Modelo Comercial Definitivo: Pure SaaS (Taxa Zero)**
   * *Proposta:* Confirmar formalmente o modelo de Pure SaaS com 0% de comissão por corrida e cobrança de diária/semanal/mensal via PIX, aposentando definitivamente quaisquer menções legadas a 12% ou 9,9% de comissão.
   * *Sua Escolha:* [ ] Aprovar Pure SaaS Definitivo  |  [ ] Manter Modelo Híbrido com Comissão

2. **Aprovação do Rejeitamento do 99 Negocia (Leilão de Preços)**
   * *Proposta:* Rejeitar formalmente a implementação de leilão aberto de valores para cumprir o princípio de combate a tarifas predatórias do [vision.md](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/docs/ux/vision.md).
   * *Sua Escolha:* [ ] Aprovar Rejeição do Leilão  |  [ ] Desejo Implementar o Leilão

3. **Aprovação da Arquitetura Híbrida de Conexão (Push FCM + Polling)**
   * *Proposta:* Implementar envio de Push FCM silencioso prioritário na Edge Function `dispatch-ride` associado a Polling de contingência a cada 3s no cliente móvel.
   * *Sua Escolha:* [ ] Aprovar Arquitetura Híbrida  |  [ ] Manter Apenas WebSockets Supabase

4. **Definição dos Valores da Taxa de Cancelamento e No-Show**
   * *Proposta:* Fixar carência de 2 minutos gratuitos para o passageiro e taxa compensatória de R$ 6,00 (ou configurável por praça/franqueado) caso o passageiro cancele fora do prazo ou não compareça em 5 minutos.
   * *Sua Escolha:* [ ] Aprovar Regra de Cancelamento  |  [ ] Ajustar Regra / Valores

5. **Aprovação da Prioridade da Onda 1 para Início**
   * *Proposta:* Autorizar a execução das tarefas da **Onda 1** (Sincronismo Híbrido, Saneamento de Catálogos de Monetização e Geofence de Chegada).
   * *Sua Escolha:* [ ] Autorizar Início da Onda 1  |  [ ] Pausar para Novas Avaliações
