import { useState, useEffect } from "react";
import { instance } from "../api/axios";

interface Me {
  id: number;
  email: string;
  roles: string[];
}

export default function EditProfile() {
  const [me, setMe] = useState<Me | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    instance
      .get<Me>("/api/me")
      .then((res) => {
        setMe(res.data);
        setEmail(res.data.email);
      })
      .catch((err) => setError(err.response?.data?.message ?? err.message));
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!me) return;

    const payload: { email: string; password?: string } = { email };
    if (password.trim() !== "") {
      payload.password = password;
    }

    instance
      .patch(`/api/users/${me.id}`, payload)
      .then(() => {
        setSuccess("Profil mis à jour !");
        setPassword("");
      })
      .catch((err) => {
        setError(
          err.response?.data?.message ?? "Erreur lors de la mise à jour",
        );
      });
  }

  if (!me) return <p>Chargement du profil...</p>;

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold">Mon profil</h2>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-600">{success}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="profile-email">Email :</label>
          <input
            type="email"
            id="profile-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="profile-password">
            Nouveau mot de passe (laisser vide pour ne pas changer) :
          </label>
          <input
            type="password"
            id="profile-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">Mettre à jour</button>
      </form>
    </div>
  );
}
