import Hapi from 'hapi'

let server = new Hapi.Server()

server.connection({ port: 3000 })

server.ext('onRequest', (request, reply) => {
    console.log(`Request received: ${request.path}`)
    reply.continue()
})

server.register(require('inert'), (err) => {

    if (err) {
        throw err;
    }

    server.route({
    path: '/',
    method: 'GET',
    handler: (request, reply) => {
        reply.file('templates/index.html')
    }
})

    server.start((err) => {

        if (err) {
            throw err;
        }

        console.log(`listing on ${server.info.uri}`);
    });
});