# 05 - ANÁLISE PROFUNDA DA MONETIZAÇÃO E CONFLITOS DE REGRAS

> **Investigação de Modelos Comerciais:** Exame comparativo entre a intermediação tradicional por comissão (99) e o modelo de assinatura de software Pure SaaS (PARTIU).

---

### 1. O Modelo Comercial da 99 vs. Modelo Comercial do PARTIU

| Eixo de Análise | Modelo da 99 (Referência de Mercado) | Modelo do PARTIU (Implementado no Código) |
| :--- | :--- | :--- |
| **Arquétipo Comercial** | Marketplace com intermediação financeira e retenção de comissão variável (*Take Rate* de 15% a 30%). | Software as a Service (Pure SaaS) para motoristas parceiros com **0.0% de comissão por corrida**. |
| **Evento Gerador de Receita** | A conclusão de cada corrida individual. | A compra de acesso temporal (Diária de 24h, Semanal ou Mensal) via PIX. |
| **Fluxo do Dinheiro da Viagem** | O passageiro paga a 99 (via app ou dinheiro); a 99 retém a taxa e repassa o líquido para a carteira virtual do motorista. | O passageiro paga **diretamente ao motorista** (PIX ou dinheiro) ou via gateway que repassa 100% (`trg_rides_zero_commission`). |
| **Previsibilidade Financeira** | Depende 100% do volume diário de viagens (alto risco em recessão). | Receita recorrente estável e previsível descolada do número de viagens. |
| **Barreira de Entrada para Motoristas** | Baixa no início (cadastro grátis), mas alta rejeição no médio prazo devido às altas comissões da plataforma. | Mínima barreira com período de degustação (*Trial* de 3 a 7 dias gratuitos) e custo fixo previsível. |

---

### 2. Avaliação dos 5 Cenários Comerciais Históricos do PARTIU

Ao investigar o repositório, identificamos menções históricas a 5 abordagens. Abaixo, a avaliação forense de cada uma:

#### Modelo 1: Comissão Padrão de 12% (88% destinados ao motorista)
* **Status no Código:** **Superado / Legado**. 
* **Evidência:** A migração `20261007_partiu_pure_saas_subscription_zero_take_rate.sql` introduziu a trigger `trg_rides_zero_commission` que anula formalmente a cobrança de comissão percentual, forçando `platform_fee := 0.00`.
* **Diagnóstico:** A comissão de 12% é comum em cooperativas, mas perde a proposta de valor disruptiva frente ao Pure SaaS.

#### Modelo 2: Corridas com Pagamento Direto e Comissão Zero (Pure SaaS Vigente)
* **Status no Código:** **Ativo e Oficial**.
* **Evidência:** Arquivos `PixBillingService.ts`, `driver-subscription-service.ts` e suíte de testes `monetization-ecosystem-consolidation.test.ts` (100% aprovada).
* **Diagnóstico:** É o modelo mais competitivo para atrair motoristas de Uber e 99 em cidades regionais. O motorista fica com 100% do valor da corrida e paga uma taxa fixa de acesso para trabalhar.

#### Modelo 3: Plano Driver Club Black com Taxa de 9,9%
* **Status no Código:** **Incompatível com o modelo vigente**.
* **Diagnóstico:** Cobrar uma mensalidade para reduzir a taxa de 12% para 9,9% é um modelo híbrido confuso que gera desconfiança no condutor. Se o PARTIU já adota taxa zero, o Driver Club Black com taxa percentual deve ser formalmente aposentado.

#### Modelo 4: Assinatura PARTIU Prime por R$ 19,90
* **Status no Código:** **Conflitante em escopo**.
* **Diagnóstico:** Em `white-label-engine.ts` e `subscription-engine.ts`, o valor de R$ 19,90 aparece ora como assinatura mensal de motorista moto, ora como plano de passageiro com desconto em corridas. Recomenda-se manter o "PARTIU Prime" exclusivamente como programa de vantagens para o **passageiro** (ex: isenção de taxa de cancelamento e prioridade no embarque), e não como plano de motorista.

#### Modelo 5: Acesso por Diária (R$ 9,90 a R$ 14,90 por 24 horas)
* **Status no Código:** **Ativo e Validado**.
* **Evidência:** Método `generateDailyFeePix` em `driver-subscription-service.ts` e registros em `PixBillingService.ts`.
* **Diagnóstico:** É a principal porta de entrada para motoristas casuais (que rodam apenas sextas, sábados ou finais de semana).

---

### 3. As 4 Divergências de Catálogos Encontradas no Código

Identificamos que quatro arquivos definem tabelas de preços diferentes:

1. **Catálogo A (Banco Oficial e PixBillingService):**
   * Diária Essencial: R$ 14,90 (24h)
   * Semanal Pro: R$ 69,90 (7 dias)
   * Mensal Ouro: R$ 199,90 (30 dias)
   * Trial: 3 dias grátis
2. **Catálogo B (Superadmin Config):**
   * Diária Carro: R$ 19,90 / Moto: R$ 11,90
   * Semanal Carro: R$ 99,00 / Moto: R$ 59,00
   * Mensal Carro: R$ 349,00 / Moto: R$ 199,00
3. **Catálogo C (Revenue OS Local):**
   * Bronze: R$ 149,90/mês
   * Prata: R$ 199,90/mês
   * Ouro: R$ 99,90/mês (incoerência: Ouro mais barato que Prata)
4. **Catálogo D (White Label Engine Legado):**
   * Mantém planos com comissões de 5%, 3%, 1% e 0%.

> [!IMPORTANT]
> **Recomendação de Saneamento:**  
> Os Catálogos B, C e D devem ser desativados. A tabela `monetization_plans` do PostgreSQL (Catálogo A) deve ser a **ÚNICA** fonte da verdade em todo o sistema.
