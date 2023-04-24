'use strict'

const _ = require('lodash')
const config = require('../config')
const Botkit = require('botkit')
const getLunchOffers = require("../modules/scrape-food-offers");

var controller = Botkit.slackbot({})
var bot = controller.spawn()

bot.configureIncomingWebhook({url: config('WEBHOOK_URL')})

const msgDefaults = {
    response_type: 'in_channel',
    username: 'FuudBott',
    icon_emoji: config('ICON_EMOJI')
}

const lunchOffers = getLunchOffers().then((offers) => {
    const menus = Object.entries(offers).map(([key, value]) => ({
        title: key,
        text: value.join("\n"),
        mrkdwn_in: ['text', 'pretext']
    }));
    let msg = _.defaults({menus: menus}, msgDefaults)
    console.log(msg);

    bot.sendWebhook(JSON.stringify(msg), (err, res) => {
        if (err) throw err

        console.log(`\nMenus delivered!`)
    })
});

