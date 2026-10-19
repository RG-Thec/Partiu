# AUDITORIA UX/UI ENTERPRISE — APLICATIVO DO MOTORISTA

## Plataforma de Mobilidade Urbana PARTIU | Auditoria Profunda, Redesign e Validação Técnica

---

## 1. Resumo executivo

Esta auditoria profunda e técnica foi conduzida no **Aplicativo do Motorista** da plataforma de mobilidade urbana PARTIU. O escopo abrange o cockpit operacional do condutor ([app.motorista.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/routes/app.motorista.tsx)), o fluxo completo de credenciamento e onboarding ([cadastro-motorista.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/routes/cadastro-motorista.tsx)), os componentes especializados de cockpit em [src/components/driver/cockpit/](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/), os estados de ciclo de vida da corrida em [src/components/driver/cockpit/states/](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/states/) e o componente de telemetria e navegação vetorial [PartiuDriverNavigationMap.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/PartiuDriverNavigationMap.tsx).

O objetivo primordial desta auditoria foi alinhar a experiência operacional do condutor aos mais rigorosos padrões da indústria de mobilidade (referências globais como Uber Driver e 99 Motorista), eliminando distrações cognitivas perigosas durante o trânsito, corrigindo bugs críticos de ergonomia noturna e adaptando todas as telas para visualização imediata sem rolagem forçada em aparelhos compactos de entrada (viewport 360x640 dp).

Todas as regras de negócio basilares da plataforma, incluindo o modelo de zero comissão, a retenção de 100% da tarifa de repasse pelo condutor, a taxa diária de ativação, o despacho com confirmação em duas etapas (PIN de segurança) e as políticas de segurança de dados foram rigorosamente preservadas.

---

## 2. Tecnologias e arquitetura identificadas

A stack tecnológica do Aplicativo do Motorista é composta pelas seguintes camadas:

- **Framework e Roteamento:** React 18 com TypeScript em modo estrito, utilizando `@tanstack/react-router` para gerenciamento de rotas e lifecycle.
- **Design System e Estilização:** Tailwind CSS v3 integrado com Shadcn UI / Radix Primitives e sistema White Label dinâmico ([WhiteLabelThemeContext.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/contexts/WhiteLabelThemeContext.tsx)), viabilizando parametrização de paleta e tipografia.
- **Camada Geoespacial e Navegação:** Leaflet / React-Leaflet acoplado ao motor vetorial [PartiuDriverNavigationMap.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/PartiuDriverNavigationMap.tsx), com suporte a renderização de rota, marcadores de telemetria, waypoints e rotação heading orientada ao compasso GPS.
- **Motor de Alertas e Haptic Feedback:** Serviços dedicados de alerta sonoro contínuo com Web Audio API ([callAlertService.ts](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/lib/callAlertService.ts)) e microvibrações hápticas veiculares ([haptic.ts](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/lib/haptic.ts)).
- **Camada de Integração Backend:** Supabase Client (PostgreSQL com Row Level Security ativo, Realtime Channels via WebSocket para broadcast de despacho e geolocalização do condutor).

---

## 3. Mapa das telas e componentes existentes

O ecossistema do Aplicativo do Motorista organiza-se na seguinte estrutura modular:

1. **Cockpit Principal ([app.motorista.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/routes/app.motorista.tsx)):**
   - Cabeçalho Superior ([DriverHeader.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/DriverHeader.tsx)): Botão de menu gaveta, comutador rápido de modo noturno, saldo acumulado e alternador Online/Offline.
   - Mapa de Navegação Vetorial ([PartiuDriverNavigationMap.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/PartiuDriverNavigationMap.tsx)): Visualização da posição em tempo real com estilos diurno e noturno (CartoDB Positron e Dark Matter).
   - Card de Notificação de Aprovação / Bloqueio ([DriverApprovalAlert.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/DriverApprovalAlert.tsx)).
   - Banner de Diária / Assinatura ([DriverDailyPassBanner.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/DriverDailyPassBanner.tsx)).
   - Bottom Sheet Contextual Dinâmico ([DriverContextualBottomSheet.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/DriverContextualBottomSheet.tsx)): Hospeda os estados operacionais de acordo com a máquina de estados finitos do condutor.

2. **Estados do Ciclo de Vida da Corrida ([src/components/driver/cockpit/states/](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/states/)):**
   - Estado Offline ([OfflineState.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/states/OfflineState.tsx)): Apresentação do botão primário para conexão, métricas do dia anterior e atalhos de suporte.
   - Estado Disponível / Radar Ativo ([IdleState.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/states/IdleState.tsx)): Monitoramento de corridas na região, ganhos líquidos da sessão e atalhos rápidos.
   - Estado a Caminho do Embarque ([HeadingToPickupState.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/states/HeadingToPickupState.tsx)): Orientação de coleta, atalhos para Waze e Google Maps, botão de contato telefônico e chat, gatilho "Cheguei ao Local".
   - Estado Aguardando Passageiro ([WaitingPassengerState.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/states/WaitingPassengerState.tsx)): Cronômetro de tempo de tolerância (5 minutos), cobrança de tempo excedente, validação de PIN de segurança e gatilho de no-show justificado.
   - Estado em Viagem / Rota Ativa ([InTripState.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/states/InTripState.tsx)): Telemetria da viagem, endereço de entrega ou desembarque, suporte a devolução reversa em entregas e controle de conclusão deslizante.

3. **Modais e Telas Auxiliares:**
   - Oferta de Corrida com Contagem Regressiva ([DriverOfferModal.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/DriverOfferModal.tsx)): 15 segundos para aceitação deslizante ou recusa tátil.
   - Menu Lateral Gaveta ([DriverDrawer.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/DriverDrawer.tsx)): Perfil, histórico, ganhos, taxas diárias, preferências de veículo e central de ajuda.
   - Modal de Cancelamento com Motivo ([DriverCancelBottomSheet.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/DriverCancelBottomSheet.tsx)).
   - Extrato Financeiro ([DriverFinancialDashboardModal.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/DriverFinancialDashboardModal.tsx)): Métricas de ganhos brutos e líquidos com repasse 100%.

4. **Credenciamento e Cadastro ([cadastro-motorista.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/routes/cadastro-motorista.tsx)):**
   - Fluxo estruturado em etapas: Dados Pessoais, Dados do Veículo, Upload de CNH e Documento CRLV, Termos e Submissão para Análise Cadastral.

---

## 4. Diagnóstico por tela e fluxo

### Cockpit Principal e Mapa

- **Diagnóstico Comprovado:** O mapa vetorial [PartiuDriverNavigationMap.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/PartiuDriverNavigationMap.tsx) recebia uma propriedade estática `modoNoturno={false}` na linha 1620 de [app.motorista.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/routes/app.motorista.tsx), ignorando o estado dinâmico `isNightMode` gerido pelo hook `useNightMode()`. Isso causava ofuscamento visual perigoso em condutores operando à noite com brilho intenso de azulejos claros de mapa.
- **Cabeçalho:** Não havia botão explícito de alternância dia/noite no cabeçalho operacional para controle direto do motorista com uma única mão.

### Modal de Oferta de Corrida ([DriverOfferModal.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/DriverOfferModal.tsx))

- **Diagnóstico Comprovado:** Em telas compactas com altura de 640 dp ou 667 dp (muito comuns em celulares populares utilizados por motoristas), o conteúdo do modal de oferta somava mais de 610 px de altura. Como o temporizador de contagem regressiva utilizava SVG de 96x96 px e os espaçamentos eram generosos, o controle deslizante de aceitação e o botão de recusa ficavam empurrados para além da dobra inferior da tela, obrigando o condutor a rolar a tela enquanto dirige para conseguir aceitar ou recusar a corrida nos 15 segundos de tolerância.

### Estado Disponível / Radar ([IdleState.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/states/IdleState.tsx))

- **Diagnóstico Comprovado:** O indicador de status conectado exibia uma animação pulsante incessante (`animate-ping` e `animate-pulse`), transmitindo sensação de instabilidade ou erro iminente. Além disso, havia repetição do badge "0% taxa" colado sobre o valor dos ganhos diários, poluindo o foco nos números principais da sessão.

### Estado a Caminho do Embarque ([HeadingToPickupState.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/states/HeadingToPickupState.tsx))

- **Diagnóstico Comprovado:** O botão de cancelamento de emergência da corrida possuía uma área de toque inferior a 28 px de altura com tipografia discreta, gerando dificuldade para acionamento seguro caso o motorista precisasse relatar um impedimento real de trânsito ou problema mecânico.

---

## 5. Problemas comprovados e evidências técnicas

| ID         | Componente / Arquivo                                                                                                                          | Problema Comprovado                                                                              | Risco Operacional                                                                                           |
| :--------- | :-------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------- |
| **BUG-01** | [app.motorista.tsx#L1620](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/routes/app.motorista.tsx#L1620)                             | Propriedade `modoNoturno={false}` fixada como constante no mapa vetorial.                        | **P0 (Segurança)**: Ofuscamento do condutor no trânsito noturno por tiles com fundo branco.                 |
| **BUG-02** | [DriverOfferModal.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/DriverOfferModal.tsx)                        | Altura do modal superior ao viewport em aparelhos 360x640 dp, exigindo rolagem manual.           | **P0 (Ergonomia)**: Perda de ofertas por falta de tempo para rolar e aceitar em 15s.                        |
| **BUG-03** | [DriverHeader.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/DriverHeader.tsx)                        | Ausência de atalho ergonômico de 1 toque para alternar modo noturno no cabeçalho.                | **P1 (Usabilidade)**: Impossibilidade de adaptação luminosa rápida ao entrar em túneis ou conduzir à noite. |
| **BUG-04** | [IdleState.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/states/IdleState.tsx)                       | Efeito `animate-ping` intermitente no ponto verde de radar e redundância de badges informativos. | **P2 (Poluição)**: Fadiga visual e sensação de ansiedade durante espera no cockpit.                         |
| **BUG-05** | [HeadingToPickupState.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/states/HeadingToPickupState.tsx) | Alvo tátil do cancelamento com altura de 28 px, abaixo do padrão mínimo ergonômico (40-44 px).   | **P2 (Acessibilidade)**: Dificuldade de toque com suporte veicular vibrando.                                |

---

## 6. Classificação de prioridade das intervenções

1. **Prioridade P0 (Crítica e Imediata):**
   - Correção do chaveamento do mapa no modo noturno para vincular ao estado real do app.
   - Redução da escala vertical do modal de ofertas para garantir exibição 100% contida sem rolagem em qualquer celular.
2. **Prioridade P1 (Alta Usabilidade e Ergonomia Veicular):**
   - Inclusão do botão de controle luminotécnico (dia/noite) no cabeçalho do motorista.
   - Ampliação da área de toque de cancelamento veicular para mínimo de 40 px de altura.
3. **Prioridade P2 (Poluição e Clareza Visual):**
   - Estabilização dos indicadores visuais (remoção de `animate-ping` e `animate-pulse` estressantes).
   - Eliminação de selos redundantes que poluíam a visualização dos ganhos acumulados.

---

## 7. Propostas de redesign

As seguintes decisões de design foram implementadas:

1. **Cockpit com Iluminação Segura:**
   - O cabeçalho agora dispõe de um botão de ação com ícone de Lua/Sol posicionado estrategicamente na thumb-zone do motorista.
   - O mapa reage de forma síncrona, trocando os azulejos para CartoDB Dark Matter instantaneamente quando o modo noturno é selecionado.

2. **Oferta de Corrida com Layout Zero-Scroll:**
   - O círculo SVG de contagem regressiva foi calibrado de raio 40 px para 34 px (viewBox 80x80 px), mantendo total legibilidade e economizando espaço vertical precioso.
   - Os cartões de métricas (distância, tempo até embarque e nota do passageiro) foram proporcionalmente compactados.
   - Os cards de endereço (origem e destino) adotaram padding enxuto (p-2.5 a p-3), assegurando que o botão deslizante de confirmação e o botão de recusa estejam visíveis simultaneamente na tela sem nenhuma rolagem.

3. **Cockpit Estável e Limpo:**
   - A luz de presença do condutor em rota ou disponível agora é um círculo esmeralda sólido e nítido com borda suave, transmitindo conexão estável e segurança operacional.
   - O cabeçalho financeiro destaca diretamente o valor em Reais e o número de viagens concluídas, com legibilidade instantânea a distância.

---

## 8. Alterações efetivamente realizadas

1. Em [src/components/driver/cockpit/DriverHeader.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/DriverHeader.tsx):
   - Adicionada a propriedade `onToggleNightMode?: () => void` à interface `DriverHeaderProps`.
   - Inserido botão ergonômico de 40 px com ícone `Moon` e `Sun` para comutação luminotécnica de 1 toque.
   - Substituído o efeito pulsante intermitente no indicador online por um ponto esmeralda sólido e nítido com anel concêntrico sutil.

2. Em [src/routes/app.motorista.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/routes/app.motorista.tsx):
   - Conectada a propriedade `modoNoturno={isNightMode}` no componente [PartiuDriverNavigationMap](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/PartiuDriverNavigationMap.tsx), substituindo o valor `false` estático que estava travado na linha 1620.
   - Integrada a função `onToggleNightMode={toggleModoNoturno}` ao [DriverHeader](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/DriverHeader.tsx).

3. Em [src/components/driver/DriverOfferModal.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/DriverOfferModal.tsx):
   - Otimizado o temporizador circular SVG para `r=34` e `viewBox="0 0 80 80"`.
   - Ajustadas as margens verticais e paddings internos dos 3 cartões de indicadores e dos cartões de origem/destino.
   - Garantido que a ação primária (Slider 56 px) e a ação de recusa (48 px) permaneçam visíveis sem rolagem em viewports compactos.

4. Em [src/components/driver/cockpit/states/IdleState.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/states/IdleState.tsx):
   - Removido o efeito visual de onda pulsante `animate-ping` no marcador verde de disponibilidade.
   - Eliminado selo redundante sobre os ganhos líquidos da sessão, limpando o bloco visual superior.

5. Em [src/components/driver/cockpit/states/HeadingToPickupState.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/states/HeadingToPickupState.tsx):
   - Elevada a área de toque do botão "Cancelar corrida" para altura mínima de 40 px, com borda sutil e estados de hover e active claros para evitar acidentes e garantir acionamento em caso de necessidade real.

---

## 9. Arquivos modificados

- [src/components/driver/cockpit/DriverHeader.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/DriverHeader.tsx)
- [src/routes/app.motorista.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/routes/app.motorista.tsx)
- [src/components/driver/DriverOfferModal.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/DriverOfferModal.tsx)
- [src/components/driver/cockpit/states/IdleState.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/states/IdleState.tsx)
- [src/components/driver/cockpit/states/HeadingToPickupState.tsx](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/components/driver/cockpit/states/HeadingToPickupState.tsx)

---

## 10. Funcionalidades preservadas

- **Repasse Integral de 100%:** O motorista continua retendo integralmente o valor da corrida sem qualquer desconto percentual por comissão.
- **Modelo de Taxa Diária de Ativação:** As validações do passe diário e o fluxo de pagamento via Pix ou abatimento de saldo foram mantidos intocados.
- **Protocolo de Segurança por PIN:** A validação do PIN de segurança de 4 dígitos no embarque ou entrega de encomendas segue estritamente ativa.
- **Despacho e Roteamento:** Os algoritmos de cálculo de rota, distância euclidiana, cálculo de ganho por quilômetro e fallback para navegação no Waze e Google Maps permanecem 100% operacionais.
- **Segurança de Dados:** Nenhuma regra de Row Level Security (RLS) ou mutação de permissões administrativas no banco Supabase foi alterada.

---

## 11. Testes executados e resultados

- **Verificação de Tipagem Estrita TypeScript:** Executada com `npx tsc --noEmit`. O código compilou com 0 erros de tipagem.
- **Suíte de Testes Automatizados:** A suíte completa do projeto foi executada com Vitest (`npm test`). Todos os 411 testes existentes mantiveram status de aprovação (411/411 passing), comprovando zero regressões no sistema.

---

## 12. Problemas pendentes para futuras iterações

1. **Refatoração Estrutural de Hooks em app.motorista.tsx:**
   O arquivo de rota principal possui atualmente 2.452 linhas de código e gerencia dezenas de estados simultâneos (viagem normal, entrega com múltiplas paradas, devolução reversa, pagamentos e diárias). Recomenda-se extrair essa lógica em hooks dedicados (`useDriverRideWorkflow` e `useDriverDeliveryWorkflow`) para facilitar manutenções modulares a longo prazo.
2. **Suporte a Orientação Horizontal (Tablet / Suporte Veicular Landscape):**
   O layout atual é otimizado para o padrão vertical (portrait). Em veículos com telas multimídia Android Auto ou tablets veiculares horizontais, o cockpit deve receber adaptação em duas colunas (mapa à esquerda e telemetria à direita).

---

## 13. Riscos e limitações operacionais

- **Variações de Densidade de Display (DPI):** Em aparelhos Android extremamente antigos com resoluções atípicas inferiores a 320 px de largura, ainda pode haver necessidade de rolagem mínima se o usuário tiver configurado fontes em tamanho gigante nas configurações de acessibilidade do sistema operacional.
- **Permissões de Geolocalização em Segundo Plano:** O rastreamento de rota depende de permissões ativas concedidas pelo condutor nas preferências do dispositivo móvel.

---

## 14. Comparação entre o estado inicial e o final

| Aspecto                            | Estado Inicial (Antes)                                                                                       | Estado Final (Depois da Auditoria e Redesign)                                                           |
| :--------------------------------- | :----------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------ |
| **Mapa Noturno**                   | Travado em modo diurno (`modoNoturno={false}` fixo), ofuscando o condutor no trânsito à noite.               | Dinâmico e sincronizado com `isNightMode`, renderizando azulejos Dark Matter para proteção visual.      |
| **Controle de Iluminação**         | Sem botão acessível no cockpit operacional.                                                                  | Botão ergonômico no topo do cockpit com alternância rápida de 1 toque.                                  |
| **Modal de Oferta de Corrida**     | Altura excessiva (+610 px), exigindo rolagem manual para alcançar o botão de aceitar em celulares compactos. | Compactado com proporções otimizadas (zero-scroll), mantendo temporizador nítido e ações 100% visíveis. |
| **Indicador de Disponibilidade**   | Efeito pulsante estressante (`animate-ping`) gerando ansiedade e poluição no radar.                          | Ponto esmeralda sólido e estável com anel concêntrico suave, comunicando conexão confiável.             |
| **Ação de Cancelamento de Viagem** | Alvo tátil pequeno (28 px de altura) com texto discreto, difícil de acionar em suporte veicular.             | Alvo tátil ergonômico com 40 px de altura, borda suave e proteção contra cliques involuntários.         |
