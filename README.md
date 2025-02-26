### N-Dimensional Renderer

Welcome to the N-Dimensional Renderer, a JavaScript application for visualizing objects in multi-dimensional spaces. This tool allows you to render projections of objects up to N dimensions into 3D space using a simple HTML environment.

### Installation and execution

To run the aplication simply clone the repository, navigate to the directory where you cloned it into and execute the index.html file on your browser

### Known issues

1. When performing a sectional cut of the object, ambiguities can occur. In such cases, ambiguous edges will not be rendered.

2. There is some instability when modifying parameters of projections in high dimensions. For example, the object may "wiggle" when adjusting FoV.

3. If the shape is too big, the program may not be able to load it entirely, ending up with missing vertices/edges, or with wrong edges.