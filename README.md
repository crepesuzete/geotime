# GEOTIME Tactical - Geo-Intelligence Platform

**Versão:** 1.0.0 (Elite Release)  
**Classificação:** FERRAMENTA TÁTICA / C2 (Comando e Controle)

## 🦅 Sobre o Projeto

O **GEOTIME Tactical** é uma plataforma web de inteligência geoespacial (GEOINT) desenvolvida para planejamento de missões, análise investigativa e segurança de dignitários. Diferente de mapas comuns, o GEOTIME integra uma **Linha do Tempo (Timeline)**, permitindo reconstruir cenários passo a passo, e utiliza **Inteligência Artificial Generativa** para auxiliar na tomada de decisão.

## 🚀 Funcionalidades Principais

### 1. Mapeamento Tático & C2
- **Ícones Táticos:** Biblioteca completa (Polícia, Exército, Hostis, Drones, etc.).
- **Desenho Livre:** Criação de zonas de risco (polígonos), rotas e perímetros.
- **Camadas:** Alternância rápida entre Satélite (Híbrido), Street e Dark Mode.

### 2. Inteligência Artificial (Gemini AI)
- **Comando de Voz/Texto:** "Crie um bloqueio na Av. Atlântica com 3 viaturas". A IA desenha o cenário.
- **Relatórios SITREP:** Geração automática de relatórios de situação baseados nos itens do mapa.
- **Geocoding Inteligente:** Busca de locais complexos (ex: "esquina da rua X com Y").

### 3. Ferramentas de Precisão
- **Cones de Visão (FOV):** Simulação de campo de visão de câmeras e snipers.
- **Vetor de Disparo:** Linhas de visada para análise de balística/trajetória.
- **Régua Tática:** Medição de distâncias em tempo real.

### 4. Gestão de Segurança (PPI)
- **Matriz de Risco:** Checklist doutrinário para proteção VIP.
- **Automação de Protocolos:** Presets para Chefe de Estado, Celebridades, etc.
- **Contra-Sniper:** Mapeamento de pontos elevados e negação de terreno.

### 5. Investigação & Organograma
- **Cadeia de Comando:** Criação visual de hierarquias.
- **Análise de Vínculos:** Diagramas de "Padrão de Vida" do alvo.
- **Dossiê Digital:** Upload de fotos/evidências dentro dos marcadores do mapa.

### 6. Apresentação
- **Modo TV:** Interface limpa para transmissão em telões.
- **Gravação Nativa:** Botão REC integrado para exportar vídeos da operação.
- **Timeline:** Playback da operação (Passado, Presente, Futuro).

## 🛠 Tech Stack

- **Frontend:** React 18, TypeScript, Vite.
- **Map Engine:** Leaflet, React-Leaflet.
- **AI Core:** Google Gemini API (`@google/genai`).
- **Styling:** Tailwind CSS.
- **Icons:** Lucide React.

## ⚙️ Instalação Rápida

1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure a chave de API (Google AI Studio) no arquivo `.env`.
4. Inicie o servidor tático:
   ```bash
   npm run dev
   ```

## 📄 Licença

Propriedade Intelectual Reservada.Robson Freire Tavares2025 - Uso restrito para demonstração e operações autorizadas.