// =====================================
// PULSO NEWS ENGINE v3
// =====================================

const RSS_URL =
"https://api.rss2json.com/v1/api.json?rss_url=";

const FUENTES = {

    general:
    "https://news.google.com/rss?hl=es-419&gl=AR&ceid=AR:es-419",

    sports:
    "https://news.google.com/rss/headlines/section/topic/SPORTS?hl=es-419&gl=AR&ceid=AR:es-419",

    technology:
    "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=es-419&gl=AR&ceid=AR:es-419",

    science:
    "https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=es-419&gl=AR&ceid=AR:es-419",

    business:
    "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=es-419&gl=AR&ceid=AR:es-419",

    weather:
    "https://news.google.com/rss/search?q=clima+argentina&hl=es-419&gl=AR&ceid=AR:es-419"
};

const TRADUCTOR_CATEGORIAS = {

    general: "Noticias Generales",
    sports: "Deportes",
    technology: "Tecnología",
    science: "Ciencia",
    business: "Economía",
    weather: "Clima"

};

let noticiasActuales = [];

let favoritos =
JSON.parse(
localStorage.getItem("news_favs")
) || [];

document.addEventListener(
"DOMContentLoaded",
()=>{

    iniciarModoOscuro();

    if(
        document.getElementById(
        "current-date"
        )
    ){
        mostrarFecha();
    }

    if(
        document.getElementById(
        "featured-section"
        )
    ){

        cargarNoticias(
        "general"
        );

        configurarCategorias();

        configurarBusqueda();

        cargarClimaSemanal();

        cargarTemperaturasArgentina();
    }

});
function mostrarFecha(){

    const opciones = {

        weekday:"long",
        year:"numeric",
        month:"long",
        day:"numeric"

    };

    document
    .getElementById(
    "current-date"
    )
    .innerText =
    new Date()
    .toLocaleDateString(
    "es-AR",
    opciones
    );

}

function iniciarModoOscuro(){

    const boton =
    document.getElementById(
    "dark-mode-toggle"
    );

    if(!boton) return;

    const estado =
    localStorage.getItem(
    "pulso_dark"
    );

    if(
        estado === "true"
    ){
        document.body
        .classList.add(
        "dark-mode"
        );
    }

    boton.addEventListener(
    "click",
    ()=>{

        document.body
        .classList.toggle(
        "dark-mode"
        );

        localStorage.setItem(
        "pulso_dark",
        document.body
        .classList.contains(
        "dark-mode"
        )
        );

    });

}
async function cargarNoticias(
categoria
){

    const featured =
    document.getElementById(
    "featured-section"
    );

    const grid =
    document.getElementById(
    "grid-stories-section"
    );

    featured.innerHTML =
    "<div class='loader'>Construyendo portada editorial...</div>";

    grid.innerHTML = "";

    try{

        const feed =
        FUENTES[categoria] ||
        FUENTES.general;

        const response =
        await fetch(
            RSS_URL +
            encodeURIComponent(
            feed
            )
        );

        const data =
        await response.json();

        if(
            !data.items ||
            data.items.length===0
        ){

            featured.innerHTML =
            "<div class='loader'>No se encontraron noticias.</div>";

            return;
        }

        noticiasActuales =
        data.items.map(
        (item,index)=>{

            return{

                id:index+1,

                title:item.title,

                desc:
                item.description
                .replace(
                /<[^>]+>/g,
                ""
                )
                .slice(
                0,
                240
                ),

                body:
                item.description,

                img:
                obtenerImagen(
                item
                ),

                category:
                categoria,

                date:
                calcularTiempo(
                item.pubDate
                ),

                urlOriginal:
                item.link

            };

        });

        sessionStorage.setItem(
        "noticias_en_cache",
        JSON.stringify(
        noticiasActuales
        )
        );

        renderizarNoticias(
        noticiasActuales
        );

        actualizarBreaking();

    }

    catch(error){

        console.error(
        error
        );

        featured.innerHTML =
        "<div class='loader'>No fue posible obtener noticias.</div>";

    }

}
function obtenerImagen(item){

    if(item.thumbnail){
        return item.thumbnail;
    }

    try{

        const match =
        item.description.match(
        /<img[^>]+src="([^"]+)"/i
        );

        if(match){
            return match[1];
        }

    }catch(e){}

    return `https://picsum.photos/seed/${encodeURIComponent(item.title)}/1200/800`;

}

function renderizarNoticias(
articulos
){

    const featured =
    document.getElementById(
    "featured-section"
    );

    const secondary =
    document.getElementById(
    "secondary-news"
    );

    const grid =
    document.getElementById(
    "grid-stories-section"
    );

    const carousel =
    document.getElementById(
    "carousel-track"
    );

    featured.innerHTML = "";
    secondary.innerHTML = "";
    grid.innerHTML = "";
    carousel.innerHTML = "";

    if(
        articulos.length===0
    ){

        featured.innerHTML =
        "<div class='loader'>Sin resultados.</div>";

        return;
    }

    const principal =
    articulos[0];

    featured.innerHTML = `

    <div
    class="story-card"
    onclick="irANoticia(${principal.id})">

        <img
        src="${principal.img}"
        class="story-img-bg"
        alt="${principal.title}"
        onerror="this.src='https://picsum.photos/1200/800'">

        <div class="story-content">

            <span class="ticker-badge">

                ${TRADUCTOR_CATEGORIAS[
                principal.category
                ]}

            </span>

            <h2>

                ${principal.title}

            </h2>

            <p>

                ${principal.desc}

            </p>

        </div>

    </div>

    `;

    renderizarSecundarias(
    articulos
    );

    renderizarGrilla(
    articulos
    );

    renderizarDestacadas(
    articulos
    );

}
function renderizarSecundarias(
articulos
){

    const contenedor =
    document.getElementById(
    "secondary-news"
    );

    if(!contenedor) return;

    const secundarias =
    articulos.slice(1,3);

    contenedor.innerHTML =
    secundarias.map(
    noticia=>`

    <article
    class="secondary-card"
    onclick="irANoticia(${noticia.id})">

        <img
        src="${noticia.img}"
        alt="${noticia.title}"
        onerror="this.src='https://picsum.photos/600/400'">

        <div>

            <h3>
            ${noticia.title}
            </h3>

            <p>
            ${noticia.desc}
            </p>

        </div>

    </article>

    `
    ).join("");

}

function renderizarGrilla(
articulos
){

    const grid =
    document.getElementById(
    "grid-stories-section"
    );

    articulos
    .slice(3)
    .forEach(
    art=>{

        grid.innerHTML += `

        <article
        class="news-grid-item"
        onclick="irANoticia(${art.id})">

            <div>

                <img
                src="${art.img}"
                alt="${art.title}"
                onerror="this.src='https://picsum.photos/600/400'">

                <h3>

                    ${art.title}

                </h3>

                <p>

                    ${art.desc}

                </p>

            </div>

            <small>

                ${art.date}

            </small>

        </article>

        `;

    });

}
function renderizarDestacadas(
articulos
){

    const carousel =
    document.getElementById(
    "carousel-track"
    );

    articulos
    .slice(0,8)
    .forEach(
    art=>{

        carousel.innerHTML += `

        <div
        class="carousel-item"
        onclick="irANoticia(${art.id})">

            <img
            src="${art.img}"
            alt="${art.title}"
            onerror="this.src='https://picsum.photos/600/400'">

            <div class="carousel-content">

                <h4>

                    ${art.title}

                </h4>

            </div>

        </div>

        `;

    });

}
function actualizarBreaking(){

    const breaking =
    document.getElementById(
    "breaking-text"
    );

    if(
        !breaking ||
        noticiasActuales.length===0
    ) return;

    const urgente =
    noticiasActuales[0];

    breaking.innerHTML =
    urgente.title;

}

function configurarCategorias(){

    document
    .querySelectorAll(
    ".cat-btn"
    )
    .forEach(btn=>{

        btn.addEventListener(
        "click",
        e=>{

            document
            .querySelectorAll(
            ".cat-btn"
            )
            .forEach(
            b=>b.classList.remove(
            "active"
            )
            );

            e.target.classList.add(
            "active"
            );

            const categoria =
            e.target.dataset.category;

            if(categoria){

                cargarNoticias(
                categoria
                );

                actualizarBanner(
                categoria
                );

            }

        });

    });

}

function actualizarBanner(
categoria
){

    const banner =
    document.getElementById(
    "editorial-banner"
    );

    if(!banner) return;

    const titulos = {

        general:
        "◉ CENTRO EDITORIAL",

        sports:
        "◉ DEPORTES",

        technology:
        "◉ TECNOLOGÍA",

        science:
        "◉ CIENCIA",

        business:
        "◉ ECONOMÍA",

        weather:
        "◉ CLIMA"

    };

    const textos = {

        general:
        "Las historias más relevantes del día.",

        sports:
        "Resultados, análisis y protagonistas.",

        technology:
        "Innovación, IA y futuro digital.",

        science:
        "Descubrimientos y avances científicos.",

        business:
        "Mercados, empresas y finanzas.",

        weather:
        "Pronósticos y fenómenos climáticos."
    };

    banner.innerHTML = `

        <h2>
            ${titulos[categoria]}
        </h2>

        <p>
            ${textos[categoria]}
        </p>

    `;

}
function configurarBusqueda(){

    const input =
    document.getElementById(
    "search-input"
    );

    if(!input) return;

    input.addEventListener(
    "input",
    e=>{

        const texto =
        e.target.value
        .toLowerCase()
        .trim();

        if(texto===""){

            renderizarNoticias(
            noticiasActuales
            );

            return;
        }

        const resultados =
        noticiasActuales.filter(
        noticia =>

            noticia.title
            .toLowerCase()
            .includes(texto)

            ||

            noticia.desc
            .toLowerCase()
            .includes(texto)

        );

        renderizarNoticias(
        resultados
        );

    });

}
async function cargarTemperaturasArgentina(){

    const ticker =
    document.getElementById(
    "argentina-temperaturas"
    );

    if(!ticker) return;

    const provincias = [

        "Buenos Aires 17°",
        "Córdoba 15°",
        "Santa Fe 16°",
        "Mendoza 13°",
        "San Luis 14°",
        "La Pampa 12°",
        "Neuquén 10°",
        "Río Negro 9°",
        "Chubut 8°",
        "Santa Cruz 6°",
        "Tierra del Fuego 4°",
        "Entre Ríos 16°",
        "Corrientes 18°",
        "Misiones 19°",
        "Chaco 20°",
        "Formosa 21°",
        "Jujuy 18°",
        "Salta 17°",
        "Tucumán 18°",
        "Catamarca 16°",
        "La Rioja 15°",
        "San Juan 14°",
        "Santiago del Estero 19°"
    ];

    ticker.innerHTML =
    provincias.join(
    " • "
    );

}
window.irANoticia =
function(id){

    location.href =
    `article.html?id=${id}`;

};

function calcularTiempo(
fecha
){

    const publicado =
    new Date(fecha);

    const ahora =
    new Date();

    const horas =
    Math.floor(
        (ahora-publicado)
        /
        (1000*60*60)
    );

    if(horas<1){

        return
        "Hace menos de una hora";

    }

    if(horas===1){

        return
        "Hace 1 hora";

    }

    if(horas<24){

        return
        `Hace ${horas} horas`;

    }

    return publicado
    .toLocaleDateString(
    "es-AR"
    );

}
// =====================================
// CLIMA SEMANAL
// =====================================

async function cargarClimaSemanal(){

    const strip =
    document.getElementById(
    "weather-strip"
    );

    if(!strip) return;

    try{

        const response =
        await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=-31.42&longitude=-64.18&daily=temperature_2m_max,temperature_2m_min&timezone=auto"
        );

        const data =
        await response.json();

        strip.innerHTML =
        data.daily.time
        .slice(0,7)
        .map((dia,i)=>`

            <span>

                ${new Date(dia)
                .toLocaleDateString(
                "es-AR",
                {
                    weekday:"short"
                }
                )}

                ·

                ${Math.round(
                data.daily
                .temperature_2m_max[i]
                )}°

                /

                ${Math.round(
                data.daily
                .temperature_2m_min[i]
                )}°

            </span>

        `)
        .join("");

    }

    catch(error){

        strip.innerHTML =
        "No fue posible obtener el pronóstico.";

    }

}

// =====================================
// FAVORITOS
// =====================================

function guardarFavorito(
id
){

    const existe =
    favoritos.find(
    item=>item===id
    );

    if(existe){

        favoritos =
        favoritos.filter(
        item=>item!==id
        );

    }else{

        favoritos.push(id);

    }

    localStorage.setItem(
    "news_favs",
    JSON.stringify(
    favoritos
    )
    );

}

function obtenerFavoritos(){

    return favoritos;

}

// =====================================
// UTILIDADES
// =====================================

function limpiarHTML(
texto
){

    return texto.replace(
    /<[^>]+>/g,
    ""
    );

}

function truncarTexto(
texto,
limite=220
){

    if(
        texto.length<=limite
    ){
        return texto;
    }

    return texto.slice(
    0,
    limite
    ) + "...";

}

// =====================================
// EFECTO SUAVE DE ENTRADA
// =====================================

function animarEntrada(){

    const tarjetas =
    document.querySelectorAll(
    ".story-card,.news-grid-item,.carousel-item,.secondary-card"
    );

    tarjetas.forEach(
    (card,index)=>{

        card.style.opacity="0";

        card.style.transform=
        "translateY(20px)";

        setTimeout(()=>{

            card.style.transition=
            "all .5s ease";

            card.style.opacity="1";

            card.style.transform=
            "translateY(0)";

        },index*60);

    });

}

// =====================================
// OBSERVADOR DE CAMBIOS
// =====================================

const observer =
new MutationObserver(()=>{

    animarEntrada();

});

window.addEventListener(
"load",
()=>{

    const target =
    document.body;

    observer.observe(
    target,
    {
        childList:true,
        subtree:true
    }
    );

});

// =====================================
// MENSAJE DE CONSOLA
// =====================================

console.log(
"%cPULSO NEWS ENGINE v3",
"font-size:18px;font-weight:bold;color:#cd5334;"
);

console.log(
"Editorial System Loaded"
);

// =====================================
// FIN DEL ARCHIVO
// =====================================
