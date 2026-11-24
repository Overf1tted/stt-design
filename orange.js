function bindSwipe(target, change, isActive = () => true) {
  let origin;
  let blockClickUntil = 0;
  target.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || !isActive()) return;
    blockClickUntil = 0;
    origin = {id:event.pointerId, x:event.clientX, y:event.clientY};
  });
  target.addEventListener('pointercancel', () => { origin = undefined; });
  target.addEventListener('pointerup', event => {
    if (origin?.id !== event.pointerId) return;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    origin = undefined;
    if (Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    blockClickUntil = performance.now() + 400;
    change(dx < 0 ? 1 : -1);
  });
  target.addEventListener('click', event => {
    if (event.detail && performance.now() < blockClickUntil) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
}
const annotation = image => image.title || image.alt;
function setupGallery(gallery) {
  const frame = gallery.querySelector('.gallery-frame');
  const expand = frame.querySelector('.expand');
  const mainImage = expand.querySelector('img');
  const caption = gallery.querySelector('.media-note');
  const choices = [...gallery.querySelectorAll('.thumb')];
  const photoChoices = choices.filter(choice => !choice.dataset.video);
  let active = 0;
  function select(index) {
    active = (index + choices.length) % choices.length;
    const choice = choices[active];
    choices.forEach((item,i)=>item.setAttribute('aria-pressed',String(i===active)));
    const old = frame.querySelector('video');
    if (old) { old.pause(); old.remove(); }
    const preview = choice.querySelector('img');
    expand.hidden = Boolean(choice.dataset.video);
    caption.textContent = choice.dataset.caption || annotation(preview);
    if (choice.dataset.video) {
      const video = document.createElement('video');
      video.poster = preview.src;
      video.controls = true;
      video.playsInline = true;
      video.preload = 'none';
      video.src = choice.dataset.video;
      video.setAttribute('aria-label',caption.textContent);
      video.addEventListener('error',()=>{caption.textContent='Видео недоступно. Выберите соседний кадр.';});
      frame.prepend(video);
    } else {
      mainImage.src = preview.src;
      mainImage.alt = preview.alt;
      mainImage.title = annotation(preview);
    }
  }
  const step = amount => select(active + amount);
  choices.forEach((button, index)=>button.addEventListener('click',()=>select(index)));
  frame.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>step(Number(button.dataset.step))));
  expand.addEventListener('keydown',event=>{
    if (!['ArrowRight','ArrowLeft'].includes(event.key)) return;
    event.preventDefault();
    step(event.key==='ArrowRight'?1:-1);
  });
  bindSwipe(expand,step);
  const storyPhotos = [...document.querySelectorAll('.story-open')];
  const dialog = document.querySelector('.viewer');
  const screen = dialog.querySelector('figure img');
  const label = dialog.querySelector('figcaption');
  let collection = [];
  let current = 0;
  function show(offset) {
    current = (current + offset + collection.length) % collection.length;
    const image = collection[current].querySelector('img');
    screen.src=image.src;
    screen.alt=image.alt;
    screen.title=annotation(image);
    label.textContent=annotation(image);
    if (collection===photoChoices) select(choices.indexOf(collection[current]));
  }
  function open(items,index) {
    collection=items;
    current=index;
    show(0);
    dialog.showModal();
  }
  expand.addEventListener('click',()=>open(photoChoices,photoChoices.indexOf(choices[active])));
  storyPhotos.forEach((button,index)=>button.addEventListener('click',()=>open(storyPhotos,index)));
  dialog.querySelector('.dismiss').addEventListener('click',()=>dialog.close());
  dialog.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>show(Number(button.dataset.step))));
  dialog.addEventListener('keydown',event=>{
    if (['ArrowRight','ArrowLeft'].includes(event.key)) {
      event.preventDefault();
      show(event.key==='ArrowRight'?1:-1);
    }
  });
  bindSwipe(dialog.querySelector('figure'),show);
}
const gallery = document.querySelector('.gallery');
if (gallery) setupGallery(gallery);

function setupTabs(nav) {
  const tabs = [...nav.querySelectorAll('a')];
  nav.setAttribute('role','tablist');
  for (const tab of tabs) {
    const panel = document.querySelector(tab.hash);
    tab.setAttribute('role','tab');
    tab.id = 'tab-' + panel.id;
    tab.setAttribute('aria-controls',panel.id);
    panel.setAttribute('aria-labelledby',tab.id);
    panel.setAttribute('role','tabpanel');
    panel.tabIndex=0;
  }
  function activate(hash) {
    const selected=tabs.find(tab=>tab.hash===hash) || tabs[0];
    for (const tab of tabs) {
      const on=tab===selected;
      tab.setAttribute('aria-selected',String(on));
      tab.tabIndex=on?0:-1;
      document.querySelector(tab.hash).hidden=!on;
    }
  }
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href^="#"]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const tab = tabs.find(tab => tab.hash === link.hash);
    if (!tab) return;
    event.preventDefault();
    if (location.hash!==link.hash) history.pushState(null,'',link.hash);
    activate(link.hash);
    if (nav.contains(link)) {
      tab.focus({preventScroll:true});
    } else {
      const panel = document.querySelector(link.hash);
      panel.focus({preventScroll:true});
      panel.scrollIntoView({block:'start'});
    }
  });
  nav.addEventListener('keydown',event=>{
    const index=tabs.indexOf(event.target);
    if (index<0) return;
    const targets={ArrowRight:index+1,ArrowLeft:index-1,Home:0,End:tabs.length-1};
    if (!(event.key in targets)) return;
    event.preventDefault();
    const tab=tabs[(targets[event.key]+tabs.length)%tabs.length];
    tab.click();
  });
  window.addEventListener('hashchange',()=>activate(location.hash));
  activate(location.hash);
  const initialTab = tabs.find(tab => tab.hash === location.hash);
  if (initialTab) document.querySelector(initialTab.hash).scrollIntoView({block:'start'});
}
const tabs = document.querySelector('.section-nav nav');
if (tabs) setupTabs(tabs);
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
    const shifts=Number(new URLSearchParams(location.search).get('shifts'));
    if (type==='rent' && Number.isSafeInteger(shifts) && shifts>0) request.querySelector('[data-request-form="rent"] input[type=number]').value=shifts;
    request.querySelector('[data-subject]').textContent = subject;
    const back = request.querySelector('.back-link');
    back.href = card + '.html#request';
    back.textContent = 'К карточке';
    for (const form of request.querySelectorAll('[data-request-form]')) {
      form.hidden = form.dataset.requestForm !== type;
    }
  }
}

function phoneDigits(text) {
  const digits = text.replace(/\D/g, '');
  if (text.trimStart().startsWith('+7') || (digits.length === 11 && /^[78]/.test(digits))) {
    return digits.slice(1);
  }
  return digits;
}

function maskPhone(field) {
  const prefix = '+7 ';
  function render(digits, cursor = digits.length) {
    const local = digits.slice(0, 10);
    const match = local.match(/^(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);
    const [, area, first, second, last] = match;
    field.value = prefix + (area ? '(' + area : '') + (first ? ') ' + first : '')
      + (second ? '-' + second : '') + (last ? '-' + last : '');
    if (cursor >= local.length) return;
    let index = prefix.length;
    for (let seen = 0; seen < cursor; index++) {
      if (/\d/.test(field.value[index])) seen++;
    }
    field.setSelectionRange(index, index);
  }
  field.addEventListener('focus', () => { if (!field.value) render(''); });
  field.addEventListener('blur', () => { if (field.value === prefix) field.value = ''; });
  field.addEventListener('input', () => {
    const cursor = phoneDigits(field.value.slice(0, field.selectionStart)).length;
    render(phoneDigits(field.value), cursor);
  });
  field.addEventListener('paste', event => {
    const pasted = phoneDigits(event.clipboardData.getData('text'));
    if (!pasted) return;
    event.preventDefault();
    if (pasted.length >= 10) {
      render(pasted);
      return;
    }
    const start = phoneDigits(field.value.slice(0, field.selectionStart)).length;
    const end = phoneDigits(field.value.slice(0, field.selectionEnd)).length;
    const current = phoneDigits(field.value);
    render(current.slice(0, start) + pasted + current.slice(end), start + pasted.length);
  });
}

for (const form of document.querySelectorAll('.request-form')) {
  const phone = form.querySelector('[data-phone-mask]');
  if (phone) maskPhone(phone);
  for (const button of form.querySelectorAll('[data-step-shift]')) {
    button.addEventListener('click', () => {
      const input = form.querySelector('#shift-count');
      const baseline = Number.isSafeInteger(input.valueAsNumber) ? input.valueAsNumber : 1;
      input.value = Math.max(1, baseline + Number(button.dataset.stepShift));
    });
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    form.querySelector('output').textContent = 'Форма проверена. Это демонстрационный макет.';
  });
}

function stored(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}

const specsPhotoKey = variant => 'stt-review-specs-photo-' + variant;
const specsPhoto = document.querySelector('[data-specs-photo]');
if (specsPhoto) {
  const photo = stored(specsPhotoKey(document.body.className), null);
  if (photo && /^data:image\/(webp|png);base64,/.test(photo.src)) {
    specsPhoto.src = photo.src;
    if (photo.alt) specsPhoto.alt = photo.alt;
  }
}

async function preparePhoto(file) {
  const src = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = src;
    await image.decode();
    const scale = Math.min(1, 1100 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/webp', .84);
  } finally {
    URL.revokeObjectURL(src);
  }
}

const photoForm = document.querySelector('#photo-form');
if (photoForm) {
  const card = document.querySelector('#edit-card');
  const file = photoForm.elements.namedItem('photo');
  const caption = photoForm.elements.namedItem('caption');
  const status = photoForm.querySelector('output');
  const preview = photoForm.querySelector('img');
  const reset = photoForm.querySelector('[data-reset-photo]');
  const submit = photoForm.querySelector('[type=submit]');

  function populatePhoto() {
    const photo = stored(specsPhotoKey(card.value), null);
    file.value = '';
    caption.value = photo?.alt || '';
    if (photo) preview.src = photo.src;
    else preview.removeAttribute('src');
    preview.hidden = reset.hidden = !photo;
    photoForm.querySelector('.photo-preview-link').href = card.value + '.html#specifications';
    status.textContent = '';
  }

  card.addEventListener('change', populatePhoto);
  photoForm.addEventListener('submit', async event => {
    event.preventDefault();
    const key = specsPhotoKey(card.value);
    const selected = file.files[0];
    const existing = stored(key, null);
    if (!selected && !existing) {
      status.textContent = 'Выберите файл изображения.';
      return;
    }
    if (selected && (!/^(image\/(jpeg|png|webp|avif))$/.test(selected.type) || selected.size > 15 * 1024 * 1024)) {
      status.textContent = 'Выберите JPG, PNG, WebP или AVIF до 15 МБ.';
      return;
    }
    const alt = caption.value.trim();
    submit.disabled = card.disabled = reset.disabled = true;
    try {
      const src = selected ? await preparePhoto(selected) : existing.src;
      if (!save(key, {src, alt})) {
        status.textContent = 'Не удалось сохранить фото в браузере.';
        return;
      }
      populatePhoto();
      status.textContent = 'Фото сохранено. Его можно проверить в карточке.';
    } catch {
      status.textContent = 'Файл не удалось открыть. Попробуйте другое изображение.';
    } finally {
      submit.disabled = card.disabled = reset.disabled = false;
    }
  });

  reset.addEventListener('click', () => {
    try {
      localStorage.removeItem(specsPhotoKey(card.value));
      populatePhoto();
      status.textContent = 'Восстановлено исходное фото.';
    } catch {
      status.textContent = 'Не удалось убрать фото из браузера.';
    }
  });
  populatePhoto();
}
const buy = document.querySelector('[data-buy]');
if (buy) {
  const basket = document.querySelector('.basket');
  const key='stt-review-basket-v1-'+basket.dataset.item;
  const link=basket.querySelector('[data-checkout]');
  const destination=link.getAttribute('href');
  const saved = stored(key,0);
  let count = Number.isSafeInteger(saved) && saved>0 ? saved : 0;
  const total=basket.querySelector('[data-total]');
  function render() {
    basket.hidden = !count;
    const quantity=basket.querySelector('[data-count]');
    quantity.textContent=quantity.dataset.unit==='смен' ? 'Смены: '+count : count+' шт.';
    if (basket.dataset.item==='rent') link.href=destination+'&shifts='+count;
    total.textContent=(Number(total.dataset.price)*count).toLocaleString('ru-RU')+' ₽';
  }
  function change(delta) {
    count=Math.max(0,count+delta);
    save(key,count);
    render();
    if (!count) buy.focus();
  }
  buy.addEventListener('click',()=>change(1));
  basket.querySelectorAll('[data-qty]').forEach(button=>button.addEventListener('click',()=>change(Number(button.dataset.qty))));
  render();
}
const fieldNames=['heading','copy','cta'];
const storyKey=slug=>'stt-review-stories-'+slug;
const editor=document.querySelector('#edit-form');
if (editor) {
  const menus=document.querySelector('#edit-card');
  const defaults=JSON.parse(document.querySelector('#edit-defaults').textContent);
  const blocks=[...editor.querySelectorAll('fieldset')];
  function populate() {
    const data=stored(storyKey(menus.value),[]);
    blocks.forEach((block,i)=>fieldNames.forEach((field,j)=>{
      block.querySelector('[data-'+field+']').value = data[i]?.[field] || defaults[menus.value][i][2+j];
    }));
    document.querySelector('#open-card').href=menus.value+'.html#description';
    editor.querySelector('output').textContent='';
  }
  menus.addEventListener('change',populate);
  editor.addEventListener('submit',event=>{
    event.preventDefault();
    const data=blocks.map(block=>Object.fromEntries(fieldNames.map(field=>[field,block.querySelector('[data-'+field+']').value.trim()])));
    const ok=save(storyKey(menus.value),data);
    editor.querySelector('output').textContent=ok?'Сохранено. Откройте карточку для проверки.':'Браузер не разрешил сохранить изменения.';
  });
  populate();
}
const chapters=document.querySelectorAll('.story-copy');
if (chapters.length) {
  const data=stored(storyKey(document.body.className),[]);
  chapters.forEach((chapter,i)=>{
    const fields=data[i] || {};
    for (const [name,selector] of Object.entries({heading:'h3',copy:'p',cta:'a span'})) {
      if (typeof fields[name]==='string' && fields[name].trim()) chapter.querySelector(selector).textContent=fields[name];
    }
  });
}
