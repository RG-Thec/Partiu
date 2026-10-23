# 01 - RAIO-X TÉCNICO E ARQUITETURA DO 99 MOTORISTA

## 1. Métricas do Pacote Android (APK)

- **Arquivo:** `99 Motorista (1).apk`
- **Tamanho:** 149.585.613 bytes (~142.6 MB)
- **Total de Arquivos Internos:** 13.130 arquivos
- **Arquivos DEX:** 17 arquivos (`classes.dex` até `classes17.dex`)
- **Arquivos de Assets:** 2.426 recursos embutidos
- **SHA-256:** `7f44ef8bf57e432e24f9e77b78bd5b73c54db5a293f8c2796f184bdd184441f7`

---

## 2. Camadas Arquiteturais Identificadas

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE EXPERIÊNCIA                   │
│   Flutter Embedado (Nacho) + Dimina Mini-Apps + WebViews    │
│  - driver_jarvis_center: Central de Áudio e Segurança       │
│  - driver_wallet_home: Carteira e Repasses D+0              │
│  - driver_main: Cockpit, Troco Digital e Avaliação          │
│  - ibt_flutter_delivery_business: Entregas Expressas        │
├─────────────────────────────────────────────────────────────┤
│                    MOTORES DE NEGÓCIO                       │
│  - Beatles IM: Chat, VoIP e Mensageria Push                 │
│  - Apollo Swarm: Feature Flags e Testes A/B Dinâmicos       │
│  - Omega Telemetry: Observabilidade e Auditoria Contínua    │
│  - BroadOrder / TripPicker: Mural de Corridas e Radar       │
├─────────────────────────────────────────────────────────────┤
│                    SERVIÇOS DE HARDWARE & SO                │
│  - WazeService: Ponte em background com app Waze            │
│  - Shannon Security: Mock GPS, SELinux e Anti-Root          │
│  - AudioRecorderImpl: Gravação de áudio com cifra local     │
│  - GlobalFloatingWindow: Overlay sobre outros apps          │
├─────────────────────────────────────────────────────────────┤
│                    ON-DEVICE MACHINE LEARNING               │
│  - MobNetV2.tflite: Classificação local de imagens          │
│  - RoundMaskLiveness: Verificação de vivacidade facial      │
│  - Bank OCR: Leitura de dados bancários e cartões via edge  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Serviços em Background e Permissões Críticas

1. **`WazeService` (`com.didichuxing.map.maprouter.sdk.navi.waze.WazeService`):**
   - Mantém uma conexão local ativa com o Waze via Intent and Bound Service para detectar quando o condutor está navegando e sincronizar o status da corrida sem precisar reabrir o app principal.
2. **`GlobalFloatingWindow` (`android.permission.SYSTEM_ALERT_WINDOW`):**
   - Cria uma pílula ou botão flutuante sobre a tela do Waze ou Google Maps. O condutor pode visualizar chamadas recebidas, tempo até o embarque e valor da corrida sem alternar de tela.
3. **`AudioRecorder` (`com.didi.safety.onesdk.permission.AudioPermissionActivity`):**
   - Grava o canal de áudio da cabine durante o trajeto, salvando os arquivos em diretório confidencial com expiração automática em 7 dias.
4. **`DETECT_SCREEN_CAPTURE` & `HIGH_SAMPLING_RATE_SENSORS`:**
   - Detecta capturas de tela ou espelhamento malicioso, e coleta telemetria de sensores a alta frequência para telemetria de frenagem brusca e detecção de colisões urbanas.
