# UI Screen Registry

<!-- Managed with super-ux (ux-contract v4). The design map: every screen and
state with its Figma frame, wireframe, code coverage, and related UX/UI
resources. Update in the same change as any interface change; when Figma is
enabled, update the frame and re-verify its link in the same change. A screen
whose code diverges from its record here is a "drifted" finding. -->

## Index

| ID | Screen | Used by | Figma | Status | Coverage |
|----|--------|---------|-------|--------|----------|
| SCR-01 | Tela Inicial e Landing Page | FLW-05 | [Figma Home](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:2114) | built | src/routes/index.tsx:1-39 |
| SCR-02 | Tela de Carregamento e Splash | FLW-05 | [Figma Splash](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:1946) | built | src/components/branding/SplashScreen.tsx:1-200 |
| SCR-03 | Tela de Login e Autenticação Unificada | FLW-05 | [Figma Login](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:2057) | built | src/routes/auth.tsx:1-45 |
| SCR-04 | Seleção de Modalidade de Cadastro | FLW-05 | [Figma Intro](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:1949) | built | src/routes/escolher-tipo-cadastro.tsx:1-120 |
| SCR-05 | Cadastro de Passageiro | FLW-05 | [Figma Register](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:2513) | built | src/routes/cadastro-passageiro.tsx:1-150 |
| SCR-06 | Cadastro de Motorista Parceiro | FLW-05 | [Figma Driver KYC](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=70:602) | built | src/routes/cadastro-motorista.tsx:1-200 |
| SCR-07 | Banner de Resiliência de Rede e Modo Offline | FLW-06 | [Figma Offline](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:3256) | built | src/components/passenger/NetworkReconnectionBanner.tsx:1-96 |
| SCR-08 | Mapa e Solicitação de Viagem | FLW-01, FLW-06 | [Figma Home Ride](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:2114) | built | src/routes/app.index.tsx:1-200 |
| SCR-09 | Experiência En Route | FLW-01, FLW-02, FLW-03 | [Figma Ride Started](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:3254) | built | src/components/passenger/DriverEnRouteSheet.tsx:1-150 |
| SCR-10 | Central de SOS e Emergência | FLW-03 | [Figma Customer Support](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:3246) | built | src/routes/app.sos.tsx:1-100 |
| SCR-11 | Bilhetes e Histórico de Atividade | FLW-07 | [Figma Ride History](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:3253) | built | src/routes/app.bilhetes.tsx:1-150 |
| SCR-12 | Envio de Encomendas Expressas | FLW-07 | [Figma Delivery Details](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:3252) | built | src/routes/app.encomendas.tsx:1-120 |
| SCR-13 | Perfil do Passageiro | FLW-07 | [Figma Profile](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:3249) | built | src/routes/app.perfil.tsx:1-150 |
| SCR-14 | Cockpit Operacional do Motorista | FLW-01, FLW-02, FLW-04, FLW-06 | [Figma Driver Home](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=79:1634) | built | src/routes/app.motorista.tsx:1-200 |
| SCR-15 | Painel Administrativo Geral e Layout | FLW-08 | [Figma Admin Home](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=2010:918) | built | src/routes/app.admin.tsx:1-150 |
| SCR-16 | Dashboard Executivo e Telemetria | FLW-08 | [Figma Admin Home](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=2010:918) | built | src/routes/app.admin.index.tsx:1-150 |
| SCR-17 | Central de Despacho e Operação ao Vivo | FLW-08 | [Figma Admin Map](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=2011:1124) | built | src/routes/app.admin.despacho.tsx:1-150 |
| SCR-18 | Gestão de Motoristas e Frota | FLW-08 | [Figma Driver Mgmt](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:886) | built | src/routes/app.admin.motoristas.tsx:1-150 |
| SCR-19 | Gestão de Passageiros | FLW-08 | [Figma User Data](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:883) | built | src/routes/app.admin.passageiros.tsx:1-150 |
| SCR-20 | Gestão Financeira e Caixa D+0 | FLW-02, FLW-04 | [Figma Withdrawal](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:901) | built | src/routes/app.admin.financeiro.tsx:1-200 |
| SCR-21 | Estúdio White Label | FLW-08 | [Figma Admin Theme](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=2010:918) | built | src/routes/app.admin.whitelabel.tsx:1-200 |
| SCR-22 | Central de Incidentes SOS Admin | FLW-03 | [Figma Customer Chats](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=4001:884) | built | src/routes/app.admin.sos.tsx:1-150 |
| SCR-23 | Configurações Globais do Sistema | FLW-08 | [Figma Admin Config](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443?node-id=2010:918) | built | src/routes/app.admin.configuracoes.tsx:1-200 |

## Design system

- **Style pack:** Caber Mobility Design Pack
- **Figma library:** [FREE Caber - Uber Like App UI (Community)](https://www.figma.com/design/eGb6a7FZu93fuo5FdtZ443/FREE-Caber--Uber-Like-App-UI--Community-)
- **Tokens in code:** src/styles.css
- **Component source:** src/components/
- **Assets:** src/assets/

## Web surfaces

- **Web surfaces:** no

## Screens

### SCR-01: Tela Inicial e Landing Page
- **Used by:** FLW-05 step 1
- **Purpose:** Apresentar a proposta de valor, cotação prévia e converter novos passageiros e condutores
- **Elements:** Hero cinematográfico com backdrop de metrópole urbana e iluminação degradê dinâmica White Label, navbar flutuante com status da frota, seletor de modalidade passageiro/motorista, mockup cartográfico dark com rota ao vivo, bento grid de pilares operacionais, rodapé institucional
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | padrão | none — code first | Exibe a landing institucional com cores dinâmicas do White Label e imagem urbana |
  | loading | carregando dados da cidade | none — code first | Skeleton nos cards de cotação |
  | error | falha de conexão | none — code first | Mensagem de contingência mantendo botões funcionais |
- **Coverage:** src/routes/index.tsx:1-39
- **Scenarios:** SCN-005
- **Resources:** src/components/landing/, useBrandTheme
- **Status:** built

### SCR-02: Tela de Carregamento e Splash
- **Used by:** FLW-05 step 2
- **Purpose:** Inicializar sessão segura e carregar dados em cache com feedback de progresso
- **Elements:** Logo oficial da plataforma, barra de progresso tecnológica, texto de status do carregamento
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | dados carregados | none — code first | Fade-out suave transicionando para a tela solicitada |
  | loading | em progresso | none — code first | Barra animada de 0 a 100% com mensagens contextuais |
  | error | falha crítica | none — code first | Exibe opção de recarregar a aplicação |
- **Coverage:** src/components/branding/SplashScreen.tsx:1-200
- **Scenarios:** SCN-005
- **Resources:** useBranding, useBrandTheme
- **Status:** built

### SCR-03: Tela de Login e Autenticação Unificada
- **Used by:** FLW-05 step 3
- **Purpose:** Autenticar passageiros e motoristas via telefone, e-mail ou código OTP
- **Elements:** Campo de telefone/e-mail, campo de senha com alternador de visibilidade, botão Entrar, atalho para cadastro
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | credenciais válidas | none — code first | Redireciona para o cockpit ou mapa conforme a role |
  | error | credenciais inválidas | none — code first | Alerta visual em vermelho com instrução de recuperação |
  | loading | autenticando no Supabase | none — code first | Botão com spinner de carregamento e campos desabilitados |
- **Coverage:** src/routes/auth.tsx:1-45
- **Scenarios:** SCN-006
- **Resources:** supabaseAuthService, PartiuAppAuthGate
- **Status:** built

### SCR-04: Seleção de Modalidade de Cadastro
- **Used by:** FLW-05 step 4
- **Purpose:** Permitir a escolha consciente entre cadastro de passageiro ou parceiro
- **Elements:** Card Passageiro, Card Motorista/Entregador, Header com botão voltar
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | padrão | none — code first | Exibe opções com descrições de benefícios e ícones temáticos |
- **Coverage:** src/routes/escolher-tipo-cadastro.tsx:1-120
- **Scenarios:** SCN-006
- **Resources:** NativeSurface, NativeRipple
- **Status:** built

### SCR-05: Cadastro de Passageiro
- **Used by:** FLW-05 step 5
- **Purpose:** Coleta de nome, telefone, e-mail e senha para passageiros
- **Elements:** Campos de formulário com máscaras automáticas, checkbox de WhatsApp, botão Criar Conta
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | conta criada | none — code first | Confirmação e entrada imediata no mapa |
  | error | CPF ou telefone já cadastrado | none — code first | Alerta explicativo com link para recuperação |
  | loading | processando cadastro | none — code first | Indicador de envio de dados seguro |
- **Coverage:** src/routes/cadastro-passageiro.tsx:1-150
- **Scenarios:** SCN-006
- **Resources:** supabaseAuthService, useGeolocation
- **Status:** built

### SCR-06: Cadastro de Motorista Parceiro
- **Used by:** FLW-05 step 6
- **Purpose:** Onboarding em 4 etapas para envio de CNH com EAR, CRLV e dados Pix
- **Elements:** Stepper de progresso, dropzone de documentos, formulário do veículo, resumo de aprovação
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | documentos enviados | none — code first | Tela de confirmação com status "Em análise operacional" |
  | error | documento ilegível ou inválido | none — code first | Alerta no campo com orientação de novo envio |
  | loading | fazendo upload de fotos | none — code first | Barra de progresso com porcentagem de envio |
- **Coverage:** src/routes/cadastro-motorista.tsx:1-200
- **Scenarios:** SCN-007
- **Resources:** driverFleetService, Supabase Storage
- **Status:** built

### SCR-07: Banner de Resiliência de Rede e Modo Offline
- **Used by:** FLW-06 step 1
- **Purpose:** Informar o estado de conexão e manter buscas/corridas ativas sem ansiedade
- **Elements:** Alerta não-intrusivo de reconexão, ícone de wifi, confirmação de conexão restabelecida
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | rede restabelecida | none — code first | Mensagem verde de 2 segundos confirmando reconexão |
  | error | sem sinal celular | none — code first | Aviso discreto informando que a busca continua ativa |
- **Coverage:** src/components/passenger/NetworkReconnectionBanner.tsx:1-96
- **Scenarios:** SCN-008
- **Resources:** RealtimeConnectionManager
- **Status:** built

### SCR-08: Mapa e Solicitação de Viagem
- **Used by:** FLW-01 step 1, FLW-06 step 2
- **Purpose:** Permitir ao passageiro escolher destino, categoria e confirmar a corrida com valor garantido prévio
- **Elements:** Campo de busca de endereço, mapa interativo Mapbox GL, botão de recentralizar GPS, seletor de categorias (Carro/Moto/Entrega), botão principal Confirmar Corrida
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | default | none — code first | Exibe mapa limpo com veículos próximos e categorias disponíveis |
  | empty | nenhum motorista online | none — code first | Informa ausência temporária de veículos no raio e sugere aguardar |
  | error | falha de geocodificação ou rede | none — code first | Mensagem de erro amigável com botão de tentar novamente |
  | loading | calculando rotas e tarifas | none — code first | Skeleton nos cards de categoria e traçado animado no mapa |
- **Coverage:** src/routes/app.index.tsx:1-200
- **Scenarios:** SCN-001
- **Resources:** src/components/map/, Mapbox GL, Supabase
- **Status:** built

### SCR-09: Experiência En Route
- **Used by:** FLW-01 step 5, FLW-02 step 3, FLW-03 step 1
- **Purpose:** Acompanhamento da corrida em tempo real com projeção suave na via a 60 FPS, dados do motorista/veículo e botão SOS
- **Elements:** Mapa com Snap to Route, Bottom Sheet com dados do veículo e condutor, chat integrado, botão vermelho SOS 190
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | viagem em andamento | none — code first | Atualização contínua do trajeto com tempo estimado de chegada dinâmico |
  | empty | aguardando início da rota | none — code first | Indicador de motorista a caminho com tempo estimado de embarque |
  | error | perda temporária de telemetria | none — code first | Banner discreto de reconexão sem interromper o mapa |
  | loading | traçando rota inicial | none — code first | Linha guia calculando melhor rota de tráfego |
- **Coverage:** src/components/passenger/DriverEnRouteSheet.tsx:1-150
- **Scenarios:** SCN-003
- **Resources:** Mapbox GL, PostGIS, Realtime Channel
- **Status:** built

### SCR-10: Central de SOS e Emergência
- **Used by:** FLW-03 step 1
- **Purpose:** Disparar protocolos de segurança operacional, discagem direta para 190 e compartilhamento de link de rastreamento com contatos
- **Elements:** Botão Discar 190, botão Compartilhar Localização ao Vivo, status do canal de monitoramento operacional
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | canal ativo | none — code first | Opções de emergência prontas para acionamento em 1 clique |
  | empty | nenhum alerta ativo | none — code first | Status seguro com orientações de prevenção |
  | error | sem sinal celular para discagem | none — code first | Instrução de envio de SMS de emergência com coordenadas GPS |
  | loading | enviando telemetria prioritária | none — code first | Confirmação de transmissão de dados em lote |
- **Coverage:** src/routes/app.sos.tsx:1-100
- **Scenarios:** SCN-003
- **Resources:** Web API Geolocation, Tel URI
- **Status:** built

### SCR-11: Bilhetes e Histórico de Atividade
- **Used by:** FLW-07 step 1
- **Purpose:** Consulta de viagens anteriores, recibos detalhados e bilhetes emitidos
- **Elements:** Filtros de corridas e encomendas, lista de cards com data e valor, visualizador de recibo
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | dados carregados | none — code first | Lista detalhada de atividades com rota e valor pago |
  | empty | sem viagens realizadas | none — code first | Ilustração suave convidando para a primeira corrida |
  | error | falha de requisição | none — code first | Card de erro amigável com botão Tentar Novamente |
  | loading | buscando histórico | none — code first | Skeletons simulando os cards de corrida |
- **Coverage:** src/routes/app.bilhetes.tsx:1-150
- **Scenarios:** SCN-009
- **Resources:** rideService
- **Status:** built

### SCR-12: Envio de Encomendas Expressas
- **Used by:** FLW-07 step 2
- **Purpose:** Solicitação de entregas expressas com duplo PIN de segurança na coleta e entrega
- **Elements:** Campos de destinatário, telefone, endereço de entrega, seletor de porte do pacote, botão Solicitar Entrega
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | entrega despachada | none — code first | Exibe o PIN de coleta e rota do entregador parceiro |
  | error | endereço fora de cobertura | none — code first | Aviso delimitando a área urbana atendida |
  | loading | calculando frete | none — code first | Indicador de cotação por distância |
- **Coverage:** src/routes/app.encomendas.tsx:1-120
- **Scenarios:** SCN-009
- **Resources:** deliveryService
- **Status:** built

### SCR-13: Perfil do Passageiro
- **Used by:** FLW-07 step 3
- **Purpose:** Gestão de dados cadastrais, preferências de viagem e opção de logout
- **Elements:** Foto de perfil com upload, campos de contato, toggles de acessibilidade, botão Sair da Conta
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | perfil carregado | none — code first | Visualização de dados cadastrais e preferências ativas |
  | error | falha ao salvar dados | none — code first | Alerta visual informando inconsistência no formulário |
  | loading | salvando alterações | none — code first | Botão com indicador de salvamento ativo |
- **Coverage:** src/routes/app.perfil.tsx:1-150
- **Scenarios:** SCN-009
- **Resources:** userService
- **Status:** built

### SCR-14: Cockpit Operacional do Motorista
- **Used by:** FLW-01 step 6, FLW-02 step 1, FLW-04 step 1, FLW-06 step 3
- **Purpose:** Fornecer ao motorista parceiro controle do modo online, recebimento de chamadas com ganho líquido e métricas diárias
- **Elements:** Alternador Online/Offline, card de chamada recebida com contagem regressiva, resumo de faturamento do dia, botão de aceitar corrida
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | condutor online | none — code first | Mapa ativo aguardando chamadas e monitorando demanda |
  | empty | condutor offline | none — code first | Painel em repouso com resumo das corridas anteriores |
  | error | GPS desativado ou sem sinal | none — code first | Alerta visual solicitando ativação do serviço de localização |
  | loading | conectando ao despacho | none — code first | Spinner sutil de sincronização com o cluster PostGIS |
- **Coverage:** src/routes/app.motorista.tsx:1-200
- **Scenarios:** SCN-002
- **Resources:** src/components/driver/, Supabase Realtime
- **Status:** built

### SCR-15: Painel Administrativo Geral e Layout
- **Used by:** FLW-08 step 1
- **Purpose:** Navegação entre os 6 módulos centrais de gestão regional e login administrativo
- **Elements:** Sidebar com RBAC, seletor de perfil ativo, notificações de sistema, botão de logout admin
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | autenticado | none — code first | Estrutura de navegação limpa e responsiva |
  | error | acesso não autorizado | none — code first | Redirecionamento com mensagem de credencial insuficiente |
- **Coverage:** src/routes/app.admin.tsx:1-150
- **Scenarios:** SCN-010
- **Resources:** admin-rbac, WhiteLabelThemeContext
- **Status:** built

### SCR-16: Dashboard Executivo e Telemetria
- **Used by:** FLW-08 step 2
- **Purpose:** Visualização de KPIs ao vivo, receita diária, contagem de frotas e mapa integrado
- **Elements:** Cards de métricas financeiras e operacionais, UniversalMapView com cluster de veículos
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | dados em tempo real | none — code first | Painel com KPIs atualizados instantaneamente via Supabase |
  | loading | consultando métricas | none — code first | Skeletons nos blocos de indicadores |
- **Coverage:** src/routes/app.admin.index.tsx:1-150
- **Scenarios:** SCN-010
- **Resources:** partiu-db, UniversalMapView
- **Status:** built

### SCR-17: Central de Despacho e Operação ao Vivo
- **Used by:** FLW-08 step 3
- **Purpose:** Monitoramento cartográfico das corridas em andamento e despacho manual em contingência
- **Elements:** Lista de corridas em rota, mapa com rotas ativas, tabela de condutores disponíveis
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | operação ativa | none — code first | Rastreamento em lote das corridas ativas |
  | empty | sem corridas no momento | none — code first | Indicador de tranquilidade operacional |
- **Coverage:** src/routes/app.admin.despacho.tsx:1-150
- **Scenarios:** SCN-010
- **Resources:** PostGIS, Dispatch Engine
- **Status:** built

### SCR-18: Gestão de Motoristas e Frota
- **Used by:** FLW-08 step 4
- **Purpose:** Auditoria documental de condutores, moderação de CNH, veículos credenciados e status
- **Elements:** Tabela de motoristas com filtros de status, modal de inspeção de documentos, botões Aprovar e Bloquear
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | lista de condutores | none — code first | Visão de frotas com indicadores de conformidade |
  | loading | buscando base | none — code first | Skeleton nos registros da tabela |
- **Coverage:** src/routes/app.admin.motoristas.tsx:1-150
- **Scenarios:** SCN-010
- **Resources:** driverFleetService
- **Status:** built

### SCR-19: Gestão de Passageiros
- **Used by:** FLW-08 step 5
- **Purpose:** Consulta da base de passageiros cadastrados, bloqueios preventivos e histórico de chamados
- **Elements:** Tabela de usuários com busca por telefone/nome, modal de histórico de corridas
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | base carregada | none — code first | Listagem com filtros por cidade e data de cadastro |
- **Coverage:** src/routes/app.admin.passageiros.tsx:1-150
- **Scenarios:** SCN-010
- **Resources:** passengerService
- **Status:** built

### SCR-20: Gestão Financeira e Caixa D+0
- **Used by:** FLW-02 step 5, FLW-04 step 1
- **Purpose:** Apresentar detalhamento tarifário, confirmação de liquidação instantânea via Pix e divisão de split contábil
- **Elements:** Resumo de valor cobrado, taxa operacional deduzida, crédito líquido transferido, botão de baixar comprovante
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | pagamento liquidado | none — code first | Comprovante verde de liquidação com detalhes das partidas dobradas |
  | empty | sem transações recentes | none — code first | Extrato vazio com convite para iniciar nova corrida |
  | error | falha de autorização | none — code first | Notificação clara com solicitação de método alternativo |
  | loading | processando webhook Pix | none — code first | Indicador de confirmação bancária em tempo real |
- **Coverage:** src/routes/app.admin.financeiro.tsx:1-200
- **Scenarios:** SCN-004
- **Resources:** Supabase Ledger, Gateway Pix
- **Status:** built

### SCR-21: Estúdio White Label
- **Used by:** FLW-08 step 6
- **Purpose:** Customização de cores, marcas, tipografia e preview da landing page municipal
- **Elements:** Seletor de paletas, gerador de favicon SVG, editor de seções da landing, canvas de preview ao vivo
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | alterações salvas | none — code first | Sincronização em tempo real de temas em toda a aplicação |
  | loading | compilando tema | none — code first | Indicador de persistência no Supabase |
- **Coverage:** src/routes/app.admin.whitelabel.tsx:1-200
- **Scenarios:** SCN-010
- **Resources:** ThemeEngine, LandingPageStore
- **Status:** built

### SCR-22: Central de Incidentes SOS Admin
- **Used by:** FLW-03 step 3
- **Purpose:** Painel de segurança com fila de emergências em tempo real e acionamento de plano de contingência
- **Elements:** Lista de alertas SOS ativos, botão de localização no mapa, botão de contato imediato
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | fila monitorada | none — code first | Exibição de ocorrências com cronômetro de tempo de resposta |
  | empty | zero incidentes | none — code first | Status "Operação 100% segura sem alertas ativos" |
- **Coverage:** src/routes/app.admin.sos.tsx:1-150
- **Scenarios:** SCN-003
- **Resources:** AlertasSOSRealtime
- **Status:** built

### SCR-23: Configurações Globais do Sistema
- **Used by:** FLW-08 step 7
- **Purpose:** Configuração de parâmetros operacionais, raios de busca e chaves de integração
- **Elements:** Toggles de modos essenciais e avançados, inputs de tarifas por km, configuração de gateway Pix
- **States:**
  | State | Trigger | Figma frame | Behavior |
  |-------|---------|-------------|----------|
  | success | parâmetros salvos | none — code first | Notificação de confirmação e aplicação imediata |
  | error | valor inválido | none — code first | Validação inline destacando campo fora dos limites |
- **Coverage:** src/routes/app.admin.configuracoes.tsx:1-200
- **Scenarios:** SCN-010
- **Resources:** superadmin-config
- **Status:** built
