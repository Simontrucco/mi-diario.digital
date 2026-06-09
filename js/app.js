// --- CONFIGURACIÓN DE LA API REAL ---
const API_KEY = "9f4d61627adf45eb9f3996fb8203b66d";
// Filtramos por el país "ar" (Argentina) para priorizar la agenda local
const BASE_URL = "https://newsapi.org/v2/top-headlines?country=ar&apiKey=" + API_KEY;

// Mapeo para traducir las categorías técnicas de la API a tu menú estético
const TRADUCTOR_CATEGORIAS = {
    "general": "Todas las Crónicas",
    "technology": "Tecnología",
    "science": "Ciencia y Clima",
    "sports": "Deportes",
    "business": "Economía y Mercados"
};

let noticiasActuales = [];
let favoritos = JSON.parse(localStorage.getItem('news_favs')) || [];

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('current-date')) displayDate();
    if (document.getElementById('featured-section')) {
        // Carga inicial con noticias generales de Argentina
        cargarNoticiasReales("general");
        setupCategories();
        setupSearch();
    }
});

function displayDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').innerText = new Date().toLocaleDateString('es-AR', options);
}

// --- FUNCIÓN ASÍNCRONA PARA CONECTARSE A INTERNET ---
async function cargarNoticiasReales(categoria) {
    const featuredSec = document.getElementById('featured-section');
    const gridSec = document.getElementById('grid-stories-section');
    
    featuredSec.innerHTML = "<div class='loader'>Conectando con agencias de noticias...</div>";
    gridSec.innerHTML = "";

    try {
        // Si la categoría es 'general', llamamos al endpoint principal. Si no, le sumamos el filtro de categoría.
        let url = BASE_URL;
        if (categoria !== "general") {
            url += `&category=${categoria}`;
        }

        const respuesta = await fetch(url);
        const datos = await respuesta.json();

        if (datos.status === "ok" && datos.articles.length > 0) {
            // Filtramos historias para evitar notas rotas o que vengan sin imagen de portada
            noticiasActuales = datos.articles.filter(art => art.title && art.urlToImage && art.description);
            
            // Adaptamos la estructura de la API a una ID interna simple para que funcione tu sistema de Favoritos e ID de lectura
            noticiasActuales = noticiasActuales.map((art, index) => ({
                id: index + 1,
                title: art.title,
                desc: art.description,
                category: categoria,
                img: art.urlToImage,
                date: calcularTiempo(art.publishedAt),
                body: `<p>${art.description}</p><p>${art.content || 'Para leer la cobertura completa de este evento periodístico, puedes consultar la fuente original distribuida por las agencias asociadas.'}</p>`,
                urlOriginal: art.url
            }));

            // Guardamos las noticias en el SessionStorage para que el archivo article.html pueda leerlas de inmediato
            sessionStorage.setItem('noticias_en_cache', JSON.stringify(noticiasActuales));

            renderNews(noticiasActuales);
        } else {
            featuredSec.innerHTML = "<div class='loader'>No se encontraron noticias reales para esta categoría hoy.</div>";
        }
    } catch (error) {
        console.error("Error al conectar con NewsAPI:", error);
        featuredSec.innerHTML = "<div class='loader'>Error de conexión. Asegúrate de estar usando un servidor local (Live Server) o revisa tu cuota de API.</div>";
    }
}

// Renderizado en tu maquetación asimétrica
function renderNews(articulos) {
    const featuredSec = document.getElementById('featured-section');
    const gridSec = document.getElementById('grid-stories-section');
    const carouselTrack = document.getElementById('carousel-track');

    featuredSec.innerHTML = "";
    gridSec.innerHTML = "";
    carouselTrack.innerHTML = "";

    if (articulos.length === 0) {
        featuredSec.innerHTML = "<div class='loader'>No hay crónicas disponibles bajo este criterio.</div>";
        return;
    }

    // 1. Noticia Principal Central (La más reciente o importante)
    const principal = articulos[0];
    const isFavPrincipal = favoritos.includes(principal.title) ? '★' : '☆'; // Usamos el título como firma única
    
    featuredSec.innerHTML = `
        <div class="story-card" onclick="irANoticia(${principal.id})">
            <img src="${principal.img}" class="story-img-bg" alt="Portada">
            <div class="story-content">
                <span class="ticker-badge" style="background-color: var(--accent); color: white; padding: 4px 10px; border-radius: 4px; font-weight: 700;">
                    ${TRADUCTOR_CATEGORIAS[principal.category].toUpperCase()}
                </span>
                <h2>${principal.title}</h2>
                <p>${principal.desc}</p>
                <button class="fav-btn" onclick="event.stopPropagation(); toggleFavorite('${principal.title}')">${isFavPrincipal} Guardar en mi colección</button>
            </div>
        </div>
    `;

    // 2. Grilla Inferior de Noticias Reales Restantes
    const secundarias = articulos.slice(1);
    secundarias.forEach(art => {
        const isFav = favoritos.includes(art.title) ? '★' : '☆';
        gridSec.innerHTML += `
            <article class="news-grid-item" onclick="irANoticia(${art.id})">
                <div>
                    <img src="${art.img}" alt="Noticia">
                    <span style="font-size:0.85rem; color:var(--accent); font-weight:700; text-transform:uppercase; letter-spacing:1px;">
                        ${TRADUCTOR_CATEGORIAS[art.category]}
                    </span>
                    <h3 style="margin-top:8px;">${art.title}</h3>
                    <p>${art.desc}</p>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                    <button class="fav-btn" onclick="event.stopPropagation(); toggleFavorite('${art.title}')">${isFav}</button>
                    <small style="color:var(--text-muted); font-weight:700;">${art.date}</small>
                </div>
            </article>
        `;
    });

    // 3. Otras Historias Destacadas (Fijas en el pie de página basadas en el pool general)
    articulos.slice(0, 4).forEach(art => {
        carouselTrack.innerHTML += `
            <div class="carousel-item" onclick="irANoticia(${art.id})">
                <img src="${art.img}" alt="Miniatura">
                <div class="carousel-content">
                    <span style="font-size:0.8rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">
                        ${TRADUCTOR_CATEGORIAS[art.category]}
                    </span>
                    <h4 style="margin-top:8px;">${art.title}</h4>
                </div>
            </div>
        `;
    });
}

function setupCategories() {
    const buttons = document.querySelectorAll('.cat-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            buttons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const cat = e.target.getAttribute('data-category');
            const isFavView = e.target.getAttribute('data-id') === 'favorites';

            if (isFavView) {
                // Filtrar por favoritos guardados
                const favoritasGuardadas = noticiasActuales.filter(art => favoritos.includes(art.title));
                renderNews(favoritasGuardadas);
            } else {
                // Llamada directa a la API con la nueva categoría seleccionada
                cargarNoticiasReales(cat);
            }
        });
    });
}

function setupSearch() {
    const input = document.getElementById('search-input');
    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtradas = noticiasActuales.filter(art => 
            art.title.toLowerCase().includes(query) || 
            art.desc.toLowerCase().includes(query)
        );
        renderNews(filtradas);
    });
}

window.toggleFavorite = function(titulo) {
    if (favoritos.includes(titulo)) {
        favoritos = favoritos.filter(favTitle => favTitle !== titulo);
    } else {
        favoritos.push(titulo);
    }
    localStorage.setItem('news_favs', JSON.stringify(favoritos));
    
    // Actualizar iconos visuales sin reiniciar la llamada de red
    renderNews(noticiasActuales);
};

window.irANoticia = function(id) {
    window.location.href = `article.html?id=${id}`;
};

// Utilidad matemática elemental para calcular hace cuánto se publicó la nota real
function calcularTiempo(fechaISO) {
    const publicado = new Date(fechaISO);
    const ahora = new Date();
    const difMiliseconds = ahora - publicado;
    const horas = Math.floor(difMiliseconds / (1000 * 60 * 60));
    
    if (horas <= 0) return "Hace menos de una hora";
    if (horas === 1) return "Hace 1 hora";
    if (horas < 24) return `Hace ${horas} horas`;
    return publicado.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}