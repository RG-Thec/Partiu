# PARTIU — Vision

<!-- Managed with super-ux (ux-contract v4). The layer above the chain. -->

**Status:** approved
**Last reviewed:** 2026-10-02

## 1. Essence

PARTIU é uma plataforma multicategoria de mobilidade urbana e logística expressa que transforma a relação de transporte sob demanda entre passageiros, motoristas e cidades em uma operação previsível, transparente e de alta performance cartográfica.

## 2. Core idea

A demanda por locomoção segura, ágil e acessível é abundante em centros urbanos e cidades regionais.
A remuneração justa para condutores e a transparência tarifária sem pegadinhas são escassas nos aplicativos tradicionais de transporte.
-> O PARTIU preenche essa lacuna através de despacho geográfico de alta precisão via PostGIS, taxas operacionais justas e renderização cartográfica de alta performance a 60 FPS.

## 3. What the system does

Observa chamadas de corrida e entregas em tempo real, projeta trajetos em malha viária desobstruída sem poluição visual, despacha solicitações em ondas concêntricas de proximidade para os condutores mais aptos, processa cobranças e repasses imediatos via Pix com ledger de partidas dobradas e mantém canais de segurança contínuos com botão de emergência SOS 190.

## 4. The user's role

O passageiro planeja e decide seu trajeto com valor garantido e acompanhamento transparente. O motorista parceiro atua com autonomia e previsibilidade financeira, enxergando seu ganho líquido de forma clara em rotas otimizadas. O gestor regional audita a operação e a frota com governança de dados e isolamento multi-tenant.

## 5. Principles

1. Priorizamos clareza tarifária e repasse financeiro imediato em vez de margens ocultas e taxas predatórias de comissão.
2. Priorizamos uma experiência cartográfica limpa e focada estritamente na via (60 FPS) em vez de sobrecarga de pontos comerciais irrelevantes.
3. Priorizamos arquitetura Zero-Trust com segurança rigorosa em nível de linha (RLS) e isolamento multi-inquilino em vez de permissões genéricas.
4. Priorizamos resiliência operacional e persistência offline com idempotência em vez de fragilidade em conexões instáveis.

## 6. Anti-vision

O PARTIU recusa categoricamente se tornar:
- Um leilão predatório de corridas onde motoristas são induzidos a disputar valores abaixo do custo operacional.
- Uma rede social ou agregador de anúncios publicitários que degrade a velocidade da interface ou distraia condutores na direção.
- Um sistema opaco com cobranças dinâmicas artificiais não justificadas pela distância, tempo ou demanda real.
- Uma aplicação pesada que dependa de hardware topo de linha para rodar de forma fluida.

## 7. Horizon

Consolidar o PARTIU nos próximos 2 a 3 anos como o ecossistema de mobilidade urbana de referência em cidades regionais e cooperativas de transporte no Brasil, integrando frotas particulares, táxis, moto-táxis e entregas em mais de 100 municípios com governança financeira auditável.

## 8. The one sentence

Mobilidade urbana veloz, justa e segura, conectando passageiros e motoristas parceiros com transparência operacional e tecnologia cartográfica de excelência.

## 9. The alignment test

1. Esta funcionalidade aumenta a segurança, clareza ou previsibilidade da viagem para o passageiro ou condutor?
2. A alteração respeita a meta de renderização cartográfica fluida a 60 FPS sem poluir a visão das vias?
3. O fluxo financeiro mantém a integridade de partidas dobradas e transparência no repasse sem taxas ocultas?
4. A funcionalidade preserva o isolamento multi-tenant e as políticas de segurança Zero-Trust?
