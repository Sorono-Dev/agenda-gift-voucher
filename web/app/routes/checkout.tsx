import { Form, useLoaderData, useActionData, useSearchParams, Link } from "@remix-run/react";
import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect, data } from "@remix-run/node";
import { useState, useEffect } from "react";

// API base URL
const API_BASE = process.env.SERVER_BASE_URL ?? "http://localhost:3001";

// ──────────────────
// Types & fake data
// ──────────────────
export type Product = { id: string; name: string; price: number };

// Interface pour les vouchers retournés par l'API
interface ApiVoucher {
  id: string;
  code: string;
  type: "AMOUNT" | "SESSION" | "PERCENT";
  initialValue: number | null;
  remainingValue: number | null;
  initialSessions: number | null;
  remainingSessions: number | null;
  percent: number | null;
  isActive: boolean;
}

const products: Product[] = [
  { id: "service1", name: "Coupe cheveux", price: 45 },
  { id: "service2", name: "Coupe + barbe", price: 60 },
  { id: "service3", name: "Taille de barbe", price: 30 },
  { id: "service4", name: "Coiffure", price: 40 },
  { id: "service5", name: "Shampooing", price: 15 },
];

// ──────────────────
// Loader – Remix v3 singleFetch (retourne l'objet directement)
// ──────────────────
export async function loader() {
  return { products };
}

// ──────────────────
// Action – envoie la vente à l'API Fastify puis redirige
// ──────────────────
export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  
  // S'il n'y a pas d'items dans le panier, ne rien faire
  if (!form.has("items")) {
    return data({ error: "Panier vide" }, { status: 400 });
  }
  
  const items = JSON.parse(form.get("items") as string) as Product[];
  
  // S'il n'y a pas de produits dans le panier, ne rien faire
  if (items.length === 0) {
    return data({ error: "Votre panier est vide" }, { status: 400 });
  }
  
  const voucherCode = form.get("voucherCode") as string | null;
  const total = items.reduce((s, p) => s + p.price, 0);

  if (voucherCode) {
    // Vérifier si le bon existe et est actif avant de l'utiliser
    try {
      const voucherRes = await fetch(`${API_BASE}/vouchers/${voucherCode}`);
      if (!voucherRes.ok) {
        return data({ error: "Bon cadeau introuvable" }, { status: 400 });
      }
      
      const voucher = await voucherRes.json() as ApiVoucher;
      if (!voucher.isActive) {
        return data({ error: "Ce bon cadeau a déjà été utilisé" }, { status: 400 });
      }
  
      // Calculer le montant à déduire selon le type de bon
      let amountToRedeem = 0;
      let sessionsToRedeem = 0;
  
      if (voucher.type === "AMOUNT" && voucher.remainingValue) {
        // Pour un bon de montant, utiliser le minimum entre le montant du bon et le total
        amountToRedeem = Math.min(Number(voucher.remainingValue), total);
      } else if (voucher.type === "PERCENT" && voucher.percent) {
        // Pour un bon de pourcentage, calculer la réduction
        amountToRedeem = total * (Number(voucher.percent) / 100);
      } else if (voucher.type === "SESSION" && voucher.remainingSessions && voucher.remainingSessions > 0) {
        // Pour un bon de séance, consommer jusqu'à N séances si possible
        // où N est le min entre le nombre de séances disponibles et le nombre d'articles
        sessionsToRedeem = Math.min(items.length, Number(voucher.remainingSessions));
      }
  
      // Consommer le bon
      const redeemRes = await fetch(`${API_BASE}/vouchers/${voucherCode}/redeem`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: amountToRedeem,
          sessions: sessionsToRedeem,
        }),
      });
  
      if (!redeemRes.ok) {
        const errorData = await redeemRes.json();
        return data({ error: errorData.message || "Erreur lors de l'utilisation du bon" }, { status: 400 });
      }
    } catch (error) {
      console.error("Erreur voucher:", error);
      return data({ error: "Erreur lors de l'utilisation du bon" }, { status: 500 });
    }
  }

  const payments = voucherCode
    ? [{ method: "VOUCHER", code: voucherCode, amount: total }]
    : [{ method: "CASH", amount: total }];

  try {
    const saleRes = await fetch(`${API_BASE}/sales`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items, payments }),
    });
    
    if (!saleRes.ok) {
      return data({ error: "Erreur lors de l'enregistrement de la vente" }, { status: 500 });
    }
    
    // Uniquement après une transaction réussie, rediriger avec un message de succès
    return redirect("/?success=true");
    
  } catch (error) {
    console.error("Erreur vente:", error);
    return data({ error: "Erreur lors de l'enregistrement de la vente" }, { status: 500 });
  }
}

// ──────────────────
// UI
// ──────────────────
export default function Checkout() {
  const data = useLoaderData<typeof loader>();
  const { products } = data;
  const actionData = useActionData<{error?: string}>();
  const [searchParams] = useSearchParams();
  const [cart, setCart] = useState<Product[]>([]);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucher, setVoucher] = useState<ApiVoucher | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);
  const [discountedTotal, setDiscountedTotal] = useState<number | null>(null);
  const [discountInfo, setDiscountInfo] = useState<string | null>(null);

  // Ajouter au panier depuis l'URL (pour les liens depuis la page d'accueil)
  useEffect(() => {
    const serviceId = searchParams.get('service');
    if (serviceId) {
      const service = products.find(p => p.id === serviceId);
      if (service && !cart.some(item => item.id === serviceId)) {
        console.log("Ajout depuis URL:", service);
        setCart(prev => [...prev, service]);
      }
    }
  }, [searchParams, products, cart]);

  const add = (p: Product) => {
    // Vérifier si le produit est déjà dans le panier
    console.log("Fonction add appelée avec:", p);
    if (!cart.some(item => item.id === p.id)) {
      console.log("Ajout au panier:", p);
      setCart(prev => [...prev, p]);
    } else {
      console.log("Produit déjà dans le panier:", p);
    }
  };
  
  const remove = (i: number) => setCart(prev => prev.filter((_, idx) => idx !== i));
  const total = cart.reduce((s, p) => s + p.price, 0);

  // Afficher les erreurs retournées par l'action
  useEffect(() => {
    if (actionData?.error) {
      setVoucherError(actionData.error);
    }
  }, [actionData]);

  // Vérifier le bon cadeau quand le code change
  useEffect(() => {
    // Réinitialiser les états
    setVoucher(null);
    setVoucherError(null);
    setDiscountedTotal(null);
    setDiscountInfo(null);
    
    // Ne rien faire si le code est vide ou trop court
    if (!voucherCode || voucherCode.length < 3) return;
    
    const checkVoucher = async () => {
      setIsCheckingVoucher(true);
      try {
        const res = await fetch(`${API_BASE}/vouchers/${voucherCode}`);
        
        if (!res.ok) {
          setVoucherError("Bon cadeau introuvable");
          return;
        }
        
        const voucherData = await res.json() as ApiVoucher;
        
        if (!voucherData.isActive) {
          setVoucherError("Ce bon cadeau a déjà été utilisé");
          return;
        }
        
        setVoucher(voucherData);
        
        // Calculer le total après réduction selon le type de bon
        if (voucherData.type === "AMOUNT" && voucherData.remainingValue) {
          // Réduction de montant - plafonner à la valeur du panier
          const reductionAmount = Number(voucherData.remainingValue);
          const newTotal = Math.max(0, total - reductionAmount);
          setDiscountedTotal(newTotal);
          
          if (reductionAmount >= total) {
            // Le bon couvre tout le montant
            setDiscountInfo(`Bon de ${reductionAmount} CHF (couvre tout l'achat, ${reductionAmount - total} CHF restant sur le bon)`);
          } else {
            // Le bon couvre une partie du montant
            setDiscountInfo(`Bon de ${reductionAmount} CHF appliqué`);
          }
        } else if (voucherData.type === "PERCENT" && voucherData.percent) {
          // Réduction en pourcentage
          const percent = Number(voucherData.percent);
          const reduction = total * (percent / 100);
          const newTotal = Math.round((total - reduction) * 100) / 100;
          setDiscountedTotal(newTotal);
          setDiscountInfo(`Réduction de ${percent}% (${reduction.toFixed(2)} CHF)`);
        } else if (voucherData.type === "SESSION" && voucherData.remainingSessions) {
          if (cart.length > 0) {
            // Utiliser jusqu'à X séances, où X est le min entre le nombre d'articles et le nombre de séances
            const sessionsToUse = Math.min(cart.length, Number(voucherData.remainingSessions));
            
            // Trier les articles par prix croissant (du moins cher au plus cher)
            const sortedItems = [...cart].sort((a, b) => a.price - b.price);
            
            // Prendre les N premiers articles (les moins chers)
            const itemsToDiscount = sortedItems.slice(0, sessionsToUse);
            
            // Calculer la réduction totale
            const discountAmount = itemsToDiscount.reduce((sum, item) => sum + item.price, 0);
            const newTotal = total - discountAmount;
            
            setDiscountedTotal(newTotal);
            
            // Afficher un message approprié selon le nombre de séances utilisées
            if (sessionsToUse === 1) {
              setDiscountInfo(`Bon pour 1 séance: ${itemsToDiscount[0].name} (${itemsToDiscount[0].price} CHF) offert`);
            } else {
              const itemNames = itemsToDiscount.map(item => `${item.name} (${item.price} CHF)`).join(', ');
              setDiscountInfo(`Bon pour ${sessionsToUse} séances: ${itemNames} offerts, total déduit: ${discountAmount} CHF`);
            }
          } else {
            setDiscountInfo(`Bon pour ${voucherData.remainingSessions} séance(s) restante(s)`);
          }
        }
      } catch (error) {
        setVoucherError("Erreur lors de la vérification du bon");
      } finally {
        setIsCheckingVoucher(false);
      }
    };
    
    const debounceTimeout = setTimeout(checkVoucher, 500);
    return () => clearTimeout(debounceTimeout);
  }, [voucherCode, total, cart]);

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
          <h1 className="text-3xl font-bold font-display">Panier</h1>
          <p className="text-gray-700">Finalisez votre commande et utilisez un bon cadeau si vous en avez un.</p>
        </div>
      </div>

      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Produits disponibles */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b text-gray-700">Services disponibles</h2>
              <ul className="space-y-4">
                {products.map((p) => (
                  <li key={p.id} className="flex justify-between items-center border-b pb-3">
                    <div>
                      <h3 className="font-medium text-gray-800">{p.name}</h3>
                      <p className="text-primary font-semibold">{p.price} CHF</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => add(p)} 
                      className="btn btn-sm btn-primary"
                      disabled={cart.some(item => item.id === p.id)}
                    >
                      Ajouter
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Panier & Checkout */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b text-gray-700">Votre panier</h2>
              
              {cart.length === 0 ? (
                <div className="py-6 text-center text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-12 h-12 mx-auto mb-2 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                  </svg>
                  <p>Votre panier est vide</p>
                  <p className="text-sm">Ajoutez des services depuis la liste à gauche</p>
                </div>
              ) : (
                <>
                  <ul className="divide-y">
                    {cart.map((item, idx) => (
                      <li key={idx} className="py-3 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-gray-800">{item.name}</h3>
                          <p className="text-primary font-semibold">{item.price} CHF</p>
                        </div>
                        <button 
                          onClick={() => remove(idx)} 
                          className="btn btn-circle btn-sm btn-ghost text-error"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 pt-4 border-t">
                    <div className="flex justify-between items-center text-lg font-semibold mb-3">
                      <span className="text-gray-700">Total:</span>
                      <span className="text-gray-700">{total} CHF</span>
                    </div>
                    
                    {discountedTotal !== null && (
                      <div className="flex justify-between items-center text-lg font-semibold text-success mb-1">
                        <span>Après réduction:</span>
                        <span>{discountedTotal} CHF</span>
                      </div>
                    )}
                    
                    {discountInfo && (
                      <p className="text-sm text-gray-600 mb-4">{discountInfo}</p>
                    )}
                    
                    <Form
                      method="post"
                      onSubmit={(e) => {
                        const hidden = e.currentTarget.querySelector(
                          'input[name="items"]'
                        ) as HTMLInputElement;
                        hidden.value = JSON.stringify(cart);
                      }}
                      className="space-y-4"
                    >
                      <input type="hidden" name="items" />
                      
                      <div>
                        <label className="form-control w-full">
                          <div className="label">
                            <span className="label-text font-medium text-gray-700">Code bon cadeau</span>
                          </div>
                          <div className="relative">
                            <input
                              name="voucherCode"
                              value={voucherCode}
                              onChange={(e) => setVoucherCode(e.target.value)}
                              placeholder="Entrez votre code"
                              className={`input input-bordered w-full pr-20 ${
                                voucherError ? 'input-error' : voucher ? 'input-success' : ''
                              }`}
                            />
                            {isCheckingVoucher && (
                              <span className="loading loading-spinner loading-sm absolute right-3 top-3"></span>
                            )}
                          </div>
                          {voucherError && (
                            <div className="label">
                              <span className="label-text-alt text-error">{voucherError}</span>
                            </div>
                          )}
                          {voucher && !voucherError && (
                            <div className="label">
                              <span className="label-text-alt text-success">
                                Bon cadeau valide ({voucher.type === "AMOUNT" ? "Montant" : 
                                voucher.type === "SESSION" ? "Séance" : "Pourcentage"})
                              </span>
                            </div>
                          )}
                        </label>
                      </div>
                      
                      <button 
                        className="btn btn-primary btn-block" 
                        disabled={cart.length === 0 || (voucherCode.length > 0 && (voucherError !== null || isCheckingVoucher))}
                      >
                        {isCheckingVoucher ? (
                          <>
                            <span className="loading loading-spinner"></span>
                            Vérification...
                          </>
                        ) : (
                          'Finaliser la commande'
                        )}
                      </button>
                    </Form>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-secondary text-white py-12">
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