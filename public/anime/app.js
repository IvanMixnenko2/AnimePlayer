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
