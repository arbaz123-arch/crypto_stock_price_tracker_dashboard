// dashboard.js — main page logic
let chartInstance = null;
let currentCoinId = null;
let usdToInrRate = null;

document.addEventListener('DOMContentLoaded', init);

async function init(){
  wireSearch();
  wireConverter();
  wireFavoritesUI();
  await loadUsdRate();
  renderFavoritesList();
  await loadTopGainersLosers();
  // if query param present, auto-search
  const params = new URLSearchParams(location.search);
  const q = params.get('q');
  if(q) {
    document.getElementById('search-input').value = q;
    document.getElementById('search-form').dispatchEvent(new Event('submit', {bubbles:true, cancelable:true}));
  }
}

function wireSearch(){
  const form = document.getElementById('search-form');
  form.addEventListener('submit', async function(ev){
    ev.preventDefault();
    const q = document.getElementById('search-input').value.trim();
    if(!q) return;
    await performSearch(q);
  });
}

async function performSearch(query){
  try{
    Utils.showSpinner(true);
    Utils.showStatus('Searching...');
    const coin = await API.searchCoin(query);
    if(!coin){
      Utils.showStatus('Not found', true);
      Utils.showSpinner(false);
      return renderNotFound();
    }
    // coin.id is the coingecko id
    currentCoinId = coin.id;
    await updateCoinById(coin.id);
    Utils.showSpinner(false);
    Utils.showStatus('Loaded');
  }catch(err){
    Utils.showSpinner(false);
    Utils.showStatus('Error: ' + err.message, true);
    console.error(err);
  }
}

function renderNotFound(){
  document.getElementById('coin-name').textContent = 'Not found';
  document.getElementById('coin-price').textContent = '—';
  document.getElementById('coin-change').textContent = '';
  document.getElementById('chart-card').querySelector('canvas').getContext('2d').clearRect(0,0,400,200);
  document.getElementById('fav-btn').style.display = 'none';
}

async function updateCoinById(id){
  try{
    Utils.showSpinner(true);
    const data = await API.fetchCoinMarketData(id);
    if(!data) throw new Error('No market data');
    // populate UI
    document.getElementById('coin-image').src = data.image;
    document.getElementById('coin-image').alt = data.name + ' logo';
    document.getElementById('coin-name').textContent = data.name;
    document.getElementById('coin-symbol').textContent = data.symbol.toUpperCase();
    document.getElementById('coin-price').textContent = Utils.formatCurrencyUSD(data.current_price);
    const ch = data.price_change_percentage_24h;
    const chEl = document.getElementById('coin-change');
    chEl.textContent = (ch >= 0 ? '+' : '') + Utils.formatFraction(ch) + '%';
    chEl.className = ch >= 0 ? 'positive' : 'negative';
    document.getElementById('coin-marketcap').textContent = Utils.formatCurrencyUSD(data.market_cap);
    document.getElementById('coin-volume').textContent = Utils.formatCurrencyUSD(data.total_volume);
    document.getElementById('coin-supply').textContent = data.circulating_supply ? Utils.formatNumberCompact(data.circulating_supply) : '—';

    // favorites button
    const favBtn = document.getElementById('fav-btn');
    favBtn.style.display = 'inline-block';
    const favs = Utils.loadFavorites();
    favBtn.classList.toggle('active', favs.includes(id));
    favBtn.textContent = favs.includes(id) ? '★ Favorited' : '☆ Favorite';
    favBtn.onclick = () => {
      toggleFavorite(id);
    };

    // chart
    const chartData = await API.fetchMarketChart(id, 7);
    const prices = (chartData.prices || []).map(p => ({t: new Date(p[0]), y: p[1]}));
    renderChart(prices, data.name);
  }catch(e){
    Utils.showStatus('Error loading coin: ' + e.message, true);
    console.error(e);
  } finally {
    Utils.showSpinner(false);
  }
}

function renderChart(points, label){
  const ctx = document.getElementById('price-chart').getContext('2d');
  const labels = points.map(p => p.t.toLocaleDateString());
  const data = points.map(p => p.y);
  if(chartInstance){
    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = data;
    chartInstance.update();
    return;
  }
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: label || 'Price',
        data,
        fill: true,
        tension: 0.25
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { ticks: { callback: v => Utils.formatCurrencyUSD(v) } }
      }
    }
  });
}

async function toggleFavorite(id){
  const favs = Utils.loadFavorites();
  if(favs.includes(id)){
    Utils.removeFavorite(id);
  } else {
    Utils.addFavorite(id);
  }
  renderFavoritesList();
  // update fav button state
  const favBtn = document.getElementById('fav-btn');
  if(favBtn){
    const cur = Utils.loadFavorites();
    favBtn.classList.toggle('active', cur.includes(id));
    favBtn.textContent = cur.includes(id) ? '★ Favorited' : '☆ Favorite';
  }
}

function renderFavoritesList(){
  const ul = document.getElementById('favorites-list');
  ul.innerHTML = '';
  const favs = Utils.loadFavorites();
  if(!favs || favs.length === 0){
    document.getElementById('no-favs').style.display = 'block';
    return;
  }
  document.getElementById('no-favs').style.display = 'none';

  // for each favorite, fetch a minimal market entry
  favs.slice(0,20).forEach(async (id) => {
    try{
      const data = await API.fetchCoinMarketData(id);
      if(!data) return;
      const li = document.createElement('li');
      const left = document.createElement('div');
      left.style.display = 'flex'; left.style.alignItems = 'center'; left.style.gap = '8px';

      const img = document.createElement('img');
      img.src = data.image; img.alt = data.name; img.className = 'coin-thumb';

      const text = document.createElement('div');
      text.innerHTML = `<div style="font-weight:600">${data.name}</div><div class="muted small">${Utils.formatCurrencyUSD(data.current_price)}</div>`;
      left.appendChild(img); left.appendChild(text);

      const actions = document.createElement('div');
      actions.style.display = 'flex'; actions.style.flexDirection = 'column'; actions.style.gap='6px'; actions.style.alignItems='flex-end';
      const openBtn = document.createElement('button');
      openBtn.className = 'btn';
      openBtn.textContent = 'Open';
      openBtn.onclick = ()=> updateCoinById(id);

      const rm = document.createElement('button');
      rm.className = 'btn';
      rm.style.background='transparent'; rm.style.border='1px solid rgba(0,0,0,0.06)';
      rm.textContent = 'Remove';
      rm.onclick = ()=>{ Utils.removeFavorite(id); renderFavoritesList(); };

      actions.appendChild(openBtn); actions.appendChild(rm);

      li.appendChild(left); li.appendChild(actions);
      ul.appendChild(li);
    }catch(e){
      console.warn('fav render err', e);
    }
  });
}

async function loadTopGainersLosers(){
  try{
    Utils.showSpinner(true);
    const page = await API.fetchTopMarketPage(50);
    // compute gainers and losers by 24h %
    const sorted = page.slice().sort((a,b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
    const top = sorted.slice(0,5);
    const bottom = sorted.slice(-5).reverse();
    const container = document.getElementById('gainers-list');
    container.innerHTML = '';

    const makeRow = (coin) => {
      const el = document.createElement('div');
      el.style.display='flex'; el.style.justifyContent='space-between'; el.style.marginBottom='6px';
      el.innerHTML = `<div style="display:flex;gap:8px;align-items:center"><img src="${coin.image}" width="22" style="border-radius:6px" /> <strong>${coin.symbol.toUpperCase()}</strong></div><div class="muted">${(coin.price_change_percentage_24h||0).toFixed(2)}%</div>`;
      el.onclick = ()=> updateCoinById(coin.id);
      return el;
    };

    const headerTop = document.createElement('div'); headerTop.innerHTML = `<div style="font-weight:600">Top Gainers</div>`;
    container.appendChild(headerTop);
    top.forEach(c => container.appendChild(makeRow(c)));
    const headerBot = document.createElement('div'); headerBot.innerHTML = `<div style="margin-top:8px;font-weight:600">Top Losers</div>`;
    container.appendChild(headerBot);
    bottom.forEach(c => container.appendChild(makeRow(c)));

  }catch(e){
    console.error(e);
  }finally{
    Utils.showSpinner(false);
  }
}

function wireConverter(){
  const usdInput = document.getElementById('usd-input');
  usdInput.addEventListener('input', ()=>{
    const val = Number(usdInput.value || 0);
    if(!usdToInrRate){ document.getElementById('inr-output').textContent='—'; return; }
    document.getElementById('inr-output').textContent = new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR' }).format(val * usdToInrRate);
  });
}

async function loadUsdRate(){
  try{
    usdToInrRate = await API.fetchUsdToInr();
    if(usdToInrRate){
      Utils.showStatus('Exchange rate loaded');
      document.getElementById('inr-output').textContent = new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR' }).format(1 * usdToInrRate);
    }
  }catch(e){
    console.warn('Could not load USD→INR rate', e);
  }
}

function wireFavoritesUI(){
  // clicking favorite on list handled in renderFavoritesList
  // Expose global for dev convenience:
  window.cdr = { refreshFavorites: renderFavoritesList };
}
