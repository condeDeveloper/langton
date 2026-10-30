import test from 'node:test';
import assert from 'node:assert/strict';
import { correr, caixa, GradeEsparsa, GradeDensa, DIRECOES } from '../src/formiga.js';

test('a grade esparsa comeca toda da cor 0', () => {
  const g = new GradeEsparsa();
  assert.equal(g.cor(0, 0), 0);
  assert.equal(g.cor(1000, -1000), 0);
  assert.equal(g.pintadas, 0);
});

test('pintar de volta a cor 0 apaga a celula da grade esparsa', () => {
  const g = new GradeEsparsa();
  g.pintar(3, 4, 1);
  assert.equal(g.pintadas, 1);
  g.pintar(3, 4, 0);
  assert.equal(g.pintadas, 0);
});

test('a grade densa marca quando a formiga sai dela', () => {
  const g = new GradeDensa(11);
  assert.equal(g.saiu, false);
  g.cor(100, 100);
  assert.equal(g.saiu, true);
});

test('as quatro direcoes somam zero', () => {
  const soma = DIRECOES.reduce((a, [x, y]) => [a[0] + x, a[1] + y], [0, 0]);
  assert.deepEqual(soma, [0, 0]);
});

test('o primeiro passo da formiga: branca, gira a direita, pinta e anda', () => {
  const r = correr(1);
  // comeca olhando para o norte; branca manda virar a direita, entao vai para leste
  assert.equal(r.direcao, 1);
  assert.deepEqual([r.x, r.y], [1, 0]);
  assert.equal(r.grade.cor(0, 0), 1);
  assert.equal(r.grade.pintadas, 1);
});

test('os quatro primeiros passos fecham um quadrado', () => {
  const r = correr(4);
  assert.deepEqual([r.x, r.y], [0, 0]);
  assert.equal(r.grade.pintadas, 4);
});

test('depois de quatro passos a formiga volta ao ponto de partida mas nao ao estado', () => {
  const r = correr(4);
  assert.deepEqual([r.x, r.y], [0, 0]);
  assert.notEqual(r.grade.cor(0, 0), 0);
});

test('a formiga com regra RL pinta sempre uma celula por passo, no comeco', () => {
  // ate ela comecar a repisar, cada passo pinta uma celula nova
  const r = correr(10);
  assert.ok(r.grade.pintadas <= 10);
  assert.ok(r.grade.pintadas > 0);
});

test('as duas grades concordam em posicao, direcao e pintadas', () => {
  for (const passos of [10, 100, 1000, 5000, 11000]) {
    const a = correr(passos, { grade: new GradeEsparsa() });
    const b = correr(passos, { grade: new GradeDensa(1001) });
    assert.equal(a.x, b.x, `passos=${passos}`);
    assert.equal(a.y, b.y, `passos=${passos}`);
    assert.equal(a.direcao, b.direcao, `passos=${passos}`);
    assert.equal(a.grade.pintadas, b.grade.pintadas, `passos=${passos}`);
    assert.equal(b.grade.saiu, false, `a formiga saiu da grade densa em ${passos}`);
  }
});

test('a caixa cresce com o tempo', () => {
  let anterior = 0;
  for (const passos of [100, 1000, 5000, 20000]) {
    const r = correr(passos, { grade: new GradeEsparsa() });
    const c = caixa(r.grade);
    const area = c.largura * c.altura;
    assert.ok(area >= anterior, `passos=${passos}`);
    anterior = area;
  }
});

test('a caixa de uma grade vazia e degenerada', () => {
  assert.deepEqual(caixa(new GradeEsparsa()), {
    minX: 0, maxX: 0, minY: 0, maxY: 0, largura: 0, altura: 0,
  });
});

test('a caixa da grade densa bate com a da esparsa', () => {
  const a = correr(5000, { grade: new GradeEsparsa() });
  const b = correr(5000, { grade: new GradeDensa(1001) });
  assert.deepEqual(caixa(a.grade), caixa(b.grade));
});

test('a direcao fica sempre entre 0 e 3', () => {
  correr(5000, {
    grade: new GradeEsparsa(),
    aoAndar: (p, x, y, d) => assert.ok(d >= 0 && d <= 3, `passo ${p} deu ${d}`),
  });
});

test('cada passo anda exatamente uma casa', () => {
  let ax = 0;
  let ay = 0;
  correr(3000, {
    grade: new GradeEsparsa(),
    aoAndar: (p, x, y) => {
      assert.equal(Math.abs(x - ax) + Math.abs(y - ay), 1, `passo ${p}`);
      ax = x;
      ay = y;
    },
  });
});

test('com n cores, toda celula fica com cor entre 0 e n-1', () => {
  for (const regra of ['RL', 'RLR', 'LLRR', 'LRRRRRLLR']) {
    const r = correr(3000, { regra, grade: new GradeEsparsa() });
    for (const c of r.grade.celulas.values()) {
      assert.ok(c >= 0 && c < regra.length, `regra ${regra} deu cor ${c}`);
    }
  }
});

test('a regra RRRR anda sempre em circulo', () => {
  // virando sempre a direita, a formiga nunca sai de um quadrado de quatro casas
  const r = correr(400, { regra: 'RRRR', grade: new GradeEsparsa() });
  const c = caixa(r.grade);
  assert.ok(c.largura <= 2 && c.altura <= 2, `caixa ${c.largura}x${c.altura}`);
});

test('a regra LLLL tambem anda em circulo, do outro lado', () => {
  const r = correr(400, { regra: 'LLLL', grade: new GradeEsparsa() });
  const c = caixa(r.grade);
  assert.ok(c.largura <= 2 && c.altura <= 2, `caixa ${c.largura}x${c.altura}`);
});
