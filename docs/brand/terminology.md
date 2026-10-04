Contract: brand-contract v1

# Terminology

Dicionário terminológico oficial da plataforma PARTIU.

## Product terms — always

| Our term | Never write | Applies to |
|---|---|---|
| Motorista Parceiro | Motorista de app, Condutor avulso | O profissional credenciado que realiza corridas na plataforma |
| Passageiro | Usuário genérico, Cliente | A pessoa que solicita a corrida e realiza o deslocamento |
| Corrida | Trecho, Frete | O trajeto de transporte de passageiros contratado |
| Cockpit | Painel do motorista, Dashboard simples | A interface operacional móvel de condução do motorista |
| Despacho | Repasse de viagem, Encaminhamento | O algoritmo geográfico de alocação de condutores por proximidade |

## Entity and tier names — exact spelling

| Name | Wrong forms seen |
|---|---|
| PARTIU | Partiu mobe, partiu, PARTIU! |
| Carro Particular | Carro comum, Carro privativo |
| Moto-Táxi | Mototaxi, Moto taxi |
| Entrega Expressa | Delivery, Encomenda flash |

## Banned

| Word or phrase | Why | Use instead |
|---|---|---|
| leverage | termo corporativo vazio | utilizar, acionar |
| seamless | jargão que não comprova usabilidade | ágil, sem interrupções |
| utilize | verbo prolixo | usar |
| robust | oculta métricas exatas | confiável, testado a 60 FPS |
| tarifa dinâmica abusiva | induz percepção predatória | ajuste proporcional de demanda |
| taxa oculta | quebra de confiança com o passageiro | taxa de intermediação informada |

## Glossary

| Term | Meaning |
|---|---|
| Despacho PostGIS | Algoritmo espacial que busca condutores em ondas de proximidade (2 km, 4 km e 6 km) |
| Snap to Route | Projeção em tempo real da posição do condutor na geometria da via para eliminar ruídos |
| Ledger de Partidas Dobradas | Sistema contábil que registra débitos e créditos simétricos em centavos (minor units) |
| Tolerância Gratuita | Período de 2 minutos após o aceite no qual o passageiro pode cancelar sem cobrança |
