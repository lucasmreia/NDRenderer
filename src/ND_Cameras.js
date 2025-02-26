class ND_Camera {
    constructor(N, radiusObj = 3, perspective = true) {
        //console.log("Construtor camera ", N, "D");
        this.dimN = N;

        this.radiusObj = radiusObj;
        this.tamAparente = 1;

        this.spherical = Array(this.dimN - 1).fill(0); // spherical coordinates of the camera (angles at each coordinate).
        this.radius = 3; // radius of the hyper-sphere where the camera lies.

        this.fov = 45;

        this.target = Array(this.dimN).fill(0); // target for "look at".

        this.UpdatePos();

        // Initialize viewForward.
        this.viewForward = math.zeros(this.dimN);
        this.viewForward.set([0], 1.);

        this.needsUpdate = true

        this.lookAtMatrix = undefined;

        this.projectionMatrix = undefined;
        this.projectionMatrixResized = undefined;
        this.modelViewMatrix = undefined;
        this.projectionModelViewMatrix = undefined;

        this.perspective = perspective; // Specifies the type of projection used (perspective or orthogonal).

        // Creating the projection matrix.
        this.updateProjectionMatrix();

        // Creating the "look at" matrix (updates the final projection-view matrix).
        this.lookAt(math.zeros(this.dimN), undefined, true);
    }

    UpdatePos() {
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
        for (let i = 0; i <= this.dimN - 2; i++) {
            pos[this.dimN - i - 1] *= math.sin(this.spherical[i]);
            for (let j = 0; j < this.dimN - i - 1; j++) {
                pos[j] *= math.cos(this.spherical[i]);
            }
        }
        this.position = math.multiply(math.matrix(pos), this.radius);
        this.position = math.add(this.position, this.target);
    }


    RotVecPos(x, y, theta) {
        //console.log(ND_RotationMatrix(this.dimN, x, y, theta));
        //console.log(math.transpose([this.position]));
        console.log(this.position);
        //console.log(math.size(this.position));
        //console.log(math.size(math.transpose([this.position])));
        this.position = math.transpose(math.multiply(ND_RotationMatrix(this.dimN, x, y, theta), math.transpose(this.position)));
    }

    updateFov() {
        this.perspective = (this.fov !== 0);
        this.updateProjectionMatrix();
        this.lookAt(math.zeros(this.dimN), undefined, true);
    }

    updateProjectionMatrix() {
        // Attention: this.fov should not be 0.
        const CotFov = 1 / math.tan(this.fov * 0.5 * math.pi / 180);

        this.projectionMatrix = math.multiply(CotFov, math.identity(this.dimN + 1));
        this.projectionMatrix.set([this.dimN - 1, this.dimN - 1], 1);
        this.projectionMatrix.set([this.dimN, this.dimN - 1], 1);

        this.projectionMatrixResized = math.multiply(ND_ScalingMatrix(this.dimN, 1.0), this.projectionMatrix);
    }

    updateViewMatrix() {
        // Concatenates the "look at" matrix with the "translation" to the origin.
        this.modelViewMatrix = math.identity(this.dimN + 1);
        const indice = math.index(math.range(0, this.dimN), math.range(0, this.dimN));
        this.modelViewMatrix.subset(indice, this.lookAtMatrix);
        const posNegativa = math.multiply(-1, this.target);
        this.modelViewMatrix = math.multiply(this.modelViewMatrix, ND_TranslationMatrix(this.dimN, posNegativa));
        // this.modelViewMatrix = math.identity(this.dimN+1);
    }

    updateProjectionViewMatrix() {
        if (this.perspective) {
            this.projectionModelViewMatrix = math.multiply(this.projectionMatrixResized, this.modelViewMatrix);
        } else {
            this.projectionModelViewMatrix = this.modelViewMatrix;
        }
        // this.projectionModelViewMatrix = math.identity(this.dimN+1);
    }

    lookAt(target = undefined, upMatrix = undefined, forceUpdate = false) {
        // Define the origin as a target if it has not been specified.
        if (target === undefined) {
            target = this.target;
        }

        // "Forward" = camera_position - camera_target.
        // Here, viewForward is still not normalized.
        let viewForward = math.subtract(this.position, target);

        // Checking if viewForward has changed.
        // this.viewForward is also not normalized.
        if (math.norm(math.subtract(this.viewForward, viewForward)) < 1e-6 && !forceUpdate) {
            return;
        }

        // Checking if viewForward has a valid length.
        const lengthForward = math.norm(viewForward);
        if (lengthForward < 1e-6) {
            throw new Error('Camera target is equal to camera position!');
        }

        // Update this.viewForward.
        this.needsUpdate = true;
        this.viewForward = viewForward;

        // Normalize viewForward.
        viewForward = math.divide(viewForward, lengthForward);

        // Create up matrix if necessary.
        if (upMatrix === undefined) {
            upMatrix = math.zeros(this.dimN - 2, this.dimN)
            for (let i = 0; i < (this.dimN - 2); i++) {
                upMatrix.set([this.dimN - 2 - 1 - i, this.dimN - 1 - i], 1);
            }
        }

        // Concatenate upMatrix and viewForward.
        let mat = math.concat([viewForward.toArray()], upMatrix, 0);

        // Compute vectors by performing cross-product and replacing progressively.
        for (let i = 1; i < (this.dimN - 1); i++) {
            const w = math.multiply(NormalizedCrossProduct(this.dimN, mat), ((((i - 1) % 2) === 0) ? -1. : 1.));
            const index = math.index(i, math.range(0, this.dimN));
            mat = mat.subset(index, w);
        }

        // Compute the last vector and append at the end.
        const w = math.multiply(NormalizedCrossProduct(this.dimN, mat), (((((this.dimN - 1) - 1) % 2) === 0) ? -1. : 1.));
        mat = math.concat(mat, [w.toArray()], 0);

        this.lookAtMatrix = mat;

        this.updateViewMatrix();

        this.updateProjectionViewMatrix();

    }

    getMatrixProjecao() {
        //return this.modelViewMatrix;
        return this.projectionModelViewMatrix;
    }
}

class ND_Cameras {
    constructor(N) {
        this.dimN = N;

        this.cameras = [];
        if (N < 4) {
            let camera = new ND_Camera(N, 3, false);
            camera.lookAt(math.zeros(N));
            this.cameras.push(camera);
        } else {
            for (let i = N; i >= 4; i--) {
                //const pos = Array.from({ length: i-1 }, () => 0);
                //pos[i-2] = 3;
                //pos = [0, 0, ..., 0]
                let camera = new ND_Camera(i, 3, (i === 4));
                //console.log(`criando camera ${camera.dimN}D`);
                camera.lookAt(math.zeros(i));
                this.cameras.push(camera);
            }
        }
    }

    lookAtOrigin(forceUpdate = false) {
        this.cameras.forEach((camera) => {
            camera.lookAt(undefined, undefined, forceUpdate)
        });
    }

    centralizeFirstCamera(target) {
        //Move a primeira camera e aponta ela na direção desejada
        this.cameras[0].target = target;
        this.cameras[0].UpdatePos();
        this.cameras[0].lookAt(undefined, undefined, true);

    }

    projectObjects(ndObjs) {
        //console.log(pnts);
        ///const size = math.size(pnts).valueOf();
        ///const cols = size[1];

        for (const ndObj of ndObjs) {
            //console.log(this.cameras.some(camera => camera.needsUpdate));
            if (this.cameras.some(camera => camera.needsUpdate) || ndObj.needsUpdate) {
                if (ndObj.Mesh.visible && ndObj.geometry.vertices.length > 0) {
                    let pnts = ndObj.geometry.vertices;
                    //let profundidades = ndObj.geometriaOriginal.vertices;//Armazenamos as posições nas dimensoes perdidas para o corte dimensional
                    for (let camera of this.cameras) {
                        //console.log(`Projetando camera ${camera.dimN}D`);
                        //adiciona coordenadas homogenias
                        const size = math.size(pnts).valueOf();
                        let pntsH = math.resize(pnts, [size[0], size[1] + 1], 1);
                        //console.log(math.transpose(pntsH));
                        //console.log(camera.getMatrixProjecao());
                        pntsH = math.transpose(math.multiply(camera.getMatrixProjecao(), math.transpose(pntsH)));
                        //console.log(projetadosH);
                        //profundidades = pntsH.toArray().map(vertice => vertice[camera.dimN]);
                        //profundidades = pntsHArray.map();

                        if (camera.dimN > 3) {
                            pnts = pntsH.toArray().map(vertice => math.divide(vertice.slice(0, camera.dimN - 1), vertice[camera.dimN]));
                        } else {
                            pnts = pntsH.toArray().map(vertice => math.divide(vertice.slice(0, camera.dimN), vertice[camera.dimN]));
                        }
                        //console.log(pnts)
                        //console.log(projetados);
                        //console.log('projetou');

                        //camera.needsUpdate = false;
                    }
                    //console.log("Alou!");
                    //console.log(pnts);
                    //console.log(l);
                    ndObj.updateVertices(pnts);
                } else {
                    ndObj.updateVertices([]);
                }
            }
            //console.log("Projetou!")
        }
        this.cameras.forEach((camera) => camera.needsUpdate = false);

        //else {
        //  ndObj.updateVertices(projetados[0]);
        //}
    }
}