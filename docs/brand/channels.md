Contract: brand-contract v1

# Channels

Definição de tom, limites e restrições por canal e superfície.

## Product surfaces

### primary action

```
Register:   humor -3, distance -1
Format:     verbo imperativo claro indicando o resultado
Limits:     24 caracteres
Forbidden:  physics: none | brand: "Clique aqui", "OK", piadas ou termos ambíguos
CTA:        esta superfície é o próprio CTA
Proof:      none
Locales:    1.0
```

### error

```
Register:   humor -3, density +1, distance -1
Format:     o que ocorreu, estado atual do sistema, uma ação de recuperação imediata
Limits:     140 caracteres
Forbidden:  physics: none | brand: termos técnicos indecifráveis, culpar o usuário, exclamações
CTA:        ação de recuperação ("Tentar novamente" ou "Contatar suporte")
Proof:      none
Locales:    1.0
```

### empty state

```
Register:   distance 0, humor -2
Format:     o que normalmente fica aqui, por que é vantajoso e como iniciar
Limits:     120 caracteres
Forbidden:  physics: none | brand: mensagens derrotistas ou telas em branco sem instrução
CTA:        um botão claro de ação inicial
Proof:      none
Locales:    1.0
```

### paywall and upgrade

```
Register:   humor -3, distance +1
Format:     benefício claro, valor líquido, regras de renovação e cancelamento
Limits:     180 caracteres
Forbidden:  physics: none | brand: urgência artificial, taxas ocultas, pegadinhas
CTA:        um CTA primário com preço transparente
Proof:      um valor numérico referenciado no facts.md
Locales:    1.0
```

### destructive confirm

```
Register:   humor -3, density +1
Format:     objeto da ação, consequência imediata e se a ação é reversível
Limits:     100 caracteres
Forbidden:  physics: none | brand: confirmações genéricas, "Tem certeza?", humor
CTA:        verbo da ação destrutiva ("Cancelar corrida", "Excluir conta")
Proof:      none
Locales:    1.0
```

---

## Marketing surfaces

### landing hero

```
Register:   confidence +1, density -1
Format:     um título assertivo, um subtítulo com benefício palpável, um CTA direto
Limits:     title 60, meta description 160
Forbidden:  physics: none | brand: superlativos vagos sem linha no facts.md
CTA:        um verbo direto de ação
Proof:      um número comprovado no facts.md
Locales:    1.0
```
