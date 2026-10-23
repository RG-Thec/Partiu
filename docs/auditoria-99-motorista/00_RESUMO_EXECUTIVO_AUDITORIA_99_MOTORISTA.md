# 00 - RESUMO EXECUTIVO: AUDITORIA REA NO APK 99 MOTORISTA

**Alvo Auditado:** `99 Motorista (1).apk` (Tamanho: 142.6 MB, SHA256: `7f44ef8bf57e432e24f9e77b78bd5b73c54db5a293f8c2796f184bdd184441f7`)  
**Metodologia:** Inspeção estática de binários via REA (Reverse Engineer Anything), descompactação e engenharia reversa de 17 arquivos DEX (`classes.dex` a `classes17.dex`), análise de recursos AXML e extração das strings dos módulos Flutter (`driver_jarvis_center`, `driver_main`, `ibt_flutter_delivery_business`, `driver_wallet_home`).

---

## 1. Principais Descobertas no APK 99 Motorista

A investigação profunda revelou que o aplicativo do motorista da 99 é estruturado sobre uma arquitetura híbrida de alto desempenho que combina **Java/Kotlin nativo**, **módulos Flutter embedados** (codinome *Nacho*), um motor de mini-apps (*Dimina*) e motores proprietários da DiDi (*Beatles IM*, *Omega Telemetry*, *Apollo Swarm* e *Jarvis Safety Center*).

Dentre os recursos descobertos, destacam-se 6 pilares estratégicos de alto valor:

| Pilar Operacional | Mecanismo Descoberto no 99 Motorista | Benefício para o Condutor | Oportunidade no Partiu Motorista |
| :--- | :--- | :--- | :--- |
| **1. Troco Digital 100% no App** | Módulo `cashback_amount` / `Troco na carteira 99Pay` | Elimina o atrito de falta de troco físico em corridas em dinheiro; o motorista envia a diferença digitalmente ao passageiro | **Implementar no Partiu:** Transferência do saldo de troco direto para a carteira/Pix do passageiro ao encerrar corrida em dinheiro. |
| **2. Gravação Sigilosa de Áudio** | `driver_jarvis_center` / `AudioRecorderImpl` | Gravação contínua e criptografada no celular (retenção de 7 dias); só acessível se houver reporte de incidente | **Implementar no Partiu:** Gravação local segura no navegador/app via MediaRecorder durante `ON_TRIP`, com acionamento automático de SOS. |
| **3. Bloqueio Permanente de Passageiro** | `GDriver_progress_Black_passenger` ("Bloquear passageiro") | Na tela de avaliação pós-corrida, o condutor marca "Não parear novamente" com passageiros desrespeitosos | **Implementar no Partiu:** Blacklist bilateral no motor de matching (`DispatchQueueBuilder`), impedindo novos despachos mútuos. |
| **4. Mural de Corridas (Trip Picker)** | `TripPicker` / `BroadOrderFragmentGroup` | Além do despacho direto, existe uma listagem ("Mural") onde motoristas escolhem e pegam corridas disponíveis | **Implementar no Partiu:** Já iniciado com o Mural de Agendamentos (`ScheduledRidesDrawer`), expansível para corridas sob demanda. |
| **5. Janela Flutuante (OverScreen / OneFloat)** | `GlobalFloatingWindowModule` / `SYSTEM_ALERT_WINDOW` | Pílula flutuante sobre outros navegadores (Waze, Google Maps) com preview de chamada e aceite em 1 toque | **Integrar no Partiu:** Modo Picture-in-Picture / overlay HUD quando o condutor minimiza ou abre GPS externo. |
| **6. Biometria Facial de Vivacidade** | `RoundMaskLiveness` / `UnicoActivity` | Verificação de selfie periódica com máscara circular antes de liberar o botão "Ficar Online" | **Reforçar no Partiu:** Liveness check no onboarding e verificação aleatória quinzenal para evitar uso de contas alugadas. |

---

## 2. Diferencial Competitivo Partiu (Pure SaaS)

Enquanto a 99 retém entre **15% e 35% de comissão** sobre cada corrida do motorista (disfarçada de taxas de intermediação variáveis), o **Partiu opera no modelo Pure SaaS com 0% de comissão**:
- Toda funcionalidade trazida da 99 deve **potencializar a receita líquida do motorista**, e não criar pedágios ou taxas ocultas.
- O Troco Digital no Partiu não cobra taxa de saque do motorista.
- O bloqueio de passageiros protege o motorista parceiro sem afetar sua taxa de aceitação ou notas da diária.
