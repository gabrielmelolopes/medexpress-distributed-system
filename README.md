# 💊 MedExpress

Sistema de farmácia online com rastreamento de pedidos em tempo real, desenvolvido com foco em arquitetura distribuída e processamento assíncrono.

---

## 📌 Sobre o projeto

O **MedExpress** é uma plataforma de e-commerce farmacêutico onde usuários podem navegar livremente pelos produtos sem a necessidade de login.

A autenticação é opcional e exigida apenas para ações sensíveis, como:

- Finalização de compras  
- Acompanhamento de pedidos  
- Operações relacionadas ao usuário  

Essa abordagem melhora a experiência do usuário, permitindo acesso rápido ao catálogo sem barreiras iniciais.

---

## 🚀 Funcionalidades

- Navegação de produtos sem login  
- Cadastro e autenticação de usuários  
- Criação de pedidos  
- Rastreamento de pedidos em tempo real  

### 📦 Status dos pedidos:
- PROCESSANDO  
- ENVIADO  
- ENTREGUE  

---

## 🧠 Arquitetura do Sistema

O sistema foi projetado com base em duas abordagens principais:

---

### 🔷 Arquitetura Hexagonal (Ports and Adapters)

A aplicação é organizada de forma que o núcleo (regras de negócio) seja independente de tecnologias externas.

- O **core** contém as entidades e regras (Pedido, Produto, Usuário)  
- As interações externas são feitas por meio de **ports (interfaces)**  
- As implementações são feitas por **adapters (API, banco, mensageria)**  

#### ✔ Benefícios:
- Baixo acoplamento  
- Facilidade de manutenção  
- Flexibilidade tecnológica  

---

### 🔶 Arquitetura Event-Driven

O sistema utiliza processamento orientado a eventos, permitindo que os pedidos sejam tratados de forma assíncrona.

#### 🔄 Fluxo:

Cliente realiza pedido  
→ Evento de pedido é publicado  
→ Enviado para fila  
→ Worker consome  
→ Processa pedido  
→ Novo evento de status  
→ Atualização no frontend  

#### ✔ Benefícios:
- Desacoplamento entre componentes  
- Escalabilidade  
- Processamento não bloqueante  

---

## 🏗️ Componentes do Sistema

- **Frontend** → Interface do usuário  
- **Backend API** → Regras de negócio  
- **Broker (ActiveMQ)** → Fila de mensagens  
- **Worker** → Processamento assíncrono  
- **WebSocket** → Atualização em tempo real  

---

## 🛠️ Tecnologias

- Java  
- Spring Boot  
- React  
- ActiveMQ  
- WebSocket  
- Docker  
- Git  

---

## 🎨 Protótipo (Figma)

O design da interface foi desenvolvido no Figma, incluindo as principais telas do sistema:

- Página inicial (catálogo de produtos)  
- Tela de login/cadastro  
- Fluxo de navegação entre telas  

👉 [Acessar protótipo](https://www.figma.com/design/Sw00utxXg0m4Z7AtF6t92L/Sem-t%C3%ADtulo?node-id=0-1&t=vNxjRv2xfY5YZcAq-1)

## 📦 Estrutura do projeto
│
├── frontend/
├── backend/
├── worker/
├── docker/
├── README.md
├── .gitignore
