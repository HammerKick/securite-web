import { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

interface Product {
  id?: number;
  name: string;
  price: number;
  is_available: boolean;
}

const instance = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
});

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", price: 0, available: false });

  useEffect(() => {
    instance
      .get<{ products: Product[] }>("/api/products/getAllProducts")
      .then((response) => {
        setProducts(response.data.products);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function handleSubmit() {
    const newProduct: Product = {
      name: form.name,
      price: form.price,
      is_available: form.available,
    };
    addProduct(newProduct);
  }

  function addProduct(product: Product) {
    console.log("Envoi :", JSON.stringify(product));
    instance
      .post("/api/products/addProduct", product)
      .then((response) => {
        setProducts([...products, response.data.product]);
      })
      .catch((err) => {
        console.log(err.response.data);
        setError(err.message);
      });
  }

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur : {error}</p>;

  console.log(products);

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Prix</th>
            <th>Disponibilité</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={3}>Aucun produit</td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.price.toFixed(2)} €</td>
                <td>{product.available ? "En stock" : "Hors stock"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <h2 className="text-2xl font-bold mt-4">Ajouter un produit</h2>
      <form name="addProductForm" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor="name">Nom :</label>
          <input
            type="text"
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="price">Prix :</label>
          <input
            type="number"
            id="price"
            step="0.01"
            value={form.price}
            onChange={(e) =>
              setForm({ ...form, price: parseFloat(e.target.value) || 0 })
            }
          />
        </div>
        <div>
          <label htmlFor="available">Disponible :</label>
          <input
            type="checkbox"
            id="available"
            checked={form.available}
            onChange={(e) => setForm({ ...form, available: e.target.checked })}
          />
        </div>
        <button type="submit" onClick={handleSubmit}>
          Ajouter
        </button>
      </form>
    </>
  );
}

export default App;
