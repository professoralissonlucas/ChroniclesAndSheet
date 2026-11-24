# Testes manuais — Chronicles & Sheet

Roteiro para conferir no navegador as correções feitas no `script.js`. Leva uns 15 minutos.

## Preparação

1. Abra o `index.html` direto no navegador (Chrome, Edge ou Firefox).
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
