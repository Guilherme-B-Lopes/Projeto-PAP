const path = require('path');
require('dotenv').config(); // Carrega variáveis de ambiente do .env
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000; // Porta do servidor, ou 3000 por padrão
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test'; // URI do MongoDB

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

// POST um novo projeto
app.post('/api/projects', upload.fields([
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

// PUT (atualizar) um projeto por ID
app.put('/api/projects/:id', async (req, res) => {
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

// DELETE um projeto por ID
app.delete('/api/projects/:id', async (req, res) => {
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


// Servir arquivos estáticos do frontend (usar caminho absoluto)
app.use(express.static(path.join(__dirname, '../frontend'))); // Garante caminho correto independentemente do diretório de execução
// ... (suas rotas /api/products e /api/events)
// Rota para a página inicial do frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
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

// POST um novo evento
app.post('/api/events', async (req, res) => {
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

// PUT (atualizar) um evento por ID
app.put('/api/events/:id', async (req, res) => {
    try {
        const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedEvent) return res.status(404).json({ message: 'Evento não encontrado' });
        res.json(updatedEvent);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE um evento por ID
app.delete('/api/events/:id', async (req, res) => {
    try {
        const deletedEvent = await Event.findByIdAndDelete(req.params.id);
        if (!deletedEvent) return res.status(404).json({ message: 'Evento não encontrado' });
        res.json({ message: 'Evento excluído com sucesso' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// 6. Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
