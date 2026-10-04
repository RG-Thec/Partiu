# UX Scenarios

<!-- Managed with super-ux (ux-contract v4). Update in the same change as any user-facing behavior change. -->

## Index

| ID | Title | Feature | Persona | Traces | Status | Last audit |
|----|-------|---------|---------|--------|--------|------------|
| SCN-001 | Solicitação de corrida com preço garantido | Solicitação de Viagem | P-01 | ST-001, FLW-01 (JTBD-01, JRN-01/#1) | implemented | 2026-10-02 |
| SCN-002 | Aceite de corrida no cockpit do motorista | Despacho de Corridas | P-02 | ST-002, FLW-02 (JTBD-02, JRN-02/#2) | implemented | 2026-10-02 |
| SCN-003 | Acompanhamento En Route e acionamento de SOS | Segurança em Viagem | P-01 | ST-003, FLW-03 (JTBD-01, JRN-01/#4) | implemented | 2026-10-02 |
| SCN-004 | Liquidação financeira instantânea via Pix | FinOps e Ledger | P-02 | ST-004, FLW-04 (JTBD-02, JRN-02/#5) | implemented | 2026-10-02 |
| SCN-005 | Onboarding e seleção de modalidade de cadastro | Onboarding e Acesso | P-01 | ST-005, FLW-05 (JTBD-01, JRN-01/#1) | implemented | 2026-10-02 |
| SCN-006 | Resiliência offline e preservação de estado da corrida | Resiliência e Rede | P-01 | ST-006, FLW-06 (JTBD-01, JRN-01/#3) | implemented | 2026-10-02 |
| SCN-007 | Consulta de histórico de viagens e envio de encomendas | Atividade e Encomendas | P-01 | ST-007, FLW-07 (JTBD-01, JRN-01/#5) | implemented | 2026-10-02 |
| SCN-008 | Telemetria executiva e despacho operacional administrativo | Governança e Operação | P-03 | ST-008, FLW-08 (JTBD-03, JRN-01/#2) | implemented | 2026-10-02 |

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
  1. O usuário visualiza a tela inicial e escolhe entre Entrar ou Criar Conta -> O sistema exibe o formulário de credenciais ou direciona para a seleção de modalidade.
  2. O usuário escolhe entre Passageiro ou Motorista Parceiro -> O formulário específico de cadastro é carregado com campos dedicados.
  3. O usuário preenche nome, telefone celular e credenciais seguras e submete o formulário -> A sessão é gerada no Supabase Auth e o perfil é direcionado ao fluxo correspondente.
- **Expected result:** Sessão de autenticação estabelecida e o usuário é redirecionado ao mapa de passageiro ou fluxo de verificação do motorista.
- **UI elements:** Botões de seleção de perfil, Formulário de login/cadastro, Input de telefone com máscara E.164, Botão Continuar
- **States covered:** success, error, loading
- **Errors & recovery:** Em caso de telefone duplicado ou senha inválida, mensagens de validação claras são exibidas ao lado de cada campo sem apagar os dados preenchidos.
- **Telemetry:** user_signed_up (role, auth_provider)
- **Status:** implemented
- **Coverage:** src/routes/auth.tsx:1-45
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
- **Expected result:** Painel operacional ao vivo com mapa geográfico de frotas atualizado e governança em tempo real.
- **UI elements:** Mapa de despacho ao vivo, Painel de estatísticas em tempo real, Tabela de chamadas ativas, Botões de ação rápida e filtros
- **States covered:** success, loading, error
- **Errors & recovery:** Se o canal WebSocket em tempo real sofrer desconexão, o painel alterna automaticamente para polling HTTP a cada 5 segundos e alerta o operador no cabeçalho.
- **Telemetry:** admin_dispatch_audit (action_type, target_ride_id)
- **Status:** implemented
- **Coverage:** src/routes/app.admin.despacho.tsx:1-150
- **Product:** unobserved
