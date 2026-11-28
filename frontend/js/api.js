// ===== Conversa com a API (o servidor em Python) =====
// O site pede os produtos ao servidor (backend/main.py) usando fetch().
// O servidor responde em JSON (um texto com o formato de um objeto do JavaScript).
//
// Rotas da API:
//   GET api/produtos/codigo/7890000000011   -> um produto pelo código de barras
//   GET api/produtos/busca?texto=arroz      -> produtos pelo nome (busca por voz)
//   GET api/produtos/categoria/Café         -> produtos da mesma categoria (comparar preços)
//
// SEM INTERNET: se o servidor não responder em 4 segundos (ou der erro),
// a resposta vem da cópia dos produtos guardada no celular (js/sem_internet.js).

// Pergunta ao servidor. Se não der, usa o plano reserva "semInternet".
async function perguntarAoServidor(endereco, semInternet) {
    try {
        // AbortSignal.timeout: desiste depois de 4 segundos (Wi-Fi ligado, mas sem internet)
        const resposta = await fetch(endereco, { signal: AbortSignal.timeout(4000) });
        if (resposta.status === 404) {
            return null;   // 404 = "não encontrado"
        }
        if (resposta.ok) {
            return await resposta.json();
        }
    } catch (erro) {
        // Sem internet ou demorou demais: segue para a cópia guardada
    }
    return semInternet();
}

// Procura um produto pelo código de barras. Devolve null se não achar.
function buscarProdutoPorCodigo(codigo) {
    return perguntarAoServidor('api/produtos/codigo/' + encodeURIComponent(codigo),
        () => codigoSemInternet(codigo));
}

// Procura pelo que a pessoa falou ou digitou. Devolve uma lista (do mais barato ao mais caro).
function buscarProdutosPorNome(texto) {
    return perguntarAoServidor('api/produtos/busca?texto=' + encodeURIComponent(texto) + '&de=' + corredorAtual,
        () => nomeSemInternet(texto, corredorAtual));
}

// Produtos da mesma categoria, do mais barato para o mais caro (a balança)
function buscarProdutosDaCategoria(categoria) {
    return perguntarAoServidor('api/produtos/categoria/' + encodeURIComponent(categoria),
        () => categoriaSemInternet(categoria));
}

// ---------- Ajudantes para mostrar e falar preços ----------
// O preço vem em centavos (1890 = R$ 18,90) para não ter erro de conta com vírgula.

// 1890 vira "R$ 18,90" (para mostrar na tela)
function precoEmTexto(centavos) {
    return 'R$ ' + (centavos / 100).toFixed(2).replace('.', ',');
}

// 1890 vira "18 reais e 90 centavos" (para o app falar certinho)
function precoFalado(centavos) {
    const reais = Math.floor(centavos / 100);
    const resto = centavos % 100;
    if (resto === 0) {
        return `${reais} reais`;
    }
    return `${reais} reais e ${resto} centavos`;
}

// Protege o HTML: troca < > & " por códigos, para um texto nunca virar código na página
function escapar(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
// ---------- Onde a pessoa provavelmente está ----------
// 0 = entrada; 1 a 4 = um corredor. O app "deduz": quando a pessoa acha um produto
// (pela busca ou pelo leitor de código), ela vai até o corredor dele.
// Fica só na memória do app e some quando ele fecha: não salvamos por onde a pessoa anda (LGPD).
let corredorAtual = 0;