(() => {
  const gallery = document.querySelector('.gallery');
  if (gallery) {
    const stage = gallery.querySelector('.gallery-stage');
    const open = gallery.querySelector('.photo-open');
    const image = open.querySelector('img');
    const thumbs = [...gallery.querySelectorAll('.thumb')];
    const lightbox = gallery.querySelector('.lightbox');
    const zoomImage = lightbox.querySelector('img');
    let video;
    for (const thumb of thumbs) {
      thumb.addEventListener('click', () => {
        thumbs.forEach(choice => choice.setAttribute('aria-pressed', String(choice === thumb)));
        if (video) {
          video.pause();
          video.remove();
          video = undefined;
        }
        const url = thumb.dataset.video;
        open.hidden = Boolean(url);
        if (url) {
          video = document.createElement('video');
          video.controls = true;
          video.playsInline = true;
          video.preload = 'none';
          video.poster = image.src;
          video.src = url;
          video.setAttribute('aria-label', 'Видео работы мини-погрузчика');
          stage.append(video);
        } else {
          image.src = thumb.dataset.src;
          image.alt = thumb.dataset.alt;
          image.title = thumb.dataset.alt;
        }
      });
    }
    open.addEventListener('click', () => {
      zoomImage.src = image.src;
      zoomImage.alt = image.alt;
      lightbox.showModal();
    });
    lightbox.querySelector('button').addEventListener('click', () => lightbox.close());
    lightbox.addEventListener('click', event => {
      if (event.target === lightbox) lightbox.close();
    });
  }

  const form = document.querySelector('[data-preview-form]');
  form?.addEventListener('submit', event => {
    event.preventDefault();
    const status = form.querySelector('[role="status"]');
    status.textContent = 'Спасибо! Вы проверили форму в режиме макета.';
    status.hidden = false;
  });
  const request = document.querySelector('#application');
  const mobileBar = document.querySelector('.mobile-cta');
  if (request && mobileBar && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      mobileBar.hidden = entry.isIntersecting;
    }, { threshold: 0 });
    observer.observe(request);
  }
})();
