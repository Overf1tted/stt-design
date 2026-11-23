for (const gallery of document.querySelectorAll('.gallery')) {
  const frame = gallery.querySelector('.gallery-frame');
  const expand = gallery.querySelector('.expand');
  const image = expand.querySelector('img');
  const dialog = gallery.querySelector('dialog');
  const choices = [...gallery.querySelectorAll('.thumb')];
  const mediaNote = gallery.querySelector('.media-note');
  let video;
  for (const choice of choices) {
    choice.addEventListener('click', () => {
      for (const other of choices) other.setAttribute('aria-pressed', String(other === choice));
      if (video) {
        video.pause();
        video.remove();
        video = undefined;
      }
      expand.hidden = Boolean(choice.dataset.video);
      mediaNote.hidden = !expand.hidden;
      if (expand.hidden) {
        video = document.createElement('video');
        video.controls = true;
        video.playsInline = true;
        video.preload = 'none';
        video.src = choice.dataset.video;
        mediaNote.textContent = 'Пример видео СТТ-Сервис. Монтаж свай мини-экскаватором.';
        video.setAttribute('aria-label', mediaNote.textContent);
        video.addEventListener('error', () => {
          mediaNote.textContent = 'Видео недоступно. Выберите фотографию, чтобы вернуться к галерее.';
        });
        frame.append(video);
      } else {
        image.src = choice.querySelector('img').src;
        image.alt = choice.dataset.caption;
        image.title = choice.dataset.caption;
      }
    });
  }
  expand.addEventListener('click', () => {
    const enlarged = dialog.querySelector('img');
    enlarged.src = image.src;
    enlarged.alt = image.alt;
    dialog.showModal();
  });
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
}
const request = document.querySelector('[data-card-request]');
if (request) {
  const cases = {
    panorama: ['Аренда гусеничного мини-погрузчика', 'rent'],
    shift: ['Аренда гусеничного мини-погрузчика', 'rent'],
    detail: ['Гидравлический фильтр V0511-65150', 'parts'],
    drawing: ['Гидравлический фильтр V0511-65150', 'parts'],
  };
  const card = new URLSearchParams(location.search).get('card');
  if (Object.hasOwn(cases, card)) {
    const [subject, type] = cases[card];
    request.querySelector('[data-subject]').textContent = subject;
    const back = request.querySelector('.back-link');
    back.href = card + '.html#request';
    back.textContent = 'К карточке';
    for (const form of request.querySelectorAll('[data-request-form]')) {
      form.hidden = form.dataset.requestForm !== type;
    }
  }
}

for (const form of document.querySelectorAll('form')) form.addEventListener('submit', event => {
  event.preventDefault();
  form.querySelector('output').textContent = 'Форма проверена. Это демонстрационный макет.';
});
