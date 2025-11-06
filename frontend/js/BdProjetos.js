// --- Lógica de Produtos (agora com Backend) ---
const API_URL = 'http://localhost:3000/api';
let projects = []; // Array de projetos carregado do backend

//  elementos de modal (projetos)
const modal = document.getElementById('projectModal');
const modalTitle = document.getElementById('modalTitle');
const modalTurma = document.getElementById('modalTurma');
const modalCategory = document.getElementById('modalCategory');
const modalDescription = document.getElementById('modalDescription');
const modalImage = document.getElementById('modalImage');
// elementos novos para galeria/vídeo (serão criados dinamicamente)
const closeBtn = document.querySelector('#projectModal .close');

function openModalByIndex(index) {
    const project = projects[index];
    if (!project) return;

    modalTitle.textContent = project.name;
    modalTurma.textContent = `Turma: ${project.turma}`;
    modalCategory.textContent = `Categoria: ${project.category}`;
    modalDescription.textContent = project.description;

    // Render galeria de imagens e vídeo dentro do modal
    const modalBody = document.querySelector('#projectModal .modal-body');
    if (modalBody) {
        modalBody.innerHTML = '';

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
}

function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

// --- Funções para carregar os projetos ---
async function fetchProjects() {
    try {
        const response = await fetch(`${API_URL}/projects`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        projects = await response.json();
        renderProjects(); // Renderiza os projetos no grid
    } catch (error) {
        console.error('Erro ao carregar projetos:', error);
        
    }
}

function renderProjects() {
    const projectGrid = document.querySelector('.project-grid');
    if (!projectGrid) return;
    projectGrid.innerHTML = ''; // Limpa o grid existente

    if (projects.length === 0) {
        projectGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">Nenhum projeto disponível.</p>';
        return;
    }

    projects.forEach((project, index) => {
        const projectItem = document.createElement('div');
        projectItem.classList.add('project-item', project.category || '');
        projectItem.setAttribute('data-index', index);
        const thumbSrc = Array.isArray(project.images) && project.images.length ? project.images[0] : (project.image || '');
        projectItem.innerHTML = `
            <div class="project-thumb">
                <img src="${thumbSrc}" alt="${project.name}">
                <span class="badge">${project.category || ''}</span>
            </div>
            <div class="project-info">
                <h3>${project.name}</h3>
                <p class="turma">Turma: ${project.turma || '-'}</p>
            </div>
        `;
        projectGrid.appendChild(projectItem);

        projectItem.addEventListener('click', () => {
            openModalByIndex(index);
        });
    });
}

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
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
