// Os numeros que aparecem no README, presos aqui. Todos sairam de
// `node ferramentas/medidor.js`; nenhum foi digitado de cabeca.

import test from 'node:test';
import assert from 'node:assert/strict';
import { medirRegra, compararGrades, mesmaFormiga, REGRAS, PASSOS_RODOVIA, PASSOS_OUTRAS } from '../ferramentas/medidor.js';
import { acharRodovia, distancia, ehDiagonal } from '../src/rodovia.js';

test('tabela 1: as duas grades concordam em todos os pontos medidos', () => {
  for (const p of [1000, 5000, 11000]) {
    const r = compararGrades(p);
    assert.equal(r.posicaoIgual, true, `passos=${p}`);
    assert.equal(r.direcaoIgual, true, `passos=${p}`);
    assert.equal(r.pintadasIguais, true, `passos=${p}`);
    assert.equal(r.saiuDaGradeDensa, false, `passos=${p}`);
  }
});

test('tabela 2: a rodovia tem periodo 104', () => {
  assert.equal(acharRodovia(PASSOS_RODOVIA, { regra: 'RL' }).periodo, 104);
});

test('tabela 2: a rodovia comeca no passo 10.081', () => {
  assert.equal(acharRodovia(PASSOS_RODOVIA, { regra: 'RL' }).inicio, 10081);
});

test('tabela 2: cada periodo desloca a formiga em [-2, 2]', () => {
  const r = acharRodovia(PASSOS_RODOVIA, { regra: 'RL' });
  assert.deepEqual(r.deslocamento, [-2, 2]);
  assert.equal(distancia(r.deslocamento), 4);
  assert.equal(ehDiagonal(r.deslocamento), true);
});

const continuacao = { 15000: 47, 20000: 95, 50000: 383, 100000: 864 };

for (const passos of Object.keys(continuacao).map(Number)) {
  test(`tabela 3: em ${passos} passos a rodovia esta confirmada ${continuacao[passos]} vezes`, () => {
    const r = acharRodovia(passos, { regra: 'RL' });
    assert.equal(r.periodo, 104);
    assert.equal(r.inicio, 10081);
    assert.equal(r.repeticoes, continuacao[passos]);
  });
}

test('tabela 3: o periodo e o inicio nao mudam por mais que se simule', () => {
  const inicios = Object.keys(continuacao).map((p) => acharRodovia(Number(p), { regra: 'RL' }).inicio);
  assert.deepEqual(new Set(inicios), new Set([10081]));
});

const outras = {
  RL: { cores: 2, rodovia: 104, caixa: '241x211', pintadas: 1872 },
  RLR: { cores: 3, rodovia: null, caixa: '135x102', pintadas: 5932 },
  LLRR: { cores: 4, rodovia: null, caixa: '51x62', pintadas: 1749 },
  RRLL: { cores: 4, rodovia: null, caixa: '51x62', pintadas: 1749 },
  RLLR: { cores: 4, rodovia: null, caixa: '96x106', pintadas: 7430 },
  LRRRRRLLR: { cores: 9, rodovia: null, caixa: '180x180', pintadas: 31461 },
  RRLRLLLLRL: { cores: 10, rodovia: null, caixa: '90x94', pintadas: 7755 },
  LLRRRLRLRLLR: { cores: 12, rodovia: null, caixa: '1443x44', pintadas: 19323 },
};

for (const regra of REGRAS) {
  const esperado = outras[regra];
  test(`tabela 4: ${regra} tem ${esperado.cores} cores e caixa ${esperado.caixa}`, () => {
    const m = medirRegra(regra, regra === 'RL' ? PASSOS_RODOVIA : PASSOS_OUTRAS);
    assert.equal(regra.length, esperado.cores);
    assert.equal(`${m.caixa.largura}x${m.caixa.altura}`, esperado.caixa);
    assert.equal(m.pintadas, esperado.pintadas);
  });

  test(`tabela 4: ${regra} ${esperado.rodovia ? 'faz' : 'nao faz'} rodovia`, () => {
    const m = medirRegra(regra, regra === 'RL' ? PASSOS_RODOVIA : PASSOS_OUTRAS);
    if (esperado.rodovia === null) assert.equal(m.rodovia, null);
    else assert.equal(m.rodovia.periodo, esperado.rodovia);
  });
}

test('tabela 4: de oito regras, so uma constroi rodovia', () => {
  const comRodovia = REGRAS.filter((regra) => medirRegra(regra, regra === 'RL' ? PASSOS_RODOVIA : PASSOS_OUTRAS).rodovia);
  assert.deepEqual(comRodovia, ['RL']);
});

test('tabela 4: RRLL e LLRR sao imagens espelhadas uma da outra', () => {
  // mesmas medidas, mesma quantidade de celulas, mas a caixa esta refletida:
  // trocar todo R por L espelha o desenho inteiro no eixo x
  const a = medirRegra('RRLL', PASSOS_OUTRAS);
  const b = medirRegra('LLRR', PASSOS_OUTRAS);
  assert.equal(a.pintadas, b.pintadas);
  assert.equal(a.caixa.largura, b.caixa.largura);
  assert.equal(a.caixa.altura, b.caixa.altura);
  assert.equal(a.caixa.minY, b.caixa.minY);
  assert.equal(a.caixa.maxY, b.caixa.maxY);
  // o eixo x e que vira do avesso
  assert.equal(a.caixa.minX, -b.caixa.maxX);
  assert.equal(a.caixa.maxX, -b.caixa.minX);
});

test('tabela 4: LLRRRLRLRLLR cresce num corredor, nao num borrao', () => {
  const m = medirRegra('LLRRRLRLRLLR', PASSOS_OUTRAS);
  assert.equal(m.caixa.largura, 1443);
  assert.equal(m.caixa.altura, 44);
  assert.ok(m.caixa.largura / m.caixa.altura > 30, 'a caixa deveria ser muito mais larga que alta');
});

test('tabela 5: RL, RLRL e RLRLRL sao a mesma formiga', () => {
  assert.equal(mesmaFormiga('RL', 'RLRL', 3000), true);
  assert.equal(mesmaFormiga('RL', 'RLRLRL', 3000), true);
  assert.equal(mesmaFormiga('LR', 'LRLR', 3000), true);
});

test('tabela 5: RL e LR NAO sao a mesma formiga', () => {
  assert.equal(mesmaFormiga('RL', 'LR', 3000), false);
});

test('tabela 5: RRLL e LLRR nao sao a mesma formiga, apesar do mesmo tamanho', () => {
  assert.equal(mesmaFormiga('RRLL', 'LLRR', 3000), false);
});

const densidade = {
  1000: { caixa: '20x16', pintadas: 118 },
  5000: { caixa: '31x29', pintadas: 344 },
  10000: { caixa: '49x45', pintadas: 720 },
  15000: { caixa: '145x115', pintadas: 1298 },
  20000: { caixa: '241x211', pintadas: 1872 },
};

for (const passos of Object.keys(densidade).map(Number)) {
  test(`tabela 6: em ${passos} passos a caixa e ${densidade[passos].caixa}`, () => {
    const m = medirRegra('RL', passos);
    assert.equal(`${m.caixa.largura}x${m.caixa.altura}`, densidade[passos].caixa);
    assert.equal(m.pintadas, densidade[passos].pintadas);
  });
}

test('tabela 6: a densidade despenca quando a rodovia comeca', () => {
  const antes = medirRegra('RL', 10000);
  const depois = medirRegra('RL', 20000);
  const fatia = (m) => (100 * m.pintadas) / (m.caixa.largura * m.caixa.altura);
  assert.ok(fatia(antes) > 32 && fatia(antes) < 33, `antes: ${fatia(antes)}%`);
  assert.ok(fatia(depois) > 3.6 && fatia(depois) < 3.8, `depois: ${fatia(depois)}%`);
  assert.ok(fatia(antes) / fatia(depois) > 8);
});

test('tabela 6: a caixa quase quintuplica entre o passo 10.000 e o 20.000', () => {
  const antes = medirRegra('RL', 10000);
  const depois = medirRegra('RL', 20000);
  assert.equal(depois.caixa.largura / antes.caixa.largura > 4.8, true);
});
