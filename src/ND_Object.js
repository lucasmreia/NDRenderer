//import * as THREE from "three";
//import * as math from "mathjs";

class ND_Object {
    constructor(geometria, Max_Pontos=1, cor1, cor2){
        //this.arquivo = arquivo;
        this.geometria = geometria;
        
        /*if (ehndp) {
            this.geometria = readNDP(arquivo);
        } else {
            this.geometria = readPol(arquivo);
        }*/

        //Geometria do Politopo
        //this.geometriaOriginal = geometria;

        //console.log(this.geometriaOriginal);

        this.dimN = this.geometria.N; //Dimensao do espaço
        this.dimK = this.geometria.K; 


        this.geometry3D = new THREE.BufferGeometry();

        //const verts = this.geometria.vertices.map((vertice) => vertice.slice(0, 3)).flat();

        //console.log(this.geometria.vertices.length);

        //Buffer com vertices da malha
        this.Max_Pontos = Math.max(this.geometria.vertices.length, Max_Pontos)
        const positions_buffer = new Float32Array(this.Max_Pontos * 3);
        this.geometry3D.setAttribute('position', new THREE.BufferAttribute(positions_buffer, 3));
        
        this.geometry3D.setDrawRange(0, this.geometria.faces[0].length * 2);

        //this.cor1 = { cor:'#00ff00' };//new THREE.Color( 0x00ff00 );
        //this.cor2 = { cor:'#ff00ff' };//new THREE.Color( 0xff00ff );

        this.coordColorida = 0;// Coordenada por onde se propaga a cor, deve estar entre 0 e N-1
        
        //Calcula centro de massa, "raio" e maior e menor posiçao em cada coordenada
        this.centrodeMassa = math.zeros(this.dimN);
        this.raio = 0;
        this.coordsMinMax = [];
        this.MinMax = {min:1_000_000, max:-1_000_000};
        this.calculaCentrodeMassa();

        //Cor dos vertices
        //Buffer com cor de cada vertice
        /*const colorVerts = geometria.vertices
        .map((vertice) => [mapNumRange(vertice[0], -1, 1, this.cor1.r, this.cor2.r), mapNumRange(vertice[0], -1, 1, this.cor1.g, this.cor2.g), mapNumRange(vertice[0], -1, 1, this.cor1.b, this.cor2.b)])
        .flat();
        this.colorvertices_para_buffer = new Float32Array(colorVerts);
        this.geometry3D.setAttribute('colorPosition', new THREE.BufferAttribute(this.colorvertices_para_buffer, 3));*/
        

        const ind = this.geometria.faces[0].flat();
        this.geometry3D.indices = new Uint16Array(ind);
        this.geometry3D.setIndex(new THREE.BufferAttribute(this.geometry3D.indices, 1));
        
        /*
        const vertexShader = `
        varying vec4 pos;

        attribute vec4 colorPosition;
        varying vec4 cor;

        void main() {
            cor = colorPosition;

            pos = vec4(position, 1.0);
            gl_Position = projectionMatrix * modelViewMatrix * pos;
        }
        `;
        const fragmentShader = `
        varying vec4 pos;
        varying vec4 cor;

        void main() {
            gl_FragColor = vec4(pos.xyz*3.0, 1);
            //gl_FragColor = vec4(cor.xyz, 1);//cor.y, 1);//vec4(cor, cor, 0, 1);
        }
        `;



        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
        });*/


        this.materialND = new Colored_Coords(this, cor1, cor2);
        this.materialND.updateColors();

        this.material = this.materialND.material;

        //this.material = new THREE.ShaderMaterial({

        //});

        this.basicMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, vertexColors: true } );

        this.Mesh = new THREE.LineSegments(this.geometry3D, this.material);

        this.arquivo = undefined;

        this.destacado = true; //Se verdadeiro objeto eh renderizadno em cima dos outros
        this.destacarObjeto();
        
        this.precisaUpdate = false;
        this.precisaUpdateIndices = false;
    }

    calculaCentrodeMassa(){
        this.centrodeMassa = math.zeros(this.dimN);
        this.raio = 0;
        this.coordsMinMax = [];
        this.MinMax = {min:1_000_000, max:-1_000_000};
        for (let i=0; i<this.dimN; i++){
            this.coordsMinMax[i] = {min:1_000_000, max:-1_000_000};
        }

        for (let vertice of this.geometria.vertices){
            for (let i=0; i<this.dimN; i++){
                if (vertice[i] < this.coordsMinMax[i].min){
                    this.coordsMinMax[i].min = vertice[i];
                }
                if (vertice[i] > this.coordsMinMax[i].max){
                    this.coordsMinMax[i].max = vertice[i];
                }
                //console.log(vertice[i])
            }
            if (math.norm(vertice) > this.raio){
                this.raio = math.norm(vertice);
            }
            //this.centrodeMassa += math.matrix(vertice);//Mude isso depois
            this.centrodeMassa = math.add(this.centrodeMassa, vertice);
        }
        this.centrodeMassa = math.divide(this.centrodeMassa, this.geometria.vertices.length);
        
        this.MinMax = {min: this.coordsMinMax.reduce((menor, minmax) => minmax.min < menor ? minmax.min : menor, this.coordsMinMax[0].min),
                       max: this.coordsMinMax.reduce((maior, minmax) => minmax.max > maior ? minmax.max : maior, this.coordsMinMax[0].max)}

        
        //console.log(this.centrodeMassa);
        //console.log(this.coordsMinMax);
        //console.log(this.raio);
    }

    /*updateColors(){
        //const colorAtribute = this.geometry3D.getAttribute('colorPosition');
        let cor1 = new THREE.Color( this.cor1.cor );
        let cor2 = new THREE.Color( this.cor2.cor );
        const colorVerts = this.geometria.vertices
            .map((vertice) => [mapNumRange(vertice[this.coordColorida], this.coordsMinMax[this.coordColorida].min, this.coordsMinMax[this.coordColorida].max, cor1.r, cor2.r), 
                               mapNumRange(vertice[this.coordColorida], this.coordsMinMax[this.coordColorida].min, this.coordsMinMax[this.coordColorida].max, cor1.g, cor2.g), 
                               mapNumRange(vertice[this.coordColorida], this.coordsMinMax[this.coordColorida].min, this.coordsMinMax[this.coordColorida].max, cor1.b, cor2.b)])
            .flat();
        this.colorvertices_para_buffer = new Float32Array(colorVerts);
        this.geometry3D.setAttribute('colorPosition', new THREE.BufferAttribute(this.colorvertices_para_buffer, 3));
    }*/

    updateGeometria(novaGeometria){
        this.geometria = novaGeometria;
        this.calculaCentrodeMassa();
        //this.updateVertices(this.geometria.vertices);
        //this.setBufferArestas();
        this.precisaUpdate = true;
        this.precisaUpdateIndices = true;
    }

    updateVertices(novosVertices){
        //console.log(novosVertices);
        //this.geometria.vertices = novosVertices;
        const positionAttribute = this.geometry3D.getAttribute('position');
        //console.log(positionAttribute);

        for (let i=0; i<novosVertices.length; i++) {
            positionAttribute.setXYZ(i, 
                novosVertices[i][0], 
                novosVertices[i][1], 
                novosVertices[i][2]);
        }
        //positionAttribute.setXYZ(0, 0, 0, 0);
        //console.log(positionAttribute);

        this.Mesh.geometry.setDrawRange(0, this.geometria.faces[0].length * 2);

        this.geometry3D.computeBoundingBox();
        this.geometry3D.computeBoundingSphere();

        this.geometry3D.attributes.position.needsUpdate = true;

        if (this.precisaUpdateIndices) {
            this.materialND.updateColors();
            this.setBufferArestas();
            this.precisaUpdateIndices = false;
        }

        this.precisaUpdate = false;
    }

    setBufferArestas(){
        const ind = this.geometria.faces[0].flat();
        this.geometry3D.indices = new Uint16Array(ind);
        this.geometry3D.setIndex(new THREE.BufferAttribute(this.geometry3D.indices, 1));
    }

    destacarObjeto(){
        //this.Mesh.renderOrder = 999;//zindex || 999;
        //this.Mesh.material.depthTest = true;
        //this.Mesh.material.depthWrite = true;
        if (this.destacado){
            this.Mesh.onBeforeRender = function (renderer) { renderer.clearDepth(); };
        } else {
            this.Mesh.onBeforeRender = function () {};
        }
    }


}



function mapNumRange(num, inMin, inMax, outMin, outMax){
    return ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}