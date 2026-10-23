# 02 - CATÁLOGO DE FUNCIONALIDADES DESCOBERTAS NO 99 MOTORISTA

Auditoria estática e de strings extraídas diretamente dos módulos internos do APK `99 Motorista (1).apk`.

---

## 1. Troco Digital no App (99Pay Cashback / Cash Change)

- **Módulos:** `driver_main`, `driver_wallet_home`
- **Textos Oficiais Extraídos:**
  > *"Agora, nas corridas pagas em dinheiro, você não precisa mais se preocupar com o troco, pois o(a) passageiro(a) pode recebê-lo através da 99Pay, a carteira digital vinculada ao aplicativo 99. Isso mesmo: troco 100% digital!"*  
  > *"Sempre que possível, pergunte ao(à) passageiro(a) se prefere receber o troco fisicamente ou na 99Pay, lembrando que o troco vira saldo na carteira digital dele(a) para usar em corridas futuras..."*  
  > *"Insira o valor exato em dinheiro que você recebeu do passageiro. Se o valor inserido for maior que o valor real da corrida: O troco será transferido do seu perfil para o do passageiro."*
- **Funcionamento:**
  1. No desembarque de uma corrida em dinheiro de R$ 23,00, o passageiro entrega uma cédula de R$ 50,00.
  2. O motorista não possui os R$ 27,00 em notas ou moedas.
  3. No modal de acerto de contas, o condutor clica em "Dar Troco Digital" e digita "50,00".
  4. O sistema calcula a diferença exata (R$ 27,00) e transfere instantaneamente do saldo digital do motorista para a conta do passageiro.
  5. Ambos recebem comprovante na hora.

---

## 2. Gravação de Áudio Contínua e Sigilosa (Jarvis Safety Center)

- **Módulos:** `driver_jarvis_center`, `AudioRecorderImpl`
- **Textos Oficiais Extraídos:**
  > *"Os áudios são criptografados e armazenados no seu telefone por 7 dias, e ninguém mais pode acessá-los, a menos que você envie um relatório de segurança e inclua um áudio para análise."*  
  > *"A gravação foi ativada e começará após a chegada do passageiro."*  
  > *"No caso de um incidente de segurança, as gravações de áudio podem ser usadas como prova para ajudar na investigação da 99. Você também pode enviar ou deletar áudios na Lista de corridas."*
- **Funcionamento:**
  1. O motorista ativa o recurso de gravação nas configurações de segurança.
  2. O microfone começa a gravar automaticamente quando o passageiro embarca (`IN_PROGRESS`).
  3. O arquivo de áudio é cifrado localmente com chave simétrica no sandbox do app.
  4. Ninguém ouve o arquivo durante o uso normal (privacidade preservada).
  5. Caso haja um incidente ou acionamento de SOS, o motorista pode anexar o áudio ao chamado de suporte.
  6. Áudios com mais de 7 dias sem ocorrência são purgados automaticamente para economizar armazenamento.

---

## 3. Bloqueio de Passageiro na Avaliação Final (Blacklist Bilateral)

- **Módulo:** `driver_main` (`GDriver_progress_Black_passenger_sCuU`)
- **Textos Oficiais Extraídos:**
  > *"Bloquear passageiro"*  
  > *"Avaliar como anônimo"*  
  > *"Faça sua avaliação ou toque em Pular"*
- **Funcionamento:**
  1. Ao concluir uma viagem, abre-se o modal de avaliação por estrelas (1 a 5).
  2. Se a nota for inferior a 4 estrelas, surge a opção: `[✓] Bloquear este passageiro`.
  3. Se marcada, o identificador do passageiro é adicionado à lista de exclusão do motorista.
  4. O algoritmo de despacho bloqueia permanentemente o envio de chamadas daquele passageiro para este condutor, garantindo tranquilidade psicológica e segurança.

---

## 4. Mural de Corridas e Radar de Chamadas (Trip Picker / Broad Order)

- **Módulos:** `BroadOrderFragmentGroup`, `TripPicker`
- **Textos Oficiais Extraídos:**
  > *"Se você estiver desconectado(a), tocar em 'Aceitar' mudará seu status para Conectado."*  
  > *"Mantenha-se online e aguarde novos pedidos."*
- **Funcionamento:**
  1. Além do despacho direto (onde toca a sirene e surge o modal com contagem regressiva de 15 segundos), existe uma tela de "Mural" (Trip Picker).
  2. Corridas que estão em raio expandido ou com previsão futura ficam listadas com origem, destino, ganho líquido e distância.
  3. O condutor pode abrir o mural, tocar na corrida mais conveniente para sua rota e aceitá-la manualmente.

---

## 5. Modo Destino com Gestão de Limite Diário

- **Módulo:** `driver_main` (`GDriver_Area_You_have_vbyG`)
- **Textos Oficiais Extraídos:**
  > *"O modo 'Definir meu destino' está ativado"*  
  > *"Limite diário para definir seu destino atingido"*  
  > *"Você está perto do seu destino. Se continuar recebendo solicitações de corridas, você receberá todas as solicitações. Quer continuar recebendo solicitações de corridas?"*
- **Funcionamento:**
  1. O motorista define um endereço alvo (ex: sua casa ou compromisso pessoal).
  2. O motor filtra as chamadas recebidas, aceitando apenas viagens cujo trajeto esteja dentro do cone de deslocamento até o destino.
  3. O sistema limita o uso a 2 ou 3 vezes ao dia para evitar distorção artificial de disponibilidade na cidade.
  4. Ao se aproximar a menos de 2 km do destino final, o app desativa o modo e pergunta se deseja desconectar ou voltar a receber chamadas normais.
