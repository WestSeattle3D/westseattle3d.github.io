class MeshAnimation {
    constructor() {
        this.canvas = document.getElementById('mesh-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scrollY = 0;
        this.targetRotationY = 0.0;
        this.targetRotationZ = 0.0;
        this.currentRotationY = 0.0;
        this.currentRotationZ = 0.0;
        this.rotation = { x: 0.0, y: 0.0, z: 0 };
        this.easingFactor = 0.08;

        this.vertices = [
            [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
        ];

        this.edges = [
            [0, 1], [1, 2], [2, 3], [3, 0],
            [4, 5], [5, 6], [6, 7], [7, 4],
            [0, 4], [1, 5], [2, 6], [3, 7]
        ];

        this.init();
        this.bindEvents();
        this.animate();
    }

    init() {
        this.resizeCanvas();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });

        window.addEventListener('scroll', () => {
            this.scrollY = window.scrollY;
            this.targetRotationY = this.scrollY * 0.002;
            this.targetRotationZ = this.scrollY * 0.001;
        });
    }

    rotateX(point, angle) {
        const [x, y, z] = point;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [x, y * cos - z * sin, y * sin + z * cos];
    }

    rotateY(point, angle) {
        const [x, y, z] = point;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [x * cos + z * sin, y, -x * sin + z * cos];
    }

    rotateZ(point, angle) {
        const [x, y, z] = point;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [x * cos - y * sin, x * sin + y * cos, z];
    }

    project(point) {
        const scale = 140;
        const distance = 5;
        const [x, y, z] = point;
        const factor = distance / (distance + z);
        return [
            x * factor * scale + this.canvas.width / 2,
            y * factor * scale + this.canvas.height * 0.45
        ];
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Smooth easing interpolation
        this.currentRotationY += (this.targetRotationY - this.currentRotationY) * this.easingFactor;
        this.currentRotationZ += (this.targetRotationZ - this.currentRotationZ) * this.easingFactor;
        this.rotation.y = this.currentRotationY;
        this.rotation.z = this.currentRotationZ;

        const rotatedVertices = this.vertices.map(vertex => {
            let point = this.rotateX(vertex, this.rotation.x);
            point = this.rotateY(point, this.rotation.y);
            point = this.rotateZ(point, this.rotation.z);
            return point;
        });

        const projectedVertices = rotatedVertices.map(vertex => this.project(vertex));

        this.ctx.strokeStyle = '#f5cc20';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.5;

        this.edges.forEach(([start, end]) => {
            const [x1, y1] = projectedVertices[start];
            const [x2, y2] = projectedVertices[end];

            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        });

        this.ctx.fillStyle = '#ffef7f';
        projectedVertices.forEach(([x, y]) => {
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.globalAlpha = 1;

        requestAnimationFrame(() => this.animate());
    }
}

class SmoothScroll {
    constructor() {
        this.bindEvents();
    }

    bindEvents() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}

class Gallery {
    constructor() {
        this.lightbox = document.getElementById('lightbox');
        this.lightboxImg = document.getElementById('lightbox-img');
        this.lightboxTitle = document.getElementById('lightbox-title');
        this.closeBtn = document.querySelector('.lightbox-close');
        this.images = [];
        this.currentIndex = 0;
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.bindEvents();
    }

    bindEvents() {
        const galleryImages = document.querySelectorAll('.gallery-img');

        // Build images array
        galleryImages.forEach((img, index) => {
            this.images.push({ src: img.src, alt: img.alt });
            img.addEventListener('click', () => {
                this.currentIndex = index;
                this.openLightbox();
            });
        });

        this.closeBtn.addEventListener('click', () => {
            this.closeLightbox();
        });

        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) {
                this.closeLightbox();
            }
        });

        // Click navigation on image
        this.lightboxImg.addEventListener('click', (e) => {
            const rect = this.lightboxImg.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const imageWidth = rect.width;

            if (clickX < imageWidth / 2) {
                // Clicked on left side - go to previous image
                this.previousImage();
            } else {
                // Clicked on right side - go to next image
                this.nextImage();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.lightbox.style.display === 'block') {
                if (e.key === 'Escape') {
                    this.closeLightbox();
                } else if (e.key === 'ArrowLeft') {
                    this.previousImage();
                } else if (e.key === 'ArrowRight') {
                    this.nextImage();
                }
            }
        });

        // Touch events for swipe
        this.lightbox.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        this.lightbox.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });

        // Reposition title on window resize
        window.addEventListener('resize', () => {
            if (this.lightbox.style.display === 'block') {
                this.positionTitle();
            }
        });
    }

    handleSwipe() {
        const swipeThreshold = 50;
        const diff = this.touchStartX - this.touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swiped left - show next image
                this.nextImage();
            } else {
                // Swiped right - show previous image
                this.previousImage();
            }
        }
    }

    openLightbox() {
        const image = this.images[this.currentIndex];
        this.lightbox.style.display = 'block';
        this.lightboxImg.src = image.src;
        this.lightboxImg.alt = image.alt;
        this.lightboxTitle.textContent = image.alt;
        document.body.style.overflow = 'hidden';

        // Position on image load
        this.lightboxImg.onload = () => {
            this.positionTitle();
        };
    }

    closeLightbox() {
        this.lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    nextImage() {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.updateImage();
    }

    previousImage() {
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.updateImage();
    }

    updateImage() {
        const image = this.images[this.currentIndex];
        this.lightboxImg.src = image.src;
        this.lightboxImg.alt = image.alt;
        this.lightboxTitle.textContent = image.alt;

        // Position title at bottom of image after it loads
        this.lightboxImg.onload = () => {
            this.positionTitle();
        };
    }

    positionTitle() {
        const imgRect = this.lightboxImg.getBoundingClientRect();
        const imgBottom = imgRect.bottom;
        const titleHeight = this.lightboxTitle.offsetHeight;

        // Position title at the bottom of the image
        this.lightboxTitle.style.top = `${imgBottom - titleHeight}px`;
        this.lightboxTitle.style.bottom = 'auto';
    }
}

// Fix for mobile viewport height (prevents hero section from jumping when toolbar shows/hides)
function setViewportHeight() {
    const vh = window.innerHeight;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Set on load
setViewportHeight();

// Update on resize (but this won't fire on scroll when toolbar appears/disappears, which is what we want)
window.addEventListener('resize', setViewportHeight);

document.addEventListener('DOMContentLoaded', () => {
    new MeshAnimation();
    new SmoothScroll();
    new Gallery();

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'all 0.6s ease';
        observer.observe(section);
    });
});