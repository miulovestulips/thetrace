export function showLoadingScreen() {
    document.body.classList.add("loading");
} // agrega clase loading a body detectando loading.css y muestra la pantalla

// quita loading del body
export function hideLoadingScreen() {
    document.body.classList.remove("loading");
}

// muestra pantalla de carfa y despues de 3000 cambia a otra pagina
export function navigateWithLoading(url, delay = 3000) {

    showLoadingScreen();

    setTimeout(() => {
        window.location.href = url; // cambio de pantalla
    }, delay);

}


// Pantalla de carga inicial
window.addEventListener("load", () => {

    setTimeout(() => {
        hideLoadingScreen();
    }, 3000);

});