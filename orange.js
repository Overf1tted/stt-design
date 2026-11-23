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
  function activate(hash, scroll) {
    const selected=tabs.find(tab=>tab.hash===hash) || tabs[0];
    for (const tab of tabs) {
      const on=tab===selected;
      tab.setAttribute('aria-selected',String(on));
      tab.tabIndex=on?0:-1;
      document.querySelector(tab.hash).hidden=!on;
    }
    if (scroll) nav.scrollIntoView({block:'start'});
  }
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href^="#"]');
    if (!link || !tabs.some(tab=>tab.hash===link.hash) || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    if (location.hash!==link.hash) history.pushState(null,'',link.hash);
    activate(link.hash,true);
    tabs.find(tab=>tab.hash===link.hash).focus({preventScroll:true});
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
  window.addEventListener('hashchange',()=>activate(location.hash,Boolean(location.hash)));
  activate(location.hash,tabs.some(tab=>tab.hash===location.hash));
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

for (const form of document.querySelectorAll('form:not(#edit-form)')) form.addEventListener('submit', event => {
  event.preventDefault();
  form.querySelector('output').textContent = 'Форма проверена. Это демонстрационный макет.';
});

function stored(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
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
