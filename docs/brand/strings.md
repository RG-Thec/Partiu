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
| action.ride.search_prompt_today | Para onde vamos hoje? | src/components/home/DestinationCard.tsx:148 | SCN-001 | agreed |
| action.hero.pedir_agora | Pedir | src/components/landing/LandingHero.tsx:490 | SCN-001 | agreed |
| action.reason.start_now | Começar agora | src/components/landing/LandingReasonSection.tsx:135 | SCN-001 | agreed |
| action.surge.apply_override | Aplicar Sobretaxa Imediata | src/routes/app.admin.despacho.tsx:750 | SCN-009 | agreed |
| action.surge.disable_override | Desativar Sobretaxa Agora | src/routes/app.admin.despacho.tsx:740 | SCN-009 | agreed |
| action.surge.toggle_auto | Tarifa Automática Ativa | src/routes/app.admin.despacho.tsx:750 | SCN-009 | agreed |
| action.surge.toggle_auto_off | Tarifa Automática Desativada | src/routes/app.admin.despacho.tsx:750 | SCN-009 | agreed |
| whitelabel.regional_panel | Painel de Governança Regional Franqueado | src/routes/app.admin.whitelabel.tsx:372 | SCN-010 | agreed |
| whitelabel.copy_app_link | Link do App | src/routes/app.admin.whitelabel.tsx:204 | SCN-010 | agreed |
| action.whitelabel.plan_active | Ativar | src/components/admin/whitelabel/MonetizationTab.tsx:265 | SCN-010 | agreed |
| action.whitelabel.plan_deactivate | Desativar | src/components/admin/whitelabel/MonetizationTab.tsx:265 | SCN-010 | agreed |
| action.tenant.view_cards | Cards | src/routes/app.admin.franqueados.tsx:320 | SCN-011 | agreed |
| action.tenant.view_table | Tabela | src/routes/app.admin.franqueados.tsx:328 | SCN-011 | agreed |
| action.tenant.toggle_details | Detalhes & Links | src/routes/app.admin.franqueados.tsx:430 | SCN-011 | agreed |
| action.tenant.copy_access | Copiar Acesso | src/routes/app.admin.franqueados.tsx:420 | SCN-011 | agreed |
| action.whitelabel.edit_tenant | Personalizar White Label | src/routes/app.admin.franqueados.tsx:640 | SCN-010 | agreed |
| whitelabel.test_passenger | Testar App Passageiro | src/routes/app.admin.whitelabel.tsx:180 | SCN-010 | agreed |
| whitelabel.test_driver | Testar App Motorista | src/routes/app.admin.whitelabel.tsx:188 | SCN-010 | agreed |
| action.auth.confirm_signup | CONFIRMAR CRIAÇÃO DE CONTA | src/routes/cadastro-passageiro.tsx:406 | SCN-005 | agreed |
| action.auth.go_to_login | Ir para o login | src/routes/cadastro-passageiro.tsx:420 | SCN-005 | agreed |

## Columns

- **Key** — estável, separada por pontos, nomeia a intenção da ação.
- **Text (primary)** — string canônica no idioma primário (pt-BR).
- **Location** — arquivo e linha (`file:line`) no código-fonte.
- **Scenario** — o `SCN-NNN` que governa este comportamento.
- **Status** — `agreed` (aprovado), `proposed`, `drifted` ou `orphan`.
