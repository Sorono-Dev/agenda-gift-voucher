import { useLoaderData, Link } from "@remix-run/react";

// Resolve API base URL – fallback to localhost:3001 in dev
const API_BASE = process.env.SERVER_BASE_URL ?? "http://localhost:3001";

// Interface pour les données du voucher retournées par l'API
interface ApiVoucher {
  id: string;
  code: string;
  type: "AMOUNT" | "SESSION" | "PERCENT";
  initialValue: number | null;
  remainingValue: number | null;
  initialSessions: number | null;
  remainingSessions: number | null;
  percent: number | null;
  createdAt: string;
  expiresAt: string | null;
  isActive: boolean;
  customer: string | null;
}

// Interface pour les données formatées
interface FormattedVoucher {
  id: string;
  code: string;
  type: "AMOUNT" | "SESSION" | "PERCENT";
  displayValue: string;
  displayRemaining: string;
  dateCreated: string;
  expiresAt: string;
  status: string;
}

export async function loader() {
  try {
    const response = await fetch(`${API_BASE}/vouchers`);
    if (!response.ok) {
      throw new Response("Erreur lors de la récupération des bons cadeaux", { status: response.status });
    }
    const vouchers = await response.json() as ApiVoucher[];

    // Conversion/Formatage des données
    const formattedVouchers = vouchers.map((v: ApiVoucher): FormattedVoucher => {
      let displayValue = '';
      let displayRemaining = '';
      
      switch (v.type) {
        case 'AMOUNT':
          displayValue = `${v.initialValue} CHF`;
          displayRemaining = `${v.remainingValue} CHF`;
          break;
        case 'SESSION':
          displayValue = `${v.initialSessions} séance${v.initialSessions !== 1 ? 's' : ''}`;
          displayRemaining = `${v.remainingSessions} séance${v.remainingSessions !== 1 ? 's' : ''}`;
          break;
        case 'PERCENT':
          displayValue = `${v.percent}%`;
          displayRemaining = `${v.percent}%`;
          break;
      }
      
      return {
        id: v.id,
        code: v.code,
        type: v.type,
        displayValue,
        displayRemaining,
        dateCreated: new Date(v.createdAt).toLocaleDateString(),
        expiresAt: v.expiresAt ? new Date(v.expiresAt).toLocaleDateString() : "Non définie",
        status: v.isActive ? "active" : "used"
      };
    });

    return { vouchers: formattedVouchers };
  } catch (error) {
    console.error("Erreur lors du chargement des bons cadeaux:", error);
    return { vouchers: [] };
  }
}

export default function VouchersList() {
  const data = useLoaderData<typeof loader>();
  const vouchers = data?.vouchers || [];

  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      {/* Navigation */}
      <header className="navbar bg-base-100 shadow-sm">
        <div className="container mx-auto flex justify-between items-center px-4">
          <Link to="/" className="text-xl font-bold tracking-wide text-primary">
            Agenda Gift
          </Link>
          <nav className="flex gap-2">
            <Link to="/vouchers/new" className="btn btn-ghost btn-sm">
              Créer un bon
            </Link>
            <Link to="/checkout" className="btn btn-ghost btn-sm">
              Panier
            </Link>
          </nav>
        </div>
      </header>

      {/* Contenu */}
      <main className="container mx-auto flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Liste des bons cadeaux</h1>
          <Link to="/vouchers/new" className="btn btn-primary btn-sm">
            Créer un nouveau bon
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Valeur</th>
                <th>Solde restant</th>
                <th>Date de création</th>
                <th>Date d&apos;expiration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    Aucun bon cadeau trouvé
                  </td>
                </tr>
              ) : (
                vouchers.map((voucher) => (
                  <tr key={voucher.id}>
                    <td>{voucher.code}</td>
                    <td>
                      <span className="badge badge-ghost">
                        {voucher.type === 'AMOUNT' ? 'Montant' : 
                         voucher.type === 'SESSION' ? 'Séance' : 'Pourcentage'}
                      </span>
                    </td>
                    <td>{voucher.displayValue}</td>
                    <td>{voucher.displayRemaining}</td>
                    <td>{voucher.dateCreated}</td>
                    <td>{voucher.expiresAt}</td>
                    <td>
                      <span className={`badge ${voucher.status === "active" ? "badge-success" : "badge-ghost"}`}>
                        {voucher.status === "active" ? "Actif" : "Utilisé"}
                      </span>
                    </td>
                    <td>
                      <Link to={`/vouchers/${voucher.code}`} className="btn btn-ghost btn-xs">
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer footer-center p-4 bg-base-200 text-base-content">
        <p>© {new Date().getFullYear()} Agenda.ch – POC Gift Voucher</p>
      </footer>
    </div>
  );
} 