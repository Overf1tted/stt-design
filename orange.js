for (const gallery of document.querySelectorAll('.gallery')) {
  const frame = gallery.querySelector('.gallery-frame');
  const expand = gallery.querySelector('.expand');
  const image = expand.querySelector('img');
  const dialog = gallery.querySelector('dialog');
  const choices = [...gallery.querySelectorAll('.thumb')];
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
      if (expand.hidden) {
        video = document.createElement('video');
        video.controls = true;
        video.playsInline = true;
        video.preload = 'none';
        video.poster = image.src;
        video.src = choice.dataset.video;
        video.setAttribute('aria-label','Работа мини-погрузчика');
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
for (const tariff of document.querySelectorAll('[data-tariff]')) {
  const choices = tariff.querySelectorAll('button');
  for (const choice of choices) choice.addEventListener('click', () => {
    for (const other of choices) other.setAttribute('aria-pressed',String(other===choice));
    tariff.querySelector('.amount').textContent = choice.dataset.price;
    tariff.querySelector('small').textContent = choice.dataset.unit;
  });
}
for (const form of document.querySelectorAll('form')) form.addEventListener('submit', event => {
  event.preventDefault();
  form.querySelector('output').textContent = 'Форма проверена. Это демонстрационный макет.';
});
