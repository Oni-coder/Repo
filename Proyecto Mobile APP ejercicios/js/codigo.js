


// Variable de estado
let usuarioLogueado = false;
let idUsuarioLogueado;
let apikey = "";
let actividades = [];
let paises = [];
let registros = [];
let map = null;
//Eventos
document.querySelector("#btnRegistrar").addEventListener("click", RegistrarseHandler);
document.querySelector("#router").addEventListener("ionRouteDidChange", navegar);
document.querySelector("#btnLoginIngresar").addEventListener("click", btnLoginIngresarHandler);
document.querySelector("#btnRegistrarActividad").addEventListener("click", btnRegistrarActividadHandler);
document.querySelector("#btnFiltrar").addEventListener("click", PopularRegistros);



//URL API 
const apiBaseURL = "https://movetrack.develotion.com/";
//URL API Imagenes
const apiImgURL = "https://movetrack.develotion.com/imgs/";


const MENU = document.querySelector("#menu");
const NAV = document.querySelector("#nav");
const ROUTER = document.querySelector("#router");
const PANTALLA_HOME = document.querySelector("#home");
const PANTALLA_LOGIN = document.querySelector("#login");
const PANTALLA_REGISTRO = document.querySelector("#registro");
const PANTALLA_AddRegistro = document.querySelector("#AddRegistro");
const PANTALLA_ShowRegistro = document.querySelector("#ShowRegistro");
const PANTALLA_estadisticas = document.querySelector("#estadisticas");
const PANTALLA_mapa = document.querySelector("#mapa");


function getPaises() {
    fetch(apiBaseURL + 'paises.php', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',

        }
    }).then((respuestaDeLaAPI) => {
        if (respuestaDeLaAPI.status === 401) {
            cerrarSesionPorFaltaDeToken();
        } else {
            return respuestaDeLaAPI.json();
        }
    }).then((bodyDeLaRespuesta) => {
        if (bodyDeLaRespuesta?.paises?.length > 0) {
            paises = [];
            bodyDeLaRespuesta.paises.forEach(p => {
                paises.push(Pais.parse(p));
            });
            Popularpaises();
        } else if (bodyDeLaRespuesta?.mensaje) {
            mostrarToast('ERROR', 'Error', "error");
        } else {
            mostrarToast('ERROR', 'Error', 'No hay paises disponibles');
        }
    }).catch(mensaje => console.log(mensaje));
}

function Popularpaises() {

    let opcionesSlc = "";
    paises.forEach(p => {
        opcionesSlc += `<ion-select-option value="${p.id}">${p.name}</ion-select-option>`

    });
    document.querySelector("#txtPais").innerHTML = opcionesSlc;
}



function PopularRegistros() {
    document.querySelector("#RegistrosActividades").innerHTML = "";
    registros = [];
    getActividades();
    fetch(`${apiBaseURL}/registros.php?idUsuario=${localStorage.getItem("UsuarioLogueadoid")}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'apikey': localStorage.getItem("UsuarioLogueadoapikey"),
            'iduser': localStorage.getItem("UsuarioLogueadoid")
        }
    }).then((respuestaDeLaAPI) => {
        if (respuestaDeLaAPI.status === 401) {
            cerrarSesionPorFaltaDeToken();
        } else {
            return respuestaDeLaAPI.json();
        }
    }).then((bodyDeLaRespuesta) => {
        if (bodyDeLaRespuesta?.registros?.length > 0) {
            bodyDeLaRespuesta.registros.forEach(p => {
                registros.push(Registro.parse(p));
            });

            const tiempoTotal = calcularTiempoTotal();
            const tiempoDiario = calcularTiempoDiario();

            document.querySelector("#tiempoTotal").textContent = tiempoTotal;
            document.querySelector("#tiempoDiario").textContent = tiempoDiario;

            // Mostrar los registros

            mostrarlosRegistros();
        } else if (bodyDeLaRespuesta?.mensaje) {
            mostrarToast('ERROR', 'Error', bodyDeLaRespuesta.mensaje);
        } else {
            mostrarToast('ERROR', 'Error', 'Aún no hay registros');
        }
    }).catch(mensaje => console.log(mensaje));
}

function calcularTiempoTotal() {
    let tiempoTotal = 0;


    registros.forEach((r) => {
        tiempoTotal += Number(r.tiempo);
    });

    return tiempoTotal;
}


function calcularTiempoDiario() {
    let tiempoDiario = 0;
    const fechaHoy = new Date();

    registros.forEach((r) => {
        const fechaRegistro = new Date(r.fecha);

        if (
            fechaRegistro.getFullYear() == fechaHoy.getFullYear() &&
            fechaRegistro.getMonth() == fechaHoy.getMonth() &&
            fechaRegistro.getDate() == fechaHoy.getDate()
        ) {
            tiempoDiario += Number(r.tiempo);
        }
    });

    return tiempoDiario;
}








function tagRegistroClickHandler() {
    const idRegistro = this.getAttribute('registro-id');

    if (idRegistro) {
        fetch(`${apiBaseURL}/registros.php?idRegistro=${idRegistro}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'apikey': localStorage.getItem("UsuarioLogueadoapikey"),
                'iduser': localStorage.getItem("UsuarioLogueadoid")
            }
        }).then((respuestaDeLaAPI) => {
            if (respuestaDeLaAPI.status === 401) {
                cerrarSesionPorFaltaDeToken();
            } else {
                return respuestaDeLaAPI.json();
            }
        }).then((bodyDeLaRespuesta) => {
            if (bodyDeLaRespuesta?.mensaje) {
                mostrarToast('SUCCESS', 'EXITO', bodyDeLaRespuesta?.mensaje);
                PopularRegistros();
            } else {
                mostrarToast('ERROR', 'Error', bodyDeLaRespuesta.mensaje);
            }
        }).catch(mensaje => console.log(mensaje));
    }

}
function mostrarlosRegistros() {
    let opcionFiltro = document.querySelector("#filtroFecha").value;
    let listadoRegistros = "<ion-list>";

    let registrosFiltrados = filtroRegistro(opcionFiltro);

    if (registrosFiltrados.length) {
        registrosFiltrados.forEach((r) => {
            listadoRegistros += `
                <ion-item class="ion-item-registro">
                    <ion-thumbnail slot="start">
                        <img src="${apiImgURL + getURLImagen(r.idActividad)}" width="100"/>
                    </ion-thumbnail>
                    <ion-label>
                        <h1>${getNombreActividad(r.idActividad)}</h1>
                        <h2>idRegistro: ${r.id}</h2>
                        <h3>tiempo: ${r.tiempo} minutos.</h3>
                        <h3>fecha: ${r.fecha}</h3>
                        <h4><ion-button registro-id=${r.id} class="btnBorrar" color="warning">Borrar Registro</ion-button></h4>
                    </ion-label>
                </ion-item>
            `;
        });
    } else {
        listadoRegistros += "<p>No hay registros en este período</p>";
    }

    document.querySelector("#RegistrosActividades").innerHTML = listadoRegistros;

    document.querySelectorAll(".btnBorrar").forEach((tp) => {
        tp.addEventListener('click', tagRegistroClickHandler);
    });
}

function filtroRegistro(opcion) {

    const hoy = new Date();
    let fechaLimite;

    switch (opcion) {
        case 'semana':
            // Fecha límite para la última semana
            fechaLimite = new Date(hoy);
            fechaLimite.setDate(hoy.getDate() - 7);
            break;
        case 'mes':
            // Fecha límite para el último mes
            fechaLimite = new Date(hoy);
            fechaLimite.setMonth(hoy.getMonth() - 1);
            break;
        case 'todos':
            // No se filtra, se muestran todos los registros
            return registros;
        default:
            return registros;
    }

    return registros.filter(registro => new Date(registro.fecha) >= fechaLimite);


}

function popularActividades() {
    let opcionesSlc = "";
    actividades.forEach(a => {
        opcionesSlc += `<ion-select-option value="${a.id}">${a.nombre}</ion-select-option>`

    });
    document.querySelector("#slcEjercicio").innerHTML = opcionesSlc;
}


function getActividades() {

    fetch(apiBaseURL + "actividades.php", {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'apikey': localStorage.getItem("UsuarioLogueadoapikey"),
            'iduser': localStorage.getItem("UsuarioLogueadoid")
        }
    }).then((respuestaDeLaAPI) => {
        if (respuestaDeLaAPI.status === 401) {
            cerrarSesionPorFaltaDeToken();
        } else {
            return respuestaDeLaAPI.json();
        }
    }).then((bodyDeLaRespuesta) => {
        if (bodyDeLaRespuesta?.mensaje) {
            mostrarToast('ERROR', 'Error', bodyDeLaRespuesta.mensaje);
        } else if (bodyDeLaRespuesta?.actividades?.length > 0) {
            actividades = [];
            bodyDeLaRespuesta.actividades.forEach(a => {
                actividades.push(Actividad.parse(a));
            });
            popularActividades();

        } else {
            mostrarToast('ERROR', 'Error', 'Por favor, intente nuevamente.');
        }
    }).catch(error => console.log(error));
}

function getURLImagen(idactividad) {
    const actividad = actividades.find(a => a.id == idactividad);
    return actividad ? actividad.imagen + ".png" : "default.png"; // Devuelve imagen por defecto
}

function getNombreActividad(idactividad) {
    const actividad = actividades.find(a => a.id == idactividad);
    return actividad.nombre
}




function btnRegistrarActividadHandler() {
    let actividad = document.querySelector("#slcEjercicio").value;
    let tiempo = document.querySelector("#txtTiempo").value;
    let fecha = document.querySelector("#txtFecha").value;
    if ((actividad && tiempo && fecha)&& tiempo>0) {
        const url = apiBaseURL + "registros.php";
        const bodyDeLaSolicitud = {
            idActividad: actividad,
            idUsuario: localStorage.getItem("UsuarioLogueadoid"),
            tiempo: tiempo,
            fecha: fecha
        };


        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': localStorage.getItem("UsuarioLogueadoapikey"),
                'iduser': localStorage.getItem("UsuarioLogueadoid")
            },
            body: JSON.stringify(bodyDeLaSolicitud)
        }).then((respuestaDeLaAPI) => {

            return respuestaDeLaAPI.json();
        }).then((bodyDeLaRespuesta) => {

            if (bodyDeLaRespuesta.idRegistro) {

                document.querySelector("#txtTiempo").value = "";
                document.querySelector("#txtFecha").value = "";

                mostrarToast('SUCCESS', 'Exito', bodyDeLaRespuesta.mensaje);


            } else if (bodyDeLaRespuesta.mensaje) {
                mostrarToast('ERROR', 'Error', bodyDeLaRespuesta.mensaje);

            }
        }).catch((error) => {
            console.log(error);
            mostrarToast('ERROR', 'Error', 'Por favor, intente nuevamente.');
        });
    } else {
        mostrarToast('ERROR', 'Error', 'Todos los campos son obligatorios y el tiempo debe ser mayor a 0')

    }
}
function RegistrarseHandler() {
    let usuarioIngresado = document.querySelector("#txtUsuario").value;
    let passwordIngresada = document.querySelector("#txtContra").value;
    let paisIngresado = (Number)(document.querySelector("#txtPais").value);
    if (usuarioIngresado && passwordIngresada && paisIngresado) {
        const url = apiBaseURL + "usuarios.php";
        const bodyDeLaSolicitud = {
            usuario: usuarioIngresado,
            password: passwordIngresada,
            pais: paisIngresado
        };


        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyDeLaSolicitud)
        }).then((respuestaDeLaAPI) => {
            return respuestaDeLaAPI.json();
        }).then((bodyDeLaRespuesta) => {
            if (bodyDeLaRespuesta.apiKey) {
                document.querySelector("#txtUsuario").value = "";
                document.querySelector("#txtContra").value = "";
                document.querySelector("#txtPais").value = "";
                apikey = bodyDeLaRespuesta.apiKey;
                localStorage.setItem("UsuarioLogueadoapikey", apikey)
                localStorage.setItem("UsuarioLogueadoid", bodyDeLaRespuesta.id);
                mostrarToast('SUCCESS', 'Registrado correctamente.');

                NAV.setRoot("page-AddRegistro");

            } else if (bodyDeLaRespuesta.mensaje) {
                mostrarToast('ERROR', 'Error', bodyDeLaRespuesta.mensaje);

            }
        }).catch((error) => {
            console.log(error);
            mostrarToast('ERROR', 'Error', 'Por favor, intente nuevamente.');
        });
    } else {
        document.querySelector("#pRegistroMensajes").innerHTML = "Todos los campos son obligatorios.";
    }
}

function actualizarUsuarioLogueadoDesdeLocalStorage() {
    if (localStorage.getItem("UsuarioLogueadoapikey")) {
        usuarioLogueado = true;
    } else {
        usuarioLogueado = false;
    }


}
function navegar(evt) {
    actualizarUsuarioLogueadoDesdeLocalStorage()
    actualizarMenu();
    const pantallaDestino = evt.detail.to;
    switch (pantallaDestino) {
        case "/":
            verificarInicio();
            break;
        case "/login":
            mostrarLogin();
            break;
        case "/registro":
            getPaises();
            mostrarRegistro();
            break;
        case "/AddRegistro":
            getActividades();
            mostrarAddRegistro();


            break;
        case "/ShowRegistro":

            PopularRegistros()
            mostrarShowRegistro();
            break;
        case "/estadisticas":
            PopularRegistros();
            mostrarEstadisticas();

            break;
        case "/mapa":
            mostrarMapa();
            CrearMapa();
            agregarMarcadores();
           
            break;


    }
}
function mostrarAddRegistro() {
    ocultarPantallas();
    PANTALLA_AddRegistro.style.display = "block";
}
function verificarInicio() {
    if (usuarioLogueado) {

        //TODO checkear

        NAV.setRoot("page-AddRegistro");

    } else {
        NAV.setRoot("page-login");

    }
}
function mostrarLogin() {
    ocultarPantallas();
    PANTALLA_LOGIN.style.display = "block";
}

function mostrarEstadisticas() {
    ocultarPantallas();
    PANTALLA_estadisticas.style.display = "block";
}
function mostrarMapa() {
    ocultarPantallas();
    PANTALLA_mapa.style.display = "block";
}
function mostrarRegistro() {
    ocultarPantallas();
    PANTALLA_REGISTRO.style.display = "block";
}
function mostrarShowRegistro() {
    ocultarPantallas();
    PANTALLA_ShowRegistro.style.display = "block";
}
function ocultarPantallas() {
    PANTALLA_LOGIN.style.display = "none";
    PANTALLA_HOME.style.display = "none";
    PANTALLA_REGISTRO.style.display = "none";
    PANTALLA_AddRegistro.style.display = "none";
    PANTALLA_ShowRegistro.style.display = "none";
    PANTALLA_estadisticas.style.display = "none";
    PANTALLA_mapa.style.display = "none";


}
function actualizarMenu() {

    document.querySelector("#btnMenuCerrarSesion").style.display = "none";
    document.querySelector("#btnMenuLogin").style.display = "none";
    document.querySelector("#btnMenuRegistro").style.display = "none";
    document.querySelector("#btnMenuAddRegistro").style.display = "none";
    document.querySelector("#btnMenuShowRegistro").style.display = "none";
    document.querySelector("#btnMenuEstadisticas").style.display = "none";
    document.querySelector("#btnMenuMapa").style.display = "none";
    if (usuarioLogueado) {
        document.querySelector("#btnMenuCerrarSesion").style.display = "block";
        document.querySelector("#btnMenuAddRegistro").style.display = "block";
        document.querySelector("#btnMenuShowRegistro").style.display = "block";
        document.querySelector("#btnMenuEstadisticas").style.display = "block";
        document.querySelector("#btnMenuMapa").style.display = "block";

    } else {
        document.querySelector("#btnMenuLogin").style.display = "block";
        document.querySelector("#btnMenuRegistro").style.display = "block";
    }
}
function cerrarSesion() {
    cerrarMenu();
    usuarioLogueado = false;
    localStorage.clear();
    NAV.setRoot("page-login");

}
function cerrarSesionPorFaltaDeToken() {
    mostrarToast('ERROR', 'No autorizado', 'Se ha cerrado sesión por seguridad.');
    cerrarSesion();
}

function btnLoginIngresarHandler() {
    let usuIngresado = document.querySelector("#txtLoginUsuario").value;
    let passwordIngresado = document.querySelector("#txtLoginPassword").value;

    document.querySelector("#pLoginMensajes").innerHTML = "";

    if (usuIngresado && passwordIngresado) {
        const url = apiBaseURL + "login.php";
        const bodyDeLaSolicitud = {
            usuario: usuIngresado,
            password: passwordIngresado
        };

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyDeLaSolicitud)
        }).then((respuestaDeLaAPI) => {
            return respuestaDeLaAPI.json();
        }).then((bodyDeLaRespuesta) => {
            if (bodyDeLaRespuesta.apiKey) {
                document.querySelector("#txtUsuario").value = "";
                document.querySelector("#txtContra").value = "";
                document.querySelector("#txtPais").value = "";
                apikey = bodyDeLaRespuesta.apiKey;
                idUsuarioLogueado = bodyDeLaRespuesta.id;
                usuarioLogueado = true;
                localStorage.setItem("UsuarioLogueadoapikey", apikey)
                localStorage.setItem("UsuarioLogueadoid", bodyDeLaRespuesta.id);
                mostrarToast('SUCCESS', 'Logueado correctamente.');
                NAV.setRoot("page-AddRegistro");

            } else if (bodyDeLaRespuesta.mensaje) {
                mostrarToast('ERROR', 'Error', bodyDeLaRespuesta.mensaje);
            }
        }).catch((error) => {
            console.log(error);
            mostrarToast('ERROR', 'Error', 'Por favor, intente nuevamente.');
        });
    } else {
        mostrarToast('ERROR', 'Error', "Todos los campos son obligatorios.")
        
    }
}
function cerrarMenu() {
    MENU.close();
}
/* Mensajes */
async function mostrarToast(tipo, titulo, mensaje) {
    const toast = document.createElement('ion-toast');
    toast.header = titulo;
    toast.message = mensaje;
    toast.position = 'bottom';
    toast.duration = 2000;
    if (tipo === "ERROR") {
        toast.color = "danger";
    } else if (tipo === "SUCCESS") {
        toast.color = "success";
    } else if (tipo === "WARNING") {
        toast.color = "warning";
    }

    document.body.appendChild(toast);
    return toast.present();
}




function CrearMapa() {
    if (!map) {
        map = L.map('map').setView([-33, -56], 5); 
        
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        
      
            
    }
}

  function agregarMarcadores(){
   getPaises()
   fetch(apiBaseURL + 'usuariosPorPais.php', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'apikey': localStorage.getItem("UsuarioLogueadoapikey"),
        'iduser': localStorage.getItem("UsuarioLogueadoid")
    }
}).then((respuestaDeLaAPI) => {
    if (respuestaDeLaAPI.status === 401) {
        cerrarSesionPorFaltaDeToken();
    } else {
        return respuestaDeLaAPI.json();
    }
}).then((bodyDeLaRespuesta) => {
    if (bodyDeLaRespuesta?.paises?.length > 0) {
     
        bodyDeLaRespuesta?.paises.forEach(pa => {
            paises.forEach(p => {
                if(p.id==pa.id){
                L.marker([p.latitude, p.longitude]).addTo(map)
                        .bindPopup(`En ${p.name} la cantidad de usuarios es: ${pa.cantidadDeUsuarios}`);
                    }});
      });
      

    } else if (bodyDeLaRespuesta?.mensaje) {
        mostrarToast('ERROR', 'Error', bodyDeLaRespuesta?.mensaje);
    } else {
        mostrarToast('ERROR', 'Error', 'Intente nuevamente porfavor..');
    }
}).catch(mensaje => console.log(mensaje));

 };
