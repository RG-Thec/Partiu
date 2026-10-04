Contract: brand-contract v1

# Facts

Métricas, dados técnicos e parâmetros canônicos da plataforma PARTIU.

## Facts

| Fact | Value | Source | Checked | Review by | Public |
|---|---|---|---|---|---|
| Tolerância gratuita de cancelamento de corrida | 2 minutos | README.md:88 | 2026-10-02 | 2027-10-02 | yes |
| Primeiro raio de busca de despacho PostGIS | 2 km | README.md:87 | 2026-10-02 | 2027-10-02 | yes |
| Segundo raio expandido de despacho PostGIS | 4 km | README.md:87 | 2026-10-02 | 2027-10-02 | yes |
| Raio máximo concêntrico de busca de condutores | 6 km | README.md:87 | 2026-10-02 | 2027-10-02 | yes |
| Taxa de quadros da renderização cartográfica | 60 FPS | README.md:49 | 2026-10-02 | 2027-10-02 | yes |
| Tempo limite para validação de webhook HMAC | 5 minutos | README.md:98 | 2026-10-02 | 2027-10-02 | no |
| Tempo de contagem regressiva para aceite de corrida | 15 segundos | docs/ux/scenarios.md:52 | 2026-10-02 | 2027-10-02 | yes |

## Proof that is not a number

| Claim | Attribution | Source | Checked | Review by | Public |
|---|---|---|---|---|---|
| Motor cartográfico otimizado no padrão estético Uber/99 | Equipe de Engenharia PARTIU | README.md:57 | 2026-10-02 | 2027-10-02 | yes |
| Isolamento criptográfico multi-tenant com Row Level Security | Auditoria de Arquitetura V3.4 | docs/V3.4_RLS_AUDIT.md | 2026-10-02 | 2027-10-02 | yes |

## Required disclaimers

| Claim it attaches to | Required text |
|---|---|
| Preço garantido prévio | O valor final permanece fixo exceto em casos de alterações de trajeto ou paradas adicionais solicitadas durante a viagem. |
| Repasse instantâneo via Pix | Sujeito à estabilidade operacional e disponibilidade da rede de liquidação do Banco Central do Brasil. |
