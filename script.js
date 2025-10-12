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

document.addEventListener('DOMContentLoaded', () => {
    new MeshAnimation();
    new ContactForm();
    new SmoothScroll();

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