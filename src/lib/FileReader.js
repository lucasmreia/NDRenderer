//Recebe o conteudo de um .NDP e retorna sua geometria
export function readNDP(conteudo) {
    const lines = conteudo.split("\n")
    .filter((linha) => linha.length>0);
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

    //console.log(nArestas);
    let lin_num_arestas = 2+nVrts;
    let faces = [];

    while (lin_num_arestas < lines.length && lines[lin_num_arestas].trim() != ""){
        let nArestas = Number(lines[lin_num_arestas]);


        let arestas = []

        for (let i=0; i<nArestas; i++){
            arestas.push(lines[1 + lin_num_arestas + i]
                .split(" ")
                .filter((linha) => linha.length>0)
                .map((num) => Number(num)));
        }

        faces.push(arestas);
        lin_num_arestas += nArestas + 1
    }
    //console.log(faces);

    let geometria = {
        N: N,
        K: K,
        vertices: verts,
        faces: faces,
    };

    return geometria;
};

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

function get_indice_face(verts_dic,
                         nmkfaces_dic,
                         hcubo,
                         face,
                         dim) {
    if (dim == 1) {
        //console.log(verts_dic);
        let indices = face.map((t) => {
            //console.log(t);
            //console.log(hcubo.vertices[t]);
            //console.log(verts_dic.has(hcubo.vertices[t]))
            return verts_dic.get(hcubo.vertices[t]);
        });
        //console.log(indices);
        indices.sort();
        return indices;
    }
    const dic = nmkfaces_dic[dim-2];
    let indices = face.map((t) => {
        return dic.get(get_indice_face(verts_dic,
                                nmkfaces_dic,
                                hcubo,
                                hcubo.faces[dim-2][t],
                                dim-1));
    });
    indices.sort();
    return indices
}

//Recebe o conteudo de um .POL e retorna sua geometria
export function readPOL(conteudo) {
    const lines = conteudo.split("\n");

    let [N, K] = lines[0].split(" ")
                        .filter((lin) => lin.length>0)
                        .map((num) => Number(num));

    let divs = lines[1].split(" ")
                    .filter((linha) => linha.length>0)
                    .map((num) => Number(num));

    let hcubos = [];
    for (let i=0; i<lines.length; i++){
        if (lines[i].length==0){
            //console.log(i);
            let verts = [];
            let nmkfaces = [];
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
                let lin_num_arestas = i+3+numVrts+1;
                let num_arestas;
                while (lines[lin_num_arestas].length !=0) {
                    let arestas = [];
                    num_arestas = Number(lines[lin_num_arestas]);
                    for (let j=0; j<num_arestas; j++){
                        arestas.push(lines[lin_num_arestas+1+j]
                            .split(" ")
                            .filter((linha) => linha.length>0)
                            .map((num) => Number(num)-1));
                    }
                    lin_num_arestas += num_arestas + 1
                    nmkfaces.push(arestas)
                }
            
                hcubos.push({vertices :verts, faces: nmkfaces});

                //console.log({vertices :verts, faces: arestas});
        }
    }

    let verts_dic = new ArrayKeyedMap(); //Vertice eh a chave e o valor eh o seu indice
    let vertices = [];

    let nmkfaces_dic = Array(N - K).fill(null).map(() => (new ArrayKeyedMap())); //Indices de dim menor sao a chave e o valor eh o seu indice
    let nmkfaces = Array(N - K).fill(null).map(() => ([]));

    let num_verts_original = 0
    let num_nmkfaces_original = Array(N - K).fill(0);

    for (let hcubo of hcubos) {
        for (let vertice of hcubo.vertices){
            //console.log(verts_dic.has(vertice));
            if (!verts_dic.has(vertice)){
                verts_dic.set(vertice, vertices.length);
                vertices.push(vertice);
            }
        }
        num_verts_original += hcubo.vertices.length;

        let dim = 0
        for (let faces of hcubo.faces){
            for (let aresta of faces) {
                aresta = get_indice_face(verts_dic, nmkfaces_dic, hcubo, aresta, dim+1)
                //console.log(aresta);
                if (!nmkfaces_dic[dim].has(aresta)) {
                    nmkfaces_dic[dim].set(aresta, nmkfaces[dim].length);
                    nmkfaces[dim].push(aresta);
                }
                num_nmkfaces_original[dim] += faces.length
            }

            dim += 1;
        }
    };
    //faces.push(arestas);
    console.log(`De ${num_verts_original} para ${vertices.length} vertices`);
    num_nmkfaces_original.forEach((element, index) => {
        console.log(`De ${element} para ${nmkfaces[index].length} ${index+1}-faces`);
    });

    let geometria = {
        N: N,
        K: K,
        vertices: vertices,
        faces: nmkfaces,
    };
    console.log(geometria);
    return geometria;
};
