// cadastro.js - criação de novos projetos

document.addEventListener('DOMContentLoaded', () => {
    // Exigir utilizador autenticado (não precisa ser admin)
    if (typeof requireAuth === 'function') {
        if (!requireAuth(false)) return;
    }

    const form = document.getElementById('projectForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('projectName');
        const turmaInput = document.getElementById('projectTurma');
        const categoryInput = document.getElementById('projectCategory');
        const descriptionInput = document.getElementById('projectDescription');
        const imagesInput = document.getElementById('projectImages');
        const imageUrlsInput = document.getElementById('projectImageUrls');
        const videoFileInput = document.getElementById('projectVideo');
        const videoUrlInput = document.getElementById('projectVideoUrl');

        const name = nameInput.value.trim();
        const turma = turmaInput.value.trim();
        const category = categoryInput.value;
        const description = descriptionInput.value.trim();

        if (!name || !turma || !category || !description) {
            alert('Preencha Nome, Turma, Categoria e Descrição.');
            return;
        }

        // Preparar FormData para multipart/form-data
        const formData = new FormData();
        formData.append('name', name);
        formData.append('turma', turma);
        formData.append('category', category);
        formData.append('description', description);

        // URLs de imagens (opcional) - uma por linha
        const rawUrls = (imageUrlsInput.value || '').split('\n')
            .map(u => u.trim())
            .filter(u => u.length > 0);
        if (rawUrls.length > 0) {
            // Enviar como JSON, o backend já trata string JSON
            formData.append('imageUrls', JSON.stringify(rawUrls));
        }

        // Ficheiros de imagem (campo precisa chamar-se imageFiles para bater com o backend)
        const imageFiles = imagesInput.files;
        if (imageFiles && imageFiles.length > 0) {
            for (let i = 0; i < imageFiles.length; i++) {
                formData.append('imageFiles', imageFiles[i]);
            }
        }

        // Ficheiro de vídeo opcional (campo videoFile no backend)
        const videoFile = videoFileInput.files[0];
        if (videoFile) {
            formData.append('videoFile', videoFile);
        }

        // URL de vídeo opcional
        const videoUrl = videoUrlInput.value.trim();
        if (videoUrl) {
            formData.append('videoUrl', videoUrl);
        }

        // O backend exige pelo menos uma imagem (via upload ou URL)
        if (rawUrls.length === 0 && (!imageFiles || imageFiles.length === 0)) {
            alert('É obrigatório pelo menos uma imagem (ficheiro ou URL).');
            return;
        }

        try {
            // Construir headers com Authorization, mas sem forçar Content-Type
            let headers = {};
            if (typeof auth !== 'undefined' && typeof auth.getAuthHeaders === 'function') {
                headers = auth.getAuthHeaders();
                delete headers['Content-Type'];
                delete headers['content-type'];
            }

            const response = await fetch(`/api/projects`, {
                method: 'POST',
                headers,
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                console.error('[cadastro] Erro ao criar projeto:', response.status, errorText);
                let message = 'Erro ao criar projeto.';
                try {
                    const data = JSON.parse(errorText);
                    if (data && data.message) message = data.message;
                } catch (_) {}
                alert(message);
                return;
            }

            const created = await response.json().catch(() => null);
            console.log('[cadastro] Projeto criado com sucesso:', created);

            alert('Projeto criado com sucesso!');

            // Sinalizar outras abas/páginas para recarregarem a lista de projetos
            try {
                localStorage.setItem('projectsUpdated', Date.now().toString());
            } catch (e) {
                console.warn('[cadastro] Não foi possível escrever em localStorage:', e);
            }

            try {
                if (typeof BroadcastChannel !== 'undefined') {
                    const bc = new BroadcastChannel('projects_channel');
                    bc.postMessage('projectsUpdated');
                    bc.close();
                }
            } catch (e) {
                console.warn('[cadastro] BroadcastChannel não disponível:', e);
            }

            form.reset();
            // Opcional: redirecionar para a página de projetos
            // window.location.href = 'projetos.html';
        } catch (err) {
            console.error('[cadastro] Erro inesperado ao enviar projeto:', err);
            alert('Erro inesperado ao enviar projeto: ' + err.message);
        }
    });
});

