import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { readFile, writeFile } from "fs/promises";
import { createParser } from "@aerosstube/anime-parser-kodik-ts";
import { ShikimoriParser } from "./shikimori-parser.js";

const parser = await createParser();
const shikimoriParser = new ShikimoriParser();

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "../public")));

app.get("/api/data", async (req, res) => {
    try {
        const readData = await readFile("./data.json", "utf8");
        const data = JSON.parse(readData);
        console.log(data);
        return res.json(data);
    } catch (err) {
        return res.json({ error: "Ошибка получения даты", errorMessage: err });
    }
});

app.post("/api/newdata", async (req, res) => {
    try {
        console.log("LOADED NEW DATA");

        await writeFile("./data.json", JSON.stringify(req.body, null, 4));

        res.status(200).json({
            success: true,
            message: "Данные обновлены",
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: err,
        });
    }
});

app.get("/api/anime/search", async (req, res) => {
    const uncodeTitle = req.query.title;
    if (!uncodeTitle) {
        return res.json({ error: "Ничего не найдено" });
    }
    const title = decodeURIComponent(uncodeTitle);

    try {
        // const results = await parser.search(  //Поиск через kodik парсер (НЕ РАБОТАЕТ)
        //     title,
        //     100,
        //     true,
        //     null,
        //     false,
        //     true
        // );
        const results = await shikimoriParser.search(title);
        res.json({
            response: results,
        });
    } catch (e) {
        res.json({
            response: e,
        });
    }
});

app.get("/api/anime/info", async (req, res) => {
    const shikimoriId = req.query.shikimori_id;
    try {
        const info = await parser.getInfo(shikimoriId, "shikimori");
        res.json({
            response: info,
        });
    } catch (error) {
        if (error.name === "NoResults") {
            res.json({
                response: { error: "Not found in Kodik" },
            });
        }
    }
});

app.get("/api/anime/link", async (req, res) => {
    const shikimoriId = req.query.shikimori_id;
    const seriaNum = req.query.seria_num;
    const translationId = req.query.translation_id;

    const [link, quality] = await parser.getLink(
        shikimoriId,
        "shikimori",
        seriaNum,
        translationId
    );
    res.json({
        link: link,
        maxQuality: quality,
    });
});

app.get("/api/anime/poster", async (req, res) => {
    const shikimoriId = req.query.shikimori_id;
    const posterUrl = await shikimoriParser.getPoster(shikimoriId);
    res.json({
        posterUrl: posterUrl,
    });
});

app.listen(PORT, () => {
    console.log("Server started on http://localhost:3000");
});
