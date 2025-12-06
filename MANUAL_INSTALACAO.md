# MANUAL DE OPERAÇÃO DE CAMPO: GEOTIME TACTICAL
**DOCUMENTO DE REFERÊNCIA RÁPIDA**

---

## 1. INTRODUÇÃO
Este manual descreve os procedimentos para instalação e execução do sistema **GEOTIME** em terminais locais (computadores Windows/Mac/Linux). O sistema opera via navegador, garantindo leveza e compatibilidade.

---

## 2. PRÉ-REQUISITOS (A MUNIÇÃO)

Antes de iniciar, certifique-se de que o computador possui o seguinte software base instalado:

### A. Node.js (Motor do Sistema)
O GEOTIME roda sobre a plataforma Node.js.
1. Acesse: [https://nodejs.org/](https://nodejs.org/)
2. Baixe a versão **LTS (Recommended)**.
3. Instale como um programa comum (Next, Next, Finish).

### B. Chave de Inteligência (API Key)
O "cérebro" do sistema é a IA do Google. Você precisa de uma chave (gratuita para testes).
1. Acesse: [https://aistudio.google.com/](https://aistudio.google.com/)
2. Clique em **"Get API Key"**.
3. Copie o código gerado (ele se parece com: `AIzaSyD...`). **Guarde isso.**

---

## 3. PROCEDIMENTO DE INSTALAÇÃO (DEPLOY)

Siga estes passos rigorosamente para colocar o sistema no ar.

**PASSO 1: Preparar o Terreno**
1. Descompacte a pasta do projeto `GEOTIME_Project` em um local seguro (ex: Área de Trabalho).
2. Abra a pasta.

**PASSO 2: Configurar o Ambiente**
1. Dentro da pasta, procure por um arquivo que você vai criar chamado `.env` (apenas `.env`, sem nome antes).
   * *Dica:* Se não conseguir criar, crie um arquivo de texto normal, cole o conteúdo abaixo e na hora de "Salvar Como", escolha "Todos os Arquivos" e nomeie como `.env`.
2. Abra este arquivo com o Bloco de Notas.
3. Cole o seguinte comando dentro dele:
   ```
   VITE_API_KEY=COLE_SUA_CHAVE_DO_GOOGLE_AQUI
   ```
4. Salve e feche.

**PASSO 3: Instalar Dependências**
1. Na pasta do projeto, clique com o botão direito em uma área vazia e selecione **"Abrir no Terminal"** (ou Prompt de Comando / PowerShell).
2. Digite o seguinte comando e aperte ENTER:
   ```bash
   npm install
   ```
   *(Aguarde o sistema baixar as bibliotecas. Uma barra de progresso aparecerá).*

**PASSO 4: Iniciar Operação**
1. No mesmo terminal, digite:
   ```bash
   npm run dev
   ```
2. O terminal mostrará uma mensagem verde: `➜  Local:   http://localhost:5173/`

**PASSO 5: Acesso**
1. Abra seu navegador (Chrome ou Edge recomendados).
2. Digite na barra de endereço: `http://localhost:5173`
3. **Pronto.** O GEOTIME está operacional.

---

## 4. SOLUÇÃO DE PROBLEMAS (TROUBLESHOOTING)

**ERRO: "Comando 'npm' não encontrado"**
*   **Causa:** O Node.js não foi instalado corretamente.
*   **Solução:** Reinstale o Node.js e reinicie o computador.

**ERRO: Mapa não carrega ou IA não responde**
*   **Causa:** Chave de API inválida ou arquivo `.env` mal configurado.
*   **Solução:** Verifique se o arquivo `.env` está na raiz da pasta e se a chave `VITE_API_KEY` está correta, sem espaços extras.

**ERRO: Gravação de Tela falha**
*   **Causa:** Permissões do navegador.
*   **Solução:** O navegador pedirá permissão na primeira vez. Clique em "Permitir". Se estiver usando em modo anônimo, algumas funções podem ser bloqueadas.

---

**FIM DO DOCUMENTO**
*Desenvolvido pela Divisão de Tecnologia Tática.*