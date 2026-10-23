# 09 - MATRIZ DE RISCOS, DEPENDÊNCIAS E LACUNAS DE VALIDAÇÃO

> **Governança de Riscos:** Identificação proativa de pontos de falha técnicos, dependências de fornecedores terceiros e premissas que dependem de testes de campo.

---

### 1. Riscos Técnicos e Mitigações

| Risco Técnico | Probabilidade | Impacto | Estratégia de Mitigação no PARTIU |
| :--- | :---: | :---: | :--- |
| **Corte de Conexão pelo Doze Mode do Android** | Alta | Crítico | Implementar Push FCM de alta prioridade com flag `priority: high` associado a polling HTTP de reconciliação a cada 3s. |
| **Explosão de Custos com APIs de Mapas** | Média | Alto | Utilizar o deadband inteligente já existente (30m / 5s) e cachear respostas de geocodificação no cliente e no Supabase. |
| **Falha em Testes Unitários de Cascata** | Alta | Médio | Corrigir a inicialização de mocks de condutores no teste `partiu-dispatch-engine-v4.test.ts` para evitar transição precoce para `EXHAUSTED`. |
| **Latência na Geração de PIX pelo Gateway** | Baixa | Médio | Implementar fallback de múltiplos provedores (ex: Efí Bank + Asaas) para garantir geração instantânea do QR Code. |

---

### 2. Riscos de Negócio e Marketplace

| Risco de Negócio | Probabilidade | Impacto | Estratégia de Mitigação no PARTIU |
| :--- | :---: | :---: | :--- |
| **Deserção de Motoristas por Falta de Passageiros** | Alta | Crítico | Oferecer período de degustação (*Trial*) gratuito de 7 a 14 dias no lançamento regional até atingir liquidez de chamadas. |
| **Inadimplência de Diárias em Corridas no Dinheiro** | Média | Alto | A trava de saldo devedor do `DriverWalletEngine` (bloqueio automático ao atingir R$ 50,00) impede acúmulo de prejuízo. |
| **Rejeição da Taxa de Cancelamento por Passageiros** | Média | Médio | Transparência total: exibir aviso explícito na tela de que o cancelamento após 2 minutos gera taxa de deslocamento para o parceiro. |

---

### 3. Lacunas de Validação de Campo (Hipóteses a Testar)
1. **Janela de Aceite de 10s vs 15s:** Testar se o motorista regional brasileiro reage adequadamente em 10 segundos no trânsito ou se 15 segundos reduz a taxa de expiração acidental.
2. **Valor da Diária Regional:** Validar se a diária de R$ 14,90 possui a mesma aceitação em cidades de 50 mil habitantes frente a capitais.
