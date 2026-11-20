# =====================================================================
# Corredores do mercado e como chegar neles
#
# Este arquivo cuida só do CAMINHO dentro do mercado.
# Os produtos ficam em outro lugar (hoje no produtos_teste.py; depois, no banco MySQL).
# Por isso, quando o banco chegar, este arquivo continua igual.
# =====================================================================

# Como chegar em cada corredor saindo da entrada
CORREDORES = {
    1: "Da entrada, é o primeiro corredor à sua esquerda.",
    2: "Da entrada, siga em frente e entre no segundo corredor à esquerda.",
    3: "Da entrada, siga em frente e entre no terceiro corredor à esquerda.",
    4: "Da entrada, siga em frente até o fundo da loja e vire à direita. É o primeiro corredor.",
}

# Para ir de um corredor a outro (sem voltar até a entrada).
# O mercado de teste tem um corredor principal que vai da entrada até o fundo da loja.
# Andando em direção ao fundo, os corredores 1, 2 e 3 ficam à esquerda e o 4 fica à direita.
LADO_INDO_PARA_O_FUNDO = {1: "esquerda", 2: "esquerda", 3: "esquerda", 4: "direita"}


def como_chegar(de, para):
    """Explica o caminho até o corredor "para".
    "de" é onde a pessoa provavelmente está: 0 = entrada, 1 a 4 = um corredor."""
    if de == para:
        return f"Você já está no corredor {para}."
    if de == 0:
        return CORREDORES[para]   # está na entrada: usa as frases de sempre

    # Para que lado andar no corredor principal
    if para > de:
        sentido = "em direção ao fundo da loja"
        lado = LADO_INDO_PARA_O_FUNDO[para]
    else:
        sentido = "em direção à entrada"
        # andando para o outro lado, a esquerda vira direita (e o contrário)
        lado = "direita" if LADO_INDO_PARA_O_FUNDO[para] == "esquerda" else "esquerda"

    # Quantos corredores ficam no meio do caminho
    no_meio = abs(para - de) - 1
    if no_meio == 0:
        contagem = f"O corredor {para} é o próximo"
    elif no_meio == 1:
        contagem = f"Passe por 1 corredor. O corredor {para} é o seguinte"
    else:
        contagem = f"Passe por {no_meio} corredores. O corredor {para} é o seguinte"

    return (
        f"Você está no corredor {de}. Volte para o corredor principal e siga {sentido}. "
        f"{contagem}, à sua {lado}."
    )


def com_onde_fica(produto, de=0):
    """Devolve uma cópia do produto com a frase de onde ele fica e como chegar lá.
    "de" = onde a pessoa está agora (0 = entrada)."""
    copia = dict(produto)
        # Se o produto veio do banco, ele tem a seção: "corredor 2, Matinais"
    secao = f', {produto["secao"]}' if produto.get("secao") else ""
    copia["onde_fica"] = (
        f'{produto["categoria"]} fica no corredor {produto["corredor"]}{secao}. '
        f'{como_chegar(de, produto["corredor"])}'
    )
    return copia