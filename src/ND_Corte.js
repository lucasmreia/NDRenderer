import ND_Object from './ND_Object.js';


export default class ND_Corte{
    constructor(NDObj){
        this.NDObj = NDObj

        this.NDObj = NDObj.Ndim

        this.verticesObj = NDObj.geometry.vertices;
        this.arestasObj = NDObj.geometry.faces[0];
        this.facesObj = NDObj.geometry.faces[1];
        this.localDoCorte = 0;
    }

    corta_ultima_coord(){
        let novosVertices = new Map();//chaves são os indices das arestas e valores são a posição do vertice no meio da aresta
        for (const [i, aresta] of this.arestasObj.entries()){
            if ((vertices[aresta[0]][0] - this.localDoCorte) * (vertices[aresta[1]][0] - this.localDoCorte) < 0){
                let valInterpol = (vertices[aresta[0]][0] - this.localDoCorte)/(vertices[aresta[0]][0] - vertices[aresta[1]][0])
                let novoVertice = math.multiply(math.add(vertices[aresta[0]], math.subtract(vertices[aresta[1]], vetice[aresta[0]])), valInterpol);
                novosVertices.set(i, novoVertice);
            }
        }

        for (const faces of this.facesObj){
            
        }
    }
}