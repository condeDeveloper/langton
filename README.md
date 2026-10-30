# A formiga de Langton: a rodovia que ninguém sabe explicar

Uma formiga numa grade infinita. A regra inteira:

```
célula branca -> gira 90° à direita, pinta de preto, anda uma casa
célula preta  -> gira 90° à esquerda, pinta de branco, anda uma casa
```

Não há acaso, não há memória, não há objetivo. Por cerca de dez mil passos o
desenho parece ruído. Então, do nada, a formiga começa a construir uma estrada
diagonal e nunca mais para. **Ninguém sabe provar por quê.**

Este repositório acha a rodovia **sem saber que ela existe** — por detecção de
período no rastro, sem nenhum número conhecido no código — e mede o que acontece
com outras regras. Node puro, sem dependência nenhuma.

## Os quatro achados

1. **A rodovia tem período 104 e começa no passo 10.081.** Os dois números saíram
   da detecção, não de um livro: o programa procura o menor período cujo
   deslocamento se repita, e acha esse. Em 100.000 passos ele está confirmado 864
   vezes seguidas, sempre deslocando a formiga em `[-2, +2]`.
2. **De oito regras testadas, só `RL` constrói rodovia.** As outras sete rodam
   200.000 passos sem nunca entrar em regime periódico — incluindo `RLR`, `LLRR` e
   `LRRRRRLLR`.
3. **Regras diferentes podem ser a mesma formiga.** `RL`, `RLRL` e `RLRLRL` dão
   trajetórias idênticas passo a passo, porque o que manda não é a cor da célula e
   sim a ordem dos giros a cada visita. Já `RL` e `LR` são formigas diferentes, e
   `RRLL` e `LLRR` são imagens espelhadas uma da outra.
4. **A assinatura da rodovia é a densidade despencando.** Até o passo 10.000 a
   formiga preenche 32,7% da própria caixa; no passo 20.000, já na estrada,
   preenche 3,7%. Ela deixa de ser um borrão e vira um fio.

## As tabelas

Tudo abaixo sai de `node ferramentas/medidor.js`, e está preso em
`testes/medidas.test.js`.

### A rodovia, achada sem saber que existe

| | |
|---|---|
| período | **104 passos** |
| começa no passo | **10.081** |
| deslocamento por período | `[-2, +2]` |
| distância por período | 4 células |
| é diagonal? | sim |

### A rodovia continua?

| passos simulados | período | início | repetições confirmadas |
|---|---|---|---|
| 15.000 | 104 | 10.081 | 47 |
| 20.000 | 104 | 10.081 | 95 |
| 50.000 | 104 | 10.081 | 383 |
| 100.000 | 104 | 10.081 | **864** |

O período e o ponto de partida não mudam por mais que se simule.

### Outras regras também fazem rodovia?

Cada uma simulada por 200.000 passos.

| regra | cores | rodovia | caixa final | células pintadas |
|---|---|---|---|---|
| RL | 2 | **período 104** | 241x211 | 1.872 |
| RLR | 3 | nenhuma | 135x102 | 5.932 |
| LLRR | 4 | nenhuma | 51x62 | 1.749 |
| RRLL | 4 | nenhuma | 51x62 | 1.749 |
| RLLR | 4 | nenhuma | 96x106 | 7.430 |
| LRRRRRLLR | 9 | nenhuma | 180x180 | 31.461 |
| RRLRLLLLRL | 10 | nenhuma | 90x94 | 7.755 |
| LLRRRLRLRLLR | 12 | nenhuma | **1443x44** | 19.323 |

A última não faz rodovia periódica, mas também não faz borrão: cresce num
corredor **33 vezes mais largo que alto**.

### Regras diferentes, formiga idêntica

| par de regras | idênticas em 3.000 passos |
|---|---|
| RL x RLRL | **sim** |
| RL x RLRLRL | **sim** |
| LR x LRLR | **sim** |
| RL x LR | não |
| RRLL x LLRR | não (espelhadas) |

### O tamanho da bagunça, antes e depois da rodovia

| passos | caixa | células pintadas | fatia da caixa pintada |
|---|---|---|---|
| 1.000 | 20x16 | 118 | 36,9% |
| 5.000 | 31x29 | 344 | 38,3% |
| 10.000 | 49x45 | 720 | 32,7% |
| **10.081** | 49x45 | 727 | 33,0% |
| 15.000 | 145x115 | 1.298 | 7,8% |
| 20.000 | 241x211 | 1.872 | **3,7%** |

## O que as medidas me corrigiram

- **A primeira detecção de período encontrou uma rodovia que não existia.** Eu
  exigia que o deslocamento se repetisse cinco vezes, e para um período de 4
  passos isso olha **20 passos** — 20 passos parecidos acontecem o tempo todo no
  meio do caos. A regra `RRLLLRLLLRRR` apareceu com "rodovia de período 4". Passei
  a exigir 20 repetições **e** pelo menos 2.000 passos confirmados, e o falso
  positivo sumiu: sobrou só o `RL`.
- **Escrevi que `RRLL` e `LLRR` crescem igual, e o teste me mostrou a diferença.**
  As dimensões batem (51x62) e o número de células também (1.749), mas a caixa
  está refletida: uma vai de −18 a 32 no eixo x, a outra de −32 a 18. Trocar todo
  `R` por `L` espelha o desenho inteiro. "Mesmo tamanho" não é "mesma coisa", e o
  `deepEqual` foi mais cuidadoso do que eu.
- **Esperava que mais cores dessem desenhos maiores.** Não dão. A regra de 12
  cores faz uma caixa de 1443x44 e a de 9 cores faz 180x180; a de 4 cores `LLRR`
  faz 51x62, menor que a de 2 cores depois da rodovia. O que decide o tamanho é a
  estrutura da regra, não o número de cores.

## Como está organizado

```
src/formiga.js   a regra, as duas grades e a caixa que contém o desenho
src/rodovia.js   a detecção de período no rastro, sem nenhum número conhecido
ferramentas/medidor.js  roda as simulações e imprime as tabelas acima
testes/          55 testes
```

Uma grade guarda só as células pintadas num `Map`; a outra é um `Uint8Array` fixo
que avisa se a formiga sair dela. As duas concordam em posição, direção e número
de células pintadas em todos os pontos medidos.

## Rodar

```bash
node --test testes/*.test.js   # a bateria inteira
node ferramentas/medidor.js    # recalcula todas as tabelas deste README
```

Sem `npm install`: não há dependência. Precisa de Node 18 ou mais novo.

## Licença

MIT.
