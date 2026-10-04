# UX Foundation

<!-- Managed with super-ux (ux-contract v4). The WHY layer: personas, jobs
to be done, customer journeys, user stories. Update when the understanding
of users changes; scenarios in scenarios.md trace to the IDs defined here. -->

## Personas

### P-01: Passageiro Urbano Cotidiano
Usuário que necessita de deslocamento diário para trabalho, compromissos pessoais ou retorno para casa. Conhece aplicativos populares de transporte e busca embarque pontual, rotas sem desvios arbitrários e custo-benefício previsível sem sobretaxas obscuras.
- **Status:** confirmed

### P-02: Motorista Parceiro Autônomo
Condutor profissional ou complementar que busca rentabilidade líquida digna por quilômetro rodado. Conhece o trânsito da sua região, valoriza segurança operacional nas corridas e exige repasses financeiros rápidos sem bloqueios injustificados ou comissões abusivas.
- **Status:** confirmed

### P-03: Gestor de Frota e Franqueado Regional
Empreendedor responsável pela gestão e conformidade de veículos e condutores credenciados em um município ou polo regional. Busca monitoramento cartográfico em tempo real, auditoria de corridas e controle de fechamento financeiro transparente.
- **Status:** confirmed

## Jobs to Be Done

### JTBD-01: Solicitar viagem urbana segura e previsível
- **Statement:** When preciso me locomover na cidade com agilidade, I want to solicitar um veículo próximo com valor fechado prévio, so I can chegar ao meu destino com segurança e previsibilidade financeira.
- **Personas:** P-01
- **Type:** functional
- **Forces:** push: transporte coletivo superlotado ou atrasado; pull: veículo higienizado com rastreamento GPS contínuo; anxiety: receio de motoristas cancelando consecutivamente; habit: chamar no concorrente instalado há anos.
- **Success metric:** tempo médio entre solicitação e embarque inferior a 6 minutos e valor final idêntico ao estimado.
- **Status:** confirmed

### JTBD-02: Maximizar rentabilidade diária com segurança
- **Statement:** When estou online operando meu veículo, I want to receber ofertas de corrida com rota limpa e ganho líquido transparente, so I can cumprir minha meta diária sem surpresas ou comissões predatórias.
- **Personas:** P-02
- **Type:** functional
- **Forces:** push: retenções de até 40% nas plataformas multinacionais; pull: taxa justa e repasse instantâneo via Pix; anxiety: riscos de segurança em bairros desconhecidos à noite; habit: alternar entre vários aplicativos ao mesmo tempo.
- **Success metric:** taxa de aceitação consciente superior a 85% e disponibilidade do saldo para saque em menos de 10 segundos.
- **Status:** confirmed

### JTBD-03: Monitorar operação regional e despachos com governança
- **Statement:** When coordeno a frota e as viagens na minha cidade, I want to auditar chamadas ativas, conformidade documental e conciliação financeira, so I can garantir qualidade no atendimento local e sustentabilidade do negócio.
- **Personas:** P-03
- **Type:** functional
- **Forces:** push: falta de controle e visibilidade regional em sistemas genéricos; pull: painel administrativo completo com mapa em tempo real; anxiety: fraudes em pagamentos ou ocorrências de segurança graves; habit: controle manual em planilhas.
- **Success metric:** zero inconsistências contábeis no ledger e acionamento de plano de resposta a incidentes de SOS em menos de 60 segundos.
- **Status:** confirmed

## Customer journeys

### JRN-01: Passageiro Cotidiano — Solicitar e Concluir Viagem (JTBD-01)
| # | Stage | User action | Touchpoint | Emotion (1-5) | Pain | Opportunity |
|---|-------|------------|------------|---------------|------|-------------|
| 1 | Origem e Destino | Digita endereço de destino e confirma ponto de embarque | Tela de Mapa Passageiro | 4 | Incerteza do valor exato | Exibir valor garantido prévio sem alteração |
| 2 | Escolha de Categoria | Seleciona categoria (Carro, Moto ou Encomenda) e forma de pagamento | Bottom Sheet Categorias | 4 | Medo de demora no despacho | Mostrar motoristas reais próximos no mapa |
| 3 | Aguardando Motorista | Visualiza busca em tempo real com indicador de despacho em ondas | Tela de Busca Animada | 3 | Ansiedade de não ser atendido | Garantir prioridade por proximidade real |
| 4 | Em Viagem (En Route) | Acompanha rota a 60 FPS, dados do veículo e botão SOS ativo | Tela En Route | 5 | Insegurança sobre trajeto | Traçado nítido de alta fidelidade e botão SOS 190 |
| 5 | Desembarque | Conclui corrida, avalia motorista e confere recibo | Tela de Avaliação e Recibo | 5 | Cobrança extra indevida | Recibo digital instantâneo detalhado |

### JRN-02: Motorista Parceiro — Aceite e Cumprimento de Corrida (JTBD-02)
| # | Stage | User action | Touchpoint | Emotion (1-5) | Pain | Opportunity |
|---|-------|------------|------------|---------------|------|-------------|
| 1 | Ficar Online | Ativa modo online no cockpit do motorista | Cockpit Motorista | 4 | Demora para receber chamadas | Heatmap de alta demanda em tempo real |
| 2 | Receber Oferta | Analisa distância até passageiro, destino e ganho líquido | Card de Chamada Entrante | 4 | Tempo curto para ler detalhes | Informações em destaque com contagem regressiva limpa |
| 3 | Deslocamento ao Embarque | Inicia navegação até o ponto de embarque | Navegação Snap to Route | 4 | GPS impreciso | Interpolação angular suave e projeção na via |
| 4 | Execução da Viagem | Inicia a viagem após embarque do passageiro e segue rota | Navegação da Corrida | 5 | Tráfego pesado | Rota otimizada em tempo real com mapa limpo |
| 5 | Finalização e Recebimento | Finaliza corrida e visualiza ganho líquido somado na carteira | Recibo Motorista / Saldo | 5 | Desconto abusivo de taxas | Exibir taxa retida justa e saldo liberado para Pix |

## Monetization

- **Model:** hybrid (taxa fixa justa por corrida ou percentual reduzido de intermediação)
- **Value metric:** corridas concluídas com sucesso e planos corporativos de frotas
- **Free boundary:** instalação gratuita dos aplicativos e cadastro sem custo inicial
- **Purchase surface:** in-app e web checkout via Pix integrado
- **Money moments:** cotação garantida pré-corrida, autorização de débito, liquidação instantânea via split Pix
- **Acquisition coherence:** compromisso de transparência cumprido em cada recibo com split visível

## Product mechanics

- **Personalization:** rule-based (preferências de categoria, endereços favoritos e métodos de pagamento padrão)
- **Engagement mechanics:** tiers (níveis de condutor por assiduidade e avaliação com benefícios exclusivos)
- **Accessibility regime:** both (compatível com leitores de tela e padrões de contraste WCAG AA)

## Design tooling

- **Figma:** disabled
- **Figma file:** none — code-first design system with Tailwind CSS and Radix UI

## User stories

### ST-001: Solicitação de corrida pelo passageiro com preço garantido
- **Story:** As P-01, I want selecionar destino e categoria visualizando o valor fixado, so that posso chamar um veículo sem surpresas tarifárias.
- **Traces:** JTBD-01, JRN-01/#1
- **Acceptance criteria:**
  - Given que o passageiro definiu origem e destino válidos, when seleciona a categoria desejada, then o sistema exibe o valor garantido e inicia a busca de condutores no raio configurado.
- **Priority:** must
- **Kill criteria:** taxa de cancelamento pré-embarque superior a 15%
- **Status:** delivered
- **Product:** unobserved

### ST-002: Aceite de corrida pelo condutor no cockpit
- **Story:** As P-02, I want visualizar origem, destino aproximado e ganho líquido na chamada recebida, so that posso aceitar a corrida com autonomia e agilidade.
- **Traces:** JTBD-02, JRN-02/#2
- **Acceptance criteria:**
  - Given que uma nova corrida foi despachada para o condutor, when a oferta surge na tela com contador regressivo, then o motorista pode aceitar com um toque ou recusar sem bloqueio arbitrário da conta.
- **Priority:** must
- **Kill criteria:** tempo médio de resposta à oferta superior a 15 segundos
- **Status:** delivered
- **Product:** unobserved

### ST-003: Acompanhamento da viagem En Route com SOS de emergência
- **Story:** As P-01, I want acompanhar o veículo em tempo real na rota e dispor de botão de emergência SOS, so that tenho segurança contínua durante todo o percurso.
- **Traces:** JTBD-01, JRN-01/#4
- **Acceptance criteria:**
  - Given que a corrida está em andamento, when o veículo se desloca no mapa, then a posição é atualizada com alta fluidez cartográfica e o botão SOS 190 permanece acessível e funcional.
- **Priority:** must
- **Kill criteria:** incidentes sem acionamento correto de protocolo de emergência
- **Status:** delivered
- **Product:** unobserved

### ST-004: Liquidação imediata de corrida via Pix
- **Story:** As P-02, I want receber o crédito líquido da corrida instantaneamente na minha conta via Pix, so that mantenho meu fluxo de caixa diário sem atrasos.
- **Traces:** JTBD-02, JRN-02/#5
- **Acceptance criteria:**
  - Given que a corrida foi finalizada pelo motorista, when o passageiro tem o pagamento processado, then o ledger de partidas dobradas credita o motorista e dispara o comprovante digital.
- **Priority:** must
- **Kill criteria:** tempo de liquidação financeira superior a 60 segundos
- **Status:** delivered
- **Product:** unobserved

### ST-005: Onboarding e autenticação segura de usuários
- **Story:** As P-01, I want me cadastrar e entrar na plataforma com telefone ou e-mail de forma ágil, so that posso solicitar corridas sem atrito.
- **Traces:** JTBD-01, JRN-01/#1
- **Acceptance criteria:**
  - Given que o usuário acessou a tela de entrada, when informa seus dados e valida o código, then a sessão é criada e o papel correto (passageiro ou condutor) é ativado.
- **Priority:** must
- **Kill criteria:** taxa de abandono no login superior a 25%
- **Status:** delivered
- **Product:** unobserved

### ST-006: Resiliência em conexões instáveis e recuperação de rede
- **Story:** As P-01, I want que o aplicativo mantenha minha busca de corrida ativa durante quedas passageiras de sinal, so that não perco o motorista que está a caminho.
- **Traces:** JTBD-01, JRN-01/#3
- **Acceptance criteria:**
  - Given que a conexão de dados oscilou durante uma corrida, when o aparelho reconecta, then o estado é restabelecido sem perda de telemetria ou necessidade de recarregar a tela.
- **Priority:** must
- **Kill criteria:** reclamações de descarte de corrida por queda de sinal
- **Status:** delivered
- **Product:** unobserved

### ST-007: Histórico de viagens e envio de encomendas
- **Story:** As P-01, I want consultar o histórico das minhas corridas e solicitar entregas expressas, so that tenho controle das minhas despesas e envios.
- **Traces:** JTBD-01, JRN-01/#5
- **Acceptance criteria:**
  - Given que o passageiro acessa a aba de atividade, when seleciona um registro anterior, then o comprovante detalhado é exibido com trajeto e valor cobrado.
- **Priority:** should
- **Kill criteria:** taxa de erro no carregamento do extrato superior a 1%
- **Status:** delivered
- **Product:** unobserved

### ST-008: Monitoramento e governança regional de frota
- **Story:** As P-03, I want visualizar a frota no mapa operacional e auditar aprovações de condutores, so that mantenho a operação local em alta conformidade.
- **Traces:** JTBD-03, JRN-01/#2
- **Acceptance criteria:**
  - Given que o administrador acessa o painel de comando, when analisa a fila de despacho e credenciamentos pendentes, then os dados em tempo real são exibidos com opções de aprovação e bloqueio.
- **Priority:** must
- **Kill criteria:** atraso no despacho manual superior a 2 minutos
- **Status:** delivered
- **Product:** unobserved
