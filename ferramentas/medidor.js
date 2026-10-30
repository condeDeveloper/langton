#!/usr/bin/env node
// O medidor: roda as varreduras e imprime as tabelas que vao para o README.
// Nenhum numero do README e digitado a mao; todos saem daqui.

import { correr, caixa, GradeEsparsa, GradeDensa } from '../src/formiga.js';
import { acharRodovia, distancia, ehDiagonal } from '../src/rodovia.js';

const br = (x) => x.toLocaleString('pt-BR');

export const REGRAS = ['RL', 'RLR', 'LLRR', 'RRLL', 'RLLR', 'LRRRRRLLR', 'RRLRLLLLRL', 'LLRRRLRLRLLR'];
export const PASSOS_RODOVIA = 20000;
export const PASSOS_OUTRAS = 200000;

const guardado = new Map();

export function medirRegra(regra, passos) {
  const chave = `${regra}:${passos}`;
  if (guardado.has(chave)) return guardado.get(chave);
  const r = correr(passos, { regra, grade: new GradeEsparsa() });
  const c = caixa(r.grade);
  const rodovia = acharRodovia(passos, { regra });
  const resultado = { regra, passos, pintadas: r.grade.pintadas, caixa: c, rodovia, fim: r };
  guardado.set(chave, resultado);
  return resultado;
}

/** Roda a mesma regra nas duas grades e compara tudo o que da para comparar. */
export function compararGrades(passos, regra = 'RL', lado = 1001) {
  const esparsa = correr(passos, { regra, grade: new GradeEsparsa() });
  const densa = correr(passos, { regra, grade: new GradeDensa(lado) });
  return {
    passos,
    posicaoIgual: esparsa.x === densa.x && esparsa.y === densa.y,
    direcaoIgual: esparsa.direcao === densa.direcao,
    pintadasIguais: esparsa.grade.pintadas === densa.grade.pintadas,
    pintadas: esparsa.grade.pintadas,
    saiuDaGradeDensa: densa.grade.saiu,
  };
}

/** Compara passo a passo duas regras, para ver se sao a mesma formiga. */
export function mesmaFormiga(regraA, regraB, passos) {
  const a = [];
  const b = [];
  correr(passos, { regra: regraA, grade: new GradeEsparsa(), aoAndar: (p, x, y, d) => a.push(`${x},${y},${d}`) });
  correr(passos, { regra: regraB, grade: new GradeEsparsa(), aoAndar: (p, x, y, d) => b.push(`${x},${y},${d}`) });
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function imprimir() {
  console.log('\n== Tabela 1: as duas grades concordam? ==');
  console.log('  Uma guarda so as celulas pintadas num Map; a outra e um vetor fixo.');
  console.log('  passos | posicao | direcao | pintadas | quantas pintadas');
  for (const p of [1000, 5000, 11000]) {
    const r = compararGrades(p);
    console.log(
      `  ${br(p).padStart(6)} | ${(r.posicaoIgual ? 'igual' : 'DIFERE').padEnd(7)} | ${(r.direcaoIgual ? 'igual' : 'DIFERE').padEnd(7) } | ${(r.pintadasIguais ? 'igual' : 'DIFERE').padEnd(8)} | ${br(r.pintadas)}`
    );
    if (!r.posicaoIgual || !r.direcaoIgual || !r.pintadasIguais) {
      console.error('AS DUAS GRADES DIVERGEM');
      process.exit(1);
    }
  }

  console.log('\n== Tabela 2: a rodovia, achada sem saber que existe ==');
  {
    const r = acharRodovia(PASSOS_RODOVIA, { regra: 'RL' });
    if (!r) {
      console.error('A RODOVIA NAO FOI ACHADA');
      process.exit(1);
    }
    console.log(`  periodo .................. ${r.periodo} passos`);
    console.log(`  comeca no passo .......... ${br(r.inicio)}`);
    console.log(`  deslocamento por periodo . [${r.deslocamento}]`);
    console.log(`  distancia por periodo .... ${distancia(r.deslocamento)} celulas`);
    console.log(`  e diagonal? .............. ${ehDiagonal(r.deslocamento) ? 'sim' : 'nao'}`);
    console.log(`  repeticoes confirmadas ... ${r.repeticoes}`);
  }

  console.log('\n== Tabela 3: a rodovia continua? ==');
  console.log('  passos simulados | periodo | inicio | repeticoes confirmadas');
  for (const p of [15000, 20000, 50000, 100000]) {
    const r = acharRodovia(p, { regra: 'RL' });
    console.log(
      `  ${br(p).padStart(16)} | ${String(r.periodo).padStart(7)} | ${br(r.inicio).padStart(6)} | ${br(r.repeticoes)}`
    );
    if (r.periodo !== 104 || r.inicio !== 10081) {
      console.error('A RODOVIA MUDOU DE PERIODO OU DE INICIO');
      process.exit(1);
    }
  }

  console.log('\n== Tabela 4: outras regras tambem fazem rodovia? ==');
  console.log(`  Cada uma simulada por ${br(PASSOS_OUTRAS)} passos.`);
  console.log('  regra        | cores | rodovia | caixa final | celulas pintadas');
  for (const regra of REGRAS) {
    const passos = regra === 'RL' ? PASSOS_RODOVIA : PASSOS_OUTRAS;
    const m = medirRegra(regra, passos);
    const texto = m.rodovia ? `periodo ${m.rodovia.periodo}` : 'nenhuma';
    console.log(
      `  ${regra.padEnd(12)} | ${String(regra.length).padStart(5)} | ${texto.padEnd(11)} | ${(m.caixa.largura + 'x' + m.caixa.altura).padStart(11)} | ${br(m.pintadas)}`
    );
  }

  console.log('\n== Tabela 5: regras diferentes, formiga identica ==');
  console.log('  O que manda nao e a cor, e a ordem dos giros numa mesma celula.');
  console.log('  par de regras        | identicas em 3.000 passos');
  for (const [a, b] of [['RL', 'RLRL'], ['RL', 'RLRLRL'], ['LR', 'LRLR'], ['RL', 'LR'], ['RRLL', 'LLRR']]) {
    const iguais = mesmaFormiga(a, b, 3000);
    console.log(`  ${(a + ' x ' + b).padEnd(20)} | ${iguais ? 'sim' : 'nao'}`);
  }

  console.log('\n== Tabela 6: o tamanho da bagunca antes e depois da rodovia ==');
  console.log('  passos | caixa | celulas pintadas | fatia da caixa pintada');
  for (const p of [1000, 5000, 10000, 10081, 15000, 20000]) {
    const m = medirRegra('RL', p);
    const area = m.caixa.largura * m.caixa.altura;
    console.log(
      `  ${br(p).padStart(6)} | ${(m.caixa.largura + 'x' + m.caixa.altura).padStart(9)} | ${br(m.pintadas).padStart(16)} | ${((100 * m.pintadas) / area).toFixed(1)}%`
    );
  }

  console.log('\n== Fechamento ==');
  const r = acharRodovia(PASSOS_RODOVIA, { regra: 'RL' });
  const comRodovia = REGRAS.filter((regra) => medirRegra(regra, regra === 'RL' ? PASSOS_RODOVIA : PASSOS_OUTRAS).rodovia);
  console.log(`  regras testadas .................. ${REGRAS.length}`);
  console.log(`  regras que constroem rodovia ..... ${comRodovia.length} (${comRodovia.join(', ')})`);
  console.log(`  periodo da rodovia de RL ......... ${r.periodo}`);
  console.log(`  passo em que ela comeca .......... ${br(r.inicio)}`);
  console.log('');
}

if (process.argv[1]?.endsWith('medidor.js')) imprimir();
