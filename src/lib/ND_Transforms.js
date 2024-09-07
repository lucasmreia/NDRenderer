

function NDTranslacao(N, pos) {
    //Gera matrix transalcao de dimencao N
    //pos deve ser array de dimencao 1
    const mat = math.identity(N+1);
    const indice = math.index(math.evaluate('0:n-1', { n:N }), N);
    return mat.subset(indice, pos);
}

function NDEscala(N, escalar) {
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
  
    let newMatrix = Array(rows);
  
    for (let row = 0; row < rows; row++) {
      let newRow = [];
      for (let col = 0; col < cols; col++) {
        if (col !== index) {
          newRow.push(matrix.get([row, col]));
        }
      }
      newMatrix[row] = newRow;
    }
  
    return newMatrix;
  }

function removeColuna2(matrix, index) {
    const size = math.size(matrix).valueOf();
    const rows = size[0];
    const cols = size[1];

    let indice1 = math.index(math.range(0, rows), math.range(0, index));
    let indice2 = math.index(math.range(0, rows), math.range(index+1, cols));

    //console.log(indice1);
    //console.log(indice2);

    if (index == 0){
        return math.subset(matrix, indice2);
    } else if (index == cols-1){
        return math.subset(matrix, indice1); 
    }
    
    let a = math.subset(matrix, indice1);
    let b = math.subset(matrix, indice2);

    return math.concat(a, b);
}

function VetorOrtogonal(vecs) {
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
    let vecOrtogonal = Array(cols);
    for (var i = 0; i < cols; i++){
        //console.log(i);//, vecs.get([1, i]));
        //console.log(math.pow(-1, i));
        //console.log("det", math.det(removeColuna(vecs, i)));
        //vecOrtogonal.push(math.pow(-1, i) * math.det(removeColuna(vecs, i)))
        vecOrtogonal[i] = ((i%2)*2-1) * math.det(removeColuna2(vecs, i));
    }
    return vecOrtogonal;
}

function inverteLinhasMat(mat, N){
  const indice = math.index(N-1, math.range(0, N));
  let invertida = math.subset(mat, indice);
  for (let i=1; i<N; i++){
    const indice = math.index(N-1-i, math.range(0, N));

    invertida = math.concat(invertida, math.subset(mat, indice), 0);
  }
  return invertida;
}

function matrizRotacaoND(N, x, y, theta){
    const mat = math.identity(N);
    const cos = math.cos(theta);
    const sin = math.sin(theta);
    mat.set([x, x], cos);
    mat.set([y, y], cos);
    mat.set([x, y], sin);
    mat.set([y, x], -sin);
    return mat;
}

function norm(vec){
    return math.sqrt(vec.map(function(num) { 
        return num * num;
    }).reduce((soma, a) => soma + a, 0));
}

//NDTranslacao;
