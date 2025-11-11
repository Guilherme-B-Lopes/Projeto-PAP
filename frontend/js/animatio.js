// trasicao de slides 
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;

function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    if (slides[index]) {
        slides[index].classList.add('active');
    }
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    showSlide(currentSlide);
}

// Muda o slide a cada 3 segundos
if (totalSlides > 0) {
    setInterval(nextSlide, 3000);
    showSlide(currentSlide);
}


document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container .ini');
    if (!container) return;

    // 1) Dividir o texto em caracteres e embrulhar em spans
    const original = container.textContent;
    const spansHtml = Array.from(original).map((ch, idx) => {
        const safe = ch === ' ' ? '&nbsp;' : ch;
        return `<span class="char" data-idx="${idx}">${safe}</span>`;
    }).join('');
    container.innerHTML = spansHtml;

    const chars = container.querySelectorAll('.char');
    chars.forEach(el => { el.style.display = 'inline-block'; });

    // 2) Animação com Web Animations API (stagger simples)
    const totalDuration = 650;
    const baseDelay = 15; // ms por caractere
    chars.forEach((el, i) => {
        const fromY = i % 2 === 0 ? '-100%' : '100%';
        el.animate([
            { transform: `translateY(${fromY})`, opacity: 0 },
            { transform: 'translateY(0%)', opacity: 1 }
        ], {
            duration: totalDuration,
            easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
            delay: i * baseDelay,
            fill: 'both'
        });
    });
});
//Projeto
document.addEventListener('DOMContentLoaded', () => {
    const container1 = document.querySelector('.products .container h2');
    if (!container1) return;

    // 1) Dividir o texto em caracteres e embrulhar em spans
    const originalH2 = container1.textContent;
    const spansHtml = Array.from(originalH2).map((ch, idx) => {
        const safe = ch === ' ' ? '&nbsp;' : ch;
        return `<span class="char" data-idx="${idx}">${safe}</span>`;
    }).join('');
    container1.innerHTML = spansHtml;

    const charsH2 = container1.querySelectorAll('.char');
    charsH2.forEach(el => { el.style.display = 'inline-block'; });

    // 2) Animação com Web Animations API (stagger simples)
    const totalDuration = 650;
    const baseDelay = 15; // ms por caractere
    charsH2.forEach((el, i) => {
        const fromY = i % 2 === 0 ? '-100%' : '100%';
        el.animate([
            { transform: `translateY(${fromY})`, opacity: 0 },
            { transform: 'translateY(0%)', opacity: 1 }
        ], {
            duration: totalDuration,
            easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
            delay: i * baseDelay,
            fill: 'both'
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const paragraphs = document.querySelectorAll('.main-content .container p');
    if (!paragraphs.length) return;

    paragraphs.forEach(p => animateParagraphLines(p));

    function animateParagraphLines(pEl) {
        const original = pEl.textContent;
        if (!original) return;

        // 1) Envolver palavras para detectar quebras de linha reais (preserva espaços como nós de texto)
        const tokens = original.split(/(\s+)/); // mantém espaços
        pEl.innerHTML = tokens.map((t, i) => {
            if (t.trim() === '') {
                return t; // mantém espaços como texto normal
            }
            return `<span class="word" data-idx="${i}">${t}</span>`;
        }).join('');

        const wordEls = Array.from(pEl.querySelectorAll('.word'));
        if (!wordEls.length) return;

        // 2) Agrupar por linhas usando offsetTop
        const lines = [];
        let currentTop = null;
        let currentLine = [];
        wordEls.forEach((wEl, idx) => {
            const top = wEl.offsetTop;
            if (currentTop === null) {
                currentTop = top;
            }
            if (top !== currentTop && currentLine.length) {
                lines.push(currentLine);
                currentLine = [];
                currentTop = top;
            }
            // anexar também o espaço seguinte, se houver (nó de texto)
            const next = wEl.nextSibling;
            const spaceNode = next && next.nodeType === 3 ? next : null;
            currentLine.push({ span: wEl, space: spaceNode });
            // última palavra fecha linha
            if (idx === wordEls.length - 1) {
                lines.push(currentLine);
            }
        });

        // 3) Construir wrappers de linha (clip) e mover as palavras
        const frag = document.createDocumentFragment();
        lines.forEach((lineWords, lineIdx) => {
            const clip = document.createElement('span');
            clip.className = 'line-clip';
            const inner = document.createElement('span');
            inner.className = 'line-inner';
            inner.setAttribute('data-line', String(lineIdx));
            lineWords.forEach(obj => {
                inner.appendChild(obj.span);
                if (obj.space) inner.appendChild(obj.space);
            });
            clip.appendChild(inner);
            frag.appendChild(clip);
        });
        pEl.innerHTML = '';
        pEl.appendChild(frag);

        // 4) Animação semelhante ao h1: entrada alternando direção por linha, sem loop
        const innerLines = Array.from(pEl.querySelectorAll('.line-inner'));
        const duration = 650; // igual ao h1
        const easing = 'cubic-bezier(0.65, 0, 0.35, 1)';
        const lineStagger = 125; // semelhante ao exemplo do h1/words

        innerLines.forEach((el, i) => {
            const fromY = i % 2 === 0 ? '-100%' : '100%';
            el.animate([
                { transform: `translateY(${fromY})`, opacity: 0 },
                { transform: 'translateY(0%)', opacity: 1 }
            ], {
                duration,
                easing,
                delay: i * lineStagger,
                fill: 'both'
            });
        });
    }
});