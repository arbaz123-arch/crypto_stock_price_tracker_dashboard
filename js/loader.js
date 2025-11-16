// loader.js — loads header and footer HTML into placeholders
(async function(){
  async function loadFragment(path, selectorId){
    try{
      const res = await fetch(path);
      if(!res.ok) throw new Error('Failed to load ' + path);
      const html = await res.text();
      document.querySelector(selectorId).innerHTML = html;
      // small post-load tweaks
      if(selectorId === '#footer-placeholder'){
        const y = new Date().getFullYear();
        const el = document.getElementById('year');
        if(el) el.textContent = y;
      }
    }catch(e){
      console.warn(e);
    }
  }
  // relative paths
  await loadFragment('/components/header.html', '#header-placeholder');
  await loadFragment('/components/footer.html', '#footer-placeholder');

  // connect header search to main search (if present)
  const headerForm = document.getElementById('header-search');
  if(headerForm){
    headerForm.addEventListener('submit', (ev)=>{
      ev.preventDefault();
      const q = document.getElementById('header-search-input').value.trim();
      if(!q) return;
      // forward query to main page search input if exists
      const mainInput = document.getElementById('search-input');
      if(mainInput){
        mainInput.value = q;
        const form = document.getElementById('search-form');
        form && form.dispatchEvent(new Event('submit', {bubbles:true, cancelable:true}));
      } else {
        // if on other page, redirect to index with query param
        window.location.href = `/pages/index.html?q=${encodeURIComponent(q)}`;
      }
    });
  }

  // theme toggle wiring
  const themeBtn = document.getElementById('theme-toggle');
  const root = document.documentElement;
  const saved = localStorage.getItem('cdr-theme');
  if(saved) root.setAttribute('data-theme', saved);
  if(themeBtn){
    themeBtn.addEventListener('click', ()=>{
      const cur = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', cur === 'dark' ? 'dark' : '');
      localStorage.setItem('cdr-theme', cur === 'dark' ? 'dark' : '');
      themeBtn.setAttribute('aria-pressed', cur === 'dark');
    });
  }
})();
