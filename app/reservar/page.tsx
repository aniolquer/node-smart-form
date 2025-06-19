import SolicitudReservaForm from "@/components/solicitud-reserva-form"
import { MapPin } from "lucide-react"

export default function ReservaPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-slate-900 text-white py-8 px-6 md:px-12">
        <h1 className="text-5xl font-bold">node</h1>
      </header>
      <main className="py-8 px-4 md:px-8 lg:px-16">
        <div className="max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-md">
          <div className="flex items-start mb-2">
            <MapPin className="h-7 w-7 text-orange-600 mr-3 mt-1 flex-shrink-0" />
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">Solicitud de Reserva</h2>
          </div>
          <p className="text-gray-600 mb-8 ml-10">
            Adjunta la documentación necesaria para completar tu reserva y asegurar tu alojamiento.
          </p>
          <SolicitudReservaForm />
        </div>
      </main>
      <footer className="text-center py-4 text-gray-600 text-sm">
        © {new Date().getFullYear()} Node Properties. Todos los derechos reservados.
      </footer>
    </div>
  )
}
