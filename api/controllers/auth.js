    'use restrict';

    const S = require('fluent-json-schema')
    const Ajv = require('ajv')
    const pg = require('pg') 
    const { Client } = pg


    const ajv = new Ajv({ allErrors: true })
    
    const userIdSchema = S.string().minLength(1);
    
    const passwordSchema = S.string().minLength(6).maxLength(50);
    
    const userIdValidate = ajv.compile(userIdSchema.valueOf())
    
    const passwordValidate = ajv.compile(passwordSchema.valueOf())

    function loginController(req, res){
        const { headers } = req 
        const { authorization } = headers
        console.log('authorization', authorization)

        if (!authorization || !authorization.startsWith('Basic')) {
            return res.status(401).send({error: 'Atutentication is required'})
        }

        const base64Credentials = authorization.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');

        const [userId, password] = credentials.split(':');
    
        if(!userIdValidate(userId.trim()) || password == null || !passwordValidate(password.trim())){
            res.status(401)
            return { message: 'invalid credentials' };
        }


        res.status(204).send()
    }

    const userSchema = S.object()
    .prop('name', S.string().minLength(3).required())
    .prop('email', S.string().format(S.FORMATS.EMAIL).required())
    .prop('username', S.string().minLength(3).required())
    .prop('password', S.string().minLength(6).required())

    async function signupController(req, res) {
        const { name, email, username, password } = req.body;
    
        if (!name || !email || !username || !password) {
            return res.status(400).send({ error: "All fields are required" });
        }
    
        const client = new Client({
            user: 'postgres',
            password: 'postgres',
            host: 'localhost',
            port: 5432,
            database: 'postgres',
        });
    
        try {
            await client.connect();
    
            // Verifica se o usuário já existe
            const checkUser = await client.query(
                'SELECT * FROM users WHERE username = $1 OR email = $2',
                [username, email]
            );
    
            if (checkUser.rows.length > 0) {
                await client.end();
                return res.status(400).send({ error: "Username or email already exists" });
            }
    
            // Insere o novo usuário
            const query = 'INSERT INTO users(username, email, password, name) VALUES($1, $2, $3, $4) RETURNING *';
            const values = [username, email, password, name];
    
            const result = await client.query(query, values);
            const newUser = result.rows[0];
    
            await client.end();
    
            return res.status(201).send({ message: "User created successfully!", user: newUser });
    
        } catch (error) {
            await client.end();
            return res.status(500).send({ error: "Internal server error", details: error.message });
        }
    }

    const schemaId = {
        params: S.object()
            .prop('id', S.integer().minimum(1).required()),
        queryString: S.object()
            .prop('gender', S.string().enum(['male', 'demale', 'other']).required())
    };
    const noteSchema = S.object()
        .prop('title', S.string().minLength(3).required())
        .prop('description', S.string().minLength(5).maxLength(150).required())

    async function updateController(req, res) {

        const { name, email, username, password } = req.body;
    
        if (!name || !email || !username || !password) {
            return res.status(400).send({ error: "All fields are required" });
        }

}

    function register(req, res){
        const {body} = req

        res.status(201).send()
    }

    
    module.exports = function(fastify, opts, done){
        fastify.post('/login', {schema: userSchema}, loginController)
        fastify.post('/singup', signupController);
        done();
    }
