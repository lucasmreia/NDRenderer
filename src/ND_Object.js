import * as THREE from "three";
//import { matrix, multiply } from "mathjs";

import { extraiNumerosStrings } from './lib/FileImporter.js';


export default class ND_Object {
    constructor(arquivo, ehndp){
        this.arquivo = arquivo;
        let geometria;
        
        if (ehndp) {
            geometria = readNDP(arquivo);
        } else {
            geometria = readPol(arquivo);
        }

        //Geometria do Politopo
        this.geometriaOriginal = geometria;

        this.dimN = geometria.N; //Dimensao do espaço
        this.dimK = geometria.K; 

        this.vertices = geometria.vertices;
        //this.facesKDim = geometria.faces;//Lista com K listas representado a ligação das faces de cada dimensao

        this.geometry = new THREE.BufferGeometry();

        //this.vertices = matrix(geometria.this.vertices);
        //console.log(this.vertices);




        const verts = geometria.vertices.map((vertice) => vertice.slice(0, 3)).flat();

        //Buffer com vertices da malha
        this.vertices_para_buffer = new Float32Array(verts);
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.vertices_para_buffer, 3));
        

        this.cor1 = new THREE.Color( 0x00ff00 );
        this.cor2 = new THREE.Color( 0xff00ff );

        this.coordColorida = 0;// Coordenada por onde se propaga a cor, deve estar entre 0 e N-1
        
        this.coordsMinMax = [];
        for (let i=0; i<this.dimN; i++){
            this.coordsMinMax[i] = {min:1_000, max:-1_000};
        }

        for (let vertice of this.vertices){
            for (let i=0; i<this.dimN; i++){
                if (vertice[i] < this.coordsMinMax[i].min){
                    this.coordsMinMax[i].min = vertice[i];
                }
                if (vertice[i] > this.coordsMinMax[i].max){
                    this.coordsMinMax[i].max = vertice[i];
                }
            }
        }

        console.log(this.coordsMinMax);

        //Cor dos vertices
        //Buffer com cor de cada vertice
        this.updateColors()
        /*const colorVerts = geometria.vertices
        .map((vertice) => [mapNumRange(vertice[0], -1, 1, this.cor1.r, this.cor2.r), mapNumRange(vertice[0], -1, 1, this.cor1.g, this.cor2.g), mapNumRange(vertice[0], -1, 1, this.cor1.b, this.cor2.b)])
        .flat();
        this.colorvertices_para_buffer = new Float32Array(colorVerts);
        this.geometry.setAttribute('colorPosition', new THREE.BufferAttribute(this.colorvertices_para_buffer, 3));*/
        

        const ind = geometria.faces[0].flat();
        this.geometry.indices = new Uint16Array(ind);
        this.geometry.setIndex(new THREE.BufferAttribute(this.geometry.indices, 1));
        
        const vertexShader = `
        varying vec4 pos;

        attribute vec4 colorPosition;
        varying vec4 cor;

        void main() {
            cor = colorPosition;

            pos = vec4(position, 1.0);
            gl_Position = projectionMatrix * modelViewMatrix * pos;
        }
        `
        const fragmentShader = `
        //varying vec4 pos;
        varying vec4 cor;

        void main() {
            gl_FragColor = vec4(cor.xyz, 1);//cor.y, 1);//vec4(cor, cor, 0, 1);
        }
        `

        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
        });

        this.basicMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, vertexColors: true } );

        this.Mesh = new THREE.LineSegments(this.geometry, this.material);

        this.arquivo = undefined;
        this.linhas = undefined;
    }

    load_file(){
        const reader = new FileReader();
        //let linhas;
        reader.onload = function(e) {
            const conteudo = e.target.result;
            //console.log("gerando ND_Object!!", conteudo);// Aqui você pode fazer o que quiser com o conteúdo do arquivo
            this.linhas = conteudo.split('\n').map(linha => linha.trim());
            this.dimK = this.linhas[0];
            //console.log(linhas);
            //this.arquivo = conteudo;
            //this.politope = new ND_Object(conteudo);//Isso n deveria ficar aqui
        };
        reader.readAsText(this.arquivo);

    }

    updateColors(){
        //const colorAtribute = this.geometry.getAttribute('colorPosition');

        const colorVerts = this.geometriaOriginal.vertices
        .map((vertice) => [mapNumRange(vertice[this.coordColorida], this.coordsMinMax[this.coordColorida].min, this.coordsMinMax[this.coordColorida].max, this.cor1.r, this.cor2.r), 
                           mapNumRange(vertice[this.coordColorida], this.coordsMinMax[this.coordColorida].min, this.coordsMinMax[this.coordColorida].max, this.cor1.g, this.cor2.g), 
                           mapNumRange(vertice[this.coordColorida], this.coordsMinMax[this.coordColorida].min, this.coordsMinMax[this.coordColorida].max, this.cor1.b, this.cor2.b)])
        .flat();
        this.colorvertices_para_buffer = new Float32Array(colorVerts);
        this.geometry.setAttribute('colorPosition', new THREE.BufferAttribute(this.colorvertices_para_buffer, 3));
    }

    updateVertices(novosVertices){
        const positionAttribute = this.geometry.getAttribute('position');

        for (let i=0; i<novosVertices.length; i++) {
            positionAttribute.setXYZ(i, novosVertices[i][0], novosVertices[i][1], novosVertices[i][2]);
        }

        this.geometry.computeBoundingBox();
        this.geometry.computeBoundingSphere();

        this.geometry.attributes.position.needsUpdate = true;
    }

}



//Esses devem sair daqui...?
//Recebe o conteudo de um .NDP e retorna sua geometria
function readNDP(conteudo) {
    const lines = conteudo.split("\n").filter((linha) => linha.length>0);
    //lines.forEach(line => console.log(line));
    //console.log(lines);

    let N = Number(lines[0][0]);
    let K = Number(lines[0][2]);

    //console.log(N, K);

    let nVrts = Number(lines[1]);

    let verts = [];

    for (let i=0; i<nVrts; i++){
        verts.push(lines[2 + i].split(" ").filter((linha) => linha.length>0).map((num) => Number(num)));
    }
    //console.log(verts);


    let nArestas = Number(lines[2+nVrts]);
    //console.log(nArestas);
    let faces = [];
    for (let i=0; i<nArestas; i++){
        faces.push(lines[3 + nVrts + i].split(" ").filter((linha) => linha.length>0).map((num) => Number(num)));
    }
    //console.log(faces);

    let geometria = {
        N: N,
        K: K,
        vertices: verts,
        faces: [faces],
    };

    return geometria;
};

//Recebe o conteudo de um .POL e retorna sua geometria
function readPol(conteudo) {
    const lines = conteudo.split("\n");
    //lines.forEach(line => console.log(line));
    //console.log(lines);

    let [N, K] = lines[0].split(" ")
                        .filter((lin) => lin.length>0)
                        .map((num) => Number(num));

    let divs = lines[1].split(" ").filter((linha) => linha.length>0).map((num) => Number(num));

    //console.log(N, K, divs);

    let hcubos = [];
    for (let i=0; i<lines.length; i++){
    if (lines[i].length==0){
        //console.log(i);
        let verts = [];
            let arestas = [];
            if (lines[i+1] == "-1"){ break };

            let numVrts = Number(lines[i+3]);
            for (let j=0; j<numVrts; j++){
                verts.push(lines[i+4+j]
                    .split(" ")
                    .filter((linha) => linha.length>0)
                    .slice(K+1)
                    .map((num) => Number(num)));
            }
            //console.log(verts);
            let numArestas = Number(lines[i+3+numVrts+1]);
            for (let j=0; j<numArestas; j++){
                arestas.push(lines[i+5+numVrts+j]
                    .split(" ")
                    .filter((linha) => linha.length>0)
                    .map((num) => Number(num)-1));
            }
            //console.log({vertices :verts, faces: arestas});
            hcubos.push({vertices :verts, faces: arestas});
        }
    }

    let vertices = [];
    let verts_dic = {}; //Vertice eh a chave e o valor eh o seu indice
    let faces = [];

    let arestas = [];
    let arestas_dic = {};

    for (let hcubo of hcubos) {
        for (let vertice of hcubo.vertices){
            if (!verts_dic.hasOwnProperty(vertice)){
                verts_dic[vertice] = vertices.length;
                vertices.push(vertice);
            }
        }

        for (let aresta of hcubo.faces){
            let aresta_global = [verts_dic[hcubo.vertices[aresta[0]]], verts_dic[hcubo.vertices[aresta[1]]]];
            if (aresta_global[0] > aresta_global[1]){
                aresta_global = [aresta_global[1], aresta_global[0]];
            }

            if (!arestas_dic.hasOwnProperty(aresta_global)){
                arestas_dic[aresta_global] = arestas.length;
                arestas.push(aresta_global);
            }
        }
    };
    faces.push(arestas);


    let geometria = {
        N: N,
        K: K,
        vertices: vertices,
        faces: faces,
    };

    return geometria;
};


function mapNumRange(num, inMin, inMax, outMin, outMax){
    return ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}