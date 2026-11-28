// ===== Service worker do vozver =====
// Ele fica "entre" o site e a internet e guarda uma cópia dos arquivos no celular.
// Assim o app abre mais rápido e, sem internet, continua funcionando (Demoday!).
//
// 1) Na instalação (primeira vez que abre com internet) ele já guarda TODOS os arquivos
//    da lista abaixo, até das telas que a pessoa ainda não abriu.
// 2) Depois, tenta a internet primeiro (para pegar a versão nova do site).
//    Se a internet não responder em 3 segundos, usa a cópia guardada.
// 3) Os pedidos da API (/api/...) ele deixa passar: quem cuida deles é o js/api.js,
//    que usa a cópia dos produtos (dados/produtos_offline.json) quando não tem internet.

// Mudou a lista ou quer forçar uma cópia nova? Troque o número da versão.
const NOME_DA_CAIXA = 'vozver-v2';

// TODOS os arquivos do site. Criou um arquivo novo na pasta frontend? Coloque aqui também.
const ARQUIVOS = [
    './',
    'index.html',
    'manifest.json',
    'css/base.css',
    'css/telas/inicio.css',
    'css/telas/menu.css',
    'css/telas/ajustes.css',
    'css/telas/ler_codigo.css',
    'css/telas/busca.css',
    'css/telas/resultado.css',
    'css/telas/politica.css',
    'js/icones.js',
    'js/config_e_voz.js',
    'js/navegacao.js',
    'js/sem_internet.js',
    'js/api.js',
    'js/telas/inicio.js',
    'js/telas/menu.js',
    'js/telas/ajustes.js',
    'js/telas/ler_codigo.js',
    'js/telas/comparar.js',
    'js/telas/busca.js',
    'js/telas/resultado.js',
    'js/telas/politica.js',
    'js/app.js',
    'vendor/barcode-detector.js',
    'vendor/zxing_reader.wasm',
    'fontes/Nunito_700Bold.ttf',
    'fontes/Nunito_800ExtraBold.ttf',
    'fontes/Poppins_500Medium.ttf',
    'fontes/Poppins_700Bold.ttf',
    'fontes/Poppins_800ExtraBold.ttf',
    'img/balanca.png',
    'img/icone-192.png',
    'img/icone-512.png',
    'img/logo-claro.png',
    'img/logo-escuro.png',
    'dados/produtos_offline.json',
];

// Instalação: guarda tudo de uma vez ("reload" = pega do servidor, não do cache velho do navegador)
self.addEventListener('install', (evento) => {
    evento.waitUntil(
        caches.open(NOME_DA_CAIXA)
            .then((caixa) => caixa.addAll(ARQUIVOS.map((arquivo) => new Request(arquivo, { cache: 'reload' }))))
            .then(() => self.skipWaiting())
    );
});

// Ativação: apaga as caixas de versões antigas (ex.: vozver-v1)
self.addEventListener('activate', (evento) => {
    evento.waitUntil(
        caches.keys()
            .then((nomes) => Promise.all(nomes
                .filter((nome) => nome !== NOME_DA_CAIXA)
                .map((nome) => caches.delete(nome))))
            .then(() => self.clients.claim())
    );
});

// Espera a "promessa" no máximo "ms" milissegundos; passou disso, desiste
function comTempoLimite(promessa, ms) {
    return new Promise((cumprir, falhar) => {
        const relogio = setTimeout(() => falhar(new Error('A internet demorou demais')), ms);
        promessa.then(
            (valor) => { clearTimeout(relogio); cumprir(valor); },
            (erro) => { clearTimeout(relogio); falhar(erro); }
        );
    });
}

self.addEventListener('fetch', (evento) => {
    const pedido = evento.request;
    const endereco = new URL(pedido.url);
    // Só cuida de pedidos GET do próprio site, e deixa a API com o js/api.js
    if (pedido.method !== 'GET' || endereco.origin !== self.location.origin ||
        endereco.pathname.startsWith('/api/')) {
        return;
    }

    // "no-cache": pergunta ao servidor se tem versão nova, em vez de usar a cópia velha do navegador
    const daInternet = fetch(pedido, { cache: 'no-cache' }).then((resposta) => {
        // Guarda uma cópia da resposta para usar quando estiver sem internet
        if (resposta.ok) {
            const copia = resposta.clone();
            caches.open(NOME_DA_CAIXA).then((caixa) => caixa.put(pedido, copia));
        }
        return resposta;
    });

    evento.respondWith(
        comTempoLimite(daInternet, 3000)
            // Sem internet ou demorou: usa a cópia guardada
            .catch(() => caches.match(pedido))
            // Não tinha cópia? Então espera a internet mesmo
            .then((resposta) => resposta || daInternet)
            // Nada deu certo: mostra a página inicial guardada
            .catch(() => caches.match('./'))
    );
});
