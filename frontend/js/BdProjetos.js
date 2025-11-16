// --- Lógica de Produtos (agora com Backend) ---
const API_URL = 'http://localhost:3000/api';
let projects = []; // Array de projetos carregado do backend

//  elementos de modal (projetos) - serão inicializados no DOMContentLoaded
let modal, modalTitle, modalTurma, modalCategory, modalDescription, modalImage, closeBtn;

function openModalByIndex(index) {
    const project = projects[index];
    if (!project) return;

    // Verificar se os elementos do modal existem
    if (!modal || !modalTitle || !modalTurma || !modalCategory || !modalDescription) {
        console.error('Elementos do modal não encontrados');
        return;
    }

    modalTitle.textContent = project.name;
    modalTurma.textContent = `Turma: ${project.turma}`;
    modalCategory.textContent = `Categoria: ${project.category}`;
    modalDescription.textContent = project.description;

    // Render galeria de imagens e vídeo dentro do modal
    const modalBody = document.querySelector('#projectModal .modal-body');
    if (modalBody) {
        // Limpar apenas a galeria e vídeo, mantendo os elementos de texto
        const existingGallery = modalBody.querySelector('.modal-gallery');
        const existingVideo = modalBody.querySelector('.modal-video');
        if (existingGallery) existingGallery.remove();
        if (existingVideo) existingVideo.remove();

        // Galeria simples: se houver várias imagens, mostrar todas; caso contrário, capa
        const images = Array.isArray(project.images) ? project.images : (project.image ? [project.image] : []);
        if (images.length) {
            const gallery = document.createElement('div');
            gallery.className = 'modal-gallery';
            images.forEach((src, idx) => {
                const img = document.createElement('img');
                img.src = src;
                img.alt = project.name + ' imagem ' + (idx + 1);
                gallery.appendChild(img);
            });
            modalBody.appendChild(gallery);
        }

        // Vídeo opcional
        if (project.videoUrl) {
            const videoWrapper = document.createElement('div');
            videoWrapper.className = 'modal-video';

            // Tentar detectar YouTube para embed, senão usar <video>
            const isYouTube = /youtube\.com|youtu\.be/.test(project.videoUrl);
            if (isYouTube) {
                // Converter possíveis formatos em embed
                let embedUrl = project.videoUrl;
                const match = project.videoUrl.match(/(?:v=|be\/)([A-Za-z0-9_-]{11})/);
                if (match && match[1]) {
                    embedUrl = 'https://www.youtube.com/embed/' + match[1];
                }
                const iframe = document.createElement('iframe');
                iframe.src = embedUrl;
                iframe.width = '100%';
                iframe.height = '360';
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
                iframe.allowFullscreen = true;
                videoWrapper.appendChild(iframe);
            } else {
                const video = document.createElement('video');
                video.controls = true;
                video.src = project.videoUrl;
                video.style.width = '100%';
                videoWrapper.appendChild(video);
            }
            modalBody.appendChild(videoWrapper);
        }
    }

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    // Adicionar classe para animação
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function closeModal() {
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }
}

// --- Funções para carregar os projetos ---
async function fetchProjects() {
    try {
        console.log('Carregando projetos...');
        const response = await fetch(`${API_URL}/projects`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        projects = await response.json();
        console.log('Projetos carregados:', projects);
        renderProjects(); // Renderiza os projetos no grid
    } catch (error) {
        console.error('Erro ao carregar projetos:', error);
        // Mostrar mensagem de erro no grid
        const projectGrid = document.querySelector('.project-grid');
        if (projectGrid) {
            projectGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: red;">Erro ao carregar projetos. Verifique se o servidor está rodando.</p>';
        }
    }
}

function renderProjects() {
    const projectGrid = document.querySelector('.project-grid');
    if (!projectGrid) {
        console.error('Grid de projetos não encontrado no DOM');
        return;
    }
    
    console.log('Renderizando projetos:', projects);
    projectGrid.innerHTML = ''; // Limpa o grid existente

    if (projects.length === 0) {
        projectGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">Nenhum projeto disponível.</p>';
        return;
    }

    projects.forEach((project, index) => {
        const projectItem = document.createElement('div');
        projectItem.classList.add('project-item', project.category || '');
        projectItem.setAttribute('data-index', index);
        
        // Melhorar a lógica para obter a imagem
        let thumbSrc = '';
        if (Array.isArray(project.images) && project.images.length > 0) {
            thumbSrc = project.images[0];
        } else if (project.image) {
            thumbSrc = project.image;
        } else {
            thumbSrc = 'https://via.placeholder.com/300x200/cccccc/666666?text=Sem+Imagem';
        }
        
        projectItem.innerHTML = `
            <div class="project-thumb">
                <img src="${thumbSrc}" alt="${project.name}" onerror="this.src='https://via.placeholder.com/300x200/cccccc/666666?text=Erro+na+Imagem'">
                <span class="badge">${project.category || ''}</span>
            </div>
            <div class="project-info">
                <h3>${project.name}</h3>
                <p class="turma">Turma: ${project.turma || '-'}</p>
            </div>
        `;
        projectGrid.appendChild(projectItem);

        projectItem.addEventListener('click', () => {
            console.log('Clicou no projeto:', project.name, 'índice:', index);
            openModalByIndex(index);
        });
    });
    
    console.log('Projetos renderizados com sucesso');
}

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar elementos do DOM
    modal = document.getElementById('projectModal');
    modalTitle = document.getElementById('modalTitle');
    modalTurma = document.getElementById('modalTurma');
    modalCategory = document.getElementById('modalCategory');
    modalDescription = document.getElementById('modalDescription');
    modalImage = document.getElementById('modalImage');
    closeBtn = document.querySelector('#projectModal .close');
    
    // Verificar se os elementos existem
    if (!modal) {
        console.error('Modal não encontrado no DOM');
        return;
    }
    
    fetchProjects(); // Carrega os projetos do backend
    
    // Fechar modal via X
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    // Fechar clicando fora do conteúdo do modal
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
    // Fechar via tecla ESC
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
});
