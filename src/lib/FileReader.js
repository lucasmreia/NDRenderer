//Recebe o conteudo de um .NDP e retorna sua geometria
export function readNDP(conteudo) {
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
        //console.log(verts[i]);
    }
    //console.log(verts.slice(0, nVrts));

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
export function readPOL(conteudo) {
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
