// utils.js — helper functions and localStorage favorites
const Utils = (function(){

  function formatCurrencyUSD(n){
    if(n === null || n === undefined) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
  }

  function formatNumberCompact(n){
    if(n === null || n === undefined) return '—';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
  }

  function formatFraction(n){
    if(n === null || n === undefined) return '—';
    return Number(n).toFixed(2);
  }

  function showStatus(message, isError = false){
    const el = document.getElementById('status-msg');
    if(!el) return;
    el.textContent = message;
    el.className = isError ? 'status-error' : 'status-ok';
  }

  function showSpinner(show = true){
    const s = document.getElementById('spinner');
    if(!s) return;
    s.classList.toggle('hidden', !show);
    s.setAttribute('aria-hidden', String(!show));
  }

  // favorites stored as array of coin ids
  const FAV_KEY = 'cdr-favs';
  function loadFavorites(){
    try{
      const raw = localStorage.getItem(FAV_KEY);
      if(!raw) return [];
      return JSON.parse(raw);
    }catch(e){
      return [];
    }
  }
  function saveFavorites(arr){
    localStorage.setItem(FAV_KEY, JSON.stringify(arr));
  }
  function addFavorite(id){
    const cur = loadFavorites();
    if(!cur.includes(id)){
      cur.unshift(id);
      saveFavorites(cur);
      return true;
    }
    return false;
  }
  function removeFavorite(id){
    let cur = loadFavorites();
    cur = cur.filter(x => x !== id);
    saveFavorites(cur);
  }

  return {
    formatCurrencyUSD,
    formatNumberCompact,
    formatFraction,
    showStatus,
    showSpinner,
    loadFavorites,
    addFavorite,
    removeFavorite,
    saveFavorites
  };
})();
