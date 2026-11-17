// ===== Service worker do VozVer =====
// Ele fica "entre" o site e a internet e guarda uma cópia dos arquivos no celular.
// Assim o app abre mais rápido e, sem internet, ainda mostra as telas.
// Regra simples: tenta a internet primeiro; se não der, usa a cópia guardada.
// (A internet primeiro garante que uma versão nova do site aparece logo.)

const NOME_DA_CAIXA = 'vozver-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (evento) => evento.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (evento) => {
    const pedido = evento.request;
    // Só cuida de pedidos GET do próprio site
    if (pedido.method !== 'GET' || new URL(pedido.url).origin !== self.location.origin) {
        return;
    }
    evento.respondWith(
        fetch(pedido)
            .then((resposta) => {
                // Guarda uma cópia da resposta para usar quando estiver sem internet
                if (resposta.ok) {
                    const copia = resposta.clone();
                    caches.open(NOME_DA_CAIXA).then((caixa) => caixa.put(pedido, copia));
                }
                return resposta;
            })
            .catch(() => caches.match(pedido).then((guardada) => guardada || caches.match('./')))
    );
});
