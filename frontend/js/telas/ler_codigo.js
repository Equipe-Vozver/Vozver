// ===== Ler código de barras =====
// É o botão da câmera do menu. Desenho do Figma ("Reconhecer Imagem e Codigo"):
//   - em cima, uma elipse com o ícone da câmera;
//   - no meio, a câmera com a mira;
//   - embaixo, o cartão do produto (quando acha um) e o VOLTAR.
// A câmera procura o código sozinha: quando acha, o celular vibra e o app fala o produto.
//
// Quem lê o código é o "BarcodeDetector":
//   - no Chrome do Android ele já vem no navegador;
//   - nos outros (iPhone, computador), usamos a biblioteca da pasta vendor/ (ZXing).

// Tipos de código: ean_13/ean_8/upc são os dos produtos do mercado;
// code_128 é para testar com os códigos de exemplo do banco.
const TIPOS_DE_CODIGO = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'];

const video = document.getElementById('video-camera');
const cartaoProduto = document.getElementById('cartao-produto');
const avisoSemCamera = document.getElementById('sem-camera');

let fluxoDaCamera = null;      // a imagem ao vivo da câmera
let leitor = null;             // o BarcodeDetector
let lendo = false;             // false = pausa a procura por códigos
let relogioDaProcura = null;
let produtoAtual = null;       // produto mostrado no cartão (null = nenhum)
let produtoParaComparar = null; // a tela Comparar usa este produto

// A biblioteca reserva precisa de um arquivo .wasm (o "motor" da leitura).
// Aqui dizemos para ela usar o nosso, da pasta vendor/, e não baixar da internet.
BarcodeDetectionAPI.setZXingModuleOverrides({
    locateFile(arquivo, pasta) {
        if (arquivo.endsWith('.wasm')) {
            return new URL('vendor/zxing_reader.wasm', location.href).href;
        }
        return pasta + arquivo;
    },
});

// Escolhe o leitor: o do navegador, se ele souber ler esses códigos; senão, o reserva
async function criarLeitor() {
    if ('BarcodeDetector' in window) {
        try {
            const suportados = await BarcodeDetector.getSupportedFormats();
            const tipos = TIPOS_DE_CODIGO.filter((tipo) => suportados.includes(tipo));
            if (tipos.length > 0) {
                return new BarcodeDetector({ formats: tipos });
            }
        } catch (erro) {}
    }
    return new BarcodeDetectionAPI.BarcodeDetector({ formats: TIPOS_DE_CODIGO });
}

// ---------- Ligar e desligar a câmera ----------
async function ligarCamera() {
    avisoSemCamera.hidden = true;

    // A câmera só funciona em site seguro (https) ou no próprio computador (localhost)
    if (!window.isSecureContext || !navigator.mediaDevices) {
        mostrarSemCamera('A câmera só funciona com endereço seguro (https). Use o campo Digitar o código.');
        return;
    }

    try {
                // facingMode "environment" = câmera de trás do celular.
        // Pedimos 1280x720: sem isso, muitas câmeras mandam uma imagem pequena
        // e as barrinhas finas do código viram borrão. "ideal" = se não der, usa o que tiver.
        // focusMode "continuous" = a câmera fica focando sozinha (quem não tem, ignora).
        fluxoDaCamera = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 720 },
                advanced: [{ focusMode: 'continuous' }],
            },
            audio: false,
        });
        video.srcObject = fluxoDaCamera;
        await video.play();

        if (!leitor) {
            leitor = await criarLeitor();
        }
        // Só começa a procurar se não tiver um produto aberto no cartão
        if (!produtoAtual) {
            lendo = true;
            procurarCodigo();
        }
    } catch (erro) {
        if (erro.name === 'NotAllowedError') {
            mostrarSemCamera('O vozver precisa usar a câmera. Toque em Ligar câmera e depois em Permitir.');
        } else {
            mostrarSemCamera('Não consegui ligar a câmera. Toque em Ligar câmera para tentar de novo.');
        }
    }
}

function desligarCamera() {
    lendo = false;
    clearTimeout(relogioDaProcura);
    if (fluxoDaCamera) {
        fluxoDaCamera.getTracks().forEach((parte) => parte.stop());   // apaga a luz da câmera
        fluxoDaCamera = null;
    }
    video.srcObject = null;
}

function mostrarSemCamera(texto) {
    document.getElementById('sem-camera-texto').textContent = texto;
    avisoSemCamera.hidden = false;
    falar(texto);
}

document.getElementById('botao-ligar-camera').addEventListener('click', ligarCamera);

// ---------- Procurar o código na imagem ----------
// Olha a imagem da câmera 4 vezes por segundo até achar um código
async function procurarCodigo() {
    if (!lendo || !fluxoDaCamera) {
        return;
    }
    try {
        if (video.readyState >= 2) {   // 2 = o vídeo já tem imagem
            const codigos = await leitor.detect(video);
            if (codigos.length > 0 && lendo) {
                codigoLido(codigos[0].rawValue);
                return;
            }
        }
    } catch (erro) {}
    relogioDaProcura = setTimeout(procurarCodigo, 250);
}

// A câmera achou um código, por exemplo "7890000000011"
function codigoLido(codigo) {
    lendo = false;   // para de ler, senão lê o mesmo código várias vezes
    if (navigator.vibrate) {
        navigator.vibrate(100);   // vibra rapidinho: avisa que leu (só no Android)
    }
    mostrarProdutoDoCodigo(codigo);
}

// Volta a procurar códigos (se a pessoa ainda estiver nesta tela)
function voltarALer() {
    if (telaAtual === 'ler_codigo' && fluxoDaCamera && !produtoAtual) {
        lendo = true;
        procurarCodigo();
    }
}

// ---------- Buscar o produto na API e mostrar ----------
// "digitado" = true quando veio do campo de texto (aí não tem câmera para tentar de novo)
async function mostrarProdutoDoCodigo(codigo, digitado = false) {
    let produto;
    try {
        produto = await buscarProdutoPorCodigo(codigo);
    } catch (erro) {
        falar('Não consegui falar com o servidor do vozver. Confira a internet.');
        if (!digitado) {
            setTimeout(voltarALer, 3000);
        }
        return;
    }

    if (!produto) {
        if (digitado) {
            falar('Produto não encontrado. Confira os números e tente de novo.');
        } else {
            falar('Produto não encontrado. Vou tentar de novo em 3 segundos.');
            setTimeout(voltarALer, 3000);
        }
        return;
    }

    mostrarCartao(produto);
    corredorAtual = produto.corredor;   // leu o produto: a pessoa está no corredor dele
    falar(
        `${produto.nome}, ${produto.marca}, ${produto.peso}. Preço: ${precoFalado(produto.preco)}. ` +
        'Embaixo tem os botões: ouvir detalhes, comparar preços e ler outro.'
    );
}

// Monta o cartão com nome, marca, peso, preço e 3 botões
function mostrarCartao(produto) {
    produtoAtual = produto;
    cartaoProduto.innerHTML = `
        <p class="produto-nome">${escapar(produto.nome)}</p>
        <p class="produto-info">${escapar(produto.marca)} · ${escapar(produto.peso)}</p>
        <p class="produto-preco">${precoEmTexto(produto.preco)}</p>
        <div class="linha-botoes">
            <button class="botao-pequeno" type="button" data-acao="detalhes"
                    aria-describedby="dica-detalhes">Ouvir detalhes</button>
            <button class="botao-pequeno" type="button" data-acao="comparar" aria-label="Comparar preços">
                <span class="icone-balanca" aria-hidden="true"></span>
            </button>
            <button class="botao-pequeno" type="button" data-acao="outro">Ler outro</button>
        </div>
        <span id="dica-detalhes" class="so-leitor">Fala os ingredientes e a tabela nutricional</span>
    `;
    cartaoProduto.hidden = false;
}

function fecharCartao() {
    produtoAtual = null;
    cartaoProduto.hidden = true;
    cartaoProduto.innerHTML = '';
}

// Um "ouvinte" só para os 3 botões do cartão: o data-acao diz qual foi tocado
cartaoProduto.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button');
    if (!botao || !produtoAtual) {
        return;
    }
    const acao = botao.dataset.acao;

    if (acao === 'detalhes') {
        falar(`Ingredientes: ${produtoAtual.ingredientes} Tabela nutricional: ${produtoAtual.nutricional}`);
    }
    if (acao === 'comparar') {
        produtoParaComparar = produtoAtual;
        irPara('comparar');
    }
    if (acao === 'outro') {
        fecharCartao();
        falar('Aponte a câmera para o próximo código de barras.');
        voltarALer();
    }
});

// ---------- Digitar o código (sem câmera) ----------
document.getElementById('form-codigo').addEventListener('submit', (evento) => {
    evento.preventDefault();   // não recarrega a página
    const campo = document.getElementById('campo-codigo');
    const codigo = campo.value.replace(/\D/g, '');   // fica só com os números
    if (codigo === '') {
        falar('Digite os números do código de barras.');
        return;
    }
    lendo = false;
    fecharCartao();
    mostrarProdutoDoCodigo(codigo, true);
});

// ---------- Abrir e sair da tela ----------
registrarTela('ler_codigo', {
    aoAbrir({ voltando }) {
        // Veio do menu: começa do zero. Voltou do Comparar: mantém o cartão aberto.
        if (!voltando) {
            fecharCartao();
            falar('Ler código de barras. Aponte a câmera para o código de barras do produto, devagar, a um palmo de distância.');
        } else if (produtoAtual) {
            falar(`${produtoAtual.nome}. Embaixo tem os botões: ouvir detalhes, comparar preços e ler outro.`);
        }
        ligarCamera();
    },
    aoSair() {
        desligarCamera();   // a câmera não fica ligada em outras telas
    },
});
