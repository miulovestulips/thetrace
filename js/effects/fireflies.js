// cantidad de luciernagas por esquina, en total seran 28 luciernagas
const FIREFLIES_PER_CORNER = 7;

// zonas donde apareceran las luciernagas en %
const corners = {
    topLeft: {
        top: [2, 20],
        left: [2, 20]
    },

    topRight: {
        top: [2, 20],
        left: [80, 98]
    },

    bottomLeft: {
        top: [80, 98],
        left: [2, 20]
    },

    bottomRight: {
        top: [80, 98],
        left: [80, 98]
    }
};

// sistema para generar diferencias aleatorias entre luciernagas, para que no se vean todas iguales
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// crea una sola luciernaga
function createFirefly(corner) {

    // busca el contenedor puesto en index.html
    const container = document.getElementById("fireflies-container");

    const firefly = document.createElement("div");
    const light = document.createElement("div");

    // firefly controla posicion y movimiento || firefly-light controla apariencia, tamaño y brillo
    firefly.classList.add("firefly");
    light.classList.add("firefly-light");

    // mete efecto luz dentro de luciernaga
    firefly.appendChild(light);

    // Posición aleatoria
    firefly.style.top =
        `${random(corner.top[0], corner.top[1])}%`;

    firefly.style.left =
        `${random(corner.left[0], corner.left[1])}%`;

    // Movimiento aleatorio
    firefly.style.animationDuration =
        `${random(4, 8)}s`;

    firefly.style.animationDelay =
        `${random(-5, 0)}s`;

    // Tamaño entre 20px y 40px, para que no se vean todas iguales
    const size = random(20, 40);

    light.style.width = `${size}px`;
    light.style.height = `${size}px`;

    // Brillo animacion entre 1.2s y 2.5s, para que no se vean todas iguales
    light.style.animationDuration =
        `${random(1.2, 2.5)}s`;

    // que no todas brillen al mismo tiempo
    light.style.animationDelay =
        `${random(-2, 0)}s`;

    // mete luciernaga en contenedor
    container.appendChild(firefly);
}

// crea todas las luciernagas
function createFireflies() {

    // recorre las cuatro esquinas y crea 7 luciernagas en cada una
    Object.values(corners).forEach((corner) => {

        for (let i = 0; i < FIREFLIES_PER_CORNER; i++) {
            createFirefly(corner);
        }

    });

}


createFireflies();