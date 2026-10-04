# UX Plan — Plano de Melhoria Geral do Sistema (2026-10-02)

Plano de ação derivado da auditoria profunda de 2026-10-02, ordenado pelo índice de priorização:
$$\text{Score} = \text{Frequência (1-5)} \times \text{Severidade (1-5)} \times \text{Solubilidade (1-5)}$$

---

## 🎯 Matriz de Priorização (F × S × V)

| Prioridade | Finding | Tela Afetada | Freq (1-5) | Sev (1-5) | Solv (1-5) | Score (F×S×V) | Ação Resumida |
|---|---|---|---|---|---|---|---|
| **P0** | AUD-2026-10-02-13 | SCR-14 Cockpit Motorista | 5 | 5 | 5 | **125** | Aumentar touch target do botão de fechar alerta para 44x44px |
| **P0** | AUD-2026-10-02-07 | SCR-06 Cadastro Motorista | 4 | 5 | 5 | **100** | Adicionar bloqueio de retorno e persistência de rascunho de CNH |
| **P1** | AUD-2026-10-02-18 | SCR-13 Perfil Passageiro | 4 | 4 | 5 | **80** | Inserir botão explícito de "Sair da Conta" com confirmação |
| **P1** | AUD-2026-10-02-17 | SCR-11 Bilhetes/Histórico | 4 | 4 | 5 | **80** | Substituir falso estado vazio por card de erro com retry |
| **P1** | AUD-2026-10-02-09 | SCR-07 Banner Offline | 5 | 4 | 4 | **80** | Reposicionar banner de rede para não obstruir topo em Dynamic Island |
| **P1** | AUD-2026-10-02-05 | SCR-03 Auth Gate | 5 | 4 | 4 | **80** | Memorizar último perfil (Passageiro vs Motorista) no login |
| **P2** | AUD-2026-10-02-10 | SCR-08 Mapa Passageiro | 5 | 4 | 3 | **60** | Colapsar carrossel ao focar no mapa garantindo Half-Map Zone |
| **P2** | AUD-2026-10-02-14 | SCR-14 Cockpit Motorista | 4 | 4 | 3 | **48** | Exibir toast explicativo quando chamada for perdida por concorrência |
| **P2** | AUD-2026-10-02-03 | SCR-02 Splash Screen | 5 | 3 | 3 | **45** | Eliminar atraso artificial de 1200ms se auth já estiver em cache |
| **P2** | AUD-2026-10-02-15 | SCR-20 Admin Financeiro | 3 | 4 | 3 | **36** | Exigir confirmação de segurança com PIN para lotes de repasse Pix |
| **P3** | AUD-2026-10-02-11 | SCR-10 SOS Emergência | 2 | 4 | 4 | **32** | Adicionar vibração háptica contínua no toque do botão SOS |
| **P3** | AUD-2026-10-02-08 | SCR-05 Cadastro Passageiro | 4 | 3 | 5 | **60** | Desmarcar WhatsApp por padrão para conformidade total LGPD |
| **P3** | AUD-2026-10-02-01 | SCR-01 Landing Page | 5 | 2 | 4 | **40** | Dinamizar modelo de veículo e tempo no card da landing |
| **P3** | AUD-2026-10-02-22 | SCR-14 Cockpit Motorista | 3 | 2 | 5 | **30** | Corrigir texto para Title Case ("Regularizar chave Pix") |

---

## 🛠️ Especificações de Mudanças por Tela

### 1. Cockpit do Motorista (`src/routes/app.motorista.tsx`)
- **Linha 1694**: Modificar o botão de fechar alerta de elegibilidade:
  - De: `className="p-1 text-destructive hover:opacity-80 cursor-pointer"`
  - Para: `className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-destructive hover:bg-destructive/10 rounded-full transition-all cursor-pointer"` com `aria-label="Dispensar alerta"`.
- **Linha 1040**: No `handleAceitarOferta`, em caso de corrida já aceita por terceiro ou timeout:
  - Disparar toast informativo: *"Esta corrida foi assumida por outro condutor próximo. Você continua na fila prioritária de despacho."*
- **Linha 1682**: Modificar texto do botão de regularização Pix de `"REGULARIZAR PIX"` para `"Regularizar chave Pix"`.

### 2. Cadastro de Motorista (`src/routes/cadastro-motorista.tsx`)
- **Estado de Etapa**: Adicionar `sessionStorage.setItem("partiu_cad_motorista_draft", JSON.stringify(formData))` a cada transição de etapa (1 a 4).
- **Proteção de Navegação**: Adicionar diálogo de confirmação destrutiva (`channels.md: destructive confirm`) caso o motorista tente sair da página enquanto houver dados ou fotos anexadas:
  - Texto: *"Deseja sair do cadastro? Suas fotos e dados preenchidos serão salvos como rascunho por 24 horas neste aparelho."*

### 3. Perfil do Passageiro (`src/routes/app.perfil.tsx`)
- **Rodapé da Página**: Adicionar bloco de encerramento de sessão antes de `</main>`:
  - Botão com ícone `LogOut`, texto "Sair da Conta", estilo `destructive/outline`, altura mínima de 48px e confirmação: *"Deseja realmente sair da sua conta PARTIU?"*.

### 4. Histórico de Bilhetes e Atividade (`src/routes/app.bilhetes.tsx`)
- **Linha 43-53**: Adicionar estado `erroCarregamento: boolean`.
- Na renderização, se `erroCarregamento === true`, exibir card central com ícone `AlertTriangle`, texto *"Não foi possível sincronizar suas viagens recentes"*, e botão primário *"Tentar novamente"* executando `carregarHistorico()`.

### 5. Banner Offline e Resiliência (`src/components/passenger/NetworkReconnectionBanner.tsx`)
- **Linha 72**: Alterar posicionamento de topo para flutuante inferior acima da Bottom Bar:
  - `bottom: calc(env(safe-area-inset-bottom, 0px) + 72px)`, eliminando conflitos de toque com menus, barras de busca e a câmera frontal/Dynamic Island.

### 6. Autenticação e Login (`src/components/auth/PartiuAppAuthGate.tsx`)
- **Linha 68**: Ler e persistir `activeRole` em `localStorage.setItem("partiu_last_role", activeRole)` no evento de alternância de abas.

---

## 📋 Tabela de Alterações de Código (CREATE / MODIFY / DELETE)

| Ação | Arquivo | Linhas | Traces (Finding / Scenario) | Descrição da Intervenção |
|---|---|---|---|---|
| **MODIFY** | `src/routes/app.motorista.tsx` | 1690-1702 | AUD-2026-10-02-13 (SCN-002) | Expandir touch target do botão fechar para min 44x44px com foco acessível |
| **MODIFY** | `src/routes/app.motorista.tsx` | 1036-1055 | AUD-2026-10-02-14 (SCN-002) | Adicionar toast explicativo para corridas assumidas por concorrência |
| **MODIFY** | `src/routes/app.motorista.tsx` | 1680-1685 | AUD-2026-10-02-22 (SCN-004) | Atualizar string para padrão Title Case sem caixa alta ("Regularizar chave Pix") |
| **MODIFY** | `src/routes/cadastro-motorista.tsx` | 76-115 | AUD-2026-10-02-07 (SCN-006) | Inserir persistência de rascunho de CNH/veículo e alerta de saída acidental |
| **MODIFY** | `src/routes/app.perfil.tsx` | 480-488 | AUD-2026-10-02-18 (SCN-008) | Renderizar botão visível de Logout com diálogo de confirmação |
| **MODIFY** | `src/routes/app.bilhetes.tsx` | 40-65 | AUD-2026-10-02-17 (SCN-007) | Tratar estado de erro com botão de reexecução em vez de falso estado vazio |
| **MODIFY** | `src/components/passenger/NetworkReconnectionBanner.tsx` | 70-80 | AUD-2026-10-02-09 (SCN-005) | Reposicionar banner de rede para base inferior desobstruindo o mapa |
| **MODIFY** | `src/components/auth/PartiuAppAuthGate.tsx` | 65-80 | AUD-2026-10-02-05 (SCN-001) | Memorizar papel de acesso (Motorista vs Passageiro) no localStorage |
| **MODIFY** | `src/routes/cadastro-passageiro.tsx` | 74 | AUD-2026-10-02-08 (SCN-006) | Definir `receberWhatsApp` como false por padrão para conformidade LGPD |
| **MODIFY** | `src/routes/app.sos.tsx` | 110-120 | AUD-2026-10-02-11 (SCN-003) | Adicionar vibração háptica no toque do botão SOS de emergência |
