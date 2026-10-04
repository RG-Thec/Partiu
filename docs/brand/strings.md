Contract: brand-contract v1

# Interface strings

Registro de decisões textuais da interface reconciliadas com a voz do produto.

| Key | Text (primary) | Location | Scenario | Status |
|---|---|---|---|---|
| nav.back | Voltar | src/routes/app.sos.tsx:85 | SCN-003 | agreed |
| action.sos.trigger | SOS | src/routes/app.sos.tsx:125 | SCN-003 | agreed |
| action.driver.call | Ligação | src/routes/app.motorista.tsx:1822 | SCN-002 | agreed |
| action.driver.pix_regularize | Regularizar chave pix | src/routes/app.motorista.tsx:1682 | SCN-004 | agreed |
| action.driver.dismiss_alert | Dispensar alerta de elegibilidade | src/routes/app.motorista.tsx:1697 | SCN-002 | agreed |
| action.auth.logout | Sair da conta | src/routes/app.perfil.tsx:498 | SCN-007 | agreed |
| feedback.activity.retry | Tentar novamente | src/routes/app.bilhetes.tsx:179 | SCN-007 | agreed |
| action.ride.request | Pedir corrida | src/components/landing/LandingHero.tsx:132 | SCN-001 | agreed |
| action.driver.join | Dirigir com o Partiu | src/components/landing/LandingHero.tsx:132 | SCN-002 | agreed |
| action.auth.google | Continuar com o Google | src/components/auth/PartiuAppAuthGate.tsx:635 | SCN-006 | agreed |
| action.ride.search_prompt | Para onde vamos? | src/components/home/DestinationCard.tsx:145 | SCN-001 | agreed |

## Columns

- **Key** — estável, separada por pontos, nomeia a intenção da ação.
- **Text (primary)** — string canônica no idioma primário (pt-BR).
- **Location** — arquivo e linha (`file:line`) no código-fonte.
- **Scenario** — o `SCN-NNN` que governa este comportamento.
- **Status** — `agreed` (aprovado), `proposed`, `drifted` ou `orphan`.
