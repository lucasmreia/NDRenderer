import { NDTranslacao, NDEscala, VetorOrtogonal, matrizRotacaoND } from "./lib/ND_Transforms.js";
//import ND_AxesHelper from "./ND_AxisHelper.js";

class ND_Camera{
    constructor(N, raioObj=3){
        this.dimN = N;
        
        this.raioObj = raioObj;
        this.tamAparente = 1;

        this.esfericas = Array(this.dimN-1).fill(0);
        this.esfericas[N-2] = math.pi;

        this.FoV = 45;
        this.raio = 3;

        this.UpdatePos();

        this.direcao = math.multiply(-1, this.position)

        this.precisaUpdate = true

        this.lookAtMatrix = undefined;

        this.projectionMatrix = undefined;
        this.projectionMatrixResized = undefined;
        this.modelViewMatrix = undefined;
        this.projectionModelViewMatrix = undefined;

        this.perspective = true;//Define o tipo de projeção usado

        this.updateProjectionMatrix();

        this.lookAt(math.zeros(this.dimN), undefined,true);
        
        //this.updateViewMatrix();

        //this.lookAt(math.zeros(math.zeros(N)));

    }

    UpdatePos(){
        let pos = Array(this.dimN).fill(1);
        /*
        for (let i=this.dimN-2; i >= 0; i--) {
            if (i == this.dimN-2){
                if this.esfericas>2*math.pi
                this.esfericas[i] = ((this.esfericas[i]/math.pi)%2)*math.pi;
            } else {
                
            }
        }
        */
        for (let i=0; i <= this.dimN-2; i++) {
            pos[this.dimN-i-1] *= math.sin(this.esfericas[i]);
            for (let j=0; j < this.dimN-i-1; j++){
                pos[j] *= math.cos(this.esfericas[i]);
            }
        }
        this.position = math.multiply(math.matrix(pos), this.raio);
        
    }

    /*UpdatePos(uns){
        console.log(this.raio);
        let pos = uns;//math.matrix(Array.from({ length: this.dimN}, () => this.raio));
        console.log(pos);
        this.esfericas.forEach((coord, i) => {
            console.log(pos);
            pos[this.dimN-i-1] *= math.sin(coord);
            for (let j=0; j < this.dimN-i-1; j++){
                pos[j] *= math.cos(coord);
            }
        });
        //Troca coords
        console.log(pos);
        this.position = pos;
        
    }*/

    RotVecPos(x, y, theta){
        //console.log(matrizRotacaoND(this.dimN, x, y, theta));
        //console.log(math.transpose([this.position]));
        console.log(this.position);
        //console.log(math.size(this.position));
        //console.log(math.size(math.transpose([this.position])));
        this.position = math.transpose(math.multiply(matrizRotacaoND(this.dimN, x, y, theta), math.transpose(this.position)));
    }

    updateFoV(){
        //Para atualizar a distância da camera quando o FoV muda
        //const CotFov = 1/math.tan(this.FoV*0.5*math.pi/180);
        //this.raio = CotFov + this.raioObj + 1;// + this.tamAparente;
        this.perspective = (this.FoV != 0);
        //this.UpdatePos();
        this.updateProjectionMatrix();
        this.lookAt(math.zeros(this.dimN), undefined, true);
    }

    updateProjectionMatrix(){
        if (this.FoV == 0){
            this.projectionMatrix = math.identity(this.dimN);
        };
        const CotFov = 1/math.tan(this.FoV*0.5*math.pi/180);
        
        this.projectionMatrix = math.multiply(CotFov, math.identity(this.dimN+1));
        this.projectionMatrix.set([this.dimN-1, this.dimN-1], 1);
        this.projectionMatrix.set([this.dimN, this.dimN-1], 1);

        this.projectionMatrixResized = math.multiply(NDEscala(this.dimN, 1), this.projectionMatrix);
    }

    updateViewMatrix(){
        this.modelViewMatrix = math.identity(this.dimN+1);
        const indice = math.index(math.evaluate('0:n-1', { n:this.dimN }), math.evaluate('0:n-1', { n:this.dimN }));
        this.modelViewMatrix.subset(indice, this.lookAtMatrix);
        const posNegativa = math.multiply(-1, this.position);
        this.modelViewMatrix = math.multiply(this.modelViewMatrix, NDTranslacao(this.dimN, posNegativa));
    }

    updateProjectionViewMatrix(){
        if (this.perspective){
            this.projectionModelViewMatrix = math.multiply(this.projectionMatrixResized, this.modelViewMatrix);
        } else {
            this.projectionModelViewMatrix = this.modelViewMatrix;
        }
    }

    lookAt(alvo, viewUps = undefined, recalcula = false){
        //console.log(alvo);
        //console.log(this.position);
        let direcao = math.subtract(alvo, this.position);

        //console.log("lookAt!");
        if (math.norm(math.subtract(this.direcao, direcao)) < 1e-6 && !recalcula) {
            return
        }
        //console.log("lookAt, diferente!");
        
        this.precisaUpdate = true
        this.direcao = direcao
        
        let Ups = []
        if (viewUps == undefined){
            const scope = { n:this.dimN-1 }
            const indice = math.index(math.evaluate('2:n', scope), math.evaluate('0:n', scope));
            Ups =  math.identity(this.dimN).subset(indice);
        } else {
            Ups = viewUps;
        }


        const comprimentoDirecao = math.norm(direcao);
        if (comprimentoDirecao < 1e-6){
            throw new Error('Alvo eh igual a posicao');
        }
        direcao = math.divide(direcao, comprimentoDirecao);

        //console.log(direcao);
        //console.log(Ups);
        /*console.log("aqui?");

        console.log(math.transpose([direcao]));
        console.log([direcao]);
        console.log(Ups);
        */
        //gambiarra
        //direcao = math.squeeze(direcao);

        //console.log([direcao]);

        //console.log(Ups)


        let mat = math.concat(Ups, [direcao.toArray()], 0);

        //console.log(mat);
        //console.log("aqui2?");

        //mat = math.concat(mat, [VetorOrtogonal(mat)], 0);
        //let ortogonal = VetorOrtogonal(mat);
        //console.log(mat);
        //console.log("determinante");
        const determinante = math.det(math.concat(mat, [VetorOrtogonal(mat)], 0));
        //console.log(determinante);
        if (determinante == 0){
            throw new Error("ViewUps e Vetor direcao sao linearmente dependentes");
        }
        
        //console.log("lookAtMat");
        let lookAtMat = math.zeros(this.dimN, this.dimN);
        
        //console.log(lookAtMat);
        //console.log(direcao);
        const indice = math.index(this.dimN-1, math.range(0, this.dimN));
        lookAtMat = math.subset(lookAtMat, indice, direcao);
        //console.log(lookAtMat);
        //console.log("inloop");

        //Calculo base projetiva "LookAtMatrix"
        for (var i = 0; i < this.dimN-1; i++){
            //Reescrever com novo subset q aceita index vazio
            if (i<this.dimN-2){
                const subUps = math.subset(Ups, math.index(math.range(i, this.dimN-2), math.range(0, this.dimN)));
                //console.log(subUps);
                //console.log(math.index(math.range(this.dimN-i-1, this.dimN), math.range(0, this.dimN)));
                const subLookAt = math.subset(lookAtMat, math.index(math.range(this.dimN-i-1, this.dimN), math.range(0, this.dimN)));
                mat = math.concat(subUps, subLookAt, 0);
            } else {
                mat = math.subset(lookAtMat, math.index(math.range(this.dimN-i-1, this.dimN), math.range(0, this.dimN)));
            }
            const vetOrtogonal = VetorOrtogonal(mat)
            const vetOrtogonalnorm = math.divide(vetOrtogonal, math.norm(vetOrtogonal));
            lookAtMat = math.subset(lookAtMat, math.index(this.dimN-i-2, math.range(0, this.dimN)), vetOrtogonalnorm);
        }
        

        this.lookAtMatrix = lookAtMat;//math.identity(this.dimN);

        this.updateViewMatrix();

        this.updateProjectionViewMatrix();

    }

    getMatrixProjecao(){
        //return this.modelViewMatrix;
        return this.projectionModelViewMatrix;
    }
}

export default class ND_Cameras{
    constructor(N){
        this.dimN = N;
        
        this.cameras = [];
        for (let i=N; i>=4; i--){
            //const pos = Array.from({ length: i-1 }, () => 0);
            //pos[i-2] = 3;
            //pos = [0, 0, ..., 0]
            let camera = new ND_Camera(i);
            camera.lookAt(math.zeros(i));
            this.cameras.push(camera);
        }
    }

    lookAtOrigem(recalcula = false){
        this.cameras.forEach((camera) => {camera.lookAt(math.zeros(camera.dimN), undefined, recalcula)});
    }

    projetaObjetos(ndObjs){
        //console.log(pnts);
        ///const size = math.size(pnts).valueOf();
        ///const cols = size[1];
        if (this.cameras.some(camera => camera.precisaUpdate) || ndObjs.some(obj => obj.precisaUpdate)){
            for (const ndObj of ndObjs) {
                if (ndObj.Mesh.visible && ndObj.geometria.vertices.length > 0) {
                    let pnts = ndObj.geometria.vertices;
                    //let profundidades = ndObj.geometriaOriginal.vertices;//Armazenamos as posições nas dimensoes perdidas para o corte dimensional
                    for (let camera of this.cameras){
                        //adiciona coordenadas homogenias
                        const size = math.size(pnts).valueOf();
                        let pntsH = math.resize(pnts, [size[0], size[1]+1], 1);
                        //console.log(math.transpose(pntsH));
                        //console.log(camera.getMatrixProjecao());
                        pntsH = math.transpose(math.multiply(camera.getMatrixProjecao(), math.transpose(pntsH)));
                        //console.log(projetadosH);
                        //profundidades = pntsH.toArray().map(vertice => vertice[camera.dimN]);
                        //profundidades = pntsHArray.map();

                        pnts = pntsH.toArray().map(vertice => math.divide(vertice.slice(0, camera.dimN-1), vertice[camera.dimN]));
                        
                        //console.log(projetados);
                        //console.log('projetou');
                        
                        //camera.precisaUpdate = false;
                    }
                    //console.log("Alou!");
                    //console.log(pnts);
                    //console.log(l);
                    ndObj.updateVertices(pnts);

                }
            }
            //console.log("Projetou!")
            this.cameras.forEach((camera) => camera.precisaUpdate=false);
            
        } //else {
          //  ndObj.updateVertices(projetados[0]);
        //}
    }
}