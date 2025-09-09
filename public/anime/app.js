const videoSource = document.querySelector("#video-source");
const videoS = document.querySelector("#video");

const searchInput = document.querySelector("#search-input");
const searchResultsList = document.querySelector("#search-results");
const AnimeInfoTitle = document.querySelector("#anime-info-title");
const AnimeInfoImg = document.querySelector("#anime-info-img");
const TranslationsList = document.querySelector("#translations");
const TranslationTitle = document.querySelector("#translation-title");
const SeriesList = document.querySelector("#series");
const SeriaTitle = document.querySelector("#seria-title");

const seriaData = {
    shikimoriId: undefined,
    seriaNum: undefined,
    translationId: undefined,
};

function debounce(func, delay) {
    let timeoutId;

    return function (...args) {
        const context = this;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}

function renderResultsList(response) {
    if (response.error) {
        console.log(response.error);
        return;
    }
    const results = response.response;
    searchResultsList.textContent = "";
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < results.length; i++) {
        const li = document.createElement("li");
        const setAnime = document.createElement("button");
        const poster = document.createElement("img");
        poster.className = "search-item-poster";
        const title = document.createElement("div");
        title.textContent = results[i].title;
        poster.src = results[i].material_data.anime_poster_url;
        setAnime.className = "list-item-button";
        setAnime.id = i;
        setAnime.addEventListener("click", () => {
            ChooseAnime(results[i]);
        });
        setAnime.appendChild(poster);
        setAnime.appendChild(title);
        li.appendChild(setAnime);

        fragment.appendChild(li);
    }
    searchResultsList.appendChild(fragment);
}

async function ChooseAnime(results) {
    ChooseTranslation();
    const shikimori_id = results.shikimori_id;
    seriaData.shikimoriId = shikimori_id;
    AnimeInfoTitle.textContent = results.title;
    AnimeInfoImg.src = results.material_data.anime_poster_url;

    if (results.material_data.anime_kind == "movie") {
        seriaData.seriaNum = 0;
        SeriaTitle.textContent = "Серия: Фильм";
    }

    try {
        const resinfo = await fetch(
            `/api/anime/info?shikimori_id=${shikimori_id}`
        );
        const data = await resinfo.json();
        const info = data.response;

        console.log(info);
        const fragment = document.createDocumentFragment();
        TranslationsList.textContent = "";
        for (let i = 0; i < info.translations.length; i++) {
            const li = document.createElement("li");
            const setTranslation = document.createElement("button");
            setTranslation.addEventListener("click", (event) => {
                ChooseTranslation(info.translations[i]);
            });
            setTranslation.className = "list-item-button translations-item";
            setTranslation.textContent = info.translations[i].title;

            li.appendChild(setTranslation);
            fragment.appendChild(li);
        }
        TranslationsList.appendChild(fragment);
        renderSeriesList(info.series_count);
    } catch (e) {
        console.log("Error in ChooseAnime", e);
    }
}

function ChooseTranslation(translation) {
    if (translation) {
        TranslationTitle.textContent = `Озвучка: ${translation.title}`;
        seriaData.translationId = translation.id;
        setUrl();
        return;
    }
    TranslationTitle.textContent = `Озвучка: не выбрана`;
    seriaData.translationId = undefined;
}

function ChooseSeria(num) {
    seriaData.seriaNum = num;
    SeriaTitle.textContent = `Серия: ${num}`;
    setUrl();
}

function renderSeriesList(count) {
    SeriesList.textContent = "";
    for (let i = 1; i <= count; i++) {
        const button = document.createElement("button");
        button.className = "seria-button";
        button.textContent = i;
        button.addEventListener("click", () => {
            ChooseSeria(i);
        });
        SeriesList.appendChild(button);
    }
}

async function setUrl() {
    if (
        seriaData.shikimoriId !== undefined &&
        seriaData.translationId !== undefined &&
        seriaData.seriaNum !== undefined
    ) {
        try {
            const response = await fetch(
                `/api/anime/link?shikimori_id=${seriaData.shikimoriId}&seria_num=${seriaData.seriaNum}&translation_id=${seriaData.translationId}`
            );
            const data = await response.json();

            while (videoS.firstChild) {
                videoS.removeChild(videoS.firstChild);
            }
            const newSource = document.createElement("source");
            newSource.type = "video/mp4";
            newSource.src = `https:${data.link}${data.maxQuality}.mp4`;
            videoS.appendChild(newSource);
            videoS.load();
            console.log(`https:${data.link}${data.maxQuality}.mp4`);
            console.log(data.maxQuality);
        } catch (e) {
            console.error("Ошибка получения ссылки", e);
        }
    }
}

searchInput.addEventListener(
    "input",
    debounce(async (e) => {
        const title = encodeURIComponent(e.target.value);
        console.log(JSON.stringify({ title }));
        const results = await fetch(`/api/anime/search?title=${title}`);
        const data = await results.json();
        console.log(data);
        renderResultsList(data);
    }, 300)
);

// THEME //

const toggleTheme = document.querySelector("#toggle-theme");
const lightSvg = `
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.9997 20.0002C17.1108 20.0002 18.0552 19.6113 18.833 18.8335C19.6108 18.0557 19.9997 17.1113 19.9997 16.0002C19.9997 14.8891 19.6108 13.9446 18.833 13.1668C18.0552 12.3891 17.1108 12.0002 15.9997 12.0002C14.8886 12.0002 13.9441 12.3891 13.1663 13.1668C12.3886 13.9446 11.9997 14.8891 11.9997 16.0002C11.9997 17.1113 12.3886 18.0557 13.1663 18.8335C13.9441 19.6113 14.8886 20.0002 15.9997 20.0002ZM15.9997 22.6668C14.1552 22.6668 12.583 22.0168 11.283 20.7168C9.98301 19.4168 9.33301 17.8446 9.33301 16.0002C9.33301 14.1557 9.98301 12.5835 11.283 11.2835C12.583 9.9835 14.1552 9.3335 15.9997 9.3335C17.8441 9.3335 19.4163 9.9835 20.7163 11.2835C22.0163 12.5835 22.6663 14.1557 22.6663 16.0002C22.6663 17.8446 22.0163 19.4168 20.7163 20.7168C19.4163 22.0168 17.8441 22.6668 15.9997 22.6668ZM6.66634 17.3335H1.33301V14.6668H6.66634V17.3335ZM30.6663 17.3335H25.333V14.6668H30.6663V17.3335ZM14.6663 6.66683V1.3335H17.333V6.66683H14.6663ZM14.6663 30.6668V25.3335H17.333V30.6668H14.6663ZM8.53301 10.3335L5.16634 7.10016L7.06634 5.1335L10.2663 8.46683L8.53301 10.3335ZM24.933 26.8668L21.6997 23.5002L23.4663 21.6668L26.833 24.9002L24.933 26.8668ZM21.6663 8.5335L24.8997 5.16683L26.8663 7.06683L23.533 10.2668L21.6663 8.5335ZM5.13301 24.9335L8.49967 21.7002L10.333 23.4668L7.09967 26.8335L5.13301 24.9335Z" fill="#FAF1FF"/>
</svg>
`;
const darkSvg = `
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16 28C12.6667 28 9.83333 26.8333 7.5 24.5C5.16667 22.1667 4 19.3333 4 16C4 12.6667 5.16667 9.83333 7.5 7.5C9.83333 5.16667 12.6667 4 16 4C16.3111 4 16.6167 4.01111 16.9167 4.03333C17.2167 4.05556 17.5111 4.08889 17.8 4.13333C16.8889 4.77778 16.1611 5.61667 15.6167 6.65C15.0722 7.68333 14.8 8.8 14.8 10C14.8 12 15.5 13.7 16.9 15.1C18.3 16.5 20 17.2 22 17.2C23.2222 17.2 24.3444 16.9278 25.3667 16.3833C26.3889 15.8389 27.2222 15.1111 27.8667 14.2C27.9111 14.4889 27.9444 14.7833 27.9667 15.0833C27.9889 15.3833 28 15.6889 28 16C28 19.3333 26.8333 22.1667 24.5 24.5C22.1667 26.8333 19.3333 28 16 28ZM16 25.3333C17.9556 25.3333 19.7111 24.7944 21.2667 23.7167C22.8222 22.6389 23.9556 21.2333 24.6667 19.5C24.2222 19.6111 23.7778 19.7 23.3333 19.7667C22.8889 19.8333 22.4444 19.8667 22 19.8667C19.2667 19.8667 16.9389 18.9056 15.0167 16.9833C13.0944 15.0611 12.1333 12.7333 12.1333 10C12.1333 9.55556 12.1667 9.11111 12.2333 8.66667C12.3 8.22222 12.3889 7.77778 12.5 7.33333C10.7667 8.04444 9.36111 9.17778 8.28333 10.7333C7.20556 12.2889 6.66667 14.0444 6.66667 16C6.66667 18.5778 7.57778 20.7778 9.4 22.6C11.2222 24.4222 13.4222 25.3333 16 25.3333Z" fill="#161219"/>
</svg>`;

function forceInputStylesUpdate() {
    const inputs = document.querySelectorAll("input");
    inputs.forEach((input) => {
        const value = input.value;
        input.value = "";
        input.value = value;
    });
}

const currentTheme = window.localStorage.getItem("theme");
document.addEventListener("DOMContentLoaded", () => {
    if (currentTheme == "light") {
        toggleTheme.innerHTML = darkSvg;
    } else if (currentTheme == "dark") {
        toggleTheme.innerHTML = lightSvg;
        document.body.classList.toggle("dark-theme");
    }
});

toggleTheme.addEventListener("click", () => {
    const currentTheme = window.localStorage.getItem("theme");
    document.body.classList.toggle("dark-theme");
    forceInputStylesUpdate();

    if (currentTheme == "light") {
        toggleTheme.innerHTML = lightSvg;
        window.localStorage.setItem("theme", "dark");
    } else if (currentTheme == "dark") {
        toggleTheme.innerHTML = darkSvg;
        window.localStorage.setItem("theme", "light");
    }
});
