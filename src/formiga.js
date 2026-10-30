// A formiga de Langton (1986). Uma formiga numa grade infinita de celulas
// brancas e pretas:
//
//   celula branca -> gira 90 graus a DIREITA, pinta de preto, anda uma casa
//   celula preta  -> gira 90 graus a ESQUERDA, pinta de branco, anda uma casa
//
// Isso e tudo. Nao ha aleatoriedade, nao ha memoria, nao ha objetivo. Durante uns
// dez mil passos o desenho parece ruido; depois a formiga comeca a construir uma
// estrada diagonal e nunca mais para. Ninguem sabe provar por que.
//
// A regra geral troca "branca/preta" por uma string de L e R: a cor k manda virar
// para o lado que a letra k indicar, e a celula passa para a cor k+1.

export const DIRECOES = [
  [0, -1], // norte
  [1, 0], // leste
  [0, 1], // sul
  [-1, 0], // oeste
];

/** Grade esparsa: so guarda as celulas que deixaram de ser cor 0. */
export class GradeEsparsa {
  constructor() {
    this.celulas = new Map();
  }

  chave(x, y) {
    return `${x},${y}`;
  }

  cor(x, y) {
    return this.celulas.get(this.chave(x, y)) ?? 0;
  }

  pintar(x, y, c) {
    if (c === 0) this.celulas.delete(this.chave(x, y));
    else this.celulas.set(this.chave(x, y), c);
  }

  get pintadas() {
    return this.celulas.size;
  }
}

/** Grade densa: um vetor de lado fixo, com a origem no meio. */
export class GradeDensa {
  constructor(lado) {
    this.lado = lado;
    this.meio = Math.floor(lado / 2);
    this.dados = new Uint8Array(lado * lado);
    this.saiu = false;
  }

  indice(x, y) {
    const i = x + this.meio;
    const j = y + this.meio;
    if (i < 0 || j < 0 || i >= this.lado || j >= this.lado) {
      this.saiu = true;
      return -1;
    }
    return j * this.lado + i;
  }

  cor(x, y) {
    const i = this.indice(x, y);
    return i < 0 ? 0 : this.dados[i];
  }

  pintar(x, y, c) {
    const i = this.indice(x, y);
    if (i >= 0) this.dados[i] = c;
  }

  get pintadas() {
    let n = 0;
    for (const c of this.dados) if (c !== 0) n++;
    return n;
  }
}

/**
 * Roda a formiga por `passos` movimentos.
 * @param {number} passos
 * @param {{regra?: string, grade?: object, aoAndar?: Function}} opcoes
 * @returns {{x: number, y: number, direcao: number, grade: object, caminho: object[]}}
 */
export function correr(passos, opcoes = {}) {
  const regra = opcoes.regra ?? 'RL';
  const grade = opcoes.grade ?? new GradeEsparsa();
  const cores = regra.length;

  let x = 0;
  let y = 0;
  let direcao = 0;

  for (let passo = 1; passo <= passos; passo++) {
    const c = grade.cor(x, y);
    // a letra manda o lado: R soma 1 a direcao, L tira 1
    direcao = regra[c] === 'R' ? (direcao + 1) % 4 : (direcao + 3) % 4;
    grade.pintar(x, y, (c + 1) % cores);
    x += DIRECOES[direcao][0];
    y += DIRECOES[direcao][1];
    if (opcoes.aoAndar) opcoes.aoAndar(passo, x, y, direcao, grade);
  }

  return { x, y, direcao, grade };
}

/** A caixa que contem todas as celulas pintadas. */
export function caixa(grade) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  if (grade instanceof GradeEsparsa) {
    for (const chave of grade.celulas.keys()) {
      const [x, y] = chave.split(',').map(Number);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  } else {
    for (let j = 0; j < grade.lado; j++) {
      for (let i = 0; i < grade.lado; i++) {
        if (grade.dados[j * grade.lado + i] === 0) continue;
        const x = i - grade.meio;
        const y = j - grade.meio;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (minX === Infinity) return { minX: 0, maxX: 0, minY: 0, maxY: 0, largura: 0, altura: 0 };
  return { minX, maxX, minY, maxY, largura: maxX - minX + 1, altura: maxY - minY + 1 };
}
