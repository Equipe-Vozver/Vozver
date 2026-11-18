-- =====================================================================
-- Banco de dados do vozver (MySQL 8)
-- Feito a partir do modelo lógico do grupo (Desktop/VOZVER/Lógico_vozver.brM3).
--
-- Como usar: abra este arquivo no MySQL Workbench e clique no raio (⚡)
-- para rodar tudo. Ele APAGA e cria de novo o banco "vozver",
-- então só rode de novo se quiser começar do zero.
-- =====================================================================

DROP DATABASE IF EXISTS vozver;
CREATE DATABASE vozver CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE vozver;

-- ---------------------------------------------------------------------
-- categoria: tipo do produto (Café, Laticínios, Biscoitos...)
-- ---------------------------------------------------------------------
CREATE TABLE categoria (
    id_categoria   INT AUTO_INCREMENT PRIMARY KEY,
    nome_categoria VARCHAR(60) NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------
-- marca: fabricante (Melitta, Nestlé...)
-- ---------------------------------------------------------------------
CREATE TABLE marca (
    id_marca   INT AUTO_INCREMENT PRIMARY KEY,
    nome_marca VARCHAR(60) NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------
-- produto: o produto "em geral" (ex.: Café Melitta Tradicional)
-- Se a categoria ou a marca for apagada, o produto vai junto (CASCADE),
-- como está no modelo.
-- ---------------------------------------------------------------------
CREATE TABLE produto (
    id_produto                INT AUTO_INCREMENT PRIMARY KEY,
    nome                      VARCHAR(120) NOT NULL,
    descricao                 VARCHAR(255),
    fk_categoria_id_categoria INT NOT NULL,
    fk_marca_id_marca         INT NOT NULL,
    FOREIGN KEY (fk_categoria_id_categoria) REFERENCES categoria (id_categoria) ON DELETE CASCADE,
    FOREIGN KEY (fk_marca_id_marca)         REFERENCES marca (id_marca)         ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- embalagem: o tamanho vendido (o mesmo café em 250 g e em 500 g)
-- ---------------------------------------------------------------------
CREATE TABLE embalagem (
    id_embalagem          INT AUTO_INCREMENT PRIMARY KEY,
    quantidade            DECIMAL(10,2) NOT NULL,   -- ex.: 500
    unidade_medida        VARCHAR(10)   NOT NULL,   -- ex.: g, kg, ml, L, un
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
    porcao_descricao          VARCHAR(60),       -- ex.: "50 g (1 xícara)"
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
-- dispositivo: o celular de quem usa o app, sem dados pessoais.
-- codigo_anonimo é um código aleatório criado pelo próprio app.
-- ---------------------------------------------------------------------
CREATE TABLE dispositivo (
    id_dispositivo INT AUTO_INCREMENT PRIMARY KEY,
    codigo_anonimo VARCHAR(64) NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------
-- historico_escaneamento: cada vez que alguém lê um código no app.
-- Se a embalagem for apagada, o histórico fica, só perde a ligação (SET NULL).
-- ---------------------------------------------------------------------
CREATE TABLE historico_escaneamento (
    id_historico_escaneamento     INT AUTO_INCREMENT PRIMARY KEY,
    texto_falado                  VARCHAR(500),
    escaneado_em                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fk_dispositivo_id_dispositivo INT NOT NULL,
    fk_embalagem_id_embalagem     INT NULL,
    FOREIGN KEY (fk_dispositivo_id_dispositivo) REFERENCES dispositivo (id_dispositivo) ON DELETE CASCADE,
    FOREIGN KEY (fk_embalagem_id_embalagem)     REFERENCES embalagem (id_embalagem)     ON DELETE SET NULL
);


-- =====================================================================
-- DADOS DE EXEMPLO (para testar). Os códigos de barras são inventados.
-- =====================================================================

INSERT INTO categoria (nome_categoria) VALUES ('Café'), ('Laticínios'), ('Biscoitos');

INSERT INTO marca (nome_marca) VALUES ('Melitta'), ('Nestlé'), ('Marilan');

-- Os números (1, 2, 3) são os ids criados acima, na mesma ordem.
INSERT INTO produto (nome, descricao, fk_categoria_id_categoria, fk_marca_id_marca) VALUES
    ('Café Melitta Tradicional', 'Café torrado e moído', 1, 1),
    ('Leite Condensado Moça',    'Leite condensado integral', 2, 2),
    ('Biscoito Cream Cracker',   'Biscoito salgado', 3, 3);

INSERT INTO embalagem (quantidade, unidade_medida, fk_produto_id_produto) VALUES
    (500, 'g', 1),   -- id 1: café 500 g
    (250, 'g', 1),   -- id 2: café 250 g
    (395, 'g', 2),   -- id 3: leite condensado
    (200, 'g', 3);   -- id 4: biscoito

INSERT INTO codigodebarras (codigo, fk_embalagem_id_embalagem) VALUES
    ('7890000000011', 1),
    ('7890000000028', 2),
    ('7890000000035', 3),
    ('7890000000042', 4);

INSERT INTO informacao_nutricional
    (porcao_descricao, valor_energetico, carboidratos, acucares, proteinas,
     gorduras_totais, gorduras_saturadas, gorduras_trans, fibra_alimentar,
     sodio, gluten, fk_embalagem_id_embalagem)
VALUES
    ('20 g (2 colheres de sopa)', 65, 13, 10, 1.5, 1.6, 1.0, 0, 0, 25, FALSE, 3),
    ('30 g (6 biscoitos)',       130, 20,  1, 3.0, 4.2, 1.5, 0, 1, 210, TRUE, 4);
