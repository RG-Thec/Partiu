# 04 - OPORTUNIDADES PRIORIZADAS PARA MELHORAR O PARTIU MOTORISTA

A partir da auditoria estática e comportamental do `99 Motorista (1).apk`, identificamos as duas oportunidades mais valiosas para implementar no **Partiu Motorista**, com impacto direto no bem-estar, na agilidade operacional e na dignidade do motorista parceiro.

---

## Oportunidade 1: Troco Digital no Acerto em Dinheiro

### O Problema Urbano Real
No Brasil, é comum passageiros pagarem corridas de baixo valor (ex: R$ 18,00 a R$ 25,00) com notas de R$ 50,00 ou R$ 100,00. O motorista nem sempre dispõe de moedas ou notas miúdas no início ou fim do expediente. Isso gera atritos, perda de tempo tendo que parar em postos de gasolina ou comércios para trocar dinheiro, ou o motorista tendo que abrir mão de parte do seu ganho.

### Solução Inspirada no 99 Motorista
No modal de liquidação e acerto da corrida (`RidePaymentSettlementModal.tsx`):
1. Quando a corrida é em dinheiro, o condutor visualiza o campo: **"Valor em dinheiro recebido"**.
2. Ao digitar (ex: R$ 50,00), se o valor for superior ao total da corrida (ex: R$ 22,00), o app calcula automaticamente o troco (R$ 28,00).
3. O app exibe o botão destacado: **"Enviar Troco Digital de R$ 28,00"**.
4. O condutor confirma com retorno tátil. O troco entra diretamente como crédito na carteira do passageiro ou via chave Pix.
5. Zero atrito na calçada, sem perda de tempo e com 100% de transparência.

---

## Oportunidade 2: Bloqueio Permanente de Passageiro (Não Parear Novamente)

### O Problema Urbano Real
O motorista atende um passageiro que causou desconforto, bateu a porta com violência, exigiu paradas proibidas ou foi grosseiro. Não se trata necessariamente de um crime para acionar o SOS, mas o motorista tem o direito soberano de nunca mais ser obrigado a transportar aquela pessoa.

### Solução Inspirada no 99 Motorista
No modal de avaliação pós-viagem (`RideRatingModal.tsx`):
1. O motorista seleciona a pontuação de 1 a 5 estrelas.
2. Quando a nota for 1, 2 ou 3 estrelas (ou clicando no toggle avançado), surge a opção:
   > `[ ] Bloquear passageiro (Não quero mais receber chamadas deste usuário)`
3. Ao marcar e confirmar a avaliação, o `passengerId` é gravado na lista de bloqueios do condutor (`driver_blocked_passengers`).
4. O motor de despacho (`DispatchQueueBuilder.ts` e `ProgressiveDispatchEngine.ts`) ignora silenciosamente o motorista caso esse passageiro solicite novas corridas, **sem penalizar a taxa de aceitação** e sem custos adicionais.

---

## Roadmap de Execução Proposto

- **Onda 11 (Imediata):** Implementar **Troco Digital** no acerto de dinheiro e **Bloqueio de Passageiro no Desembarque** com trava no motor de despacho.
- **Onda 12 (Futura):** Gravação Sigilosa de Áudio Local na cabine durante `IN_PROGRESS` com expiração em 7 dias (padrão Jarvis).
