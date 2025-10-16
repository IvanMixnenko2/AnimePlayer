import { load } from "cheerio";

export class ShikimoriParser {
    constructor(mirror = null) {
        this._dmn = mirror || "shikimori.one";
    }
    async search(title) {
        const headers = {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
            Accept: "application/json, text/plain, */*",
            "X-Requested-With": "XMLHttpRequest",
        };

        const params = new URLSearchParams({
            search: title,
        });
        const response = await fetch(
            `https://${this._dmn}/animes/autocomplete/v2?${params}`,
            {
                method: "GET",
                headers: headers,
            }
        );
        // Обработка статусов ответа
        if (response.status === 429) {
            throw new Error(
                "Сервер вернул код 429 для обозначения что запросы выполняются слишком часто."
            );
        } else if (response.status === 520) {
            throw new Error(
                "Сервер вернул статус ответа 520, что означает что он перегружен и не может ответить сразу."
            );
        } else if (response.status !== 200) {
            throw new Error(
                `Сервер не вернул ожидаемый код 200. Код: "${response.status}"`
            );
        }
        const data = await response.json();
        const htmlContent = data.content;

        const $ = load(htmlContent);

        const res = [];

        $("div.b-db_entry-variant-list_item").each((index, element) => {
            const anime = $(element);

            // Проверяем, что это аниме
            if (anime.attr("data-type") !== "anime") {
                return;
            }

            const cData = {};
            cData.link = anime.attr("data-url");
            cData.shikimori_id = anime.attr("data-id");

            // Постер
            const imageDiv = anime.find("div.image");
            if (imageDiv.length > 0) {
                const img = imageDiv.find("picture img");
                if (img.length > 0 && img.attr("srcset")) {
                    cData.poster = img.attr("srcset").replace(" 2x", "");
                } else {
                    cData.poster = null;
                }
            } else {
                cData.poster = null;
            }

            const info = anime.find("div.info");
            if (info.length === 0) return;

            // Названия
            const nameLink = info.find("div.name a");
            if (nameLink.length > 0) {
                cData.original_title = nameLink.attr("title");
                cData.title = nameLink.text().split("/")[0].trim();
            }

            // Информация о типе, статусе, студии и годе
            const lineDiv = info.find("div.line").first();
            if (lineDiv.length > 0) {
                const keyDiv = lineDiv.find("div.key");
                if (keyDiv.length > 0 && keyDiv.text().trim() === "Тип:") {
                    const valueDiv = lineDiv.find("div.value");

                    // Тип
                    const typeTag = valueDiv.find("div.b-tag").first();

                    cData.type =
                        typeTag.length > 0 ? typeTag.text().trim() : null;

                    // Статус и студия
                    const statusTags = valueDiv.find("div.b-anime_status_tag");
                    if (statusTags.length > 0) {
                        cData.status = statusTags.last().attr("data-text");
                        cData.studio =
                            statusTags.length > 1
                                ? statusTags.first().attr("data-text")
                                : null;
                    } else {
                        cData.status = null;
                        cData.studio = null;
                    }

                    // Год
                    const allTags = valueDiv.find("div.b-tag");
                    if (allTags.length > 1) {
                        const lastTag = allTags.last();
                        cData.year = lastTag.text().replace(" год", "").trim();
                    } else {
                        cData.year = null;
                    }
                } else {
                    cData.type = null;
                    cData.status = null;
                    cData.studio = null;
                    cData.year = null;
                }
            } else {
                cData.type = null;
                cData.status = null;
                cData.studio = null;
                cData.year = null;
            }

            // Жанры
            cData.genres = [];
            info.find("span.genre-ru").each((i, genreElem) => {
                cData.genres.push($(genreElem).text().trim());
            });

            res.push(cData);
        });
        return res;
    }

    async getPoster(shikimoriId) {
        const headers = {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
            Accept: "application/json, text/plain, */*",
            "X-Requested-With": "XMLHttpRequest",
        };

        const response = await fetch(
            `https://${this._dmn}/animes/${shikimoriId}`,
            {
                method: "GET",
                headers: headers,
            }
        );
        const htmlContent = await response.text();
        const $ = load(htmlContent);

        const posterBlock = $("div.b-db_entry-poster.b-image");
        if (posterBlock.length === 0) {
            return null;
        }
        const metaImg = posterBlock
            .find('meta[itemprop="image"]')
            .attr("content");
        if (metaImg) {
            return metaImg;
        }
        return null;
    }
}
