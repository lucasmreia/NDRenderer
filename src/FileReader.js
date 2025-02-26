// Constants
const perturbation = 1e-8; // Small perturbation value added to each vertex.
const thrZero = 1e-6;      // Threshold to check for zero.

// readNDP Function
/**
 * Reads the content of a .NDP file and returns its geometry.
 * @param {string} content - Content of the .NDP file.
 * @returns {object} Geometry with dimensions, vertices, and faces.
 */
function readNDP(content) {
    // Split the content into nonempty trimmed lines.
    const lines = content.split("\n").filter(line => line.trim().length > 0);

    // Parse header (assumes header tokens are separated by whitespace).
    const headerParts = lines[0].trim().split(/\s+/);
    const N = Number(headerParts[0]);
    // Use headerParts[1] if available; otherwise fall back to headerParts[2]
    const K = Number(headerParts[1] || headerParts[2]);

    // Read vertices.
    const numVertices = Number(lines[1].trim());
    const vertices = [];
    const extremeUp = new Array(N).fill(-Infinity);
    const extremeDown = new Array(N).fill(Infinity);

    for (let i = 0; i < numVertices; i++) {
        const vertex = lines[2 + i].trim().split(/\s+/).map(Number);
        vertices.push(vertex);
        for (let j = 0; j < N; j++) {
            extremeUp[j] = Math.max(extremeUp[j], vertex[j]);
            extremeDown[j] = Math.min(extremeDown[j], vertex[j]);
        }
    }

    // Normalize vertices into the interval [-1, 1].
    const center = extremeUp.map((up, j) => (up + extremeDown[j]) / 2);
    const maxRange = Math.max(
        ...extremeUp.map((up, j) => {
            const r = up - center[j];
            return r > thrZero ? r : 1.0;
        })
    );
    for (let i = 0; i < numVertices; i++) {
        for (let j = 0; j < N; j++) {
            vertices[i][j] = (vertices[i][j] - center[j]) / maxRange;
        }
    }

    // Read faces.
    let lineIndexEdges = 2 + numVertices;
    const faces = [];
    while (lineIndexEdges < lines.length && lines[lineIndexEdges].trim() !== "") {
        const numEdges = Number(lines[lineIndexEdges].trim());
        const edges = [];
        for (let i = 0; i < numEdges; i++) {
            const edge = lines[lineIndexEdges + 1 + i].trim().split(/\s+/).map(Number);
            edges.push(edge);
        }
        faces.push(edges);
        lineIndexEdges += numEdges + 1;
    }

    // Apply a small random perturbation.
    const perturbedVertices = vertices.map(v => v.map(coord => coord + Math.random() * perturbation));

    return {
        N,
        K,
        vertices: perturbedVertices,
        faces,
    };
}

// ArrayKeyedMap Class
/**
 * A custom Map implementation that allows using arrays as keys.
 */
class ArrayKeyedMap extends Map {
    _toKey(array) {
        // Use a simple join – sufficient for arrays of numbers.
        return array.join(',');
    }

    get(array) {
        return super.get(this._toKey(array));
    }

    set(array, value) {
        return super.set(this._toKey(array), value);
    }

    has(array) {
        return super.has(this._toKey(array));
    }

    delete(array) {
        return super.delete(this._toKey(array));
    }
}

// getFaceIndices Function
/**
 * Recursively calculates face indices for a hypercube geometry.
 * @param {Map} verts_dic - Map of vertices to their indices.
 * @param {Array} nmkfaces_dic - Array of face maps for each dimension.
 * @param {object} hypercube - Hypercube geometry.
 * @param {Array} face - Current face to process.
 * @param {number} dim - Current dimension.
 * @returns {Array} Sorted indices for the face.
 */
function getFaceIndices(verts_dic, nmkfaces_dic, hypercube, face, dim) {
    if (dim === 1) {
        const hv = hypercube.vertices;
        const indices = face.map(idx => verts_dic.get(hv[idx].globalLabel));
        indices.sort((a, b) => a - b);
        return indices;
    }

    const dic = nmkfaces_dic[dim - 2];
    const subFaces = hypercube.faces[dim - 2];
    const indices = face.map(edgeIdx =>
        dic.get(getFaceIndices(verts_dic, nmkfaces_dic, hypercube, subFaces[edgeIdx], dim - 1))
    );
    indices.sort((a, b) => a - b);
    return indices;
}

// Progress Indicator Helper
/**
 * Updates the progress indicator in the UI and logs progress.
 * Customize this function to update your progress UI element.
 * @param {number} progress - The current progress percentage (0 to 100).
 */
function updateProgress(progress) {
    const progressElem = document.getElementById("progress");
    if (progressElem) {
        progressElem.textContent = `Progress: ${progress.toFixed(2)}%`;
    }
    console.log(`Progress: ${progress.toFixed(2)}%`);
}

// Async Line Reader with Progress (Chunk-based)
/**
 * Asynchronously reads a Blob (or File) in larger chunks and yields lines.
 * @param {Blob} blob - The file blob.
 * @param {number} chunkSize - Size of each chunk in bytes (default: 1 MB).
 */
async function* getLinesFromFile(blob, chunkSize = 1024 * 1024) {
    const totalBytes = blob.size;
    let offset = 0;
    let remainder = ""; // Stores an incomplete line from the previous chunk.

    while (offset < totalBytes) {
        // Slice a chunk from the file.
        const chunkBlob = blob.slice(offset, offset + chunkSize);
        const chunkText = await chunkBlob.text();
        // Update offset using the actual chunk size.
        offset += chunkBlob.size;

        // Compute progress ensuring it never exceeds 100%.
        const progress = Math.min(100, (offset / totalBytes) * 100);
        updateProgress(progress);

        // Prepend any leftover text from the previous chunk.
        const text = remainder + chunkText;
        const lines = text.split("\n");

        // Save the last line (which may be incomplete) for the next chunk.
        remainder = lines.pop();
        for (const line of lines) {
            yield line;
        }
    }
    // Yield any remaining text as the final line.
    if (remainder.length > 0) {
        yield remainder;
    }
}

// readPOL Function (using Chunk-based Reading)
/**
 * Reads the content of a .POL file and returns its geometry.
 * This version processes the file in a streaming manner (line by line),
 * using larger chunks for faster reading, updating progress, and yielding control
 * for UI responsiveness.
 * @param {Blob} file - The .POL file as a Blob or File object.
 * @returns {Promise<object>} A promise that resolves to the geometry with dimensions, vertices, and faces.
 */
async function readPOL(file) {
    const lineIterator = getLinesFromFile(file);

    // Read header line.
    const headerResult = await lineIterator.next();
    if (headerResult.done) {
        throw new Error("File is empty");
    }
    const headerParts = headerResult.value.trim().split(/\s+/);
    const N = Number(headerParts[0]);
    const K = Number(headerParts[1]);

    // Read subdivisions line.
    const subdivisionsResult = await lineIterator.next();
    if (subdivisionsResult.done) {
        throw new Error("File missing subdivisions line");
    }
    const subdivisions = subdivisionsResult.value.trim().split(/\s+/).map(Number);

    // Initialize dictionaries for unique vertices and faces.
    const verts_dic = new ArrayKeyedMap(); // Maps vertex (array) -> its index.
    const vertices = [];
    const nmkfaces_dic = Array.from({ length: N - K }, () => new ArrayKeyedMap());
    const nmkfaces = Array.from({ length: N - K }, () => []);

    // Initialize extreme coordinate bounds.
    const extremeUp = new Array(N).fill(-Infinity);
    const extremeDown = new Array(N).fill(Infinity);

    let hypercubeCount = 0; // Count of processed hypercube components

    // Process hypercube components on the fly.
    let result = await lineIterator.next();
    while (!result.done) {
        const line = result.value.trim();
        if (line === "") {
            // A blank line signals the start of a block.
            const next1Result = await lineIterator.next();
            if (next1Result.done) break;
            const next1 = next1Result.value.trim();
            if (next1 === "-1") break;
            // Parse hypercube coordinates; skip the first token.
            const parts = next1.split(/\s+/).map(Number);
            const hypercubeCoordinates = parts.slice(1);

            // Next line: number of components.
            const numComponentsResult = await lineIterator.next();
            if (numComponentsResult.done) break;
            const numComponents = Number(numComponentsResult.value.trim());

            for (let j = 0; j < numComponents; j++) {
                // Process one hypercube component.
                const numVerticesResult = await lineIterator.next();
                if (numVerticesResult.done) break;
                const numVerticesLocal = Number(numVerticesResult.value.trim());
                const localVertices = new Array(numVerticesLocal);

                for (let v = 0; v < numVerticesLocal; v++) {
                    const vertexLine = (await lineIterator.next()).value.trim();
                    const parts = vertexLine.split(/\s+/);
                    // The first (K+1) tokens specify a local label.
                    const label = parts.slice(0, K + 1).map(Number);
                    label.sort((a, b) => a - b);
                    // Determine a global label.
                    const globalLabel = new Array(N + K);
                    for (let c = 0; c < N; c++) {
                        globalLabel[c] = (label[0] & (1 << c)) === 0
                            ? hypercubeCoordinates[c]
                            : hypercubeCoordinates[c] + 1;
                    }
                    for (let l = 1; l < K + 1; l++) {
                        globalLabel[N + l - 1] = label[l] - label[l - 1];
                    }
                    const vertexCoordinates = parts.slice(K + 1).map(Number);
                    localVertices[v] = { globalLabel, coordinates: vertexCoordinates };

                    // Add unique vertices.
                    if (!verts_dic.has(globalLabel)) {
                        verts_dic.set(globalLabel, vertices.length);
                        vertices.push(vertexCoordinates);
                        for (let j = 0; j < N; j++) {
                            extremeUp[j] = Math.max(extremeUp[j], vertexCoordinates[j]);
                            extremeDown[j] = Math.min(extremeDown[j], vertexCoordinates[j]);
                        }
                    }
                }

                const localFaces = [];
                // For each face dimension group.
                for (let dim = 0; dim < N - K; dim++) {
                    const numEdgesResult = await lineIterator.next();
                    if (numEdgesResult.done) break;
                    const numEdges = Number(numEdgesResult.value.trim());
                    const edges = new Array(numEdges);
                    for (let e = 0; e < numEdges; e++) {
                        const edgeLineResult = await lineIterator.next();
                        const edge = edgeLineResult.value.trim().split(/\s+/).map(num => Number(num) - 1);
                        edges[e] = edge;
                    }
                    localFaces.push(edges);
                }

                // Build the hypercube object.
                const hypercube = { vertices: localVertices, faces: localFaces };

                // Process faces: add only unique faces.
                for (let dim = 0; dim < N - K; dim++) {
                    for (const face of hypercube.faces[dim]) {
                        const indices = getFaceIndices(verts_dic, nmkfaces_dic, hypercube, face, dim + 1);
                        if (!nmkfaces_dic[dim].has(indices)) {
                            nmkfaces_dic[dim].set(indices, nmkfaces[dim].length);
                            nmkfaces[dim].push(indices);
                        }
                    }
                }

                hypercubeCount++;
                // Yield control every 10 hypercube components to allow the UI to update.
                if (hypercubeCount % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }
        }
        result = await lineIterator.next();
    }

    // Normalize vertices into [-1, 1].
    const center = extremeUp.map((up, j) => (up + extremeDown[j]) / 2);
    const maxRange = Math.max(
        ...extremeUp.map((up, j) => {
            const r = up - center[j];
            return r > thrZero ? r : 1.0;
        })
    );
    for (let i = 0; i < vertices.length; i++) {
        for (let j = 0; j < N; j++) {
            vertices[i][j] = (vertices[i][j] - center[j]) / maxRange;
        }
    }
    console.log("Total unique vertices:", vertices.length);

    // Apply a small random perturbation.
    const perturbedVertices = vertices.map(v => v.map(coord => coord + Math.random() * perturbation));

    return {
        N,
        K,
        vertices: perturbedVertices,
        faces: nmkfaces,
    };
}