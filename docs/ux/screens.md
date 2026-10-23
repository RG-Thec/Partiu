# UI Screen Registry

<!-- Managed with super-ux (ux-contract v4). The design map: every screen and
state with its Figma frame, wireframe, code coverage, and related UX/UI
resources. Update in the same change as any interface change; when Figma is
enabled, update the frame and re-verify its link in the same change. A screen
whose code diverges from its record here is a "drifted" finding. -->

## Index

| ID     | Screen                                       | Used by                        | Figma                                                                                           | Status | Coverage                                                    |
| ------ | -------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------- |
| SCR-01 | Tela Inicial e Landing Page                  | FLW-05                         | [Figma Home](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:2114)             | built  | src/routes/index.tsx:1-39                                   |
| SCR-02 | Tela de Carregamento e Splash                | FLW-05                         | [Figma Splash](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:1946)           | built  | src/components/branding/SplashScreen.tsx:1-200              |
| SCR-03 | Tela de Login e Autenticação Unificada       | FLW-05                         | [Figma Login](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:2057)            | built  | src/routes/auth.tsx:1-45                                    |
| SCR-04 | Seleção de Modalidade de Cadastro            | FLW-05                         | [Figma Intro](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:1949)            | built  | src/routes/escolher-tipo-cadastro.tsx:1-120                 |
| SCR-05 | Cadastro de Passageiro                       | FLW-05                         | [Figma Register](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:2513)         | built  | src/routes/cadastro-passageiro.tsx:1-150                    |
| SCR-06 | Cadastro de Motorista Parceiro               | FLW-05                         | [Figma Driver KYC](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=70:602)          | built  | src/routes/cadastro-motorista.tsx:1-200                     |
| SCR-07 | Banner de Resiliência de Rede e Modo Offline | FLW-06                         | [Figma Offline](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:3256)          | built  | src/components/passenger/NetworkReconnectionBanner.tsx:1-96 |
| SCR-08 | Mapa e Solicitação de Viagem                 | FLW-01, FLW-06                 | [Figma Home Ride](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:2114)        | built  | src/routes/app.index.tsx:1-200                              |
| SCR-09 | Experiência En Route                         | FLW-01, FLW-02, FLW-03         | [Figma Ride Started](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:3254)     | built  | src/components/passenger/DriverEnRouteSheet.tsx:1-150       |
| SCR-10 | Central de SOS e Emergência                  | FLW-03                         | [Figma Customer Support](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:3246) | built  | src/routes/app.sos.tsx:1-100                                |
| SCR-11 | Bilhetes e Histórico de Atividade            | FLW-07                         | [Figma Ride History](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:3253)     | built  | src/routes/app.bilhetes.tsx:1-150                           |
| SCR-12 | Envio de Encomendas Expressas                | FLW-07                         | [Figma Delivery Details](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:3252) | built  | src/routes/app.encomendas.tsx:1-120                         |
| SCR-13 | Perfil do Passageiro                         | FLW-07                         | [Figma Profile](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:3249)          | built  | src/routes/app.perfil.tsx:1-150                             |
| SCR-14 | Cockpit Operacional do Motorista             | FLW-01, FLW-02, FLW-04, FLW-06 | [Figma Driver Home](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=79:1634)        | built  | src/routes/app.motorista.tsx:1-200                          |
| SCR-15 | Painel Administrativo Geral e Layout         | FLW-08                         | [Figma Admin Home](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=2010:918)        | built  | src/routes/app.admin.tsx:1-150                              |
| SCR-16 | Dashboard Executivo e Telemetria             | FLW-08                         | [Figma Admin Home](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=2010:918)        | built  | src/routes/app.admin.index.tsx:1-150                        |
| SCR-17 | Central de Despacho e Operação ao Vivo       | FLW-08                         | [Figma Admin Map](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=2011:1124)        | built  | src/routes/app.admin.despacho.tsx:1-150                     |
| SCR-18 | Gestão de Motoristas e Frota                 | FLW-08                         | [Figma Driver Mgmt](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:886)       | built  | src/routes/app.admin.motoristas.tsx:1-150                   |
| SCR-19 | Gestão de Passageiros                        | FLW-08                         | [Figma User Data](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:883)         | built  | src/routes/app.admin.passageiros.tsx:1-150                  |
| SCR-20 | Gestão Financeira e Caixa D+0                | FLW-02, FLW-04                 | [Figma Withdrawal](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:901)        | built  | src/routes/app.admin.financeiro.tsx:1-200                   |
| SCR-21 | Estúdio White Label                          | FLW-08                         | [Figma Admin Theme](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=2010:918)       | built  | src/routes/app.admin.whitelabel.tsx:1-200                   |
| SCR-22 | Central de Incidentes SOS Admin              | FLW-03                         | [Figma Customer Chats](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:884)    | built  | src/routes/app.admin.sos.tsx:1-150                          |
| SCR-23 | Configurações Globais do Sistema             | FLW-08                         | [Figma Admin Config](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=2010:918)      | built  | src/routes/app.admin.configuracoes.tsx:1-200                |
| SCR-24 | Diagnóstico Geoespacial & WebGL              | FLW-08                         | [Figma Admin Map](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=2011:1124)        | built  | src/routes/app.admin.diagnostico.tsx:1-187                  |
| SCR-25 | Gestão Central de Franqueados & Multi-Tenant | FLW-08                         | [Figma Admin Home](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=2010:918)        | built  | src/routes/app.admin.franqueados.tsx:1-1200                 |
| SCR-26 | Agendamento de Corridas com Acordo Direto    | FLW-01                         | [Figma Ride Details](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:3252)     | built  | src/routes/app.agendar.tsx:1-90                             |
| SCR-27 | Franquia Mãe — Matriz Nacional Holding       | FLW-08                         | [Figma Admin Home](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=2010:918)        | built  | src/routes/app.admin.matriz.tsx:1-800                       |

## Design system

- **Style pack:** DriveLux & Caber Executive Mobility Design Pack
- **Design reference:** DriveLux Executive Design System (Rent. Drive. Explore.) & [Caber Community](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443/FREE-Caber--Uber-Like-App-UI--Community-)
- **Tokens in code:** src/styles.css, WhiteLabelThemeContext
- **Component source:** src/components/
- **Assets:** src/assets/

## Web surfaces

- **Web surfaces:** no

## Screens

### SCR-01: Tela Inicial e Landing Page

- **Used by:** FLW-05 step 1
- **Purpose:** Apresentar a proposta de valor essencial e converter novos passageiros e condutores com padrão executivo empresarial e zero carga cognitiva
- **Elements:** Header em ilha de vidro flutuante, Hero minimalista mobile-first com iluminação sutil White Label, CTAs primários em pílulas executivas com efeito shimmer (Pedir corrida / Dirigir com o Partiu), Bento-grid de prova social (avaliação 4.9, tempo < 3min e 100% SOS), showcase interativo com seletor de categorias em ícones circulares e card de veículo com tarifa fixada instantânea
- **States:**
  | State   | Trigger                    | Figma frame       | Behavior                                                                                  |
  | ------- | -------------------------- | ----------------- | ----------------------------------------------------------------------------------------- |
  | success | padrão                     | none — code first | Exibe a landing institucional com cores dinâmicas do White Label e navegação mobile-first |
  | loading | carregando dados da cidade | none — code first | Skeleton nos cards de cotação                                                             |
  | error   | falha de conexão           | none — code first | Mensagem de contingência mantendo botões funcionais                                       |
- **Coverage:** src/routes/index.tsx:1-39, src/components/landing/LandingHero.tsx:1-498
- **Scenarios:** SCN-005
- **Resources:** src/components/landing/, useBrandTheme
- **Status:** built

### SCR-02: Tela de Carregamento e Splash

- **Used by:** FLW-05 step 2
- **Purpose:** Inicializar sessão segura e carregar recursos com feedback ágil e transição de 550ms
- **Elements:** Emblema em squircle minimalista White Label com pulso suave, barra de progresso ultrafina e fade-out fluido
- **States:**
  | State   | Trigger          | Figma frame       | Behavior                                                      |
  | ------- | ---------------- | ----------------- | ------------------------------------------------------------- |
  | success | dados carregados | none — code first | Fade-out suave em 220ms transicionando para a tela solicitada |
  | loading | em progresso     | none — code first | Barra animada de 0 a 100% com curva acelerada (~550ms)        |
  | error   | falha crítica    | none — code first | Exibe opção de recarregar a aplicação                         |
- **Coverage:** src/components/branding/SplashScreen.tsx:1-170
- **Scenarios:** SCN-005
- **Resources:** useBranding, useBrandTheme
- **Status:** built

### SCR-03: Tela de Login e Autenticação Unificada

- **Used by:** FLW-05 step 3
- **Purpose:** Entrada simplificada por celular ou e-mail com alternância fluida entre passageiro e motorista parceiro (Dark Cockpit)
- **Elements:** Campo inteligente de contato com formatação BR automática, botão Continuar, toggle de alternância de perfil, card Dark Cockpit de alto contraste para motorista
- **States:**
  | State   | Trigger                  | Figma frame       | Behavior                                                 |
  | ------- | ------------------------ | ----------------- | -------------------------------------------------------- |
  | success | credenciais válidas      | none — code first | Redireciona para o cockpit ou mapa conforme a role       |
  | error   | credenciais inválidas    | none — code first | Alerta visual discreto com instrução de recuperação      |
  | loading | autenticando no Supabase | none — code first | Botão com spinner de carregamento e campos desabilitados |
- **Coverage:** src/routes/auth.tsx:1-50, src/components/auth/PartiuAppAuthGate.tsx:1-1546
- **Scenarios:** SCN-005
- **Resources:** supabaseAuthService, PartiuAppAuthGate
- **Status:** built

### SCR-04: Seleção de Modalidade de Cadastro

- **Used by:** FLW-05 step 4
- **Purpose:** Permitir a escolha consciente entre cadastro de passageiro ou parceiro
- **Elements:** Card Passageiro, Card Motorista/Entregador, Header com botão voltar
- **States:**
  | State   | Trigger | Figma frame       | Behavior                                                     |
  | ------- | ------- | ----------------- | ------------------------------------------------------------ |
  | success | padrão  | none — code first | Exibe opções com descrições de benefícios e ícones temáticos |
- **Coverage:** src/routes/escolher-tipo-cadastro.tsx:1-120
- **Scenarios:** SCN-006
- **Resources:** NativeSurface, NativeRipple
- **Status:** built

### SCR-05: Cadastro de Passageiro

- **Used by:** FLW-05 step 5
- **Purpose:** Coleta limpa e direta de nome, telefone, e-mail, senha e foto de identificação para passageiros sem etapas fantasmas
- **Elements:** Campos de formulário com máscaras automáticas, captura integrada de selfie de identificação, checkbox de WhatsApp, botão de ação primária "Criar minha conta" e ação secundária "Entrar", tela de sucesso com opções "Ir para o login" e "Acessar aplicativo"
- **States:**
  | State   | Trigger                       | Figma frame       | Behavior                                                             |
  | ------- | ----------------------------- | ----------------- | -------------------------------------------------------------------- |
  | success | conta criada                  | none — code first | Confirmação exibindo opções "Ir para o login" e "Acessar aplicativo" |
  | error   | CPF ou telefone já cadastrado | none — code first | Alerta explicativo não intrusivo com link para recuperação           |
  | loading | processando cadastro          | none — code first | Indicador de envio com spinner no botão de confirmação               |
- **Coverage:** src/routes/cadastro-passageiro.tsx:1-488, src/components/auth/PartiuAppAuthGate.tsx:1-1546
- **Scenarios:** SCN-005
- **Resources:** supabaseAuthService, useGeolocation
- **Status:** built

### SCR-06: Cadastro de Motorista Parceiro

- **Used by:** FLW-05 step 6
- **Purpose:** Onboarding limpo em 3 etapas estratégicas para envio de dados pessoais, veículo, CNH com EAR, CRLV e repasse Pix com validação OCR em tempo real
- **Elements:** Stepper de progresso em 3 etapas (Dados Pessoais, Veículo, Habilitação & Repasse), dropzone compacta de documentos com leitura ótica OCR instantânea da CNH, badge de conferência visual e score de precisão, formulário do veículo e dados PIX, bloco de ações de alta visibilidade sem overflow com botão primário "Finalizar cadastro" e link secundário "Entrar", tela de sucesso com opções "Ir para o login" e "Acessar cockpit"
- **States:**
  | State   | Trigger                             | Figma frame       | Behavior                                                                         |
  | ------- | ----------------------------------- | ----------------- | -------------------------------------------------------------------------------- |
  | success | documentos enviados                 | none — code first | Confirmação com status em análise e opções "Ir para o login" e "Acessar cockpit" |
  | error   | documento ilegível ou inválido      | none — code first | Alerta no campo com orientação de novo envio                                     |
  | loading | fazendo upload de fotos ou salvando | none — code first | Barra de progresso e spinner no botão de confirmação                             |
- **Coverage:** src/routes/cadastro-motorista.tsx:1-1150, src/lib/kyc/driver-ocr-engine.ts:1-250
- **Scenarios:** SCN-005, SCN-029
- **Resources:** driverFleetService, Supabase Storage, DriverOcrEngine
- **Status:** built

### SCR-07: Banner de Resiliência de Rede e Modo Offline

- **Used by:** FLW-06 step 1, FLW-12 step 1
- **Purpose:** Informar o estado de conexão e manter buscas/corridas ativas sem ansiedade
- **Elements:** Alerta não-intrusivo de reconexão, ícone de wifi, confirmação de conexão restabelecida, motor de persistência offline Zero-Drop
- **States:**
  | State   | Trigger            | Figma frame       | Behavior                                             |
  | ------- | ------------------ | ----------------- | ---------------------------------------------------- |
  | success | rede restabelecida | none — code first | Mensagem verde de 2 segundos confirmando reconexão   |
  | error   | sem sinal celular  | none — code first | Aviso discreto informando que a busca continua ativa |
- **Coverage:** src/components/passenger/NetworkReconnectionBanner.tsx:1-102, src/lib/offline/zero-drop-sync.ts:1-245
- **Scenarios:** SCN-008, SCN-017
- **Resources:** RealtimeConnectionManager, ZeroDropSyncEngine
- **Status:** built

### SCR-08: Mapa e Solicitação de Viagem

- **Used by:** FLW-01 step 1, FLW-06 step 2
- **Purpose:** Permitir ao passageiro escolher destino, categoria e confirmar corrida imediata
- **Elements:** Header superior translúcido com avatar, mapa Mapbox GL com visão ampla, seletor de modalidade (Corrida / Entrega), botão circular de recentralizar GPS, card flutuante "Para onde vamos?"
- **States:**
  | State   | Trigger                         | Figma frame       | Behavior                                                          |
  | ------- | ------------------------------- | ----------------- | ----------------------------------------------------------------- |
  | success | default                         | none — code first | Exibe mapa limpo com veículos próximos e categorias disponíveis   |
  | empty   | nenhum motorista online         | none — code first | Informa ausência temporária de veículos no raio e sugere aguardar |
  | error   | falha de geocodificação ou rede | none — code first | Mensagem de erro amigável com botão de tentar novamente           |
  | loading | calculando rotas e tarifas      | none — code first | Skeleton nos cards de categoria e traçado animado no mapa         |
- **Coverage:** src/routes/app.index.tsx:1-853, src/components/home/Header.tsx:1-161, src/components/common/PartiuLogo.tsx:1-240, src/components/home/DestinationCard.tsx:1-183, src/components/navigation/ModeTabSelector.tsx:1-65, src/components/passenger/PassengerConfirmPickupPin.tsx:1-150, src/lib/passenger/smart-pickups.ts:1-169, src/components/passenger/route-sheet/PassengerSelectionModal.tsx:1-180, src/lib/passenger/ride-for-third-party-engine.ts:1-151
- **Scenarios:** SCN-001, SCN-021, SCN-022, SCN-028, SCN-032
- **Resources:** src/components/map/, Mapbox GL, Supabase, SmartPickupsEngine
- **Status:** built

### SCR-09: Experiência En Route

- **Used by:** FLW-01 step 5, FLW-02 step 3, FLW-03 step 1
- **Purpose:** Acompanhamento da corrida em tempo real com projeção suave na via a 60 FPS, dados do motorista/veículo, timeline de paradas intermediárias, barra de respostas rápidas de 1 toque e botão SOS
- **Elements:** Mapa com Snap to Route, Bottom Sheet com dados do veículo e condutor, timeline com status das paradas intermediárias, barra de respostas rápidas de 1 toque (InlineQuickReplyBar), chat integrado, botão vermelho SOS 190
- **States:**
  | State   | Trigger                        | Figma frame       | Behavior                                                               |
  | ------- | ------------------------------ | ----------------- | ---------------------------------------------------------------------- |
  | success | viagem em andamento            | none — code first | Atualização contínua do trajeto com tempo estimado de chegada dinâmico |
  | empty   | aguardando início da rota      | none — code first | Indicador de motorista a caminho com tempo estimado de embarque        |
  | error   | perda temporária de telemetria | none — code first | Banner discreto de reconexão sem interromper o mapa                    |
  | loading | traçando rota inicial          | none — code first | Linha guia calculando melhor rota de tráfego                           |
- **Coverage:** src/components/passenger/DriverEnRouteSheet.tsx:1-1529, src/components/passenger/SafetyCenterModal.tsx:1-380, src/lib/geo/polyline-optimizer.ts:1-210, src/lib/passenger/multi-stop-engine.ts:1-210, src/lib/chat/quick-canned-replies.ts:1-173, src/components/chat/InlineQuickReplyBar.tsx:1-130, src/lib/security/boarding-pin-engine.ts:1-188, src/lib/passenger/ride-for-third-party-engine.ts:1-151, src/lib/spatial/geofence-arrival-service.ts:1-239
- **Scenarios:** SCN-003, SCN-020, SCN-021, SCN-022, SCN-025, SCN-026, SCN-027, SCN-030, SCN-031, SCN-032, SCN-035
- **Resources:** Mapbox GL, PostGIS, Realtime Channel, SafetyToolkitService, PolylineOptimizer, MultiStopEngine, QuickCannedRepliesEngine
- **Status:** built

### SCR-10: Central de SOS e Emergência

- **Used by:** FLW-03 step 1
- **Purpose:** Disparar protocolos de segurança operacional, discagem direta para 190 e compartilhamento de link de rastreamento com contatos
- **Elements:** Botão Discar 190, botão Compartilhar Localização ao Vivo, status do canal de monitoramento operacional
- **States:**
  | State   | Trigger                         | Figma frame       | Behavior                                                    |
  | ------- | ------------------------------- | ----------------- | ----------------------------------------------------------- |
  | success | canal ativo                     | none — code first | Opções de emergência prontas para acionamento em 1 clique   |
  | empty   | nenhum alerta ativo             | none — code first | Status seguro com orientações de prevenção                  |
  | error   | sem sinal celular para discagem | none — code first | Instrução de envio de SMS de emergência com coordenadas GPS |
  | loading | enviando telemetria prioritária | none — code first | Confirmação de transmissão de dados em lote                 |
- **Coverage:** src/routes/app.sos.tsx:1-100, src/lib/security/safety-toolkit-service.ts:1-350
- **Scenarios:** SCN-003, SCN-025
- **Resources:** Web API Geolocation, Tel URI
- **Status:** built

### SCR-11: Bilhetes e Histórico de Atividade

- **Used by:** FLW-07 step 1
- **Purpose:** Consulta de viagens anteriores, recibos detalhados e bilhetes emitidos
- **Elements:** Filtros de corridas e encomendas, lista de cards com data e valor, visualizador de recibo
- **States:**
  | State   | Trigger                | Figma frame       | Behavior                                            |
  | ------- | ---------------------- | ----------------- | --------------------------------------------------- |
  | success | dados carregados       | none — code first | Lista detalhada de atividades com rota e valor pago |
  | empty   | sem viagens realizadas | none — code first | Ilustração suave convidando para a primeira corrida |
  | error   | falha de requisição    | none — code first | Card de erro amigável com botão Tentar Novamente    |
  | loading | buscando histórico     | none — code first | Skeletons simulando os cards de corrida             |
- **Coverage:** src/routes/app.bilhetes.tsx:1-150
- **Scenarios:** SCN-009
- **Resources:** rideService
- **Status:** built

### SCR-12: Envio de Encomendas Expressas

- **Used by:** FLW-07 step 2
- **Purpose:** Solicitação de entregas expressas com duplo PIN de segurança na coleta e entrega
- **Elements:** Campos de destinatário, telefone, endereço de entrega, seletor de porte do pacote, botão Solicitar Entrega
- **States:**
  | State   | Trigger                    | Figma frame       | Behavior                                            |
  | ------- | -------------------------- | ----------------- | --------------------------------------------------- |
  | success | entrega despachada         | none — code first | Exibe o PIN de coleta e rota do entregador parceiro |
  | error   | endereço fora de cobertura | none — code first | Aviso delimitando a área urbana atendida            |
  | loading | calculando frete           | none — code first | Indicador de cotação por distância                  |
- **Coverage:** src/routes/app.encomendas.tsx:1-120
- **Scenarios:** SCN-009
- **Resources:** deliveryService
- **Status:** built

### SCR-13: Perfil do Passageiro

- **Used by:** FLW-07 step 3
- **Purpose:** Gestão de dados cadastrais, preferências de viagem e opção de logout
- **Elements:** Foto de perfil com upload, campos de contato, toggles de acessibilidade, botão Sair da Conta
- **States:**
  | State   | Trigger               | Figma frame       | Behavior                                               |
  | ------- | --------------------- | ----------------- | ------------------------------------------------------ |
  | success | perfil carregado      | none — code first | Visualização de dados cadastrais e preferências ativas |
  | error   | falha ao salvar dados | none — code first | Alerta visual informando inconsistência no formulário  |
  | loading | salvando alterações   | none — code first | Botão com indicador de salvamento ativo                |
- **Coverage:** src/routes/app.perfil.tsx:1-150
- **Scenarios:** SCN-009
- **Resources:** userService
- **Status:** built

### SCR-14: Cockpit Operacional do Motorista

- **Used by:** FLW-01 step 6, FLW-02 step 1, FLW-04 step 1, FLW-06 step 3, FLW-09 step 1, FLW-12 step 2, FLW-13 step 1
- **Purpose:** Fornecer ao motorista parceiro controle do modo online, recebimento de chamadas com ganho líquido e métricas diárias com visão desobstruída, chamadas em cadeia, navegação externa com 1 toque, zonas de exclusão pessoal, chip rápido de rota para casa, Áudio HUD, suporte operacional a múltiplas paradas e barra hands-free de respostas rápidas de 1 toque
- **Elements:** Barra superior ergonômica com avatar unificado e indicador de menu, widget central de ganhos do dia com taxa zero e repasse Pix D+0, status online/offline, botão de preferências rápidas do cockpit com modal de ajustes de som, modo noturno e áudio HUD, sino de notificações com badge, modal de oferta zero-scroll com temporizador regressivo de 15s e slider de confirmação de 56px, mapa vetorial com iluminação adaptativa diurna/noturna, atalhos flutuantes e inline para Waze e Google Maps, card de chamadas em cadeia (back-to-back dispatch) para próxima corrida com contagem regressiva, banner de integridade física GNSS (Mock Location Shield), banner de modo de tolerância da diária SaaS com botão de quitação via Pix, chip rápido de rota para casa (`DestinationQuickChip`), botão e modal de zonas de exclusão pessoal (`ExclusionZonesModal`), alternador de Áudio HUD com sintetizador de voz (`AudioHudToggle`), banner de parada intermediária ativa com slider de conclusão/pulo de parada, barra horizontal deslizável de respostas rápidas contextuais (InlineQuickReplyBar) e áudio TTS para leitura de mensagens de entrada, botão ergonômico de cancelamento com alvo tátil de 40px, calculadora de troco inteligente para pagamentos em espécie e orientações de troco físico ou Pix direto com 0% taxa (RidePaymentSettlementModal), seletor de bloqueio soberano pós-corrida com motivos em RideRatingModal
- **States:**
  | State   | Trigger                     | Figma frame       | Behavior                                                        |
  | ------- | --------------------------- | ----------------- | --------------------------------------------------------------- |
  | success | condutor online             | none — code first | Mapa ativo com radar unificado e aguardo silencioso de chamadas |
  | empty   | condutor offline            | none — code first | Painel em repouso com resumo das corridas anteriores            |
  | error   | GPS desativado ou sem sinal | none — code first | Alerta visual solicitando ativação do serviço de localização    |
  | loading | conectando ao despacho      | none — code first | Spinner sutil de sincronização com o cluster PostGIS            |
- **Coverage:** src/routes/app.motorista.tsx:1-2973, src/components/driver/cockpit/DriverHeader.tsx:1-219, src/components/driver/cockpit/DriverQuickPreferencesModal.tsx:1-299, src/components/driver/DriverOfferModal.tsx:1-412, src/components/driver/cockpit/states/IdleState.tsx:1-244, src/components/driver/cockpit/states/HeadingToPickupState.tsx:1-178, src/components/driver/cockpit/states/WaitingPassengerState.tsx:1-345, src/components/driver/cockpit/states/InTripState.tsx:1-274, src/components/driver/navigation/DriverDrawer.tsx:1-662, src/components/driver/ExternalNavigationButton.tsx:1-155, src/components/driver/BackToBackRideCard.tsx:1-124, src/components/driver/MockLocationBanner.tsx:1-40, src/components/driver/SaaSToleranceBanner.tsx:1-45, src/components/driver/DestinationQuickChip.tsx:1-61, src/components/driver/ExclusionZonesModal.tsx:1-252, src/components/driver/AudioHudToggle.tsx:1-57, src/components/driver/cockpit/DriverSosModal.tsx:1-249, src/components/driver/ScheduledRidesDrawer.tsx:1-402, src/components/driver/DriverFinancialDashboardModal.tsx:1-562, src/components/driver/VirtualTaximeterModal.tsx:1-464, src/components/driver/DailyFeePaymentScreen.tsx:1-321, src/components/driver/DriverSubscriptionScreen.tsx:1-699, src/components/driver/DriverProfileSettings.tsx:1-707, src/components/driver/DriverCancelBottomSheet.tsx:1-191, src/components/driver/DeliveryPinNumpadBottomSheet.tsx:1-379, src/lib/passenger/multi-stop-engine.ts:1-210, src/lib/chat/quick-canned-replies.ts:1-173, src/components/chat/InlineQuickReplyBar.tsx:1-130, src/components/driver/cockpit/PassengerPinVerificationModal.tsx:1-295, src/lib/security/boarding-pin-engine.ts:1-188, src/lib/payment/digital-change-engine.ts:1-202, src/lib/driver/driver-blacklist-engine.ts:1-233, src/components/driver/RidePaymentSettlementModal.tsx:1-564, src/components/rating/RideRatingModal.tsx:1-344, src/components/driver/SubscriptionSuccessModal.tsx:1-169, src/components/driver/cockpit/DriverDeliveryModals.tsx:1-257, src/components/driver/DriverWelcomeGate.tsx:1-178, src/components/driver/cockpit/DriverApprovalAlert.tsx:1-108, src/components/driver/cockpit/DriverDailyPassBanner.tsx:1-72, src/components/driver/cockpit/DriverSlideAction.tsx:1-118
- **Scenarios:** SCN-002, SCN-013, SCN-014, SCN-017, SCN-018, SCN-019, SCN-020, SCN-021, SCN-022, SCN-023, SCN-024, SCN-025, SCN-026, SCN-027, SCN-030, SCN-031, SCN-032, SCN-034, SCN-035
- **Resources:** src/components/driver/, Supabase Realtime, MockLocationShield, BackToBackEngine, SaaSToleranceEngine, DriverExclusionZonesEngine, DriverAudioHudEngine, ExternalNavigationService, SafetyToolkitService, PolylineOptimizer, MultiStopEngine, QuickCannedRepliesEngine, DigitalChangeEngine, DriverBlacklistEngine
- **Status:** built

### SCR-15: Painel Administrativo Geral e Layout

- **Used by:** FLW-08 step 1
- **Purpose:** Navegação entre os 6 módulos centrais de gestão regional e login administrativo
- **Elements:** Sidebar com RBAC, badge de perfil autenticado (somente leitura), notificações de sistema, botão de logout admin
- **States:**
  | State   | Trigger               | Figma frame       | Behavior                                                 |
  | ------- | --------------------- | ----------------- | -------------------------------------------------------- |
  | success | autenticado           | none — code first | Estrutura de navegação limpa e responsiva                |
  | error   | acesso não autorizado | none — code first | Redirecionamento com mensagem de credencial insuficiente |
- **Coverage:** src/routes/app.admin.tsx:1-150
- **Scenarios:** SCN-010
- **Resources:** admin-rbac, WhiteLabelThemeContext
- **Status:** built

### SCR-16: Dashboard Executivo e Telemetria

- **Used by:** FLW-08 step 2, FLW-11 step 3
- **Purpose:** Visualização de KPIs ao vivo, receita diária, contagem de frotas e mapa integrado com acesso direto a ações de reengajamento de usuários inativos
- **Elements:** Cards de métricas financeiras e operacionais, UniversalMapView com cluster de veículos, botão de ação CRM Reengajamento, modal de disparo de cupons e isenções para passageiros e motoristas inativos há mais de 7 dias
- **States:**
  | State   | Trigger              | Figma frame       | Behavior                                                  |
  | ------- | -------------------- | ----------------- | --------------------------------------------------------- |
  | success | dados em tempo real  | none — code first | Painel com KPIs atualizados instantaneamente via Supabase |
  | loading | consultando métricas | none — code first | Skeletons nos blocos de indicadores                       |
- **Coverage:** src/routes/app.admin.index.tsx:1-475, src/components/admin/ReengagementCrmModal.tsx:1-129
- **Scenarios:** SCN-010, SCN-016
- **Resources:** partiu-db, UniversalMapView, ReengagementCrmModal
- **Status:** built

### SCR-17: Central de Despacho e Operação ao Vivo

- **Used by:** FLW-08 step 3, FLW-10 step 1
- **Purpose:** Monitoramento cartográfico das corridas em andamento, parâmetros do algoritmo de busca progressiva, tarifas dinâmicas com IA, Live Override e torre de controle com mapa de calor preditivo
- **Elements:** Lista de corridas em rota, mapa com rotas ativas, tabela de condutores disponíveis, Card de Inteligência de Demanda Automática (Uber/99) com switch de ativação, Card de Sobretaxa Administrativa Imediata (Live Override), botão Demanda Preditiva com modal de clusters de demanda e disparo de alertas de incentivo
- **States:**
  | State   | Trigger                 | Figma frame       | Behavior                                                                           |
  | ------- | ----------------------- | ----------------- | ---------------------------------------------------------------------------------- |
  | success | operação ativa          | none — code first | Rastreamento em lote das corridas ativas e governança de multiplicadores dinâmicos |
  | empty   | sem corridas no momento | none — code first | Indicador de tranquilidade operacional com tarifa padrão (1.0x)                    |
- **Coverage:** src/routes/app.admin.despacho.tsx:1-2037, src/components/admin/PredictiveHeatmapModal.tsx:1-260, src/lib/spatial/predictive-demand-engine.ts:1-320
- **Scenarios:** SCN-008, SCN-009, SCN-015
- **Resources:** PostGIS, Dispatch Engine, SurgeEngine, PredictiveDemandEngine, PredictiveHeatmapModal
- **Status:** built

### SCR-18: Gestão de Motoristas e Frota

- **Used by:** FLW-08 step 4, FLW-11 step 1
- **Purpose:** Auditoria documental de condutores, moderação de CNH com validação expressa por OCR, veículos credenciados e status
- **Elements:** Tabela de motoristas com filtros de status, modal de inspeção de documentos, botão OCR CNH na listagem de pendentes com modal de conferência assistida dos dados extraídos e homologação em 1 clique, botões Aprovar e Bloquear
- **States:**
  | State   | Trigger             | Figma frame       | Behavior                                        |
  | ------- | ------------------- | ----------------- | ----------------------------------------------- |
  | success | lista de condutores | none — code first | Visão de frotas com indicadores de conformidade |
  | loading | buscando base       | none — code first | Skeleton nos registros da tabela                |
- **Coverage:** src/routes/app.admin.motoristas.tsx:1-2129, src/components/admin/DriverKycFastApprovalModal.tsx:1-134, src/lib/kyc/driver-ocr-engine.ts:1-250
- **Scenarios:** SCN-010, SCN-016, SCN-029
- **Resources:** driverFleetService, DriverKycFastApprovalModal, DriverOcrEngine
- **Status:** built

### SCR-19: Gestão de Passageiros

- **Used by:** FLW-08 step 5
- **Purpose:** Consulta da base de passageiros cadastrados, bloqueios preventivos e histórico de chamados
- **Elements:** Tabela de usuários com busca por telefone/nome, modal de histórico de corridas
- **States:**
  | State   | Trigger        | Figma frame       | Behavior                                           |
  | ------- | -------------- | ----------------- | ----------------------------------------------- |
  | success | base carregada | none — code first | Listagem com filtros por cidade e data de cadastro |
- **Coverage:** src/routes/app.admin.passageiros.tsx:1-1129
- **Scenarios:** SCN-010
- **Resources:** passengerService
- **Status:** built

### SCR-20: Gestão Financeira e Caixa D+0

- **Used by:** FLW-02 step 5, FLW-04 step 1
- **Purpose:** Apresentar detalhamento tarifário, confirmação de liquidação instantânea via Pix e divisão de split contábil
- **Elements:** Resumo de valor cobrado, taxa operacional deduzida, crédito líquido transferido, botão de baixar comprovante
- **States:**
  | State   | Trigger                 | Figma frame       | Behavior                                                           |
  | ------- | ----------------------- | ----------------- | ------------------------------------------------------------------ |
  | success | pagamento liquidado     | none — code first | Comprovante verde de liquidação com detalhes das partidas dobradas |
  | empty   | sem transações recentes | none — code first | Extrato vazio com convite para iniciar nova corrida                |
  | error   | falha de autorização    | none — code first | Notificação clara com solicitação de método alternativo            |
  | loading | processando webhook Pix | none — code first | Indicador de confirmação bancária em tempo real                    |
- **Coverage:** src/routes/app.admin.financeiro.tsx:1-200
- **Scenarios:** SCN-004
- **Resources:** Supabase Ledger, Gateway Pix
- **Status:** built

### SCR-21: Estúdio White Label

- **Used by:** FLW-08 step 6
- **Purpose:** Customização de cores, marcas, tipografia, verticais de negócio, monetização e preview com autonomia total do Super Admin para selecionar qualquer franquia e sincronizar em tempo real no app do franqueado
- **Elements:** Seletor de praça ativa com banner de governança Super Admin, seletor de paletas com 1 clique, Brand Center, Design System, Multi-Negócio, Planos e Chave PIX, Geo & App, gerador de favicon SVG, simulador responsivo ao vivo com links diretos para testar Passageiro e Motorista
- **States:**
  | State      | Trigger                               | Figma frame       | Behavior                                                                                                                     |
  | ---------- | ------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------- |
  | success    | alterações salvas                     | none — code first | Sincronização em tempo real via BroadcastChannel e Supabase Realtime de temas, categorias e tarifas em toda a aplicação      |
  | superadmin | superadministrador seleciona franquia | none — code first | Banner de controle ativo com pré-visualização, teste rápido e propagação instantânea de white label para a praça selecionada |
  | regional   | acesso com perfil franqueado          | none — code first | Exibe 5 abas operacionais locais, oculta abas globais e bloqueia edição de identificadores nativos de compilação             |
  | loading    | compilando tema                       | none — code first | Indicador de persistência no Supabase                                                                                        |
- **Coverage:** src/routes/app.admin.whitelabel.tsx:1-487, src/components/admin/whitelabel/MonetizationTab.tsx:1-256, src/components/admin/whitelabel/GeoAppComplianceTab.tsx:640-750, src/lib/white-label/white-label-engine.ts:1-700, src/components/branding/BrandingProvider.tsx:1-709
- **Scenarios:** SCN-010
- **Resources:** ThemeEngine, LandingPageStore, whiteLabelEngine, saveMonetizacaoConfig, BrandingProvider
- **Status:** built

### SCR-22: Central de Incidentes SOS Admin

- **Used by:** FLW-03 step 3
- **Purpose:** Painel de segurança com fila de emergências em tempo real e acionamento de plano de contingência
- **Elements:** Lista de alertas SOS ativos, botão de localização no mapa, botão de contato imediato
- **States:**
  | State   | Trigger         | Figma frame       | Behavior                                                    |
  | ------- | --------------- | ----------------- | ----------------------------------------------------------- |
  | success | fila monitorada | none — code first | Exibição de ocorrências com cronômetro de tempo de resposta |
  | empty   | zero incidentes | none — code first | Status "Operação 100% segura sem alertas ativos"            |
- **Coverage:** src/routes/app.admin.sos.tsx:1-150
- **Scenarios:** SCN-003
- **Resources:** AlertasSOSRealtime
- **Status:** built

### SCR-23: Configurações Globais do Sistema

- **Used by:** FLW-08 step 7
- **Purpose:** Configuração de parâmetros operacionais, raios de busca e chaves de integração
- **Elements:** Toggles de modos essenciais e avançados, inputs de tarifas por km, configuração de gateway Pix
- **States:**
  | State   | Trigger           | Figma frame       | Behavior                                           |
  | ------- | ----------------- | ----------------- | -------------------------------------------------- |
  | success | parâmetros salvos | none — code first | Notificação de confirmação e aplicação imediata    |
  | error   | valor inválido    | none — code first | Validação inline destacando campo fora dos limites |
- **Coverage:** src/routes/app.admin.configuracoes.tsx:1-200
- **Scenarios:** SCN-010
- **Resources:** superadmin-config
- **Status:** built

### SCR-24: Diagnóstico Geoespacial & WebGL

- **Used by:** FLW-08 step 8
- **Purpose:** Painel técnico de observabilidade cartográfica, monitoramento de GPU/WebGL, teste de acurácia GNSS e latência WebSocket isolado das telas de passageiros
- **Elements:** Card de FPS e aceleração WebGL, medidor de acurácia GPS com probe interativo, monitor de WebSocket Realtime, medidor de JS Heap, mapa de teste geodésico, tabela de telemetria da frota
- **States:**
  | State   | Trigger                 | Figma frame       | Behavior                                                                                           |
  | ------- | ----------------------- | ----------------- | -------------------------------------------------------------------------------------------------- |
  | success | telemetria sincronizada | none — code first | Exibe taxas de FPS (60 Hz), precisão GNSS em metros, status WSS e contadores de requisições Mapbox |
  | loading | medindo sinal GPS       | none — code first | Spinner animado no botão Testar Sinal com leitura em tempo real via Geolocation API                |
- **Coverage:** src/routes/app.admin.diagnostico.tsx:1-187
- **Scenarios:** SCN-008
- **Resources:** MapDiagnosticPanel, UniversalMapView, useTelemetriaFrota
- **Status:** built

### SCR-25: Gestão Central de Franqueados & Multi-Tenant

- **Used by:** FLW-08 step 9
- **Purpose:** Painel central de governança das operações municipais franqueadas, credenciamento, credenciais de acesso e distribuição de builds
- **Elements:** Alternador de visualização (Cards vs Tabela Executiva), cards compactos com drawer expansível para detalhes operacionais, tabela corporativa de alta densidade, modais de inspeção de passageiros e condutores com exportação CSV, modal de troca de chaves de mapas e modal de suspensão emergencial (kill switch)
- **States:**
  | State    | Trigger                    | Figma frame       | Behavior                                                                        |
  | -------- | -------------------------- | ----------------- | ------------------------------------------------------------------------------- |
  | success  | listagem de praças         | none — code first | Apresenta métricas agregadas e controle de cada tenant com expansão sob demanda |
  | filtered | busca textual ou status    | none — code first | Filtra franqueados em tempo real por nome, cidade ou status operacional         |
  | empty    | nenhuma praça cadastrada   | none — code first | Estado vazio com botão para clonar ou provisionar novo franqueado               |
  | table    | alternado para modo tabela | none — code first | Visualização condensada em tabela para escaneamento rápido de alta escala       |
- **Coverage:** src/routes/app.admin.franqueados.tsx:1-1200
- **Scenarios:** SCN-010
- **Resources:** multiTenantService, whiteLabelEngine, Mapbox/Google Maps API
- **Status:** built

### SCR-26: Agendamento de Corridas com Acordo Direto

- **Used by:** FLW-01 step 6, SCN-033
- **Purpose:** Tela dedicada para reserva antecipada de viagens, com proposta de valor protegida por piso operacional e contraproposta negociada direto com motoristas parceiros
- **Elements:** Header dinâmico com avatar e notificações, botão Meus Agendamentos com badge de compromissos ativos, seletor de modalidade ModeTabSelector de 3 posições (Corrida, Entrega, Agendar), card de trajeto com origem e destino, card de data e horário com atalhos rápidos e antecedência mínima de 30 minutos, seletor de categorias de veículo, card de oferta com piso mínimo operacional protegido (0% de comissão) e modal ScheduledRideListModal
- **States:**
  | State | Trigger | Figma frame | Behavior |
  | --- | --- | --- | --- |
  | default | formulário pronto | none — code first | Exibe campos de trajeto, cálculo de piso mínimo e valor inicial sugerido |
  | success | agendamento criado | none — code first | Notificação de confirmação e transição suave para Minhas Corridas Agendadas |
  | negotiating | contraproposta recebida | none — code first | Modal exibe justificativa do motorista e botões para aceitar ou recusar |
  | error | valor abaixo do piso | none — code first | Mensagem de erro educativa informando que a proposta não cobre os custos do condutor |
- **Coverage:** src/routes/app.agendar.tsx:1-90, src/components/schedule/ScheduledRideFormScreen.tsx:1-380, src/components/schedule/ScheduledRideListModal.tsx:1-300, src/lib/ride/scheduled-ride-engine.ts:1-350
- **Scenarios:** SCN-033
- **Resources:** scheduledRideEngine, ModeTabSelector, ScheduledRideListModal
- **Status:** built

### SCR-27: Franquia Mãe — Matriz Nacional Holding

- **Used by:** FLW-08 step 10, SCN-034
- **Purpose:** Sala de comando executiva exclusiva da Franquia Mãe (Matriz Nacional Holding), garantindo blindagem de integridade, configuração da identidade central da plataforma, chave PIX nacional da holding e chaves mestras de infraestrutura de mapas
- **Elements:** Cabeçalho executivo com badge de blindagem permanente, seletor de escopo (Franquias Regionais vs Franquia Mãe), banner institucional de proteção com botão restaurar padrões, formulário modular em 4 quadrantes (Identidade Visual & Cores, Recebimento Central PIX, Dados Institucionais & Acesso Master, Infraestrutura Global & APIs Centrais) e botão de salvar com sincronização em tempo real
- **States:**
  | State | Trigger | Figma frame | Behavior |
  | --- | --- | --- | --- |
  | default | carregamento da matriz | none — code first | Apresenta os parâmetros oficiais configurados da holding nacional |
  | saving | envio das alterações | none — code first | Desabilita submissão e aplica sincronização local e no Supabase |
  | live_preview | teste visual em tempo real | none — code first | Dispara evento de tema e reflete imediatamente as cores na interface |
  | reset | clique em restaurar padrões | none — code first | Carrega os valores oficiais de fábrica da holding para confirmação |
- **Coverage:** src/routes/app.admin.matriz.tsx:1-800, src/lib/white-label/white-label-engine.ts:1410-1460
- **Scenarios:** SCN-034
- **Resources:** whiteLabelEngine, MapboxConfig, GuardiaoAcesso
- **Status:** built
