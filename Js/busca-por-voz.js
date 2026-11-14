console.log("buscar_por_voz.js carregou!");
// 1) PEGAR os elementos da página
// "const" = uma caixinha com nome que guarda um valor e não será trocada.
// getElementById procura no HTML o elemento que tem aquele id.
const botaoMicrofone = document.getElementById("botao-microfone");
const mensagem = document.getElementById("mensagem");

// 2) REAGIR ao clique
// addEventListener = "fique de ouvido: quando acontecer um 'click' aqui,
// execute a função que está logo depois".
botaoMicrofone.addEventListener("click", function () {

    // classList.toggle("ouvindo") = interruptor de luz:
    //   se o botão NÃO tem a classe "ouvindo", coloca e devolve true
    //   se o botão JÁ tem a classe "ouvindo", tira e devolve false
    // O resultado fica guardado em "ouvindo" (true = ligado, false = desligado)
    const ouvindo = botaoMicrofone.classList.toggle("ouvindo");

    // 3) MUDAR o texto da tela
    // Isto é um "if" em uma linha:  condição ? valor se verdadeiro : valor se falso
    // textContent = o texto que aparece dentro do elemento
    mensagem.textContent = ouvindo ? "Estou ouvindo..." : "Diga o que Procura...";

    // 4) AVISAR o leitor de tela o que o botão faz AGORA
    // setAttribute(nome, valor) = muda um atributo do HTML (aqui, o aria-label)
    botaoMicrofone.setAttribute("aria-label", ouvindo ? "Parar de ouvir" : "Começar a ouvir");
});