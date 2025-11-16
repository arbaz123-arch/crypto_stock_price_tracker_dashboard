// api.js — handles network calls to CoinGecko and exchange rate API
const API = (function(){
  const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

  async function searchCoin(query){
    // returns first matching coin object or null
    const res = await fetch(`${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`);
    if(!res.ok) throw new Error('Search failed');
    const data = await res.json();
    return data.coins && data.coins.length ? data.coins[0] : null;
  }

  async function fetchCoinMarketData(id){
    // markets endpoint returns price, market cap, 24h change, image
    const res = await fetch(`${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${encodeURIComponent(id)}&order=market_cap_desc&per_page=1&page=1&sparkline=false`);
    if(!res.ok) throw new Error('Coin data fetch failed');
    const arr = await res.json();
    return arr && arr.length ? arr[0] : null;
  }

  async function fetchMarketChart(id, days = 7){
    const res = await fetch(`${COINGECKO_BASE}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}&interval=daily`);
    if(!res.ok) throw new Error('Chart fetch failed');
    return await res.json(); // { prices: [[ts,price], ...], ...}
  }

  async function fetchTopMarketPage(per_page = 50){
    const res = await fetch(`${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${per_page}&page=1&sparkline=false`);
    if(!res.ok) throw new Error('Top market fetch failed');
    return await res.json();
  }

  async function fetchUsdToInr(){
    // public exchange rate endpoint
    const res = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=INR');
    if(!res.ok) throw new Error('Exchange rate fetch failed');
    const data = await res.json();
    return data && data.rates ? data.rates.INR : null;
  }

  return {
    searchCoin,
    fetchCoinMarketData,
    fetchMarketChart,
    fetchTopMarketPage,
    fetchUsdToInr
  };
})();
