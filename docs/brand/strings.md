Contract: brand-contract v1

# Interface strings

Registro de decisões textuais da interface reconciliadas com a voz do produto.

| Key                               | Text (primary)                     | Location                                                     | Scenario | Status |
| --------------------------------- | ---------------------------------- | ------------------------------------------------------------ | -------- | ------ |
| nav.back                          | Voltar                             | src/routes/app.sos.tsx:92                                    | SCN-003  | agreed |
| action.sos.trigger                | SOS                                | src/routes/app.sos.tsx:125                                   | SCN-003  | agreed |
| action.auth.logout                | Sair da conta                      | src/routes/app.perfil.tsx:622                                | SCN-007  | agreed |
| feedback.activity.retry           | Tentar novamente                   | src/routes/app.bilhetes.tsx:257                              | SCN-007  | agreed |
| action.ride.request               | Pedir corrida                      | src/components/landing/LandingHero.tsx:369                   | SCN-001  | agreed |
| action.driver.join                | Dirigir com o PARTIU               | src/components/landing/LandingHero.tsx:369                   | SCN-002  | agreed |
| action.ride.search_prompt         | Para onde vamos?                   | src/components/home/DestinationCard.tsx:115                  | SCN-001  | agreed |
| action.ride.search_prompt_today   | Para onde vamos hoje?              | src/components/home/DestinationCard.tsx:121                  | SCN-001  | agreed |
| action.reason.start_now           | Começar agora                      | src/components/landing/LandingReasonSection.tsx:154          | SCN-001  | agreed |
| action.surge.apply_override       | Aplicar sobretaxa imediata         | src/routes/app.admin.despacho.tsx:1336                       | SCN-009  | agreed |
| action.surge.disable_override     | Desativar sobretaxa agora          | src/routes/app.admin.despacho.tsx:1327                       | SCN-009  | agreed |
| action.surge.toggle_auto          | Tarifa automática ativa            | src/routes/app.admin.despacho.tsx:1229                       | SCN-009  | agreed |
| action.surge.toggle_auto_off      | Tarifa automática desativada       | src/routes/app.admin.despacho.tsx:1229                       | SCN-009  | agreed |
| action.whitelabel.plan_active     | Ativar                             | src/components/admin/whitelabel/MonetizationTab.tsx:247      | SCN-010  | agreed |
| action.whitelabel.plan_deactivate | Desativar                          | src/components/admin/whitelabel/MonetizationTab.tsx:247      | SCN-010  | agreed |
| action.tenant.view_cards          | Cards                              | src/routes/app.admin.franqueados.tsx:707                     | SCN-011  | agreed |
| action.tenant.view_table          | Tabela                             | src/routes/app.admin.franqueados.tsx:720                     | SCN-011  | agreed |
| action.tenant.toggle_details      | Detalhes & links                   | src/routes/app.admin.franqueados.tsx:892                     | SCN-011  | agreed |
| action.tenant.copy_access         | Copiar acesso                      | src/routes/app.admin.franqueados.tsx:878                     | SCN-011  | agreed |
| action.whitelabel.edit_tenant     | Personalizar white label           | src/routes/app.admin.franqueados.tsx:1111                    | SCN-010  | agreed |
| whitelabel.test_app               | Testar app                         | src/routes/app.admin.whitelabel.tsx:265                      | SCN-010  | agreed |
| action.auth.confirm_signup        | Criar minha conta                  | src/routes/cadastro-passageiro.tsx:423                       | SCN-005  | agreed |
| action.auth.go_to_login           | Entrar                             | src/routes/cadastro-passageiro.tsx:435                       | SCN-005  | agreed |
| feedback.territory.outside        | Fora da área de atendimento        | src/components/passenger/route-sheet/RouteSheetFooter.tsx:124 | SCN-012  | agreed |
| feedback.auth.territory_blocked   | Cadastro indisponível nesta região | src/components/auth/PartiuAppAuthGate.tsx:1208               | SCN-012  | agreed |

## Columns

- **Key** — estável, separada por pontos, nomeia a intenção da ação.
- **Text (primary)** — string canônica no idioma primário (pt-BR).
- **Location** — arquivo e linha (`file:line`) no código-fonte.
- **Scenario** — o `SCN-NNN` que governa este comportamento.
- **Status** — `agreed` (aprovado), `proposed`, `drifted` ou `orphan`.
