"use client"

import type React from "react"
import { useState, type ChangeEvent, type FormEvent, useEffect, useMemo } from "react"
import { format, differenceInCalendarMonths, isValid, getMonth, differenceInDays, addDays } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CalendarIcon, InfoIcon, Eye, Trash2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// --- Lógica de Precios (sin cambios) ---
type UnitKey =
  | "Studio Estándar"
  | "Studio Estándar con Terraza"
  | "Studio Rooftop"
  | "Studio Confort"
  | "2-Bed Apartment"
  | "2-Bed con Terraza"
  | "2-Bed Rooftop"

type StayTypeKey = "Hotel" | "Short" | "Mid" | "Long"
type SeasonKey = "Abril" | "Mayo-Julio" | "Agosto-Septiembre" | "Octubre-Diciembre"

const priceTable: Record<UnitKey, Partial<Record<StayTypeKey, Partial<Record<SeasonKey, number | null>>>>> = {
  "Studio Estándar": {
    Hotel: { Abril: 2415, "Mayo-Julio": 2450, "Agosto-Septiembre": 2475, "Octubre-Diciembre": 2510 },
    Short: { Abril: 940, "Mayo-Julio": 950, "Agosto-Septiembre": 960, "Octubre-Diciembre": 975 },
    Mid: { Abril: 870, "Mayo-Julio": 880, "Agosto-Septiembre": 890, "Octubre-Diciembre": 900 },
    Long: { Abril: 755, "Mayo-Julio": 765, "Agosto-Septiembre": 775, "Octubre-Diciembre": 785 },
  },
  "Studio Estándar con Terraza": {
    Hotel: { Abril: 2825, "Mayo-Julio": 2865, "Agosto-Septiembre": 2895, "Octubre-Diciembre": 2940 },
    Short: { Abril: 1095, "Mayo-Julio": 1110, "Agosto-Septiembre": 1125, "Octubre-Diciembre": 1140 },
    Mid: { Abril: 1015, "Mayo-Julio": 1030, "Agosto-Septiembre": 1040, "Octubre-Diciembre": 1055 },
    Long: { Abril: 885, "Mayo-Julio": 895, "Agosto-Septiembre": 905, "Octubre-Diciembre": 920 },
  },
  "Studio Rooftop": {
    Hotel: { Abril: null, "Mayo-Julio": null, "Agosto-Septiembre": null, "Octubre-Diciembre": null },
    Short: { Abril: 1135, "Mayo-Julio": 1150, "Agosto-Septiembre": 1165, "Octubre-Diciembre": 1180 },
    Mid: { Abril: 1045, "Mayo-Julio": 1060, "Agosto-Septiembre": 1070, "Octubre-Diciembre": 1085 },
    Long: { Abril: 910, "Mayo-Julio": 920, "Agosto-Septiembre": 930, "Octubre-Diciembre": 945 },
  },
  "Studio Confort": {
    Hotel: { Abril: 2700, "Mayo-Julio": 2740, "Agosto-Septiembre": 2770, "Octubre-Diciembre": 2810 },
    Short: { Abril: 1050, "Mayo-Julio": 1075, "Agosto-Septiembre": 1090, "Octubre-Diciembre": 1105 },
    Mid: { Abril: 970, "Mayo-Julio": 995, "Agosto-Septiembre": 1010, "Octubre-Diciembre": 1020 },
    Long: { Abril: 845, "Mayo-Julio": 865, "Agosto-Septiembre": 875, "Octubre-Diciembre": 890 },
  },
  "2-Bed Apartment": {
    Hotel: { Abril: null, "Mayo-Julio": null, "Agosto-Septiembre": null, "Octubre-Diciembre": null },
    Short: { Abril: 1565, "Mayo-Julio": 1590, "Agosto-Septiembre": 1605, "Octubre-Diciembre": 1625 },
    Mid: { Abril: 1465, "Mayo-Julio": 1485, "Agosto-Septiembre": 1500, "Octubre-Diciembre": 1520 },
    Long: { Abril: 1275, "Mayo-Julio": 1290, "Agosto-Septiembre": 1305, "Octubre-Diciembre": 1325 },
  },
  "2-Bed con Terraza": {
    Hotel: { Abril: null, "Mayo-Julio": null, "Agosto-Septiembre": null, "Octubre-Diciembre": null },
    Short: { Abril: 1540, "Mayo-Julio": 1560, "Agosto-Septiembre": 1575, "Octubre-Diciembre": 1600 },
    Mid: { Abril: 1440, "Mayo-Julio": 1460, "Agosto-Septiembre": 1475, "Octubre-Diciembre": 1495 },
    Long: { Abril: 1250, "Mayo-Julio": 1270, "Agosto-Septiembre": 1285, "Octubre-Diciembre": 1300 },
  },
  "2-Bed Rooftop": {
    Hotel: { Abril: null, "Mayo-Julio": null, "Agosto-Septiembre": null, "Octubre-Diciembre": null },
    Short: { Abril: 1725, "Mayo-Julio": 1750, "Agosto-Septiembre": 1765, "Octubre-Diciembre": 1795 },
    Mid: { Abril: 1610, "Mayo-Julio": 1635, "Agosto-Septiembre": 1650, "Octubre-Diciembre": 1675 },
    Long: { Abril: 1400, "Mayo-Julio": 1425, "Agosto-Septiembre": 1435, "Octubre-Diciembre": 1460 },
  },
}

function getSeason(date: Date): SeasonKey {
  const month = getMonth(date)
  if (month === 3) return "Abril"
  if (month >= 4 && month <= 6) return "Mayo-Julio"
  if (month >= 7 && month <= 8) return "Agosto-Septiembre"
  return "Octubre-Diciembre"
}

function getStayType(from: Date, to: Date): StayTypeKey {
  const days = differenceInDays(to, from) + 1
  const months = differenceInCalendarMonths(to, from)
  if (days < 1) throw new Error("Invalid date range")
  if (days < 28) return "Hotel"
  if (months === 0 && days >= 28) return "Short"
  if (months >= 0 && months < 3) return "Short"
  if (months >= 3 && months < 9) return "Mid"
  if (months >= 9) return "Long"
  return "Short"
}

interface EstimatedPriceResult {
  monthlyPrice?: number
  totalPrice?: number
  message?: string
  isAvailable: boolean
}

function calculateEstimatedPrice(
  unitType: UnitKey | string,
  checkInDate?: Date,
  checkOutDate?: Date,
): EstimatedPriceResult {
  if (!unitType || !checkInDate || !checkOutDate) {
    return {
      message: "Por favor, selecciona el tipo de unidad y las fechas de check-in y check-out.",
      isAvailable: false,
    }
  }

  if (!isValid(checkInDate) || !isValid(checkOutDate) || checkInDate >= checkOutDate) {
    return { message: "Fechas de estancia inválidas.", isAvailable: false }
  }

  const unit = priceTable[unitType as UnitKey]
  if (!unit) {
    return { message: `Tipo de unidad "${unitType}" no encontrado.`, isAvailable: false }
  }

  const season = getSeason(checkInDate)
  const stayType = getStayType(checkInDate, checkOutDate)
  const durationMonths = differenceInCalendarMonths(checkOutDate, checkInDate) + 1

  const stayTypePrices = unit[stayType]
  if (!stayTypePrices) {
    return {
      message: `La combinación de unidad "${unitType}" y tipo de estancia "${stayType}" no está disponible.`,
      isAvailable: false,
    }
  }

  const monthlyPrice = stayTypePrices[season]

  if (monthlyPrice === undefined || monthlyPrice === null) {
    return {
      message: `La combinación de unidad "${unitType}", tipo de estancia "${stayType}" y temporada de check-in "${season}" no está disponible. Por favor, elige otra opción.`,
      isAvailable: false,
    }
  }
  const totalPrice = monthlyPrice * durationMonths
  return {
    monthlyPrice,
    totalPrice,
    message: `Precio mensual estimado: ${monthlyPrice.toLocaleString("es-ES", {
      style: "currency",
      currency: "EUR",
    })}. Duración: ${durationMonths} mes(es).`,
    isAvailable: true,
  }
}
// --- Fin Lógica de Precios ---

interface FormState {
  unitType: string
  checkInDate?: Date
  checkOutDate?: Date
  firstName: string
  lastName: string
  email: string
  phone: string
  tieneIngresosSuficientes: string
  tipoTrabajador: string
  tipoAutonomo: string
  dniPasaporte: File[]
  nominas: File[]
  contratoLaboral: File[]
  certificadoBancario: File[]
  dniPasaporteAvalista: File[]
  nominasAvalista: File[]
  contratoLaboralAvalista: File[]
  modelo303: File[]
  declaracionRenta: File[]
  reciboAutonomos: File[]
  opcionPago: string
  opcionAvalista: string
}

const initialFormState: FormState = {
  unitType: "",
  checkInDate: undefined,
  checkOutDate: undefined,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  tieneIngresosSuficientes: "",
  tipoTrabajador: "",
  tipoAutonomo: "",
  dniPasaporte: [],
  nominas: [],
  contratoLaboral: [],
  certificadoBancario: [],
  dniPasaporteAvalista: [],
  nominasAvalista: [],
  contratoLaboralAvalista: [],
  modelo303: [],
  declaracionRenta: [],
  reciboAutonomos: [],
  opcionPago: "",
  opcionAvalista: "",
}

// Configuración de documentos
const documentosBaseConfig = {
  dniPasaporte: { label: "DNI / Pasaporte / NIE", description: "Copia de tu documento de identidad." },
  nominas: { label: "3 Últimas Nóminas", description: "Tus tres últimas nóminas." },
  contratoLaboral: { label: "Contrato Laboral", description: "Contrato laboral con antigüedad mínima de 3-4 meses." },
  certificadoBancario: {
    label: "Certificado de Titularidad Bancaria",
    description: "Certificado de tu cuenta bancaria.",
  },
  dniPasaporteAvalista: {
    label: "DNI / Pasaporte / NIE (Avalista)",
    description: "Documento de identidad del avalista.",
  },
  nominasAvalista: { label: "3 Últimas Nóminas (Avalista)", description: "Tres últimas nóminas del avalista." },
  contratoLaboralAvalista: {
    label: "Contrato Laboral (Avalista)",
    description: "Contrato laboral del avalista con antigüedad mínima de 1 año.",
  },
  modelo303: { label: "Modelo 303 (IVA) o VAT Tax Returns", description: "Últimos 2 trimestres." },
  declaracionRenta: {
    label: "Declaración de la Renta (IRPF) o Income Tax Return",
    description: "Última declaración de la renta.",
  },
  reciboAutonomos: {
    label: "Recibo Cuota Autónomos o Justificante Status Freelance",
    description: "Último recibo al día.",
  },
}

interface FileUploadProps {
  id: keyof FormState
  label: string
  description?: string
  onFileChange: (id: keyof FormState, files: File[]) => void
  files: File[]
}

const FileUploadField: React.FC<FileUploadProps> = ({ id, label, description, onFileChange, files }) => {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files)
      onFileChange(id, [...files, ...newFiles])
    }
  }

  const handleViewFile = (file: File) => {
    const url = URL.createObjectURL(file)
    window.open(url, "_blank")
    // Clean up the URL after a delay to prevent memory leaks
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const handleDeleteFile = (fileIndex: number) => {
    const updatedFiles = [...files]
    updatedFiles.splice(fileIndex, 1)
    onFileChange(id, updatedFiles)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-base font-medium">
        {label} <span className="text-red-500">*</span>
      </Label>
      {description && <p className="text-sm text-gray-500">{description}</p>}

      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <Input id={id} type="file" multiple onChange={handleFileChange} className="hidden" />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(id)?.click()}
            className="bg-white hover:bg-gray-50"
          >
            Añadir archivos
          </Button>
          <span className="text-sm text-gray-600">
            {files.length === 0 ? "No hay archivos seleccionados" : `${files.length} archivo(s)`}
          </span>
        </div>

        {files.length > 0 && (
          <div className="mt-2 space-y-2">
            <p className="text-sm font-medium text-gray-700">Archivos seleccionados:</p>
            <div className="max-h-48 overflow-y-auto border rounded-md bg-gray-50">
              <ul className="divide-y divide-gray-200">
                {files.map((file, index) => (
                  <li key={index} className="p-2 flex items-center justify-between">
                    <div className="truncate text-sm text-gray-600 max-w-[200px] md:max-w-xs">{file.name}</div>
                    <div className="flex space-x-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleViewFile(file)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteFile(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SolicitudReservaForm() {
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [progress, setProgress] = useState(0)
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [estimatedPriceInfo, setEstimatedPriceInfo] = useState<EstimatedPriceResult>({ isAvailable: false })
  const [currentStep, setCurrentStep] = useState(0)
  const [showTooltip, setShowTooltip] = useState(false)
  const estanciaDuracionMeses = useMemo(() => {
    if (formState.checkInDate && formState.checkOutDate) {
      const from = new Date(formState.checkInDate)
      const to = new Date(formState.checkOutDate)
      if (isValid(from) && isValid(to) && to > from) {
        return differenceInCalendarMonths(to, from) + 1
      }
    }
    return 0
  }, [formState.checkInDate, formState.checkOutDate])

  const tipoEstanciaClasificada = useMemo(() => {
    if (formState.checkInDate && formState.checkOutDate) {
      const from = new Date(formState.checkInDate)
      const to = new Date(formState.checkOutDate)
      if (isValid(from) && isValid(to) && to > from) {
        return getStayType(from, to)
      }
    }
    return null
  }, [formState.checkInDate, formState.checkOutDate])

  const tipoEstanciaRequisitos = useMemo(() => {
    if (estanciaDuracionMeses === 0) return null
    if (estanciaDuracionMeses >= 1 && estanciaDuracionMeses <= 3) return "corta"
    if (estanciaDuracionMeses > 3) return "larga"
    return null
  }, [estanciaDuracionMeses])

  // Determinar el número total de pasos según el tipo de estancia
  const totalSteps = useMemo(() => {
    if (!tipoEstanciaClasificada) return 4
    if (tipoEstanciaClasificada === "Hotel") return 2
    if (tipoEstanciaRequisitos === "corta") return 3
    return 4
  }, [tipoEstanciaClasificada, tipoEstanciaRequisitos])

  // Actualizar el paso actual basado en el progreso del formulario
  useEffect(() => {
    if (formState.checkInDate && formState.checkOutDate) {
      setCurrentStep(1)
      if (tipoEstanciaClasificada === "Hotel") {
        setCurrentStep(1)
      } else if (formState.unitType) {
        setCurrentStep(2)
        if (tipoEstanciaRequisitos === "larga" && !formState.tieneIngresosSuficientes) {
          setCurrentStep(2)
        } else if (
          (tipoEstanciaRequisitos === "larga" && formState.tieneIngresosSuficientes) ||
          tipoEstanciaRequisitos === "corta"
        ) {
          if (formState.email && formState.phone) {
            setCurrentStep(3)
          } else {
            setCurrentStep(2)
          }
        }
      }
    } else {
      setCurrentStep(0)
    }
  }, [formState, tipoEstanciaClasificada, tipoEstanciaRequisitos])

  useEffect(() => {
    const priceResult = calculateEstimatedPrice(formState.unitType, formState.checkInDate, formState.checkOutDate)
    setEstimatedPriceInfo(priceResult)
  }, [formState.unitType, formState.checkInDate, formState.checkOutDate])

  // Determinar documentos requeridos basados en las selecciones del usuario
  const documentosRequeridos = useMemo((): (keyof typeof documentosBaseConfig)[] => {
    if (tipoEstanciaRequisitos === "corta") {
      return ["dniPasaporte"]
    }

    if (tipoEstanciaRequisitos === "larga") {
      // Documentos base para todos
      const documentosBase = ["dniPasaporte"]

      // Si no tiene ingresos suficientes
      if (formState.tieneIngresosSuficientes === "no") {
        if (formState.opcionAvalista === "avalista") {
          return [...documentosBase, "dniPasaporteAvalista", "nominasAvalista", "contratoLaboralAvalista"]
        }
        return documentosBase
      }

      // Si tiene ingresos suficientes
      if (formState.tieneIngresosSuficientes === "si") {
        // Si es trabajador
        if (formState.tipoTrabajador === "trabajador") {
          return [...documentosBase, "contratoLaboral", "nominas", "certificadoBancario"]
        }

        // Si es autónomo
        if (formState.tipoTrabajador === "autonomo") {
          // Si es autónomo fuera de la UE, solo requiere DNI/Pasaporte/NIE
          if (formState.tipoAutonomo === "fuera-ue") {
            return documentosBase // Solo DNI/Pasaporte/NIE
          }

          // Si es autónomo de la UE, requiere todos los documentos
          const docsAutonomo = [
            ...documentosBase,
            "modelo303",
            "declaracionRenta",
            "reciboAutonomos",
            "certificadoBancario",
          ]

          return docsAutonomo
        }
      }
    }

    return []
  }, [
    tipoEstanciaRequisitos,
    formState.tieneIngresosSuficientes,
    formState.tipoTrabajador,
    formState.tipoAutonomo,
    formState.opcionAvalista,
  ])

  const camposObligatoriosBase = ["unitType", "checkInDate", "checkOutDate", "firstName", "lastName", "email", "phone"]

  useEffect(() => {
    let completedFields = 0
    let totalRequiredFields = camposObligatoriosBase.length

    if (formState.unitType) completedFields++
    if (formState.checkInDate) completedFields++
    if (formState.checkOutDate) completedFields++
    if (formState.firstName.trim() !== "") completedFields++
    if (formState.lastName.trim() !== "") completedFields++
    if (formState.email.trim() !== "" && /\S+@\S+\.\S+/.test(formState.email)) completedFields++
    if (formState.phone.trim() !== "") completedFields++

    if (tipoEstanciaRequisitos === "larga") {
      totalRequiredFields++
      if (formState.tieneIngresosSuficientes) completedFields++

      if (formState.tieneIngresosSuficientes === "no") {
        totalRequiredFields++
        if (formState.opcionAvalista) completedFields++

        if (formState.opcionAvalista === "pago") {
          totalRequiredFields++
          if (formState.opcionPago) completedFields++
        }
      }

      if (formState.tieneIngresosSuficientes === "si") {
        totalRequiredFields++
        if (formState.tipoTrabajador) completedFields++

        if (formState.tipoTrabajador === "autonomo") {
          totalRequiredFields++
          if (formState.tipoAutonomo) completedFields++

          if (formState.tipoAutonomo === "fuera-ue") {
            totalRequiredFields++
            if (formState.opcionPago) completedFields++
          }
        }
      }
    }

    documentosRequeridos.forEach((docKey) => {
      totalRequiredFields++
      if (formState[docKey]?.length > 0) completedFields++
    })

    const isPriceCombinationValid = estimatedPriceInfo.isAvailable
    if (!isPriceCombinationValid) totalRequiredFields++

    setProgress(totalRequiredFields > 0 ? (completedFields / totalRequiredFields) * 100 : 0)
  }, [formState, tipoEstanciaRequisitos, documentosRequeridos, estimatedPriceInfo.isAvailable])

  const handleFileChange = (id: keyof FormState, files: File[]) => {
    setFormState((prev) => ({ ...prev, [id]: files }))
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (field: "checkInDate" | "checkOutDate", date?: Date) => {
    setFormState((prev) => {
      const newState = { ...prev, [field]: date }
      if (field === "checkInDate" && date && newState.checkOutDate && date >= newState.checkOutDate) {
        newState.checkOutDate = addDays(date, 1)
      }
      if (field === "checkOutDate" && date && newState.checkInDate && date <= newState.checkInDate) {
        newState.checkInDate = addDays(date, -1)
      }
      return newState
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!estimatedPriceInfo.isAvailable) {
      setSubmissionStatus("error")
      alert(
        "La combinación de unidad, fechas y tipo de estancia seleccionada no está disponible o no se pudo calcular el precio. Por favor, ajusta tu selección.",
      )
      return
    }

    setSubmissionStatus("submitting")

    // Simular el envío del email con los datos del formulario
    try {
      // Preparar los datos para el email
      const emailData = {
        destinatario: "aniolquer@gmail.com",
        asunto: `Nueva Solicitud de Reserva - ${formState.firstName} ${formState.lastName}`,
        datosPersonales: {
          nombre: formState.firstName,
          apellidos: formState.lastName,
          email: formState.email,
          telefono: formState.phone,
        },
        detallesReserva: {
          tipoUnidad: formState.unitType,
          fechaCheckIn: formState.checkInDate ? format(formState.checkInDate, "dd/MM/yyyy") : "",
          fechaCheckOut: formState.checkOutDate ? format(formState.checkOutDate, "dd/MM/yyyy") : "",
          duracionMeses: estanciaDuracionMeses,
          precioMensualEstimado: estimatedPriceInfo.monthlyPrice,
          precioTotalEstimado: estimatedPriceInfo.totalPrice,
        },
        situacionLaboral: {
          tieneIngresosSuficientes: formState.tieneIngresosSuficientes,
          tipoTrabajador: formState.tipoTrabajador,
          tipoAutonomo: formState.tipoAutonomo,
          opcionAvalista: formState.opcionAvalista,
          opcionPago: formState.opcionPago,
        },
        documentosAdjuntos: documentosRequeridos.map((docKey) => ({
          tipo: documentosBaseConfig[docKey].label,
          cantidad: formState[docKey]?.length || 0,
          archivos: formState[docKey]?.map((file) => file.name) || [],
        })),
      }

      // Simular el envío del email (en producción aquí iría la llamada a la API)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      console.log("Email enviado con los siguientes datos:", emailData)
      console.log("Archivos adjuntos:", formState)

      setSubmissionStatus("success")
    } catch (error) {
      console.error("Error al enviar el email:", error)
      setSubmissionStatus("error")
    }
  }

  const unitTypes = {
    Studios: ["Studio Estándar", "Studio Estándar con Terraza", "Studio Confort", "Studio Rooftop"],
    "Apartamentos de dos habitaciones": [
      "2-Bed Apartment",
      "2-Bed con Terraza",
      "2-Bed Rooftop",
    ],
  }

  const isFormValid = useMemo(() => {
    // Check basic required fields
    const basicFieldsValid =
      formState.firstName.trim() !== "" &&
      formState.lastName.trim() !== "" &&
      formState.email.trim() !== "" &&
      /\S+@\S+\.\S+/.test(formState.email) &&
      formState.phone.trim() !== "" &&
      formState.unitType !== "" &&
      formState.checkInDate &&
      formState.checkOutDate &&
      estimatedPriceInfo.isAvailable

    // Check situation fields for long stays
    let situationValid = true
    if (tipoEstanciaRequisitos === "larga") {
      situationValid = formState.tieneIngresosSuficientes !== ""

      if (formState.tieneIngresosSuficientes === "no") {
        situationValid = situationValid && formState.opcionAvalista !== ""

        if (formState.opcionAvalista === "pago") {
          situationValid = situationValid && formState.opcionPago !== ""
        }
      }

      if (formState.tieneIngresosSuficientes === "si") {
        situationValid = situationValid && formState.tipoTrabajador !== ""

        if (formState.tipoTrabajador === "autonomo") {
          situationValid = situationValid && formState.tipoAutonomo !== ""

          if (formState.tipoAutonomo === "fuera-ue") {
            situationValid = situationValid && formState.opcionPago !== ""
          }
        }
      }
    }

    // Check required documents
    const documentsValid = documentosRequeridos.every((docKey) => formState[docKey]?.length > 0)

    return basicFieldsValid && situationValid && documentsValid
  }, [formState, tipoEstanciaRequisitos, documentosRequeridos, estimatedPriceInfo.isAvailable])

  const getValidationErrors = useMemo(() => {
    const errors: string[] = []

    // Check basic required fields
    if (!formState.unitType) errors.push("Selecciona un tipo de unidad")
    if (!formState.checkInDate) errors.push("Selecciona fecha de check-in")
    if (!formState.checkOutDate) errors.push("Selecciona fecha de check-out")
    if (!formState.firstName.trim()) errors.push("Ingresa tu nombre")
    if (!formState.lastName.trim()) errors.push("Ingresa tus apellidos")
    if (!formState.email.trim()) errors.push("Ingresa tu email")
    else if (!/\S+@\S+\.\S+/.test(formState.email)) errors.push("Ingresa un email válido")
    if (!formState.phone.trim()) errors.push("Ingresa tu teléfono")

    // Check price combination validity
    if (!estimatedPriceInfo.isAvailable) {
      errors.push("La combinación seleccionada no está disponible")
    }

    // Check situation fields for long stays
    if (tipoEstanciaRequisitos === "larga") {
      if (!formState.tieneIngresosSuficientes) {
        errors.push("Indica si tienes ingresos suficientes")
      }

      if (formState.tieneIngresosSuficientes === "no" && !formState.opcionAvalista) {
        errors.push("Selecciona una opción para continuar")
      }

      if (formState.tieneIngresosSuficientes === "no" && formState.opcionAvalista === "pago" && !formState.opcionPago) {
        errors.push("Selecciona una opción de pago")
      }

      if (formState.tieneIngresosSuficientes === "si" && !formState.tipoTrabajador) {
        errors.push("Selecciona si eres trabajador o autónomo")
      }

      if (formState.tipoTrabajador === "autonomo" && !formState.tipoAutonomo) {
        errors.push("Indica si eres autónomo de la UE o fuera de la UE")
      }

      if (formState.tipoTrabajador === "autonomo" && formState.tipoAutonomo === "fuera-ue" && !formState.opcionPago) {
        errors.push("Selecciona una opción de pago")
      }
    }

    // Check required documents
    documentosRequeridos.forEach((docKey) => {
      if (!formState[docKey] || formState[docKey].length === 0) {
        const docConfig = documentosBaseConfig[docKey]
        errors.push(`Adjunta: ${docConfig.label}`)
      }
    })

    return errors
  }, [formState, tipoEstanciaRequisitos, documentosRequeridos, estimatedPriceInfo.isAvailable])

  // Calcular los ingresos mínimos requeridos (2x el precio mensual)
  const ingresosMinimosMensuales = useMemo(() => {
    if (estimatedPriceInfo.isAvailable && estimatedPriceInfo.monthlyPrice) {
      return estimatedPriceInfo.monthlyPrice * 2
    }
    return 0
  }, [estimatedPriceInfo])

  return (
    <div className="space-y-8">
      {/* Sección de introducción y guía del proceso */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
              <InfoIcon className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-xl text-blue-900 md:text-xl">Proceso de Solicitud de Reserva</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-blue-800 font-medium">
              Completa este formulario para solicitar tu reserva. Te guiaremos paso a paso:
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-blue-700">
              <li>Selecciona tus fechas de entrada y salida</li>
              <li>Elige el tipo de alojamiento</li>
              <li>Sube la documentación requerida</li>
              <li>Envía tu solicitud para revisión</li>
            </ol>
            <div className="bg-blue-100 p-3 rounded-lg border-l-4 border-blue-400">
              <p className="text-blue-800 text-sm font-medium">
                💡 Nuestro equipo revisará tu solicitud y te contactará para confirmar la disponibilidad.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Sección 1: Detalles de la Reserva */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-sm mr-2">
                1
              </span>
              Detalles de tu Reserva
            </CardTitle>
            <CardDescription>
              Comienza seleccionando las fechas de tu estancia para continuar con el proceso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Selectors - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-4 gap-y-6">
              {/* Check-in Date Selector */}
              <div className="space-y-2">
                <Label htmlFor="checkInDate" className="text-base font-medium">
                  Fecha de Check-in <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="checkInDate"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal text-base",
                        !formState.checkInDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formState.checkInDate ? (
                        format(formState.checkInDate, "LLL dd, y", { locale: es })
                      ) : (
                        <span>Selecciona fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formState.checkInDate}
                      onSelect={(date) => handleDateChange("checkInDate", date)}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Check-out Date Selector */}
              <div className="space-y-2">
                <Label htmlFor="checkOutDate" className="text-base font-medium">
                  Fecha de Check-out <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="checkOutDate"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal text-base",
                        !formState.checkOutDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formState.checkOutDate ? (
                        format(formState.checkOutDate, "LLL dd, y", { locale: es })
                      ) : (
                        <span>Selecciona fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formState.checkOutDate}
                      onSelect={(date) => handleDateChange("checkOutDate", date)}
                      disabled={(date) =>
                        date <
                        (formState.checkInDate
                          ? addDays(formState.checkInDate, 1)
                          : new Date(new Date().setHours(0, 0, 0, 0)))
                      }
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Booking.com Banner for Hotel stays - Show within the card */}
            {tipoEstanciaClasificada === "Hotel" && (
              <Alert variant="default" className="bg-sky-50 border-sky-300 text-sky-700">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle className="font-semibold">Estancias Cortas (menos de 30 días)</AlertTitle>
                <AlertDescription>
                  <p>
                    Para estancias de menos de 1 mes, es necesario realizar tu reserva directamente a través de Expedia.
                    No ofrecemos esta tipo de reservas desde nuestra página web.
                  </p>
                  <Button
                    asChild
                    variant="link"
                    className="p-0 h-auto text-sky-700 hover:text-sky-800 font-bold mt-2 text-base"
                  >
                    <a
                      href="https://www.expedia.com/Madrid-Hotels-Node-Madrid-Carabanchel.h115319612.Hotel-Information"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ir a nuestra página de Expedia
                    </a>
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Unit Type Selector - Only show if NOT Hotel type */}
            {tipoEstanciaClasificada !== "Hotel" && formState.checkInDate && formState.checkOutDate && (
              <div className="space-y-2">
                <Label htmlFor="unitType" className="text-base font-medium">
                  Tipo de Unidad <span className="text-red-500">*</span>
                </Label>
                {(!formState.checkInDate || !formState.checkOutDate) && (
                  <p className="text-sm text-gray-500">
                    Primero selecciona las fechas de check-in y check-out para ver los tipos de unidad disponibles.
                  </p>
                )}
                <Select
                  onValueChange={(value) => handleSelectChange("unitType", value)}
                  value={formState.unitType}
                  disabled={!formState.checkInDate || !formState.checkOutDate}
                >
                  <SelectTrigger className="w-full text-base" id="unitType">
                    <SelectValue placeholder="Selecciona un tipo de unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(unitTypes).map(([groupLabel, options]) => (
                      <SelectGroup key={groupLabel}>
                        <SelectLabel>{groupLabel}</SelectLabel>
                        {options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Estimación de Precio - Integrado en la sección de detalles */}
            {formState.unitType && formState.checkInDate && formState.checkOutDate && (
              <div className="mt-6 border-t pt-6">
                {estimatedPriceInfo.isAvailable && estimatedPriceInfo.monthlyPrice ? (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <p className="text-lg font-medium text-green-800">
                      Precio mensual estimado:{" "}
                      <span className="font-bold">
                        {estimatedPriceInfo.monthlyPrice.toLocaleString("es-ES", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </span>
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Este es un precio estimado "a partir de...". El precio final y la disponibilidad serán confirmados
                      por el equipo de leasing.
                    </p>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertTitle>No Disponible o Error de Cálculo</AlertTitle>
                    <AlertDescription>
                      {estimatedPriceInfo.message ||
                        "No se pudo calcular el precio para la selección actual. Por favor, verifica las fechas y el tipo de unidad o intenta con otra combinación."}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sección 3: Información Personal y Documentación Necesaria */}
        {tipoEstanciaClasificada !== "Hotel" &&
          formState.unitType &&
          formState.checkInDate &&
          formState.checkOutDate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-sm mr-2">
                    2
                  </span>
                  Información Personal y Documentación Necesaria
                </CardTitle>
                <CardDescription>
                  Proporciona tu información personal y sube los documentos requeridos para tu solicitud.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Name Fields - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-4 gap-y-6">
                  {/* First Name Input */}
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-base font-medium">
                      Nombre <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formState.firstName}
                      onChange={handleInputChange}
                      placeholder="Tu nombre"
                      className="text-base"
                    />
                  </div>

                  {/* Last Name Input */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-base font-medium">
                      Apellido/s <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formState.lastName}
                      onChange={handleInputChange}
                      placeholder="Tus apellidos"
                      className="text-base"
                    />
                  </div>
                </div>

                {/* Email and Phone - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-4 gap-y-6">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base font-medium">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formState.email}
                      onChange={handleInputChange}
                      placeholder="Tu email"
                      className="text-base"
                    />
                  </div>

                  {/* Phone Input */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-base font-medium">
                      Teléfono <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formState.phone}
                      onChange={handleInputChange}
                      placeholder="Tu número de teléfono"
                      className="text-base"
                    />
                  </div>
                </div>

                {/* Divider for Documentation Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Documentación Necesaria</h4>
                </div>

                {/* Sección específica para estancias largas (más de 3 meses) */}
                {tipoEstanciaRequisitos === "larga" && (
                  <div className="space-y-6">
                    {/* Pregunta sobre ingresos suficientes */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">
                        ¿Tienes ingresos suficientes? <span className="text-red-500">*</span>
                      </Label>
                      <span className="block text-sm font-normal mt-1 text-[rgba(255,31,7,1)]">
                        Se requieren ingresos mensuales de al menos{" "}
                        {ingresosMinimosMensuales.toLocaleString("es-ES", {
                          style: "currency",
                          currency: "EUR",
                        })}{" "}
                        (2x el precio mensual)
                      </span>

                      <RadioGroup
                        value={formState.tieneIngresosSuficientes}
                        onValueChange={(value) => handleSelectChange("tieneIngresosSuficientes", value)}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="si" id="ingresos-si" />
                          <Label htmlFor="ingresos-si" className="cursor-pointer">
                            Sí
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="ingresos-no" />
                          <Label htmlFor="ingresos-no" className="cursor-pointer">
                            No
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Si tiene ingresos suficientes, preguntar tipo de trabajador */}
                    {formState.tieneIngresosSuficientes === "si" && (
                      <div className="space-y-3">
                        <Label className="text-base font-medium">
                          ¿Eres trabajador o autónomo? <span className="text-red-500">*</span>
                        </Label>
                        <RadioGroup
                          value={formState.tipoTrabajador}
                          onValueChange={(value) => handleSelectChange("tipoTrabajador", value)}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="trabajador" id="tipo-trabajador" />
                            <Label htmlFor="tipo-trabajador" className="cursor-pointer">
                              Trabajador con nómina
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="autonomo" id="tipo-autonomo" />
                            <Label htmlFor="tipo-autonomo" className="cursor-pointer">
                              Autónomo
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}

                    {/* Si es autónomo, preguntar si es de la UE o fuera */}
                    {formState.tieneIngresosSuficientes === "si" && formState.tipoTrabajador === "autonomo" && (
                      <div className="space-y-3">
                        <Label className="text-base font-medium">
                          ¿Eres autónomo de la UE o fuera de la UE? <span className="text-red-500">*</span>
                        </Label>
                        <RadioGroup
                          value={formState.tipoAutonomo}
                          onValueChange={(value) => handleSelectChange("tipoAutonomo", value)}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="ue" id="autonomo-ue" />
                            <Label htmlFor="autonomo-ue" className="cursor-pointer">
                              Autónomo de la UE
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fuera-ue" id="autonomo-fuera-ue" />
                            <Label htmlFor="autonomo-fuera-ue" className="cursor-pointer">
                              Autónomo fuera de la UE
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}

                    {/* Información adicional según la selección */}
                    {formState.tieneIngresosSuficientes === "no" && (
                      <div className="space-y-4">
                        <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                          <InfoIcon className="h-4 w-4" />
                          <AlertTitle>Sin ingresos suficientes</AlertTitle>
                          <AlertDescription>
                            <p>Puedes continuar con tu solicitud eligiendo una de las siguientes opciones:</p>
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-3">
                          <Label className="text-base font-medium">
                            Selecciona una opción <span className="text-red-500">*</span>
                          </Label>
                          <RadioGroup
                            value={formState.opcionAvalista}
                            onValueChange={(value) => handleSelectChange("opcionAvalista", value)}
                            className="space-y-3"
                          >
                            <div className="flex items-start space-x-2">
                              <RadioGroupItem value="avalista" id="opcion-avalista" className="mt-1" />
                              <div className="space-y-1">
                                <Label htmlFor="opcion-avalista" className="cursor-pointer font-medium">
                                  Añadir Avalista
                                </Label>
                                <p className="text-sm text-gray-600">
                                  Presenta un avalista con ingresos ≥ 2,5 × renta neta y contrato indefinido &gt; 1 año.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-2">
                              <RadioGroupItem value="pago" id="opcion-pago" className="mt-1" />
                              <div className="space-y-1">
                                <Label htmlFor="opcion-pago" className="cursor-pointer font-medium">
                                  Pago por adelantado
                                </Label>
                                <p className="text-sm text-gray-600">
                                  Realiza el pago de la estancia por adelantado según las opciones disponibles.
                                </p>
                              </div>
                            </div>
                          </RadioGroup>
                        </div>

                        {formState.opcionAvalista === "pago" && (
                          <div className="space-y-3">
                            <Label className="text-base font-medium">
                              Opciones de pago <span className="text-red-500">*</span>
                            </Label>
                            <p className="text-sm text-gray-600 italic">
                              El pago se tendrá que realizar una vez confirmada la solicitud.
                            </p>
                            <RadioGroup
                              value={formState.opcionPago}
                              onValueChange={(value) => handleSelectChange("opcionPago", value)}
                              className="space-y-3"
                            >
                              <div className="flex items-start space-x-2">
                                <RadioGroupItem value="completo" id="pago-completo" className="mt-1" />
                                <div className="space-y-1">
                                  <Label htmlFor="pago-completo" className="cursor-pointer font-medium">
                                    Pago completo por adelantado
                                  </Label>
                                  <p className="text-sm text-gray-600">
                                    Paga toda la estancia por adelantado antes del check-in.
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start space-x-2">
                                <RadioGroupItem value="6meses" id="pago-6meses" className="mt-1" />
                                <div className="space-y-1">
                                  <Label htmlFor="pago-6meses" className="cursor-pointer font-medium">
                                    Pago de 6 meses + resto
                                  </Label>
                                  <p className="text-sm text-gray-600">
                                    Paga los primeros 6 meses por adelantado y el resto en una sola cuota.
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start space-x-2">
                                <RadioGroupItem value="3meses" id="pago-3meses" className="mt-1" />
                                <div className="space-y-1">
                                  <Label htmlFor="pago-3meses" className="cursor-pointer font-medium">
                                    Pago por tramos de 3 meses
                                  </Label>
                                  <p className="text-sm text-gray-600">
                                    Paga la estancia en tramos de 3 meses cada uno.
                                  </p>
                                </div>
                              </div>
                            </RadioGroup>
                          </div>
                        )}
                      </div>
                    )}

                    {formState.tieneIngresosSuficientes === "si" &&
                      formState.tipoTrabajador === "autonomo" &&
                      formState.tipoAutonomo === "fuera-ue" && (
                        <div className="space-y-4">
                          <Alert className="bg-green-50 border-green-200 text-green-800">
                            <InfoIcon className="h-4 w-4" />
                            <AlertTitle>Requisitos para autónomos fuera de la UE</AlertTitle>
                            <AlertDescription>
                              <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Pasaporte en vigor.</li>
                                <li>Se requiere pago por adelantado según las opciones disponibles.</li>
                              </ul>
                            </AlertDescription>
                          </Alert>

                          <div className="space-y-3">
                            <Label className="text-base font-medium">
                              Opciones de pago <span className="text-red-500">*</span>
                            </Label>
                            <RadioGroup
                              value={formState.opcionPago}
                              onValueChange={(value) => handleSelectChange("opcionPago", value)}
                              className="space-y-3"
                            >
                              <div className="flex items-start space-x-2">
                                <RadioGroupItem value="completo" id="pago-completo-autonomo" className="mt-1" />
                                <div className="space-y-1">
                                  <Label htmlFor="pago-completo-autonomo" className="cursor-pointer font-medium">
                                    Pago completo por adelantado
                                  </Label>
                                  <p className="text-sm text-gray-600">
                                    Paga toda la estancia por adelantado antes del check-in.
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start space-x-2">
                                <RadioGroupItem value="6meses" id="pago-6meses-autonomo" className="mt-1" />
                                <div className="space-y-1">
                                  <Label htmlFor="pago-6meses-autonomo" className="cursor-pointer font-medium">
                                    Pago de 6 meses + resto en el 6º mes
                                  </Label>
                                  <p className="text-sm text-gray-600">
                                    Paga los primeros 6 meses (7 días antes del check-in) y el resto en el 6º mes.
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start space-x-2">
                                <RadioGroupItem value="3meses" id="pago-3meses-autonomo" className="mt-1" />
                                <div className="space-y-1">
                                  <Label htmlFor="pago-3meses-autonomo" className="cursor-pointer font-medium">
                                    Pago por tramos de 3 meses
                                  </Label>
                                  <p className="text-sm text-gray-600">
                                    Paga la estancia en tramos de 3 meses cada uno.
                                  </p>
                                </div>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>
                      )}

                    {/* Si tiene ingresos suficientes, preguntar tipo de trabajador */}
                    {/* File Upload Fields - Conditionally Rendered Based on Requirements */}
                    {documentosRequeridos.length > 0 &&
                      !(
                        formState.tieneIngresosSuficientes === "si" &&
                        formState.tipoTrabajador === "autonomo" &&
                        !formState.tipoAutonomo
                      ) && (
                        <div className="space-y-6 mt-6">
                          <h4 className="text-lg font-medium text-gray-900">Documentos a adjuntar:</h4>
                          {documentosRequeridos.map((docKey) => {
                            const docConfig = documentosBaseConfig[docKey]
                            return (
                              <FileUploadField
                                key={docKey}
                                id={docKey}
                                label={docConfig.label}
                                description={docConfig.description}
                                onFileChange={handleFileChange}
                                files={formState[docKey] ? (formState[docKey] as File[]) : []}
                              />
                            )
                          })}
                        </div>
                      )}
                  </div>
                )}

                {/* Sección específica para estancias cortas (1-3 meses) */}
                {tipoEstanciaRequisitos === "corta" && (
                  <div className="space-y-6">
                    {/* Alert for short stay payment requirement */}
                    <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                      <InfoIcon className="h-4 w-4" />
                      <AlertTitle>Estancias de 1-3 meses</AlertTitle>
                      <AlertDescription>
                        <p>
                          Para estancias de entre 1 y 3 meses, el pago de la estancia debe realizarse en una sola cuota
                          por adelantado una vez confirmada la solicitud.
                        </p>
                      </AlertDescription>
                    </Alert>

                    {/* File Upload Fields for short stays */}
                    {documentosRequeridos.length > 0 && (
                      <div className="space-y-6 mt-6">
                        <h4 className="text-lg font-medium text-gray-900">Documentos a adjuntar:</h4>
                        {documentosRequeridos.map((docKey) => {
                          const docConfig = documentosBaseConfig[docKey]
                          return (
                            <FileUploadField
                              key={docKey}
                              id={docKey}
                              label={docConfig.label}
                              description={docConfig.description}
                              onFileChange={handleFileChange}
                              files={formState[docKey] ? (formState[docKey] as File[]) : []}
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        {/* Sección 4: Revisión y Envío */}
        {tipoEstanciaClasificada !== "Hotel" &&
          formState.unitType &&
          formState.checkInDate &&
          formState.checkOutDate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-sm mr-2">
                    3
                  </span>
                  Revisión y Envío
                </CardTitle>
                <CardDescription>Revisa los detalles de tu solicitud y envíala para su aprobación.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>
                    Por favor, revisa cuidadosamente la información proporcionada antes de enviar tu solicitud. Una vez
                    enviada, nuestro equipo la revisará y se pondrá en contacto contigo para confirmar la disponibilidad
                    y los siguientes pasos.
                  </p>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
                      <TooltipTrigger asChild>
                        <div className="inline-block">
                          <Button
                            type="submit"
                            disabled={submissionStatus === "submitting" || !isFormValid}
                            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white"
                            onMouseEnter={() => {
                              if (!isFormValid) setShowTooltip(true)
                            }}
                            onMouseLeave={() => setShowTooltip(false)}
                            onClick={(e) => {
                              if (!isFormValid) {
                                e.preventDefault()
                                setShowTooltip(true)
                                // Hide tooltip after 3 seconds when clicked
                                setTimeout(() => setShowTooltip(false), 3000)
                              }
                            }}
                          >
                            {submissionStatus === "submitting" ? "Enviando..." : "Enviar Solicitud"}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {!isFormValid && getValidationErrors.length > 0 && (
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-medium text-sm">Para enviar la solicitud necesitas:</p>
                            <ul className="text-xs space-y-1">
                              {getValidationErrors.map((error, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-red-500 mr-1">•</span>
                                  <span>{error}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  {submissionStatus === "success" && (
                    <Alert className="bg-green-50 border-green-200 text-green-800">
                      <AlertTitle>¡Solicitud enviada correctamente!</AlertTitle>
                      <AlertDescription>
                        <p>
                          Tu solicitud ha sido enviada a nuestro equipo. Recibirás una respuesta en tu email en un plazo
                          de 24-48 horas.
                        </p>
                        <p className="mt-2 font-medium">Próximos pasos:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>Revisaremos tu documentación</li>
                          <li>Confirmaremos la disponibilidad</li>
                          <li>Te contactaremos para finalizar el proceso</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  {submissionStatus === "error" && (
                    <Alert variant="destructive">
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        Por favor, completa todos los campos obligatorios y asegúrate de que la información sea
                        correcta.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
      </form>
    </div>
  )
}
