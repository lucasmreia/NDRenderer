function ND_TranslationMatrix(N, t) {
    // Generates the translation matrix of dimension N.
    // t must be a vector of dimension N.
    const mat = math.identity(N + 1);
    const index = math.index(math.range(0, N), N);
    return mat.subset(index, t);
}

function ND_ScalingMatrix(N, s) {
    // Generates the scaling matrix of dimension N.
    const mat = math.multiply(math.identity(N + 1), s);
    const index = math.index(N, N);
    return math.subset(mat, index, 1);
}

function ND_RotationMatrix(N, x, y, theta) {
    const mat = math.identity(N);
    const cos = math.cos(theta);
    const sin = math.sin(theta);
    mat.set([x, x], cos);
    mat.set([y, y], cos);
    mat.set([x, y], sin);
    mat.set([y, x], -sin);
    return mat;
}

/**
 * Computes the generalized cross product of (n-1) vectors in R^n.
 * vectors = [v1, v2, ..., v_{n-1}], where each v_i is an array of length n.
 * Returns an array w of length n such that:
 *   - w is orthogonal to each v_i,
 *   - ||w|| = the (n-1)-dim volume spanned by v1,...,v_{n-1},
 *   - sign depends on the orientation.
 */
function NormalizedCrossProduct(N, mat) {
    // Each row of matrix mat represents a vector with N coordinates.
    // mat must have N-1 rows, representing N-1 distinct vectors.
    // In other words, mat must be a (N-1)xN matrix.
    // Performs the generalized cross-product in the (N-1)xN matrix mat, and normalizes the resulting vector.
    // Formally:
    //      w = *(v_{1} ^ v_{2} ^ v_{3} ^ ... ^ v_{n-1}) in R^n
    // where * is the Hodge star and ∧ is the wedge product in exterior algebra.
    // Concretely, with the standard Euclidean metric and orientation, you can compute w via determinants of submatrices.

    // Checking dimensions.
    const size = math.size(mat).valueOf();
    const rows = size[0];
    const cols = size[1];
    if (((cols - rows) !== 1) || (cols !== N)) {
        throw new Error("crossProduct: Matrix must be (N-1)xN, but is " + rows + "x" + cols);
    }

    // Result vector w in R^n.
    const w = math.zeros(N);

    // Uses mat transposed, new mat is Nx(N-1).
    mat = math.transpose(mat);

    // For each row i, remove that row => submatrix of size (n-1) x (n-1).
    // Then w[i] = (-1)^(i) * det(submatrix), with i in 0-based indexing.
    for (let i = 0; i < N; i++) {
        // Build submatrix by skipping row i.
        const selectedRows = math.range(0, N - 1).map(row => ((row >= i) ? (row + 1) : row));
        const index = math.index(selectedRows, math.range(0, N - 1));
        const subM = math.subset(mat, index);
        // subM is now (n-1) rows, each row has (n-1) columns

        const detSubM = math.det(subM);

        // The sign factor: in 0-based indexing, we want (-1)^(i) = (-1)^(i-1) in 1-based
        const sign = (i % 2 === 0) ? 1 : -1;

        w.set([i], sign * detSubM);
    }

    // Checking if w has a valid length.
    const lengthW = math.norm(w);
    if (lengthW < 1e-8) {
        throw new Error('NormalizedCrossProduct: w must have valid length!');
    }

    // Return the normalized vector.
    return math.divide(w, lengthW);
}
