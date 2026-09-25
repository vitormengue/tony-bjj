(() => {
  const AUDIO_SRC = 'assets/musica-tony.mp3.mpeg';
  const DEFAULT_VOLUME = 0.18;
  let observer;

  function setupReveal() {
    if (observer) observer.disconnect();
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  function createPlayer() {
    if (document.getElementById('site-audio')) return;

    const audio = document.createElement('audio');
    audio.id = 'site-audio';
    audio.src = AUDIO_SRC;
    audio.loop = true;
    audio.preload = 'auto';

    const savedVolume = Number(localStorage.getItem('tonyMusicVolume'));
    audio.volume = Number.isFinite(savedVolume) && savedVolume >= 0 && savedVolume <= 1
      ? savedVolume
      : DEFAULT_VOLUME;

    const player = document.createElement('div');
    player.className = 'music-player';
    player.innerHTML = `
      <button class="music-toggle" type="button" aria-label="Ativar música" title="Ativar música">▶</button>
      <button class="music-mute" type="button" aria-label="Mutar música" title="Mutar música">🔊</button>
      <input class="music-volume" type="range" min="0" max="1" step="0.01" value="${audio.volume}" aria-label="Volume da música">
    `;

    document.body.append(audio, player);

    const toggle = player.querySelector('.music-toggle');
    const mute = player.querySelector('.music-mute');
    const slider = player.querySelector('.music-volume');

    const savedMuted = localStorage.getItem('tonyMusicMuted') === 'true';
    audio.muted = savedMuted;
    mute.textContent = audio.muted ? '🔇' : '🔊';

    const updateToggle = () => {
      toggle.textContent = audio.paused ? '▶' : '❚❚';
      toggle.setAttribute('aria-label', audio.paused ? 'Tocar música' : 'Pausar música');
      toggle.title = audio.paused ? 'Tocar música' : 'Pausar música';
    };

    toggle.addEventListener('click', async () => {
      try {
        if (audio.paused) {
          await audio.play();
          localStorage.setItem('tonyMusicEnabled', 'true');
        } else {
          audio.pause();
          localStorage.setItem('tonyMusicEnabled', 'false');
        }
      } catch (e) {}
      updateToggle();
    });

    mute.addEventListener('click', () => {
      audio.muted = !audio.muted;
      localStorage.setItem('tonyMusicMuted', String(audio.muted));
      mute.textContent = audio.muted ? '🔇' : '🔊';
      mute.setAttribute('aria-label', audio.muted ? 'Ativar som' : 'Mutar música');
      mute.title = audio.muted ? 'Ativar som' : 'Mutar música';
    });

    slider.addEventListener('input', () => {
      audio.volume = Number(slider.value);
      localStorage.setItem('tonyMusicVolume', String(audio.volume));
      if (audio.volume > 0 && audio.muted) {
        audio.muted = false;
        localStorage.setItem('tonyMusicMuted', 'false');
        mute.textContent = '🔊';
      }
    });

    audio.addEventListener('play', updateToggle);
    audio.addEventListener('pause', updateToggle);
    updateToggle();

    // Navegação interna sem recarregar a página: mantém a música tocando sem cortes.
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (!link) return;
      if (link.target === '_blank' || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const currentPath = window.location.pathname.split('/').pop() || 'index.html';
      const targetPath = url.pathname.split('/').pop() || 'index.html';

      // Âncoras dentro da página atual continuam com rolagem normal.
      if (targetPath === currentPath && url.hash) return;

      if (!['index.html','historico.html','sobre.html',''].includes(targetPath)) return;
      event.preventDefault();
      navigate(url.href, true);
    });

    window.addEventListener('popstate', () => navigate(window.location.href, false));

    // Após uma interação prévia, alguns navegadores permitem retomar automaticamente.
    if (localStorage.getItem('tonyMusicEnabled') === 'true') {
      audio.play().catch(() => {});
    }
  }

  async function navigate(href, pushState) {
    try {
      const response = await fetch(href, { cache: 'no-cache' });
      if (!response.ok) throw new Error('Falha ao carregar página');
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const newHeader = doc.querySelector('header');
      const newMain = doc.querySelector('main');
      const newFooter = doc.querySelector('footer');
      if (!newHeader || !newMain || !newFooter) {
        window.location.href = href;
        return;
      }

      document.querySelector('header')?.replaceWith(newHeader);
      document.querySelector('main')?.replaceWith(newMain);
      document.querySelector('footer')?.replaceWith(newFooter);
      document.title = doc.title;

      if (pushState) history.pushState({}, '', href);
      window.scrollTo({ top: 0, behavior: 'instant' });
      setupReveal();
    } catch (e) {
      window.location.href = href;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupReveal();
    createPlayer();
  });
})();