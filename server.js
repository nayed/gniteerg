import Hapi from 'hapi'

let server = new Hapi.Server()

server.connection({ port: 3000 })

server.route({
    path: '/hi',
    method: 'GET',
    handler: (request, reply) => {
        reply('Hi people')
    }
})

server.start(() => {
    console.log("listing on " + server.info.uri)
})