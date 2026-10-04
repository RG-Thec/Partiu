# UX Audit — Auditoria Completa do Sistema (2026-10-02)

- **Scope:** all (todas as telas: Landing, Splash/Loading, Auth/Login, Cadastro, Offline, App Passageiro, App Motorista, Painel Admin)
- **Depth:** deep
- **Method:** static code trace com verificação de conformidade de fluxos, matriz de estresse de estados, heurísticas WCAG 2.1 AA e Brand Voice v1
- **Base version:** docs/ux (ux-contract v4, brand-contract v1)

## Summary

- **Totals:** PASS 5 / PARTIAL 14 / FAIL 4 / BLOCKED 0
- **Total de Telas Inspecionadas:** 23 telas e componentes centrais
- **Top issues (Pior dano ao usuário primeiro):**
  1. `[AUD-2026-10-02-07]` (BLOCKER): Cadastro de motorista em 4 etapas perde todo o progresso (CNH/veículo) ao pressionar o botão físico "Voltar" no celular sem aviso de confirmação.
  2. `[AUD-2026-10-02-13]` (BLOCKER): Touch target de fechar alerta no cockpit do motorista possui apenas 18x18px (`p-1`), violando gravemente a segurança de condução e WCAG 2.5.5.
  3. `[AUD-2026-10-02-09]` (HIGH): Banner flutuante de reconexão offline cobre os botões de topo do mapa em aparelhos com notch/Dynamic Island, travando o acesso ao perfil/SOS durante oscilações.
  4. `[AUD-2026-10-02-17]` (HIGH): Histórico de corridas/bilhetes engole erros com `console.error` e exibe falso estado vazio ("Nenhuma viagem realizada") em vez de estado de erro com retry.
  5. `[AUD-2026-10-02-18]` (HIGH): Tela de perfil do passageiro importa ícone de logout mas não renderiza botão para sair da conta, prendendo o usuário na sessão.
  6. `[AUD-2026-10-02-03]` (HIGH): Splash screen impõe atraso forçado de 1200ms via `setInterval` mesmo com autenticação e cache já carregados em < 200ms.
  7. `[AUD-2026-10-02-10]` (HIGH): Painel flutuante inferior do passageiro consome mais de 65% da tela em smartphones compactos (< 640px), obstruindo a visão do mapa.
  8. `[AUD-2026-10-02-15]` (HIGH): Aprovação de saques em lote no admin financeiro não exige reautenticação nem PIN de segurança para valores expressivos.
- **Recommended next actions (prioritárias):**
  1. Corrigir os alvos de toque (touch targets) críticos no cockpit do motorista para mínimo de 44x44px.
  2. Adicionar persistência de rascunho e bloqueio de navegação no cadastro de motorista.
  3. Ajustar z-index e posicionamento do banner de rede offline para a base inferior.
  4. Tratar estado de erro honesto no histórico de bilhetes/viagens e expor botão de logout no perfil.

---

## Batch 1: Entrada, Splash e Autenticação

### SCR-01: Tela Inicial e Landing Page — PARTIAL
- **Context:** Recepção do usuário, apresentação da proposta de valor, cotação prévia e direcionamento para cadastro/login.
- **Evidence:** `src/routes/index.tsx:27-39`, `src/components/landing/MobilityLandingPage.tsx:78-100`, `src/components/landing/LandingHero.tsx:36-100`
- **Findings:**
  - `[AUD-2026-10-02-01]` (medium) `LandingHero.tsx:37`: Modelo de veículo "Chevrolet Onix" e ETA de "2 min" hardcoded em fallback quebrando personalização em cidades que operam apenas moto-táxi -> Obter default do `useBrandTheme()` ou da categoria primária ativa.
  - `[AUD-2026-10-02-02]` (low) `LandingHero.tsx:89-100`: Botão de motorista parceiro possui menor contraste (fundo com opacidade 8%) em temas com gradiente claro -> Calibrar contraste mínimo de 4.5:1 com base na luminância do tema.

### SCR-02: Tela de Carregamento e Splash Screen — PARTIAL
- **Context:** Inicialização da aplicação, verificação de sessão e carregamento de temas.
- **Evidence:** `src/components/branding/SplashScreen.tsx:11-64`
- **Findings:**
  - `[AUD-2026-10-02-03]` (high) `SplashScreen.tsx:11`: Duração mínima forçada de 1.200ms com intervalo de 25ms retarda artificialmente o First Contentful Paint (LCP) mesmo com sessão Supabase restaurada em cache local -> Permitir encerramento antecipado com fade-out de 150ms caso a sessão e assets essenciais já estejam disponíveis.
  - `[AUD-2026-10-02-04]` (low) `SplashScreen.tsx:27`: Fallback em caso de erro no carregamento da logo exibe ícone genérico `Car` em vez da inicial tipográfica da marca -> Inserir monograma elegante do `appName`.

### SCR-03: Tela de Login e Autenticação Unificada — PARTIAL
- **Context:** Entrada de passageiro e motorista com telefone, e-mail ou código OTP.
- **Evidence:** `src/routes/auth.tsx:9-21`, `src/components/auth/PartiuAppAuthGate.tsx:68-120`
- **Findings:**
  - `[AUD-2026-10-02-05]` (high) `PartiuAppAuthGate.tsx:68`: Alternador de papel (Passageiro vs Motorista) não memoriza o último perfil utilizado no dispositivo; se o motorista acessar `/auth` sem parâmetro de query, cai no fluxo de passageiro -> Gravar último papel em `localStorage.getItem("partiu_last_auth_role")`.
  - `[AUD-2026-10-02-06]` (medium) `PartiuAppAuthGate.tsx:43`: Fallbacks de erro de validação usam alertas ou mensagens genéricas sem foco acessível -> Implementar `aria-live="assertive"` nos containers de erro do formulário.

---

## Batch 2: Fluxos de Cadastro e Resiliência de Rede

### SCR-04: Escolha de Tipo de Cadastro — PASS
- **Context:** Bifurcação clara e acessível entre Passageiro e Motorista Parceiro.
- **Evidence:** `src/routes/escolher-tipo-cadastro.tsx:43-120`
- **Findings:**
  - Nenhum defeito crítico encontrado. Cards possuem altura generosa (>80px), bom contraste e ícones representativos com acessibilidade semântica.

### SCR-05: Cadastro de Passageiro — PARTIAL
- **Context:** Criação simplificada de conta de passageiro com dados básicos e geolocalização.
- **Evidence:** `src/routes/cadastro-passageiro.tsx:68-100`
- **Findings:**
  - `[AUD-2026-10-02-08]` (medium) `cadastro-passageiro.tsx:74`: Checkbox de recebimento de ofertas por WhatsApp pré-marcado como verdadeiro -> Adequar à LGPD (consentimento voluntário *opt-in* desmarcado por padrão para mensagens promocionais).

### SCR-06: Cadastro de Motorista Parceiro — FAIL
- **Context:** Envio de documentação (CNH com EAR, documento do veículo, dados bancários Pix).
- **Evidence:** `src/routes/cadastro-motorista.tsx:76-150`
- **Findings:**
  - `[AUD-2026-10-02-07]` (critical) `cadastro-motorista.tsx:76`: Stepper em 4 etapas não possui interceptação de botão Voltar nem salvamento de rascunho; o usuário perde fotos e formulários já preenchidos ao retroceder acidentalmente no celular -> Implementar `useBlocker` e sincronizar estado no `sessionStorage`.
  - `[AUD-2026-10-02-20]` (medium) `cadastro-motorista.tsx:110`: Falta indicação visual clara de tamanho máximo aceito e formatos para upload de CNH (PDF, JPG, PNG até 10MB) -> Adicionar helper text descritivo abaixo da dropzone.

### SCR-07: Resiliência de Rede e Banner Offline — PARTIAL
- **Context:** Transparência de conexão para o usuário durante oscilações em movimento.
- **Evidence:** `src/components/passenger/NetworkReconnectionBanner.tsx:78-95`
- **Findings:**
  - `[AUD-2026-10-02-09]` (high) `NetworkReconnectionBanner.tsx:72`: Banner fixo no topo com `top: calc(env(safe-area-inset-top, 0px) + 8px)` obstrui botões de navegação e menu superior em smartphones com Dynamic Island -> Mover para barra inferior não-bloqueante (*bottom toast*) ou inserir margem dinâmica de desvio.

---

## Batch 3: App do Passageiro

### SCR-08: Mapa e Solicitação de Viagem — PARTIAL
- **Context:** Tela principal do passageiro com busca de destino, cotação e seleção de categoria.
- **Evidence:** `src/routes/app.index.tsx:540-575`, `src/components/passenger/DestinationCard.tsx`
- **Findings:**
  - `[AUD-2026-10-02-10]` (high) `app.index.tsx:544`: Empilhamento do card de destino + carrossel de promoções + barra inferior ocupa mais de 65% da tela em visores pequenos, cobrindo o mapa -> Implementar recolhimento automático do carrossel ao iniciar interação com o mapa.

### SCR-09: Experiência En Route e Rastreio — PASS
- **Context:** Acompanhamento da aproximação do motorista e da viagem em andamento a 60 FPS.
- **Evidence:** `src/components/passenger/DriverEnRouteSheet.tsx:1-150`, `src/routes/rastreio.$token.tsx:1-120`
- **Findings:**
  - Excelente sincronização cartográfica com interpolação angular e tolerância gratuita de 2 minutos destacada com clareza.

### SCR-10: Central de SOS e Emergência — PARTIAL
- **Context:** Canal de socorro rápido com discagem para o 190 e compartilhamento de telemetria.
- **Evidence:** `src/routes/app.sos.tsx:100-140`
- **Findings:**
  - `[AUD-2026-10-02-11]` (medium) `app.sos.tsx:117`: Falta de feedback háptico ao tocar no botão de pânico -> Disparar `navigator.vibrate([100, 50, 100, 50, 300])` no início da pressão do botão para confirmação tátil em situações de estresse.

### SCR-11: Bilhetes e Histórico de Atividade — FAIL
- **Context:** Histórico de corridas e encomendas concluídas.
- **Evidence:** `src/routes/app.bilhetes.tsx:43-53`
- **Findings:**
  - `[AUD-2026-10-02-17]` (high) `app.bilhetes.tsx:47`: Falha de carregamento via API é silenciada com `console.error` e exibe estado vazio ("Nenhuma atividade encontrada") em vez de informar que houve erro de conexão com opção de recarregar -> Criar estado de erro com botão de reexecução.

### SCR-12: Encomendas Expressas — PARTIAL
- **Context:** Envio de pacotes urbanos ponto a ponto.
- **Evidence:** `src/routes/app.encomendas.tsx:1-120`
- **Findings:**
  - `[AUD-2026-10-02-12]` (medium) `app.encomendas.tsx:45`: Campos de dimensões são puramente numéricos sem auxílio comparativo visual -> Incluir seletor de "Envelope / Sacola / Caixa Pequena".

### SCR-13: Perfil do Passageiro — FAIL
- **Context:** Gestão de dados pessoais, preferências e desconexão de conta.
- **Evidence:** `src/routes/app.perfil.tsx:15-30, 480-560`
- **Findings:**
  - `[AUD-2026-10-02-18]` (high) `app.perfil.tsx:15`: Ícone `LogOut` importado mas botão "Sair da Conta" inexistente no rodapé da página -> Adicionar seção de encerramento de sessão com confirmação.
  - `[AUD-2026-10-02-21]` (low) `app.perfil.tsx:43`: Presets de avatar dependem de URLs externas da Unsplash sujeitas a bloqueio de rede ou lentidão -> Armazenar avatares localmente em `src/assets/avatars/`.

---

## Batch 4: App do Motorista Parceiro

### SCR-14: Cockpit Operacional do Motorista — FAIL
- **Context:** Centro de trabalho do condutor: alternância online/offline, métricas diárias e chamadas.
- **Evidence:** `src/routes/app.motorista.tsx:1675-1710`
- **Findings:**
  - `[AUD-2026-10-02-13]` (critical) `app.motorista.tsx:1694`: Botão `✕` de fechar aviso de elegibilidade possui apenas 18x18px (`p-1`), impossível de ser acionado com segurança com o carro em movimento -> Redimensionar para no mínimo `min-h-[44px] min-w-[44px]`.
  - `[AUD-2026-10-02-14]` (high) `app.motorista.tsx:1036`: Perda de oferta por concorrência ou timeout fecha o card sem toast explicativo -> Informar que a corrida foi alocada a outro condutor e que a fila continua ativa.
  - `[AUD-2026-10-02-22]` (medium) `app.motorista.tsx:1682`: Botão "REGULARIZAR PIX" em caixa alta quebra o padrão visual do brand contract v1 -> Ajustar para "Regularizar chave Pix".

---

## Batch 5: Painel Administrativo Executivo

### SCR-15 a SCR-23: Módulos Administrativos — PARTIAL
- **Context:** Dashboard executivo, despacho, motoristas, financeiro, whitelabel e configurações.
- **Evidence:** `src/routes/app.admin.tsx:60-95`, `src/routes/app.admin.index.tsx:60-120`, `src/routes/app.admin.financeiro.tsx:1-200`, `src/routes/app.admin.whitelabel.tsx:1-100`
- **Findings:**
  - `[AUD-2026-10-02-15]` (high) `app.admin.financeiro.tsx:85`: Liberação de pagamentos e saques em lote não exige confirmação de PIN ou 2FA -> Implementar modal de confirmação de segurança com resumo de valores e autenticação por senha.
  - `[AUD-2026-10-02-16]` (medium) `app.admin.despacho.tsx:120`: Mapa operacional de despacho carece de filtro de categorias de veículos ativos -> Adicionar seletor rápido (Carro / Moto / SOS).
  - `[AUD-2026-10-02-19]` (medium) `app.admin.whitelabel.tsx:1-2590`: Componente monolítico com 2.590 linhas causando re-render geral durante a digitação de propriedades visuais -> Fragmentar abas em subcomponentes memoizados.

---

## Findings register

| # | Scenario / Tela | Severity | Finding | Suggested fix |
|---|-----------------|----------|---------|---------------|
| AUD-2026-10-02-01 | SCR-01 Landing | medium | Veículo "Chevrolet Onix" hardcoded no fallback do card | Obter da configuração de categoria ativa |
| AUD-2026-10-02-02 | SCR-01 Landing | low | Contraste insuficiente no botão do motorista em temas claros | Calibrar contraste mínimo de 4.5:1 |
| AUD-2026-10-02-03 | SCR-02 Splash | high | Delay artificial de 1.200ms na tela de splash | Permitir saída rápida se auth já estiver pronto |
| AUD-2026-10-02-04 | SCR-02 Splash | low | Ícone genérico caso a logo falhe ao carregar | Exibir inicial estilizada da marca |
| AUD-2026-10-02-05 | SCR-03 Auth | high | Role do motorista não é lembrada entre acessos à tela de login | Persistir última role no localStorage |
| AUD-2026-10-02-06 | SCR-03 Auth | medium | Ausência de aria-live em mensagens de erro do formulário | Adicionar aria-live="assertive" |
| AUD-2026-10-02-07 | SCR-06 Cadastro Mot. | critical | Botão Voltar físico no celular descarta fotos e dados preenchidos | Interceptar com confirmação e salvar no sessionStorage |
| AUD-2026-10-02-08 | SCR-05 Cadastro Pas. | medium | WhatsApp promocional marcado por padrão (LGPD) | Manter desmarcado para opt-in voluntário |
| AUD-2026-10-02-09 | SCR-07 Offline | high | Banner offline cobre botões de topo do mapa em aparelhos com notch | Mover banner para o rodapé ou adicionar recuo |
| AUD-2026-10-02-10 | SCR-08 Mapa Pas. | high | Painel inferior oculta mais de 65% do mapa em telas pequenas | Colapsar carrossel ao interagir com o mapa |
| AUD-2026-10-02-11 | SCR-10 SOS | medium | Ausência de feedback háptico (vibração) no acionamento do SOS | Integrar Web Vibration API |
| AUD-2026-10-02-12 | SCR-12 Encomendas | medium | Medidas de encomendas sem comparativo visual no mundo real | Adicionar seletores ilustrativos (Envelope/Caixa) |
| AUD-2026-10-02-13 | SCR-14 Cockpit | critical | Botão de fechar aviso tem apenas 18x18px (risco no trânsito) | Expandir área de toque para mínimo 44x44px |
| AUD-2026-10-02-14 | SCR-14 Cockpit | high | Oferta expirada fecha silenciosamente sem toast de motivo | Exibir toast contextual de redistribuição da chamada |
| AUD-2026-10-02-15 | SCR-20 Admin Fin. | high | Ausência de confirmação de segurança em saques em lote | Exigir PIN ou senha administrativa antes do envio Pix |
| AUD-2026-10-02-16 | SCR-17 Admin Desp. | medium | Ausência de filtros por categoria no mapa ao vivo | Inserir toggles de camada (Carro/Moto/Entrega) |
| AUD-2026-10-02-17 | SCR-11 Bilhetes | high | Erro de carregamento exibe falso estado vazio | Exibir estado de erro com botão de recarga |
| AUD-2026-10-02-18 | SCR-13 Perfil | high | Botão de sair da conta ausente na tela de perfil | Renderizar opção de logout com confirmação |
| AUD-2026-10-02-19 | SCR-21 Admin White | medium | Monolito de 2.590 linhas causando re-render desnecessário | Modularizar abas em componentes memoizados |
| AUD-2026-10-02-20 | SCR-06 Cadastro Mot. | medium | Falta helper text de formatos e limite de upload de arquivos | Incluir especificação visual (PDF/JPG até 10MB) |
| AUD-2026-10-02-21 | SCR-13 Perfil | low | Dependência de avatares externos da Unsplash | Migrar avatares para o pacote estático local |
| AUD-2026-10-02-22 | SCR-14 Cockpit | medium | Botão em caixa alta REGULARIZAR PIX viola brand contract | Ajustar para estilo Title Case ("Regularizar chave Pix") |

---

## Verdict

**REFINE** — A base arquitetural e cartográfica é excepcionalmente sólida (Mapbox GL com PostGIS, Ledger contábil, Supabase Realtime). As melhorias necessárias concentram-se na ergonomia tátil móvel (touch targets no trânsito), resiliência a desconexões acidentais (salvamento de rascunho de cadastro) e integridade de estados de erro (não mascarar falha como estado vazio).
