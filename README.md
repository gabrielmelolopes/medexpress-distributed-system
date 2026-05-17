# 📦 Sistema de Logística e Gerenciamento de Estoque

Esta é uma API REST desenvolvida em **Java** com o ecossistema **Spring Boot** para o controle e gerenciamento dinâmico de estoque de produtos. O sistema adota uma arquitetura estruturada em camadas (Controller, Service e Repository) e realiza a persistência física dos dados em um banco **PostgreSQL** utilizando JDBC puro para controle fino de consultas e transações.

---

## 🚀 Funcionalidades e Regras de Negócio

O motor de regras do sistema foi blindado para garantir a integridade do estoque através das seguintes lógicas:
- **Cadastro de Produtos (CRUD completo):** Permite salvar, listar, atualizar e remover produtos com persistência em banco de dados.
- **Validação de ID Único:** Impede a duplicação de identificadores em novos cadastros.
- **Teto de Valor de Segurança:** Produtos com preço acima de R$ 5.000,00 barram no sistema e exigem aprovação da diretoria.
- **Tratamento de Valores Negativos:** O sistema impede atualizações ou cadastros com preços ou quantidades menores que zero através de exceções customizadas (`NegocioException`).
- **Lógica de Fluxo de Caixa (Vendas):** Abstrai a quantidade vendida do estoque atual e registra a movimentação em uma tabela de histórico de vendas usando transações ACID (`autoCommit(false)` com controle de `commit` e `rollback`).

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Função |
| :--- | :--- |
| **Java 17** | Linguagem de programação principal |
| **Spring Boot** | Framework para estruturação da API e rotas HTTP |
| **PostgreSQL** | Banco de dados relacional para persistência de dados |
| **JDBC (PreparedStatement)** | Manipulação direta de SQL estruturado |
| **Postman** | Ferramenta de teste de endpoints e requisições HTTP |

---

## 🔌 Endpoints da API

A API aceita requisições no formato **JSON** e gerencia o estoque através das rotas mapeadas abaixo:

| Método | Endpoint | Descrição | Status Esperado |
| :--- | :--- | :--- | :--- |
| **GET** | `/produtos` | Lista todos os produtos ordenados por ID | `200 OK` |
| **POST** | `/produtos` | Cadastra um novo produto no estoque | `200 OK` |
| **PUT** | `/produtos/{id}` | Atualiza os dados de um produto existente | `200 OK` |
| **DELETE** | `/produtos/{id}` | Remove um produto do estoque pelo ID | `244 No Content` |
| **POST** | `/produtos/{id}/vender` | Registra a venda de um produto alterando o estoque | `200 OK` |

### Exemplo de JSON para Cadastro/Atualização (`POST` e `PUT`):
```json
{
  "nome": "Teclado Mecânico RGB Bluetooth",
  "preco": 289.90,
  "quantidade": 25
}
