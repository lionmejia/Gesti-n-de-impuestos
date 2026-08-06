//Este es un archivo de diseño para una aplicación Next.js. Configura los estilos y fuentes globales de la aplicación, así como los metadatos del documento HTML.

import type { Metadata } from "next"; // Importa el tipo Metadata de Next.js, que se utiliza para definir los metadatos del documento HTML.
import { Geist, Geist_Mono } from "next/font/google"; // Importa las fuentes Geist y Geist Mono desde Google Fonts utilizando la función next/font/google. Estas fuentes se utilizarán en toda la aplicación.
import "./globals.css"; // Importa un archivo CSS global que contiene estilos compartidos para toda la aplicación.

// Configuración de fuentes

// Configuración de la fuente sans-serif Geist
const geistSans = Geist({
  variable: "--font-geist-sans", // Define una variable CSS para la fuente Geist Sans, que se puede utilizar en los estilos de la aplicación.
  subsets: ["latin"], // Especifica que se utilizará el subconjunto de caracteres latinos de la fuente.
});

// Configuración de la fuente monoespaciada Geist Mono
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadatos del documento HTML
export const metadata: Metadata = { // Define los metadatos del documento HTML, que incluyen el título y la descripción de la aplicación.
  title: "Impuestos del Hogar", // Título de la aplicación que se mostrará en la pestaña del navegador y en los resultados de búsqueda.
  description: "Gestión compartida de impuestos del hogar", // Descripción de la aplicación que se utilizará en los metadatos del documento HTML y en los resultados de búsqueda.
};

// Componente de diseño raíz
export default function RootLayout({ // Define un componente de diseño raíz que envuelve toda la aplicación. Este componente se utiliza para aplicar estilos y configuraciones globales a todas las páginas de la aplicación.
  children, // Recibe como prop los elementos hijos que se renderizarán dentro del diseño. Estos elementos representan el contenido de las páginas individuales de la aplicación.
}: Readonly<{ // Define el tipo de las props del componente RootLayout. Se utiliza Readonly para garantizar que las props no se modifiquen dentro del componente.
  children: React.ReactNode; // Define que la prop children es de tipo React.ReactNode, lo que significa que puede contener cualquier elemento React válido, como componentes, elementos HTML o texto.
}>) {
  return ( // Renderiza el documento HTML con la estructura y estilos definidos.
    <html // Etiqueta raíz del documento HTML. 
      lang="es" // Define el idioma del documento como español.
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} // Aplica las variables de las fuentes Geist Sans y Geist Mono como clases CSS, junto con clases adicionales para establecer la altura completa del documento y habilitar el suavizado de fuentes.
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
