
const fastify = require('fastify')({logger: true})
fastify.register(require('@fastify/formbody'));
fastify.register(require('@fastify/multipart'))
const S = require('fluent-json-schema')
const path = require('path');
const Ajv = require('ajv')

const auth = require('./controllers/auth')

const ajv = new Ajv({ allErrors: true })


const noteSchema = S.object()
    .prop('title', S.string().minLength(3).required())
    .prop('description', S.string().minLength(5).maxLength(150).required())

    const noteIdSchema = S.object()
  .prop('id', S.integer().minimum(0).required())

fastify.register(auth);

fastify.get('/', function (request, response) {
  response.send({ hello: 'world' })
})

const schemaId = {
    params: S.object()
        .prop('id', S.integer().minimum(1).required()),
    queryString: S.object()
        .prop('gender', S.string().enum(['male', 'demale', 'other']).required())
};

fastify.post('/:id', {schema: schemaId}, async (request, response) => {
    const { id } = request.params
    const { gender } = request.query

    response.send({ message: 'Valid params!' });
});


fastify.put('/update/:id', {schema: {
    params: schemaId.params,
    body: noteSchema
    }
    
}, async (request, response) => {

    const {id} = request.params;
    const {title, description} = request.body; 

    // Simulando atualização no banco
    const updatedUser = {
        id,
        title,
        description,
        message: "User updated successfully!"
    };
    return response.status(200).send(updatedUser)
})

fastify.patch('/update/:id/image', async (request, response) => {

    const {id} = request.params; // recebendo o id da requisição 
    const data  = await request.file(); // recebendo o arquivo passado

    if (!id) {
        response.status(400).send({error: "An image is required"});
    }

    const uploadDir = path.join(__dirname, 'uploads') // cria o caminho do repositório onde vai ser armaz...
    const filePath = path.join(uploadDir, data.filename) // armazena o arquivo na no diretório

    if (!fs.existsSync(uploadDir)) { // verifica se o diretório foi criado
        fs.mkdirSync(uploadDir) // passa a criação do diretório 
    }

    fs.writeFileSync(filePath, await data.toBuffer()) 
    return filePath;  // retorna no servidor local da api o caminho do arquivo
})

const start = async () => {
    try {
       await fastify.listen({ port: 3000 })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start() 

