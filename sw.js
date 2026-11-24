// Service worker do Chronicles & Sheet: deixa o site abrir sem internet.
// Estratégia "rede primeiro": com internet, cada abertura busca a versão mais nova
// e atualiza a cópia guardada; sem internet (ou com rede muito lenta), usa a cópia.
// Assim ninguém fica presa em uma versão antiga: basta abrir o site online uma vez.
// Os dados da ficha NÃO ficam aqui: continuam no localStorage, como sempre.

const VERSAO_CACHE = 'chronicles-sheet-v1';
const TEMPO_LIMITE_REDE = 4000;
const ARQUIVOS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.webmanifest',
  './icons/icone.svg',
  './icons/icone-180.png',
  './icons/icone-192.png',
  './icons/icone-512.png',
];

self.addEventListener('install', (event) => {
  // skipWaiting: a versão nova do service worker assume logo, sem esperar fechar todas as abas.
  event.waitUntil(
    caches.open(VERSAO_CACHE)
      .then((cache) => cache.addAll(ARQUIVOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  // Apaga caches de versões anteriores (se VERSAO_CACHE mudar) e passa a controlar as abas abertas.
  event.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((chave) => chave !== VERSAO_CACHE).map((chave) => caches.delete(chave))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Só cuida de GET do próprio site; o resto segue direto para a rede.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(responderRedePrimeiro(event));
});

async function responderRedePrimeiro(event) {
  const { request } = event;
  const cache = await caches.open(VERSAO_CACHE);

  // cache: 'no-cache' pula o cache HTTP do navegador (o GitHub Pages guarda por 10 min).
  const daRede = fetch(request, { cache: 'no-cache' }).then((resposta) => {
    if (resposta.ok) {
      event.waitUntil(cache.put(request, resposta.clone()));
    }
    return resposta;
  });
  // Mantém o download vivo mesmo que a cópia guardada responda antes.
  event.waitUntil(daRede.catch(() => {}));

  const guardada = (await cache.match(request, { ignoreSearch: true }))
    || (request.mode === 'navigate' ? await cache.match('./index.html') : undefined);

  // Nada guardado ainda: depende só da rede.
  if (!guardada) return daRede;

  // Rede lenta demais ou sem conexão: usa a cópia. A versão nova fica para a próxima abertura.
  const limite = new Promise((resolve) => setTimeout(() => resolve(guardada), TEMPO_LIMITE_REDE));
  return Promise.race([daRede.catch(() => guardada), limite]);
}
