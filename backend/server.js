const path = require('path');
require('dotenv').config(); // Carrega variáveis de ambiente do .env
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000; // Porta do servidor, ou 3000 por padrão
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test'; // URI do MongoDB
const JWT_SECRET = process.env.JWT_SECRET || 'seu_secret_key_super_seguro_aqui_mude_em_producao'; // Secret para JWT

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

// 1. Conexão com o MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Conectado ao MongoDB!'))
    .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// 2. Middlewares
app.use(cors()); // Permite requisições de diferentes origens (seu frontend)
app.use(express.json()); // Habilita o Express a ler JSON no corpo das requisições
app.use(express.urlencoded({ limit: '500mb', extended: true })); // Para formulários urlencoded

// Servir arquivos estáticos de uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 3. Definição dos Schemas e Modelos (Mongoose)
// ... (código anterior: require, mongoose.connect, middlewares, etc.)

// Schema para Users
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    createdAt: { type: Date, default: Date.now }
});

// Hash da senha antes de salvar
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Método para comparar senhas
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

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

// Schema para Projetos 
const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    turma: { type: String, required: true }, // Antigo 'price', agora 'turma'
    description: { type: String, required: true },
    // Suporte a múltiplas imagens; manter compat com campo único antigo via transformação no POST
    images: { type: [String], default: [], validate: arr => Array.isArray(arr) },
    image: { type: String, default: null }, // Capa do projeto (primeira imagem)
    // URL opcional de vídeo (YouTube/Vimeo ou arquivo)
    videoUrl: { type: String, default: null },
    category: { 
        type: String, 
        enum: ['completo', 'incompleto', 'ideia'], 
        required: true 
    } // Nova categoria obrigatória
});
const Project = mongoose.model('Project', projectSchema);

// ... (schema de Event permanece igual)

// Rotas da API para Projetos (antigo Products)

// GET todos os projetos
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await Project.find();
        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// PUT (atualizar) um projeto por ID - Apenas admin
app.put('/api/projects/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const body = { ...req.body };
        if (!Array.isArray(body.images)) {
            if (body.image) {
                body.images = [body.image];
                delete body.image;
            }
        }
        const updatedProject = await Project.findByIdAndUpdate(req.params.id, body, { new: true });
        if (!updatedProject) return res.status(404).json({ message: 'Projeto não encontrado' });
        res.json(updatedProject);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE um projeto por ID - Apenas admin
app.delete('/api/projects/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const deletedProject = await Project.findByIdAndDelete(req.params.id);
        if (!deletedProject) return res.status(404).json({ message: 'Projeto não encontrado' });
        res.json({ message: 'Projeto excluído com sucesso' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ... (rotas de eventos permanecem iguais)

// ... (resto do server.js: app.listen, etc.)

// Schema para Eventos
const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: String, required: true }, // Formato 'YYYY-MM-DD'
    time: { type: String, required: true }  // Formato 'HH:MM'
    // id: { type: String, unique: true, required: true } // Mongoose gera _id automaticamente, não precisamos de um id manual
});
const Event = mongoose.model('Event', eventSchema);


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

        // Verificar se usuário já existe
        const existingUser = await User.findOne({ 
            $or: [{ username }, { email }] 
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Usuário ou email já existe' });
        }

        // Criar novo usuário (apenas admin pode criar outros admins)
        const userRole = role === 'admin' ? 'user' : (role || 'user'); // Por segurança, não permitir criar admin diretamente

        const user = new User({
            username,
            email,
            password,
            role: userRole
        });

        await user.save();

        // Gerar token JWT
        const token = jwt.sign(
            { userId: user._id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Usuário criado com sucesso',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
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

        // Buscar usuário (pode ser por username ou email)
        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        });

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        // Verificar senha
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        // Gerar token JWT
        const token = jwt.sign(
            { userId: user._id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user._id,
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
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        res.json(user);
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
        // Processar imagens
        const images = [];
        
        // Adicionar URLs de imagens enviadas
        if (req.body.imageUrls) {
            const imageUrls = Array.isArray(req.body.imageUrls) 
                ? req.body.imageUrls 
                : [req.body.imageUrls];
            images.push(...imageUrls.filter(url => url && url.trim()));
        }
        
        // Adicionar imagens carregadas
        if (req.files && req.files.imageFiles) {
            req.files.imageFiles.forEach(file => {
                // Retornar caminho relativo para acesso via HTTP
                images.push(`/uploads/images/${file.filename}`);
            });
        }
        
        // Validar que tem pelo menos uma imagem
        if (images.length === 0) {
            return res.status(400).json({ message: 'Pelo menos uma imagem é obrigatória' });
        }

        // Processar vídeo
        let videoUrl = req.body.videoUrl || null;
        if (req.files && req.files.videoFile && req.files.videoFile[0]) {
            videoUrl = `/uploads/videos/${req.files.videoFile[0].filename}`;
        }

        const project = new Project({
            name: req.body.name,
            turma: req.body.turma,
            description: req.body.description,
            images: images,
            image: images[0], // Primeira imagem como capa (compatibilidade)
            videoUrl: videoUrl,
            category: req.body.category
        });

        const newProject = await project.save();
        res.status(201).json(newProject);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});



// 5. Rotas da API para Eventos

// GET todos os eventos
app.get('/api/events', async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST um novo evento - Apenas admin
app.post('/api/events', authenticateToken, requireAdmin, async (req, res) => {
    const event = new Event({
        title: req.body.title,
        date: req.body.date,
        time: req.body.time
    });
    try {
        const newEvent = await event.save();
        res.status(201).json(newEvent);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT (atualizar) um evento por ID - Apenas admin
app.put('/api/events/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedEvent) return res.status(404).json({ message: 'Evento não encontrado' });
        res.json(updatedEvent);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE um evento por ID - Apenas admin
app.delete('/api/events/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const deletedEvent = await Event.findByIdAndDelete(req.params.id);
        if (!deletedEvent) return res.status(404).json({ message: 'Evento não encontrado' });
        res.json({ message: 'Evento excluído com sucesso' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Rota para criar primeiro admin (apenas se não existir nenhum admin)
app.post('/api/auth/create-admin', async (req, res) => {
    try {
        const adminCount = await User.countDocuments({ role: 'admin' });
        
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

        const existingUser = await User.findOne({ 
            $or: [{ username }, { email }] 
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Usuário ou email já existe' });
        }

        const admin = new User({
            username,
            email,
            password,
            role: 'admin'
        });

        await admin.save();

        const token = jwt.sign(
            { userId: admin._id, username: admin.username, role: admin.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Administrador criado com sucesso',
            token,
            user: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Servir arquivos estáticos do frontend (usar caminho absoluto)
app.use(express.static(path.join(__dirname, '../frontend'))); // Garante caminho correto independentemente do diretório de execução
// ... (suas rotas /api/products e /api/events)
// Rota para a página inicial do frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// 6. Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
