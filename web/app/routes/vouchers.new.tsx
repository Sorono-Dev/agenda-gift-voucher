import { Form, useNavigation, Link } from "@remix-run/react";
import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect, data } from "@remix-run/node";
import { useState } from "react";

// Resolve API base URL – fallback to localhost:3001 in dev
const API_BASE = process.env.SERVER_BASE_URL ?? "http://localhost:3001";

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const type = form.get("type") as "AMOUNT" | "SESSION" | "PERCENT";
  const value = Number(form.get("value"));
  const expiresAt = form.get("expiresAt") as string || null;

  // Définir un type plus précis pour le payload
  const payload: {
    type: string;
    initialValue?: number;
    initialSessions?: number;
    percent?: number;
    expiresAt?: string;
  } = { type };

  // Selon le type, on définit des propriétés différentes
  switch (type) {
    case "AMOUNT":
      payload.initialValue = value;
      break;
    case "SESSION":
      payload.initialSessions = value;
      break;
    case "PERCENT":
      payload.percent = value;
      break;
  }

  if (expiresAt) {
    payload.expiresAt = new Date(expiresAt).toISOString();
  }

  try {
    const res = await fetch(`${API_BASE}/vouchers`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "content-type": "application/json" },
    });

    if (!res.ok) {
      const errorData = await res.json();
      return data(errorData, { status: res.status });
    }

    const v = await res.json();
    return redirect(`/vouchers/${v.code}`);
  } catch (error) {
    console.error("Erreur lors de la création du bon cadeau:", error);
    return data({ error: "Erreur lors de la création du bon cadeau" }, { status: 500 });
  }
}

export default function NewVoucher() {
  const nav = useNavigation();
  const [voucherType, setVoucherType] = useState<string>("AMOUNT");
  
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVoucherType(e.target.value);
  };

  const getInputPlaceholder = () => {
    switch(voucherType) {
      case "AMOUNT": return "Montant en CHF";
      case "SESSION": return "Nombre de séances";
      case "PERCENT": return "Pourcentage de réduction";
      default: return "Valeur";
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      {/* Navigation */}
      <header className="bg-secondary text-white shadow-md">
        <div className="container mx-auto flex justify-between items-center px-4 py-4">
          <Link to="/" className="text-2xl font-bold tracking-wide font-display">
            AGENDA<span className="text-primary">GIFT</span>
          </Link>
          <nav className="hidden md:flex gap-8 font-medium">
            <Link to="/" className="hover:text-primary transition">Accueil</Link>
            <Link to="/vouchers" className="hover:text-primary transition">Bons cadeaux</Link>
            <Link to="/vouchers/new" className="hover:text-primary transition">Créer un bon</Link>
            <Link to="/checkout" className="hover:text-primary transition">Panier</Link>
          </nav>
          <div className="flex md:hidden">
            <button className="btn btn-ghost text-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Page Title */}
      <div className="bg-base-200 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold font-display">Créer un bon cadeau</h1>
          <p className="text-gray-600">Choisissez le type de bon cadeau et sa valeur.</p>
        </div>
      </div>

      <main className="container mx-auto flex-1 px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Comment fonctionnent les bons cadeaux ?</h2>
              <p className="text-gray-600 mb-4">
                Vous pouvez créer trois types de bons cadeaux:
              </p>
              <ul className="space-y-2 text-gray-600 list-disc pl-5">
                <li><span className="font-medium">Bon à montant fixe</span> - Un montant en CHF que le client peut utiliser.</li>
                <li><span className="font-medium">Bon pour séances</span> - Un nombre de séances prédéfini.</li>
                <li><span className="font-medium">Bon de réduction</span> - Un pourcentage de réduction sur la prestation.</li>
              </ul>
            </div>
            
            <Form method="post" className="space-y-6">
              {/* Type de bon */}
              <div className="form-control">
                <label htmlFor="voucherType" className="label">
                  <span className="label-text font-medium text-base">Type de bon</span>
                </label>
                <select 
                  id="voucherType"
                  name="type" 
                  className="select select-bordered w-full"
                  onChange={handleTypeChange}
                  value={voucherType}
                >
                  <option value="AMOUNT">Montant fixe (CHF)</option>
                  <option value="SESSION">Séances</option>
                  <option value="PERCENT">Pourcentage (%)</option>
                </select>
              </div>
              
              {/* Valeur */}
              <div className="form-control">
                <label htmlFor="voucherValue" className="label">
                  <span className="label-text font-medium text-base">
                    {voucherType === "AMOUNT" ? "Montant (CHF)" : 
                     voucherType === "SESSION" ? "Nombre de séances" : 
                     "Pourcentage de réduction (%)"}
                  </span>
                </label>
                <input
                  id="voucherValue"
                  name="value"
                  type="number"
                  step={voucherType === "AMOUNT" ? "0.01" : "1"}
                  min={voucherType === "PERCENT" ? "1" : "0"}
                  max={voucherType === "PERCENT" ? "100" : undefined}
                  placeholder={getInputPlaceholder()}
                  className="input input-bordered w-full"
                  required
                />
                <label htmlFor="voucherValue" className="label">
                  <span className="label-text-alt text-gray-500">
                    {voucherType === "AMOUNT" 
                      ? "Exemple: 50.00 pour un bon de 50 CHF" 
                      : voucherType === "SESSION" 
                      ? "Exemple: 5 pour un bon de 5 séances" 
                      : "Exemple: 20 pour une réduction de 20%"}
                  </span>
                </label>
              </div>

              {/* Date d'expiration (optionnel) */}
              <div className="form-control">
                <label htmlFor="expiresAt" className="label">
                  <span className="label-text font-medium text-base">Date d&apos;expiration (optionnel)</span>
                </label>
                <input
                  id="expiresAt"
                  name="expiresAt"
                  type="date"
                  className="input input-bordered w-full"
                  min={new Date().toISOString().split('T')[0]}
                />
                <label htmlFor="expiresAt" className="label">
                  <span className="label-text-alt text-gray-500">Laissez vide pour une validité illimitée</span>
                </label>
              </div>
              
              {/* Bouton submit */}
              <div className="form-control mt-8">
                <button 
                  type="submit" 
                  className="btn btn-primary btn-block" 
                  disabled={nav.state === "submitting"}
                >
                  {nav.state === "submitting" ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Création...
                    </>
                  ) : (
                    "Créer le bon cadeau"
                  )}
                </button>
              </div>
            </Form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-secondary text-white py-12 mt-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 font-display">AGENDA<span className="text-primary">GIFT</span></h3>
              <p className="text-gray-300">
                Le système de bons cadeaux simple et efficace pour votre entreprise.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Liens utiles</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-300 hover:text-primary transition">Accueil</Link></li>
                <li><Link to="/vouchers" className="text-gray-300 hover:text-primary transition">Tous les bons</Link></li>
                <li><Link to="/vouchers/new" className="text-gray-300 hover:text-primary transition">Créer un bon</Link></li>
                <li><Link to="/checkout" className="text-gray-300 hover:text-primary transition">Panier</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <p className="text-gray-300 mb-2">
                Pour toute question concernant nos bons cadeaux, n&apos;hésitez pas à nous contacter.
              </p>
              <p className="text-gray-300">
                Email: info@agendagift.ch
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} AgendaGift – Système de bons cadeaux</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
