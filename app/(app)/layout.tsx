"use client"; // Esta directiva indica que el siguiente código está destinado a ejecutarse en el lado del cliente en una aplicación Next.js. Permite el uso de funcionalidades del lado del cliente, como los *hooks* y la gestión del estado.

import Link from "next/link"; // Importa el componente Link de Next.js, que se utiliza para crear enlaces de navegación entre páginas de la aplicación. Este componente optimiza la carga de las páginas y permite la navegación sin recargar la página completa.
import { usePathname } from "next/navigation"; // Importa el *hook* usePathname de Next.js, que se utiliza para obtener la ruta actual de la aplicación. Esto permite realizar acciones basadas en la ruta actual, como mostrar u ocultar elementos de la interfaz de usuario según la página en la que se encuentre el usuario.
import { useEffect, useState } from "react"; // Importa los *hooks* useEffect y useState de React. useState se utiliza para manejar el estado local del componente, mientras que useEffect permite ejecutar efectos secundarios, como la obtención de datos o la suscripción a eventos, después de que el componente se haya renderizado.
import { SignOutButton } from "@/components/SignOutButton"; // Importa el componente SignOutButton desde la ruta especificada. Este componente probablemente proporciona un botón para que el usuario cierre sesión en la aplicación.
import { createClient } from "@/lib/supabase/client"; // Importa la función createClient desde la ruta especificada. Esta función probablemente se utiliza para crear una instancia del cliente de Supabase, que es un servicio de backend que proporciona funcionalidades como autenticación, base de datos y almacenamiento.

// El siguiente código define un componente funcional llamado AppLayout, que sirve como diseño principal de la aplicación. Este componente recibe un prop llamado children, que representa los elementos hijos que se renderizarán dentro del diseño.
export default function AppLayout({ children }: { children: React.ReactNode }) { // Define el componente funcional AppLayout, que recibe un prop llamado children de tipo React.ReactNode. Este prop representa los elementos hijos que se renderizarán dentro del diseño del componente.
  const pathname = usePathname(); // Utiliza el *hook* usePathname para obtener la ruta actual de la aplicación. Esto permite al componente determinar en qué página se encuentra el usuario y ajustar la interfaz de usuario en consecuencia.
  const isHomePage = pathname === "/"; // Define una constante isHomePage que verifica si la ruta actual es la página de inicio ("/"). Esta constante se utiliza para determinar si se deben mostrar ciertos elementos de la interfaz de usuario, como enlaces de navegación específicos.
  const isCreateOrEditPage = // Define una constante isCreateOrEditPage que verifica si la ruta actual corresponde a la página de creación o edición de impuestos. Esta constante se utiliza para determinar si se deben mostrar ciertos elementos de la interfaz de usuario, como enlaces de navegación específicos.
    pathname === "/impuestos/nuevo" || // Verifica si la ruta actual es la página de creación de impuestos ("/impuestos/nuevo").
    (pathname?.startsWith("/impuestos/") && pathname.endsWith("/editar")); // Verifica si la ruta actual comienza con "/impuestos/" y termina con "/editar", lo que indica que el usuario se encuentra en una página de edición de impuestos. La combinación de estas condiciones permite al componente determinar si se deben mostrar ciertos elementos de la interfaz de usuario, como enlaces de navegación específicos.

  const showHomeLink = isCreateOrEditPage; // Define una constante showHomeLink que determina si se debe mostrar un enlace a la página de inicio. Esta constante se establece en true si el usuario se encuentra en una página de creación o edición de impuestos, lo que permite al usuario navegar fácilmente de regreso a la página de inicio desde esas páginas específicas.
  const showNewImpuestoLink = isHomePage; // Define una constante showNewImpuestoLink que determina si se debe mostrar un enlace para crear un nuevo impuesto. Esta constante se establece en true si el usuario se encuentra en la página de inicio, lo que permite al usuario acceder fácilmente a la funcionalidad de creación de impuestos desde la página principal.

  const [nombreUsuario, setNombreUsuario] = useState("Usuario");

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      const nombreRaw =
        user.user_metadata?.nombre ??
        user.email?.split("@")[0] ??
        "Usuario";

      const nombre = nombreRaw
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (char: string) => char.toUpperCase());

      setNombreUsuario(nombre);
    });
  }, []);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col bg-zinc-50">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-zinc-900">
              Hola, {nombreUsuario}!
            </h1>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="flex-1 pb-24">{children}</main>

      <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 border-t border-zinc-200 bg-white px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          {showHomeLink ? (
            <Link
              href="/"
              className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-zinc-100 text-sm font-medium text-zinc-800"
            >
              Inicio
            </Link>
          ) : null}
          {showNewImpuestoLink ? (
            <Link
              href="/impuestos/nuevo"
              className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-emerald-600 text-sm font-medium text-white"
            >
              + Nuevo impuesto
            </Link>
          ) : null}
        </div>
      </nav>
    </div>
  );
}