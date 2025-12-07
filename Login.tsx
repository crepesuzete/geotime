import { useState } from "react";

// =============== CONFIGURAÇÃO DA SENHA (só tu sabe) ===============
// 1. Troca o hash abaixo pelo que tu gerou com a tua senha real
const HASH_CORRETO = "1oZxcSAYLMmRY2026H2oDI88xuqGt2HVcoxrio86?usp=sharing";

// Função de hash simples (igual a que tu usou no console)
function hashSimples(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) & 0xffffffff;
  }
  return h.toString(16) + "bolota";
}

const tentarEntrar = (input: string) => hashSimples(input) === HASH_CORRETO;

// =============== COMPONENTE LOGIN ===============
export default function Login() {
  const [pass, setPass] = useState("");
  const [erro, setErro] = useState("");

  const entrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (tentarEntrar(pass)) {
      document.cookie = "gt-access=liberado; path=/; max-age=604800; secure; samesite=strict";
      window.location.reload();
    } else {
      setErro("ACESSO NEGADO");
    }
  };

  return (
    <div style={{
      height: "100vh",
      background: "#000",
      color: "#0f0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "monospace",
      textAlign: "center"
    }}>
      <h1>GEOTIME TACTICAL</h1>
      <h2>Acesso Restrito - Elite</h2>
      <form onSubmit={entrar}>
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          placeholder="senha bolota"
          style={{ padding: 15, fontSize: 20, width: 340 }}
          autoFocus
        />
        <br /><br />
        <button type="submit" style={{ padding: "15px 50px", fontSize: 20 }}>
          ENTRAR
        </button>
      </form>
      {erro && <p style={{ color: "red", marginTop: 30, fontSize: 22 }}>{erro}</p>}
    </div>
  );
}