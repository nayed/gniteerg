import Hapi from 'hapi'
import uuid from 'uuid'
import fs from 'fs'

let server = new Hapi.Server()

let cards = loadCards()

server.connection({ port: 3000 })

server.ext('onRequest', (request, reply) => {
    console.log(`Request received: ${request.path}`)
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

    function newCardHandler(request, reply) {
        if(request.method === 'get') {
            reply.view('new', { card_images: mapImages() })
        }
        else {
            let card = {
                name: request.payload.name,
                recipient_email: request.payload.recipient_email,
                sender_name: request.payload.sender_name,
                sender_email: request.payload.sender_email,
                card_image: request.payload.card_image
            }
            saveCard(card)
            console.log(card)
            reply.redirect('/cards')
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
