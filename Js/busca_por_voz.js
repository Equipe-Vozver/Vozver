// ===== Buscar por voz =====

// Pega os elementos do HTML pelo id
const botaoMicrofone = document.getElementById("botao-microfone");
const mensagem = document.getElementById("mensagem");

// Quando clicar no microfone, executa esta função
botaoMicrofone.addEventListener("click", function () {

    // toggle liga e desliga a classe "ouvindo" (como um interruptor).
    // Guarda true se ligou e false se desligou
    const ouvindo = botaoMicrofone.classList.toggle("ouvindo");

    // Troca o texto da tela. É um "se" em uma linha:
    // condição ? valor se verdadeiro : valor se falso
    mensagem.textContent = ouvindo ? "Estou ouvindo..." : "Diga o que você procura...";

    // Atualiza o que o leitor de tela fala sobre o botão
    botaoMicrofone.setAttribute("aria-label", ouvindo ? "Parar de ouvir" : "Começar a ouvir");
});