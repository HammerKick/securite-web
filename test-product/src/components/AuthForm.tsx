import { useState } from "react";
import { instance } from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function AuthForm() {
  const { login } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (mode === "login") {
      instance
        .post("/api/login", { email, password })
        .then((res) => {
          login(res.data.token);
        })
        .catch((err) => {
          setError(err.response?.data?.message ?? "Erreur de connexion");
        });
    } else {
      instance
        .post("/api/register", { email, password })
        .then(() => {
          setInfo("Compte créé, vous pouvez maintenant vous connecter.");
          setMode("login");
        })
        .catch((err) => {
          setError(
            err.response?.data?.message ?? "Erreur lors de l'inscription",
          );
        });
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">
        {mode === "login" ? "Connexion" : "Inscription"}
      </h2>

      {error && <p className="text-red-600">{error}</p>}
      {info && <p className="text-green-600">{info}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email :</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password">Mot de passe :</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">
          {mode === "login" ? "Se connecter" : "S'inscrire"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setError(null);
          setInfo(null);
        }}
      >
        {mode === "login" ? "Créer un compte" : "J'ai déjà un compte"}
      </button>
    </div>
  );
}
