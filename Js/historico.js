// ===== Histórico de produtos =====

// Pega os elementos do HTML pelo id
const lista = document.getElementById("lista");
const vazio = document.getElementById("vazio");
const textoStatus = document.getElementById("texto-status");
const botaoLimpar = document.getElementById("botao-limpar");

// Nome da "gaveta" do localStorage onde o histórico fica guardado.
// Quando o leitor de código de barras reconhecer um produto, ele salva aqui.
const CHAVE = "vozver-historico";

// Faz o celular falar um texto em voz alta (usa a velocidade das Configurações)
function falar(texto) {
    if (!("speechSynthesis" in window)) return;

    let velocidade = 50;
    try {
        const config = JSON.parse(localStorage.getItem("vozver-config"));
        if (config && config.read === false) return;   // leitura desligada
        if (config && config.rate !== undefined) velocidade = config.rate;
    } catch (erro) {}

    window.speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = "pt-BR";
    fala.rate = 0.6 + velocidade / 100;
    window.speechSynthesis.speak(fala);
}

// Lê a lista salva. Se não tiver nada (ou der erro), devolve lista vazia
function carregar() {
    try {
        return JSON.parse(localStorage.getItem(CHAVE)) || [];
    } catch (erro) {
        return [];
    }
}

// Monta a frase que o VozVer fala sobre o produto
function descrever(produto) {
    let frase = produto.nome;
    if (produto.marca) frase += ", marca " + produto.marca;
    if (produto.peso) frase += ", " + produto.peso;
    if (produto.preco) frase += ", " + produto.preco;
    return frase;
}

// Desenha a lista na tela
function mostrar() {
    const produtos = carregar();
    lista.innerHTML = "";

    if (produtos.length === 0) {
        vazio.hidden = false;
        botaoLimpar.hidden = true;
        textoStatus.textContent = "Nenhum produto consultado ainda";
        return;
    }

    vazio.hidden = true;
    botaoLimpar.hidden = false;
    textoStatus.textContent = produtos.length === 1
        ? "1 produto consultado. Toque para ouvir."
        : produtos.length + " produtos consultados. Toque para ouvir.";

    produtos.forEach(function (produto) {
        const item = document.createElement("li");
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "produto";
        botao.setAttribute("aria-label", "Ouvir: " + descrever(produto));

        // Ícone de alto-falante + nome + detalhes
        botao.innerHTML =
            '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' +
                '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>' +
                '<path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>' +
            '</svg>' +
            '<span class="produto-info">' +
                '<span class="produto-nome"></span>' +
                '<span class="produto-detalhe"></span>' +
            '</span>';

        // textContent evita que algum texto estranho vire HTML
        botao.querySelector(".produto-nome").textContent = produto.nome;
        botao.querySelector(".produto-detalhe").textContent =
            [produto.marca, produto.peso, produto.preco].filter(Boolean).join(" · ");

        botao.addEventListener("click", function () {
            falar(descrever(produto));
        });

        item.appendChild(botao);
        lista.appendChild(item);
    });
}

// Limpar histórico: pergunta antes, porque não dá para desfazer
botaoLimpar.addEventListener("click", function () {
    if (!confirm("Apagar todo o histórico de produtos?")) return;

    try {
        localStorage.removeItem(CHAVE);
    } catch (erro) {}

    mostrar();
    falar("Histórico apagado");
});

// ---------- Começo ----------
mostrar();
