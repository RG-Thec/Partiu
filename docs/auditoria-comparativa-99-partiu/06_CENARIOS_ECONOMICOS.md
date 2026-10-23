# 06 - MODELO ECONÔMICO, UNIT ECONOMICS E CENÁRIOS PARAMÉTRICOS

> **Modelagem Financeira:** Equações de viabilidade, sensibilidade de liquidez, custo de infraestrutura e análise comparativa de rentabilidade.

---

### 1. Fórmulas Oficiais da Economia da Plataforma

#### A. Receita Bruta da Plataforma (Gross Platform Revenue)
$$\text{Receita Bruta} = \sum \text{Assinaturas Mensais} + \sum \text{Passes Semanais} + \sum \text{Diárias Pagas} + \sum \text{Taxas de Cancelamento (No-Show)}$$

#### B. Margem de Contribuição Operacional (Contribution Margin)
$$\text{Margem de Contribuição} = \text{Receita Bruta} - \text{Custos de Gateway PIX} - \text{Custos de Mapas (Mapbox)} - \text{Infraestrutura Cloud} - \text{Suporte Técnico}$$

* *Nota de Rigor:* No modelo Pure SaaS do PARTIU, o Volume Bruto de Mercadorias (GMV - soma de todas as corridas pagas pelos passageiros) **não é receita da plataforma**. A receita é gerada estritamente pelo licenciamento do software aos motoristas.

---

### 2. Análise de Ponto de Equilíbrio (*Break-Even*) para o Motorista

Para o motorista parceiro, a adesão ao PARTIU é matematicamente vantajosa frente à 99/Uber:

| Cenário de Trabalho do Motorista | Faturamento Bruto Semanal | Desconto Médio na 99 (25% Comissão) | Custo no PARTIU (Plano Semanal Pro) | Ganho Líquido Adicional no PARTIU |
| :--- | :--- | :--- | :--- | :--- |
| **Motorista Part-Time** (20 corridas/sem) | R$ 400,00 | R$ 100,00 | R$ 69,90 | **+ R$ 30,10 / semana** |
| **Motorista Full-Time** (70 corridas/sem) | R$ 1.500,00 | R$ 375,00 | R$ 69,90 | **+ R$ 305,10 / semana (+ R$ 1.220/mês)** |
| **Motorista Intenso** (120 corridas/sem) | R$ 2.600,00 | R$ 650,00 | R$ 69,90 | **+ R$ 580,10 / semana (+ R$ 2.320/mês)** |

* **Conclusão:** O ponto de equilíbrio (*break-even*) do motorista é atingido com apenas **R$ 280,00 faturados por semana** (cerca de 14 a 15 corridas). A partir desse volume, o PARTIU passa a ser expressivamente mais rentável que qualquer aplicativo tradicional de intermediação.

---

### 3. Cenários Paramétricos de Faturamento da Plataforma (Base: Praça Regional com 100 Motoristas Ativos)

Considerando uma cidade média (100.000 a 250.000 habitantes) com frota de 100 motoristas cadastrados:

| Parâmetro de Mercado | Cenário Conservador | Cenário Intermediário | Cenário Otimista |
| :--- | :--- | :--- | :--- |
| **Motoristas Mensalistas (R$ 199,90)** | 20 condutores (R$ 3.998) | 45 condutores (R$ 8.995) | 65 condutores (R$ 12.993) |
| **Motoristas Semanais (R$ 69,90/sem = R$ 280/mês)** | 15 condutores (R$ 4.200) | 25 condutores (R$ 7.000) | 20 condutores (R$ 5.600) |
| **Motoristas Diaristas (R$ 14,90/dia × 12 dias = R$ 178/mês)**| 25 condutores (R$ 4.450) | 20 condutores (R$ 3.560) | 10 condutores (R$ 1.780) |
| **Motoristas em Trial / Inativos** | 40 condutores (R$ 0,00) | 10 condutores (R$ 0,00) | 5 condutores (R$ 0,00) |
| **RECEITA BRUTA MENSAL (SaaS)** | **R$ 12.648,00** | **R$ 19.555,00** | **R$ 20.373,00** |
| (-) Taxas Gateway PIX (R$ 0,80 por liquidação) | - R$ 480,00 | - R$ 520,00 | - R$ 380,00 |
| (-) Custos de Mapbox (Geocoding & Directions) | - R$ 650,00 | - R$ 1.200,00 | - R$ 1.850,00 |
| (-) Infraestrutura Supabase & Hosting | - R$ 350,00 | - R$ 450,00 | - R$ 600,00 |
| **MARGEM DE CONTRIBUIÇÃO LÍQUIDA** | **R$ 11.168,00 (88,3%)** | **R$ 17.385,00 (88,9%)** | **R$ 17.543,00 (86,1%)** |

---

### 4. Riscos Econômicos e Gatilhos de Mitigação
1. **Risco de Ilusão de Demanda nos Primeiros Meses:** Motoristas compram a diária mas não recebem corridas por falta de passageiros.  
   * *Mitigação:* Período de gratuidade (*Trial*) estendido de 7 a 14 dias no lançamento em novas cidades até atingir a liquidez mínima de 500 passageiros ativos.
2. **Inadimplência de Diárias em Corridas no Dinheiro:** Motoristas realizam corridas e acumulam dívida na carteira.  
   * *Mitigação Comprovada:* O mecanismo de **Debt Cutoff** do `DriverWalletEngine.ts` (bloqueio automático ao atingir R$ 50,00 de pendência com desbloqueio instantâneo após PIX Copia e Cola) protege a solvência da operação.
