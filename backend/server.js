const path = require('path');
require('dotenv').config(); // Carrega variáveis de ambiente do .env
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000; // Porta do servidor, ou 3000 por padrão
const JWT_SECRET = process.env.JWT_SECRET || 'Guilherme8151'; // Secret para JWT
const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_PORT = Number(process.env.MYSQL_PORT || 3306);
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || 'Guilherme8151';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'pap';

const db = mysql.createPool({
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Criar diretórios de upload se não existirem
const uploadDirs = {
    images: path.join(__dirname, '../uploads/images'),
    videos: path.join(__dirname, '../uploads/videos')
};

Object.values(uploadDirs).forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configurar Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'imageFiles') {
            cb(null, uploadDirs.images);
        } else if (file.fieldname === 'videoFile') {
            cb(null, uploadDirs.videos);
        } else {
            cb(null, uploadDirs.images);
        }
    },
    filename: (req, file, cb) => {
        // Gerar nome único para o arquivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Validar tipos de arquivo
    const allowedImageMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const allowedVideoMimes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    
    if (file.fieldname === 'imageFiles') {
        if (allowedImageMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de imagem não permitido. Use: JPG, PNG, GIF, WebP, SVG'));
        }
    } else if (file.fieldname === 'videoFile') {
        if (allowedVideoMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de vídeo não permitido. Use: MP4, AVI, MOV, WebM'));
        }
    } else {
        cb(null, true);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500 MB por arquivo
    }
});

const formatUser = (row) => ({
    _id: String(row.id),
    id: String(row.id),
    username: row.username,
    email: row.email,
    role: row.role,
    createdAt: row.created_at
});

const formatProject = (row) => {
    let images = [];
    if (row.images_json) {
        try {
            images = JSON.parse(row.images_json);
        } catch {
            images = [];
        }
    }

    return {
        _id: String(row.id),
        id: String(row.id),
        name: row.name,
        turma: row.turma,
        description: row.description,
        images,
        image: row.image,
        videoUrl: row.video_url,
        category: row.category
    };
};

const formatEvent = (row) => ({
    _id: String(row.id),
    id: String(row.id),
    title: row.title,
    date: row.event_date,
    time: row.event_time
});

const initDatabase = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            email VARCHAR(190) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS projects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            turma VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            images_json LONGTEXT NOT NULL,
            image VARCHAR(500) NULL,
            video_url VARCHAR(500) NULL,
            category ENUM('completo', 'incompleto', 'ideia') NOT NULL
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            event_date VARCHAR(20) NOT NULL,
            event_time VARCHAR(20) NOT NULL
        )
    `);
};

// 2. Middlewares
app.use(cors()); // Permite requisições de diferentes origens (seu frontend)
app.use(express.json()); // Habilita o Express a ler JSON no corpo das requisições
app.use(express.urlencoded({ limit: '500mb', extended: true })); // Para formulários urlencoded

// Servir arquivos estáticos de uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 3. Camada de acesso a dados (MySQL)

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Token de acesso não fornecido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido ou expirado' });
        }
        req.user = user;
        next();
    });
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem acessar esta rota.' });
    }
    next();
};

// Rotas da API para Projetos 

// GET todos os projetos
app.get('/api/projects', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM projects ORDER BY id DESC');
        res.json(rows.map(formatProject));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// PUT (atualizar) um projeto por ID - Apenas admin
// Middleware que tenta processar multipart, mas continua se não for multipart
const optionalMultipart = (req, res, next) => {
    const contentType = req.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
        upload.fields([
            { name: 'images', maxCount: 10 },
            { name: 'video', maxCount: 1 }
        ])(req, res, (err) => {
            if (err) {
                console.error('[optionalMultipart] Erro ao processar multer:', err);
                return res.status(400).json({ message: 'Erro ao processar ficheiros: ' + err.message });
            }
            next();
        });
    } else {
        next();
    }
};

app.put('/api/projects/:id', authenticateToken, requireAdmin, optionalMultipart, async (req, res) => {
    try {
        console.log('[PUT /api/projects/:id] Atualizando projeto...');
        console.log('[PUT /api/projects/:id] Content-Type:', req.get('content-type'));
        console.log('[PUT /api/projects/:id] Body:', req.body);
        console.log('[PUT /api/projects/:id] Files:', req.files);

        const [existingRows] = await db.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
        if (existingRows.length === 0) {
            return res.status(404).json({ message: 'Projeto não encontrado' });
        }
        const project = formatProject(existingRows[0]);

        // Atualizar campos básicos
        const updatedProject = { ...project };
        if (req.body.name) updatedProject.name = req.body.name;
        if (req.body.turma) updatedProject.turma = req.body.turma;
        if (req.body.category) updatedProject.category = req.body.category;
        if (req.body.description) updatedProject.description = req.body.description;

        // Processar imagens (apenas se novos ficheiros forem enviados)
        if (req.files && req.files.images && req.files.images.length > 0) {
            console.log('[PUT /api/projects/:id] Novos arquivos de imagem recebidos:', req.files.images.length);
            const newImages = req.files.images.map(file => `/uploads/images/${file.filename}`);
            updatedProject.images = newImages;
            updatedProject.image = newImages[0]; // Atualizar imagem de capa
            console.log('[PUT /api/projects/:id] Imagens atualizadas:', newImages);
        }

        // Processar vídeo (apenas se novo ficheiro for enviado)
        if (req.files && req.files.video && req.files.video.length > 0) {
            updatedProject.videoUrl = `/uploads/videos/${req.files.video[0].filename}`;
            console.log('[PUT /api/projects/:id] Vídeo atualizado:', updatedProject.videoUrl);
        }

        await db.query(
            `UPDATE projects
             SET name = ?, turma = ?, description = ?, images_json = ?, image = ?, video_url = ?, category = ?
             WHERE id = ?`,
            [
                updatedProject.name,
                updatedProject.turma,
                updatedProject.description,
                JSON.stringify(updatedProject.images || []),
                updatedProject.image || null,
                updatedProject.videoUrl || null,
                updatedProject.category,
                req.params.id
            ]
        );

        const [rows] = await db.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
        console.log('[PUT /api/projects/:id] Projeto atualizado com sucesso:', req.params.id);
        res.json(formatProject(rows[0]));
    } catch (err) {
        console.error('[PUT /api/projects/:id] Erro ao atualizar projeto:', err);
        res.status(400).json({ message: err.message });
    }
});

// DELETE um projeto por ID - Apenas admin
app.delete('/api/projects/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Projeto não encontrado' });
        res.json({ message: 'Projeto excluído com sucesso' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ... (rotas de eventos permanecem iguais)

// ... (resto do server.js: app.listen, etc.)

// Rotas de Autenticação

// POST /api/auth/register - Registrar novo usuário
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Validações
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres' });
        }

        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Usuário ou email já existe' });
        }

        // Criar novo usuário (apenas admin pode criar outros admins)
        const userRole = role === 'admin' ? 'user' : (role || 'user'); // Por segurança, não permitir criar admin diretamente
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, userRole]
        );
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
        const user = formatUser(rows[0]);

        // Gerar token JWT
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Usuário criado com sucesso',
            token,
            user: {
                id: user.id,
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Usuário ou email já existe' });
        }
        res.status(400).json({ message: err.message });
    }
});

// POST /api/auth/login - Login de usuário
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username e senha são obrigatórios' });
        }

        const [rows] = await db.query(
            'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
            [username, username]
        );
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }
        const userRow = rows[0];
        const user = formatUser(userRow);

        // Verificar senha
        const isPasswordValid = await bcrypt.compare(password, userRow.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        // Gerar token JWT
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user.id,
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/auth/me - Obter informações do usuário atual
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, username, email, role, created_at FROM users WHERE id = ? LIMIT 1',
            [req.user.userId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        res.json(formatUser(rows[0]));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/users - Listar todos os usuários (apenas admin)
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, username, email, role, created_at FROM users ORDER BY id DESC');
        res.json(rows.map(formatUser));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/users/:id - Obter usuário específico (apenas admin)
app.get('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, username, email, role, created_at FROM users WHERE id = ? LIMIT 1',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        res.json(formatUser(rows[0]));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/users/:id - Editar usuário (apenas admin)
app.put('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { username, email, role, password } = req.body;
        const updates = [];
        const values = [];

        if (username) {
            updates.push('username = ?');
            values.push(username);
        }
        if (email) {
            updates.push('email = ?');
            values.push(email);
        }
        if (role && (role === 'admin' || role === 'user')) {
            updates.push('role = ?');
            values.push(role);
        }
        if (password && password.length >= 6) {
            updates.push('password = ?');
            values.push(await bcrypt.hash(password, 10));
        }

        if (updates.length > 0) {
            values.push(req.params.id);
            const [result] = await db.query(
                `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }
        }

        const [rows] = await db.query(
            'SELECT id, username, email, role, created_at FROM users WHERE id = ? LIMIT 1',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        
        res.json({ message: 'Usuário atualizado com sucesso', user: formatUser(rows[0]) });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Username ou email já estão em uso' });
        }
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/users/:id - Deletar usuário (apenas admin)
app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Não permitir deletar a si mesmo
        if (String(req.user.userId) === String(req.params.id)) {
            return res.status(400).json({ message: 'Você não pode deletar sua própria conta' });
        }
        
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        
        res.json({ message: 'Usuário deletado com sucesso' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST um novo projeto - Apenas usuários autenticados podem criar projetos
app.post('/api/projects', authenticateToken, upload.fields([
    { name: 'imageFiles', maxCount: 10 },
    { name: 'videoFile', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('[POST /api/projects] Recebendo novo projeto...');
        console.log('[POST /api/projects] Body:', req.body);
        console.log('[POST /api/projects] Files:', req.files);
        
        // Validar campos obrigatórios
        if (!req.body.name || !req.body.turma || !req.body.category || !req.body.description) {
            return res.status(400).json({ 
                message: 'Campos obrigatórios faltando',
                required: ['name', 'turma', 'category', 'description'],
                received: Object.keys(req.body)
            });
        }
        
        // Processar imagens
        const images = [];
        
        // Adicionar URLs de imagens enviadas
        if (req.body.imageUrls) {
            let imageUrls;
            // Se for string JSON, fazer parse
            if (typeof req.body.imageUrls === 'string') {
                try {
                    imageUrls = JSON.parse(req.body.imageUrls);
                    console.log('[POST /api/projects] imageUrls parseado:', imageUrls);
                } catch (e) {
                    console.log('[POST /api/projects] imageUrls não é JSON, tratando como string única');
                    // Se não for JSON válido, tratar como string única
                    imageUrls = [req.body.imageUrls];
                }
            } else {
                imageUrls = req.body.imageUrls;
            }
            
            // Garantir que é um array
            if (!Array.isArray(imageUrls)) {
                imageUrls = [imageUrls];
            }
            
            // Filtrar URLs válidas
            const validUrls = imageUrls.filter(url => url && url.trim());
            console.log('[POST /api/projects] URLs de imagens válidas:', validUrls);
            images.push(...validUrls);
        }
        
        // Adicionar imagens carregadas
        if (req.files && req.files.imageFiles) {
            console.log('[POST /api/projects] Arquivos de imagem recebidos:', req.files.imageFiles.length);
            req.files.imageFiles.forEach(file => {
                // Retornar caminho relativo para acesso via HTTP
                const imagePath = `/uploads/images/${file.filename}`;
                console.log('[POST /api/projects] Adicionando imagem:', imagePath);
                images.push(imagePath);
            });
        }
        
        console.log('[POST /api/projects] Total de imagens processadas:', images.length);
        
        // Validar que tem pelo menos uma imagem
        if (images.length === 0) {
            return res.status(400).json({ message: 'Pelo menos uma imagem é obrigatória' });
        }

        // Processar vídeo
        let videoUrl = req.body.videoUrl || null;
        if (req.files && req.files.videoFile && req.files.videoFile[0]) {
            videoUrl = `/uploads/videos/${req.files.videoFile[0].filename}`;
            console.log('[POST /api/projects] Vídeo processado:', videoUrl);
        }

        const [result] = await db.query(
            `INSERT INTO projects (name, turma, description, images_json, image, video_url, category)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                req.body.name,
                req.body.turma,
                req.body.description,
                JSON.stringify(images),
                images[0] || null,
                videoUrl,
                req.body.category
            ]
        );

        const [rows] = await db.query('SELECT * FROM projects WHERE id = ?', [result.insertId]);
        console.log('[POST /api/projects] Projeto salvo com sucesso. ID:', result.insertId);
        res.status(201).json(formatProject(rows[0]));
    } catch (err) {
        console.error('[POST /api/projects] Erro ao salvar projeto:', err);
        console.error('[POST /api/projects] Stack:', err.stack);
        res.status(400).json({ message: err.message });
    }
});



// 5. Rotas da API para Eventos

// GET todos os eventos
app.get('/api/events', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM events ORDER BY id DESC');
        res.json(rows.map(formatEvent));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST um novo evento - Apenas admin
app.post('/api/events', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [result] = await db.query(
            'INSERT INTO events (title, event_date, event_time) VALUES (?, ?, ?)',
            [req.body.title, req.body.date, req.body.time]
        );
        const [rows] = await db.query('SELECT * FROM events WHERE id = ?', [result.insertId]);
        res.status(201).json(formatEvent(rows[0]));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT (atualizar) um evento por ID - Apenas admin
app.put('/api/events/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [result] = await db.query(
            'UPDATE events SET title = ?, event_date = ?, event_time = ? WHERE id = ?',
            [req.body.title, req.body.date, req.body.time, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Evento não encontrado' });
        const [rows] = await db.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
        res.json(formatEvent(rows[0]));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE um evento por ID - Apenas admin
app.delete('/api/events/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM events WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Evento não encontrado' });
        res.json({ message: 'Evento excluído com sucesso' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Rota para criar primeiro admin (apenas se não existir nenhum admin)
app.post('/api/auth/create-admin', async (req, res) => {
    try {
        const [adminRows] = await db.query('SELECT COUNT(*) AS count FROM users WHERE role = ?', ['admin']);
        const adminCount = adminRows[0].count;
        
        if (adminCount > 0) {
            return res.status(403).json({ message: 'Já existe um administrador no sistema' });
        }

        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres' });
        }

        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
            [username, email]
        );
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Usuário ou email já existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, 'admin']
        );
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
        const admin = formatUser(rows[0]);

        const token = jwt.sign(
            { userId: admin.id, username: admin.username, role: admin.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Administrador criado com sucesso',
            token,
            user: {
                id: admin.id,
                _id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Usuário ou email já existe' });
        }
        res.status(400).json({ message: err.message });
    }
});

// Servir arquivos estáticos do frontend (assets) e views HTML
// IMPORTANTE: Isso deve vir DEPOIS das rotas da API
const frontendStatic = path.join(__dirname, '../frontend');
const frontendViews = path.join(__dirname, '../frontend/views');
app.use(express.static(frontendStatic));

// Rota para a página inicial do frontend (arquivo HTML nas views)
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendViews, 'index.html'));
});

// Redirecionar .htm para .html (compatibilidade) - DEVE VIR ANTES DO MIDDLEWARE DE ERRO
// Usar expressão regular para capturar arquivos .htm
app.get(/.*\.htm$/, (req, res) => {
    // Ignorar se for rota da API
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Rota da API não encontrada' });
    }
    
    const htmlPath = req.path.replace(/\.htm$/, '.html');
    const htmlFile = path.join(frontendViews, htmlPath);
    
    if (fs.existsSync(htmlFile)) {
        console.log(`[Redirect] ${req.path} -> ${htmlPath}`);
        return res.redirect(301, htmlPath);
    } else {
        console.log(`[404] Arquivo .htm não encontrado: ${req.path} (tentou: ${htmlPath})`);
        return res.status(404).json({ 
            error: 'Arquivo não encontrado',
            path: req.path,
            message: `O arquivo ${req.path} não foi encontrado.`,
            suggestion: `Tente acessar ${htmlPath} se o arquivo existir.`,
            availableFiles: [
                'index.html',
                'projetos.html',
                'admin.html',
                'cadastro.html',
                'login.html',
                'calendario.html',
                'cadastro-usuario.html',
                'test-api.html'
            ]
        });
    }
});

// Middleware para tratar arquivos não encontrados (deve vir ANTES do catch-all)
app.use((req, res, next) => {
    // Ignorar rotas da API
    if (req.path.startsWith('/api/')) {
        return next();
    }
    
    // Se for um arquivo com extensão .html, verificar se existe
    if (req.path.match(/\.html$/)) {
        const requestedFile = path.join(frontendViews, req.path);
        if (fs.existsSync(requestedFile)) {
            return res.sendFile(requestedFile);
        } else {
            // Arquivo não encontrado - retornar 404 com mensagem útil
            console.log(`[404] Arquivo não encontrado: ${req.path}`);
            return res.status(404).json({ 
                error: 'Arquivo não encontrado',
                path: req.path,
                message: `O arquivo ${req.path} não foi encontrado.`,
                hint: 'Verifique se o nome do arquivo está correto.',
                availableFiles: [
                    'index.html',
                    'projetos.html',
                    'admin.html',
                    'cadastro.html',
                    'login.html',
                    'calendario.html',
                    'cadastro-usuario.html',
                    'test-api.html'
                ]
            });
        }
    }
    
    // Para outros arquivos estáticos, deixar o express.static tratar
    next();
});

// Rota catch-all para SPA: servir index.html para todas as rotas não-API
// Isso permite que o frontend funcione mesmo com URLs diretas
// Usar expressão regular para capturar todas as rotas
app.get(/.*/, (req, res) => {
    // Ignorar rotas da API (já tratadas acima)
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Rota da API não encontrada' });
    }
    
    // Ignorar arquivos estáticos (já tratados pelo express.static)
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|html|htm|json)$/)) {
        return res.status(404).json({ 
            error: 'Arquivo não encontrado',
            path: req.path
        });
    }
    
    // Para todas as outras rotas (sem extensão), servir index.html (SPA behavior)
    const indexPath = path.join(frontendViews, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({ 
            error: 'Página não encontrada',
            message: 'O arquivo index.html não foi encontrado no frontend.'
        });
    }
});

// 6. Iniciar o servidor
const startServer = async () => {
    try {
        await initDatabase();
        console.log(`Conectado ao MySQL em ${MYSQL_HOST}:${MYSQL_PORT}/${MYSQL_DATABASE}`);
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Servidor rodando na porta ${PORT}`);
            console.log(`Frontend assets: ${frontendStatic}`);
            console.log(`Frontend views (HTML): ${frontendViews}`);
            console.log(`Acesse: http://localhost:${PORT}`);
        });
    } catch (err) {
        if (err && err.code === 'ECONNREFUSED') {
            console.error(
                `Erro ao inicializar MySQL: ligação recusada em ${MYSQL_HOST}:${MYSQL_PORT}. ` +
                'Confirma se o servidor MySQL está em execução e se a porta no .env está correta.'
            );
        } else if (err && err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error(
                `Erro ao inicializar MySQL: acesso negado para o utilizador "${MYSQL_USER}". ` +
                'Verifica MYSQL_USER e MYSQL_PASSWORD no .env.'
            );
        } else if (err && err.code === 'ER_BAD_DB_ERROR') {
            console.error(
                `Erro ao inicializar MySQL: a base de dados "${MYSQL_DATABASE}" não existe. ` +
                'Cria a base ou atualiza MYSQL_DATABASE no .env.'
            );
        } else {
            console.error('Erro ao inicializar MySQL:', err);
        }
        process.exit(1);
    }
};

startServer();
