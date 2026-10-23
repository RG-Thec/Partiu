# 02 - BASE CONSOLIDADA DE EVIDÊNCIAS DO APLICATIVO 99

> **Origem dos Dados:** Auditoria estática forense do APK oficial `99.apk` (`com.taxis99`, DiDi Global Brasil, versionCode 4250), persistida nos 16 relatórios em `C:\Users\Suporte\Desktop\99 Apk\AUDITORIA_REA\`.

---

### 1. Fatos Comprovados por Evidência Direta (DEX Bytecode & AXML)

1. **Orquestração Desacoplada X-Engine:**
   * Evidências: `EVENT_X_ENGINE_ORDER_STATUS_CHANGE`, `event_trip_x_engine_order_status_change`.
   * Comportamento: O aplicativo não utiliza telas monolíticas. A interface é orientada a cartões e componentes visuais montados dinamicamente de acordo com o estado emitido pelo backend.
2. **Ciclo de Vida de 13 Estados Canônicos:**
   * Evidências em DEX: `ORDER_STATUS_WAIT_RESPONSE`, `ORDER_STATUS_WAIT_RESPONSE_ASSIGN_DOING`, `ORDER_STATUS_WAIT_RESPONSE_ASSIGN_SUCCESS`, `ORDER_STATUS_ASSIGN_TIMEOUT`, `ORDER_STATUS_DOING_WAIT`, `ORDER_STATUS_DOING_DRIVER_ARRIVAL`, `ORDER_STATUS_DOING_TRAVEL_START_SOON`, `ORDER_STATUS_DOING`, `WAYPOINT_TRIP_STATE_ARRIVED`, `ORDER_STATUS_NOT_PAY`, `ORDER_STATUS_PAY_FINISH`, `ORDER_STATUS_CANCEL_TRIP_NOPAY`, `ORDER_STATUS_CANCEL_TRIP_PAID`, `ORDER_STATUS_CLOSE_ORDER_NO_DRIVER_SERVICE`.
3. **Redundância Híbrida de Conexão (Push FCM + Polling Adaptativo):**
   * Evidências: `DIDI_TRAVEL_EVENT_PUSH_ORDER_STATUS` (canal push silencioso primário) e `SCENE_CODE_POLL_ORDER_STATUS_UPDATE_INTERVAL` / `p_get_order_status_spare` (polling adaptativo inteligente de contingência).
4. **Fachada Multi-Mapas com Provedor Hawaii Proprietário:**
   * Evidências: Interface abstrata `Lcom/didi/map/outer/map/DidiMap;`, adaptador Google Maps v2 (`DDGoogleMap`, `GoogleMapViewWrapper`) e motor vetorial proprietário `com.didi.hawaii.mapsdkv2`.
5. **Navegação Externa via Waze Deep Link:**
   * Evidências: Verificação do pacote Android `com.waze` e disparo da URL canônica `https://waze.com/ul?ll=%s,%s&navigate=yes`.
6. **Interpolação de Orientação do Veículo (Bearing Smoothing):**
   * Evidências: `cameraBearing`, `bearingAccuracy`, `HAS_BEARING_ACCURACY_MASK`, `calculateBearing`.
7. **Tarifação Multi-Categoria com Lock Price:**
   * Evidências: Endpoint `estimate_get_multi_estimate_price_new`, tag `LOCK_PRICE_TAG_TYPE`, `min_price_value`, `dynamic_price`.
8. **Segurança Ativa e Gravação de Áudio (Jarvis):**
   * Evidências: `TripRecordingActivity`, `AUDIO_RECORD_MAX_DURATION`, `AUDIO_RECORD_THRESHOLD`, botão de emergência `GlobalJarvisComponentV2`.
9. **Interoperabilidade Inter-App com o Driver App:**
   * Evidências no Manifesto: `com.app99.driver.permission.ACCESS_SHARE_PROVIDER` (ContentProvider protegido para IPC local).

---

### 2. Fatos Fortemente Indicados (Semântica Acoplada)
* **Reatribuição Automática por Cancelamento do Condutor:** Comprovada pelos tokens de evento `EVENT_ONSERVICE_CANCEL_ORDER_REASSIGN_SUCCESS` e `_FAIL`. O passageiro permanece em busca sem cancelamento forçado do pedido.
* **Corridas Consecutivas para Motoristas (*Back-to-Back*):** Comprovada pelo token `EVENT_POINT_PASSED_OF_CONTINUOUS_ORDERS`, disparado quando o motorista passa pelo ponto crítico final da rota atual para receber o próximo despacho.

---

### 3. Hipóteses Operacionais de Mercado
* **Janela do Temporizador de Aceite do Motorista:** Estimada entre 15 e 20 segundos com base na transição `ORDER_STATUS_ASSIGN_TIMEOUT` e nos testes de experiência de usuário em praças urbanas brasileiras.
* **Geofence de Chegada:** Estimado em raio de 100 a 150 metros em torno do ponto de embarque (`EVENT_DRIVER_CARD_NEAR_PICK`).

---

### 4. Lógicas Não Observáveis no Cliente (Cluster de Nuvem da DiDi)
* Algoritmo central de otimização combinatória de frotas e despacho geoespacial global.
* Modelo estatístico server-side gerador da malha de calor e cálculo de multiplicadores do preço dinâmico.
