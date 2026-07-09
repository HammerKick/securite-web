import { useState, useEffect } from "react";
import "./App.css";
import { instance } from "./api/axios";
import { useAuth } from "./context/AuthContext";
import AuthForm from "./components/AuthForm";
import EditProfile from "./components/EditProfile";

interface Product {
  id?: number;
  name: string;
  price: number;
}

interface Order {
  id?: number;
  date: string;
  user_id: number;
  product_id: number;
}

function App() {
  const { token, roles, userId, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", price: 0 });

  const isAdmin = roles.includes("ROLE_ADMIN");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      instance.get<{ products: Product[] }>("/api/products/getAllProducts"),
      instance.get<Order[]>("/order"),
    ])
      .then(([productsRes, ordersRes]) => {
        setProducts(productsRes.data.products);
        setOrders(ordersRes.data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newProduct = {
      name: form.name,
      price: form.price,
      is_available: true,
    };
    addProduct(newProduct);
  }

  function addProduct(product: Product & { is_available: boolean }) {
    instance
      .post("/api/products/addProduct", product)
      .then((response) => {
        setProducts([...products, response.data.product]);
      })
      .catch((err) => {
        console.log(err.response?.data);
        setError(err.message);
      });
  }

  function deleteProduct(id?: number) {
    if (!id) return;

    instance
      .delete(`/api/products/deleteProduct/${id}`)
      .then(() => {
        setProducts(products.filter((p) => p.id !== id));
        setOrders(orders.filter((o) => o.product_id !== id));
      })
      .catch((err) => {
        setError(err.response?.data?.error ?? "Erreur lors de la suppression");
      });
  }

  function createOrder(productId?: number) {
    if (!productId) return;

    const newOrder = {
      date: new Date().toISOString(),
      user_id: userId,
      product_id: productId,
    };

    instance
      .post("/order", newOrder)
      .then((response) => {
        setOrders([...orders, { ...newOrder, id: response.data.id }]);
      })
      .catch((err) => {
        console.log(err.response?.data);
        setError(err.message);
      });
  }

  function deleteOrder(id?: number) {
    if (!id) return;

    instance
      .delete(`/order/${id}`)
      .then(() => {
        setOrders(orders.filter((o) => o.id !== id));
      })
      .catch((err) => {
        setError(err.response?.data?.error ?? "Erreur lors de la suppression");
      });
  }

  const visibleOrders = isAdmin
    ? orders
    : orders.filter((o) => o.user_id === userId);

  function getProductName(productId: number) {
    return (
      products.find((p) => p.id === productId)?.name ?? `Produit #${productId}`
    );
  }

  if (!token) {
    return <AuthForm />;
  }

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur : {error}</p>;

  return (
    <>
      <button onClick={logout}>Déconnexion</button>

      <EditProfile />

      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Prix</th>
            <th>Actions</th>
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
                <td dangerouslySetInnerHTML={{ __html: product.name }} />
                <td>{product.price.toFixed(2)} €</td>
                <td>
                  <button onClick={() => createOrder(product.id)}>
                    Commander
                  </button>
                  {isAdmin && (
                    <span
                      className="hover:cursor-pointer"
                      onClick={() => deleteProduct(product.id)}
                    >
                      {" "}
                      X
                    </span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h2 className="text-2xl font-bold mt-4">
        {isAdmin ? "Toutes les commandes" : "Mes commandes"}
      </h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Produit</th>
            {isAdmin && <th>Utilisateur</th>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visibleOrders.length === 0 ? (
            <tr>
              <td colSpan={isAdmin ? 4 : 3}>Aucune commande</td>
            </tr>
          ) : (
            visibleOrders.map((order) => (
              <tr key={order.id}>
                <td>{new Date(order.date).toLocaleString()}</td>
                <td>{getProductName(order.product_id)}</td>
                {isAdmin && <td>{order.user_id}</td>}
                <td
                  className="hover:cursor-pointer"
                  onClick={() => deleteOrder(order.id)}
                >
                  X
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {isAdmin && (
        <>
          <h2 className="text-2xl font-bold mt-4">Ajouter un produit</h2>
          <form name="addProductForm" onSubmit={handleSubmit}>
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
            <button type="submit">Ajouter</button>
          </form>
        </>
      )}
    </>
  );
}

export default App;
