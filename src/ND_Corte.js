import ND_Object from './ND_Object.js';


export default class ND_Corte{
    constructor(NDObj){
        this.NDObj = NDObj;

        this.dimN = NDObj.dimN;

        this.verticesObj = NDObj.geometria.vertices;
        this.arestasObj = NDObj.geometria.faces[0];
        this.nmkfacesObj = NDObj.geometria.faces;
        this.facesObj = NDObj.geometria.faces[1];

        this.minmax = NDObj.coordsMinMax[NDObj.coordsMinMax.length-1];
        this.localDoCorte = (this.minmax.min + this.minmax.max) * 0.5;

        let geometria = this.corta_ultima_coord();
        this.fatiaND = new ND_Object(geometria, this.NDObj.geometria.faces[0].length);

        this.fatiaND.Mesh.visible = false;
    }

    get_fatia(){
        return this.fatiaND;
    }

    corta_ultima_coord(){
        if (this.localDoCorte == this.minmax.min || this.localDoCorte == this.minmax.max) {
            return {
                N: this.dimN,
                K: 0,//this.dimN-nmknovasFaces.length,
                vertices: [],
                faces: [[]]
            }
        }

        let arestasCortadas = new Map();//chaves são os indices das arestas e valores são novo indice
        let novosVertices = [];
        for (const [i, aresta] of this.arestasObj.entries()){
            const vertA = this.verticesObj[aresta[0]];
            const vertB = this.verticesObj[aresta[1]];
            if ((vertA[this.dimN-1] - this.localDoCorte) * (vertB[this.dimN-1] - this.localDoCorte) < 0){
                const valInterpol = (vertA[this.dimN-1] - this.localDoCorte)/(vertA[this.dimN-1] - vertB[this.dimN-1])
                const novoVertice = math.add(vertA, math.multiply(math.subtract(vertB, vertA), valInterpol));
                arestasCortadas.set(i, novosVertices.length);
                novosVertices.push(novoVertice);
            }
        }

        let nmknovasFaces = [];
        let nmkfacesCortadas = [arestasCortadas].concat(
                                Array(this.nmkfacesObj.length-1)
                                .fill(null)
                                .map(() => new Map()));
        for (const [j, jfaces] of this.nmkfacesObj.slice(1).entries()){
            let novasFaces = [];
            for (const [i, face] of jfaces.entries()){
                let novaAresta = [];
                for (const aresta of face){
                    //console.log(aresta);
                    //console.log(arestasCortadas.has(aresta));
                    if (nmkfacesCortadas[j].has(aresta)){
                        novaAresta.push(nmkfacesCortadas[j].get(aresta));
                    }
                    //console.log(novaAresta);
                }
                //console.log(novaAresta.length==2);
                //console.log(novasfaces);
                if (j==0 && novaAresta.length!=0){ 
                    console.assert(novaAresta.length == 2);
                }

                if (j+1<this.nmkfacesObj.length){
                    if (novaAresta.length > 0){
                        nmkfacesCortadas[j+1].set(i, novasFaces.length);
                        novasFaces.push(novaAresta);
                        //console.log(j, novaAresta);
                    }
                }

                //console.log(novasfaces);
                if (j==0 && (novaAresta.length>2 || novaAresta.length==1)){
                    console.log("Deu Errado!");
                    console.log(novaAresta.length);
                }
            }
            nmknovasFaces.push(novasFaces);
            //console.log(nmkfacesCortadas);
        }
        
        let faces = [];
        nmkfacesCortadas.forEach(face => faces.push(Array.from(face, ([name, value]) => (value))));

        //console.log(nmknovasFaces);
        //console.log(nmkfacesCortadas);

        let geometria = {
            N: this.dimN,
            K: 0,//this.dimN-nmknovasFaces.length,
            vertices: novosVertices,
            faces: nmknovasFaces
        }
        //console.log(geometria);
        return geometria;
    };

    corte(){
        const geometria = this.corta_ultima_coord();
        //console.log(geometria);
        this.fatiaND.updateGeometria(geometria);
        //this.fatiaND.updateVertices(Array(geometria.vertices.length).fill([0, 0, 0]));
        //this.fatiaND.updateFaces(geometria.faces);
    }
}