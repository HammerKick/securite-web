import { useState, useEffect } from "react";
import { instance } from "../api/axios";

interface Me {
  id: number;
  email: string;
  roles: string[];
  phoneNumber?: string | null;
}

export default function EditProfile() {
  const [me, setMe] = useState<Me | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    instance
      .get<Me>("/api/me")
      .then((res) => {
        setMe(res.data);
        setEmail(res.data.email);
        setPhoneNumber(res.data.phoneNumber ?? "");
        // VULN (TP sécu) : commentaire stocké côté client, aucune sanitization
        const savedComment = localStorage.getItem(`comment_${res.data.id}`);
        if (savedComment) setComment(savedComment);
      })
      .catch((err) => setError(err.response?.data?.message ?? err.message));
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!me) return;

    const payload: {
      email: string;
      password?: string;
      phoneNumber?: string | null;
    } = {
      email,
      phoneNumber: phoneNumber.trim() === "" ? null : phoneNumber,
    };
    if (password.trim() !== "") {
      payload.password = password;
    }

    instance
      .patch(`/api/users/${me.id}`, payload)
      .then(() => {
        localStorage.setItem(`comment_${me.id}`, comment);
        setSuccess("Profil mis à jour");
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
          <label htmlFor="profile-phone">Numéro de téléphone :</label>
          <input
            type="tel"
            id="profile-phone"
            placeholder="0612345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
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
        <div>
          <label htmlFor="profile-comment">Commentaire :</label>
          <textarea
            id="profile-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <button type="submit">Mettre à jour</button>
      </form>

      <h3 className="text-xl font-bold mt-4">Aperçu du commentaire</h3>
      <div dangerouslySetInnerHTML={{ __html: comment }} />
    </div>
  );
}
