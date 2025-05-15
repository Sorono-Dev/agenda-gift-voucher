import { useLoaderData, Link } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";

/**
 * Loader – récupère un bon cadeau via l'API Fastify.
 * Retourne l'objet brut (singleFetch friendly);
 */
export async function loader({ params }: LoaderFunctionArgs) {
  // Use a fallback URL (localhost:3001) if SERVER_BASE_URL is not defined
  const baseUrl = process.env.SERVER_BASE_URL || 'http://localhost:3001';
  const res = await fetch(`${baseUrl}/vouchers/${params.code}`);
  if (!res.ok) throw new Response("Not found", { status: 404 });
  // renvoie directement l'objet JSON
  return res.json();
}

export default function VoucherDetail() {
  const v = useLoaderData<typeof loader>();

  return (
    <div className="max-w-lg mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Bon {v.code}</h1>

      {/* QR */}
      <div
        className="border p-4 rounded-lg bg-base-200 inline-block"
        dangerouslySetInnerHTML={{ __html: v.qrSvg }}
      />

      {/* Solde */}
      <p className="text-sm">
        Solde&nbsp;:&nbsp;
        {v.remainingValue ?? v.remainingSessions ?? `${v.percent}%`}
      </p>

      <Link to="/checkout" className="btn btn-secondary">
        Utiliser
      </Link>
    </div>
  );
}