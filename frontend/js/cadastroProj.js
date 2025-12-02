// cadastroProjeto.js
const API_URL = 'http://localhost:3000/api';

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
    
    const images = [];

    // Adicionar URLs de imagens
    if (imageUrlsText.trim()) {
        const urls = imageUrlsText
            .split(/\r?\n/)
            .map(s => s.trim())
            .filter(Boolean);
        images.push(...urls);
    }

    // Adicionar imagens carregadas
    if (imageFilesInput.files.length > 0) {
        for (let file of imageFilesInput.files) {
            images.push(file);
        }
    }

    // Validar imagens
    if (images.length === 0) {
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

    // Adicionar imagens
    images.forEach((image, index) => {
        if (image instanceof File) {
            formData.append(`imageFiles`, image);
        } else {
            formData.append(`imageUrls`, image);
        }
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
        const response = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            body: formData
            // NÃO definir Content-Type: application/json - o navegador vai definir multipart/form-data automaticamente
        });

        if (!response.ok) {
            let errorText = '';
            try {
                const errJson = await response.json();
                errorText = errJson && errJson.message ? errJson.message : JSON.stringify(errJson);
            } catch (e) {
                errorText = await response.text();
            }
            throw new Error(`Falha ao cadastrar: ${response.status} ${errorText}`);
        }

        const addedProject = await response.json();
        alert('Projeto cadastrado com sucesso! ID: ' + addedProject._id);
        document.getElementById('projectForm').reset();
    } catch (error) {
        console.error('Erro ao cadastrar projeto:', error);
        alert('Erro ao cadastrar projeto: ' + (error && error.message ? error.message : 'verifique o console.'));
    }
});
