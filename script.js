
const boton = document.querySelector("button");
const nombre = document.querySelector("#nombre");
const color = document.querySelector("#color");
const categoria = document.querySelector("#categoria");
const foto = document.querySelector("#foto");
const recuadroFoto = document.querySelector(".foto-prenda");
const imagenPrevia = document.querySelector("#imagen-previa");
const zoom = document.querySelector("#zoom");

if (recuadroFoto) {
    recuadroFoto.addEventListener("click", function() {
        foto.click();
    });
}

if (foto) {

    foto.addEventListener("change", function() {

        const archivo = foto.files[0];

        if (archivo) {

            imagenPrevia.src = URL.createObjectURL(archivo);

        }

    });

}

function reducirFoto(archivo, maximo = 1200, calidad = 0.8) {
    return new Promise(function(resolve) {
        const imagen = new Image();

        imagen.onload = function() {
            let ancho = imagen.width;
            let alto = imagen.height;

            if (ancho > maximo || alto > maximo) {
                if (ancho > alto) {
                    alto = alto * (maximo / ancho);
                    ancho = maximo;
                } else {
                    ancho = ancho * (maximo / alto);
                    alto = maximo;
                }
            }

            const canvas = document.createElement("canvas");
            canvas.width = ancho;
            canvas.height = alto;

            const contexto = canvas.getContext("2d");
            contexto.drawImage(imagen, 0, 0, ancho, alto);

            canvas.toBlob(function(blob) {
                resolve(blob);
            }, "image/jpeg", calidad);
        };

        imagen.src = URL.createObjectURL(archivo);
    });
}

let moviendo = false;
let inicioX;
let inicioY;
let posicionX = 0;
let posicionY = 0;

let zoomActual = 1;
let distanciaInicial = null;

const dedos = new Map();

function aplicarTransformacion() {
    imagenPrevia.style.transform =
        `translate(${posicionX}px, ${posicionY}px) scale(${zoomActual})`;
}

function calcularDistancia() {
    const puntos = Array.from(dedos.values());

    if (puntos.length < 2) return null;

    const dx = puntos[1].x - puntos[0].x;
    const dy = puntos[1].y - puntos[0].y;

    return Math.sqrt(dx * dx + dy * dy);
}

if (imagenPrevia) {

    imagenPrevia.addEventListener("pointerdown", function(e) {

        dedos.set(e.pointerId, {
            x: e.clientX,
            y: e.clientY
        });

        if (dedos.size === 1) {

            moviendo = true;

            inicioX = e.clientX - posicionX;
            inicioY = e.clientY - posicionY;

        }

        if (dedos.size === 2) {

            moviendo = false;
            distanciaInicial = calcularDistancia();

        }

        imagenPrevia.setPointerCapture(e.pointerId);

    });

    imagenPrevia.addEventListener("pointermove", function(e) {

        if (!dedos.has(e.pointerId)) return;

        dedos.set(e.pointerId, {
            x: e.clientX,
            y: e.clientY
        });

        if (dedos.size === 1 && moviendo) {

            posicionX = e.clientX - inicioX;
            posicionY = e.clientY - inicioY;

            aplicarTransformacion();
        }

        if (dedos.size === 2 && distanciaInicial) {

            const distanciaActual = calcularDistancia();

            if (distanciaActual) {

                const factor = distanciaActual / distanciaInicial;

                zoomActual = Math.min(3, Math.max(1, zoomActual * factor));

                distanciaInicial = distanciaActual;

                aplicarTransformacion();
            }
        }

    });

    imagenPrevia.addEventListener("pointerup", function(e) {

        dedos.delete(e.pointerId);

        if (dedos.size < 2) {
            distanciaInicial = null;
        }

        if (dedos.size === 0) {
            moviendo = false;
        }

    });

    imagenPrevia.addEventListener("pointercancel", function(e) {

        dedos.delete(e.pointerId);

        if (dedos.size < 2) {
            distanciaInicial = null;
        }

        if (dedos.size === 0) {
            moviendo = false;
        }

    });
}

if (imagenPrevia) {

    imagenPrevia.addEventListener("wheel", function(e) {

        e.preventDefault();

        if (e.deltaY < 0) {
            zoomActual += 0.1;
        } else {
            zoomActual -= 0.1;
        }

        zoomActual = Math.min(3, Math.max(1, zoomActual));

        aplicarTransformacion();

    }, { passive: false });

}


const listaPrendas = document.querySelector("#lista-prendas");
const busqueda = document.querySelector("#busqueda");
const resultadosBusqueda = document.querySelector("#resultados-busqueda");

const categorias = document.querySelector(".categorias");
const botonAnadir = document.querySelector("#boton-anadir");

let prendas = JSON.parse(localStorage.getItem("prendas")) || [];
let indiceEditando = null;

const parametrosEditar = new URLSearchParams(window.location.search);
const indiceEditar = parametrosEditar.get("editar");

if (indiceEditar !== null && prendas[indiceEditar]) {

    indiceEditando = Number(indiceEditar);

    nombre.value = prendas[indiceEditando].nombre;
    color.value = prendas[indiceEditando].color;
    categoria.value = prendas[indiceEditando].categoria;

    boton.textContent = "GUARDAR CAMBIOS";
}


function crearPrenda(textoNombre, textoColor, archivoFoto, indice, textoCategoria) {

    const nuevaPrenda = document.createElement("div");
    nuevaPrenda.classList.add("prenda");

    const prendaGuardada = prendas[indice];
    
   if (archivoFoto) {

    const zonaFoto = document.createElement("div");
    zonaFoto.classList.add("zona-foto");

    const imagen = document.createElement("img");

    
    if (typeof archivoFoto === "string") {
        imagen.src = archivoFoto;
    } else {
        imagen.src = URL.createObjectURL(archivoFoto);
    } 

    if (prendaGuardada && prendaGuardada.zoom) {
    imagen.style.transform =
    `translate(${prendaGuardada.posicionX}px, ${prendaGuardada.posicionY}px) scale(${prendaGuardada.zoom})`;
    }
    
    zonaFoto.appendChild(imagen);
    nuevaPrenda.appendChild(zonaFoto);

    imagen.addEventListener("click", function() {
    abrirImagen(prendaGuardada.foto);
});
    }

    const nombrePrenda = document.createElement("p");
    nombrePrenda.classList.add("nombre-prenda");
    nombrePrenda.textContent = textoNombre;
    nuevaPrenda.appendChild(nombrePrenda);

    const colorPrenda = document.createElement("p");
    colorPrenda.classList.add("color-prenda");
    colorPrenda.textContent = textoColor;
    nuevaPrenda.appendChild(colorPrenda);

    
const contenedorBotones = document.createElement("div");
contenedorBotones.classList.add("botones-prenda");

const botonEditar = document.createElement("button");
botonEditar.textContent = "EDITAR";
contenedorBotones.appendChild(botonEditar);

botonEditar.addEventListener("click", function() {

    window.location.replace("./anadir-prenda.html?editar=" + indice);
});

const botonEliminar = document.createElement("button");
botonEliminar.textContent = "ELIMINAR";
contenedorBotones.appendChild(botonEliminar);

    nuevaPrenda.appendChild(contenedorBotones);

   botonEliminar.addEventListener("click", function() {

    const posicion = prendas.indexOf(prendaGuardada);

    if (posicion !== -1) {
        prendas.splice(posicion, 1);
    }

    localStorage.setItem("prendas", JSON.stringify(prendas));

    nuevaPrenda.remove();
});
    
    listaPrendas.appendChild(nuevaPrenda); 
}

if (boton) {

boton.addEventListener("click", function() {

    const textoNombre = nombre.value;
    const textoColor = color.value; 
    const archivoFoto = foto.files[0];
    const textoCategoria = categoria.value;

    if (textoCategoria === "") { alert("Selecciona una categoría"); return; }
    
   // boton.disabled = true;



 if (indiceEditando !== null) {

    prendas[indiceEditando].nombre = textoNombre;
    prendas[indiceEditando].color = textoColor;
    prendas[indiceEditando].categoria = textoCategoria;

    localStorage.setItem("prendas", JSON.stringify(prendas));

    listaPrendas.innerHTML = "";

    prendas.forEach(function(prenda, indice) {
        if (!document.body.classList.contains("pantalla-anadir")) {
        crearPrenda(textoNombre, textoColor, archivoFoto, prendas.length - 1, textoCategoria);
        }
    });

    indiceEditando = null;
    boton.textContent = "AÑADIR PRENDA";

    window.location.replace("prendas.html?categoria=" + textoCategoria);

    return;
 }


    reducirFoto(archivoFoto).then(function(fotoReducida) {
    const lector = new FileReader();    
    
    lector.onload = function() {

    prendas.push({
    nombre: textoNombre,
    color: textoColor,
    categoria: textoCategoria,
    foto: lector.result,
    zoom: zoomActual,
    posicionX: posicionX,
    posicionY: posicionY
});

    try {   
    alert("ESPACIO: " + localStorage.length);
    localStorage.setItem("prendas", JSON.stringify(prendas));  
    
} catch (error) {

}


    if (document.body.classList.contains("pantalla-anadir")) {
    window.location.replace("prendas.html?categoria=" + textoCategoria);
    return;
}

    if (!document.body.classList.contains("pantalla-anadir")) {
        crearPrenda(
            textoNombre,
            textoColor,
            lector.result,
            prendas.length - 1,
            textoCategoria
        );
    }

};

lector.readAsDataURL(fotoReducida);
});

});

}

if (listaPrendas && !document.body.classList.contains("pantalla-anadir")) {

    prendas.forEach(function(prenda, indice) {
        crearPrenda(prenda.nombre, prenda.color, prenda.foto, indice, prenda.categoria);
    });

}

function mostrarCategoria(nombreCategoria) {

    listaPrendas.innerHTML = "";

    prendas.forEach(function(prenda, indice) {

        if (prenda.categoria && prenda.categoria.trim() === nombreCategoria.trim()) {
            crearPrenda(
                prenda.nombre,
                prenda.color,
                prenda.foto,
                indice,
                prenda.categoria
            );
        }

    });
}
const parametros = new URLSearchParams(window.location.search);
const categoriaSeleccionada = parametros.get("categoria");

const tituloCategoria = document.querySelector("#titulo-categoria");

if (tituloCategoria && categoriaSeleccionada) {

    const nombresCategorias = {
        camiseta: "CAMISETAS",
        camisa: "CAMISAS / JERSEIS",
        pantalon: "PANTALONES",
        vestido: "VESTIDOS",
        chaqueta: "CHAQUETAS",
        zapato: "ZAPATOS"
    };

    tituloCategoria.textContent =
        nombresCategorias[categoriaSeleccionada] || "";
}

if (categoriaSeleccionada) {
    mostrarCategoria(categoriaSeleccionada);
}

if (busqueda) {

    busqueda.addEventListener("input", function() {
 

        const textoBuscado = busqueda.value.toLowerCase();
if (textoBuscado === "") {
    categorias.style.display = "";
    botonAnadir.style.display = "";
    resultadosBusqueda.innerHTML = "";
    return;
}

    categorias.style.display = "none";
    botonAnadir.style.display = "none";
    

        resultadosBusqueda.innerHTML = "";

        const resultados = prendas.filter(function(prenda) {

            return prenda.nombre.toLowerCase().includes(textoBuscado) ||
                   prenda.color.toLowerCase().includes(textoBuscado);

        });

        resultados.forEach(function(prenda) {

            const resultado = document.createElement("div");
         resultado.classList.add("resultado-busqueda");

 if (prenda.foto) {

    const zonaFoto = document.createElement("div");
    zonaFoto.classList.add("foto-resultado");
    const imagen = document.createElement("img");
    imagen.src = prenda.foto;

    if (prenda.zoom) {


    imagen.style.transform =
        `translate(${prenda.posicionX}px, ${prenda.posicionY}px) scale(${prenda.zoom})`;
}

    zonaFoto.appendChild(imagen);
    resultado.appendChild(zonaFoto);
}

            const nombrePrenda = document.createElement("p");
            nombrePrenda.textContent = prenda.nombre;
            resultado.appendChild(nombrePrenda);

            const colorPrenda = document.createElement("p");
            colorPrenda.textContent = prenda.color;
            resultado.appendChild(colorPrenda);

            resultadosBusqueda.appendChild(resultado);

        });

    });

}
function abrirImagen(src) {

    const ventana = document.createElement("div");
    ventana.classList.add("ventana-imagen");

    const imagenGrande = document.createElement("img");
    imagenGrande.src = src;

    ventana.appendChild(imagenGrande);
    document.body.appendChild(ventana);

    ventana.addEventListener("click", function() {
        ventana.remove();
    });
}
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
}
