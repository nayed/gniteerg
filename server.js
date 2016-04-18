import Hapi from 'hapi'
import uuid from 'uuid'
import fs from 'fs'
import Joi from 'joi'
import Boom from 'boom'


let server = new Hapi.Server()

let cards = loadCards()

server.connection({ port: 3000 })

server.ext('onRequest', (request, reply) => {
    console.log(`Request received: ${request.path}`)
    reply.continue()
})

server.ext('onPreResponse', (request, reply) => {
    if (request.response.isBoom) {
        return reply.view('error', request.response)
    }
    reply.continue()
})

server.register(require('vision'), (err) => {
    if (err) throw err

    server.views({
        engines: {
            html: require('handlebars')
        },
        path: './templates'
    })
})

server.register(require('inert'), (err) => {
    if (err) throw err

    server.route({
        path: '/',
        method: 'GET',
        handler: (request, reply) => {
            reply.file('templates/index.html')
        }
    })

    server.route({
        path: '/assets/{path*}',
        method: 'GET',
        handler: {
            directory: {
                path: './public',
                listing: false
            }
        }
    })

    server.route({
        path: '/cards/new',
        method: ['GET', 'POST'],
        handler: newCardHandler
    })

    server.route({
        path: '/cards',
        method: 'GET',
        handler: cardsHandler
    })

    server.route({
        path: '/cards/{id}',
        method: 'DELETE',
        handler: deleteCardHandler
    })

    let cardSchema = Joi.object().keys({
        name: Joi.string().min(3).max(50).required(),
        recipient_email: Joi.string().email().required(),
        sender_name: Joi.string().min(3).max(50).required(),
        sender_email: Joi.string().email().required(),
        card_image: Joi.string().regex(/.+\.(jpg|bmp|png|gif)\b/).required()
    })

    function newCardHandler(request, reply) {
        if(request.method === 'get') {
            reply.view('new', { card_images: mapImages() })
        }
        else {
            Joi.validate(request.payload, cardSchema, (err, val) => {
                if (err) {
                    return reply(Boom.badRequest(err.details[0].message))
                }

                let card = {
                    name: val.name,
                    recipient_email: val.recipient_email,
                    sender_name: val.sender_name,
                    sender_email: val.sender_email,
                    card_image: val.card_image
                }

                saveCard(card)
                console.log(card)
                reply.redirect('/cards')
            })
        }
    }

    function cardsHandler(request, reply) {
        reply.view('cards', { cards })
    }

    function saveCard(card) {
        let id = uuid.v1()
        card.id = id
        cards[id] = card
    }

    function deleteCardHandler(request, reply) {
        delete cards[request.params.id]
        reply()
    }

    server.start((err) => {
        if (err) throw err

        console.log(`listing on ${server.info.uri}`)
    })
})

function loadCards() {
    let file = fs.readFileSync('./cards.json')
    return JSON.parse(file.toString())
}

function mapImages() {
    return fs.readdirSync('./public/images/cards')
}
