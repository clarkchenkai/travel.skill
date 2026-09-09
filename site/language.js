(() => {
  const key = 'travel.skill:gallery-language';
  const content = [...document.querySelectorAll('[data-cn]')].map(node => ({node, en: node.innerHTML, cn: node.dataset.cn}));
  const text = [...document.querySelectorAll('[data-cn-text]')].map(node => ({node, en: node.textContent, cn: node.getAttribute('data-cn-text')}));
  const attributes = ['aria-label', 'alt', 'content'].flatMap(attribute =>
    [...document.querySelectorAll(`[data-cn-${attribute}]`)].map(node => ({node, attribute, en: node.getAttribute(attribute), cn: node.getAttribute(`data-cn-${attribute}`)})));
  const buttons = [...document.querySelectorAll('[data-language]')];
  function apply(language) {
    const selected = language === 'cn' ? 'cn' : 'en';
    document.documentElement.lang = selected === 'cn' ? 'zh-CN' : 'en';
    content.forEach(item => { item.node.innerHTML = item[selected]; });
    text.forEach(item => { item.node.textContent = item[selected]; });
    attributes.forEach(item => item.node.setAttribute(item.attribute, item[selected]));
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === selected)));
  }
  let saved;
  try { saved = localStorage.getItem(key); } catch { /* English remains available without storage. */ }
  apply(saved);
  buttons.forEach(button => button.addEventListener('click', () => {
    const language = button.dataset.language;
    apply(language);
    try { localStorage.setItem(key, language); } catch { /* Switching still works for this visit. */ }
  }));
})();
