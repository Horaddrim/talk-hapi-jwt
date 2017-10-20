const inert = require('inert');
const vision = require('vision');
const hapiJwt = require('hapi-auth-jwt2');
const swagger = require('hapi-swagger');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const Boom = require('boom');
const Hapi = require('hapi');

const validate = (decoded, request, callback) => {
  if (decoded) return callback(null, true);
  return callback(null, false);
};

async function startServer() {
  const server = new Hapi.Server();
  server.connection({
    host: 'localhost',
    port: 8000,
  });

  await server.register([
    inert,
    vision,
    {
      register: swagger,
      options: {
        info: { title: 'Docs', version: '1.0' },
      },
    },
    hapiJwt,
  ]);

  await server.auth.strategy('jwt', 'jwt', {
    key: 'Horizon Four',
    validateFunc: validate,
    verifyOptions: { algorithms: ['HS256'] },
  });

  // Add the route
  server.route({
    method: 'POST',
    path: '/hello',
    config: {
      auth: 'jwt',
      handler: function(request, reply) {
        return reply(`Hello ${request.payload.name}`);
        /*  null
                undefined
                string
                number
                boolean
                Buffer object
                Error object (Formatted to a 
                    HTTP 500 unless it's a Boom error)
                Stream object
                Promise object
                any other object or array 
            */
      },
      description: 'A simple route to say hello!',
      notes: 'That route returns a simple Hello message',
      tags: ['api', 'no-auth'],
      validate: {
        payload: {
          name: Joi.string(),
        },
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/token',
    config: {
      auth: false,
      handler: async (req, reply) => {
        try {
          reply({
            token: await jwt.sign({ date: Date.now() }, 'Horizon Four'),
          });
        } catch (err) {
          console.log(err);
          reply(Boom.badImplementation(err));
        }
      },
      description: 'A route to get that token',
      notes: 'Returns a valid token to use',
      tags: ['api', 'auth'],
    },
  });

  server.auth.default('jwt');

  // Start the server
  server.start(err => {
    if (err) {
      throw err;
    }
    console.log('Server running at:', server.info.uri);
  });

  const reqCerta = {
    method: 'POST',
    url: '/hello',
    payload: JSON.stringify({ name: 'Horizon Four' }),
    headers: {
      Authorization: await jwt.sign({ date: Date.now() }, 'Horizon Four'),
    },
  };

  const reqErrada = {
    method: 'POST',
    url: '/hello',
    payload: JSON.stringify({ name: 'Horizon Four' }),
    headers: {
      Authorization: await jwt.sign({ date: Date.now() }, 'Chave errada'),
    },
  };

  server.inject(reqCerta, res => {
    console.log(
      'Request Certa \n',
      res.statusCode,
      JSON.stringify(res.payload),
    );
  });

  server.inject(reqErrada, res => {
    console.log(
      'Request Errada: \n',
      res.statusCode,
      JSON.stringify(res.payload),
    );
  });
}

startServer();
