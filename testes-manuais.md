# Testes manuais — Chronicles & Sheet

Roteiro para conferir no navegador as correções e os recursos novos. As seções A a D levam uns 15 minutos; E a G, mais uns 15.

| Seções | O que testa | Como abrir |
|---|---|---|
| A–D | Correções do `script.js`, backups e armazenamento | `index.html` direto no navegador |
| E | Uso no celular | DevTools no modo dispositivo |
| F | Instalação, offline e tela acesa | Servidor local (`http://`) ou GitHub Pages, e um celular de verdade |
| G | Rolagem por expressão | `index.html` direto no navegador |

## Preparação

1. Abra o `index.html` direto no navegador (Chrome, Edge ou Firefox). Para a seção F, veja a preparação dela.
2. Abra o DevTools (F12) na aba **Console** e deixe aberto o tempo todo. Não deve aparecer nenhum erro vermelho, **exceto** a linha `Erro ao importar backup: ...` nos testes de arquivo inválido (seção B), que é esperada.
3. Para começar do zero: DevTools → **Application** → Local Storage → apague a chave `chronicles-sheet-state-v1` e recarregue. Deve aparecer o personagem de exemplo, Aelric Vale.

Os arquivos de backup estão em [exemplos-backup/](exemplos-backup/). Para importar, use o botão **Importar Backup**.

## A. Abrir, trocar de tema e exportar

| # | Passo | Resultado esperado |
|---|---|---|
| A1 | Abrir a página | Aelric Vale aparece, sem erros no console |
| A2 | Clicar em **Modo Diário Manuscrito** e depois em **Modo Ficha de Campo** | Os painéis trocam e o visual está igual ao de antes |
| A3 | Clicar em **Exportar Backup** | Baixa `chronicles-sheet-backup-AAAA-MM-DD-HH-MM-SS.json` e a página não muda |
| A4 | Importar o arquivo que acabou de baixar | "Backup importado com sucesso!" e nada muda na ficha |

## B. Importação de backups

| # | Arquivo | Resultado esperado |
|---|---|---|
| B1 | `1-valido-antigo.json` (sem `dataVersion`, atributos `{ forca: 16, ... }`, sem Sanidade/Esforço, Arsenal, Relações ou Perícias) | Sucesso. Mira Antiga, nível 4, HP 18/22. Sanidade 20/20 e Esforço 8/8 cheios. Atributos Força 11, Intelecto 14, Presença 15, Agilidade 17, Vigor 12 (Sabedoria some). Perícias sugeridas e Arsenal vazio. |
| B2 | `2-valido-atual.json` | Sucesso, e a página abre no tema Diário. Teo Atual, 1 arma, a relação "Irmã Clara" com retrato (linha diagonal vermelha) e o atributo Sorte = 1.5 |
| B3 | `3-valido-casos-especiais.json` | Sucesso (é usado nos testes C) |
| B4 | `4-invalido-sem-dados.json` | "Não foi possível importar o backup. O arquivo não contém dados reconhecidos..." e a ficha atual continua igual |
| B5 | `5-invalido-arma-quantidade.json` | "...A quantidade de uma arma deve ser um número inteiro positivo..." e nada muda |
| B6 | `6-invalido-json-quebrado.json` | "...O arquivo está corrompido ou não contém um JSON válido..." e nada muda |

## C. Correções (importe antes o `3-valido-casos-especiais.json`)

| # | Correção | Passo | Resultado esperado |
|---|---|---|---|
| C1 | Números inteiros | Ver a ficha logo após importar | Nível 4 (era 4.4), HP 11/30 (era 10.6/30.4), Flechas x3 (era 2.5) |
| C2 | Números inteiros | Digitar `30.6` no máximo de HP e sair do campo | O campo vira 31 |
| C3 | Intensidade emocional | Tema Diário → entrada "Emboscada" | "Intensidade 3/5" com 3 bolinhas (era 2.5 no arquivo) |
| C4 | Tags sem diferenciar maiúsculas | Tema Diário → filtro de tags | Uma opção só, `#combate`, que mostra "Emboscada" e "Duelo" |
| C5 | Entrada nova com filtro ativo | Com `#combate` selecionado, salvar uma entrada sem tags | O filtro volta para "Todas" e a entrada nova aparece no topo |
| C6 | Atributo com ID especial | Tema Ficha → mudar Sorte para 7 → recarregar | Sorte continua 7 |
| C7 | Perícia mantém dados ocultos | Editar "Luta" → Salvar perícia → Exportar | No JSON, "Luta" ainda tem `"duplicateBonuses": [5]` |
| C8 | Arma sem descrição | Tema Ficha → Arsenal → Editar "Adaga" | O campo Descrição fica vazio (não mostra "undefined") |
| C9 | Descrição ao trocar de tema | Ficha → Editar um item → mudar a descrição → trocar para Diário → Salvar → voltar para Ficha | A descrição nova foi salva |
| C10 | Importar no meio de uma edição | Diário → Editar uma relação → importar `2-valido-atual.json` | O botão volta para "Adicionar relação" e o formulário fica limpo |

## D. Armazenamento e abas

| # | Passo | Resultado esperado |
|---|---|---|
| D1 | Application → Local Storage → mudar o valor de `chronicles-sheet-state-v1` para `{` → recarregar | Aviso "Não foi possível ler os dados salvos..." e aparece Aelric Vale |
| D2 | Esperar o aviso sumir (7 s) e mudar o nome | Aparece "Não foi possível salvar neste navegador..." e o Local Storage continua `{` |
| D3 | Ainda nesse modo: Diário → excluir uma entrada (🗑 → Excluir) | A entrada some da lista (fica só nesta sessão) |
| D4 | Ainda nesse modo: desenhar um retrato numa relação → Salvar desenho | O editor fecha e o retrato aparece na tabela |
| D5 | Importar `2-valido-atual.json` | "Backup importado com sucesso!" e o Local Storage volta a ter os dados (o import resolve o modo só memória) |
| D6 | Abrir o site em duas abas → mudar o nome na aba 1 → olhar a aba 2 | A aba 2 mostra "Os dados foram alterados em outra aba. Recarregue a página..." |

## E. Uso no celular

No DevTools, ligue o **modo dispositivo** (Ctrl+Shift+M) e escolha um celular, ex.: iPhone 12 Pro (390px). Para testar 360px, use "Dimensions: Responsive" com largura 360. Recarregue a página depois de trocar o aparelho.

| # | Passo | Resultado esperado |
|---|---|---|
| E1 | Tema Ficha → rolar até **Perícias** e **Arsenal** | Cada linha é um cartão legível ("Perícia: Acrobacia"…), sem uma letra por linha, e sem rolagem lateral na página |
| E2 | Inspecionar um botão **Remover** de uma perícia | Altura de pelo menos 44px; o 🗑 do diário (tema Diário) tem 44×44 |
| E3 | Tocar em **+1** do HP | O botão não fica "levantado" depois do toque |
| E4 | **Adicionar perícia** | Aparecem caixas Força, Intelecto, Presença…; a dica não fala em "Ctrl/Cmd" |
| E5 | Marcar duas caixas e salvar a perícia | A tabela mostra os dois atributos (ex.: "Força / Vigor") |
| E6 | **Editar** essa perícia | As mesmas caixas já vêm marcadas |
| E7 | Rolar até o fim da página e adicionar um item ao inventário | "Item adicionado ao inventário." aparece colada na base da tela |
| E8 | Escolher um iPhone com notch e girar para paisagem | O conteúdo não fica embaixo do recorte |
| E9 | Tema Diário → lápis de uma relação | O editor de pixel art cabe inteiro na tela |
| E10 | Desligar o modo dispositivo (desktop) | A página está igual à de antes: select múltiplo nas perícias, dica com "Ctrl/Cmd", mensagens no topo |

O teclado certo (numérico no PV, "Buscar" na busca do diário, "OK" nos campos) só dá para conferir num celular de verdade.

## F. Instalação, offline e tela acesa

**Preparação:** o modo offline não funciona abrindo o arquivo direto. Na pasta do projeto, rode `python -m http.server 8000` (ou use o Live Server do VS Code) e abra `http://localhost:8000`. Os passos F7 a F10 são no celular, com o site do GitHub Pages.

| # | Passo | Resultado esperado |
|---|---|---|
| F1 | DevTools → **Application** → **Manifest** | Nome "Chronicles & Sheet", ícones do d20 e nenhum erro de instalação |
| F2 | Recarregar a página uma vez → Application → **Service workers** | `sw.js` aparece como "activated and is running" |
| F3 | Application → **Cache storage** → `chronicles-sheet-v1` | 9 arquivos: a página, `index.html`, `styles.css`, `script.js`, o manifest e os 4 ícones |
| F4 | Mudar o nome do personagem → **Network** → marcar **Offline** → recarregar | A página abre com o visual completo e o nome novo |
| F5 | Desmarcar Offline → mudar um texto no `index.html` → recarregar **uma vez** | A mudança já aparece (não fica presa na versão antiga) |
| F6 | Inspecionar `<meta name="theme-color">` → trocar o tema | O valor muda de `#0f172a` (Ficha) para `#2c1f13` (Diário) |
| F7 | Android/Chrome: menu → "Instalar app". iPhone/Safari: Compartilhar → "Adicionar à Tela de Início" | O ícone do d20 aparece na tela inicial e abre sem a barra de endereço |
| F8 | Com o app instalado aberto uma vez, ligar o **modo avião** e abrir pelo ícone | O site abre com os dados |
| F9 | Colocar o bloqueio automático da tela em 30 s → tocar em **Manter tela acesa** → esperar 1 minuto | O botão mostra "Tela acesa: ligada" e a tela não apaga |
| F10 | Trocar de app e voltar | A tela continua acesa sem tocar no botão de novo |

No iPhone, o app da tela inicial **não vê** os dados do Safari: exporte o backup no Safari e importe no app. Num navegador sem suporte a tela acesa, o botão simplesmente não aparece.

## G. Rolagem por expressão (tema Ficha → Rolador de Dados)

| # | Passo | Resultado esperado |
|---|---|---|
| G1 | **Limpar histórico** → tocar em **d20** | Histórico com "d20" e um número de 1 a 20, como antes |
| G2 | Tocar em **Vantagem** → **d20** | Linha "2d20kh1" com o detalhe "Vantagem: [x, (y)]" (o descartado entre parênteses); o modo volta para **Normal** |
| G3 | **Desvantagem** → digitar `d20+5` → **Rolar** | Linha "2d20kl1+5" com "Desvantagem: [...] + 5"; o total é o menor dado + 5 |
| G4 | Digitar `2d6 + 3` → apertar Enter | Linha "2d6+3", detalhe "[x, y] + 3"; a expressão continua no campo |
| G5 | Digitar `4d6kh3` → Rolar | Quatro dados no detalhe, um entre parênteses; o total soma os 3 maiores |
| G6 | Digitar `d20-30` → Rolar | Total negativo aparece normalmente; "Última rolagem" mostra "d20-30 = …" |
| G7 | Digitar `banana` → Rolar | Mensagem vermelha "Não entendi a expressão "banana"…" e o histórico não muda |
| G8 | Digitar `d20 5` → Rolar | Mesma mensagem de erro (não vira d205) |
| G9 | Digitar `101d6` → Rolar | "Role no máximo 100 dados de uma vez." |
| G10 | **Vantagem** → digitar `2d6` → Rolar | "Vantagem e desvantagem valem para expressões com um dado único, como d20+5." e o modo continua em Vantagem |
| G11 | **Exportar Backup** → Limpar histórico → importar o arquivo | As rolagens voltam com expressão e detalhe |
| G12 | Recarregar a página | O histórico continua igual |
