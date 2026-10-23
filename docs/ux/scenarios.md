# UX Scenarios

<!-- Managed with super-ux (ux-contract v4). Update in the same change as any user-facing behavior change. -->

## Index

| ID      | Title                                                                                  | Feature                                      | Persona          | Traces                              | Status      | Last audit |
| ------- | -------------------------------------------------------------------------------------- | -------------------------------------------- | ---------------- | ----------------------------------- | ----------- | ---------- |
| SCN-001 | Solicitação de corrida com preço garantido                                             | Solicitação de Viagem                        | P-01             | ST-001, FLW-01 (JTBD-01, JRN-01/#1) | implemented | 2026-10-02 |
| SCN-002 | Aceite de corrida no cockpit do motorista                                              | Despacho de Corridas                         | P-02             | ST-002, FLW-02 (JTBD-02, JRN-02/#2) | implemented | 2026-10-02 |
| SCN-003 | Acompanhamento En Route e acionamento de SOS                                           | Segurança em Viagem                          | P-01             | ST-003, FLW-03 (JTBD-01, JRN-01/#4) | implemented | 2026-10-02 |
| SCN-004 | Liquidação financeira instantânea via Pix                                              | FinOps e Ledger                              | P-02             | ST-004, FLW-04 (JTBD-02, JRN-02/#5) | implemented | 2026-10-02 |
| SCN-005 | Onboarding e seleção de modalidade de cadastro                                         | Onboarding e Acesso                          | P-01             | ST-005, FLW-05 (JTBD-01, JRN-01/#1) | implemented | 2026-10-02 |
| SCN-006 | Resiliência offline e preservação de estado da corrida                                 | Resiliência e Rede                           | P-01             | ST-006, FLW-06 (JTBD-01, JRN-01/#3) | implemented | 2026-10-02 |
| SCN-007 | Consulta de histórico de viagens e envio de encomendas                                 | Atividade e Encomendas                       | P-01             | ST-007, FLW-07 (JTBD-01, JRN-01/#5) | implemented | 2026-10-02 |
| SCN-008 | Telemetria executiva e despacho operacional administrativo                             | Governança e Operação                        | P-03             | ST-008, FLW-08 (JTBD-03, JRN-01/#2) | implemented | 2026-10-02 |
| SCN-009 | Tarifa dinâmica automática de alta demanda e sobretaxa administrativa imediata         | Tarifa Dinâmica & Despacho                   | P-01, P-03       | ST-001, ST-008, FLW-01, FLW-08      | implemented | 2026-10-11 |
| SCN-010 | Governança White Label com segregação regional e sincronização em tempo real           | Identidade & White Label                     | P-03             | ST-008, FLW-08 (JTBD-03, JRN-01/#2) | implemented | 2026-10-12 |
| SCN-011 | Gestão Central de Franqueados e Multi-Tenant com Visualização Fluida e Ações Imediatas | Gestão Central de Franqueados & Multi-Tenant | P-03             | ST-008, FLW-08 (JTBD-03, JRN-01/#2) | implemented | 2026-10-12 |
| SCN-012 | Governança territorial e bloqueio de cadastros e corridas fora da região da franquia   | Delimitação Geográfica & Anti-Invasão        | P-01, P-02, P-03 | ST-005, ST-008, FLW-05, FLW-08      | implemented | 2026-10-16 |
| SCN-013 | Despacho consecutivo em cadeia e navegação externa com um toque no Cockpit             | Despacho em Cadeia & Navegação Externa       | P-02             | ST-009, ST-010, FLW-09              | implemented | 2026-10-20 |
| SCN-014 | Proteção contra GPS simulado e operação em modo de tolerância da diária SaaS          | Mock Location Shield & Tolerância SaaS       | P-02, P-03       | ST-011, ST-012, FLW-09              | implemented | 2026-10-20 |
| SCN-015 | Torre de controle com mapa de calor preditivo e disparo de incentivo operacional       | Demanda Preditiva & Torre de Controle        | P-03             | ST-013, FLW-10                      | implemented | 2026-10-20 |
| SCN-016 | Homologação cadastral expressa com OCR de CNH e CRM de reengajamento automático        | Homologação Expressa & CRM de Reengajamento  | P-03             | ST-014, ST-015, FLW-11              | implemented | 2026-10-20 |
| SCN-017 | Resiliência Zero-Drop e sincronização atômica offline com cadeia criptográfica        | Resiliência Zero-Drop Offline                | P-01, P-02       | ST-016, FLW-12                      | implemented | 2026-10-20 |
| SCN-018 | Zonas de exclusão pessoal e radar comunitário no cockpit                              | Sobrevivência Urbana & Radar Comunitário     | P-02             | ST-017, FLW-13                      | implemented | 2026-10-20 |
| SCN-019 | Rota de volta para casa com atalho de favoritos e Áudio HUD hands-free                | Eficiência no Cockpit & Áudio HUD            | P-02             | ST-018, ST-019, FLW-13              | implemented | 2026-10-20 |
| SCN-020 | Detecção automática de chegada via Geofence e tolerância de espera com No-Show        | Geofencing & Tolerância No-Show              | P-01, P-02       | ST-002, ST-004, FLW-02              | implemented | 2026-10-21 |
| SCN-021 | Reatribuição transparente de corrida por cancelamento do condutor em rota             | Reatribuição Transparente (On-Service)       | P-01, P-02       | ST-002, FLW-02                      | implemented | 2026-10-21 |
| SCN-022 | Bifurcação justa da taxa de cancelamento com tolerância de 2 minutos (Grace Period)   | Taxa de Cancelamento Justa                   | P-01, P-02       | ST-002, FLW-02                      | implemented | 2026-10-21 |
| SCN-023 | Despacho consecutivo preditivo em cadeia com handover atômico (Back-to-Back Dispatch)  | Despacho em Cadeia Preditivo                 | P-02             | ST-009, FLW-09                      | implemented | 2026-10-21 |
| SCN-024 | Deep linking universal para Waze, Google Maps e Apple Maps com resolução dinâmica     | Deep Linking de Navegação Externa            | P-02             | ST-010, FLW-09                      | implemented | 2026-10-21 |
| SCN-025 | Central de segurança pessoal unificada com gravação confidencial e ficha 190          | Central de Segurança Pessoal                 | P-01, P-02       | ST-003, FLW-03                      | implemented | 2026-10-21 |
| SCN-026 | Compressão vetorial de polylines via RDP e telemetria suave a 60 FPS no mapa           | Otimização Geométrica & 60 FPS Map           | P-01, P-02       | ST-001, ST-002, FLW-01, FLW-02      | implemented | 2026-10-21 |
| SCN-027 | Múltiplas paradas intermediárias com resolução dinâmica de navegação                   | Multi-Stop Waypoints                         | P-01, P-02       | ST-001, ST-002, FLW-01, FLW-02      | implemented | 2026-10-21 |
| SCN-028 | Pontos verdes inteligentes de encontro com snap de embarque                           | Smart Pickups & Green Snap                   | P-01, P-02       | ST-001, FLW-01                      | implemented | 2026-10-21 |
| SCN-029 | Homologação cadastral expressa com OCR de CNH e validação em tempo real                | Onboarding Express & OCR CNH                 | P-02, P-03       | ST-005, ST-008, FLW-05, FLW-11      | implemented | 2026-10-21 |
| SCN-030 | Chat de bordo hands-free com respostas rápidas de 1 toque e áudio TTS                  | Hands-Free Quick Replies                     | P-01, P-02       | ST-002, ST-003, FLW-02, FLW-03      | implemented | 2026-10-21 |
| SCN-031 | Código PIN de 4 dígitos para embarque seguro de passageiros                           | Boarding Security PIN                        | P-01, P-02       | ST-002, FLW-02                      | implemented | 2026-10-21 |
| SCN-032 | Solicitação de corrida para terceiros com link web ao vivo no WhatsApp                | Rides for Third Parties                      | P-01, P-02       | ST-001, ST-002, FLW-01, FLW-02      | implemented | 2026-10-21 |
| SCN-033 | Corridas agendadas com negociação bilateral e piso mínimo operacional                 | Corridas Agendadas                           | P-01, P-02       | ST-001, ST-002, FLW-01, FLW-02      | implemented | 2026-10-21 |
| SCN-034 | Troco digital no acerto em dinheiro e bloqueio soberano de passageiro                 | Acerto & Bloqueio Soberano                   | P-01, P-02       | ST-002, ST-004, FLW-02, FLW-04      | implemented | 2026-10-22 |
| SCN-035 | Alerta de aproximação de 500 metros no embarque e destino para motorista e passageiro | Alerta de Proximidade 500 Metros             | P-01, P-02       | ST-001, ST-002, FLW-01, FLW-02      | implemented | 2026-10-22 |

## Personas

Definidas e documentadas em `docs/ux/foundation.md`:

- P-01: Passageiro Urbano Cotidiano
- P-02: Motorista Parceiro Autônomo
- P-03: Gestor de Frota e Franqueado Regional

## Scenarios

## Solicitação de Viagem

### SCN-001: Solicitação de corrida com preço garantido

- **Persona:** P-01
- **Feature:** Solicitação de Viagem
- **Traces:** ST-001, FLW-01 (JTBD-01, JRN-01/#1)
- **Entry point:** Tela inicial do passageiro
- **Preconditions:** Passageiro autenticado com GPS ativo
- **Steps:**
  1. Passageiro digita o endereço de destino no campo de busca -> O sistema traça a rota ideal no mapa e exibe o tempo estimado de viagem.
  2. Passageiro seleciona a categoria de veículo -> O valor garantido fixado e o tempo de chegada do motorista mais próximo são calculados e exibidos.
  3. Passageiro toca em Confirmar Corrida -> O sistema entra em modo de busca e emite ondas concêntricas de despacho via PostGIS.
- **Expected result:** Chamada é despachada para motoristas parceiros em um raio de até 2 km e o passageiro visualiza a tela de busca animada com valor travado.
- **UI elements:** Campo de busca de destino, Seletor de categorias, Botão Confirmar Corrida, Mapa Mapbox GL, Bottom Sheet tarifário
- **States covered:** success, loading, empty, error
- **Errors & recovery:** Se nenhum condutor aceitar no raio inicial, o raio é expandido gradativamente até 6 km com mensagem transparente ao passageiro; se não houver condutores disponíveis, o sistema notifica e permite tentar novamente.
- **Telemetry:** ride_requested (category, est_fare_cents)
- **Status:** implemented
- **Coverage:** src/routes/app.index.tsx:1-200
- **Product:** unobserved

## Despacho de Corridas

### SCN-002: Aceite de corrida no cockpit do motorista

- **Persona:** P-02
- **Feature:** Despacho de Corridas
- **Traces:** ST-002, FLW-02 (JTBD-02, JRN-02/#2)
- **Entry point:** Cockpit operacional do motorista
- **Preconditions:** Motorista em modo online com telemetria GPS habilitada
- **Steps:**
  1. O sistema envia a oferta de viagem para o cockpit -> Um alerta sonoro discreto soa e o card de corrida surge na tela com contagem regressiva de 15 segundos.
  2. O motorista analisa a distância até o passageiro, bairro de destino e ganho líquido garantido -> As informações permanecem legíveis sem necessidade de rolagem.
  3. O motorista toca no botão Aceitar Corrida -> O cockpit transiciona para o modo de navegação com rota projetada até o ponto de embarque.
- **Expected result:** Corrida vinculada com exclusividade ao condutor e traçado do percurso até o passageiro exibido no mapa com rotação alinhada à via.
- **UI elements:** Card de oferta flutuante, Barra de tempo regressivo, Indicador de ganho líquido, Botão Aceitar Corrida, Botão Recusar
- **States covered:** success, error, loading
- **Errors & recovery:** Se o contador expirar antes do aceite, a chamada é redistribuída para o próximo condutor do ranking PostGIS sem punição ou penalidade arbitrária ao motorista.
- **Telemetry:** ride_accepted (ride_id, response_time_sec)
- **Status:** implemented
- **Coverage:** src/routes/app.motorista.tsx:1-200
- **Product:** unobserved

## Segurança em Viagem

### SCN-003: Acompanhamento En Route e acionamento de SOS

- **Persona:** P-01
- **Feature:** Segurança em Viagem
- **Traces:** ST-003, FLW-03 (JTBD-01, JRN-01/#4)
- **Entry point:** Tela de viagem em andamento
- **Preconditions:** Corrida iniciada pelo motorista com passageiro a bordo
- **Steps:**
  1. O veículo inicia o percurso até o destino -> O marcador cartográfico interpola suavemente a posição a 60 FPS com Snap to Route desobstruído.
  2. O passageiro toca no botão vermelho SOS 190 em situação de emergência -> Um modal de ação rápida surge com botão direto de ligação para a polícia militar e confirmação de transmissão contínua de rota.
  3. O passageiro confirma o acionamento de emergência -> O discador do celular abre com o número 190 e o servidor registra a ocorrência prioritária.
- **Expected result:** Central de operações recebe as coordenadas exatas da corrida em tempo real e o passageiro obtém socorro imediato.
- **UI elements:** Botão SOS flutuante, Modal de Confirmação de Emergência, Botão Discar 190, Botão Compartilhar Rota, Mapa com Snap to Route
- **States covered:** success, error
- **Errors & recovery:** Em caso de perda de conexão celular de dados, a discagem telefônica nativa 190 permanece funcional e as últimas coordenadas válidas ficam gravadas localmente para envio por SMS de contingência.
- **Telemetry:** sos_triggered (ride_id, user_role)
- **Status:** implemented
- **Coverage:** src/routes/app.sos.tsx:1-100
- **Product:** unobserved

## FinOps e Ledger

### SCN-004: Liquidação financeira instantânea via Pix

- **Persona:** P-02
- **Feature:** FinOps e Ledger
- **Traces:** ST-004, FLW-04 (JTBD-02, JRN-02/#5)
- **Entry point:** Cockpit operacional após finalização de corrida
- **Preconditions:** Corrida concluída com pagamento autorizado
- **Steps:**
  1. O motorista toca em Concluir Corrida ao chegar no destino -> O sistema calcula o valor final exato conforme a tarifa fixada previamente.
  2. O motor financeiro executa a conciliação de partidas dobradas com split -> A taxa de intermediação da plataforma é debitada e o valor líquido é creditado na conta do condutor via Pix.
  3. A interface apresenta o recibo completo e o extrato atualizado -> O saldo disponível reflete o novo ganho em menos de 10 segundos.
- **Expected result:** Transação contábil registrada com zero discrepância em minor units e comprovante digital com hash criptográfico emitido.
- **UI elements:** Card de Conclusão de Viagem, Extrato Financeiro, Indicador de Saldo Disponível, Comprovante de Pagamento Digital
- **States covered:** success, error, loading
- **Errors & recovery:** Em caso de oscilação momentânea do Pix no banco central, a transação entra na fila de reprocessamento com Idempotency-Key evitando cobranças duplicadas, enquanto o passageiro e condutor são informados do processamento em segundo plano.
- **Telemetry:** payment_settled (ride_id, gross_amount_cents, net_driver_cents)
- **Status:** implemented
- **Coverage:** src/routes/app.admin.financeiro.tsx:1-200
- **Product:** unobserved

## Onboarding e Acesso

### SCN-005: Onboarding e seleção de modalidade de cadastro

- **Persona:** P-01
- **Feature:** Onboarding e Acesso
- **Traces:** ST-005, FLW-05 (JTBD-01, JRN-01/#1)
- **Entry point:** Tela inicial pública ou rota de autenticação unificada
- **Preconditions:** Usuário iniciou o aplicativo ou acessou a tela de entrada
- **Steps:**
  1. O usuário visualiza a tela inicial e escolhe entre Entrar ou Criar Conta -> O sistema exibe o formulário de credenciais diretas por perfil com alternância fluida entre Passageiro e Motorista.
  2. No perfil Passageiro, o acesso é simplificado por telefone ou e-mail, com cadastro em fluxo contínuo e foto opcional; no perfil Motorista, o card assume a estética Dark Cockpit de alto contraste com login direto por credenciais e atalho evidente para credenciamento veicular em 3 etapas.
  3. O usuário preenche seus dados essenciais e submete o formulário -> A sessão é estabelecida no Supabase Auth com isolamento multi-tenant e o usuário é redirecionado imediatamente à sua estação de trabalho ou mapa.
- **Expected result:** Sessão de autenticação estabelecida em menos de 10 segundos para passageiros e entrada desobstruída no Cockpit para motoristas parceiros.
- **UI elements:** Botões de seleção de perfil, Formulário de login/cadastro, Input de telefone com máscara E.164, Botão Continuar, Card Dark Cockpit para Motorista, Atalho de cadastro veicular
- **States covered:** success, error, loading
- **Errors & recovery:** Em caso de telefone duplicado ou senha inválida, mensagens de validação claras são exibidas ao lado de cada campo sem apagar os dados preenchidos.
- **Telemetry:** user_signed_up (role, auth_provider)
- **Status:** implemented
- **Coverage:** src/routes/auth.tsx:1-50, src/components/auth/PartiuAppAuthGate.tsx:1-1546, src/routes/cadastro-passageiro.tsx:1-488
- **Product:** unobserved

## Resiliência e Rede

### SCN-006: Resiliência offline e preservação de estado da corrida

- **Persona:** P-01
- **Feature:** Resiliência e Rede
- **Traces:** ST-006, FLW-06 (JTBD-01, JRN-01/#3)
- **Entry point:** Qualquer tela com conexão ativa durante oscilação de conectividade
- **Preconditions:** Usuário em corrida ou busca ativa e conectividade de rede oscila para offline
- **Steps:**
  1. O sistema operacional detecta interrupção do tráfego de dados -> O banner de reconexão surge na base da tela sem obstruir cabeçalhos nem controles críticos.
  2. A interface armazena telemetria pendente e polling de estado na fila local -> A tela mantém o mapa visível e os dados da viagem intactos.
  3. A conectividade com a internet é restabelecida -> O banner transiciona para Reconectado e desaparece suavemente após 2 segundos, sincronizando os dados com o servidor.
- **Expected result:** Estado da viagem preservado sem recarregamento forçado da página e usuário informado com transparência.
- **UI elements:** Banner flutuante de reconexão, Indicador de sincronização em segundo plano, Alerta de offline
- **States covered:** success, error
- **Errors & recovery:** Se a conexão demorar mais de 30 segundos, o aplicativo ativa o modo contingência oferecendo atalho telefônico de suporte e discador de emergência.
- **Telemetry:** network_reconnected (offline_duration_ms, queued_events_count)
- **Status:** implemented
- **Coverage:** src/components/passenger/NetworkReconnectionBanner.tsx:1-96
- **Product:** unobserved

## Atividade e Encomendas

### SCN-007: Consulta de histórico de viagens e envio de encomendas

- **Persona:** P-01
- **Feature:** Atividade e Encomendas
- **Traces:** ST-007, FLW-07 (JTBD-01, JRN-01/#5)
- **Entry point:** Aba de Atividade no menu inferior do passageiro
- **Preconditions:** Passageiro autenticado com ou sem viagens anteriores
- **Steps:**
  1. O passageiro toca na aba Atividade no menu inferior -> O sistema consulta a lista de bilhetes e recibos de corridas no Supabase.
  2. O histórico é apresentado em cards cronológicos com data, motorista, trajeto e valor -> O passageiro pode filtrar ou tocar em uma viagem para abrir o comprovante detalhado.
  3. O passageiro alterna para a aba Encomendas quando deseja despacho expresso de pacotes -> Os campos de destinatário e dimensões são apresentados com cotação imediata.
- **Expected result:** Histórico de viagens renderizado com paginação ágil e comprovante discriminado disponível para exportação ou conferência.
- **UI elements:** Lista de corridas em cards, Botão de filtro, Modal de recibo detalhado, Formulário de envio de encomendas
- **States covered:** success, empty, error, loading
- **Errors & recovery:** Em caso de falha de conexão na listagem, o estado de erro exibe um botão explícito de tentar novamente em vez de falso estado vazio de viagens inexistentes.
- **Telemetry:** activity_history_viewed (items_count)
- **Status:** implemented
- **Coverage:** src/routes/app.bilhetes.tsx:1-150
- **Product:** unobserved

## Governança e Operação

### SCN-008: Telemetria executiva e despacho operacional administrativo

- **Persona:** P-03
- **Feature:** Governança e Operação
- **Traces:** ST-008, FLW-08 (JTBD-03, JRN-01/#2)
- **Entry point:** Rota administrativa /app/admin/despacho
- **Preconditions:** Gestor ou administrador logado com perfil de acesso autorizado
- **Steps:**
  1. O administrador acessa a central de despacho ao vivo -> O mapa exibe marcadores de motoristas online, em viagem e chamadas em fila de despacho.
  2. O gestor visualiza alertas de tempo de resposta e filtros por status ou região -> As métricas do cluster regional atualizam a cada 5 segundos via Supabase Realtime.
  3. O gestor pode intervir em chamadas retidas ou auditar a conformidade de credenciamentos de motoristas -> Ações operacionais são registradas com trilha de auditoria completa.
- **Expected result:** Painel operacional ao vivo com mapa geográfico de frotas atualizado e governança em tempo real. Telas do passageiro mantidas 100% limpas de métricas técnicas, com o diagnóstico técnico de WebGL e GNSS segregado em página dedicada.
- **UI elements:** Mapa de despacho ao vivo, Painel de estatísticas em tempo real, Cockpit de Diagnóstico Geoespacial & WebGL, Tabela de chamadas ativas, Botões de ação rápida e filtros
- **States covered:** success, loading, error
- **Errors & recovery:** Se o canal WebSocket em tempo real sofrer desconexão, o painel alterna automaticamente para polling HTTP a cada 5 segundos e alerta o operador no cabeçalho.
- **Telemetry:** admin_dispatch_audit (action_type, target_ride_id)
- **Status:** implemented
- **Coverage:** src/routes/app.admin.despacho.tsx:1-150, src/routes/app.admin.diagnostico.tsx:1-187, src/routes/app.admin.monitoramento.tsx:1-250
- **Product:** unobserved

## Tarifa Dinâmica & Despacho

### SCN-009: Tarifa dinâmica automática de alta demanda e sobretaxa administrativa imediata

- **Persona:** P-01, P-03
- **Feature:** Tarifa Dinâmica & Despacho
- **Traces:** ST-001, ST-008, FLW-01, FLW-08 (JTBD-01, JTBD-03)
- **Entry point:** Tela de cotação do passageiro e Central de despacho administrativa (/app/admin/despacho)
- **Preconditions:** Passageiro cotando corrida ou Administrador gerenciando a praça
- **Steps:**
  1. O sistema monitora a razão de chamados de passageiros vs motoristas livres na praça (padrão 99 e Uber) -> Quando a demanda supera a oferta, o multiplicador dinâmico é calculado e aplicado automaticamente nas cotações (x1.2, x1.4, x1.6, x1.8, x2.0).
  2. O passageiro visualiza na tela de cotação o badge transparente com o multiplicador e o motivo claro do acréscimo para incentivar mais condutores a atender a região.
  3. No painel de despacho, o gestor pode ativar ou desativar a inteligência de tarifa automática a qualquer momento através de controle switch dedicado, além de poder forçar uma Sobretaxa Administrativa Imediata (Live Override) por 15m, 30m, 1h ou 2h, que sobrepõe temporariamente o cálculo automático e depois reverte com segurança.
- **Expected result:** Tarifa dinâmica 100% justificada e transparente para o passageiro, com autonomia total de ativar ou desativar o cálculo automático e aplicar sobretaxa controlada no painel administrativo do franqueado e super admin.
- **UI elements:** Badge de tarifa dinâmica, Banner de alta demanda transparente, Card de inteligência de mercado com switch de ativação, Card de sobretaxa administrativa imediata
- **States covered:** success, loading, empty, error
- **Errors & recovery:** Em caso de perda de conexão com telemetria, o sistema utiliza o último estado válido com piso seguro de 1.0x e teto regulatório de 2.5x.
- **Telemetry:** surge_multiplier_applied (tenant_id, multiplier, is_live_override, reason)
- **Status:** implemented
- **Coverage:** src/services/SurgeEngine.ts:1-250, src/routes/app.admin.despacho.tsx:660-760, src/components/passenger/PassengerReviewRouteSheet.tsx:300-350
- **Product:** unobserved

## Identidade & White Label

### SCN-010: Governança White Label com segregação regional e sincronização em tempo real

- **Persona:** P-03
- **Feature:** Identidade & White Label Studio
- **Traces:** ST-008, FLW-08 (JTBD-03, JRN-01/#2)
- **Entry point:** Rota administrativa /app/admin/whitelabel e /app/admin/franqueados
- **Preconditions:** Usuário administrador autenticado com papel Super Admin, Owner ou Franqueado
- **Steps:**
  1. O usuário acessa o White Label Studio: quando autenticado como Super Admin ou Matriz, tem autonomia irrestrita para selecionar qualquer praça franqueada pelo seletor de topo ou pelo link direto da Central de Franqueados (`?tenant=...`). O estúdio exibe banner enterprise indicando a praça ativa sob edição e atalhos para testar instantaneamente o App do Passageiro e o Cockpit do Condutor.
  2. O Super Admin personaliza cores, marcas, verticais de negócio, valores de diárias e chave PIX da franquia: as alterações disparam transmissão imediata via BroadcastChannel local e canal Supabase Realtime (`tenant-config-updated`), atualizando em tempo real os clientes de passageiro e motorista da praça sem necessidade de login do franqueado.
  3. Quando autenticado com papel Franqueado, o sistema restringe a navegação às 5 abas operacionais locais (Brand Center, Design System, Multi-Negócio, Planos e Geo & App) e oculta as abas centrais da Matriz (Tipografia global, Landing Page corporativa, Home Builder e Menu Builder).
  4. Na aba Multi-Negócio, o operador ativa ou desativa categorias de veículos (ex: Carro ou Moto): o modal de rota do passageiro reflete instantaneamente as categorias disponíveis e atualiza a seleção ativa sem recarregar a tela.
  5. Na aba Planos, o operador configura a chave PIX, diárias (Carro e Moto) e planos de acesso: as configurações são sincronizadas em tempo real com o serviço financeiro do motorista e o extrato da praça.
  6. Na aba Geo & App, identificadores de compilação de código nativo (Package ID, Bundle ID e versão mínima) permanecem travados para Franqueados com aviso de governança da Matriz, mantendo editáveis os links oficiais de download e centrais de suporte.
- **Expected result:** Autonomia total do Super Admin para pré-configurar, homologar e entregar o aplicativo pronto para qualquer franquia com sincronização imediata em tempo real, aliada ao isolamento estrito de praça com governança clara de papéis.
- **UI elements:** Barra de abas filtrada por perfil, Banner Super Admin de praça ativa, Banner regional de governança do franqueado, Cards de categorias com switch imediato, Formulário de chave PIX e diárias com sincronização contábil, Bloqueio preventivo de identificadores nativos
- **States covered:** success, superadmin, regional, loading, error
- **Errors & recovery:** Tentativas de acesso direto a abas restritas por URL são interceptadas pelo guardião de navegação e redirecionadas para a aba inicial permitida (Brand Center).
- **Telemetry:** whitelabel_tenant_updated (tenant_id, role, updated_modules)
- **Status:** implemented
- **Coverage:** src/routes/app.admin.whitelabel.tsx:60-487, src/routes/app.admin.franqueados.tsx:420-650, src/lib/white-label/white-label-engine.ts:1-700, src/components/branding/BrandingProvider.tsx:1-709, src/components/admin/whitelabel/MonetizationTab.tsx:1-256, src/components/admin/whitelabel/GeoAppComplianceTab.tsx:640-750, src/components/passenger/PassengerReviewRouteSheet.tsx:100-240
- **Product:** unobserved

### SCN-011: Gestão Central de Franqueados e Multi-Tenant com Visualização Fluida e Ações Imediatas

- **Persona:** P-03
- **Feature:** Gestão Central de Franqueados & Multi-Tenant
- **Traces:** ST-008, FLW-08 (JTBD-03, JRN-01/#2)
- **Entry point:** Rota administrativa /app/admin/franqueados
- **Preconditions:** Usuário autenticado como Super Admin ou Matriz
- **Steps:**
  1. O operador visualiza a lista de operações municipais com controle de densidade visual, alternando entre Cards Compactos e Tabela Executiva.
  2. Cada cartão apresenta métricas chave condensadas (passageiros, condutores, status do servidor de mapas e PIX da praça), mantendo detalhes extensos recolhidos em gaveta expansível sob demanda.
  3. O operador pode acionar cópia direta de links de distribuição, testar chaves de mapas, consultar passageiros e condutores com exportação de relatórios em CSV e executar suspensão de emergência sem sobrecarga visual.
- **Expected result:** Interface fluida, hierarquizada e sem sobrecarga cognitiva para a gestão de dezenas de praças, preservando todos os controles operacionais e de governança.
- **UI elements:** Seletor de visualização Cards vs Tabela, Cards compactos com drawer expansível, Tabela executiva de alta densidade, Modais de inspeção com exportação CSV, Modal de chaves de mapas
- **States covered:** success, filtered, empty, table
- **Errors & recovery:** Em caso de exclusão acidental ou suspensão indevida, a operação exige confirmação com digitação do nome da cidade ou pode ser reativada instantaneamente com o botão Reativar Praça.
- **Telemetry:** tenant_management_action (tenant_id, action, status)
- **Status:** implemented
- **Coverage:** src/routes/app.admin.franqueados.tsx:1-1200
- **Product:** unobserved

## Delimitação Geográfica & Anti-Invasão

### SCN-012: Governança territorial e bloqueio de cadastros e corridas fora da região da franquia

- **Persona:** P-01, P-02, P-03
- **Feature:** Delimitação Geográfica & Anti-Invasão
- **Traces:** ST-005, ST-008, FLW-05, FLW-08 (JTBD-01, JTBD-03)
- **Entry point:** Telas de cadastro (/cadastro-passageiro, /cadastro-motorista, /auth), Bottom Sheet de cotação de corrida (/app) e Gestão de Franqueados (/app/admin/franqueados)
- **Preconditions:** Usuário tentando se cadastrar ou solicitar corrida em praça regional, ou Super Admin configurando os limites de atuação da franquia
- **Steps:**
  1. O Super Admin cadastra ou edita uma franquia regional na Central de Franqueados, definindo cidade-sede, raio máximo de atendimento em km e cidades adicionais licenciadas, com o controle de bloqueio de novas contas ativado.
  2. Um novo passageiro ou motorista parceiro tenta criar conta informando sua cidade ou utilizando localização via GPS: se estiver fora do território autorizado da franquia regional, a interface exibe aviso claro indicando a praça de atuação e desabilita a finalização do cadastro, enquanto a camada de serviço no Supabase Auth bloqueia atomicamente a operação. Na Matriz Nacional, o cadastro permanece irrestrito em qualquer ponto do território brasileiro.
  3. No aplicativo do passageiro, quando o usuário seleciona um ponto de embarque fora da área autorizada da franquia ativa, o Bottom Sheet de cotação exibe uma faixa informativa discreta indicando que a localidade está fora da área de atendimento e desabilita com segurança o botão de confirmação da corrida.
- **Expected result:** Proteção territorial estrita anti-invasão entre franquias e prevenção de contas fantasmas em praças sem cobertura ativa, preservando a autonomia irrestrita da Matriz Nacional.
- **UI elements:** Banner de fora de atendimento no cadastro, Botão de confirmação de cadastro desabilitado com aviso explicativo, Faixa informativa de fora de área no Bottom Sheet de corrida, Botão Confirmar Corrida desabilitado, Checkbox de bloqueio de novas contas no modal de criação e edição de franquias
- **States covered:** success, outside_territory, loading, error
- **Errors & recovery:** Em caso de GPS indisponível no dispositivo, o sistema utiliza o município canônico informado no formulário ou endereço; caso o usuário necessite de atendimento nacional, o sistema permite direcionamento à Matriz Nacional.
- **Telemetry:** territory_access_checked (tenant_id, allowed, reason, distance_km)
- **Status:** implemented
- **Coverage:** src/lib/geo/territory-guard.ts:1-250, src/lib/auth/supabase-auth-service.ts:160-260, src/components/auth/PartiuAppAuthGate.tsx:390-440, src/components/passenger/PassengerReviewRouteSheet.tsx:320-370, src/components/passenger/route-sheet/RouteSheetFooter.tsx:25-70, src/components/admin/whitelabel/CloneTenantModal.tsx:180-280, src/routes/app.admin.franqueados.tsx:1150-1250
- **Product:** unobserved

## Operação Estratégica do Motorista

### SCN-013: Despacho consecutivo em cadeia e navegação externa com um toque no Cockpit

- **Persona:** P-02
- **Feature:** Despacho em Cadeia & Navegação Externa
- **Traces:** ST-009, ST-010, FLW-09 (JTBD-02, JRN-02/#3, JRN-02/#4)
- **Entry point:** Cockpit operacional do motorista (/app/motorista)
- **Preconditions:** Condutor em viagem ativa com passageiro a bordo ou em deslocamento para o embarque
- **Steps:**
  1. O condutor em deslocamento toca no botão de atalho para Waze ou Google Maps: o sistema dispara o deep link nativo com as coordenadas exatas do destino sem exigir digitação manual.
  2. Quando a viagem atual atinge a janela de antecedência de até 2 minutos para o desembarque, o motor de despacho consecutivo avalia solicitações próximas ao ponto de entrega e projeta o card de chamada em cadeia com temporizador regressivo de 15 segundos.
  3. O motorista confirma a chamada em fila com 1 toque no card antes de concluir o desembarque atual.
  4. Ao finalizar a primeira corrida, a interface migra instantaneamente para o trajeto da nova viagem sem tempo ocioso entre chamadas.
- **Expected result:** Eliminação de quilometragem ociosa entre desembarque e novo embarque, com abertura fluida de rotas no Waze ou Google Maps.
- **UI elements:** Botão flutuante de navegação externa com seletor Waze e Google Maps, Card de chamada em cadeia com contador regressivo, Barra de ação rápida para aceite em fila
- **States covered:** success, offer, in_trip
- **Errors & recovery:** Se o condutor não responder ao card de chamada consecutiva em 15 segundos, a oferta expira silenciosamente sem penalizar a nota do motorista e o passageiro é redirecionado ao próximo veículo disponível.
- **Telemetry:** back_to_back_offer_handled (driver_id, ride_id, accepted, eta_seconds)
- **Status:** implemented
- **Coverage:** src/lib/driver/back-to-back-engine.ts:1-124, src/components/driver/BackToBackRideCard.tsx:1-124, src/components/driver/ExternalNavigationButton.tsx:1-155, src/routes/app.motorista.tsx:1-2833
- **Product:** unobserved

### SCN-014: Proteção contra GPS simulado e operação em modo de tolerância da diária SaaS

- **Persona:** P-02, P-03
- **Feature:** Mock Location Shield & Tolerância SaaS
- **Traces:** ST-011, ST-012, FLW-09 (JTBD-02, JTBD-03, JRN-02/#1)
- **Entry point:** Cockpit operacional do motorista (/app/motorista)
- **Preconditions:** Condutor autenticado com serviço de localização ativado no smartphone
- **Steps:**
  1. O condutor ativa o modo online no cockpit: o motor de validação cinemática analisa a telemetria do dispositivo avaliando velocidade, aceleração física e integridade do provedor de geolocalização.
  2. Caso o sinal seja autêntico, a interface exibe selo verde de sinal verificado; se for detectada manipulação por aplicativo de GPS falso ou saltos incoerentes, o sistema rejeita a telemetria fraudulenta e exibe alerta de sinal inconsistente.
  3. Caso a diária SaaS do motorista esteja vencida no início do turno, o sistema ativa o modo de tolerância, autorizando até 2 corridas para permitir o início do trabalho.
  4. Ao concluir a primeira corrida remunerada via Pix, a diária pendente é debitada automaticamente da liquidação e o condutor retorna ao status regular.
- **Expected result:** Fila justa de despacho sem fraude por GPS simulado e praça continuamente abastecida sem interrupção abrupta de condutores no início do dia.
- **UI elements:** Selo de status do escudo de localização, Alerta de GPS simulado detectado, Banner de modo de tolerância com contador de corridas restantes, Botão de regularização imediata via Pix
- **States covered:** success, tolerance, blocked, warning
- **Errors & recovery:** Ao esgotar as 2 corridas de tolerância sem quitação, o acesso a novas chamadas é pausado preventivamente até a liquidação da diária pendente.
- **Telemetry:** mock_location_evaluated (driver_id, is_spoofed, confidence), saas_tolerance_status_changed (driver_id, status, rides_left)
- **Status:** implemented
- **Coverage:** src/lib/geo/mock-location-shield.ts:1-164, src/services/subscription/SaaSToleranceEngine.ts:1-112, src/components/driver/MockLocationBanner.tsx:1-40, src/components/driver/SaaSToleranceBanner.tsx:1-45, src/routes/app.motorista.tsx:1-2973
- **Product:** unobserved

## Gestão Regional Avançada

### SCN-015: Torre de controle com mapa de calor preditivo e disparo de incentivo operacional

- **Persona:** P-03
- **Feature:** Demanda Preditiva & Torre de Controle
- **Traces:** ST-013, FLW-10 (JTBD-03, JRN-01/#2)
- **Entry point:** Central de Despacho (/app/admin/despacho)
- **Preconditions:** Franqueado ou gestor autenticado com operação regional em andamento
- **Steps:**
  1. O gestor acessa a Central de Despacho e clica no botão Demanda Preditiva para abrir a torre de controle de fluxo urbano.
  2. O modal exibe os clusters geoespaciais com identificação de índice de desbalanceamento, tempo médio de espera, tendência para os próximos 30 minutos e sobretaxa recomendada para normalização.
  3. O gestor ajusta o raio de alcance (3, 5 ou 8 km) e a sobretaxa de incentivo (+10% a +25%) e clica no botão Disparar Alerta.
  4. O sistema transmite notificação instantânea para os condutores no perímetro via push e WebSocket, gerando registro imutável na trilha de auditoria e ativando cooldown de proteção antiflood de 60 segundos.
- **Expected result:** Reequilíbrio proativo da frota em tempo real antes da ocorrência de cancelamentos por ausência de veículos.
- **UI elements:** Botão Demanda Preditiva na barra de topo da Central de Despacho, Modal da torre de controle com cartões de clusters de demanda, Seletores de raio e sobretaxa, Indicador de desbalanceamento por cores, Botão de disparo de alerta de incentivo
- **States covered:** success, loading, broadcast_sent, cooldown_active
- **Errors & recovery:** Em caso de tentativa de disparo consecutivo dentro da janela de 60 segundos, o sistema alerta o tempo restante de cooldown sem sobrecarregar os motoristas.
- **Telemetry:** predictive_incentive_broadcasted (tenant_id, cluster_id, multiplier, drivers_notified)
- **Status:** implemented
- **Coverage:** src/lib/spatial/predictive-demand-engine.ts:1-320, src/components/admin/PredictiveHeatmapModal.tsx:1-260, src/routes/app.admin.despacho.tsx:1-2027
- **Product:** unobserved

### SCN-016: Homologação cadastral expressa com OCR de CNH e CRM de reengajamento automático

- **Persona:** P-03
- **Feature:** Homologação Expressa & CRM de Reengajamento
- **Traces:** ST-014, ST-015, FLW-11 (JTBD-03, JRN-01/#2)
- **Entry point:** Gestão de Motoristas (/app/admin/motoristas) e Painel Executivo (/app/admin)
- **Preconditions:** Administrador autenticado com novos cadastros pendentes ou base de inativos para recuperação
- **Steps:**
  1. Na listagem de motoristas pendentes, o administrador clica no botão de validação expressa com OCR ao lado do registro documental.
  2. O modal assistido apresenta os campos preenchidos automaticamente a partir da foto da CNH com conferência de legibilidade e indicador de registro para atividade remunerada (EAR).
  3. O gestor valida os dados e clica em Homologar em 1 Clique, ativando imediatamente o condutor para o despacho.
  4. No painel executivo, o administrador clica no botão CRM Reengajamento, visualiza os totais de clientes e motoristas sem atividade há mais de 7 dias e aciona o envio em lote de incentivos com confirmação na tela.
- **Expected result:** Redução drástica do ciclo de homologação de condutores e reativação sistemática de usuários ausentes.
- **UI elements:** Botão OCR CNH na tabela de frotas, Modal de conferência assistida de CNH e CRLV, Botão de homologação em 1 clique, Botão CRM Reengajamento no Dashboard executivo, Modal de campanhas com seleção de cupons e isenções
- **States covered:** success, processing, approved, campaign_dispatched
- **Errors & recovery:** Caso os caracteres da CNH estejam com baixa legibilidade, o sistema permite a edição manual dos campos pelo operador antes da homologação final.
- **Telemetry:** driver_ocr_homologated (driver_id, admin_id, execution_time_ms), crm_campaign_dispatched (tenant_id, audience_type, count)
- **Status:** implemented
- **Coverage:** src/components/admin/DriverKycFastApprovalModal.tsx:1-134, src/components/admin/ReengagementCrmModal.tsx:1-129, src/routes/app.admin.motoristas.tsx:1-2128, src/routes/app.admin.index.tsx:1-475
- **Product:** unobserved

## Infraestrutura & Resiliência

### SCN-017: Resiliência Zero-Drop e sincronização atômica offline com cadeia criptográfica

- **Persona:** P-01, P-02
- **Feature:** Resiliência Zero-Drop Offline
- **Traces:** ST-016, FLW-12 (JTBD-01, JRN-01/#3)
- **Entry point:** Aplicativo do passageiro (/app) ou cockpit do motorista (/app/motorista)
- **Preconditions:** Viagem em andamento em trecho rodoviário, túnel ou área sem cobertura de dados móveis
- **Steps:**
  1. O veículo entra em região sem conectividade celular durante uma corrida ativa.
  2. O condutor aciona evento operacional como confirmação de embarque ou desembarque: o motor Zero-Drop armazena o evento em banco IndexedDB criptografado localmente no dispositivo, gerando hash encadeado para garantir a integridade da sequência.
  3. A interface sinaliza modo offline com contagem de eventos pendentes na fila de saída (Outbox).
  4. Ao recuperar o sinal 4G ou Wi-Fi, o motor sincroniza atomicamente os registros com o cluster central sem perda de dados, duplicidade ou divergência contábil.
- **Expected result:** Continuidade operacional irrestrita em áreas sem cobertura de internet móvel com liquidação confiável ao retornar a conectividade.
- **UI elements:** Banner discreto de modo offline com indicador de fila pendente, Indicador de sincronização concluída com ícone de confirmação
- **States covered:** online, offline, syncing, reconciled
- **Errors & recovery:** Em caso de conflito temporal durante a reconexão, o motor de reconciliação utiliza o hash criptográfico sequencial para desempatar eventos e atualizar o estado central com segurança.
- **Telemetry:** zero_drop_events_reconciled (user_id, ride_id, queued_events_count, duration_ms)
- **Status:** implemented
- **Coverage:** src/lib/offline/zero-drop-sync.ts:1-245, src/components/passenger/NetworkReconnectionBanner.tsx:1-102, src/routes/app.motorista.tsx:1-2833
- **Product:** unobserved

## Sobrevivência Urbana & Eficiência do Cockpit

### SCN-018: Zonas de exclusão pessoal e radar comunitário no cockpit

- **Persona:** P-02
- **Feature:** Sobrevivência Urbana & Radar Comunitário
- **Traces:** ST-017, FLW-13 (JTBD-02, JRN-02/#1)
- **Entry point:** Cockpit operacional do motorista (/app/motorista)
- **Preconditions:** Motorista parceiro online no cockpit com GPS ativo
- **Steps:**
  1. O motorista clica no botão Zonas na barra operacional do cockpit e abre o modal de zonas de exclusão pessoal.
  2. Cadastra até 3 bairros ou trechos geográficos com raio ajustável e janela de horário de atuação (ex: 20:00 às 06:00).
  3. Quando surge uma chamada com embarque ou desembarque dentro da zona de exclusão no horário restrito, o motor de elegibilidade rejeita a oferta preventivamente para aquele condutor.
  4. Nas chamadas recebidas, o radar comunitário avalia a telemetria do destino e exibe badge de classificação preventiva de segurança.
- **Expected result:** O condutor opera com tranquilidade psicológica sem receber chamadas indesejadas em bairros que considera arriscados no período noturno.
- **UI elements:** Botão Zonas na barra operacional, Modal de zonas de exclusão com controle de raio e horário, Badges de segurança comunitária nas ofertas
- **States covered:** success, active, paused
- **Errors & recovery:** Caso tente cadastrar mais de 3 zonas, o sistema exibe aviso informando o limite e orienta a edição de uma zona existente.
- **Telemetry:** driver_exclusion_zone_evaluated (driver_id, zone_name, is_excluded)
- **Status:** implemented
- **Coverage:** src/lib/geo/driver-exclusion-zones.ts:1-255, src/components/driver/ExclusionZonesModal.tsx:1-252, src/routes/app.motorista.tsx:1-2833
- **Product:** unobserved

### SCN-019: Rota de volta para casa com atalho de favoritos e Áudio HUD hands-free

- **Persona:** P-02
- **Feature:** Eficiência no Cockpit & Áudio HUD
- **Traces:** ST-018, ST-019, FLW-13 (JTBD-02, JRN-02/#2, JRN-02/#4)
- **Entry point:** Cockpit operacional do motorista (/app/motorista)
- **Preconditions:** Motorista parceiro operando no cockpit
- **Steps:**
  1. No final do turno, o condutor toca no chip Indo para Casa na barra de ferramentas: se já tiver endereço favorito salvo, o modo é ativado instantaneamente com limite de até 2 usos diários.
  2. O motor geoespacial filtra as chamadas recebidas, ofertando apenas corridas cuja rota convirja na direção do destino residencial do condutor.
  3. Com o botão Áudio HUD ativado, ao receber uma nova chamada, o sintetizador de voz nativo anuncia em voz alta no fone ou alto-falante a distância de busca, o valor líquido em reais e o bairro de destino.
  4. O condutor aceita ou recusa a corrida com segurança sem desviar os olhos da pista.
- **Expected result:** Faturamento garantido no trajeto de volta para casa com eliminação de quilometragem morta e segurança veicular hands-free.
- **UI elements:** Chip de destino rápido DestinationQuickChip, Botão de Áudio HUD com animação de onda sonoro, Modal de configuração de endereço residencial
- **States covered:** success, active, speaking
- **Errors & recovery:** Caso o navegador não possua suporte a síntese de voz, o sistema emite alerta sonoro tradicional de radar e mantém os controles visuais desobstruídos.
- **Telemetry:** destination_mode_activated (driver_id, remaining_uses), audio_hud_announced (driver_id, net_fare_cents)
- **Status:** implemented
- **Coverage:** src/services/DriverDestinationModeService.ts:1-301, src/lib/driver/audio-hud-engine.ts:1-179, src/components/driver/DestinationQuickChip.tsx:1-61, src/components/driver/AudioHudToggle.tsx:1-57, src/routes/app.motorista.tsx:1-2833
- **Product:** unobserved

### SCN-020: Detecção automática de chegada via Geofence e tolerância de espera com No-Show

- **Persona:** P-01, P-02
- **Feature:** Geofencing & Tolerância No-Show
- **Traces:** ST-002, ST-004, FLW-02 (JTBD-01, JTBD-02, JRN-01/#3, JRN-02/#3)
- **Entry point:** Cockpit operacional do motorista (/app/motorista) e tela de corrida ativa do passageiro (/app)
- **Preconditions:** Corrida ativa com motorista a caminho (EN_ROUTE / HEADING_TO_PICKUP)
- **Steps:**
  1. O motorista conduz até o ponto de embarque. Ao cruzar o raio de proximidade de 150 metros via Haversine, o sistema detecta a chegada automaticamente sem necessidade de toque manual.
  2. O estado da corrida transita para DRIVER_ARRIVED / CHEGOU com registro atômico do timestamp de chegada.
  3. O passageiro recebe notificação sonora e vibração no aparelho anunciando que o veículo parceiro chegou ao ponto de encontro.
  4. O cockpit do motorista inicia a contagem regressiva de tolerância de espera de 5 minutos (300 segundos).
  5. Caso o passageiro não compareça dentro da janela de tolerância, o botão de cancelamento por não comparecimento (No-Show) é liberado com elegibilidade para taxa compensatória.
- **Expected result:** Eliminação de atritos e discussões sobre horário de chegada, proteção do tempo do condutor e aviso instantâneo ao passageiro.
- **UI elements:** Card de chegada, Cronômetro regressivo de tolerância (Wait Tolerance Bar), Alerta sonoro de embarque, Botão de No-Show liberado pós-tolerância
- **States covered:** success, arrived, waiting, expired
- **Errors & recovery:** Em caso de perda momentânea de sinal de satélite GPS, o motorista mantém a opção de confirmação assistida no cockpit e o passageiro é sincronizado via Polling Adaptativo a cada 3 segundos.
- **Telemetry:** driver_geofence_arrival_triggered (ride_id, distance_meters), wait_tolerance_no_show_eligible (ride_id, elapsed_seconds)
- **Status:** implemented
- **Coverage:** src/lib/spatial/geofence-arrival-service.ts:1-170, src/services/RealtimeConnectionManager.ts:1-320
- **Product:** unobserved

### SCN-021: Reatribuição transparente de corrida por cancelamento do condutor em rota

- **Persona:** P-01, P-02
- **Feature:** Reatribuição Transparente (On-Service Reassign)
- **Traces:** ST-002, FLW-02 (JTBD-01, JTBD-02, JRN-01/#3, JRN-02/#3)
- **Entry point:** Tela de acompanhamento de corrida (/app) e Cockpit operacional (/app/motorista)
- **Preconditions:** Corrida aceita com condutor a caminho (HEADING_TO_PICKUP / A_CAMINHO)
- **Steps:**
  1. O motorista aceitou o chamado, mas sofre um imprevisto operacional (pane mecânica, pneu furado, trânsito intransitável) antes de iniciar a viagem e cancela no cockpit com justificativa obrigatória.
  2. O condutor é liberado e retorna ao estado ONLINE ou IDLE; o lock atômico do condutor é liberado.
  3. Em vez de cancelar a viagem e derrubar o passageiro para o início, o sistema mantém o pedido ativo e aciona a reatribuição transparente (On-Service Reassign).
  4. O motorista desistente é adicionado à lista de exclusão (excludedDriverIds) daquela corrida específica para não receber a mesma oferta novamente.
  5. A corrida transita para PROCURANDO / SEARCHING_R1 e a cascata de despacho inteligente é reiniciada para os próximos condutores mais próximos via PostGIS/H3.
  6. A interface do passageiro permanece com origem e destino intactos, exibindo banner contextual informativo: "O motorista anterior precisou cancelar. Localizando outro parceiro próximo para você...".
- **Expected result:** O passageiro não perde seu pedido nem precisa digitar novamente endereços; tempo médio de recuperação inferior a 15 segundos.
- **UI elements:** Banner de aviso de reatribuição (ReassignBanner), Radar de busca progressiva reativado, Polyline e Pins de rota preservados no mapa.
- **States covered:** DRIVER_ASSIGNED -> SEARCHING_R1, reassigning, finding_driver
- **Errors & recovery:** Se todos os motoristas da praça recusarem ou esgotarem a fila, o sistema avança para o timeout inteligente oferecendo nova tentativa com raio expandido ou cancelamento voluntário.
- **Telemetry:** on_service_reassign_triggered (ride_id, cancelling_driver_id, reason_code, reassign_count)
- **Status:** implemented
- **Coverage:** src/lib/dispatch-atomic/on-service-reassign.ts:1-170, src/contexts/PassengerRideContext.tsx:1-1836, src/routes/app.index.tsx:1-860
- **Product:** unobserved

### SCN-022: Bifurcação justa da taxa de cancelamento com tolerância de 2 minutos (Grace Period)

- **Persona:** P-01, P-02
- **Feature:** Taxa de Cancelamento Justa (Padrão 99 / Uber)
- **Traces:** ST-002, FLW-02 (JTBD-01, JTBD-02, JRN-01/#3, JRN-02/#3)
- **Entry point:** Modal de confirmação de cancelamento do passageiro (/app)
- **Preconditions:** Chamado solicitado ou condutor aceito
- **Steps:**
  1. O passageiro decide cancelar a corrida e clica em cancelar.
  2. Se nenhum motorista aceitou ainda ou se o cancelamento ocorrer dentro de 2 minutos (120s) do aceite (e antes da chegada do condutor), a taxa é R$ 0,00 (ORDER_STATUS_CANCEL_TRIP_NOPAY).
  3. Se o passageiro cancelar após a carência de 2 minutos (>120s) ou após o condutor já ter chegado ao local de embarque (DRIVER_ARRIVED), aplica-se a taxa compensatória de R$ 6,00 (ORDER_STATUS_CANCEL_TRIP_PAID).
  4. Em caso de No-Show comprovado (condutor aguardou >= 5 minutos no ponto de coleta), a taxa de R$ 6,00 é aplicada.
  5. Se o passageiro justificar que o motorista estava parado ou indo na direção oposta (DRIVER_STATIONARY), a taxa é isenta mesmo após 2 minutos.
  6. No modelo Pure SaaS (0% comissão), 100% da taxa compensatória (R$ 6,00) é creditada ao parceiro.
- **Expected result:** Equilíbrio de incentivos: passageiro tem tolerância razoável para desistir sem custos, enquanto o condutor tem seu combustível e tempo protegidos contra cancelamentos tardios ou No-Show.
- **UI elements:** Modal de cancelamento com aviso de carência, detalhe de taxa pendente, seletor de motivos justificados
- **States covered:** NOPAY, PAID, exempt, no_show
- **Errors & recovery:** Falhas de rede persistem a taxa pendente no banco e em cache local para compensação no próximo ciclo de pagamento.
- **Telemetry:** cancellation_fee_evaluated (ride_id, fee_type, total_fee_cents, elapsed_seconds, is_exempt)
- **Status:** implemented
- **Coverage:** src/lib/pricing/cancellation-fee-calculator.ts:1-210, src/lib/partiu-financial-engine.ts:220-270, src/contexts/PassengerRideContext.tsx:1550-1610
- **Product:** unobserved

### SCN-023: Despacho consecutivo preditivo em cadeia com handover atômico (Back-to-Back Dispatch)

- **Persona:** P-02
- **Feature:** Despacho em Cadeia Preditivo (Padrão 99 APK)
- **Traces:** ST-009, FLW-09 (JTBD-02, JRN-02/#3)
- **Entry point:** Cockpit operacional do motorista em viagem ativa (/app/motorista)
- **Preconditions:** Motorista em viagem ativa (IN_PROGRESS / IN_TRIP) se aproximando do ponto de desembarque
- **Steps:**
  1. O motorista está a menos de 3 minutos (180s) ou 2.000 metros de concluir a corrida em andamento.
  2. O motor preditivo avalia a elegibilidade e busca pedidos adjacentes ao desembarque final (raio até 3.000m).
  3. O card de chamada em cadeia (`BackToBackRideCard`) surge no cockpit sem obstruir a navegação ativa, exibindo nome do passageiro, avaliação, ganho líquido e distância da coleta a partir do desembarque.
  4. O motorista pode aceitar ou recusar a oferta com contagem regressiva de 15 segundos.
  5. Ao aceitar, a chamada entra no slot isolado `QUEUED` (`AGUARDANDO_VEICULO_TERMINAR_CORRIDA_ANTERIOR`).
  6. Ao finalizar a corrida em andamento e concluir o desembarque, o handover atômico promove instantaneamente a corrida enfileirada para ativa (`HEADING_TO_PICKUP`), iniciando navegação direta sem intervalo ocioso.
- **Expected result:** Redução de até 35% no tempo ocioso do condutor entre chamadas e redução do tempo de espera do passageiro.
- **UI elements:** Card flutuante BackToBackRideCard, badge de chamada em cadeia, indicador de próximo embarque
- **States covered:** IN_TRIP, QUEUED, HEADING_TO_PICKUP, handover
- **Errors & recovery:** Se o passageiro da próxima chamada cancelar enquanto o motorista ainda estiver finalizando a anterior, a corrida ativa permanece 100% protegida e o slot é limpo sem penalidade.
- **Telemetry:** back_to_back_offered (driver_id, ride_id, remaining_seconds), back_to_back_accepted (driver_id, ride_id), back_to_back_promoted (driver_id, next_ride_id)
- **Status:** implemented
- **Coverage:** src/lib/driver/back-to-back-engine.ts:1-200, src/lib/driver/driver-consecutive-rides-engine.ts:1-299, src/components/driver/BackToBackRideCard.tsx:1-124, src/routes/app.motorista.tsx:770-800
- **Product:** unobserved

### SCN-024: Deep linking universal para Waze, Google Maps e Apple Maps com resolução dinâmica de alvo

- **Persona:** P-02
- **Feature:** Deep Linking de Navegação Externa
- **Traces:** ST-010, FLW-09 (JTBD-02, JRN-02/#3)
- **Entry point:** Botão flutuante ou contextual de navegação no cockpit (/app/motorista)
- **Preconditions:** Motorista em deslocamento até o embarque (HEADING_TO_PICKUP) ou em viagem (IN_TRIP)
- **Steps:**
  1. O motorista visualiza o botão de navegação externa GPS com ícone do aplicativo favorito (Waze ou Google Maps).
  2. O motorista clica no botão com um único toque.
  3. O sistema resolve dinamicamente as coordenadas do alvo atual: se a caminho do embarque, aponta para a origem do passageiro; se em viagem com paradas, aponta para a próxima parada; se em viagem direta, aponta para o destino final.
  4. Em dispositivos móveis (Android/iOS), dispara o esquema de URI nativo (`waze://`, `google.navigation:`) abrindo diretamente o app instalado sem passar por abas vazias do navegador.
  5. Se o app nativo não estiver instalado ou no desktop, aciona o fallback universal via HTTPS com rota calculada.
  6. O condutor pode alternar o aplicativo preferencial a qualquer momento com toque longo ou no seletor modal.
- **Expected result:** Acesso instantâneo e seguro a rotas com trânsito em tempo real e alerta de radares com apenas 1 clique durante a condução.
- **UI elements:** Botão flutuante ExternalNavigationButton, modal de seleção de app GPS, indicador de aplicativo padrão
- **States covered:** HEADING_TO_PICKUP, IN_TRIP, STOP_TRANSIT
- **Errors & recovery:** Em caso de ausência de aplicativo nativo instalado, fallback automático para versão web em 1.500ms.
- **Telemetry:** external_navigation_launched (driver_id, app, target_type, coords)
- **Status:** implemented
- **Coverage:** src/lib/navigation/external-navigation-service.ts:1-229, src/components/driver/ExternalNavigationButton.tsx:1-155, src/routes/app.motorista.tsx:1930-1960
- **Product:** unobserved

### SCN-025: Central de segurança pessoal unificada com gravação confidencial e ficha 190

- **Persona:** P-01, P-02
- **Feature:** Central de Segurança Pessoal (Padrão Jarvis 99 APK)
- **Traces:** ST-003, FLW-03 (JTBD-01, JRN-01/#4, JTBD-02, JRN-02/#4)
- **Entry point:** Botão de proteção / escudo na tela da corrida do passageiro ou botão SOS no cockpit do condutor
- **Preconditions:** Corrida em andamento ou motorista a caminho
- **Steps:**
  1. O passageiro ou condutor abre a Central de Segurança durante o trajeto.
  2. O usuário pode iniciar a Gravação de Áudio de Segurança com criptografia de ponta a ponta, visualizando o cronômetro ativo em tempo real.
  3. O áudio é capturado e selado com envelope seguro para fins exclusivos de auditoria e resolução de incidentes.
  4. O passageiro pode compartilhar o link público "Siga Minha Viagem" via WhatsApp ou redes, permitindo que contatos acompanhem o trajeto por satélite sem necessidade de login.
  5. Em caso de perigo silencioso, o usuário aciona o Alerta Silencioso de Apoio, enviando telemetria e coordenadas para a torre operacional sem emitir sons.
  6. Em caso de perigo imediato, ao clicar em Emergência 190, o sistema apresenta a ficha verbal com modelo do carro, placa, condutor e endereço para leitura imediata ao operador da Polícia Militar.
- **Expected result:** Proteção pessoal robusta e discreta, diminuindo a sensação de vulnerabilidade de passageiros e parceiros.
- **UI elements:** Bottom sheet SafetyCenterModal, modal DriverSosModal, indicador de gravação de áudio, ficha de dados para operador 190
- **States covered:** IDLE, RECORDING, COMPLETED, SOS_ALERT
- **Errors & recovery:** Se o microfone não estiver disponível ou for bloqueado pelo sistema operacional, a gravação exibe aviso de permissão sem travar o aplicativo e mantém ativas as demais funções de socorro.
- **Telemetry:** safety_audio_recording_started, safety_audio_recording_stopped, safety_silent_sos_dispatched
- **Status:** implemented
- **Coverage:** src/lib/security/safety-toolkit-service.ts:1-350, src/components/passenger/SafetyCenterModal.tsx:1-380, src/components/driver/cockpit/DriverSosModal.tsx:1-240
- **Product:** unobserved

### SCN-026: Compressão vetorial de polylines via RDP e telemetria suave a 60 FPS no mapa

- **Persona:** P-01, P-02
- **Feature:** Otimização Geométrica e Renderização a 60 FPS
- **Traces:** ST-001, ST-002, FLW-01, FLW-02
- **Entry point:** Visualização de rota e mapa em tempo real em qualquer dispositivo
- **Preconditions:** Rota vetorial calculada e telemetria GPS transmitida pelo veículo
- **Steps:**
  1. O serviço de rotas recebe o traçado viário completo com centenas de vértices das vias urbanas.
  2. O algoritmo Ramer-Douglas-Peucker (RDP) comprime a polyline com tolerância calibrada (0.00004 graus), eliminando entre 40% e 75% dos pontos colineares redundantes e preservando estritamente cruzamentos e curvas.
  3. O GeoJSON otimizado é injetado no WebGL do Mapbox GL, reduzindo a carga de renderização gráfica e o consumo de bateria em smartphones modestos.
  4. O filtro de Deadband de GPS amortece micro-oscilações inferiores a 2.5 metros, impedindo trepidação visual quando o carro está parado no trânsito.
  5. A interpolação contínua de azimute (Bearing Smoothing) calcula o menor arco angular, girando o marcador suavemente a 60 quadros por segundo sem saltos bruscos de orientação.
- **Expected result:** Navegação fluida, visual limpo e consumo eficiente de recursos gráficos mesmo em trajetos longos e com aparelhos de entrada.
- **UI elements:** Camada LayerTrips do Mapbox GL, marcador vetorial com interpolação de rotação
- **States covered:** ROUTE_SIMPLIFIED, GPS_DEADBAND, BEARING_SMOOTHED
- **Errors & recovery:** Caso a rota possua menos de 3 vértices, o algoritmo preserva as coordenadas originais sem alterações.
- **Telemetry:** polyline_optimized (original_points, simplified_points, reduction_ratio)
- **Status:** implemented
- **Coverage:** src/lib/geo/polyline-optimizer.ts:1-210, src/map/layers/LayerTrips.ts:1-180
- **Product:** unobserved

### SCN-027: Múltiplas paradas intermediárias com resolução dinâmica de navegação

- **Persona:** P-01, P-02
- **Feature:** Múltiplas Paradas Intermediárias (Multi-Stop Waypoints Engine)
- **Traces:** ST-001, ST-002, FLW-01, FLW-02
- **Entry point:** Solicitação da viagem pelo passageiro (/app) ou execução da viagem no Cockpit do condutor (/app/motorista)
- **Preconditions:** Passageiro configurou até 2 paradas intermediárias no momento da cotação ou durante a viagem
- **Steps:**
  1. O passageiro adiciona uma ou duas paradas ao itinerário, com acréscimo transparente e tabelado de R$ 2,50 por parada intermediária.
  2. O motorista recebe a chamada informando o número de paradas e o trajeto global consolidado.
  3. Ao iniciar a viagem, o sistema orienta o condutor para o primeiro ponto de parada intermediária (`currentStopIndex = 0`).
  4. O botão de navegação externa (Waze ou Google Maps) resolve dinamicamente as coordenadas da parada ativa sem exigir digitação manual pelo motorista.
  5. Ao chegar ao local da parada, o motorista desliza a barra de ação para confirmar a conclusão da parada ou pular caso solicitado pelo passageiro.
  6. O sistema avança o índice da parada (`currentStopIndex + 1`), atualiza a linha do tempo no aplicativo do passageiro e reorienta imediatamente a rota e o GPS externo para o próximo ponto ou destino final.
- **Expected result:** Suporte operacional fluido a itinerários fracionados com remuneração justa adicional de R$ 2,50 por parada ao condutor e roteamento sem atrito.
- **UI elements:** Banner de parada intermediária no cockpit, timeline de paradas no En Route Sheet, slider de conclusão de parada, seletor de rota dinâmica
- **States covered:** STOP_IN_PROGRESS, STOP_COMPLETED, STOP_SKIPPED, FINAL_DESTINATION
- **Errors & recovery:** Se o passageiro desistir de uma parada durante o percurso, o condutor ou passageiro pode pular a etapa diretamente sem travar a viagem.
- **Telemetry:** multi_stop_added (ride_id, count), multi_stop_advanced (ride_id, stop_index), multi_stop_skipped (ride_id, stop_index)
- **Status:** implemented
- **Coverage:** src/lib/passenger/multi-stop-engine.ts:1-210, src/components/driver/cockpit/states/InTripState.tsx:1-220, src/components/passenger/DriverEnRouteSheet.tsx:1-260, src/routes/app.motorista.tsx:1850-1920
- **Product:** unobserved

### SCN-028: Pontos verdes inteligentes de encontro com snap de embarque

- **Persona:** P-01, P-02
- **Feature:** Pontos Verdes Inteligentes de Encontro (Smart Green Pickup Points)
- **Traces:** ST-001, FLW-01
- **Entry point:** Tela de confirmação de ponto de embarque do passageiro
- **Preconditions:** Passageiro posiciona o pin em vias de difícil acesso, esquinas de sentido proibido ou calçadões
- **Steps:**
  1. O algoritmo analisa a posição do passageiro e detecta pontos de embarque de alta fluidez (esquinas desobstruídas, bolsões de parada, calçadas com recuo) em um raio de até 250 metros.
  2. O sistema exibe no mapa marcadores verdes pulsantes (Smart Green Pickups) com o tempo economizado indicado (por exemplo: "Economiza até 3 min de volta do motorista").
  3. O passageiro pode tocar no ponto verde sugerido para fazer o snap magnético do embarque ou manter o pin original.
  4. Se o passageiro confirmar o ponto verde inteligente, a rota do motorista evita voltas de quarteirão desnecessárias e manobras arriscadas.
  5. O passageiro recebe instruções simples de caminhada até o ponto de encontro selecionado.
- **Expected result:** Redução do tempo de espera do passageiro, diminuição de manobras perigosas para o motorista e embarque mais rápido.
- **UI elements:** Marcadores verdes de alta fluidez no mapa, card de benefício de tempo estimado, botão de seleção rápida do ponto
- **States covered:** PICKUP_SEARCHING, GREEN_POINT_FOCUSED, PIN_SNAPPED, CUSTOM_PIN
- **Errors & recovery:** Caso o passageiro opte por não se deslocar, o sistema respeita o pin manual sem restrição ou penalidade.
- **Telemetry:** smart_pickup_rendered (count), smart_pickup_selected (point_id, detour_savings_minutes)
- **Status:** implemented
- **Coverage:** src/lib/passenger/smart-pickups.ts:1-169, src/components/passenger/PassengerConfirmPickupPin.tsx:1-150
- **Product:** unobserved

### SCN-029: Homologação cadastral expressa com OCR de CNH e validação em tempo real

- **Persona:** P-02, P-03
- **Feature:** Homologação Cadastral Expressa com OCR de CNH e Validação em Tempo Real (Driver Onboarding KYC)
- **Traces:** ST-005, ST-008, FLW-05, FLW-11 (JTBD-02, JRN-02/#1, JTBD-03, JRN-01/#2)
- **Entry point:** Formulário de cadastro de motorista parceiro (/cadastro-motorista) e Central de Frota do Admin (/app/admin/motoristas)
- **Preconditions:** Novo motorista enviando foto ou PDF da Carteira Nacional de Habilitação (CNH)
- **Steps:**
  1. O candidato anexa a foto da CNH no formulário de cadastro de motorista parceiro.
  2. O motor OCR neural analisa o documento em segundo plano, extraindo Nome, CPF, Número de Registro, Categoria, Data de Validade e observação EAR.
  3. O sistema valida criptograficamente os dígitos verificadores do CPF e executa validação cruzada com os dados declarados pelo candidato.
  4. Os campos de formulário são preenchidos e o candidato visualiza o selo de autenticidade (por exemplo: "Validação OCR: 98% de precisão • EAR Confirmado").
  5. Se a CNH estiver vencida ou sem EAR, alertas preventivos são apresentados com orientações claras de regularização.
  6. No painel administrativo da franquia regional, a equipe de moderação visualiza a ficha de auditoria documental e aprova o candidato com 1 clique (Aprovação Expressa), liberando acesso imediato ao Cockpit com trial ou diária cortesia.
- **Expected result:** Redução do tempo de aprovação de 24 horas para menos de 2 minutos, aumentando a taxa de conversão de novos motoristas parceiros sem comprometer a segurança jurídica.
- **UI elements:** Card de feedback OCR em tempo real, badge de confiabilidade documental, modal DriverKycFastApprovalModal no admin
- **States covered:** OCR_ANALYZING, OCR_SUCCESS, EAR_WARNING, CNH_EXPIRED, FAST_APPROVED
- **Errors & recovery:** Em caso de foto cortada ou ilegível, o sistema orienta o candidato a reenviar o documento com boa iluminação sem bloquear o formulário.
- **Telemetry:** driver_cnh_ocr_scanned (score, ear_detected, match_ratio), driver_fast_approved (driver_id, role)
- **Status:** implemented
- **Coverage:** src/lib/kyc/driver-ocr-engine.ts:1-250, src/routes/cadastro-motorista.tsx:250-290, src/components/admin/DriverKycFastApprovalModal.tsx:1-120, src/routes/app.admin.motoristas.tsx:2105-2125
- **Product:** unobserved

### SCN-030: Chat de bordo hands-free com respostas rápidas de 1 toque e áudio TTS

- **Persona:** P-01, P-02
- **Feature:** Chat de Bordo Hands-Free e Respostas Rápidas (Quick Canned Replies & TTS)
- **Traces:** ST-002, ST-003, FLW-02, FLW-03 (JTBD-01, JRN-01/#4, JTBD-02, JRN-02/#3)
- **Entry point:** Cockpit do motorista (/app/motorista) e painel En Route do passageiro
- **Preconditions:** Corrida aceita com motorista a caminho ou no local de embarque
- **Steps:**
  1. Durante o deslocamento até o embarque, tanto o condutor quanto o passageiro visualizam na base do painel uma barra horizontal com respostas rápidas contextuais de 1 toque.
  2. O condutor toca no chip "Estou a caminho" ou "Pisca-alerta ligado", transmitindo a mensagem instantaneamente sem precisar abrir o chat em tela cheia e sem tirar os olhos do mapa viário.
  3. O passageiro visualiza o status no seu aplicativo e responde com 1 toque no chip "Estou descendo" ou "Aguardando na calçada".
  4. Ao receber a mensagem do passageiro, o Cockpit do condutor sintetiza o áudio em voz alta via Text-to-Speech (TTS), permitindo que o condutor ouça a mensagem com segurança durante a condução.
  5. O sistema aplica trava anti-flood de 2.5 segundos para evitar envios duplicados acidentais.
- **Expected result:** Comunicação ágil e segura entre passageiro e condutor, eliminando digitação arriscada no volante e reduzindo o tempo de espera no embarque em até 40%.
- **UI elements:** Barra deslizável InlineQuickReplyBar, chips com microinteração tátil, síntese de áudio DriverVoiceAssistant
- **States covered:** HEADING_REPLIES, ARRIVED_REPLIES, ON_TRIP_REPLIES, TTS_ACTIVE
- **Errors & recovery:** Em caso de perda momentânea de sinal de rede, a mensagem é armazenada na fila outbox local e enviada automaticamente após a reconexão.
- **Telemetry:** quick_reply_sent (ride_id, sender_type, text_id), tts_message_spoken (driver_id, text_length)
- **Status:** implemented
- **Coverage:** src/lib/chat/quick-canned-replies.ts:1-173, src/components/chat/InlineQuickReplyBar.tsx:1-130, src/components/driver/cockpit/states/HeadingToPickupState.tsx:85-110, src/components/driver/cockpit/states/WaitingPassengerState.tsx:150-180, src/components/passenger/DriverEnRouteSheet.tsx:1165-1190
- **Product:** unobserved

### SCN-031: Código PIN de 4 dígitos para embarque seguro de passageiros

- **Persona:** P-01, P-02
- **Feature:** Código PIN de Segurança no Embarque
- **Traces:** ST-002, FLW-02 (JTBD-01, JRN-01/#4, JTBD-02, JRN-02/#3)
- **Entry point:** Painel En Route do passageiro (/app) e Cockpit do condutor em estado WAITING_PIN (/app/motorista)
- **Preconditions:** Corrida de passageiro aceita com condutor no local de embarque ou política de segurança ativa
- **Steps:**
  1. O sistema gera um código numérico aleatório de 4 dígitos (exemplo: "4829") com segurança criptográfica e armazena no registro da corrida ativa.
  2. O aplicativo do passageiro exibe o PIN com 4 caixas em alto contraste visual (WCAG AAA) e botão rápido para copiar.
  3. Quando o motorista chega ao local de embarque (WAITING_PIN), o botão principal "DIGITAR PIN DO PASSAGEIRO" solicita os 4 números informados verbalmente pelo passageiro na calçada.
  4. O motorista toca no botão e visualiza o teclado numérico integrado com teclas ampliadas de 56px, digitando os 4 números sem sobreposição do teclado do sistema.
  5. O motor valida o PIN com proteção contra força bruta: caso 3 tentativas incorretas sejam feitas consecutivamente, ativa-se o bloqueio temporário de 5 minutos.
  6. Com o PIN validado com sucesso, o Cockpit dispara retorno tátil de confirmação, anúncio sonoro e avança instantaneamente para viagem em andamento (IN_PROGRESS).
- **Expected result:** Prevenção de embarque no veículo errado, falsos passageiros e corridas clandestinas.
- **UI elements:** 4 caixas de OTP no DriverEnRouteSheet, botão Digitar PIN do passageiro no WaitingPassengerState, modal de numpad veicular PassengerPinVerificationModal
- **States covered:** WAITING_PIN, PIN_VERIFYING, PIN_SUCCESS, PIN_LOCKED, IN_PROGRESS
- **Errors & recovery:** Caso o passageiro informe dígitos divergentes, tem até 3 tentativas antes do bloqueio temporário de 5 minutos.
- **Telemetry:** boarding_pin_verified (ride_id, success, attempts), boarding_pin_locked (ride_id, duration_seconds)
- **Status:** implemented
- **Coverage:** src/lib/security/boarding-pin-engine.ts:1-188, src/components/driver/cockpit/PassengerPinVerificationModal.tsx:1-291, src/components/driver/cockpit/states/WaitingPassengerState.tsx:1-341, src/components/passenger/DriverEnRouteSheet.tsx:1-1349
- **Product:** unobserved

### SCN-032: Solicitação de corrida para terceiros com link web ao vivo no WhatsApp

- **Persona:** P-01, P-02
- **Feature:** Corrida para Terceiros
- **Traces:** ST-001, ST-002, FLW-01, FLW-02 (JTBD-01, JRN-01/#1, JTBD-02, JRN-02/#3)
- **Entry point:** Seletor de passageiro na folha de revisão de rota do passageiro (/app)
- **Preconditions:** Passageiro cadastrado solicitando corrida para amigo, familiar ou colaborador
- **Steps:**
  1. Na tela de escolha de categoria e revisão de rota, o passageiro toca no chip de viajante e abre o modal "Quem vai viajar?".
  2. O passageiro alterna para a opção "Outra pessoa" e preenche o nome e telefone celular com WhatsApp do passageiro real.
  3. O sistema aplica máscara automática de telefone brasileiro (XX) 9XXXX-XXXX e valida o nome completo.
  4. Ao confirmar e solicitar a corrida, o sistema ativa automaticamente a obrigatoriedade do PIN de embarque para segurança de quem vai viajar.
  5. O aplicativo do passageiro titular exibe o card de envio rápido: com 1 toque, abre o WhatsApp com mensagem estruturada contendo nome do motorista, avaliação, modelo e cor do veículo, placa, código PIN e o link público de rastreamento no mapa ao vivo (/rastreio/:token).
  6. No Cockpit do condutor (HeadingToPickupState e WaitingPassengerState), é exibido o selo destacado com o nome de quem embarca e o nome de quem solicitou, e o botão de ligação telefônica disca diretamente para o celular de quem está na calçada.
- **Expected result:** O passageiro convidado acompanha o carro chegando em tempo real sem precisar de login, e o condutor identifica com exatidão quem irá embarcar.
- **UI elements:** Modal PassengerSelectionModal com alternador e máscara de telefone, card de compartilhamento WhatsApp no DriverEnRouteSheet, banner informativo no Cockpit do motorista
- **States covered:** SELECTING_PASSENGER, THIRD_PARTY_ACTIVE, WHATSAPP_SHARED, GUEST_BOARDING
- **Errors & recovery:** Caso o convidado não utilize WhatsApp, o titular pode copiar o texto da mensagem e o link web para envio por SMS.
- **Telemetry:** third_party_ride_requested (ride_id, guest_name_length), third_party_whatsapp_shared (ride_id)
- **Status:** implemented
- **Coverage:** src/lib/passenger/ride-for-third-party-engine.ts:1-151, src/components/passenger/route-sheet/PassengerSelectionModal.tsx:1-180, src/components/passenger/DriverEnRouteSheet.tsx:1-1529, src/components/driver/cockpit/states/WaitingPassengerState.tsx:1-341
- **Product:** unobserved

### SCN-033: Corridas agendadas com negociação bilateral e piso mínimo operacional

- **Persona:** P-01, P-02
- **Feature:** Corridas Agendadas com Negociação Bilateral
- **Traces:** ST-001, ST-002, FLW-01, FLW-02 (JTBD-01, JRN-01/#1, JTBD-02, JRN-02/#3)
- **Entry point:** Aba "Agendar" na barra de navegação de modalidades (/app/agendar) e Mural de Agendamentos no Cockpit do Motorista (/app/motorista)
- **Preconditions:** Passageiro autenticado solicitando corrida com no mínimo 30 minutos de antecedência
- **Steps:**
  1. O passageiro acessa a aba Agendar pelo seletor de modalidades inferior de 3 posições (Corrida, Entrega, Agendar).
  2. Na tela dedicada (/app/agendar), o passageiro preenche origem, destino, data e horário (com validação estrita de antecedência mínima de 30 minutos).
  3. O sistema calcula a tarifa base sugerida e o piso mínimo de custo operacional por quilômetro e tempo.
  4. O passageiro submete sua oferta, com validação anti-leilão predatório garantindo que a proposta cubra no mínimo o piso operacional da rota.
  5. A solicitação entra em status SOLICITADO e é transmitida aos motoristas parceiros da região no Mural de Agendamentos.
  6. O condutor parceiro pode aceitar imediatamente pelo valor proposto ou enviar uma contraproposta justificada (exemplo: pedágio ou retorno vazio).
  7. Havendo mútuo consentimento, a viagem é travada em AGENDADO e o sistema registra a régua automática de lembretes (24 horas, 2 horas e 30 minutos antes do embarque).
- **Expected result:** Garantia de previsibilidade para passageiros e viagens lucrativas sem taxas de intermediação (0% de comissão) para motoristas parceiros.
- **UI elements:** Seletor de modalidade ModeTabSelector com 3 abas, tela dedicada ScheduledRideFormScreen, modal de compromissos ScheduledRideListModal, drawer de oportunidades ScheduledRidesDrawer no Cockpit do motorista
- **States covered:** SOLICITADO, EM_NEGOCIACAO, AGENDADO, CANCELADO
- **Errors & recovery:** Tentativas de ofertas predatórias abaixo do piso operacional são barradas com alerta educativo instantâneo sobre a cobertura dos custos do parceiro.
- **Telemetry:** scheduled_ride_requested (ride_id, floor_brl, offered_brl), scheduled_ride_counter_offer (ride_id, counter_brl), scheduled_ride_confirmed (ride_id, final_brl)
- **Status:** implemented
- **Coverage:** src/lib/ride/scheduled-ride-engine.ts:1-350, src/components/navigation/ModeTabSelector.tsx:1-90, src/routes/app.agendar.tsx:1-90, src/components/schedule/ScheduledRideFormScreen.tsx:1-380, src/components/schedule/ScheduledRideListModal.tsx:1-300, src/components/driver/ScheduledRidesDrawer.tsx:1-330
- **Product:** unobserved

### SCN-034: Troco digital no acerto em dinheiro e bloqueio soberano de passageiro

- **Persona:** P-01, P-02
- **Feature:** Troco Digital no Acerto em Dinheiro e Bloqueio Soberano de Passageiro
- **Traces:** ST-002, ST-004, FLW-02, FLW-04 (JTBD-02, JRN-02/#4, JRN-02/#5)
- **Entry point:** Modal de Acerto da Corrida (RidePaymentSettlementModal) e Modal de Avaliação Mútua (RideRatingModal) no Cockpit do Motorista (/app/motorista)
- **Preconditions:** Corrida finalizada com acerto de pagamento em dinheiro ou avaliação pós-viagem
- **Steps:**
  1. Na finalização da corrida, o motorista seleciona a opção de pagamento em Dinheiro.
  2. O condutor informa a quantia recebida em espécie através do campo numérico ou chips de cédulas rápidas.
  3. O sistema calcula o troco exato instantaneamente.
  4. Caso haja troco pendente, o condutor pode optar por devolver troco físico em espécie ou acionar o botão de depósito digital 1 toque.
  5. Ao selecionar o troco digital, o valor é creditado imediatamente na carteira digital do passageiro com zero comissão retida pelo app.
  6. Na tela seguinte de avaliação mútua, o condutor pode marcar a opção soberana de bloqueio de usuário, escolhendo o motivo correspondente.
  7. O algoritmo de despacho em cascata suprime o par bloqueado de qualquer futura distribuição de chamadas, sem penalidade na taxa de aceitação do parceiro.
- **Expected result:** Eliminação do atrito de troco em corridas pagas em dinheiro e garantia de segurança psicológica ao condutor sem penalizações operacionais.
- **UI elements:** Calculadora de troco inteligente em RidePaymentSettlementModal, chips de notas sugeridas, botão de depósito digital de troco, seletor de bloqueio soberano com motivos em RideRatingModal
- **States covered:** DINHEIRO, TROCO_CALCULADO, TROCO_DIGITAL_DEPOSITADO, BLOQUEADO
- **Errors & recovery:** Valores em dinheiro inferiores ao total da corrida exibem alerta impeditivo informando a quantia faltante.
- **Telemetry:** digital_change_deposited (ride_id, change_brl, passenger_id), passenger_blocked (driver_id, passenger_id, reason_code)
- **Status:** implemented
- **Coverage:** src/lib/payment/digital-change-engine.ts:1-202, src/lib/driver/driver-blacklist-engine.ts:1-233, src/components/driver/RidePaymentSettlementModal.tsx:1-558, src/components/rating/RideRatingModal.tsx:1-344, src/services/DispatchQueueBuilder.ts:1-336
- **Product:** unobserved

### SCN-035: Alerta de aproximação de 500 metros no embarque e destino para motorista e passageiro

- **Persona:** P-01, P-02
- **Feature:** Alerta de Proximidade 500 Metros (Embarque e Destino)
- **Traces:** ST-001, ST-002, FLW-01, FLW-02 (JTBD-01, JRN-01/#3, JTBD-02, JRN-02/#3, JRN-02/#4)
- **Entry point:** Cockpit do Motorista (/app/motorista) e Folha de Viagem do Passageiro (DriverEnRouteSheet em /app)
- **Preconditions:** Corrida ativa nas etapas de deslocamento ao embarque (HEADING_TO_PICKUP) ou em viagem ao destino (IN_PROGRESS / ON_TRIP)
- **Steps:**
  1. Durante o deslocamento do condutor até o ponto de coleta, a telemetria geodésica monitora a distância em relação à origem.
  2. Ao cruzar o raio de 500 metros do embarque, o sistema dispara simultaneamente:
     a) No veículo do motorista: sinal sonoro dual-harmonic e anúncio por voz sintetizada ("Aproximação do embarque: 500 metros. Prepare-se para a chegada.") acompanhado de toast informativo.
     b) No celular do passageiro: sinal sonoro dual-harmonic, anúncio por voz sintetizada ("Seu motorista está se aproximando, a cerca de 500 metros. Prepare-se para o embarque.") e banner visual animado no topo da tela com opção de dispensa.
  3. O motor geofence garante acionamento estritamente único por etapa (idempotência), evitando alertas repetidos durante o tráfego.
  4. Após o embarque e início da viagem em direção ao destino final, o condutor e passageiro seguem em trajeto.
  5. Ao cruzar o raio de 500 metros do destino final, o sistema dispara a segunda etapa de proximidade:
     a) No veículo do motorista: sinal sonoro dual-harmonic, anúncio por voz sintetizada ("Aproximação do destino: 500 metros. Prepare-se para o desembarque.") e toast no cockpit.
     b) No celular do passageiro: sinal sonoro dual-harmonic, anúncio por voz sintetizada ("Aproximação do destino: 500 metros. Prepare-se para o desembarque.") e banner animado com lembrete de verificação de pertences.
- **Expected result:** O passageiro desce para o ponto de encontro com antecedência ideal reduzindo o tempo de espera do motorista, e desembarca com segurança e pontualidade sem esquecer pertences no veículo.
- **UI elements:** Banner animado de proximidade no DriverEnRouteSheet, toast contextual no Cockpit do motorista, emissão de áudio Web Audio API dual-harmonic
- **States covered:** HEADING_TO_PICKUP, IN_PROGRESS, ON_TRIP, PROXIMITY_ALERT_PICKUP, PROXIMITY_ALERT_DESTINATION
- **Errors & recovery:** Em caso de oscilação de GPS ou perda momentânea de sinal, o cálculo geodésico revalida a distância a cada pulso de telemetria sem duplicações de áudio.
- **Telemetry:** proximity_500m_triggered (ride_id, stage, distance_meters, timestamp)
- **Status:** implemented
- **Coverage:** src/lib/spatial/geofence-arrival-service.ts:1-239, src/lib/partiu-engine.ts:310-340, src/hooks/driver/useDriverVoiceAlerts.ts:1-134, src/routes/app.motorista.tsx:1200-1280, src/components/passenger/DriverEnRouteSheet.tsx:280-380
- **Product:** unobserved
