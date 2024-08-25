import ND_Object from './ND_Object.js';

class ArrayKeyedMap extends Map {
    //Classe facilita utilizar listas como chaves de dicionarios
    get(array) {
      return super.get(this.#toKey(array));
    }
    
    set(array, value) {
      return super.set(this.#toKey(array), value);
    }
    
    has(array) {
      return super.has(this.#toKey(array));
    }
    
    delete(array) {
      return super.delete(this.#toKey(array));
    }
    
    #toKey(array) {
      return JSON.stringify(array);
    }
  }

export default class ND_Corte{
    constructor(NDObj){
        this.NDObj = NDObj;

        this.dimN = NDObj.dimN;

        this.verticesObj = NDObj.geometria.vertices;
        this.arestasObj = NDObj.geometria.faces[0];
        this.nmkfaces = NDObj.geometria.faces;
        this.facesObj = NDObj.geometria.faces[1];
        this.localDoCorte = 0;
    }

    corta_ultima_coord(){
        let novosVertices = new Map();//chaves são os indices das arestas e valores são a posição do vertice no meio da aresta
        for (const [i, aresta] of this.arestasObj.entries()){
            const vertA = this.verticesObj[aresta[0]];
            const vertB = this.verticesObj[aresta[1]];
            if ((vertA[this.dimN-1] - this.localDoCorte) * (vertB[this.dimN-1] - this.localDoCorte) < 0){
                let valInterpol = (vertA[this.dimN-1] - this.localDoCorte)/(vertA[this.dimN-1] - vertB[this.dimN-1])
                let novoVertice = math.add(vertA, math.multiply(math.subtract(vertB, vertA), valInterpol));
                novosVertices.set(i, novoVertice);
            }
        }
        console.log(novosVertices.size);
        console.log(novosVertices);

        let nmknovasFaces = [];
        let nmkfacesCortadas = [novosVertices, new Set()];
        for (const [j, jfaces] of this.nmkfacesObj){
            let novasFaces = [];
            for (const [i, face] of this.facesObj.entries()){
                let novaAresta = [];
                for (const aresta of face){
                    //console.log(aresta);
                    //console.log(novosVertices.has(aresta));
                    if (nmkfacesCortadas[j].has(aresta)){
                        novaAresta.push(aresta);
                    }
                    //console.log(novaAresta);
                }
                //console.log(novaAresta.length==2);
                //console.log(novasfaces);
                if (novaAresta.length==2) {
                    novasfaces.push(novaAresta);
                    nmkfacesCortadas[0].add(i);
                }
                //console.log(novasfaces);
                if (novaAresta.length>2 || novaAresta.length==1){
                    console.log("Deu Errado!");
                    console.log(novaAresta.length);
                }
            }
            nmknovasFaces.push(novasFaces);
            console.log(nmkfacesCortadas[0]);
        }
        
        let novasfaces = [];
        let facesCortadas = new Set();
        for (const [j, jfaces] of this.nmkfacesObj){
            for (const [i, face] of jfaces.entries()){
                let novaFacejm1 = [];//Face de dimensao j-1
                for (const aresta of face){
                    //console.log(aresta);
                    //console.log(novosVertices.has(aresta));
                    if (novosVertices.has(aresta)){
                        novaFacejm1.push(aresta);
                    }
                    //console.log(novaFacejm1);
                }
                //console.log(novaFacejm1.length==2);
                //console.log(novasfaces);
                if (j==0){
                    console.assert(novaFacejm1.legth==2);
                }
                if (novaFacejm1.length!=0) {
                    novasfaces.push(novaFacejm1);
                    facesCortadas.add(i);
                }
                //console.log(novasfaces);
                if (novaFacejm1.length>2 || novaFacejm1.length==1){
                    console.log("Deu Errado!");
                    console.log(novaFacejm1.length);
                }
            }
            console.log(facesCortadas);
        }
        
    }

    encontra_faces_cortadas(){

    }
}