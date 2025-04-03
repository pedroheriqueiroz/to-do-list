    'use restrict';

    const S = require('fluent-json-schema')
    const Ajv = require('ajv')
    const pg = require('pg') 
    const { Client } = pg
    const bcrypt = require('bcryptjs')

    // estou apenas fazendo um teste para saber se vai dar certo o commit

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
    
        try {
            console.log("cliente")

            const client = new Client({
                user: 'postgres',
                password: 'postgres',
                host: 'localhost',
                port: 5432,
                database: 'postgres',
            });
            
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
            const query = 'INSERT INTO users(username, email, password, name) VALUES($1, $2, $3, $4) RETURNING username, email, name, id';
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

        async function passwordController(req, res) {
            const { oldPassword, newPassword } = req.body;
            const userId = parseInt(req.params.id, 10);
        
            if (isNaN(userId)) {
                return res.status(400).send({ error: "Invalid user ID" });
            }
            if (!oldPassword || !newPassword) {
                return res.status(400).send({ error: "The passwords are required" });
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
        
                // Buscar senha atual no banco
                const result = await client.query(
                    'SELECT password FROM users WHERE id = $1',
                    [userId]
                );
        
                if (result.rows.length === 0) {
                    return res.status(404).send({ error: "User not found!" });
                }
        
                const user = result.rows[0];
        
                // Verificar se a senha antiga está correta
                if (oldPassword !== user.password) {
                    return res.status(401).send({ error: "Incorrect old password!" });
                }
                
                // Atualizar senha no banco
                await client.query('UPDATE users SET password = $1 WHERE id = $2', [newPassword, userId]);

                return res.send({ message: 'Password updated sucesfully!' });
        
            } catch (error) {
                console.error(error);
                return res.status(500).send({ error: 'Erro no servidor' });
            } finally {
                console.log("finally")
                await client.end();
            }
        }

        async function submitTaskController(req, res) { // perguntar a relação das tabelas com os users

            const { title, description } = req.body;

            if (!title || !description) {
                return res.status(400).json({ error: "Title and description are required" });
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
        
                // Insere os dados na tabela `tasks`
                await client.query(
                    "INSERT INTO tasks (title, description) VALUES ($1, $2)",
                    [title, description]
                );
        
                res.status(201).send({ success: "Task created successfully" });
            } catch (error) {
                console.error("Database error:", error);
                res.status(500).send({ error: "Internal Server Error" });
            } finally {
                console.log("finally")
                await client.end();
            }
        }

        async function deleteTaskController(req, res) {
            const { id } = req.params; // O ID da tarefa vem da URL
        
            if (!id) {
                return res.status(400).send({ error: "Task ID is required" });
            }
        
            const client = new Client({
                user: "postgres",
                password: "postgres",
                host: "localhost",
                port: 5432,
                database: "postgres",
            });
        
            try {
                await client.connect();
        
                // Verifica se a tarefa existe antes de excluir
                const result = await client.query("SELECT * FROM tasks WHERE id = $1", [id]);
        
                if (result.rows.length === 0) {
                    return res.status(404).send({ error: "Task not found" });
                }
        
                // Exclui a tarefa pelo ID
                await client.query("DELETE FROM tasks WHERE id = $1", [id]);
        
                res.status(200).send({ success: "Task deleted successfully" });
            } catch (error) {
                console.error("Database error:", error);
                res.status(500).send({ error: "Internal Server Error" });
            } finally {
                await client.end();
            }
        }
        

    function register(req, res){
        const {body} = req

        res.status(201).send()
    }

    
    module.exports = function(fastify, opts, done){
        fastify.post('/login', {schema: userSchema}, loginController);
        fastify.post('/singup', signupController);
        fastify.post('/updatepassword/:id', {schema: userSchema}, passwordController);
        fastify.post('/submittask', {schema: noteSchema}, submitTaskController);
        fastify.post('/delettask/:id', {schema: noteSchema}, deleteTaskController);
        done();
    }
