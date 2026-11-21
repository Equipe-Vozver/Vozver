-- =====================================================================
-- Banco de dados do vozver (MySQL 8, MariaDB do XAMPP ou MySQL da Aiven)
-- Feito a partir do modelo lógico do grupo (Desktop/VOZVER/Lógico_vozver.brM3),
-- com corredor, preço e ingredientes para o app.
--
-- Como usar: abra este arquivo no MySQL Workbench e clique no raio (⚡)
-- para rodar tudo. Ele APAGA e cria de novo o banco "vozver",
-- então só rode de novo se quiser começar do zero.
-- CUIDADO: confira o nome da conexão na aba (vozver-xampp ou vozver-aiven)
-- antes de rodar.
--
-- LGPD: o banco guarda só PRODUTOS. Nenhum dado de quem usa o app.
-- =====================================================================

DROP DATABASE IF EXISTS vozver;
-- utf8mb4_general_ci funciona no MySQL 8 e no MariaDB (XAMPP)
CREATE DATABASE vozver CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE vozver;

-- ---------------------------------------------------------------------
-- corredor: os corredores do mercado e o nome da seção de cada um
-- (o mesmo que está escrito nas plaquinhas da banca)
-- ---------------------------------------------------------------------
CREATE TABLE corredor (
    numero TINYINT PRIMARY KEY,      -- 1, 2, 3, 4
    secao  VARCHAR(40) NOT NULL      -- Bebidas, Matinais...
);

-- ---------------------------------------------------------------------
-- categoria: tipo do produto (Achocolatado, Feijão, Detergente...)
-- Cada categoria fica num corredor.
-- ---------------------------------------------------------------------
CREATE TABLE categoria (
    id_categoria       INT AUTO_INCREMENT PRIMARY KEY,
    nome_categoria     VARCHAR(60) NOT NULL UNIQUE,
    alimento           BOOLEAN NOT NULL DEFAULT TRUE,   -- FALSE = limpeza (não é para comer)
    fk_corredor_numero TINYINT NOT NULL,
    FOREIGN KEY (fk_corredor_numero) REFERENCES corredor (numero)
);

-- ---------------------------------------------------------------------
-- marca: fabricante (Nestlé, Ypê...)
-- ---------------------------------------------------------------------
CREATE TABLE marca (
    id_marca   INT AUTO_INCREMENT PRIMARY KEY,
    nome_marca VARCHAR(60) NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------
-- produto: o produto "em geral" (ex.: Achocolatado em Pó Nescau)
-- Se a categoria ou a marca for apagada, o produto vai junto (CASCADE),
-- como está no modelo.
-- ---------------------------------------------------------------------
CREATE TABLE produto (
    id_produto                INT AUTO_INCREMENT PRIMARY KEY,
    nome                      VARCHAR(120) NOT NULL,
    descricao                 VARCHAR(255),
    ingredientes              TEXT,
    fk_categoria_id_categoria INT NOT NULL,
    fk_marca_id_marca         INT NOT NULL,
    FOREIGN KEY (fk_categoria_id_categoria) REFERENCES categoria (id_categoria) ON DELETE CASCADE,
    FOREIGN KEY (fk_marca_id_marca)         REFERENCES marca (id_marca)         ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- embalagem: o tamanho vendido (o mesmo produto em 350 g e em 1 kg)
-- O preço fica aqui, porque cada tamanho tem o seu preço.
-- ---------------------------------------------------------------------
CREATE TABLE embalagem (
    id_embalagem          INT AUTO_INCREMENT PRIMARY KEY,
    quantidade            DECIMAL(10,2) NOT NULL,   -- ex.: 500
    unidade_medida        VARCHAR(10)   NOT NULL,   -- ex.: g, kg, ml, L, un
    preco                 INT           NOT NULL,   -- em centavos: 949 = R$ 9,49
    fk_produto_id_produto INT NOT NULL,
    FOREIGN KEY (fk_produto_id_produto) REFERENCES produto (id_produto) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- codigodebarras: cada embalagem tem 1 ou mais códigos (EAN-13)
-- RESTRICT: não deixa apagar uma embalagem que ainda tem código.
-- ---------------------------------------------------------------------
CREATE TABLE codigodebarras (
    id_codigo                 INT AUTO_INCREMENT PRIMARY KEY,
    codigo                    VARCHAR(20) NOT NULL UNIQUE,
    fk_embalagem_id_embalagem INT NOT NULL,
    FOREIGN KEY (fk_embalagem_id_embalagem) REFERENCES embalagem (id_embalagem) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------
-- informacao_nutricional: tabela nutricional de uma embalagem
-- Valores por porção (a porção fica escrita em porcao_descricao).
-- ---------------------------------------------------------------------
CREATE TABLE informacao_nutricional (
    id_nutricional            INT AUTO_INCREMENT PRIMARY KEY,
    porcao_descricao          VARCHAR(60),       -- ex.: "20 gramas"
    valor_energetico          DECIMAL(7,2),      -- kcal
    carboidratos              DECIMAL(7,2),      -- g
    acucares                  DECIMAL(7,2),      -- g
    proteinas                 DECIMAL(7,2),      -- g
    gorduras_totais           DECIMAL(7,2),      -- g
    gorduras_saturadas        DECIMAL(7,2),      -- g
    gorduras_trans            DECIMAL(7,2),      -- g
    fibra_alimentar           DECIMAL(7,2),      -- g
    sodio                     DECIMAL(7,2),      -- mg
    gluten                    BOOLEAN,           -- TRUE = contém glúten
    fk_embalagem_id_embalagem INT NOT NULL UNIQUE,
    FOREIGN KEY (fk_embalagem_id_embalagem) REFERENCES embalagem (id_embalagem) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- vw_produtos: junta todas as tabelas numa "tabela virtual".
-- O Python só faz SELECT nela, sem precisar repetir os JOINs toda vez.
-- LEFT JOIN na nutricional: produto de limpeza não tem tabela nutricional.
-- ---------------------------------------------------------------------
CREATE VIEW vw_produtos AS
SELECT
    cb.codigo,
    p.nome,
    m.nome_marca     AS marca,
    e.quantidade,
    e.unidade_medida AS unidade,
    e.preco,
    c.nome_categoria AS categoria,
    c.alimento,
    co.numero        AS corredor,
    co.secao,
    p.ingredientes,
    n.porcao_descricao,
    n.valor_energetico,
    n.carboidratos,
    n.acucares,
    n.proteinas,
    n.gorduras_totais,
    n.sodio,
    n.gluten
FROM codigodebarras cb
JOIN embalagem e  ON e.id_embalagem = cb.fk_embalagem_id_embalagem
JOIN produto p    ON p.id_produto   = e.fk_produto_id_produto
JOIN marca m      ON m.id_marca     = p.fk_marca_id_marca
JOIN categoria c  ON c.id_categoria = p.fk_categoria_id_categoria
JOIN corredor co  ON co.numero      = c.fk_corredor_numero
LEFT JOIN informacao_nutricional n ON n.fk_embalagem_id_embalagem = e.id_embalagem;


-- =====================================================================
-- PRODUTOS
-- Os 4 primeiros são de exemplo (códigos inventados).
-- O Açúcar Refinado é o primeiro produto real (código do pacote).
-- Regra: o nome do produto vai SEM a marca (o app já fala a marca depois).
-- =====================================================================

-- Os 4 corredores da banca (iguais às plaquinhas)
INSERT INTO corredor (numero, secao) VALUES
    (1, 'Bebidas'), (2, 'Matinais'), (3, 'Mercearia'), (4, 'Limpeza');

-- alimento = FALSE: o app fala o aviso de segurança no lugar da tabela nutricional
INSERT INTO categoria (nome_categoria, alimento, fk_corredor_numero) VALUES
    ('Água', TRUE, 1), ('Achocolatado', TRUE, 2), ('Detergente', FALSE, 4),
    ('Açúcar', TRUE, 3);

INSERT INTO marca (nome_marca) VALUES ('Crystal'), ('Nestlé'), ('PepsiCo'), ('Ypê'), ('Da Barra');

-- Os números no fim são os ids da categoria e da marca, na ordem em que foram criados acima
INSERT INTO produto (nome, ingredientes, fk_categoria_id_categoria, fk_marca_id_marca) VALUES
    ('Água Mineral sem Gás Crystal',  'Água mineral natural.', 1, 1),
    ('Achocolatado em Pó Nescau',     'Açúcar, cacau em pó, maltodextrina, vitaminas e minerais. Pode conter leite.', 2, 2),
    ('Achocolatado em Pó Toddy',      'Açúcar, cacau em pó, vitaminas e minerais. Pode conter leite.', 2, 3),
    ('Detergente Líquido Ypê Neutro', 'Tensoativo aniônico, conservante, corante e água.', 3, 4),
    ('Açúcar Refinado',               'Açúcar refinado.', 4, 5);

-- Preço em centavos (949 = R$ 9,49). Nescau 350 g x Toddy 400 g: o Toddy sai mais em conta no quilo!
INSERT INTO embalagem (quantidade, unidade_medida, preco, fk_produto_id_produto) VALUES
    (500, 'ml', 249, 1),
    (350, 'g',  949, 2),
    (400, 'g',  999, 3),
    (500, 'ml', 279, 4),
    (1000, 'g', 379, 5);

INSERT INTO codigodebarras (codigo, fk_embalagem_id_embalagem) VALUES
    ('7890000000073', 1),
    ('7890000000035', 2),
    ('7890000000042', 3),
    ('7890000000097', 4),
    ('7896032501010', 5);

INSERT INTO informacao_nutricional
    (porcao_descricao, valor_energetico, carboidratos, acucares, proteinas,
     gorduras_totais, gorduras_saturadas, gorduras_trans, fibra_alimentar,
     sodio, gluten, fk_embalagem_id_embalagem)
VALUES
    ('20 gramas', 76, 17, 14, 0.8, 0.6, 0.3, 0, 1.2, 15, FALSE, 2),
    ('20 gramas', 75, 17, 15, 0.7, 0.5, 0.3, 0, 1.0, 20, FALSE, 3),
    ('5 gramas',  20,  5,  5, 0,   0,   0,   0, 0,    0, FALSE, 5);