class ND_Corte {
    constructor(NDObj) {
        this.NDObj = NDObj;

        this.dimN = NDObj.dimN;

        this.verticesObj = NDObj.geometry.vertices;
        this.nmkfacesObj = NDObj.geometry.faces;
        this.arestasObj = NDObj.geometry.faces[0];
        this.facesObj = NDObj.geometry.faces[1];

        this.MinMax = NDObj.MinMax;
        this.coordsMinMax = NDObj.coordsMinMax;

        this.coordCorte = this.dimN - 1;

        this.localDoCorte = (this.coordsMinMax[this.coordCorte].min + this.coordsMinMax[this.coordCorte].max) / 2.;
        // this.localDoCorte = this.coordsMinMax[this.coordCorte].max + 1e-3;

        // We intended to increase the number of edges dynamically, but it didn't work properly.
        // So we decided to start with a bigger number of edges, and the next calls will be only smaller.
        // let geometry = this.corta_ultima_coord();
        // this.fatiaND = new ND_Object(geometry, {cor: '#ff0000'}, {cor: '#000000'}, this.NDObj);

        // Start with the entire geometry, then the sectional cut will always be smaller in the next calls.
        this.fatiaND = new ND_Object(this.NDObj.geometry, {cor: '#ff0000'}, {cor: '#000000'}, this.NDObj);

        this.fatiaND.visible = false;
        this.fatiaND.Mesh.visible = true;
        this.fatiaND.Mesh.children[0].visible = false;
        this.fatiaND.Mesh.children[1].visible = false;
    }

    getCut() {
        return this.fatiaND;
    }

    corta_ultima_coord() {
        // If the cut position is outside the valid range, return an empty geometry.
        if ((this.localDoCorte < this.coordsMinMax[this.coordCorte].min) ||
            (this.localDoCorte > this.coordsMinMax[this.coordCorte].max)) {
            return {
                N: this.dimN,
                K: 0,
                vertices: [],
                faces: [[]]
            };
        }

        // First, loop through the edges (from geometry.faces[0]) to find intersections.
        // 'cutEdges' maps an edge index to the new vertex index.
        let cutEdges = new Map();
        let novosVertices = [];  // This will hold the new intersection vertices.
        for (let i = 0; i < this.arestasObj.length; i++) {
            const aresta = this.arestasObj[i]; // An edge defined as [indexA, indexB]
            const vertA = this.verticesObj[aresta[0]];
            const vertB = this.verticesObj[aresta[1]];
            // Check if the edge crosses the cut:
            if (((vertA[this.coordCorte] - this.localDoCorte) *
                (vertB[this.coordCorte] - this.localDoCorte)) < 0) {
                // Compute the interpolation factor.
                const valInterpol = (this.localDoCorte - vertA[this.coordCorte]) /
                    (vertB[this.coordCorte] - vertA[this.coordCorte]);
                // Create the new vertex by interpolating along the edge.
                let novoVertice = [];
                for (let j = 0; j < this.dimN; j++) {
                    novoVertice[j] = vertA[j] + (vertB[j] - vertA[j]) * valInterpol;
                }
                // Record the mapping from the original edge index to the new vertex index.
                cutEdges.set(i, novosVertices.length);
                novosVertices.push(novoVertice);
            }
        }

        // Next, loop through the face data (from geometry.faces[1], stored in this.facesObj)
        // to build the new edges (each new edge is a pair of indices into 'novosVertices').
        let newEdges = [];
        for (let i = 0; i < this.facesObj.length; i++) {
            const face = this.facesObj[i]; // 'face' is an array of edge indices.
            let newEdge = [];
            for (let j = 0; j < face.length; j++) {
                const edgeIndex = face[j];
                if (cutEdges.has(edgeIndex)) {
                    newEdge.push(cutEdges.get(edgeIndex));
                }
            }
            // Only add the new edge if exactly two intersection vertices were found.
            if (newEdge.length === 2) {
                newEdges.push(newEdge);
            }
        }

        return {
            N: this.dimN,
            K: 0,
            vertices: novosVertices,
            faces: [newEdges]
        };
    }

    corte() {
        const geometry = this.corta_ultima_coord();
        //console.log(geometry);
        this.fatiaND.updateGeometry(geometry);
        //this.fatiaND.updateVertices(Array(geometry.vertices.length).fill([0, 0, 0]));
        //this.fatiaND.updateFaces(geometry.faces);
    }
}