// cadastroProjeto.js
// Usar IIFE para isolar o escopo e evitar conflitos com outras declarações de API_URL
(function() {
    'use strict';
    
    // Declarar API_URL localmente dentro da IIFE para evitar conflitos
    const API_URL = 'http://localhost:3000/api';

    // Verificar autenticação antes de permitir cadastro
    if (typeof requireAuth === 'function') {
        requireAuth();
    }

    document.getElementById('projectForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const name = document.getElementById('projectName').value;
    const turma = document.getElementById('projectTurma').value; 
    const category = document.getElementById('projectCategory').value; 
    const description = document.getElementById('projectDescription').value;

    if (!name || !turma || !category || !description) {
        alert('Por favor, preencha todos os campos obrigatórios!');
        return;
    }

    // Processar imagens (arquivos + URLs)
    const imageFilesInput = document.getElementById('projectImages');
    const imageUrlsText = document.getElementById('projectImageUrls').value;
    
    const imageUrls = [];
    const imageFiles = [];

    // Processar URLs de imagens
    if (imageUrlsText.trim()) {
        const urls = imageUrlsText
            .split(/\r?\n/)
            .map(s => s.trim())
            .filter(Boolean);
        imageUrls.push(...urls);
    }

    // Processar arquivos de imagens
    if (imageFilesInput.files.length > 0) {
        for (let file of imageFilesInput.files) {
            imageFiles.push(file);
        }
    }

    // Validar que tem pelo menos uma imagem (URL ou arquivo)
    if (imageUrls.length === 0 && imageFiles.length === 0) {
        alert('Por favor, adicione pelo menos uma imagem (arquivo ou URL).');
        return;
    }

    // Processar vídeo (arquivo ou URL)
    const videoFileInput = document.getElementById('projectVideo');
    const videoUrlInput = document.getElementById('projectVideoUrl').value;
    
    let videoData = null;
    if (videoFileInput.files.length > 0) {
        videoData = videoFileInput.files[0];
    } else if (videoUrlInput.trim()) {
        videoData = videoUrlInput.trim();
    }

    // Criar FormData para upload
    const formData = new FormData();
    formData.append('name', name);
    formData.append('turma', turma);
    formData.append('category', category);
    formData.append('description', description);

    // Adicionar URLs de imagens como JSON (para o backend processar corretamente)
    if (imageUrls.length > 0) {
        // Enviar como JSON stringificado para o backend processar como array
        formData.append('imageUrls', JSON.stringify(imageUrls));
    }

    // Adicionar arquivos de imagens
    imageFiles.forEach((file) => {
        formData.append('imageFiles', file);
    });

    // Adicionar vídeo
    if (videoData) {
        if (videoData instanceof File) {
            formData.append('videoFile', videoData);
        } else {
            formData.append('videoUrl', videoData);
        }
    }

    try {
        console.log('[cadastroProj] Iniciando envio do projeto...');
        console.log('[cadastroProj] Dados do formulário:', {
            name,
            turma,
            category,
            description,
            imageUrls: imageUrls.length,
            imageFiles: imageFiles.length,
            videoUrl: videoData
        });
        
        // Verificar autenticação
        if (!auth || !auth.isAuthenticated()) {
            alert('Você precisa estar logado para criar projetos!');
            window.location.href = 'login.html';
            return;
        }
        
        // Obter headers de autenticação
        const headers = auth.getAuthHeaders();
        // Remover Content-Type para permitir que o navegador defina multipart/form-data
        delete headers['Content-Type'];
        
        console.log('[cadastroProj] Enviando requisição para:', `${API_URL}/projects`);
        console.log('[cadastroProj] Headers:', headers);
        
        const response = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: headers,
            body: formData
            // NÃO definir Content-Type: application/json - o navegador vai definir multipart/form-data automaticamente
        });

        console.log('[cadastroProj] Resposta recebida. Status:', response.status, response.statusText);

        if (!response.ok) {
            let errorText = '';
            try {
                const errJson = await response.json();
                errorText = errJson && errJson.message ? errJson.message : JSON.stringify(errJson);
                console.error('[cadastroProj] Erro da API:', errJson);
            } catch (e) {
                errorText = await response.text();
                console.error('[cadastroProj] Erro ao processar resposta:', errorText);
            }
            throw new Error(`Falha ao cadastrar: ${response.status} ${errorText}`);
        }

        const addedProject = await response.json();
        console.log('[cadastroProj] Projeto cadastrado com sucesso:', addedProject);
        alert('Projeto cadastrado com sucesso! ID: ' + addedProject._id);
        document.getElementById('projectForm').reset();
        
        // Opcional: redirecionar para a página de projetos
        // window.location.href = 'projetos.html';
    } catch (error) {
        console.error('[cadastroProj] Erro ao cadastrar projeto:', error);
        console.error('[cadastroProj] Stack:', error.stack);
        alert('Erro ao cadastrar projeto: ' + (error && error.message ? error.message : 'verifique o console.'));
    }
    });
})(); // Fim da IIFE
