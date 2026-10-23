# 03 - MATRIZ COMPARATIVA FUNCIONAL: 99 MOTORISTA × PARTIU MOTORISTA

| Funcionalidade / Domínio | 99 Motorista (APK Oficial) | Partiu Motorista (Estado Atual) | Gap Identificado | Nível de Prioridade |
| :--- | :--- | :--- | :--- | :--- |
| **Comissão da Plataforma** | Retém de 15% a 35% por corrida | **0% de comissão (Pure SaaS)** | Partiu é superior: condutor retém 100% do valor da corrida | **Preservar Invariante** |
| **PIN de Embarque (OTP)** | PIN de 4 dígitos solicitado no app | Implementado na Onda 9 (`boarding-pin-engine.ts`) | Paridade total de excelência | **Concluído** |
| **Chamada Consecutiva (Back-to-Back)** | Oferta antecipada antes do desembarque | Implementado na Onda 3 (`back-to-back-engine.ts`) | Paridade total de excelência | **Concluído** |
| **Troco Digital em Dinheiro** | Troco 100% digital via 99Pay no app | Acerto manual no `RidePaymentSettlementModal.tsx` | **GAP:** Falta opção de transferir troco digital direto para a carteira/Pix do passageiro | **ALTA (Onda 11)** |
| **Bloqueio de Passageiro Pós-Corrida** | Opção "Bloquear passageiro" na avaliação | Avaliação com estrelas e tags (`RideRatingModal.tsx`) | **GAP:** Falta a opção de bloqueio permanente mútuo no motor de despacho | **ALTA (Onda 11)** |
| **Gravação de Áudio Sigilosa** | Gravação local no Jarvis com expiração de 7 dias | SOS integrado e gravação confidencial planejada | **GAP:** Falta o botão de gravação contínua no cockpit com armazenamento local | **MÉDIA (Onda 12)** |
| **Navegação Externa com 1 Toque** | WazeService em background e deep link | Implementado na Onda 3 (`ExternalNavigationButton.tsx`) | Paridade total de excelência | **Concluído** |
| **Corridas Agendadas** | Atribuição centralizada pela plataforma | **Negociação bilateral com piso protetivo** (`onda10`) | Partiu é superior: autonomia de contraproposta e 0% taxa | **Concluído** |
| **Modo Destino (Rota de Volta)** | Limite de 2 a 3 vezes ao dia com cone de busca | Interface iniciada (`DriverDestinationModal.tsx`) | Paridade funcional | **Concluído** |
| **Detecção de Chegada Geofence** | Automática via GPS com tolerância No-Show | Implementado na Onda 1 (`geofence-arrival-service.ts`) | Paridade total de excelência | **Concluído** |
