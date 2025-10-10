/**
 * squarePyramid.js
 * This library file defines the geometry for a square pyramid.
 */
function squarePyramid() {
    // 2) Bottom face size dx=dz=1, height=1
    // 3) Bottom face is on the xz plane (y=0) and centered at the origin.
    const vertices = new Float32Array([
        // Bottom face (Yellow)
        -0.5, 0.0,  0.5,   0.5, 0.0, -0.5,  -0.5, 0.0, -0.5,
        -0.5, 0.0,  0.5,   0.5, 0.0,  0.5,   0.5, 0.0, -0.5,

        // Front face (Red)
         0.0, 1.0,  0.0,  -0.5, 0.0,  0.5,   0.5, 0.0,  0.5,

        // Right face (Green)
         0.0, 1.0,  0.0,   0.5, 0.0,  0.5,   0.5, 0.0, -0.5,

        // Back face (Blue)
         0.0, 1.0,  0.0,   0.5, 0.0, -0.5,  -0.5, 0.0, -0.5,

        // Left face (Cyan)
         0.0, 1.0,  0.0,  -0.5, 0.0, -0.5,  -0.5, 0.0,  0.5
    ]);

    const colors = new Float32Array([
        // Bottom (Yellow)
        1.0, 1.0, 0.0, 1.0,   1.0, 1.0, 0.0, 1.0,   1.0, 1.0, 0.0, 1.0,
        1.0, 1.0, 0.0, 1.0,   1.0, 1.0, 0.0, 1.0,   1.0, 1.0, 0.0, 1.0,

        // Front (Red)
        1.0, 0.0, 0.0, 1.0,   1.0, 0.0, 0.0, 1.0,   1.0, 0.0, 0.0, 1.0,

        // Right (Green)
        0.0, 1.0, 0.0, 1.0,   0.0, 1.0, 0.0, 1.0,   0.0, 1.0, 0.0, 1.0,

        // Back (Blue)
        0.0, 0.0, 1.0, 1.0,   0.0, 0.0, 1.0, 1.0,   0.0, 0.0, 1.0, 1.0,

        // Left (Cyan)
        0.0, 1.0, 1.0, 1.0,   0.0, 1.0, 1.0, 1.0,   0.0, 1.0, 1.0, 1.0
    ]);

    // 6 triangles * 3 vertices/triangle = 18 vertices
    const numVertices = 18;

    return {
        vertices: vertices,
        colors: colors,
        numVertices: numVertices
    };
}