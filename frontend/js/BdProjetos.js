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
        console.log('[BdProjetos] Iniciando carregamento de projetos...');
        console.log('[BdProjetos] URL da API:', API_URL + '/projects');
        
        const response = await fetch(`${API_URL}/projects`);
        console.log('[BdProjetos] Resposta recebida. Status:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[BdProjetos] Erro na resposta:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        projects = await response.json();
        console.log('[BdProjetos] Projetos carregados com sucesso. Total:', projects.length);
        console.log('[BdProjetos] Dados dos projetos:', projects);
        
        if (!Array.isArray(projects)) {
            console.error('[BdProjetos] ERRO: projects não é um array! Tipo:', typeof projects);
            throw new Error('Resposta da API não é um array');
        }
        
        renderProjects(); // Renderiza os projetos no grid
    } catch (error) {
        console.error('[BdProjetos] Erro ao carregar projetos:', error);
        console.error('[BdProjetos] Stack trace:', error.stack);
        
        // Mostrar mensagem de erro no grid
        const projectGrid = document.querySelector('.project-grid');
        if (projectGrid) {
            projectGrid.innerHTML = `
                <div style="text-align: center; grid-column: 1 / -1; color: red; padding: 2rem;">
                    <h3>Erro ao carregar projetos</h3>
                    <p><strong>Erro:</strong> ${error.message}</p>
                    <p><strong>URL:</strong> ${API_URL}/projects</p>
                    <p>Verifique se o servidor está rodando e acessível.</p>
                    <p style="margin-top: 1rem; font-size: 0.9rem; color: #666;">Abra o console do navegador (F12) para mais detalhes.</p>
                </div>
            `;
        } else {
            console.error('[BdProjetos] ERRO CRÍTICO: Elemento .project-grid não encontrado no DOM!');
        }
    }
}

function renderProjects() {
    console.log('[BdProjetos] Iniciando renderização de projetos...');
    console.log('[BdProjetos] Total de projetos para renderizar:', projects.length);
    
    const projectGrid = document.querySelector('.project-grid');
    if (!projectGrid) {
        console.error('[BdProjetos] ERRO: Grid de projetos não encontrado no DOM!');
        console.error('[BdProjetos] Tentando encontrar elementos...');
        const allGrids = document.querySelectorAll('[class*="grid"]');
        console.log('[BdProjetos] Elementos com "grid" no nome:', allGrids);
        return;
    }
    
    console.log('[BdProjetos] Grid encontrado:', projectGrid);
    console.log('[BdProjetos] Renderizando projetos:', projects);
    
    projectGrid.innerHTML = ''; // Limpa o grid existente

    if (projects.length === 0) {
        console.warn('[BdProjetos] Nenhum projeto para renderizar');
        projectGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; padding: 2rem;">Nenhum projeto disponível.</p>';
        return;
    }

    let renderedCount = 0;
    projects.forEach((project, index) => {
        try {
            console.log(`[BdProjetos] Renderizando projeto ${index + 1}/${projects.length}:`, project.name);
            
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
                    <img src="${thumbSrc}" alt="${project.name || 'Projeto'}" onerror="this.src='https://via.placeholder.com/300x200/cccccc/666666?text=Erro+na+Imagem'">
                    <span class="badge">${project.category || ''}</span>
                </div>
                <div class="project-info">
                    <h3>${project.name || 'Sem nome'}</h3>
                    <p class="turma">Turma: ${project.turma || '-'}</p>
                </div>
            `;
            projectGrid.appendChild(projectItem);
            renderedCount++;

            projectItem.addEventListener('click', () => {
                console.log('Clicou no projeto:', project.name, 'índice:', index);
                openModalByIndex(index);
            });
        } catch (error) {
            console.error(`[BdProjetos] Erro ao renderizar projeto ${index}:`, error);
        }
    });
    
    console.log(`[BdProjetos] Renderização concluída! ${renderedCount} projeto(s) renderizado(s) com sucesso`);
    console.log('[BdProjetos] Grid final:', projectGrid);
    console.log('[BdProjetos] Filhos do grid:', projectGrid.children.length);
}

// --- Inicialização ---
function initializeProjects() {
    console.log('[BdProjetos] Inicializando módulo de projetos...');
    console.log('[BdProjetos] Estado do documento:', document.readyState);
    
    // Inicializar elementos do DOM
    modal = document.getElementById('projectModal');
    modalTitle = document.getElementById('modalTitle');
    modalTurma = document.getElementById('modalTurma');
    modalCategory = document.getElementById('modalCategory');
    modalDescription = document.getElementById('modalDescription');
    modalImage = document.getElementById('modalImage');
    closeBtn = document.querySelector('#projectModal .close');
    
    // Verificar se o grid existe
    const projectGrid = document.querySelector('.project-grid');
    if (!projectGrid) {
        console.error('[BdProjetos] ERRO CRÍTICO: Elemento .project-grid não encontrado!');
        console.error('[BdProjetos] Verificando se a página tem a estrutura correta...');
        const productsSection = document.querySelector('.products, #produtos');
        console.log('[BdProjetos] Seção de produtos encontrada:', productsSection);
        return false;
    }
    
    console.log('[BdProjetos] Grid encontrado:', projectGrid);
    console.log('[BdProjetos] Modal encontrado:', modal);
    
    // Sempre carregar projetos, mesmo se o modal não existir
    console.log('[BdProjetos] Iniciando carregamento de projetos...');
    fetchProjects(); // Carrega os projetos do backend
    
    // Configurar modal apenas se existir
    if (modal) {
        console.log('[BdProjetos] Configurando modal...');
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
    } else {
        console.warn('[BdProjetos] Modal de projetos não encontrado - funcionalidade de detalhes desabilitada');
    }
    
    console.log('[BdProjetos] Inicialização concluída');
    return true;
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProjects);
} else {
    // DOM já está carregado (script foi carregado de forma async)
    initializeProjects();
}
