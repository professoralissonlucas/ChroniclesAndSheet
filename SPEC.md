# SPEC — Chronicles & Sheet

> Especificação descritiva do projeto **como ele está hoje**. A primeira versão deste documento analisou o código original das alunas. Depois disso vieram correções, e as seções abaixo descrevem o comportamento atual. A seção 9 registra o que foi resolvido e o que continua pendente.

---

## 1. Visão geral

**Chronicles & Sheet** é uma aplicação web de página única (SPA estática) de apoio a **RPG de mesa**. Ela reúne num só lugar as ferramentas que um jogador usa durante uma sessão:

- ficha de campo (dados básicos, barras de vida/sanidade/esforço, atributos e perícias personalizáveis);
- inventário;
- Arsenal independente para armas, quantidade, dano e descrição;
- rolador de dados com histórico, expressões (`2d6+3`, `4d6kh3`) e vantagem/desvantagem;
- diário psicológico com tags, estado emocional, reflexões e busca;
- relações entre personagens;
- dois temas visuais ("Ficha de Campo" e "Diário Manuscrito");
- backup em arquivo `.json` (exportar/importar);
- uso no celular: pode ser instalado na tela inicial, abre sem internet e tem um botão para manter a tela acesa durante a sessão.

Tudo roda **no navegador**, sem servidor, sem build e sem bibliotecas externas. Os dados ficam salvos no `localStorage`. O projeto foi pensado para ser publicado direto no **GitHub Pages**; lá, um service worker guarda os arquivos para o site abrir offline (abrindo o `index.html` direto do disco, tudo funciona, menos o modo offline).

### 1.1 Intenção do projeto

O arquivo `TEXTOS SCRIPT JOGO.txt` mostra a origem do projeto: é um **prompt** escrito para uma IA ("Atue como um desenvolvedor web especialista...") que descreve os requisitos do site. O código (`index.html`, `styles.css`, `script.js`) é a implementação desses requisitos, com alguns **acréscimos** que não estavam no prompt (barras de Sanidade e Esforço, botão de limpar histórico de dados, botão de ocultar atributos).

Objetivos declarados no prompt:

| Objetivo | Descrição |
|---|---|
| 100% client-side | Sem backend; pronto para GitHub Pages |
| Vanilla | HTML5 + CSS3 + JavaScript puro, sem frameworks |
| Persistência local | `localStorage` |
| Portabilidade | Exportar/importar backup `.json` |
| Duas "personalidades" visuais | Interface técnica moderna × estilo pergaminho/fantasia |

---

## 2. Estrutura de arquivos

```
Ana Lívia e Ana Zarpelon/
├── index.html               ( 701 linhas)  Estrutura e conteúdo da página
├── styles.css               (2506 linhas)  Visual, temas e responsividade
├── script.js                (3391 linhas)  Estado, lógica, eventos e renderização
├── sw.js                    (  69 linhas)  Service worker: cópia dos arquivos para uso offline
├── manifest.webmanifest     (  18 linhas)  Nome, cores e ícones para "Adicionar à tela inicial"
├── icons/                                  Ícone do app (d20): icone.svg e PNGs de 180, 192 e 512 px
├── SPEC.md                                 Este documento
├── testes-manuais.md                       Roteiro de testes no navegador
└── exemplos-backup/                        Backups .json de exemplo (válidos e inválidos) usados no roteiro
```

`TEXTOS SCRIPT JOGO.txt` (prompt original, citado em 1.1), `README.md` e `CLAUDE.md` não estão nesta cópia do repositório.

Não existe `package.json` nem testes automatizados no repositório; a validação é feita à mão seguindo `testes-manuais.md`. O código está no GitHub (`professoralissonlucas/ChroniclesAndSheet`, branch `main`). Para rodar, basta abrir `index.html` no navegador.

Separação de responsabilidades:

- **HTML** → define *todas* as seções e campos de forma estática, inclusive os diálogos de exclusão do diário e do editor de pixel art. Apenas as listas (atributos, perícias, inventário, Arsenal, relações, histórico de dados, diário), as opções do filtro de tags e a paleta do editor são geradas pelo JS.
- **CSS** → define os dois temas com **variáveis CSS** (custom properties) e decide quais painéis aparecem em cada tema.
- **JS** → mantém um único objeto `state`, salva no `localStorage` a cada mudança e redesenha a parte afetada da tela.

---

## 3. Interface (index.html)

Idioma `pt-BR`. O `<body>` começa com `data-theme="field"`. O `<head>` tem `viewport-fit=cover` (para o padding de safe-area, ver 7.3), `<meta name="theme-color">` (trocado pelo JS conforme o tema), o link para `manifest.webmanifest`, o ícone `apple-touch-icon` (180 px) e o nome curto "Chronicles" para a tela inicial do iPhone.

```
.app-shell
├── header.topbar
│   ├── "RPG de mesa" / h1 "Chronicles & Sheet"
│   └── ações: [Alternar tema] [Manter tela acesa (oculto sem suporte)] [Exportar Backup] [Importar Backup (input file oculto)]
├── #appStatus  mensagens de confirmação/erro (no celular, fixa na base da tela)
└── main.layout  (grid de 12 colunas)
    ├── section  Personagem e barras vitais
    ├── section.attributes-section  Atributos dinâmicos
    ├── section.skills-panel  Perícias
    ├── section  Inventário
    ├── section.arsenal-panel  Arsenal (Ficha de Campo e Diário Manuscrito)
    ├── section  Relações (Diário Manuscrito)
    ├── section.journal-panel  Diário Psicológico (Diário Manuscrito)
    └── section  Rolador de Dados e Histórico (Ficha de Campo)
dialog#journalDeleteDialog  Confirmação de exclusão de registro do diário
dialog#pixelArtDialog       Editor de retrato em pixel art das relações
```

### 3.1 Ficha Técnica do Personagem

| Elemento | ID / seletor | Observação |
|---|---|---|
| Nome | `#charName` | texto |
| Classe | `#charClass` | texto |
| Nível | `#charLevel` | número, `min=1 max=99` |
| Anotações gerais | `#charNotes` | textarea |
| Pontos de Vida | `#hpBar`, `#hpCurrentInput`, `#hpMaxInput`, `#hpStatus` | valores atual/máximo editáveis e botões `-5 -1 +1 +5` com `data-stat="hp"` |
| Sanidade | `#sanityBar`, `#sanityCurrentInput`, `#sanityMaxInput`, `#sanityStatus` | valores editáveis e botões `.vital-btn` com `data-stat="sanity"` |
| Pontos de Esforço | `#effortBar`, `#effortCurrentInput`, `#effortMaxInput`, `#effortStatus` | valores editáveis e botões `.vital-btn` com `data-stat="effort"` |
| Atributos | `#attributesGrid .attribute[data-attribute-id]` | cada atributo tem ID estável, nome e valor numérico editáveis; a lista não tem limite fixo |
| Perícias | `#skillsList` | tabela editável com atributo associado, bônus, treino, outros e ações. No formulário, o atributo é escolhido em `#skillAttributeInput` (`<select multiple>`); em telas ≤ 640px ele fica escondido e aparecem as caixas de seleção `#skillAttributeChecks` |
| Ocultar atributos | `#toggleAttributesBtn` | alterna entre "Ocultar" e "Mostrar" e esconde `.attributes-grid`; fica à direita do título "Atributos" (`.attributes-header` usa o mesmo alinhamento de `.hp-header`) |

Os três recursos compartilham um único estado entre os temas. Atual e máximo podem ser editados na Ficha de Campo; a barra e o indicador de condição acompanham a edição.

### 3.2 Inventário

Formulário `#inventoryForm` com `#inventoryId` (oculto, guarda o ID em edição), `#itemName` (obrigatório), `#itemQty` (mín. 1), `#itemDescription`, botões `#saveItemBtn` e `#cancelEditBtn` (oculto até entrar em modo edição). Lista: `#inventoryList`.

### 3.2.1 Arsenal

Seção `#arsenalTitle` compartilhada pelos dois temas. O formulário `#arsenalForm` cadastra nome, quantidade inteira positiva, expressão de dano textual obrigatória e descrição opcional. Na Ficha de Campo, a tabela `#arsenalList` exibe todos os campos; no Diário Manuscrito, `#journalArsenalList` mostra cartões compactos com nome, dano e quantidade, omitindo a descrição. Ambos oferecem edição e remoção confirmada e usam a mesma lista `state.arsenal`.

### 3.3 Rolador de Dados

De cima para baixo:
- três botões `.dice-mode-btn` (`data-mode` = `normal`, `vantagem`, `desvantagem`) com `aria-pressed`; o ativo usa `.primary-btn` e os outros `.secondary-btn`;
- sete botões `.dice-btn` com `data-sides` = 4, 6, 8, 10, 12, 20, 100;
- formulário `#diceExpressionForm` com o campo `#diceExpressionInput` ("Expressão", placeholder `2d6+3`), o botão **Rolar** e a dica `#diceExpressionHint`;
- exibição `#lastRoll` e botão `#clearDiceHistoryBtn`;
- tabela `#diceHistory` com dado (ou expressão), resultado (com o detalhe da rolagem embaixo, em `.roll-detail`) e data/hora; o registro mais recente aparece primeiro e recebe destaque.

Regras em 6.6.

### 3.4 Diário Psicológico

Formulário `#journalForm` com título e acontecimento obrigatórios, tags, estado emocional e intensidade opcionais, além de reflexões recolhidas por padrão. Data e horário são automáticos. Filtros: busca livre `#journalSearch` e `<select id="journalTagFilter">`. Lista: `#journalList`, com um botão `.journal-delete-btn` (🗑) por registro que abre `#journalDeleteDialog` (botões `#journalDeleteCancelBtn` e `#journalDeleteConfirmBtn`).

### 3.4.1 Editor de pixel art
`<dialog id="pixelArtDialog">`, aberto pelo botão `[data-action="pixel-art"]` de cada relação. Contém ferramentas `[data-pixel-tool]` (lápis, borracha, balde), `#pixelArtResolution` (16/32/64), desfazer/refazer (`#pixelArtUndoBtn`, `#pixelArtRedoBtn`), grade e zoom (`#pixelArtGridBtn`, `#pixelArtZoomOutBtn`, `#pixelArtZoomInBtn`, `#pixelArtZoomValue`), a tela `#pixelArtCanvas` (focável), a paleta `#pixelArtPalette` (gerada pelo JS), `#pixelArtCustomColor`, `#pixelArtClearBtn` e os botões `#pixelArtCancelBtn`, `#pixelArtCloseBtn` e `#pixelArtSaveBtn`. Regras em 6.5.1.

### 3.5 Acessibilidade

- Seções com `aria-labelledby` apontando para seus títulos.
- Listas e mensagens de status com regiões vivas; erros são anunciados com prioridade.
- Campos obrigatórios marcados visualmente e via `aria-required`; controles têm rótulos associados.
- Barras vitais expõem seu valor com `role="progressbar"`; grupos de botões e controles de mostrar/ocultar têm nomes e estados acessíveis. Os botões de modo da rolagem e "Manter tela acesa" usam `aria-pressed`; as caixas de atributo da perícia formam um `role="group"` rotulado pelo mesmo título do campo.
- No celular (≤ 640px), botões e controles de listas têm pelo menos 44px de altura; os campos têm `enterkeyhint` (e `inputmode="numeric"` nos números inteiros) para mostrar o teclado certo.
- Estados de foco visíveis usam a cor de destaque de cada tema; animações respeitam a preferência por movimento reduzido.

---

## 4. Modelo de dados (script.js)

Chave no `localStorage`: **`chronicles-sheet-state-v1`** (o sufixo `v1` indica intenção de versionar o formato).

```js
state = {
  dataVersion: 5,                    // versão usada para migrações únicas do estado
  theme: 'field' | 'journal',
  attributesHidden: boolean,          // preferência do botão Ocultar/Mostrar (padrão false)
  character: {
    name: string,
    className: string,
    level: number,
    notes: string,
    hp:     { current: number, max: number },
    sanity: { current: number, max: number },
    effort: { current: number, max: number },
    attributes: [{ id, name, value }] // lista dinâmica
  },
  inventory:   [{ id, name, quantity, description }],
  arsenal:     [{ id, name, quantity, damage, description }],
  diceHistory: [{                      // máx. 12
    id, result: "d20 = 15", sides, value, timestamp: ISOString,
    expression?, total?, detail?, label? // só em rolagens com expressão (ver abaixo)
  }],
  journal:     [{
    id, title, content, tags: ["#Tag"], timestamp: ISOString,
    emotion, emotionOther, emotionIntensity,
    reflection: { thoughts, feelings, fears, desires, innerConflict, relationships, learning, worldview }
  }],
  relationships: [{
    id, name, identification, bondType: "common" | "romantic",
    affinityType: "positive" | "negative",
    affinityLevel: 1 | 2 | 3, description,
    pixelArt?: { width, height, pixels: ["#rrggbb" | null] } // opcional; 16, 32 ou 64, sempre quadrado
  }],
  skills: [{ id, name, attributeIds, attributeId, bonus, training, others }]
}
```

`attributeIds` é a lista de associações atuais. `attributeId` guarda o primeiro ID para compatibilidade com backups antigos.

No histórico de dados, uma **rolagem simples** (um dado, sem modificador e sem vantagem) é gravada no formato de sempre: `{ result: "d20 = 15", sides: 20, value: 15 }`. Uma **rolagem com expressão** grava `result` legível (`"2d6+3 = 9"`), `expression` (forma padronizada, ex.: `"2d20kh1+5"`), `total` (pode ser 0, negativo ou maior que o dado), `detail` (ex.: `"[(4), 17] + 5"`) e `label` (`"Vantagem"`, `"Desvantagem"` ou vazio), com `sides` e `value` em `null`. Assim o validador de backup, que exige `1 ≤ value ≤ sides`, aceita essas entradas, inclusive em versões anteriores do site.

`pixelArt` é o retrato da relação: `pixels` tem `width × height` posições, lidas linha por linha a partir do canto superior esquerdo; cada posição é uma cor hexadecimal de 6 dígitos ou `null` (transparente). Relações sem retrato simplesmente não têm a chave.

### 4.1 Estado padrão (primeiro acesso)

Personagem de exemplo **Aelric Vale**, Bárbaro nível 3, HP 24/30, Sanidade 12/20, Esforço 4/8, atributos Força 16, Intelecto 9, Presença 10, Agilidade 12 e Vigor 15; inventário com "Poção de cura" ×2 e "Mapa antigo" ×1; Arsenal inicialmente vazio; perícias iniciais com associações editáveis; uma rolagem `d20 = 15`; uma entrada de diário "Primeira entrada" com `#Combate` e `#Quest`. A intenção é a página nunca abrir vazia e já demonstrar cada recurso. Esse exemplo (`defaultState`) aparece **só no primeiro acesso**, quando não há nada salvo (ou quando o que está salvo está corrompido, ou o armazenamento está bloqueado).

### 4.2 Valores neutros (`emptyState`)

Quando os dados carregados ou um backup importado **não têm** alguma parte, essa parte é completada com valores neutros, e não com o exemplo: personagem sem nome, sem classe e sem anotações; nível 1; barras **cheias** com os máximos padrão (HP 30/30, Sanidade 20/20, Esforço 8/8); os cinco atributos-base com valor 10; inventário, Arsenal, histórico, diário e relações vazios; perícias iniciais sem bônus e com associações-base; tema `field`; atributos visíveis.

### 4.3 IDs

`generateId()` usa `crypto.randomUUID()` quando disponível; senão monta `id-<timestamp>-<aleatório hex>`.

---

## 5. Fluxo da aplicação

```
carrega script.js (no fim do <body>)
  └─ state = loadState()
        ├─ não há nada salvo     → cópia de defaultState
        ├─ há JSON válido        → normalizeState(JSON salvo)
        ├─ JSON corrompido       → aviso no console e na tela + defaultState (só em memória)
        └─ armazenamento bloqueado → aviso no console e na tela + defaultState (só em memória)
  └─ init()
        ├─ bind* (registra todos os eventos, inclusive o evento "storage" de outras abas
        │         e, se o navegador tiver Screen Wake Lock, o botão "Manter tela acesa")
        ├─ renderAll()
        └─ registrarServiceWorker()  (no evento "load"; ignorado em file://)
```

Padrão usado em toda a aplicação — **evento → altera `state` → `saveState()` → render da área afetada**:

| Função de render | O que desenha |
|---|---|
| `renderTheme` | `data-theme` do body, texto do botão de tema e cor do `<meta name="theme-color">` (`atualizarCorDoTema`) |
| `renderCharacterBlock` | nome, classe, nível, anotações |
| `renderAttributes` | lista de atributos editáveis e visibilidade da grade |
| `renderHp` / `renderSanity` / `renderEffort` | largura da barra, número atual, máximo, mensagem de status |
| `renderSkills` | opções de atributo e tabela de perícias |
| `renderSkillAttributeChecks` | caixas de seleção de atributos da perícia (espelho do `<select multiple>`) |
| `renderDiceMode` | botão ativo entre Normal, Vantagem e Desvantagem |
| `renderWakeLock` | texto e `aria-pressed` do botão "Manter tela acesa" |
| `renderInventory` | desenha a lista de itens |
| `bindInventoryList` | trata edição e remoção via delegação de eventos |
| `renderArsenal` | tabela do Arsenal (Ficha) e cartões resumidos (Diário) |
| `renderRelationships` | desenha as relações, suas afinidades e a miniatura do retrato; `bindRelationshipsList` trata edição, remoção e abertura do editor |
| `renderPixelArtCanvas` | tela do editor de pixel art (pixels, grade e zoom) |
| `renderDiceHistory` | histórico de rolagens + "Última rolagem" |
| `renderJournal` | reconstrói o `<select>` de tags, aplica filtros e desenha as entradas |

Não há framework reativo: o redesenho é manual, por bloco, geralmente limpando `innerHTML` e recriando a lista.

Dois estados ficam **fora** do `state`, porque valem só para a sessão aberta e não entram no backup: o modo da próxima rolagem (`modoRolagem`) e o pedido de tela acesa (`telaAcesaLigada` / `wakeLock`).

**Campos numéricos:** valores válidos são persistidos automaticamente; campos vazios/temporariamente inválidos preservam o último valor válido. Ao digitar um máximo, a barra mostra uma prévia, mas o estado salvo só muda ao confirmar o campo (`change`).

**Armazenamento:** `saveState` e `loadState` usam `try/catch`. Se o `localStorage` estiver bloqueado ou cheio, o site continua funcionando em memória e mostra **um único** `console.warn`, sugerindo usar "Exportar Backup". Na tela, o aviso "Não foi possível salvar neste navegador..." volta a aparecer a cada gravação que falha, sempre que a mensagem anterior já sumiu (`avisarDadosNaoSalvos`). Se a leitura falhar ou os dados salvos não puderem ser interpretados, o conteúdo existente não é sobrescrito automaticamente; a sessão usa o estado padrão em memória e as gravações ficam desativadas até uma importação bem-sucedida. Nesse modo, todas as ações (inclusive excluir do diário e salvar retratos) valem na sessão e entram no backup exportado.

**Outras abas:** quando outra aba grava a mesma chave, o evento `storage` mostra um aviso pedindo para recarregar a página. Os dados desta aba não são trocados automaticamente.

---

## 6. Regras de negócio por funcionalidade

### 6.1 Ficha
- Nome, classe e anotações são salvos a cada tecla (`input`).
- Nível: enquanto a pessoa digita, só valores válidos são salvos, e o campo pode ficar vazio. Ao sair do campo, o nível fica entre **1 e 99**, sempre inteiro (decimais são arredondados); vazio ou inválido vira 1.
- Atributos: cada atributo tem ID estável, nome e valor numérico; nomes e valores são editáveis, novos atributos podem ser adicionados e os IDs não mudam ao renomear. Não há limites numéricos de sistema impostos pelo app.
- Botão Ocultar/Mostrar: esconde ou mostra a grade de atributos (classe `.hidden`) e salva a preferência em `state.attributesHidden`.

### 6.2 Perícias
- `state.skills` começa com a lista de perícias sugerida, mas cada linha pode ser renomeada ou removida e novas perícias podem ser adicionadas.
- Um ou mais atributos são associados por IDs estáveis, de modo que renomear um atributo atualiza o nome mostrado na tabela sem perder a associação. A lista é editável; referências a IDs inexistentes são removidas na normalização.
- Bônus é numérico; Treino e Outros são texto livre para acomodar diferentes sistemas. Não há cálculo automático de testes.
- No celular (≤ 640px), o `<select multiple>` de atributos fica escondido e é substituído por caixas de seleção (`#skillAttributeChecks`), mais fáceis de tocar. Cada caixa só marca ou desmarca a opção correspondente do `<select>`, que continua sendo a fonte do formulário; o dado salvo (`attributeIds`) é o mesmo. Nessa largura, a dica do campo omite "(Ctrl/Cmd para múltiplos)".
- A remoção pede confirmação. Alterações são salvas e entram nos backups; backup legado sem `skills` recebe a lista inicial. Nomes são deduplicados ignorando caixa e espaços excedentes; na consolidação ficam o primeiro ID, as associações unidas, campos textuais preenchidos/combinados, dados originais de duplicatas em `duplicateRecords` e bônus alternativos em `duplicateBonuses`. Editar uma perícia mescla o formulário com o registro existente, então esses campos não se perdem.
- As perícias iniciais incluem Mitologia (Intelecto) e Magia Divina (Vigor), além de associações simples e múltiplas editáveis.

### 6.3 Barras vitais (HP, Sanidade, Esforço)
- Botões somam/subtraem e o resultado é limitado a `0 ≤ atual ≤ máximo`.
- Atual e máximo podem ser editados diretamente na Ficha de Campo. A barra acompanha a prévia do máximo enquanto ele é digitado, sem persistir estados intermediários. Um máximo final válido deve ser maior que zero; zero pode aparecer durante a edição e, ao confirmar, é restaurado ao último máximo válido.
- Ao confirmar um máximo menor, o atual é reduzido para não ultrapassá-lo. Campos vazios ou inválidos preservam o último valor válido.
- Atual e máximo são sempre inteiros: valores decimais digitados ou vindos de dados antigos são arredondados.
- Porcentagem = `atual / máximo`, limitada a 0–100%, vira a largura da barra.
- Três estados, com mensagens próprias para cada barra:

| Condição | Classe | Exemplo (HP) |
|---|---|---|
| atual ≤ 0 | `critical` (vermelho) | "HP zerado. O personagem caiu e precisa de atenção imediata." |
| < 25% | `warning` (amarelo) | "HP crítico! O personagem está em risco iminente." |
| restante | `safe` (verde) | "HP está estável." |

- Cores: HP usa gradiente verde→amarelo→vermelho (variável do tema); Sanidade, gradiente roxo; Esforço, gradiente laranja/âmbar.

### 6.4 Inventário
- **Adicionar**: item novo entra no **topo** da lista (`unshift`). Nome vazio é rejeitado (foco volta ao campo). Quantidade inteira, mínima 1 (decimais são arredondados).
- **Editar**: "Editar" copia o item para o formulário, guarda o ID no campo oculto, troca o botão para "Salvar alterações" e mostra "Cancelar edição". Ao enviar, substitui o item com o mesmo ID.
- **Remover**: imediato, sem confirmação. Se o item removido é o que está sendo editado, o formulário sai do modo de edição e é limpo (mesmo efeito de "Cancelar edição").
- Lista vazia mostra: "Nenhum item no inventário. Adicione o primeiro item."
- No Diário Manuscrito, a lista oculta as descrições e exibe nome e quantidade; descrições continuam no estado e no backup. O formulário grava a descrição em qualquer tema: o campo oculto guarda a descrição carregada ao editar, e itens novos recebem texto vazio.

### 6.4.1 Arsenal
- `state.arsenal` guarda armas separadamente de `state.inventory`, com ID, nome, quantidade, dano e descrição.
- Nome e dano são obrigatórios; quantidade deve ser um inteiro positivo. A expressão de dano é armazenada como texto, sem cálculo ou interpretação.
- Editar carrega os dados existentes e salva com o mesmo ID; cancelar descarta a edição. Remover pede confirmação. Como no Inventário, a descrição é gravada em qualquer tema (armas novas criadas no Diário recebem texto vazio).
- O cadastro, a edição e a remoção salvam a lista compartilhada e redesenham as duas apresentações. No Diário Manuscrito, a descrição é omitida dos cartões, mas permanece carregada no formulário de edição e no estado.
- Backups anteriores sem `arsenal` continuam válidos e recebem uma lista vazia, mantendo o Inventário existente.

### 6.5 Relações
- Relações só aparecem no Diário Manuscrito e são armazenadas em `state.relationships`.
- Nome e identificação são obrigatórios; descrição é opcional.
- `bondType` separa afinidade comum de romântica; `affinityType` representa a polaridade positiva ou negativa. A intensidade é um inteiro de 1 a 3.
- Afinidades comuns usam bolinhas brancas (positiva) ou vermelhas (negativa); vínculos românticos usam corações rosas (positivo) ou vermelhos (negativo). Prévia e tabela mantêm rótulos acessíveis com tipo, polaridade e intensidade.
- A prévia troca ícones, cores e rótulos de intensidade imediatamente ao alterar o tipo, polaridade ou nível. A tabela chama a coluna de "Vínculo" e inclui uma legenda das quatro combinações.
- Adicionar e editar salvam e atualizam a tabela; remover solicita confirmação. Em telas estreitas, cada linha da tabela vira um cartão com rótulos.
- Registros anteriores sem `bondType` são migrados como afinidade comum, preservando polaridade, intensidade, nomes, identificações e descrições. Backups antigos sem `relationships` continuam válidos; a propriedade é completada como lista vazia.
- Editar uma relação preserva o retrato (`pixelArt`) e outros campos que o formulário não mostra.

### 6.5.1 Retrato em pixel art
- Cada linha da tabela de Relações tem um botão de lápis ("Desenhar retrato de …") que abre o editor `#pixelArtDialog` (modal, só no Diário Manuscrito). Quando a relação já tem retrato, uma miniatura aparece ao lado do nome.
- O editor abre o retrato salvo ou uma tela vazia 32 × 32. Resoluções: 16, 32 ou 64 pixels, sempre quadradas; trocar a resolução redimensiona o desenho atual (vizinho mais próximo).
- Ferramentas: **Lápis** (pinta com a cor escolhida, com traço contínuo ao arrastar), **Borracha** (deixa o pixel transparente, `null`) e **Balde** (preenche a área contígua da mesma cor). Paleta fixa de 14 cores mais uma cor personalizada; escolher uma cor volta para o Lápis.
- Desfazer/Refazer guardam até **40** passos (botões ou `Ctrl+Z`, `Ctrl+Shift+Z` e `Ctrl+Y` com a tela focada). Também há grade liga/desliga, zoom de 75% a 175% e "Limpar desenho" (pede confirmação).
- **Salvar desenho** grava `relationships[].pixelArt` na relação aberta (procurada pelo ID no momento de salvar), redesenha a tabela e fecha o editor. Se a gravação falhar por falta de espaço, o retrato anterior é mantido e o editor continua aberto para nova tentativa; com o armazenamento desativado, o retrato fica na sessão.
- **Cancelar**, **×**, `Esc` ou clique fora do editor pedem confirmação quando há alterações não salvas. Ao fechar, o foco volta ao botão que abriu o editor.
- Validação: `normalizePixelArt` aceita só largura = altura ∈ {16, 32, 64}, exatamente `largura × altura` pixels e cores `#rrggbb` (guardadas em minúsculas) ou `null`. Ao carregar dados salvos, um retrato inválido é descartado sem afetar a relação; na importação, um retrato inválido recusa o backup inteiro.

### 6.6 Rolador de dados
- Cada dado é sorteado com `Math.floor(Math.random() * lados) + 1`. Os botões d4…d100 e o campo "Expressão" usam o mesmo caminho (`rolarExpressao`): o botão d20 equivale a digitar `d20`.
- **Expressões** (`interpretarExpressao`, sem `eval`): termos somados ou subtraídos, cada um sendo `NdX` ou um número inteiro. `N` é opcional (vale 1), `d%` é `d100`, maiúsculas são aceitas e espaços só em volta de `+`/`-` (`"2d6 + 3"` vale; `"d20 5"` é recusado, em vez de virar `d205`). Sufixos de "manter": `khM` soma os `M` maiores, `klM` os `M` menores, `k` é o mesmo que `kh1` (ex.: `4d6kh3`, `2d20kl1`).
- **Limites**, para uma expressão digitada não travar o celular: até 100 dados no total, 1000 faces, modificador de até 10000 e 20 termos. `0d6`, `d0`, `kh0` ou manter mais dados do que foram rolados são recusados.
- **Modo da próxima rolagem**: Normal, Vantagem ou Desvantagem. Com vantagem, um dado único da expressão vira `2dXkh1` (desvantagem: `2dXkl1`); se houver mais de um (ex.: `d20+d4`), vale para o d20 ou, sem d20, para o primeiro. Sem dado único (ex.: `2d6`), aparece "Vantagem e desvantagem valem para expressões com um dado único, como d20+5." e nada é rolado. Depois de cada rolagem o modo volta para Normal; o modo não é salvo.
- Expressão vazia ou inválida mostra uma mensagem de erro em `#appStatus` (ex.: "Não entendi a expressão…") e não altera o histórico. A expressão continua no campo depois de rolar, para repetir com um toque.
- Cada rolagem entra no topo; o histórico guarda **as 12 últimas**. O formato gravado está em 4 (rolagem simples no formato antigo; com expressão, `expression`/`total`/`detail`/`label` e `sides`/`value` nulos).
- O histórico apresenta Dado (a expressão, ou `dX`), Resultado (o total, com o detalhe embaixo: dados descartados entre parênteses, ex.: `Vantagem: [(4), 17] + 5`) e Data e horário; a rolagem mais recente recebe destaque. Registros antigos no formato `"d20 = 15"` são interpretados para compor as colunas. "Última rolagem" mostra o `result` (ex.: `2d6+3 = 9`).
- Datas no formato curto `pt-BR` (`Intl.DateTimeFormat`, ex.: `20/11/2026 14:32`).
- "Limpar histórico" esvazia a lista e volta "Última rolagem" para "Nenhuma". O próprio `renderDiceHistory` também mostra "Nenhuma" sempre que o histórico estiver vazio (por exemplo, depois de importar um backup sem rolagens).

### 6.7 Diário psicológico
- Título e descrição do acontecimento obrigatórios. Entradas novas no topo; data e horário são registrados automaticamente.
- Tags (`normalizeTags`): separa por vírgula, tira espaços, adiciona `#` se faltar, remove espaços internos, elimina duplicadas sem diferenciar maiúsculas (fica a primeira grafia), **máximo 6 tags**. Ex.: `"combate, #NPC, lore antigo"` → `["#combate", "#NPC", "#loreantigo"]`.
- Emoção predominante, intensidade de 1 a 5 e os campos de reflexão são opcionais. A emoção "Outra" permite informar uma descrição livre. A reflexão fica recolhida por padrão para manter o formulário leve.
- As entradas guardam oito respostas opcionais (pensamentos, sentimentos, medos, desejos/necessidades, conflito interno, relações, aprendizado e visão de mundo). Campos vazios são preservados como vazios; registros antigos recebem valores neutros ao serem normalizados.
- Cada registro apresenta título, data, tags (quando houver), acontecimento, estado emocional e reflexões preenchidas. Emoção e intensidade recebem destaque visual; blocos opcionais vazios não são renderizados.
- A busca considera título, descrição, tags, emoção e reflexão.
- O `<select>` de tags é reconstruído a cada render com todas as tags existentes, em ordem alfabética, preservando a seleção atual se ainda existir.
- Filtro: a entrada aparece se (busca vazia **ou** termo aparece no título/conteúdo/tags/emoção/reflexão, sem diferenciar maiúsculas) **e** (filtro "Todas" **ou** a entrada tem a tag escolhida, sem diferenciar maiúsculas). O `<select>` mostra uma opção por tag (`#combate` e `#Combate` viram uma só, com a primeira grafia encontrada).
- Ao salvar uma entrada nova que a busca ou o filtro atual esconderiam, os dois são limpos para ela aparecer.
- Conteúdo exibido com `white-space: pre-wrap` (mantém quebras de linha).
- **Excluir**: cada registro tem um botão 🗑 que abre o diálogo de confirmação `#journalDeleteDialog` ("Excluir registro"). Confirmar remove a entrada, salva e redesenha a lista; Cancelar ou `Esc` não altera nada. Em navegadores sem `<dialog>`, a confirmação usa `window.confirm`.
- Não há como editar entradas do diário.
- A intensidade emocional é sempre um inteiro de 1 a 5 (decimais vindos de dados antigos são arredondados), para o texto "N/5" bater com o medidor de cinco bolinhas.

### 6.8 Temas
- Botão alterna `field` ↔ `journal`, grava em `state.theme` e atualiza `body[data-theme]`. O texto do botão mostra **o tema para o qual vai mudar**.
- A cor da barra do navegador (`<meta name="theme-color">`) acompanha o tema: `#0f172a` no `field` e `#2c1f13` no `journal` (o `--bg` de cada um, em `CORES_TEMA`). Ela troca no botão, ao carregar e depois de importar um backup.
- Além do visual, o CSS **esconde painéis** conforme o tema:
  - **Ficha de Campo** (`field`): esconde o **Diário Psicológico** e **Relações**; mostra atributos, perícias, Arsenal e rolador.
  - **Diário Manuscrito** (`journal`): esconde o **Rolador de Dados**, as **Perícias** e os **Atributos**; mostra o Arsenal em cartões resumidos, relações e as barras vitais como cartões com valores compartilhados. As descrições do Inventário e Arsenal não aparecem nas listagens, mas continuam armazenadas.

  Essa separação mantém as ferramentas técnicas no modo de ficha e prioriza personagem, inventário, relações e narrativa no modo manuscrito.

### 6.9 Backup
- **Exportar**: serializa todo o objeto `state` com indentação, incluindo ficha, atributos, perícias, barras vitais, inventário, Arsenal, histórico de rolagens, diário, relações e quaisquer campos adicionais, cria um `Blob` e força o download de `chronicles-sheet-backup-AAAA-MM-DD-HH-MM-SS.json` (o link temporário entra no documento só durante o clique, e a URL é revogada 1 segundo depois). Campos adicionais preservados no estado também entram no JSON.
- **Importar**: lê o arquivo, faz `JSON.parse` e valida a estrutura e os campos conhecidos com `validateBackup` (que substituiu o antigo `looksLikeBackup`) antes de normalizar ou alterar o estado. Exige um objeto de backup com `character` ou ao menos uma das listas `inventory`, `arsenal`, `journal`, `diceHistory`, `relationships` ou `skills`; valida tipos e registros dessas estruturas (incluindo quantidade positiva inteira e expressão de dano não vazia para cada arma, o formato de `pixelArt` em cada relação e, nas rolagens, `total` numérico e `expression`/`detail`/`label` em texto quando existirem) e recusa JSON malformado ou incompatível. Cada problema gera uma mensagem específica ("Não foi possível importar o backup. … Os dados atuais foram mantidos."). Depois da validação, `normalizeState` prepara o novo estado, completando campos ausentes, e só então ele substitui o atual. Campos adicionais desconhecidos são preservados para compatibilidade futura. A importação é atômica quanto à validação: em caso de erro, os dados e formulários atuais permanecem intactos, uma mensagem explica o problema e o input é limpo para permitir nova tentativa. Após uma importação válida, os formulários (inventário, Arsenal, atributos, perícias, relações e diário) são limpos e a tela é redesenhada. A importação grava mesmo quando as gravações estavam desativadas por dados ilegíveis, e as reativa. Se o armazenamento falhar, o backup ainda é aplicado à sessão e uma mensagem informa que ele não foi persistido.
- Backups exportados por versões anteriores (sem `attributesHidden`, sem `sanity`/`effort` ou sem `relationships[].bondType`) continuam importando. Relações antigas sem tipo viram afinidade comum; backups parciais (ex.: só `journal`) também são aceitos. Em todos os casos, o que falta recebe os **valores neutros** (ver 4.2), nunca o personagem de exemplo.

### 6.10 Normalização e segurança
`normalizeState` é usado ao carregar do `localStorage` e ao importar:
- Entrada que não é objeto (array, número, `null`) é tratada como `{}`.
- Faz *deep merge* sobre uma cópia de `emptyState` (valores neutros, ver 4.2): chaves que faltam são completadas e arrays recebidos substituem os padrões. Listas ausentes/inválidas ficam vazias, exceto `skills`, que recebe a lista inicial sugerida.
- **Personagem**: `name`, `className` e `notes` viram texto; `level` fica entre 1 e 99, arredondado para inteiro. Atributos dinâmicos mantêm nome/ID e aceitam qualquer valor numérico finito.
- **Atributos**: mapas legados como `{ forca: 16, ... }` viram itens com IDs estáveis e nomes editáveis. Na migração versionada, os seis atributos antigos são mapeados para Força, Intelecto, Presença, Agilidade e Vigor; Sabedoria é removida; nomes personalizados e valores são preservados. Listas atuais preservam IDs; entradas incompletas são descartadas.
- **skills**: descarta perícias sem nome; normaliza bônus numérico e associações múltiplas para IDs de atributos existentes; Treino e Outros viram texto. Dados legados sem versão recebem as associações-base quando não havia associação salva, Mitologia e Magia Divina são incluídas uma vez, e duplicatas de nome são consolidadas.
- **Barras vitais**: `hp`, `sanity` e `effort` ausentes, `null` ou inválidos ficam cheios com o máximo padrão; `max ≥ 1` e `0 ≤ current ≤ max`, ambos inteiros (`current` inválido vira o máximo).
- **inventory**: descarta itens sem `name`; `quantity` vira inteiro ≥ 1; `description` vira texto.
- **arsenal**: descarta armas sem nome, quantidade inteira positiva ou expressão de dano; normaliza nome e expressão como texto e descrição como texto opcional.
- **diceHistory**: descarta entradas sem `result` em texto; no máximo 12.
- **journal**: descarta entradas sem `title` ou `content`; `tags` vira sempre um array de textos (texto solto passa por `normalizeTags`); `emotionIntensity` vira inteiro de 1 a 5 ou `null`.
- **relationships**: descarta relações sem nome ou identificação; tipo de vínculo inválido ou ausente vira `common`; polaridade é normalizada para positiva/negativa e intensidade para inteiro de 1 a 3; descrição ausente vira texto vazio; `pixelArt` inválido é removido (ver 6.5.1).
- **diceHistory**: campos `sides` e `value` ausentes são recuperados do formato legado `"d20 = 15"` quando possível. `expression`, `detail` e `label` viram texto (vazio quando faltam) e `total` vira número ou `null`.
- **IDs** ausentes ou repetidos são gerados de novo; **timestamps** inválidos viram `null` (exibidos como "Sem data", em vez de quebrar o `formatDate`).
- `theme` inválido volta para `field`; `attributesHidden` que não seja booleano vira `false`.
- Campos extras desconhecidos nos itens são preservados.

`escapeHtml` é usado em todo texto do usuário inserido via `innerHTML` (nomes, descrições, tags, títulos, conteúdo, `data-id` e `value` das opções, expressão e detalhe das rolagens), evitando injeção de HTML. Valores atribuídos direto pelo DOM (ex.: `dataset.attributeId`) não passam por `escapeHtml`, porque ali o texto não é interpretado como HTML.

### 6.11 Instalação, offline e tela acesa
- **Instalação**: `manifest.webmanifest` define nome ("Chronicles & Sheet", curto "Chronicles"), `display: standalone`, cores `#0f172a` e os ícones de `icons/` (192 e 512 px, o de 512 também como `maskable`, e o SVG). O desenho do ícone fica no centro, para não ser cortado pela máscara do celular. Caminhos são relativos (`./`), então funciona na subpasta do GitHub Pages.
- **Offline** (`sw.js`): registrado só em `http(s)` (`registrarServiceWorker` ignora `file://` e engole erros de registro, sem mensagem). Na instalação, guarda em `chronicles-sheet-v1` os 9 arquivos de `ARQUIVOS` (`./`, `index.html`, `styles.css`, `script.js`, o manifest e os 4 ícones), chama `skipWaiting` e, na ativação, apaga caches de outras versões e assume as abas abertas (`clients.claim`).
- Estratégia **rede primeiro**: para cada `GET` do próprio site, busca na rede com `cache: 'no-cache'` (pula o cache HTTP de 10 min do GitHub Pages) e atualiza a cópia guardada. Se a rede falhar ou demorar mais de **4 s** (`TEMPO_LIMITE_REDE`), responde com a cópia; a versão nova continua baixando para a próxima abertura. Navegações com `?query` ou sem cópia própria usam o `index.html` guardado. Assim, com internet, uma recarga já traz a versão nova.
- Mudar o conteúdo dos arquivos não exige mudar o `sw.js`; um arquivo **novo** que o site precise offline tem de ser acrescentado a `ARQUIVOS`.
- Os dados da ficha continuam só no `localStorage`; o service worker guarda apenas os arquivos do site.
- **Tela acesa** (Screen Wake Lock): `bindWakeLock` mostra o botão `#wakeLockBtn` só se `navigator.wakeLock` existir; sem suporte, ele fica oculto e nada acontece. Ligado, o texto vira "Tela acesa: ligada". O navegador solta o bloqueio quando a aba fica escondida; ao voltar (`visibilitychange`), o site pede de novo. Se o pedido for recusado (ex.: economia de bateria), aparece "Não foi possível manter a tela acesa agora. Verifique se a economia de bateria está ligada." e o botão volta a desligado. A escolha vale só para a sessão.

---

## 7. Estilo e temas (styles.css)

### 7.1 Sistema de variáveis
Todas as cores vêm de variáveis em `:root` (tema **field**), redefinidas em `body[data-theme='journal']`. Principais tokens: `--bg`, `--panel`, `--primary`, `--accent`, `--text`, `--muted`, `--danger`, `--success`, `--warning`, `--border`, `--hp-fill`, `--input-bg`, `--button-text`.

| | Ficha de Campo (`field`) | Diário Manuscrito (`journal`) |
|---|---|---|
| Estética | técnica, escura, moderna | pergaminho antigo / fantasia |
| Fundo | azul-marinho com brilho radial roxo | marrom com padrão SVG de quadradinhos dourados bem discretos, por cima do gradiente |
| Primária / acento | roxo `#8b5cf6` / ciano `#22d3ee` | bronze `#9a6a30` / dourado `#d4a15c` |
| Fonte | Segoe UI (sans-serif) | Georgia (serifada) |

### 7.2 Layout
- Container de até 1200px; grid de 12 colunas; painéis ocupam 6 colunas (dois por linha), diário ocupa a linha toda.
- Inventário: formulário em cima e lista embaixo, em qualquer largura (o painel tem no máximo ~550px, e duas colunas lado a lado não cabiam).
- Arsenal: formulário em cima e tabela abaixo; em telas estreitas, as linhas viram cartões rotulados sem rolagem horizontal.
- Cartões com cantos arredondados, sombra e `backdrop-filter: blur` (efeito vidro).
- Botões sobem 1px no hover, só com mouse (`@media (hover: hover)`), para o efeito não ficar "grudado" depois de um toque no celular; o mesmo vale para o lápis do retrato e o 🗑 do diário. Barras animam a largura.
- Rolador: os botões de modo ocupam a linha toda em partes iguais; o campo "Expressão" e o botão Rolar ficam lado a lado, com a dica embaixo.

### 7.3 Responsividade
- **≤ 900px**: cada painel ocupa a largura toda.
- **≤ 640px**: topo em coluna; botões do topo em largura total; ficha, filtros e atributos em 1 coluna; dados em 2 colunas. Além disso:
  - tabelas de Perícias, Arsenal e histórico de dados viram cartões rotulados com células em largura total (antes, as larguras em % das colunas espremiam o conteúdo); no histórico, o detalhe da rolagem fica embaixo do total;
  - alvos de toque de pelo menos 44px (Editar/Remover das listas, lápis do retrato, 🗑 do diário, "Importar Backup", "Ver reflexões", controles do editor de pixel art, cores da paleta); "Reflexão psicológica" ganha área de toque maior;
  - caixas de seleção no lugar do `<select multiple>` das perícias (ver 6.2), em 2 colunas;
  - `#appStatus` fica fixa na base da tela (acima da barra inferior do iPhone), com o mesmo fundo de vidro do topo, para a mensagem aparecer perto de onde a pessoa está;
  - botões de modo da rolagem com menos espaço lateral, para os três caberem em 360px;
  - editor de pixel art com altura `100dvh` (com `100vh` de reserva), para caber com a barra de endereço visível.
- **Safe-area**: com `viewport-fit=cover`, o `body` recebe padding `env(safe-area-inset-*)`, que afasta o conteúdo do notch; fora de aparelhos com recorte (e no desktop) vale 0.

### 7.4 Outros
- Classe utilitária `.hidden` (`display: none !important`).
- `.empty-state` para listas vazias (borda tracejada).
- Barra de rolagem customizada (WebKit).
- Usa `color-mix()` no fundo do tema field, com fallback via `@supports` para navegadores sem suporte (cor já calculada `rgb(12, 18, 34)`).
- Fallbacks para navegadores antigos: `-webkit-backdrop-filter`, `top/right/bottom/left` antes de `inset`, valores fixos antes de `min()` e `clamp()`.
- O SVG de fundo é uma data URI codificada no padrão (`charset=utf-8`, `%3C`/`%3E`).

---

## 8. Requisitos do prompt × implementação

| Requisito (TEXTOS SCRIPT JOGO.txt) | Situação |
|---|---|
| HTML/CSS/JS separados, sem frameworks | ✅ Atendido |
| Persistência em `localStorage` | ✅ Atendido (com aviso e funcionamento em memória se o armazenamento estiver bloqueado) |
| Exportar/importar `.json` | ✅ Atendido |
| Nome, classe, nível, anotações editáveis | ✅ Atendido |
| Atributos dinâmicos e editáveis | ✅ Atendido (nome e valor salvos, IDs estáveis e incluídos no backup) |
| Gerenciamento de perícias | ✅ Atendido (adicionar, editar, remover e associar atributos; incluídas no backup) |
| Barras de HP, Sanidade e Esforço editáveis | ✅ Atendido (valores atual/máximo, validação e estado compartilhado entre temas) |
| HP com barra e botões ±1/±5 | ✅ Atendido |
| Alerta de HP crítico (< 25% ou 0) | ✅ Atendido, com dois níveis (aviso e crítico) |
| Inventário: adicionar/editar/remover, nome/qtd/descrição | ✅ Atendido |
| Dados d4–d100 | ✅ Atendido (e também expressões com modificador, "manter maiores/menores" e vantagem/desvantagem) |
| Histórico com timestamp | ✅ Atendido (12 últimas) |
| Diário com tags e filtro por tag/palavra-chave | ✅ Atendido |
| Alternância "Ficha de Campo" / "Diário Manuscrito" | ✅ Atendido (e também esconde painéis) |
| **Extras** não pedidos | Sanidade, Esforço, limpar histórico de dados, botão "Ocultar" atributos, rolagem por expressão, instalação na tela inicial, modo offline, "Manter tela acesa" |

---

## 9. Pontos incompletos, inconsistências e riscos

Encontrados na análise do código original e nas revisões seguintes. Cada item está marcado como **✅ Resolvido** (com uma linha sobre como) ou **⏳ Pendente**.

### 9.1 Funcionalidades incompletas
1. ✅ **Atributos não estavam ligados ao JavaScript.** A tela sempre mostrava 10 e as alterações não eram salvas.
   *Resolvido:* `bindAttributeInputs` e `renderAttributes` ligam os campos a `state.character.attributes`; nomes e valores são editáveis, os IDs permanecem estáveis ao renomear e os valores entram no backup.
2. ✅ **O botão "Ocultar" atributos não fazia nada.**
   *Resolvido:* `bindAttributesToggle` alterna a classe `.hidden` na grade e o texto "Ocultar"/"Mostrar", e salva a preferência em `state.attributesHidden`.
3. ✅ **CSS sem uso** (`.attribute-name-row`, `.attribute-name-input`, `.remove-attribute-btn`, `.attributes-area`, `.add-attribute-btn`), restos de um recurso de atributos personalizados não terminado.
   *Resolvido:* as classes foram apagadas do `styles.css`.
   ✅ *Também resolvido:* o botão "Ocultar" ficava embaixo do título "Atributos", porque `.attributes-header` não tinha estilo. Agora `.attributes-header` entra na mesma regra de `.hp-header` (título à esquerda, controle à direita), sem cores, fontes ou tamanhos novos. Conferido nos dois temas, em 900px e 640px.
   ⏳ *Pendente:* `.attributes-section` continua sem estilo, então o cabeçalho "Atributos" fica colado na caixa "Esforço está estável.", sem o espaço e a linha que separam as barras (`.vital-bar-item`).
4. ⏳ **Diário sem edição/exclusão** de entradas.
   ✅ *Exclusão resolvida:* cada registro tem um botão 🗑 com diálogo de confirmação (ver 6.7).
   ⏳ *Pendente:* edição de entradas.

### 9.2 Comportamentos estranhos
5. ✅ **Diminuir o máximo não ajustava o atual** ("24 / 10").
   *Resolvido:* no `change` do campo de máximo, o atual é reduzido para `≤ máximo`; `normalizeState` também garante isso nos dados carregados.
6. ✅ **O campo Nível virava "1" ao ser apagado**, e não havia limite de 99 no JS.
   *Resolvido:* o `input` só salva valores válidos sem reescrever o campo; o `change` aplica o limite de 1 a 99. A mesma correção vale para os campos de máximo.
7. ✅ **Visibilidade dos painéis por tema.** A Ficha de Campo esconde visualmente diário e relações sem apagar dados; o Diário Manuscrito continua apresentando suas funcionalidades.
8. ✅ **`journalList` não era declarado** no JS.
   *Resolvido:* declarado com `getElementById`, como os outros elementos.

### 9.3 Robustez do import e do armazenamento
9. ✅ **`normalizeState` não validava cada item** das listas; uma entrada de diário sem `tags` quebrava o filtro.
   *Resolvido:* cada item de `inventory`, `arsenal`, `diceHistory` e `journal` é validado e os inválidos são descartados; `sanity`/`effort` nulos são recuperados; IDs e datas também são validados (ver 6.8).
10. ✅ **O `data-id` do inventário entrava sem escape.**
    *Resolvido:* agora passa por `escapeHtml`.
11. ✅ **Redundâncias**: `escapeAttribute` duplicava `escapeHtml`; `sanity`/`effort` nulos davam erro.
    *Resolvido:* `escapeAttribute` foi removido; as três barras são recuperadas pelo mesmo laço.
12. ✅ **Importar qualquer JSON válido (ex.: `{}`) apagava os dados**, trocando tudo pelo personagem de exemplo, e mostrava "sucesso".
    *Resolvido:* `validateBackup` (que substituiu `looksLikeBackup`) recusa arquivos sem `character` e sem nenhuma das listas, além de campos e registros em formato inválido; aparece "Não foi possível importar o backup. …" com o motivo, e nada muda.
    ✅ *Também resolvido:* um backup que tenha só parte dos dados (ex.: só `journal`) recebia os dados de exemplo no que faltava. Agora `normalizeState` completa com `emptyState` (valores neutros, ver 4.2); o exemplo aparece só no primeiro acesso.
13. ✅ **Remover o item em edição fazia perder o que estava sendo digitado.** O formulário ficava em modo edição e o "Salvar" não salvava nada.
    *Resolvido:* ao remover o item que está sendo editado, o formulário sai do modo de edição (`clearInventoryForm`).
    ✅ *Também resolvido:* importar um backup no meio de uma edição tinha o mesmo efeito. Depois de uma importação bem-sucedida, os formulários de inventário, Arsenal, atributos, perícias, relações e diário são limpos; uma importação recusada não os altera.
14. ✅ **Com o `localStorage` bloqueado ou cheio, o site travava.**
    *Resolvido:* leitura e gravação estão em `try/catch`; o site funciona só em memória e mostra um único `console.warn` sugerindo "Exportar Backup". O aviso na tela se repete a cada falha (ver item 25).
15. ✅ **"Última rolagem" mostrava uma rolagem antiga** depois de importar um backup sem histórico de dados, porque `renderDiceHistory` saía antes de atualizar o texto quando a lista estava vazia.
    *Resolvido:* com o histórico vazio, `renderDiceHistory` também mostra "Nenhuma".

### 9.4 Outros pendentes encontrados na revisão
16. ✅ Com uma busca ou um filtro de tag ativo, uma entrada nova do diário pode não aparecer na lista, e parece que não foi salva.
    *Resolvido:* ao salvar, se a busca ou o filtro atual esconderiam a entrada nova, os dois são limpos.
17. ✅ Tags com maiúsculas diferentes (`#combate` e `#Combate`) aparecem separadas no filtro, mas a busca por texto ignora maiúsculas.
    *Resolvido:* o filtro e a deduplicação de tags comparam sem diferenciar maiúsculas (`chaveTag`); cada tag continua salva como foi escrita, e a opção do filtro mostra a primeira grafia encontrada.
18. ✅ Quantidade, nível, atributos e máximos aceitam números decimais (ex.: 2,5).
    *Resolvido:* quantidade do inventário, nível e atual/máximo das barras são arredondados para inteiros (na tela e na normalização). Atributos e bônus de perícia continuam aceitando decimais.
19. ⏳ Com duas abas abertas, a última que salvar sobrescreve as mudanças da outra.
    *Mitigado:* quando outra aba grava os dados, esta aba mostra um aviso pedindo para recarregar (evento `storage`). Os dados não são recarregados à força, então a sobrescrita ainda pode acontecer se o aviso for ignorado.
20. ✅ O Exportar libera o link do download logo depois do clique, sem colocá-lo na página. Funciona nos navegadores atuais, mas pode falhar em antigos.
    *Resolvido:* o link é colocado no documento antes do clique e removido depois; a URL é revogada 1 segundo depois.

### 9.5 CSS e visual
21. ✅ **O SVG do fundo do tema Diário estava fora do padrão** (`;utf8`, `<`/`>` sem codificar, `fill="transparent"`).
    *Resolvido:* data URI recodificada; a comparação de pixels confirmou que o resultado é idêntico.
22. ✅ **O padrão SVG não aparecia**, porque ficava escondido embaixo do gradiente.
    *Resolvido:* a ordem das camadas foi invertida.
23. ✅ **Sem `color-mix()`, o fundo do tema field sumia** e a página ficava branca.
    *Resolvido:* fallback via `@supports` (ver 7.4), junto com outros fallbacks.
24. ✅ **O inventário transbordava o painel** em telas largas.
    *Resolvido:* formulário e lista empilhados (ver 7.2).

### 9.6 Detalhes
- No prompt, "estilo paminho" é um erro de digitação de "pergaminho".
- Os botões de vital (Sanidade/Esforço) também têm a classe `.hp-btn`; a separação é feita pelo `data-stat`, então funciona, mas os nomes de classe podem confundir.
- Confirmações e erros de ações aparecem na região acessível `#appStatus`; ela usa `aria-live` e desaparece após alguns segundos.
- O inventário usa delegação de eventos para manter a renderização separada dos handlers de edição e remoção.

### 9.7 Auditoria de bugs do script.js
Encontrados na auditoria da ligação entre `script.js` e o HTML. O roteiro para conferir cada correção está em `testes-manuais.md`.

25. ✅ **Com as gravações desativadas (dados salvos ilegíveis ou armazenamento bloqueado), as edições sumiam ao recarregar**, e o único aviso desaparecia em 7 segundos.
    *Resolvido:* `saveState` chama `avisarDadosNaoSalvos`, que mostra de novo "Não foi possível salvar neste navegador..." sempre que a mensagem anterior já sumiu.
26. ✅ **Com o armazenamento cheio, só a primeira falha de gravação era avisada.**
    *Resolvido:* `warnStorageUnavailable` mantém um único `console.warn`, mas repete o aviso na tela pela mesma `avisarDadosNaoSalvos`.
27. ✅ **Arma criada no Diário Manuscrito ficava sem `description`**, e ao editá-la na Ficha de Campo o campo mostrava "undefined".
    *Resolvido:* Inventário e Arsenal gravam a descrição em qualquer tema, e a edição da arma usa `weapon.description || ''`.
28. ✅ **Trocar de tema no meio de uma edição descartava a descrição alterada** sem aviso.
    *Resolvido:* mesma correção do item 27; a descrição do formulário é sempre lida.
29. ✅ **Importar um backup não limpava o formulário de Relações**, que continuava editando uma relação que podia não existir mais.
    *Resolvido:* `handleBackupImport` também chama `clearRelationshipForm()`.
30. ✅ **Com as gravações desativadas, não era possível excluir entradas do diário nem salvar retratos**, ao contrário das outras ações; a falha ainda aparecia com estilo de sucesso.
    *Resolvido:* a exclusão segue o fluxo evento → `state` → `saveState()` → render; o retrato só é desfeito quando a gravação falha por falta de espaço (ver 6.5.1).
31. ✅ **Editar uma perícia apagava `duplicateRecords`, `duplicateBonuses` e campos extras.**
    *Resolvido:* a edição faz `{ ...registroAntigo, ...formulário }`, como nas outras listas.
32. ✅ **Atributos com `&`, `<`, `>`, `"` ou `'` no ID não salvavam edições**, porque `escapeHtml` era aplicado ao `dataset` e o ID deixava de bater com o `state`.
    *Resolvido:* `dataset.attributeId` recebe o ID sem escape.
33. ✅ **`emotionIntensity` decimal (ex.: 2.5) mostrava "2.5/5" com só 2 bolinhas.**
    *Resolvido:* `normalizeJournalEntry` arredonda para inteiro (`arredondarOuNulo`).
34. ⏳ Detalhes de gravidade baixa ainda pendentes: `Esc` pode fechar o editor de pixel art sem confirmar em versões recentes do Chrome (suspeita); `emotionOther` continua salvo e pesquisável quando a emoção deixa de ser "Outra"; digitar o atual de uma barra acima do máximo reescreve o campo durante a digitação; a busca do diário fecha as reflexões abertas; a tag `#` sozinha é aceita; editar o valor de um atributo e apertar Tab pode tirar o foco do campo (suspeita); clicar na margem interna do editor também pede para fechá-lo (suspeita); `structuredClone` impede a página de carregar em navegadores anteriores a Safari 15.4 / Chrome 98.

### 9.8 Uso no celular, offline e rolagens
Encontrados na análise de uso no celular (telas de 360 a 430px) e na avaliação para outros sistemas de RPG.

35. ✅ **Cartões de Perícias e Arsenal ilegíveis no celular**: uma letra por linha e "Editar"/"Remover" com 31px de largura.
    *Resolvido:* as células do cartão recebem `width: 100%` em ≤ 640px, vencendo as larguras em % das colunas da tabela.
36. ✅ **Alvos de toque pequenos** (Editar/Remover, lápis do retrato, 🗑, controles do editor de pixel art).
    *Resolvido:* mínimo de 44px em ≤ 640px (ver 7.3).
37. ✅ **`<select multiple>` das perícias difícil de usar no toque.**
    *Resolvido:* caixas de seleção em ≤ 640px, mantendo `attributeIds` (ver 6.2).
38. ✅ **Efeito de hover ficava "grudado" depois de um toque.**
    *Resolvido:* hover só em `@media (hover: hover)`.
39. ✅ **Mensagens de `#appStatus` apareciam no topo**, longe de quem estava no fim da página.
    *Resolvido:* no celular, ficam fixas na base da tela.
40. ✅ **Total de rolagem com modificador seria recusado no import** (o validador exige `1 ≤ value ≤ sides`, e `d20+5 = 25` ou `d20-5 = -2` quebrariam a regra).
    *Resolvido:* rolagens com expressão gravam o total em `total` e deixam `sides`/`value` nulos (ver 4).
41. ⏳ **Limites do iPhone (Safari)**, que não dependem do código: não há aviso de "Instalar" (é pelo menu Compartilhar → "Adicionar à Tela de Início"); o app da tela inicial tem armazenamento **separado** do Safari, então os dados precisam ser levados com Exportar/Importar Backup; o Safari pode apagar dados de sites não abertos por cerca de 7 dias (o app instalado não); "Manter tela acesa" só funciona no app instalado a partir do iOS 18.4; versões recentes do Safari podem ignorar o `theme-color`.
42. ⏳ **Versões anteriores do site** mostram rolagens com expressão como "Dado" e o texto de `result` (ex.: `2d6+3 = 9`), sem as colunas separadas. Os dados não se perdem.
43. ⏳ Ainda não implementados, da avaliação para outros sistemas: rolar o dano direto do Arsenal, modificador de atributo estilo D&D (ligável), rolar teste de perícia conforme a regra do sistema e campos genéricos (CA/Defesa, Iniciativa, Deslocamento, condições).

---

## 10. Como executar e publicar

- **Local**: abrir `index.html` no navegador (Chrome, Edge, Firefox ou Safari recentes). Assim tudo funciona, menos o modo offline.
- **Local com offline**: o service worker exige `http(s)`. Na pasta do projeto, rodar um servidor simples (ex.: `python -m http.server 8000` ou o Live Server do VS Code) e abrir `http://localhost:8000`.
- **GitHub Pages**: https://professoralissonlucas.github.io/ChroniclesAndSheet/ — publicado a partir da raiz da branch `main`. Não há build. O offline passa a valer depois que o site é aberto uma vez com internet.
- **Instalar no celular**: Android/Chrome → menu → "Instalar app" (ou o aviso automático); iPhone/Safari → Compartilhar → "Adicionar à Tela de Início". No iPhone, levar os dados com Exportar/Importar Backup (ver 9.8, item 41).
- **Resetar dados**: apagar a chave `chronicles-sheet-state-v1` no `localStorage` (DevTools → Application → Local Storage) ou importar um backup.
- **Resetar o modo offline**: DevTools → Application → Service workers → "Unregister", e Storage → "Clear site data" (isso também apaga o `localStorage`; exporte um backup antes).
- **Armazenamento bloqueado** (algumas janelas anônimas ou configurações de privacidade): o site funciona, mas não guarda nada ao fechar. Use "Exportar Backup".

---

## 11. Glossário

| Termo | Significado |
|---|---|
| HP / PV | Pontos de Vida |
| Sanidade | Estabilidade mental do personagem |
| Esforço | Recurso gasto em ações especiais |
| FOR, DES, CON, INT, SAB, CAR | Força, Destreza, Constituição, Inteligência, Sabedoria, Carisma |
| dX | Dado de X lados (d20 = dado de 20 lados) |
| NdX+M | Rolar N dados de X lados e somar M (ex.: `2d6+3`) |
| kh / kl | "Keep highest" / "keep lowest": soma só os maiores / menores (ex.: `4d6kh3`) |
| Vantagem / Desvantagem | Rolar o dado duas vezes e ficar com o maior / menor (`2d20kh1` / `2d20kl1`) |
| Service worker | Script que o navegador roda à parte da página; aqui, guarda os arquivos para o site abrir offline |
| Wake Lock | Recurso do navegador que impede a tela de apagar enquanto o site está aberto |
| Diário Psicológico | Registro narrativo e emocional da campanha |
