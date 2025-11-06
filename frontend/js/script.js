// script.js
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

