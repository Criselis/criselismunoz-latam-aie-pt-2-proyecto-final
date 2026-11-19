import type { NextConfig } from "next";

// URL interna de la API (en Docker: nombre del servicio, p. ej. http://backend:8000).
// El navegador llama a /backend-api/* en el mismo origen y el servidor de Next
// reenvía la petición a la API dentro de la red Docker.
const API_INTERNAL_URL = process.env.API_INTERNAL_URL;

const nextConfig: NextConfig = {
  async rewrites() {
    if (!API_INTERNAL_URL) return [];
    return [
      {
        source: "/backend-api/:path*",
        destination: `${API_INTERNAL_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
