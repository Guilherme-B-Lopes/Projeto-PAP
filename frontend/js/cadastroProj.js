// cadastroProjeto.js
const API_URL = 'http://localhost:3000/api';

document.getElementById('projectForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const name = document.getElementById('projectName').value;
    const turma = document.getElementById('projectTurma').value; 
    const category = document.getElementById('projectCategory').value; 
    const description = document.getElementById('projectDescription').value;
    const imagesText = document.getElementById('projectImages').value;
    const videoUrl = document.getElementById('projectVideo').value;

    if (!name || !turma || !category || !description || !imagesText) {
        alert('Por favor, preencha todos os campos obrigatórios!');
        return;
    }

    const images = imagesText
        .split(/\r?\n/)
        .map(s => s.trim())
        .filter(Boolean);

    if (images.length === 0) {
        alert('Adicione pelo menos uma URL de imagem válida.');
        return;
    }

    const newProject = { name, turma, category, description, images, image: images[0], videoUrl: videoUrl || null }; // Compat: inclui 'image' como capa

    try {
        const response = await fetch(`${API_URL}/projects`, { // Mudança: /projects
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newProject)
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
        // Opcional: redirecionar para a página inicial ou admin
        // window.location.href = 'index.html#produtos';
    } catch (error) {
        console.error('Erro ao cadastrar projeto:', error);
        alert('Erro ao cadastrar projeto: ' + (error && error.message ? error.message : 'verifique o console.'));
    }
});
