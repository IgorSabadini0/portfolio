(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const header = document.getElementById('site-header');
    const progressBar = document.getElementById('scroll-progress-bar');
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('main section[id]');

    const updateScrollUI = () => {
        const top = window.scrollY;
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollable > 0 ? top / scrollable : 0;
        progressBar.style.transform = `scaleX(${progress})`;
        header.classList.toggle('scrolled', top > 24);

        let current = 'home';
        sections.forEach((section) => {
            if (top >= section.offsetTop - 180) current = section.id;
        });
        navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
        });
    };

    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            window.requestAnimationFrame(() => {
                updateScrollUI();
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }, { passive: true });
    updateScrollUI();

    const setMenu = (open) => {
        menuToggle.classList.toggle('active', open);
        mobileMenu.classList.toggle('open', open);
        document.body.classList.toggle('menu-open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        mobileMenu.setAttribute('aria-hidden', String(!open));
        mobileMenu.inert = !open;
    };

    menuToggle?.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
    mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && mobileMenu?.classList.contains('open')) setMenu(false);
    });

    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -50px' });
        document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
    } else {
        document.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'));
    }

    const copyButton = document.querySelector('.copy-email');
    const toast = document.getElementById('toast');
    let toastTimer;
    copyButton?.addEventListener('click', async () => {
        const email = copyButton.dataset.email;
        try {
            await navigator.clipboard.writeText(email);
        } catch {
            const input = document.createElement('textarea');
            input.value = email;
            input.style.position = 'fixed';
            input.style.opacity = '0';
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            input.remove();
        }
        copyButton.querySelector('span').textContent = 'E-mail copiado';
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
            copyButton.querySelector('span').textContent = 'Copiar e-mail';
        }, 2200);
    });

    document.getElementById('current-year').textContent = new Date().getFullYear();

    if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
        document.addEventListener('pointermove', (event) => {
            document.documentElement.style.setProperty('--pointer-x', `${event.clientX}px`);
            document.documentElement.style.setProperty('--pointer-y', `${event.clientY}px`);
        }, { passive: true });

        document.querySelectorAll('[data-tilt]').forEach((card) => {
            card.addEventListener('pointermove', (event) => {
                const rect = card.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width - 0.5;
                const y = (event.clientY - rect.top) / rect.height - 0.5;
                card.style.transform = `rotateY(${x * 8 - 4}deg) rotateX(${y * -7 + 2}deg) translateY(-3px)`;
            });
            card.addEventListener('pointerleave', () => {
                card.style.transform = 'rotateY(-7deg) rotateX(3deg)';
            });
        });

        document.querySelectorAll('.magnetic').forEach((button) => {
            button.addEventListener('pointermove', (event) => {
                const rect = button.getBoundingClientRect();
                const x = event.clientX - rect.left - rect.width / 2;
                const y = event.clientY - rect.top - rect.height / 2;
                button.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
            });
            button.addEventListener('pointerleave', () => { button.style.transform = ''; });
        });
    }

    const canvas = document.getElementById('ambient-canvas');
    const allowAmbientMotion = !reducedMotion && window.matchMedia('(pointer: fine) and (min-width: 900px)').matches;
    if (allowAmbientMotion && canvas) {
        const context = canvas.getContext('2d');
        let particles = [];
        let animationFrame;
        let width = 0;
        let height = 0;

        const resizeCanvas = () => {
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * ratio;
            canvas.height = height * ratio;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
            const amount = Math.min(52, Math.floor(width / 25));
            particles = Array.from({ length: amount }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 1.25 + 0.25,
                speed: Math.random() * 0.18 + 0.05,
                drift: (Math.random() - 0.5) * 0.08,
                alpha: Math.random() * 0.45 + 0.15
            }));
        };

        const draw = () => {
            context.clearRect(0, 0, width, height);
            particles.forEach((particle) => {
                particle.y -= particle.speed;
                particle.x += particle.drift;
                if (particle.y < -5) { particle.y = height + 5; particle.x = Math.random() * width; }
                if (particle.x < -5) particle.x = width + 5;
                if (particle.x > width + 5) particle.x = -5;
                context.beginPath();
                context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                context.fillStyle = `rgba(200, 255, 53, ${particle.alpha})`;
                context.fill();
            });
            animationFrame = window.requestAnimationFrame(draw);
        };

        resizeCanvas();
        draw();
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resizeCanvas, 150);
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) window.cancelAnimationFrame(animationFrame);
            else draw();
        });
    }
})();
