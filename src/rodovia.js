// Achar a RODOVIA sem saber que ela existe.
//
// A ideia: a rodovia e um trecho em que a formiga repete o mesmo gesto, deslocado
// no espaco. Entao basta guardar a posicao e a direcao a cada passo e procurar um
// periodo P tal que, de um certo passo em diante, o deslocamento de P em P passos
// seja sempre o MESMO vetor. Nenhum numero conhecido entra aqui: nem o 104, nem o
// passo em que ela comeca.

import { correr, GradeEsparsa } from './formiga.js';

/**
 * Roda a formiga guardando o rastro e procura o menor periodo que se repete ate
 * o fim do rastro.
 *
 * @param {number} passos quantos passos simular
 * @param {{regra?: string, periodoMax?: number, confirmacoes?: number}} opcoes
 * @returns {{periodo: number, inicio: number, deslocamento: [number, number]}|null}
 */
export function acharRodovia(passos, opcoes = {}) {
  const regra = opcoes.regra ?? 'RL';
  const periodoMax = opcoes.periodoMax ?? 500;
  // Exigir poucas repeticoes aceita coincidencia: um periodo 4 confirmado cinco
  // vezes olha so 20 passos, e 20 passos repetidos acontecem no meio do caos.
  // Alem das repeticoes, o trecho confirmado tem de ser longo em passos.
  const confirmacoes = opcoes.confirmacoes ?? 20;
  const passosMinimos = opcoes.passosMinimos ?? 2000;

  const rastroX = new Int32Array(passos + 1);
  const rastroY = new Int32Array(passos + 1);
  const rastroD = new Uint8Array(passos + 1);
  let i = 0;

  correr(passos, {
    regra,
    grade: new GradeEsparsa(),
    aoAndar: (passo, x, y, direcao) => {
      i = passo;
      rastroX[passo] = x;
      rastroY[passo] = y;
      rastroD[passo] = direcao;
    },
  });
  void i;

  // o fim do rastro e onde a rodovia certamente ja esta andando, se existir
  for (let periodo = 1; periodo <= periodoMax; periodo++) {
    const precisa = periodo * confirmacoes;
    if (precisa >= passos) break;

    const fim = passos;
    const dx = rastroX[fim] - rastroX[fim - periodo];
    const dy = rastroY[fim] - rastroY[fim - periodo];
    if (dx === 0 && dy === 0) continue;

    // confere que esse mesmo deslocamento vale para tras, e acha ate onde
    let p = fim;
    while (
      p - periodo >= 1 &&
      rastroX[p] - rastroX[p - periodo] === dx &&
      rastroY[p] - rastroY[p - periodo] === dy &&
      rastroD[p] === rastroD[p - periodo]
    ) {
      p -= 1;
    }
    const confirmados = fim - p;
    const repeticoes = Math.floor(confirmados / periodo);
    if (repeticoes >= confirmacoes && confirmados >= passosMinimos) {
      return { periodo, inicio: p + 1, deslocamento: [dx, dy], repeticoes };
    }
  }
  return null;
}

/**
 * O deslocamento por periodo, em celulas de distancia. Serve para dizer que a
 * rodovia anda de fato para longe, e nao em circulos.
 */
export function distancia([dx, dy]) {
  return Math.abs(dx) + Math.abs(dy);
}

/** A rodovia e diagonal quando anda nos dois eixos ao mesmo tempo. */
export function ehDiagonal([dx, dy]) {
  return dx !== 0 && dy !== 0;
}
