const facebookLoginButton =
    document.getElementById("facebook-login-button");


// se ejecuta cuando termina de carga el sdk de facebook
window.fbAsyncInit = function () {

    window.FB.init({

        appId: "1785520526115078",

        cookie: true,

        xfbml: true,

        version: "v26.0"

    });


    window.FB.AppEvents.logPageView();


    console.log(
        "SDK de Facebook cargado correctamente"
    );

};


// carga sdk de facebook
(function (d, s, id) {

    let js;

    const fjs =
        d.getElementsByTagName(s)[0];


    if (d.getElementById(id)) {

        return;

    }


    js = d.createElement(s);

    js.id = id;

    js.src =
        "https://connect.facebook.net/en_US/sdk.js";


    fjs.parentNode.insertBefore(
        js,
        fjs
    );

}(
    document,
    "script",
    "facebook-jssdk"
));


// botón iniciar sesión con Facebook
facebookLoginButton.addEventListener(
    "click",
    () => {

        if (!window.FB) {

            alert(
                "El SDK de Facebook todavía no está disponible"
            );

            return;

        }


        window.FB.login(

            function (response) {

                console.log(
                    "Respuesta del login:",
                    response
                );


                statusChangeCallback(
                    response
                );

            },

            {
                scope: "public_profile,email"
            }

        );

    }
);


// revisa el resultado del login
function statusChangeCallback(response) {

    if (response.status !== "connected") {

        console.log(
            "No se inició sesión con Facebook"
        );

        alert(
            "No se pudo iniciar sesión con Facebook"
        );

        return;

    }


    console.log(
        "Facebook conectado correctamente"
    );


    obtenerUsuarioFacebook();

}


// consume la API de Facebook
function obtenerUsuarioFacebook() {

    window.FB.api(

        "/me",

        {
            fields: "id,name,email"
        },

        function (response) {

            console.log(
                "Datos obtenidos desde Facebook:",
                response
            );


            if (response.error) {

                console.error(
                    response.error
                );

                alert(
                    "Ocurrió un error al obtener los datos de Facebook"
                );

                return;

            }


            alert(
                "Inicio de sesión correcto\n\n" +
                "Nombre: " +
                response.name +
                "\nEmail: " +
                (response.email || "No disponible")
            );

        }

    );

}