'use strict'

const axios = require("axios");
const cheerio = require("cheerio");

const ROTERMANN_URL = "https://www.rotermann.eu/lounapakkumised/";
const BASIILIK_URL = "https://basiilik.ee/en/daily-specials/"

const BLACKLIST = [
    "Siesta",
    "Purée",
    "R14",
    "Om House",
    "Levier",
    "Orangerie"
]

async function getRotermanniLunchOffers() {
    const menus = {};
    const response = await axios(ROTERMANN_URL);
    const html_data = response.data;
    const $ = cheerio.load(html_data);

    const selectedElem = 'body > main > div > div.row.gutter-20 > div:nth-child(1) > div > div';

    $(selectedElem).each((parentIndex, parentElem) => {
        $(parentElem)
            .children()
            .each((childId, childElem) => {
                const value = $(childElem).text()
                    .split("\n")
                    .map((item) => item.trim())
                    .filter((item) => item !== "")
                    .filter((item, i) => item.startsWith("-") || i === 0);

                if (BLACKLIST.findIndex((s) => value[0].includes(s)) === -1) {
                    menus[value[0]] = value.slice(1);
                }
            });
    });
    return menus;
}

async function getLunchOffers() {
    const menus = await getRotermanniLunchOffers();
    // TODO menus['Basiilik'] = getBasiilikLunchOffer();

    //console.log(menus);
    return menus;
}

module.exports = getLunchOffers;
