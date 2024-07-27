

export function NDTranslacao(N, pos) {
    //Gera matrix transalcao de dimencao N
    //pos deve ser array de dimencao 1
    const mat = math.identity(N+1);
    const indice = math.index(math.evaluate('0:n-1', { n:N }), N);
    return mat.subset(indice, pos);
}

export function NDEscala(N, escalar) {
  //Gera matrix escala de dimencao N
  //escalar deve ser escalar kkkk
  const mat = math.multiply(math.identity(N+1), escalar);
  const indice = math.index(N, N);
  return math.subset(mat, indice, 1);
}

function removeColuna(matrix, index) {
    const size = math.size(matrix).valueOf();
    const rows = size[0];
    const cols = size[1];
  
    let newMatrix = [];
  
    for (let row = 0; row < rows; row++) {
      let newRow = [];
      for (let col = 0; col < cols; col++) {
        if (col !== index) {
          newRow.push(matrix.get([row, col]));
        }
      }
      newMatrix.push(newRow);
    }
  
    return newMatrix;
  }

export function VetorOrtogonal(vecs) {
    //Recebe uma matriz N-1xN
    //Retorna um vetor em RN ortogonal as N-1 linhas da matriz.
    //Gera resultado errado se as linhas da matriz forem LD"""
    const size = math.size(vecs).valueOf();
    const rows = size[0];
    const cols = size[1];
    if (cols - rows != 1){
        throw new Error("Matriz deve ser N-1xN, mas eh " + rows + "x" + cols);
    }
    //vecs.size.valueOf()[1]
    let vecOrtogonal = [];
    for (var i = 0; i < cols; i++){
        //console.log(i);//, vecs.get([1, i]));
        //console.log(math.pow(-1, i));
        //console.log("det", math.det(removeColuna(vecs, i)));
        vecOrtogonal.push(math.pow(-1, i) * math.det(removeColuna(vecs, i)))
    }
    return vecOrtogonal;
}

export function matrizRotacaoND(N, x, y, theta){
    const mat = math.identity(N);
    const cos = math.cos(theta);
    const sin = math.sin(theta);
    mat.set([x, x], cos);
    mat.set([y, y], cos);
    mat.set([x, y], sin);
    mat.set([y, x], -sin);
    return mat;
}

export function norm(vec){
    return math.sqrt(vec.map(function(num) { 
        return num * num;
    }).reduce((soma, a) => soma + a, 0));
}

//export NDTranslacao;
