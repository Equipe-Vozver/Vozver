// ===== Configurações =====

const html = document.documentElement;
const barra = document.getElementById("rate");

// Escolhas padrão. Os nomes (text, contrast, rate...) são os mesmos usados no HTML
let config = {
    text: "md",            // tamanho do texto: sm, md ou lg
    contrast: "padrao",    // padrao ou negativo
    rate: 50,              // velocidade da voz, de 0 a 100
    read: true,            // ler ícones em voz alta
    letters: true,         // letras maiores
    icons: true            // ícones ampliados
};

// ---------- Salvar e recuperar as escolhas ----------
// localStorage guarda dados no navegador, mesmo depois de fechar a página.
// O try/catch evita quebrar a página se o navegador não deixar salvar
function carregar() {
    try {
        const salvo = localStorage.getItem("vozver-config");
        if (salvo) {
            config = { ...config, ...JSON.parse(salvo) };
        }
    } catch (erro) {}
}

function salvar() {
    try {
        localStorage.setItem("vozver-config", JSON.stringify(config));
    } catch (erro) {}
}

// ---------- Falar ----------
// "forcar" faz falar mesmo com a leitura desligada (para avisar que desligou)
function falar(texto, forcar = false) {
    if (!config.read && !forcar) return;
    if (!("speechSynthesis" in window)) return;

    speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = "pt-BR";
    fala.rate = 0.6 + config.rate / 100;   // vai de 0.6 (lenta) até 1.6 (rápida)
    speechSynthesis.speak(fala);
}

// ---------- Pintar a barra de velocidade ----------
// Deixa a parte até a bolinha azul e o resto cinza
function pintarBarra() {
    const cores = getComputedStyle(html);
    const destaque = cores.getPropertyValue("--destaque");
    const cinza = cores.getPropertyValue("--track");
    const ponto = `calc(11px + (100% - 22px) * ${config.rate / 100})`;   // 11px = metade da bolinha

    barra.style.background = `linear-gradient(to right, ${destaque} ${ponto}, ${cinza} ${ponto})`;
}

// ---------- Mostrar as escolhas na tela ----------
function aplicar() {
    // Tamanho do texto (o CSS usa a variável --size)
    const tamanhos = { sm: 0.88, md: 1, lg: 1.2 };
    let tamanho = tamanhos[config.text];
    if (config.letters) {
        tamanho = tamanho * 1.15;
    }
    html.style.setProperty("--size", tamanho);

    // Tamanho dos ícones (o CSS usa a variável --icon)
    html.style.setProperty("--icon", config.icons ? 1.3 : 1);

    // Contraste (o CSS troca as cores com data-contrast="negativo")
    html.dataset.contrast = config.contrast;

    // Marca as opções escolhidas
    document.querySelector(`input[name=text][value=${config.text}]`).checked = true;
    document.querySelector(`input[name=contrast][value=${config.contrast}]`).checked = true;
    barra.value = config.rate;
    pintarBarra();

    // Liga ou desliga as chaves
    document.querySelectorAll(".sw").forEach(function (chave) {
        chave.setAttribute("aria-checked", config[chave.dataset.key]);
    });
}

// ---------- Quando a pessoa escolhe algo ----------

// Tamanho do texto e contraste
document.querySelectorAll("input[name=text], input[name=contrast]").forEach(function (opcao) {
    opcao.addEventListener("change", function () {
        config[opcao.name] = opcao.value;
        aplicar();
        salvar();

        const rotulo = document.querySelector(`label[for=${opcao.id}]`);
        falar(rotulo.dataset.say);
    });
});

// Velocidade da voz
barra.addEventListener("input", function () {
    config.rate = Number(barra.value);
    pintarBarra();
    salvar();
});

barra.addEventListener("change", function () {
    falar("Esta é a velocidade da voz");
});

// Chaves liga/desliga
document.querySelectorAll(".sw").forEach(function (chave) {
    chave.addEventListener("click", function () {
        const estavaLendo = config.read;

        config[chave.dataset.key] = !config[chave.dataset.key];   // inverte: true vira false e vice-versa
        aplicar();
        salvar();

        const nome = document.getElementById(chave.getAttribute("aria-labelledby")).textContent;
        const estado = config[chave.dataset.key] ? "ativado" : "desativado";

        // Fala ao ligar e também ao desligar a leitura
        if (estavaLendo || config.read) {
            falar(`${nome}: ${estado}`, true);
        }
    });
});

// Botão voltar: fala "Voltar" e volta para a página anterior
const botaoVoltar = document.getElementById("back");

botaoVoltar.addEventListener("click", function () {
    falar(botaoVoltar.dataset.say);

    if (document.referrer) {
        history.back();
    } else {
        window.location.href = "Menubusca.html";   // se abriu direto, vai para o menu
    }
});

// ---------- Começo ----------
carregar();
aplicar();