import { useEffect, useState } from "react";
import Login from "./Login";

// IMPORTA AQUI O TEU COMPONENTE ORIGINAL DO MAPA (muda o nome se for diferente)
import MapaOriginal from "./Mapa";   // ← troca "Mapa" pelo nome real do teu arquivo do mapa
// import Index from "./Index";      // ou esse
// import Main from "./Main";        // ou esse

// HASH DA TUA SENHA GIGANTE (não mexe nisso)
const HASH_CORRETO = "a1b2c3d4e5f67890bolota2026tatica2025X9Y8Z7";

function hashSimples(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffffff;
  return h.toString(16) + "bolota";
}

export default function App() {
  const [logado, setLogado] = useState(false);

  useEffect(() => {
    if (document.cookie.includes("gt-access=liberado")) {
      setLogado(true);
    }
  }, []);

  if (!logado) {
    return <Login onLogin={() => setLogado(true)} />;
  }

  return <MapaOriginal />;
}

// Função que o Login vai chamar quando acertar a senha
// (abre o Login.tsx e no final do entrar() adiciona isso):
// window.location.reload();  → já tá lá