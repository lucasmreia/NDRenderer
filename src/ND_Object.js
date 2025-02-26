class ND_Object {
    constructor(geometry, cor1 = { cor: "#00c500" }, cor2 = { cor: "#ff00ff" }, parent = undefined) {
        this.geometry = geometry;

        // Domain and codomain dimensions.
        this.dimN = this.geometry.N;
        this.dimK = this.geometry.K;

        // Save colors (wrapped so that dat.GUI can update them).
        this.cor1 = cor1;
        this.cor2 = cor2;

        // The coordinate (between 0 and dimN-1) used for color mapping.
        this.coordColorida = 0;

        // Compute object center, bounding info, etc.
        this.center = math.zeros(this.dimN);
        this.radius = 0;
        this.coordsMinMax = [];
        this.MinMax = { min: 1_000_000, max: -1_000_000 };

        // If this object is a "cut", it uses the parent's min/max.
        this.parent = parent;
        this.computeObjectCenter();

        // Prepare indices.
        // (Assumes that geometry.faces[0] contains the edges as pairs of vertex indices.)
        this.indices = this.geometry.faces[0].flat();

        // --- Create vertices in a single loop ---
        // For each vertex we compute its position and its color based on the mapped coordinate.
        const cor1Color = new THREE.Color(this.cor1.cor);
        const cor2Color = new THREE.Color(this.cor2.cor);
        this.vertices = this.geometry.vertices.map(v => {
            let pos;
            if (Array.isArray(v)) {
                pos = new THREE.Vector3(v[0], v[1], v[2]);
            } else {
                pos = v;
            }
            // Get the value along the coordinate to be color mapped.
            // (If the original vertex is an array, use its element;
            // otherwise, use getComponent on the THREE.Vector3.)
            const value = Array.isArray(v)
                ? v[this.coordColorida]
                : pos.getComponent(this.coordColorida);
            const min = this.coordsMinMax[this.coordColorida].min;
            const max = this.coordsMinMax[this.coordColorida].max;
            const r = ND_Object.mapNumRange(value, min, max, cor1Color.r, cor2Color.r);
            const g = ND_Object.mapNumRange(value, min, max, cor1Color.g, cor2Color.g);
            const b = ND_Object.mapNumRange(value, min, max, cor1Color.b, cor2Color.b);
            return { position: pos, color: new THREE.Color(r, g, b) };
        });

        // --- Set up instanced geometry for cylinders (edges) ---
        // We use Three.js’s CylinderBufferGeometry.
        // By default it is aligned along the Y axis with height=1 and centered at 0.
        // We rotate it so that its “long” axis is along Z and then translate it so that
        // the bottom is at z=0 (i.e. so that its local z coordinate runs from 0 to 1).
        const cylinderGeo = new THREE.CylinderBufferGeometry(1, 1, 1, 8, 1, false);
        // Rotate the cylinder from Y to Z and translate so that local z runs from 0 to 1.
        cylinderGeo.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
        cylinderGeo.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 0.5));

        // Create an instanced geometry for cylinders.
        // We copy over the base attributes (position and normal) and later attach our instance attributes.
        this.cylinderInstGeom = new THREE.InstancedBufferGeometry();
        this.cylinderInstGeom.index = cylinderGeo.index;
        this.cylinderInstGeom.attributes.position = cylinderGeo.attributes.position;
        this.cylinderInstGeom.attributes.normal = cylinderGeo.attributes.normal;
        // Prepare empty instance attributes (will be filled in updateInstancedLineData).
        this.cylinderInstGeom.setAttribute('p1', new THREE.InstancedBufferAttribute(new Float32Array(0), 3));
        this.cylinderInstGeom.setAttribute('p2', new THREE.InstancedBufferAttribute(new Float32Array(0), 3));
        this.cylinderInstGeom.setAttribute('colorA', new THREE.InstancedBufferAttribute(new Float32Array(0), 3));
        this.cylinderInstGeom.setAttribute('colorB', new THREE.InstancedBufferAttribute(new Float32Array(0), 3));

        // Create a custom ShaderMaterial for the cylinders.
        this.cylinderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uRadius: { value: 0.01 },
                uShading3d: { value: 1 }
            },
            vertexShader: ND_Object.cylinderVertexShaderSource,
            fragmentShader: ND_Object.cylinderFragmentShaderSource,
            depthTest: true
        });

        // Create the mesh for the cylinders.
        this.cylinderMesh = new THREE.Mesh(this.cylinderInstGeom, this.cylinderMaterial);
        this.numCylinders = 0;

        // --- Set up instanced geometry for spheres (vertices) ---
        // A simple sphere geometry with radius=1.
        const sphereGeo = new THREE.SphereBufferGeometry(1, 8, 8);
        // Create an instanced geometry for spheres.
        this.sphereInstGeom = new THREE.InstancedBufferGeometry();
        this.sphereInstGeom.index = sphereGeo.index;
        this.sphereInstGeom.attributes.position = sphereGeo.attributes.position;
        this.sphereInstGeom.attributes.normal = sphereGeo.attributes.normal;
        // We add two instance attributes: center and color.
        this.sphereInstGeom.setAttribute('center', new THREE.InstancedBufferAttribute(new Float32Array(0), 3));
        this.sphereInstGeom.setAttribute('color', new THREE.InstancedBufferAttribute(new Float32Array(0), 3));

        // Create the sphere ShaderMaterial.
        this.sphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uRadius: { value: 0.01 },
                uShading3d: { value: 1 }
            },
            vertexShader: ND_Object.sphereVertexShaderSource,
            fragmentShader: ND_Object.sphereFragmentShaderSource,
            depthTest: true
        });

        // Create the sphere mesh.
        this.sphereMesh = new THREE.Mesh(this.sphereInstGeom, this.sphereMaterial);
        this.numSpheres = 0;

        // Build the instanced attribute arrays based on vertices and indices.
        this.updateInstancedLineData();

        // Combine the cylinder and sphere meshes.
        this.Mesh = new THREE.Group();
        this.Mesh.add(this.cylinderMesh);
        this.Mesh.add(this.sphereMesh);

        // Highlighting: render on top if needed.
        this.highlighted = true;
        this.highlightObject();

        this.needsUpdate = false;
    }

    // Combines the creation of instance attribute arrays for cylinders and spheres.
    updateInstancedLineData() {
        // Build cylinder instance data from index pairs
        const numCyl = Math.floor(this.indices.length / 2);
        const p1Array = new Float32Array(numCyl * 3);
        const p2Array = new Float32Array(numCyl * 3);
        const colorAArray = new Float32Array(numCyl * 3);
        const colorBArray = new Float32Array(numCyl * 3);

        for (let i = 0; i < numCyl; i++) {
            const i0 = this.indices[2 * i];
            const i1 = this.indices[2 * i + 1];
            if (i0 < 0 || i0 >= this.vertices.length || i1 < 0 || i1 >= this.vertices.length) continue;

            const v0 = this.vertices[i0];
            const v1 = this.vertices[i1];

            p1Array[3 * i + 0] = v0.position.x;
            p1Array[3 * i + 1] = v0.position.y;
            p1Array[3 * i + 2] = v0.position.z;

            p2Array[3 * i + 0] = v1.position.x;
            p2Array[3 * i + 1] = v1.position.y;
            p2Array[3 * i + 2] = v1.position.z;

            colorAArray[3 * i + 0] = v0.color.r;
            colorAArray[3 * i + 1] = v0.color.g;
            colorAArray[3 * i + 2] = v0.color.b;

            colorBArray[3 * i + 0] = v1.color.r;
            colorBArray[3 * i + 1] = v1.color.g;
            colorBArray[3 * i + 2] = v1.color.b;
        }
        this.numCylinders = numCyl;
        // (Replace the instance attributes with new data.)
        this.cylinderInstGeom.setAttribute('p1', new THREE.InstancedBufferAttribute(p1Array, 3));
        this.cylinderInstGeom.setAttribute('p2', new THREE.InstancedBufferAttribute(p2Array, 3));
        this.cylinderInstGeom.setAttribute('colorA', new THREE.InstancedBufferAttribute(colorAArray, 3));
        this.cylinderInstGeom.setAttribute('colorB', new THREE.InstancedBufferAttribute(colorBArray, 3));
        this.cylinderInstGeom.instanceCount = numCyl;

        // Build sphere instance data (one per unique vertex)
        const numSph = this.vertices.length;
        const centerArray = new Float32Array(numSph * 3);
        const sphereColorArray = new Float32Array(numSph * 3);

        for (let i = 0; i < numSph; i++) {
            const v = this.vertices[i];
            centerArray[3 * i + 0] = v.position.x;
            centerArray[3 * i + 1] = v.position.y;
            centerArray[3 * i + 2] = v.position.z;

            sphereColorArray[3 * i + 0] = v.color.r;
            sphereColorArray[3 * i + 1] = v.color.g;
            sphereColorArray[3 * i + 2] = v.color.b;
        }
        this.numSpheres = numSph;
        this.sphereInstGeom.setAttribute('center', new THREE.InstancedBufferAttribute(centerArray, 3));
        this.sphereInstGeom.setAttribute('color', new THREE.InstancedBufferAttribute(sphereColorArray, 3));
        this.sphereInstGeom.instanceCount = numSph;
    }

    updateUniforms(lineRadius, shading3d) {
        this.cylinderMaterial.uniforms.uRadius.value = lineRadius;
        this.cylinderMaterial.uniforms.uShading3d.value = shading3d ? 1 : 0;
        this.sphereMaterial.uniforms.uRadius.value = lineRadius;
        this.sphereMaterial.uniforms.uShading3d.value = shading3d ? 1 : 0;
    }

    // If highlighted, render the cylinder mesh on top.
    highlightObject() {
        if (this.highlighted) {
            this.cylinderMesh.onBeforeRender = function (renderer) {
                renderer.clearDepth();
            };
        } else {
            this.cylinderMesh.onBeforeRender = function () {};
        }
    }

    updateGeometry(newGeometry) {
        this.geometry = newGeometry;
        this.computeObjectCenter();
        this.needsUpdate = true;
    }

    // Update vertices by combining position creation and color mapping in one loop.
    updateVertices(newVertices) {
        const cor1Color = new THREE.Color(this.cor1.cor);
        const cor2Color = new THREE.Color(this.cor2.cor);
        this.vertices = newVertices.map((v, i) => {
            let pos;
            if (Array.isArray(v)) {
                pos = new THREE.Vector3(v[0], v[1], v[2]);
            } else {
                pos = v;
            }
            const value = Array.isArray(this.geometry.vertices[i])
                ? this.geometry.vertices[i][this.coordColorida]
                : v.position.getComponent(this.coordColorida);
            const min = this.coordsMinMax[this.coordColorida].min;
            const max = this.coordsMinMax[this.coordColorida].max;
            const r = ND_Object.mapNumRange(value, min, max, cor1Color.r, cor2Color.r);
            const g = ND_Object.mapNumRange(value, min, max, cor1Color.g, cor2Color.g);
            const b = ND_Object.mapNumRange(value, min, max, cor1Color.b, cor2Color.b);
            return { position: pos, color: new THREE.Color(r, g, b) };
        });
        this.indices = this.geometry.faces[0].flat();
        this.updateInstancedLineData();
        this.needsUpdate = false;
    }

    // When colors need to be updated (e.g. via the GUI), update each vertex's color in one loop.
    updateColors() {
        if (this.vertices.length === 0) return;
        const cor1Color = new THREE.Color(this.cor1.cor);
        const cor2Color = new THREE.Color(this.cor2.cor);
        for (let i = 0; i < this.vertices.length; i++) {
            const v = this.vertices[i];
            const value = Array.isArray(this.geometry.vertices[i])
                ? this.geometry.vertices[i][this.coordColorida]
                : v.position.getComponent(this.coordColorida);
            const min = this.coordsMinMax[this.coordColorida].min;
            const max = this.coordsMinMax[this.coordColorida].max;
            const r = ND_Object.mapNumRange(value, min, max, cor1Color.r, cor2Color.r);
            const g = ND_Object.mapNumRange(value, min, max, cor1Color.g, cor2Color.g);
            const b = ND_Object.mapNumRange(value, min, max, cor1Color.b, cor2Color.b);
            v.color.setRGB(r, g, b);
        }
        this.indices = this.geometry.faces[0].flat();
        this.updateInstancedLineData();
    }

    gera_GUI(folder) {
        folder.addColor(this.cor1, "cor")
            .name("Color 1")
            .onChange(() => this.updateColors());
        folder.addColor(this.cor2, "cor")
            .name("Color 2")
            .onChange(() => this.updateColors());
        folder.add(this, "coordColorida", 0, this.dimN - 1)
            .name("Coordinate")
            .step(1)
            .onChange(() => this.updateColors());
    }

    computeObjectCenterOnly() {
        this.center = math.zeros(this.dimN);
        this.radius = 0;
        for (let vertice of this.geometry.vertices) {
            if (math.norm(vertice) > this.radius) {
                this.radius = math.norm(vertice);
            }
            this.center = math.add(this.center, vertice);
        }
        this.center = math.divide(this.center, this.geometry.vertices.length);
    }

    computeObjectCenter() {
        if (this.parent === undefined) {
            this.computeObjectCenterAndMinMax();
        } else {
            this.coordsMinMax = this.parent.coordsMinMax;
            this.MinMax = this.parent.MinMax;
            this.computeObjectCenterOnly();
        }
    }

    computeObjectCenterAndMinMax() {
        this.center = math.zeros(this.dimN);
        this.radius = 0;
        this.coordsMinMax = [];
        this.MinMax = { min: 1_000_000, max: -1_000_000 };
        for (let i = 0; i < this.dimN; i++) {
            this.coordsMinMax[i] = { min: 1_000_000, max: -1_000_000 };
        }
        for (let vertice of this.geometry.vertices) {
            for (let i = 0; i < this.dimN; i++) {
                if (vertice[i] < this.coordsMinMax[i].min) {
                    this.coordsMinMax[i].min = vertice[i];
                }
                if (vertice[i] > this.coordsMinMax[i].max) {
                    this.coordsMinMax[i].max = vertice[i];
                }
            }
            if (math.norm(vertice) > this.radius) {
                this.radius = math.norm(vertice);
            }
            this.center = math.add(this.center, vertice);
        }
        this.center = math.divide(this.center, this.geometry.vertices.length);
        this.MinMax = {
            min: this.coordsMinMax.reduce((menor, minmax) => (minmax.min < menor ? minmax.min : menor), this.coordsMinMax[0].min),
            max: this.coordsMinMax.reduce((maior, minmax) => (minmax.max > maior ? minmax.max : maior), this.coordsMinMax[0].max)
        };
    }

    // Helper: Map a number from one range to another.
    static mapNumRange(num, inMin, inMax, outMin, outMax) {
        return ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    }
}

// --------------------------------------------------------------------
// Shader sources defined as static properties of ND_Object
// --------------------------------------------------------------------
ND_Object.cylinderVertexShaderSource = `
//uniform mat4 modelViewMatrix;
//uniform mat4 projectionMatrix;
uniform float uRadius;

//attribute vec3 position; // from the unit cylinder geometry
//attribute vec3 normal;
attribute vec3 p1;      // instance attribute: endpoint A
attribute vec3 p2;      // instance attribute: endpoint B
attribute vec3 colorA;  // instance attribute: color at A
attribute vec3 colorB;  // instance attribute: color at B

varying vec3 vColor;
varying vec3 vNormal;

void main() {
    // Compute direction and length of the cylinder
    vec3 d = p2 - p1;
    float len = length(d);
    float localZ = position.z; // assume z in [0,1] in our unit cylinder
    vColor = mix(colorA, colorB, localZ);
    
    if (len < 1e-8) {
       gl_Position = projectionMatrix * modelViewMatrix * vec4(p1, 1.0);
       vNormal = vec3(0.0, 0.0, 1.0);
       return;
    }
    
    vec3 nd = d / len;
    float c = dot(vec3(0.0, 0.0, 1.0), nd);
    c = clamp(c, -1.0, 1.0);
    float angle = acos(c);
    vec3 axis = cross(vec3(0.0, 0.0, -1.0), nd);
    if (length(axis) < 1e-8) {
        axis = (c < 0.0) ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 0.0, 1.0);
        angle = (c < 0.0) ? 3.14159 : 0.0;
    }
    axis = normalize(axis);
    float s = sin(angle);
    float oc = 1.0 - c;
    mat3 R = mat3(
         oc * axis.x * axis.x + c,         oc * axis.x * axis.y - axis.z * s, oc * axis.x * axis.z + axis.y * s,
         oc * axis.y * axis.x + axis.z * s,   oc * axis.y * axis.y + c,       oc * axis.y * axis.z - axis.x * s,
         oc * axis.z * axis.x - axis.y * s,   oc * axis.z * axis.y + axis.x * s, oc * axis.z * axis.z + c
    );
    
    // Scale local x,y by uRadius and z by the instance length
    vec3 localPos = vec3(position.x * uRadius, position.y * uRadius, position.z * len);
    vec3 rotatedPos = R * localPos;
    vec3 worldPos = p1 + rotatedPos;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
    
    // Transform the normal
    vec3 scaledNormal = vec3(normal.x * uRadius, normal.y * uRadius, normal.z * len);
    vec3 rotatedNormal = normalize(R * scaledNormal);
    // (Here we assume that modelViewMatrix is the model-view matrix)
    vec4 viewNormal = modelViewMatrix * vec4(rotatedNormal, 0.0);
    vNormal = normalize(viewNormal.xyz);
}
`;

ND_Object.cylinderFragmentShaderSource = `
uniform int uShading3d;
varying vec3 vColor;
varying vec3 vNormal;
void main() {
   if(uShading3d != 0) {
      vec3 N = normalize(vNormal);
      float diff = max(dot(N, vec3(0.0, 0.0, 1.0)), 0.0);
      vec3 shaded = vColor * (0.2 + 0.8 * diff);
      gl_FragColor = vec4(shaded, 1.0);
   } else {
      gl_FragColor = vec4(vColor, 1.0);
   }
}
`;

ND_Object.sphereVertexShaderSource = `
//uniform mat4 modelViewMatrix;
//uniform mat4 projectionMatrix;
uniform float uRadius;

//attribute vec3 position; // from the unit sphere geometry
//attribute vec3 normal;
attribute vec3 center;   // instance attribute: center of the sphere
attribute vec3 color;    // instance attribute: color

varying vec3 vColor;
varying vec3 vNormal;

void main() {
    vColor = color;
    vec3 scaledPos = position * uRadius;
    vec3 worldPos = center + scaledPos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
    
    vec4 viewNormal = modelViewMatrix * vec4(normal, 0.0);
    vNormal = normalize(viewNormal.xyz);
}
`;

ND_Object.sphereFragmentShaderSource = `
uniform int uShading3d;
varying vec3 vColor;
varying vec3 vNormal;
void main() {
   if(uShading3d != 0) {
      vec3 N = normalize(vNormal);
      float diff = max(dot(N, vec3(0.0, 0.0, 1.0)), 0.0);
      gl_FragColor = vec4(vColor * (0.2 + 0.8 * diff), 1.0);
   } else {
      gl_FragColor = vec4(vColor, 1.0);
   }
}
`;
