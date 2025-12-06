import { GoogleGenAI, Type } from "@google/genai";
import { MapItem, Scene } from "../types";
import { v4 as uuidv4 } from 'uuid';

const getClient = () => {
  let apiKey = null;

  // 1. Tenta obter do ambiente Vite (Padrão para Localhost/Browser)
  // O arquivo .env deve ter: VITE_API_KEY=sua_chave
  try {
      // @ts-ignore
      apiKey = import.meta.env.VITE_API_KEY;
  } catch (e) {
      // Ignora erro se import.meta não existir
  }

  // 2. Fallback para process.env (Node.js/Server side ou configurações antigas)
  if (!apiKey) {
      try {
          apiKey = process.env.API_KEY;
      } catch (e) {
          // Ignora erro se process não existir
      }
  }
  
  if (!apiKey) {
      console.error("CRITICAL: API Key is missing. Check your .env file. It must contain 'VITE_API_KEY=xyz'");
      return null;
  }
  return new GoogleGenAI({ apiKey });
};

// Helper para limpar JSON vindo da IA (Markdown stripping)
const cleanJSON = (text: string) => {
    if (!text) return "";
    let clean = text.trim();
    // Remove markdown code blocks ```json ... ```
    if (clean.startsWith('```json')) {
        clean = clean.replace(/^```json/, '').replace(/```$/, '');
    } else if (clean.startsWith('```')) {
        clean = clean.replace(/^```/, '').replace(/```$/, '');
    }
    return clean.trim();
};

export const generateTacticalReport = async (items: MapItem[], scenes: Scene[]) => {
  const client = getClient();
  if (!client) throw new Error("API Key não configurada. Verifique o arquivo .env (VITE_API_KEY).");

  const visibleItems = items.filter(i => i.visible).map(i => ({
    name: i.name,
    type: i.type,
    subType: i.subType,
    position: i.position,
    description: i.description
  }));

  const prompt = `
    Atue como um Especialista em Inteligência Geoespacial e Tática (GEOINT).
    Analise os seguintes dados do teatro de operações e gere um Relatório de Situação (SITREP) conciso em Português do Brasil.
    
    ATIVOS NO MAPA:
    ${JSON.stringify(visibleItems, null, 2)}

    CENAS NARRATIVAS REGISTRADAS:
    ${JSON.stringify(scenes.map(s => ({ title: s.title, desc: s.description })), null, 2)}

    O relatório deve conter:
    1. Resumo da Situação Atual.
    2. Identificação de Ameaças Potenciais.
    3. Recomendações Táticas.
    
    Mantenha o tom profissional e militar/policial.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Falha ao gerar relatório de inteligência. Verifique conexão/chave.");
  }
};

export const findPointsOfInterest = async (query: string, center: {lat: number, lng: number}) => {
    const client = getClient();
    if (!client) throw new Error("API Key não configurada");

    const prompt = `
      O usuário está procurando por "${query}" perto da coordenada Lat: ${center.lat}, Lng: ${center.lng}.
      Gere 3 coordenadas fictícias mas realistas próximas a este local que poderiam corresponder a essa busca 
      para fins de demonstração de um sistema tático.
      Retorne APENAS um JSON array: [{ "name": "...", "lat": ..., "lng": ..., "description": "..." }]
    `;

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });
        return JSON.parse(cleanJSON(response.text));
    } catch (error) {
        console.error("POI Search Error", error);
        return [];
    }
}

// NOVA FUNÇÃO: Geração de Cenário Tático (Plotagem Automática com Contexto Geográfico)
export const generateTacticalScenario = async (command: string, currentCenter: {lat: number, lng: number}) => {
  const client = getClient();
  if (!client) {
      console.error("Client creation failed: No API Key");
      return { error: "API_KEY_MISSING" };
  }

  const allowedIcons = [
    'police', 'army', 'navy', 'aircraft', 'helicopter', 'submarine', 'protest', 
    'station', 'fire', 'vehicle', 'drone', 'team', 'journalist', 'media', 'target', 'poi',
    'tanker', 'base_attack', 'antiair'
  ];

  const prompt = `
    Você é um Motor de Geração de Cenários Táticos Militares.
    
    DADOS DE ENTRADA:
    - Centro Atual do Mapa (MIRA TÁTICA): Lat ${currentCenter.lat}, Lng ${currentCenter.lng}
    - Ordem de Comando: "${command}"

    PROCEDIMENTO OBRIGATÓRIO (Passo a Passo):
    
    PASSO 1: IDENTIFICAR LOCALIZAÇÃO
    Analise se a ordem menciona EXPLICITAMENTE um local geográfico diferente do centro atual (ex: "no Caribe", "em Londres", "em Copacabana").
    - Se o usuário mencionar uma cidade/país: Calcule as coordenadas (lat, lng) desse novo local para ser o "targetLocation".
    - Se o usuário NÃO mencionar uma cidade (ex: "crie aqui", "nesta posição", "ao norte", "bloqueio na avenida"): USE RIGOROSAMENTE AS COORDENADAS DO CENTRO ATUAL fornecidas acima como "targetLocation". NÃO mude para outro lugar por conta própria.

    PASSO 2: GERAR ATIVOS (ITEMS)
    Gere a lista de ativos militares/policiais solicitados.
    
    *** REGRA CRÍTICA DE COORDENADAS ***
    As coordenadas (lat/lng) de CADA item dentro do array 'items' DEVEM ser calculadas em relação ao 'targetLocation' definido no Passo 1.
    Espalhe os itens ao redor do targetLocation de forma realista.

    DICAS DE ESPALHAMENTO (OFFSET):
    - Para Navios/Submarinos (Mar): Use um offset maior (ex: +/- 0.05 a 0.5 graus do targetLocation).
    - Para Urbano: Use um offset menor (ex: +/- 0.002 a 0.01 graus do targetLocation).

    TIPOS DE ÍCONES PERMITIDOS (subType): 
    ${allowedIcons.join(', ')}

    Retorne o JSON estritamente conforme o schema.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targetLocation: {
                type: Type.OBJECT,
                description: "O centro geográfico onde a ação ocorre. Se a ordem mudou o local, coloque as novas coordenadas aqui.",
                properties: {
                    lat: { type: Type.NUMBER },
                    lng: { type: Type.NUMBER }
                },
                required: ["lat", "lng"]
            },
            items: {
              type: Type.ARRAY,
              description: "Lista de marcadores táticos posicionados AO REDOR do targetLocation.",
              items: {
                type: Type.OBJECT,
                properties: {
                  subType: { type: Type.STRING },
                  lat: { type: Type.NUMBER },
                  lng: { type: Type.NUMBER },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  color: { type: Type.STRING }
                },
                required: ["subType", "lat", "lng", "name"]
              }
            }
          },
          required: ["targetLocation", "items"]
        }
      }
    });

    let text = response.text;
    if (!text) return { targetLocation: currentCenter, items: [] };

    // Sanitize JSON
    const cleanText = cleanJSON(text);
    const data = JSON.parse(cleanText);
    return data; 

  } catch (error) {
    console.error("Tactical Gen Error:", error);
    return { targetLocation: currentCenter, items: [], error: "AI_GENERATION_FAILED" };
  }
};

// Geocoding Inteligente via IA
export const getCoordinatesFromAI = async (location: string) => {
  const client = getClient();
  if (!client) throw new Error("API Key não configurada");

  const prompt = `
    Atue como um sistema de geocodificação de alta precisão.
    Identifique as coordenadas geográficas (latitude e longitude) exatas para o seguinte endereço ou ponto de referência: 
    "${location}"
    
    Se for uma interseção (ex: "esquina de X com Y"), retorne o ponto de cruzamento.
    Retorne APENAS um objeto JSON no formato: { "lat": number, "lng": number }.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER }
            },
            required: ["lat", "lng"]
        }
      }
    });
    
    return JSON.parse(cleanJSON(response.text));
  } catch (error) {
    console.error("AI Geocoding Error:", error);
    return null;
  }
};