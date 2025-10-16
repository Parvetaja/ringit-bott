'use strict'

const config = require('../config')
const Botkit = require('botkit')
const getLunchOffers = require('../modules/scrape-food-offers')
const selectBestLunchOffers = require('../modules/gemini-lunch-selector')

if (![6, 0].includes(new Date().getDay())) {
  const controller = Botkit.slackbot({})
  const bot = controller.spawn()

  bot.configureIncomingWebhook({ url: config('WEBHOOK_URL') })

  getLunchOffers().then(async (offers) => {
    console.log('Scraped lunch offers from', Object.keys(offers).length, 'restaurants')
    
    const allMenus = Object.entries(offers).map(([key, value]) => ({
      text: [key, ...value].join('\n'),
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `📋 ${key}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: value.join('\n')
          }
        }
      ]
    }))

    for (const menu of allMenus) {
      bot.sendWebhook(menu, (err) => {
        if (err) console.error('Error sending all offers:', err)
      })
    }

    console.log('Analyzing offers with Gemini AI...')
    try {
      const aiSelection = await selectBestLunchOffers(offers)
      
      if (aiSelection && aiSelection.selected_offers && aiSelection.selected_offers.length > 0) {
        const recommendationHeader = {
          text: '🤖 AI Soovitused',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: '🤖 AI Soovitatud Lõunapakkumised'
              }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'Tänased parimad valikud on:'
              }
            }
          ]
        }
        
        bot.sendWebhook(recommendationHeader, (err) => {
          if (err) console.error('Error sending recommendation header:', err)
        })

        aiSelection.selected_offers.forEach((selection, index) => {
          const recommendedMenu = {
            text: `⭐ ${selection.restaurant}`,
            blocks: [
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: `⭐ #${index + 1} - ${selection.restaurant}`
                }
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: selection.items.join('\n')
                }
              },
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `💡 *Põhjus:* ${selection.reason}`
                  }
                ]
              }
            ]
          }
          console.log(recommendedMenu)
          bot.sendWebhook(recommendedMenu, (err) => {
            if (err) console.error('Error sending AI recommendation:', err)
          })
        })
        
        console.log(`\nAI selected ${aiSelection.selected_offers.length} best lunch options!`)
      } else {
        console.log('No AI recommendations received, all offers already sent.')
      }
    } catch (error) {
      console.error('Error getting AI recommendations:', error)
    }
    
    console.log('\nMenus delivered!')
  }).catch((error) => {
    console.error('Error scraping lunch offers:', error)
  })
} else {
  console.log("It's the weekend, no lunch offers today!")
}
