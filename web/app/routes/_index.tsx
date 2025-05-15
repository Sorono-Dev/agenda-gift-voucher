import { Link, useSearchParams, useLoaderData } from "@remix-run/react";

const SERVICES = [
  { id: "service1", name: "Coupe cheveux", price: 45, duration: "30 min" },
  { id: "service2", name: "Coupe + barbe", price: 60, duration: "45 min" },
  { id: "service3", name: "Taille de barbe", price: 30, duration: "20 min" },
  { id: "service4", name: "Coiffure", price: 40, duration: "30 min" },
  { id: "service5", name: "Shampooing", price: 15, duration: "15 min" },
];

/**
 * Loader – on renvoie simplement un objet (Remix v3+ singleFetch).
 */
export async function loader() {
  return { 
    year: new Date().getFullYear(),
    services: SERVICES
  };
}

export default function Index() {
  const [searchParams] = useSearchParams();
  const data = useLoaderData<typeof loader>();
  const showSuccess = searchParams.get("success") === "true";
  
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

      {/* Hero Section */}
      <section className="bg-hero-pattern bg-cover bg-center py-20 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 font-display">
              <span className="block">Offrez</span>
              <span className="block text-primary">le parfait</span>
              <span className="block">cadeau</span>
            </h1>
            <p className="text-xl mb-8 text-gray-200 max-w-xl">
              Des bons cadeaux personnalisés pour faire plaisir à vos proches. Montant libre, séances ou pourcentage.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/vouchers/new" className="btn btn-primary btn-lg">
                Créer un bon cadeau
              </Link>
              <Link to="/vouchers" className="btn btn-outline btn-lg text-white hover:text-primary border-white hover:border-primary">
                Voir tous les bons
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Notification de succès */}
      {showSuccess && (
        <div className="container mx-auto px-4 py-4">
          <div className="alert alert-success shadow-lg">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Transaction effectuée avec succès!</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Services Section */}
      <section className="py-16 bg-base-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2 font-display">Nos Services</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Découvrez nos prestations et utilisez vos bons cadeaux pour en profiter.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.services.map((service) => (
              <div key={service.id} className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
                <div className="card-body">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="card-title font-semibold mb-2">{service.name}</h3>
                      <p className="text-sm text-gray-600 mb-4">{service.duration}</p>
                    </div>
                    <span className="text-xl font-bold">{service.price} CHF</span>
                  </div>
                  <div className="card-actions justify-end mt-2">
                    <Link prefetch="intent" to={`/checkout?service=${service.id}`} className="btn btn-primary btn-sm">
                      Ajouter au panier
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-16 bg-base-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2 font-display">Comment ça marche</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Notre système de bons cadeaux est simple et efficace.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-2">Choisissez votre bon</h3>
              <p className="text-gray-600">
                Sélectionnez le type de bon que vous souhaitez offrir : montant, séances ou pourcentage.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-2">Personnalisez-le</h3>
              <p className="text-gray-600">
                Définissez le montant, le nombre de séances ou le pourcentage de réduction.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-2">Utilisez votre code</h3>
              <p className="text-gray-600">
                Le bénéficiaire pourra utiliser son code lors de son passage en caisse.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-12 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 font-display">Prêt à offrir un moment exceptionnel ?</h2>
          <p className="mb-6 max-w-xl mx-auto">
            Nos bons cadeaux sont la solution idéale pour faire plaisir à vos proches.
          </p>
          <Link to="/vouchers/new" className="btn btn-lg bg-white text-primary hover:bg-gray-100">
            Créer un bon cadeau maintenant
          </Link>
        </div>
      </section>

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
            <p>© {data.year} AgendaGift – Système de bons cadeaux</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

