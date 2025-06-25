"use client";

import type React from "react";
import {
  useState,
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
} from "react";
import {
  format,
  differenceInCalendarMonths,
  isValid,
  getMonth,
  differenceInDays,
  addDays,
} from "date-fns";
import { es } from "date-fns/locale";
import { useForm, ValidationError } from "@formspree/react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CalendarIcon, InfoIcon, Eye, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// --- Lógica de Precios (sin cambios) ---
type UnitKey =
  | "Studio Estándar con Media Pensión"
  | "Studio Estándar con Terraza"
  | "Studio Rooftop"
  | "Studio Confort"
  | "2-Bed Apartment"
  | "2-Bed con Terraza"
  | "2-Bed Rooftop";

type StayTypeKey = "Hotel" | "Short" | "Mid" | "Long";
type SeasonKey =
  | "Abril"
  | "Mayo-Julio"
  | "Agosto-Septiembre"
  | "Octubre-Diciembre";

const priceTable: Record<
  UnitKey,
  Partial<Record<StayTypeKey, Partial<Record<SeasonKey, number | null>>>>
> = {
  "Studio Estándar con Media Pensión": {
    Hotel: {
      Abril: 2415,
      "Mayo-Julio": 2450,
      "Agosto-Septiembre": 2475,
      "Octubre-Diciembre": 2510,
    },
    Short: {
      Abril: 940,
      "Mayo-Julio": 950,
      "Agosto-Septiembre": 960,
      "Octubre-Diciembre": 975,
    },
    Mid: {
      Abril: 870,
      "Mayo-Julio": 880,
      "Agosto-Septiembre": 890,
      "Octubre-Diciembre": 900,
    },
    Long: {
      Abril: 755,
      "Mayo-Julio": 765,
      "Agosto-Septiembre": 775,
      "Octubre-Diciembre": 785,
    },
  },
  "Studio Estándar con Terraza": {
    Hotel: {
      Abril: 2825,
      "Mayo-Julio": 2865,
      "Agosto-Septiembre": 2895,
      "Octubre-Diciembre": 2940,
    },
    Short: {
      Abril: 1095,
      "Mayo-Julio": 1110,
      "Agosto-Septiembre": 1125,
      "Octubre-Diciembre": 1140,
    },
    Mid: {
      Abril: 1015,
      "Mayo-Julio": 1030,
      "Agosto-Septiembre": 1040,
      "Octubre-Diciembre": 1055,
    },
    Long: {
      Abril: 885,
      "Mayo-Julio": 895,
      "Agosto-Septiembre": 905,
      "Octubre-Diciembre": 920,
    },
  },
  "Studio Rooftop": {
    Hotel: {
      Abril: null,
      "Mayo-Julio": null,
      "Agosto-Septiembre": null,
      "Octubre-Diciembre": null,
    },
    Short: {
      Abril: 1135,
      "Mayo-Julio": 1150,
      "Agosto-Septiembre": 1165,
      "Octubre-Diciembre": 1180,
    },
    Mid: {
      Abril: 1045,
      "Mayo-Julio": 1060,
      "Agosto-Septiembre": 1070,
      "Octubre-Diciembre": 1085,
    },
    Long: {
      Abril: 910,
      "Mayo-Julio": 920,
      "Agosto-Septiembre": 930,
      "Octubre-Diciembre": 945,
    },
  },
  "Studio Confort": {
    Hotel: {
      Abril: 2700,
      "Mayo-Julio": 2740,
      "Agosto-Septiembre": 2770,
      "Octubre-Diciembre": 2810,
    },
    Short: {
      Abril: 1050,
      "Mayo-Julio": 1075,
      "Agosto-Septiembre": 1090,
      "Octubre-Diciembre": 1105,
    },
    Mid: {
      Abril: 970,
      "Mayo-Julio": 995,
      "Agosto-Septiembre": 1010,
      "Octubre-Diciembre": 1020,
    },
    Long: {
      Abril: 845,
      "Mayo-Julio": 865,
      "Agosto-Septiembre": 875,
      "Octubre-Diciembre": 890,
    },
  },
  "2-Bed Apartment": {
    Hotel: {
      Abril: null,
      "Mayo-Julio": null,
      "Agosto-Septiembre": null,
      "Octubre-Diciembre": null,
    },
    Short: {
      Abril: 1565,
      "Mayo-Julio": 1590,
      "Agosto-Septiembre": 1605,
      "Octubre-Diciembre": 1625,
    },
    Mid: {
      Abril: 1465,
      "Mayo-Julio": 1485,
      "Agosto-Septiembre": 1500,
      "Octubre-Diciembre": 1520,
    },
    Long: {
      Abril: 1275,
      "Mayo-Julio": 1290,
      "Agosto-Septiembre": 1305,
      "Octubre-Diciembre": 1325,
    },
  },
  "2-Bed con Terraza": {
    Hotel: {
      Abril: null,
      "Mayo-Julio": null,
      "Agosto-Septiembre": null,
      "Octubre-Diciembre": null,
    },
    Short: {
      Abril: 1540,
      "Mayo-Julio": 1560,
      "Agosto-Septiembre": 1575,
      "Octubre-Diciembre": 1600,
    },
    Mid: {
      Abril: 1440,
      "Mayo-Julio": 1460,
      "Agosto-Septiembre": 1475,
      "Octubre-Diciembre": 1495,
    },
    Long: {
      Abril: 1250,
      "Mayo-Julio": 1270,
      "Agosto-Septiembre": 1285,
      "Octubre-Diciembre": 1300,
    },
  },
  "2-Bed Rooftop": {
    Hotel: {
      Abril: null,
      "Mayo-Julio": null,
      "Agosto-Septiembre": null,
      "Octubre-Diciembre": null,
    },
    Short: {
      Abril: 1725,
      "Mayo-Julio": 1750,
      "Agosto-Septiembre": 1765,
      "Octubre-Diciembre": 1795,
    },
    Mid: {
      Abril: 1610,
      "Mayo-Julio": 1635,
      "Agosto-Septiembre": 1650,
      "Octubre-Diciembre": 1675,
    },
    Long: {
      Abril: 1400,
      "Mayo-Julio": 1425,
      "Agosto-Septiembre": 1435,
      "Octubre-Diciembre": 1460,
    },
  },
};

function getSeason(date: Date): SeasonKey {
  const month = getMonth(date);
  if (month === 3) return "Abril";
  if (month >= 4 && month <= 6) return "Mayo-Julio";
  if (month >= 7 && month <= 8) return "Agosto-Septiembre";
  return "Octubre-Diciembre";
}

function getStayType(from: Date, to: Date): StayTypeKey {
  const days = differenceInDays(to, from) + 1;
  const months = differenceInCalendarMonths(to, from);
  if (days < 1) throw new Error("Invalid date range");
  if (days < 28) return "Hotel";
  if (months === 0 && days >= 28) return "Short";
  if (months >= 0 && months < 3) return "Short";
  if (months >= 3 && months < 9) return "Mid";
  if (months >= 9) return "Long";
  return "Short";
}

interface EstimatedPriceResult {
  monthlyPrice?: number;
  totalPrice?: number;
  message?: string;
  isAvailable: boolean;
}

function calculateEstimatedPrice(
  unitType: UnitKey | string,
  checkInDate?: Date,
  checkOutDate?: Date
): EstimatedPriceResult {
  if (!unitType || !checkInDate || !checkOutDate) {
    return {
      message: "",
      isAvailable: false,
    };
  }

  if (
    !isValid(checkInDate) ||
    !isValid(checkOutDate) ||
    checkInDate >= checkOutDate
  ) {
    return { message: "", isAvailable: false };
  }

  const unit = priceTable[unitType as UnitKey];
  if (!unit) {
    return {
      message: `Tipo de unidad "${unitType}" no encontrado.`,
      isAvailable: false,
    };
  }

  const season = getSeason(checkInDate);
  const stayType = getStayType(checkInDate, checkOutDate);
  const durationMonths =
    differenceInCalendarMonths(checkOutDate, checkInDate) + 1;

  const stayTypePrices = unit[stayType];
  if (!stayTypePrices) {
    return {
      message: `La combinación de unidad "${unitType}" y tipo de estancia "${stayType}" no está disponible.`,
      isAvailable: false,
    };
  }

  const monthlyPrice = stayTypePrices[season];

  if (monthlyPrice === undefined || monthlyPrice === null) {
    return {
      message: `La combinación de unidad "${unitType}", tipo de estancia "${stayType}" y temporada de check-in "${season}" no está disponible. Por favor, elige otra opción.`,
      isAvailable: false,
    };
  }
  const totalPrice = monthlyPrice * durationMonths;
  return {
    monthlyPrice,
    totalPrice,
    message: ``,
    isAvailable: true,
  };
}
// --- Fin Lógica de Precios ---

interface FormState {
  unitType: string;
  checkInDate?: Date;
  checkOutDate?: Date;
  numberOfPeople: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Second person fields
  secondPersonFirstName: string;
  secondPersonLastName: string;
  secondPersonEmail: string;
  secondPersonPhone: string;
  tieneIngresosSuficientes: string;
  tipoTrabajador: string;
  tipoAutonomo: string;
  dniPasaporte: File[];
  nominas: File[];
  contratoLaboral: File[];
  certificadoBancario: File[];
  dniPasaporteAvalista: File[];
  nominasAvalista: File[];
  contratoLaboralAvalista: File[];
  modelo303: File[];
  declaracionRenta: File[];
  reciboAutonomos: File[];
  opcionPago: string;
  opcionAvalista: string;
}

const initialFormState: FormState = {
  unitType: "",
  checkInDate: undefined,
  checkOutDate: undefined,
  numberOfPeople: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  // Second person fields
  secondPersonFirstName: "",
  secondPersonLastName: "",
  secondPersonEmail: "",
  secondPersonPhone: "",
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
};

// Document configuration will be generated dynamically using translations
interface DocumentConfig {
  label: string;
  description: string;
}

const getDocumentosBaseConfig = (
  t: (key: string) => string
): Record<string, DocumentConfig> => ({
  dniPasaporte: {
    label: t("documents.dni_passport"),
    description: t("documents.dni_passport_description"),
  },
  nominas: {
    label: t("documents.payslips"),
    description: t("documents.payslips_description"),
  },
  contratoLaboral: {
    label: t("documents.employment_contract"),
    description: t("documents.employment_contract_description"),
  },
  certificadoBancario: {
    label: t("documents.bank_certificate"),
    description: t("documents.bank_certificate_description"),
  },
  dniPasaporteAvalista: {
    label: t("documents.dni_passport_guarantor"),
    description: t("documents.dni_passport_guarantor_description"),
  },
  nominasAvalista: {
    label: t("documents.payslips_guarantor"),
    description: t("documents.payslips_guarantor_description"),
  },
  contratoLaboralAvalista: {
    label: t("documents.employment_contract_guarantor"),
    description: t("documents.employment_contract_guarantor_description"),
  },
  modelo303: {
    label: t("documents.model_303"),
    description: t("documents.model_303_description"),
  },
  declaracionRenta: {
    label: t("documents.income_declaration"),
    description: t("documents.income_declaration_description"),
  },
  reciboAutonomos: {
    label: t("documents.freelance_receipt"),
    description: t("documents.freelance_receipt_description"),
  },
});

// File validation constants based on Formspree paid plan limits and best practices
const FILE_UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB per file (conservative limit for Formspree)
  maxTotalSize: 50 * 1024 * 1024, // 50MB total per form submission
  allowedTypes: {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg, .jpeg",
    "image/png": ".png",
    "image/jpg": ".jpg",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      ".docx",
    "text/plain": ".txt",
  },
  maxFilesPerField: 3,
};

interface FileValidationError {
  type: "size" | "format" | "count" | "total_size";
  message: string;
  fileName?: string;
}

// File validation utility functions
const validateFile = (file: File): FileValidationError[] => {
  const errors: FileValidationError[] = [];

  // Check file size
  if (file.size > FILE_UPLOAD_CONFIG.maxFileSize) {
    errors.push({
      type: "size",
      message: `El archivo "${file.name}" excede el tamaño máximo de ${(
        FILE_UPLOAD_CONFIG.maxFileSize /
        1024 /
        1024
      ).toFixed(1)}MB`,
      fileName: file.name,
    });
  }

  // Check file type
  if (!Object.keys(FILE_UPLOAD_CONFIG.allowedTypes).includes(file.type)) {
    const allowedExtensions = Object.values(
      FILE_UPLOAD_CONFIG.allowedTypes
    ).join(", ");
    errors.push({
      type: "format",
      message: `El archivo "${file.name}" no tiene un formato válido. Formatos permitidos: ${allowedExtensions}`,
      fileName: file.name,
    });
  }

  return errors;
};

const validateFiles = (
  files: File[],
  allFormFiles: FormState
): FileValidationError[] => {
  const errors: FileValidationError[] = [];

  // Check individual file validation
  files.forEach((file) => {
    errors.push(...validateFile(file));
  });

  // Check number of files per field
  if (files.length > FILE_UPLOAD_CONFIG.maxFilesPerField) {
    errors.push({
      type: "count",
      message: `Máximo ${FILE_UPLOAD_CONFIG.maxFilesPerField} archivos por campo`,
    });
  }

  // Check total size across all form files
  const totalSize = Object.values(allFormFiles)
    .filter((value): value is File[] => Array.isArray(value))
    .flat()
    .reduce((total, file) => total + file.size, 0);

  if (totalSize > FILE_UPLOAD_CONFIG.maxTotalSize) {
    errors.push({
      type: "total_size",
      message: `El tamaño total de archivos excede el límite de ${(
        FILE_UPLOAD_CONFIG.maxTotalSize /
        1024 /
        1024
      ).toFixed(1)}MB`,
    });
  }

  return errors;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

interface FileUploadProps {
  id: keyof FormState;
  label: string;
  description?: string;
  onFileChange: (id: keyof FormState, files: File[]) => void;
  files: File[];
  validationErrors?: FileValidationError[];
}

const FileUploadField: React.FC<
  FileUploadProps & { t: (key: string) => string }
> = ({
  id,
  label,
  description,
  onFileChange,
  files,
  validationErrors = [],
  t,
}) => {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      onFileChange(id, [...files, ...newFiles]);
    }
  };

  const handleViewFile = (file: File) => {
    const url = URL.createObjectURL(file);
    window.open(url, "_blank");
    // Clean up the URL after a delay to prevent memory leaks
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDeleteFile = (fileIndex: number) => {
    const updatedFiles = [...files];
    updatedFiles.splice(fileIndex, 1);
    onFileChange(id, updatedFiles);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-base font-medium">
        {label} <span className="text-red-500">*</span>
      </Label>
      {description && <p className="text-sm text-gray-500">{description}</p>}

      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <Input
            id={id}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(id)?.click()}
            className="bg-white hover:bg-gray-50"
          >
            {t("file_upload.add_files") || "Añadir archivos"}
          </Button>
          <span className="text-sm text-gray-600">
            {files.length === 0
              ? t("file_upload.no_files") || "No hay archivos seleccionados"
              : `${files.length} ${
                  t("file_upload.files_selected") || "archivo(s)"
                }`}
          </span>
        </div>

        {files.length > 0 && (
          <div className="mt-2 space-y-2">
            <p className="text-sm font-medium text-gray-700">
              {t("documents_section.file_info_title") ||
                "Archivos seleccionados:"}
            </p>
            <div className="max-h-48 overflow-y-auto border rounded-md bg-gray-50">
              <ul className="divide-y divide-gray-200">
                {files.map((file, index) => (
                  <li
                    key={index}
                    className="p-2 flex items-center justify-between"
                  >
                    <div className="truncate text-sm text-gray-600 max-w-[200px] md:max-w-xs">
                      {file.name}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleViewFile(file)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">
                          {t("file_upload.view_file") || "Ver"}
                        </span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteFile(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">
                          {t("file_upload.delete_file") || "Eliminar"}
                        </span>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* File validation errors display */}
        {validationErrors.length > 0 && (
          <div className="mt-2 space-y-1">
            {validationErrors.map((error, index) => (
              <div
                key={index}
                className="flex items-start space-x-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function SolicitudReservaForm() {
  // Initialize translation hook
  const { t } = useTranslation();

  // Initialize Formspree hook
  const [formspreeState, handleFormspreeSubmit] = useForm("mwpbqgjn");

  // Create the documents config with translations
  const documentosBaseConfig = useMemo(() => getDocumentosBaseConfig(t), [t]);

  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [, setProgress] = useState(0);
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [estimatedPriceInfo, setEstimatedPriceInfo] =
    useState<EstimatedPriceResult>({ isAvailable: false });
  const [showTooltip, setShowTooltip] = useState(false);
  const estanciaDuracionMeses = useMemo(() => {
    if (formState.checkInDate && formState.checkOutDate) {
      const from = new Date(formState.checkInDate);
      const to = new Date(formState.checkOutDate);
      if (isValid(from) && isValid(to) && to > from) {
        return differenceInCalendarMonths(to, from) + 1;
      }
    }
    return 0;
  }, [formState.checkInDate, formState.checkOutDate]);

  const tipoEstanciaClasificada = useMemo(() => {
    if (formState.checkInDate && formState.checkOutDate) {
      const from = new Date(formState.checkInDate);
      const to = new Date(formState.checkOutDate);
      if (isValid(from) && isValid(to) && to > from) {
        return getStayType(from, to);
      }
    }
    return null;
  }, [formState.checkInDate, formState.checkOutDate]);

  const tipoEstanciaRequisitos = useMemo(() => {
    if (estanciaDuracionMeses === 0) return null;
    if (estanciaDuracionMeses >= 1 && estanciaDuracionMeses <= 3)
      return "corta";
    if (estanciaDuracionMeses > 3) return "larga";
    return null;
  }, [estanciaDuracionMeses]);

  // Determinar el número total de pasos según el tipo de estancia
  // Currently not used but kept for future implementation
  /*
  const totalSteps = useMemo(() => {
    if (!tipoEstanciaClasificada) return 4;
    if (tipoEstanciaClasificada === "Hotel") return 2;
    if (tipoEstanciaRequisitos === "corta") return 3;
    return 4;
  }, [tipoEstanciaClasificada, tipoEstanciaRequisitos]);
  */

  // Actualizar el paso actual basado en el progreso del formulario
  // Currently not used but kept for future implementation
  /*
  useEffect(() => {
    if (formState.checkInDate && formState.checkOutDate) {
      setCurrentStep(1);
      if (tipoEstanciaClasificada === "Hotel") {
        setCurrentStep(1);
      } else if (formState.unitType) {
        setCurrentStep(2);
        if (
          tipoEstanciaRequisitos === "larga" &&
          !formState.tieneIngresosSuficientes
        ) {
          setCurrentStep(2);
        } else if (
          (tipoEstanciaRequisitos === "larga" &&
            formState.tieneIngresosSuficientes) ||
          tipoEstanciaRequisitos === "corta"
        ) {
          if (formState.email && formState.phone) {
            setCurrentStep(3);
          } else {
            setCurrentStep(2);
          }
        }
      }
    } else {
      setCurrentStep(0);
    }
  }, [formState, tipoEstanciaClasificada, tipoEstanciaRequisitos]);
  */

  useEffect(() => {
    const priceResult = calculateEstimatedPrice(
      formState.unitType,
      formState.checkInDate,
      formState.checkOutDate
    );
    setEstimatedPriceInfo(priceResult);
  }, [formState.unitType, formState.checkInDate, formState.checkOutDate]);

  // Determinar documentos requeridos basados en las selecciones del usuario
  const documentosRequeridos = useMemo((): string[] => {
    if (tipoEstanciaRequisitos === "corta") {
      return ["dniPasaporte"];
    }

    if (tipoEstanciaRequisitos === "larga") {
      // Documentos base para todos
      const documentosBase = ["dniPasaporte"];

      // Si no tiene ingresos suficientes
      if (formState.tieneIngresosSuficientes === "no") {
        if (formState.opcionAvalista === "avalista") {
          return [
            ...documentosBase,
            "dniPasaporteAvalista",
            "nominasAvalista",
            "contratoLaboralAvalista",
          ];
        }
        return documentosBase;
      }

      // Si tiene ingresos suficientes
      if (formState.tieneIngresosSuficientes === "si") {
        // Si es trabajador
        if (formState.tipoTrabajador === "trabajador") {
          return [
            ...documentosBase,
            "contratoLaboral",
            "nominas",
            "certificadoBancario",
          ];
        }

        // Si es autónomo
        if (formState.tipoTrabajador === "autonomo") {
          // Si es autónomo fuera de la UE, solo requiere DNI/Pasaporte/NIE
          if (formState.tipoAutonomo === "fuera-ue") {
            return documentosBase; // Solo DNI/Pasaporte/NIE
          }

          // Si es autónomo de la UE, requiere todos los documentos
          const docsAutonomo = [
            ...documentosBase,
            "modelo303",
            "declaracionRenta",
            "reciboAutonomos",
            "certificadoBancario",
          ];

          return docsAutonomo;
        }
      }
    }

    return [];
  }, [
    tipoEstanciaRequisitos,
    formState.tieneIngresosSuficientes,
    formState.tipoTrabajador,
    formState.tipoAutonomo,
    formState.opcionAvalista,
  ]);

  const camposObligatoriosBase = [
    "unitType",
    "checkInDate",
    "checkOutDate",
    "firstName",
    "lastName",
    "email",
    "phone",
  ];

  useEffect(() => {
    let completedFields = 0;
    let totalRequiredFields = camposObligatoriosBase.length;

    if (formState.unitType) completedFields++;
    if (formState.checkInDate) completedFields++;
    if (formState.checkOutDate) completedFields++;
    if (formState.firstName.trim() !== "") completedFields++;
    if (formState.lastName.trim() !== "") completedFields++;
    if (formState.email.trim() !== "" && /\S+@\S+\.\S+/.test(formState.email))
      completedFields++;
    if (formState.phone.trim() !== "") completedFields++;

    if (tipoEstanciaRequisitos === "larga") {
      totalRequiredFields++;
      if (formState.tieneIngresosSuficientes) completedFields++;

      if (formState.tieneIngresosSuficientes === "no") {
        totalRequiredFields++;
        if (formState.opcionAvalista) completedFields++;

        if (formState.opcionAvalista === "pago") {
          totalRequiredFields++;
          if (formState.opcionPago) completedFields++;
        }
      }

      if (formState.tieneIngresosSuficientes === "si") {
        totalRequiredFields++;
        if (formState.tipoTrabajador) completedFields++;

        if (formState.tipoTrabajador === "autonomo") {
          totalRequiredFields++;
          if (formState.tipoAutonomo) completedFields++;

          if (formState.tipoAutonomo === "fuera-ue") {
            totalRequiredFields++;
            if (formState.opcionPago) completedFields++;
          }
        }
      }
    }

    documentosRequeridos.forEach((docKey) => {
      totalRequiredFields++;
      if (formState[docKey]?.length > 0) completedFields++;
    });

    const isPriceCombinationValid = estimatedPriceInfo.isAvailable;
    if (!isPriceCombinationValid) totalRequiredFields++;

    setProgress(
      totalRequiredFields > 0
        ? (completedFields / totalRequiredFields) * 100
        : 0
    );
  }, [
    formState,
    tipoEstanciaRequisitos,
    documentosRequeridos,
    estimatedPriceInfo.isAvailable,
    camposObligatoriosBase.length,
  ]);

  const handleFileChange = (id: keyof FormState, files: File[]) => {
    setFormState((prev) => ({ ...prev, [id]: files }));
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof FormState, value: string) => {
    setFormState((prev) => {
      const newState = { ...prev, [name]: value };

      // If changing unit type to "Studio Estándar con Media Pensión", force numberOfPeople to "1"
      if (
        name === "unitType" &&
        value === "Studio Estándar con Media Pensión"
      ) {
        newState.numberOfPeople = "1";
        // Clear second person fields since they're no longer valid
        newState.secondPersonFirstName = "";
        newState.secondPersonLastName = "";
        newState.secondPersonEmail = "";
        newState.secondPersonPhone = "";
      }

      return newState;
    });
  };

  const handleDateChange = (
    field: "checkInDate" | "checkOutDate",
    date?: Date
  ) => {
    setFormState((prev) => {
      const newState = { ...prev, [field]: date };
      if (
        field === "checkInDate" &&
        date &&
        newState.checkOutDate &&
        date >= newState.checkOutDate
      ) {
        newState.checkOutDate = addDays(date, 1);
      }
      if (
        field === "checkOutDate" &&
        date &&
        newState.checkInDate &&
        date <= newState.checkInDate
      ) {
        newState.checkInDate = addDays(date, -1);
      }
      return newState;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!estimatedPriceInfo.isAvailable) {
      setSubmissionStatus("error");
      alert(t("alerts.availability_message"));
      return;
    }

    setSubmissionStatus("submitting");

    // Prepare form data for Formspree submission
    const formData = new FormData();

    // Add all form fields
    formData.append("numberOfPeople", formState.numberOfPeople);
    formData.append("firstName", formState.firstName);
    formData.append("lastName", formState.lastName);
    formData.append("email", formState.email);
    formData.append("phone", formState.phone);

    // Add second person information if applicable
    if (formState.numberOfPeople === "2") {
      formData.append("secondPersonFirstName", formState.secondPersonFirstName);
      formData.append("secondPersonLastName", formState.secondPersonLastName);
      formData.append("secondPersonEmail", formState.secondPersonEmail);
      formData.append("secondPersonPhone", formState.secondPersonPhone);
    }
    formData.append("unitType", formState.unitType);
    formData.append(
      "checkInDate",
      formState.checkInDate ? format(formState.checkInDate, "dd/MM/yyyy") : ""
    );
    formData.append(
      "checkOutDate",
      formState.checkOutDate ? format(formState.checkOutDate, "dd/MM/yyyy") : ""
    );
    formData.append("duracionMeses", estanciaDuracionMeses.toString());
    formData.append(
      "precioMensualEstimado",
      estimatedPriceInfo.monthlyPrice?.toString() || ""
    );
    formData.append(
      "precioTotalEstimado",
      estimatedPriceInfo.totalPrice?.toString() || ""
    );
    formData.append(
      "tieneIngresosSuficientes",
      formState.tieneIngresosSuficientes
    );
    formData.append("tipoTrabajador", formState.tipoTrabajador);
    formData.append("tipoAutonomo", formState.tipoAutonomo);
    formData.append("opcionAvalista", formState.opcionAvalista);
    formData.append("opcionPago", formState.opcionPago);

    // Add document files with validation (paid Formspree plan)
    let hasValidationErrors = false;

    documentosRequeridos.forEach((docKey) => {
      const files = formState[docKey];
      if (files && files.length > 0) {
        // Validate files before submission
        const validationErrors = validateFiles(files, formState);
        if (validationErrors.length > 0) {
          hasValidationErrors = true;
          console.error(`Validation errors for ${docKey}:`, validationErrors);
          return;
        }

        formData.append(`${docKey}_count`, files.length.toString());
        files.forEach((file, index) => {
          // Add actual files for paid Formspree plan
          formData.append(`${docKey}_${index}`, file);
          formData.append(`${docKey}_${index}_name`, file.name);
          formData.append(`${docKey}_${index}_size`, formatFileSize(file.size));
        });
      }
    });

    // Check if validation errors occurred
    if (hasValidationErrors) {
      setSubmissionStatus("error");
      alert(t("alerts.file_errors_message"));
      return;
    }

    // Submit to Formspree
    try {
      console.log("Submitting to Formspree with form ID: mwpbqgjn");
      console.log("Form data being submitted:", {
        firstName: formState.firstName,
        lastName: formState.lastName,
        email: formState.email,
        unitType: formState.unitType,
        // Don't log file objects, just count
        fileCount: documentosRequeridos.reduce(
          (count, docKey) => count + (formState[docKey]?.length || 0),
          0
        ),
      });

      await handleFormspreeSubmit(formData);
      console.log("Form submitted successfully to Formspree");
      setSubmissionStatus("success");
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmissionStatus("error");
    }
  };

  const unitTypes = {
    [t("unit_types.studios")]: [
      "Studio Estándar con Media Pensión",
      "Studio Estándar con Terraza",
      "Studio Confort",
      "Studio Rooftop",
    ],
    [t("unit_types.two_bed_apartments")]: [
      "2-Bed Apartment",
      "2-Bed con Terraza",
      "2-Bed Rooftop",
    ],
  };

  const isFormValid = useMemo(() => {
    // Check basic required fields
    const basicFieldsValid =
      formState.numberOfPeople !== "" &&
      formState.firstName.trim() !== "" &&
      formState.lastName.trim() !== "" &&
      formState.email.trim() !== "" &&
      /\S+@\S+\.\S+/.test(formState.email) &&
      formState.phone.trim() !== "" &&
      formState.unitType !== "" &&
      formState.checkInDate &&
      formState.checkOutDate &&
      estimatedPriceInfo.isAvailable &&
      // Check second person fields if 2 people selected
      (formState.numberOfPeople === "1" ||
        (formState.numberOfPeople === "2" &&
          formState.secondPersonFirstName.trim() !== "" &&
          formState.secondPersonLastName.trim() !== "" &&
          formState.secondPersonEmail.trim() !== "" &&
          /\S+@\S+\.\S+/.test(formState.secondPersonEmail) &&
          formState.secondPersonPhone.trim() !== ""));

    // Check minimum duration for Studio Estándar con Media Pensión (9 months minimum)
    let durationValid = true;
    if (
      formState.unitType === "Studio Estándar con Media Pensión" &&
      formState.checkInDate &&
      formState.checkOutDate
    ) {
      const from = new Date(formState.checkInDate);
      const to = new Date(formState.checkOutDate);
      if (isValid(from) && isValid(to) && to > from) {
        const months = differenceInCalendarMonths(to, from) + 1;
        durationValid = months >= 9;
      }
    }

    // Check situation fields for long stays
    let situationValid = true;
    if (tipoEstanciaRequisitos === "larga") {
      situationValid = formState.tieneIngresosSuficientes !== "";

      if (formState.tieneIngresosSuficientes === "no") {
        situationValid = situationValid && formState.opcionAvalista !== "";

        if (formState.opcionAvalista === "pago") {
          situationValid = situationValid && formState.opcionPago !== "";
        }
      }

      if (formState.tieneIngresosSuficientes === "si") {
        situationValid = situationValid && formState.tipoTrabajador !== "";

        if (formState.tipoTrabajador === "autonomo") {
          situationValid = situationValid && formState.tipoAutonomo !== "";

          if (formState.tipoAutonomo === "fuera-ue") {
            situationValid = situationValid && formState.opcionPago !== "";
          }
        }
      }
    }

    // Check required documents
    const documentsValid = documentosRequeridos.every(
      (docKey) => formState[docKey]?.length > 0
    );

    return (
      basicFieldsValid && durationValid && situationValid && documentsValid
    );
  }, [
    formState,
    tipoEstanciaRequisitos,
    documentosRequeridos,
    estimatedPriceInfo.isAvailable,
  ]);

  const getValidationErrors = useMemo(() => {
    const errors: string[] = [];

    // Check basic required fields
    if (!formState.numberOfPeople) errors.push(t("validations.select_people"));
    if (!formState.unitType) errors.push(t("validations.select_unit"));
    if (!formState.checkInDate) errors.push(t("validations.select_checkin"));
    if (!formState.checkOutDate) errors.push(t("validations.select_checkout"));
    if (!formState.firstName.trim()) errors.push(t("validations.enter_name"));
    if (!formState.lastName.trim())
      errors.push(t("validations.enter_lastname"));
    if (!formState.email.trim()) errors.push(t("validations.enter_email"));
    else if (!/\S+@\S+\.\S+/.test(formState.email))
      errors.push(t("validations.enter_valid_email"));
    if (!formState.phone.trim()) errors.push(t("validations.enter_phone"));

    // Check second person fields if 2 people selected
    if (formState.numberOfPeople === "2") {
      if (!formState.secondPersonFirstName.trim())
        errors.push(t("validations.enter_second_name"));
      if (!formState.secondPersonLastName.trim())
        errors.push(t("validations.enter_second_lastname"));
      if (!formState.secondPersonEmail.trim())
        errors.push(t("validations.enter_second_email"));
      else if (!/\S+@\S+\.\S+/.test(formState.secondPersonEmail))
        errors.push(t("validations.enter_second_valid_email"));
      if (!formState.secondPersonPhone.trim())
        errors.push(t("validations.enter_second_phone"));
    }

    // Check price combination validity
    if (!estimatedPriceInfo.isAvailable) {
      errors.push(t("validations.combination_not_available"));
    }

    // Check minimum duration for Studio Estándar con Media Pensión (9 months minimum)
    if (
      formState.unitType === "Studio Estándar con Media Pensión" &&
      formState.checkInDate &&
      formState.checkOutDate
    ) {
      const from = new Date(formState.checkInDate);
      const to = new Date(formState.checkOutDate);
      if (isValid(from) && isValid(to) && to > from) {
        const months = differenceInCalendarMonths(to, from) + 1;
        if (months < 9) {
          errors.push(t("validations.minimum_stay_required"));
        }
      }
    }

    // Check situation fields for long stays
    if (tipoEstanciaRequisitos === "larga") {
      if (!formState.tieneIngresosSuficientes) {
        errors.push(t("validations.indicate_sufficient_income"));
      }

      if (
        formState.tieneIngresosSuficientes === "no" &&
        !formState.opcionAvalista
      ) {
        errors.push(t("validations.select_option_continue"));
      }

      if (
        formState.tieneIngresosSuficientes === "no" &&
        formState.opcionAvalista === "pago" &&
        !formState.opcionPago
      ) {
        errors.push(t("validations.select_payment_option"));
      }

      if (
        formState.tieneIngresosSuficientes === "si" &&
        !formState.tipoTrabajador
      ) {
        errors.push(t("validations.select_worker_type"));
      }

      if (formState.tipoTrabajador === "autonomo" && !formState.tipoAutonomo) {
        errors.push(t("validations.indicate_eu_autonomous"));
      }

      if (
        formState.tipoTrabajador === "autonomo" &&
        formState.tipoAutonomo === "fuera-ue" &&
        !formState.opcionPago
      ) {
        errors.push(t("validations.select_payment_option"));
      }
    }

    // Check required documents
    documentosRequeridos.forEach((docKey) => {
      if (!formState[docKey] || formState[docKey].length === 0) {
        const docConfig = documentosBaseConfig[docKey];
        errors.push(`${t("validations.attach_document")} ${docConfig.label}`);
      }
    });

    return errors;
  }, [
    formState,
    tipoEstanciaRequisitos,
    documentosRequeridos,
    estimatedPriceInfo.isAvailable,
    documentosBaseConfig,
    t,
  ]);

  // Calcular los ingresos mínimos requeridos (2x el precio mensual)
  const ingresosMinimosMensuales = useMemo(() => {
    if (estimatedPriceInfo.isAvailable && estimatedPriceInfo.monthlyPrice) {
      return estimatedPriceInfo.monthlyPrice * 2;
    }
    return 0;
  }, [estimatedPriceInfo]);

  return (
    <div className="space-y-8">
      {/* Sección de introducción y guía del proceso */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
              <InfoIcon className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-xl text-blue-900 md:text-xl">
              {t("form.title")}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-blue-800 font-medium">
              {t("process_steps.process_description")}
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-blue-700">
              <li>{t("process_steps.step_1")}</li>
              <li>{t("process_steps.step_2")}</li>
              <li>{t("process_steps.step_3")}</li>
              <li>{t("process_steps.step_4")}</li>
            </ol>
            <div className="bg-blue-100 p-3 rounded-lg border-l-4 border-blue-400">
              <p className="text-blue-800 text-sm font-medium">
                {t("process_steps.team_review")}
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
              {t("form_sections.unit_selection")}
            </CardTitle>
            <CardDescription>
              {t("process_steps.begin_selection")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Selectors - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-4 gap-y-6">
              {/* Check-in Date Selector */}
              <div className="space-y-2">
                <Label htmlFor="checkInDate" className="text-base font-medium">
                  {t("dates.check_in_date")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="checkInDate"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal text-base",
                        !formState.checkInDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formState.checkInDate ? (
                        format(formState.checkInDate, "LLL dd, y", {
                          locale: es,
                        })
                      ) : (
                        <span>{t("dates.select_date")}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formState.checkInDate}
                      onSelect={(date) => handleDateChange("checkInDate", date)}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Check-out Date Selector */}
              <div className="space-y-2">
                <Label htmlFor="checkOutDate" className="text-base font-medium">
                  {t("dates.check_out_date")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="checkOutDate"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal text-base",
                        !formState.checkOutDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formState.checkOutDate ? (
                        format(formState.checkOutDate, "LLL dd, y", {
                          locale: es,
                        })
                      ) : (
                        <span>{t("dates.select_date")}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formState.checkOutDate}
                      onSelect={(date) =>
                        handleDateChange("checkOutDate", date)
                      }
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
              <Alert
                variant="default"
                className="bg-sky-50 border-sky-300 text-sky-700"
              >
                <InfoIcon className="h-4 w-4" />
                <AlertTitle className="font-semibold">
                  {t("alerts.short_stays")}
                </AlertTitle>
                <AlertDescription>
                  <p>{t("alerts.short_stays_message")}</p>
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
                      {t("alerts.go_to_expedia")}
                    </a>
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Unit Type Selector - Only show if NOT Hotel type */}
            {tipoEstanciaClasificada !== "Hotel" &&
              formState.checkInDate &&
              formState.checkOutDate && (
                <div className="space-y-2">
                  <Label htmlFor="unitType" className="text-base font-medium">
                    {t("unit_types.unit_type")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  {(!formState.checkInDate || !formState.checkOutDate) && (
                    <p className="text-sm text-gray-500">
                      {t("dates.first_select_dates")}
                    </p>
                  )}
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange("unitType", value)
                    }
                    value={formState.unitType}
                    disabled={!formState.checkInDate || !formState.checkOutDate}
                  >
                    <SelectTrigger className="w-full text-base" id="unitType">
                      <SelectValue
                        placeholder={t("dates.select_unit_placeholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(unitTypes).map(
                        ([groupLabel, options]) => (
                          <SelectGroup key={groupLabel}>
                            <SelectLabel>{groupLabel}</SelectLabel>
                            {options.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

            {/* Alert for Studio Estándar con Media Pensión minimum duration */}
            {formState.unitType === "Studio Estándar con Media Pensión" &&
              formState.checkInDate &&
              formState.checkOutDate &&
              (() => {
                const from = new Date(formState.checkInDate);
                const to = new Date(formState.checkOutDate);
                if (isValid(from) && isValid(to) && to > from) {
                  const months = differenceInCalendarMonths(to, from) + 1;
                  return months < 9;
                }
                return false;
              })() && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>
                    {t("validations.insufficient_duration")}
                  </AlertTitle>
                  <AlertDescription>
                    <p>
                      <strong>Studio Estándar con Media Pensión</strong>{" "}
                      {t("validation.requires_minimum_stay")}{" "}
                      <strong>{t("validation.nine_months")}</strong>.
                    </p>
                    <p className="mt-1">
                      {t("validations.current_duration")}{" "}
                      <strong>
                        {(() => {
                          const from = new Date(formState.checkInDate!);
                          const to = new Date(formState.checkOutDate!);
                          const months =
                            differenceInCalendarMonths(to, from) + 1;
                          return `${months} ${
                            months !== 1
                              ? t("validations.months")
                              : t("validations.month")
                          }`;
                        })()}
                      </strong>
                    </p>
                    <p className="mt-1 text-sm">
                      {t("validations.adjust_dates_message")}
                    </p>
                  </AlertDescription>
                </Alert>
              )}

            {/* Estimación de Precio - Integrado en la sección de detalles */}
            {formState.unitType &&
              formState.checkInDate &&
              formState.checkOutDate &&
              // Only show price estimation if duration is valid for Studio Estándar con Media Pensión
              !(
                formState.unitType === "Studio Estándar con Media Pensión" &&
                formState.checkInDate &&
                formState.checkOutDate &&
                (() => {
                  const from = new Date(formState.checkInDate);
                  const to = new Date(formState.checkOutDate);
                  if (isValid(from) && isValid(to) && to > from) {
                    const months = differenceInCalendarMonths(to, from) + 1;
                    return months < 9;
                  }
                  return false;
                })()
              ) && (
                <div className="mt-6 border-t pt-6">
                  {estimatedPriceInfo.isAvailable &&
                  estimatedPriceInfo.monthlyPrice ? (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <p className="text-lg font-medium text-green-800">
                        {t("pricing.estimated_monthly_price")}{" "}
                        <span className="font-bold">
                          {estimatedPriceInfo.monthlyPrice.toLocaleString(
                            "es-ES",
                            {
                              style: "currency",
                              currency: "EUR",
                            }
                          )}
                        </span>
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        {t("pricing.from_price_disclaimer")}
                      </p>
                    </div>
                  ) : (
                    <Alert variant="destructive">
                      <AlertTitle>
                        {t("price_section.not_available_title")}
                      </AlertTitle>
                      <AlertDescription>
                        {estimatedPriceInfo.message ||
                          t("price_section.not_available_message")}
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
          formState.checkOutDate &&
          // Only show this section if duration is valid for Studio Estándar con Media Pensión
          !(
            formState.unitType === "Studio Estándar con Media Pensión" &&
            formState.checkInDate &&
            formState.checkOutDate &&
            (() => {
              const from = new Date(formState.checkInDate);
              const to = new Date(formState.checkOutDate);
              if (isValid(from) && isValid(to) && to > from) {
                const months = differenceInCalendarMonths(to, from) + 1;
                return months < 9;
              }
              return false;
            })()
          ) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-sm mr-2">
                    2
                  </span>
                  {t("form_sections.personal_info")}
                </CardTitle>
                <CardDescription>
                  {t("form_sections.personal_info_description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Number of People Selector */}
                <div className="space-y-2">
                  <Label
                    htmlFor="numberOfPeople"
                    className="text-base font-medium"
                  >
                    {t("number_of_people.label")}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange("numberOfPeople", value)
                    }
                    value={formState.numberOfPeople}
                  >
                    <SelectTrigger
                      className="w-full text-base"
                      id="numberOfPeople"
                    >
                      <SelectValue
                        placeholder={t("validations.select_people")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">
                        {t("number_of_people.one_person")}
                      </SelectItem>
                      <SelectItem
                        value="2"
                        disabled={
                          formState.unitType ===
                          "Studio Estándar con Media Pensión"
                        }
                      >
                        {t("number_of_people.two_people")}
                        {formState.unitType ===
                          "Studio Estándar con Media Pensión" &&
                          ` ${t("unit_types.not_available_unit")}`}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {formState.unitType ===
                    "Studio Estándar con Media Pensión" && (
                    <p className="text-sm text-gray-600">
                      <InfoIcon className="inline w-4 h-4 mr-1" />
                      {t("number_of_people.restriction_message")}
                    </p>
                  )}
                </div>

                {/* First Person Fields */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">
                    {formState.numberOfPeople === "2"
                      ? t("personal_info.first_person_title")
                      : t("personal_info.section_title")}
                  </h4>

                  {/* Name Fields - Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-4 gap-y-6">
                    {/* First Name Input */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="firstName"
                        className="text-base font-medium"
                      >
                        {t("personal_info.name_label")}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formState.firstName}
                        onChange={handleInputChange}
                        placeholder={t("personal_info.name_placeholder")}
                        className="text-base"
                      />
                    </div>

                    {/* Last Name Input */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="lastName"
                        className="text-base font-medium"
                      >
                        {t("personal_info.lastname_label")}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formState.lastName}
                        onChange={handleInputChange}
                        placeholder={t("personal_info.lastname_placeholder")}
                        className="text-base"
                      />
                    </div>
                  </div>

                  {/* Email and Phone - Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-4 gap-y-6">
                    {/* Email Input */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-base font-medium">
                        {t("personal_info.email_label")}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        id="email"
                        name="email"
                        value={formState.email}
                        onChange={handleInputChange}
                        placeholder={t("personal_info.email_placeholder")}
                        className="text-base"
                      />
                    </div>

                    {/* Phone Input */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-base font-medium">
                        {t("personal_info.phone_label")}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formState.phone}
                        onChange={handleInputChange}
                        placeholder={t("personal_info.phone_placeholder")}
                        className="text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Second Person Fields - Only show if 2 people selected */}
                {formState.numberOfPeople === "2" && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">
                      {t("personal_info.second_person_title")}
                    </h4>

                    {/* Second Person Name Fields - Side by Side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-4 gap-y-6">
                      {/* Second Person First Name */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="secondPersonFirstName"
                          className="text-base font-medium"
                        >
                          {t("personal_info.name_label")}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="text"
                          id="secondPersonFirstName"
                          name="secondPersonFirstName"
                          value={formState.secondPersonFirstName}
                          onChange={handleInputChange}
                          placeholder={t(
                            "personal_info.second_name_placeholder"
                          )}
                          className="text-base"
                        />
                      </div>

                      {/* Second Person Last Name */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="secondPersonLastName"
                          className="text-base font-medium"
                        >
                          {t("personal_info.lastname_label")}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="text"
                          id="secondPersonLastName"
                          name="secondPersonLastName"
                          value={formState.secondPersonLastName}
                          onChange={handleInputChange}
                          placeholder={t(
                            "personal_info.second_lastname_placeholder"
                          )}
                          className="text-base"
                        />
                      </div>
                    </div>

                    {/* Second Person Contact Fields - Side by Side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-4 gap-y-6">
                      {/* Second Person Email */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="secondPersonEmail"
                          className="text-base font-medium"
                        >
                          {t("personal_info.email_label")}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="email"
                          id="secondPersonEmail"
                          name="secondPersonEmail"
                          value={formState.secondPersonEmail}
                          onChange={handleInputChange}
                          placeholder={t(
                            "personal_info.second_email_placeholder"
                          )}
                          className="text-base"
                        />
                      </div>

                      {/* Second Person Phone */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="secondPersonPhone"
                          className="text-base font-medium"
                        >
                          {t("personal_info.phone_label")}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="tel"
                          id="secondPersonPhone"
                          name="secondPersonPhone"
                          value={formState.secondPersonPhone}
                          onChange={handleInputChange}
                          placeholder={t(
                            "personal_info.second_phone_placeholder"
                          )}
                          className="text-base"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Divider for Documentation Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    {t("documents_section.title")}
                  </h4>
                </div>

                {/* Sección específica para estancias largas (más de 3 meses) */}
                {tipoEstanciaRequisitos === "larga" && (
                  <div className="space-y-6">
                    {/* Pregunta sobre ingresos suficientes */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">
                        {t("employment.sufficient_income")}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <span className="block text-sm font-normal mt-1 text-[rgba(255,31,7,1)]">
                        {t("employment.minimum_income_required")}{" "}
                        {ingresosMinimosMensuales.toLocaleString("es-ES", {
                          style: "currency",
                          currency: "EUR",
                        })}{" "}
                        {t("employment.minimum_income_multiplier")}
                      </span>

                      <RadioGroup
                        value={formState.tieneIngresosSuficientes}
                        onValueChange={(value) =>
                          handleSelectChange("tieneIngresosSuficientes", value)
                        }
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="si" id="ingresos-si" />
                          <Label
                            htmlFor="ingresos-si"
                            className="cursor-pointer"
                          >
                            {t("employment.yes")}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="ingresos-no" />
                          <Label
                            htmlFor="ingresos-no"
                            className="cursor-pointer"
                          >
                            {t("employment.no")}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Si tiene ingresos suficientes, preguntar tipo de trabajador */}
                    {formState.tieneIngresosSuficientes === "si" && (
                      <div className="space-y-3">
                        <Label className="text-base font-medium">
                          {t("employment.worker_type")}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <RadioGroup
                          value={formState.tipoTrabajador}
                          onValueChange={(value) =>
                            handleSelectChange("tipoTrabajador", value)
                          }
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="trabajador"
                              id="tipo-trabajador"
                            />
                            <Label
                              htmlFor="tipo-trabajador"
                              className="cursor-pointer"
                            >
                              {t("employment.employee")}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="autonomo"
                              id="tipo-autonomo"
                            />
                            <Label
                              htmlFor="tipo-autonomo"
                              className="cursor-pointer"
                            >
                              {t("employment.self_employed")}
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}

                    {/* Si es autónomo, preguntar si es de la UE o fuera */}
                    {formState.tieneIngresosSuficientes === "si" &&
                      formState.tipoTrabajador === "autonomo" && (
                        <div className="space-y-3">
                          <Label className="text-base font-medium">
                            {t("employment.self_employed_type")}{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <RadioGroup
                            value={formState.tipoAutonomo}
                            onValueChange={(value) =>
                              handleSelectChange("tipoAutonomo", value)
                            }
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="ue" id="autonomo-ue" />
                              <Label
                                htmlFor="autonomo-ue"
                                className="cursor-pointer"
                              >
                                {t("employment.eu_resident")}
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="fuera-ue"
                                id="autonomo-fuera-ue"
                              />
                              <Label
                                htmlFor="autonomo-fuera-ue"
                                className="cursor-pointer"
                              >
                                {t("employment.non_eu_resident")}
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
                          <AlertTitle>
                            {t("employment.no_sufficient_income")}
                          </AlertTitle>
                          <AlertDescription>
                            <p>{t("employment.continue_options_message")}</p>
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-3">
                          <Label className="text-base font-medium">
                            {t("employment.select_option")}{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <RadioGroup
                            value={formState.opcionAvalista}
                            onValueChange={(value) =>
                              handleSelectChange("opcionAvalista", value)
                            }
                            className="space-y-3"
                          >
                            <div className="flex items-start space-x-2">
                              <RadioGroupItem
                                value="avalista"
                                id="opcion-avalista"
                                className="mt-1"
                              />
                              <div className="space-y-1">
                                <Label
                                  htmlFor="opcion-avalista"
                                  className="cursor-pointer font-medium"
                                >
                                  {t("employment.add_guarantor")}
                                </Label>
                                <p className="text-sm text-gray-600">
                                  {t("employment.guarantor_requirements")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-2">
                              <RadioGroupItem
                                value="pago"
                                id="opcion-pago"
                                className="mt-1"
                              />
                              <div className="space-y-1">
                                <Label
                                  htmlFor="opcion-pago"
                                  className="cursor-pointer font-medium"
                                >
                                  {t("employment.advance_payment")}
                                </Label>
                                <p className="text-sm text-gray-600">
                                  {t("employment.advance_payment_description")}
                                </p>
                              </div>
                            </div>
                          </RadioGroup>
                        </div>

                        {formState.opcionAvalista === "pago" && (
                          <div className="space-y-3">
                            <Label className="text-base font-medium">
                              {t("payment.payment_option")}{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <p className="text-sm text-gray-600 italic">
                              {t("payment.payment_notice")}
                            </p>
                            <RadioGroup
                              value={formState.opcionPago}
                              onValueChange={(value) =>
                                handleSelectChange("opcionPago", value)
                              }
                              className="space-y-3"
                            >
                              <div className="flex items-start space-x-2">
                                <RadioGroupItem
                                  value="completo"
                                  id="pago-completo"
                                  className="mt-1"
                                />
                                <div className="space-y-1">
                                  <Label
                                    htmlFor="pago-completo"
                                    className="cursor-pointer font-medium"
                                  >
                                    {t("payment.full_advance")}
                                  </Label>
                                  <p className="text-sm text-gray-600">
                                    {t("payment.full_advance_description")}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start space-x-2">
                                <RadioGroupItem
                                  value="6meses"
                                  id="pago-6meses"
                                  className="mt-1"
                                />
                                <div className="space-y-1">
                                  <Label
                                    htmlFor="pago-6meses"
                                    className="cursor-pointer font-medium"
                                  >
                                    {t("payment.six_months_plus")}
                                  </Label>
                                  <p className="text-sm text-gray-600">
                                    {t("payment.six_months_plus_description")}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start space-x-2">
                                <RadioGroupItem
                                  value="3meses"
                                  id="pago-3meses"
                                  className="mt-1"
                                />
                                <div className="space-y-1">
                                  <Label
                                    htmlFor="pago-3meses"
                                    className="cursor-pointer font-medium"
                                  >
                                    {t("payment.three_month_installments")}
                                  </Label>
                                  <p className="text-sm text-gray-600">
                                    {t(
                                      "payment.three_month_installments_description"
                                    )}
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
                            <AlertTitle>
                              {t("employment.non_eu_requirements")}
                            </AlertTitle>
                            <AlertDescription>
                              <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>{t("employment.valid_passport")}</li>
                                <li>
                                  {t("employment.advance_payment_required")}
                                </li>
                              </ul>
                            </AlertDescription>
                          </Alert>

                          <div className="space-y-3">
                            <Label className="text-base font-medium">
                              {t("payment.payment_option")}{" "}
                              <span className="text-red-500">*</span>
                            </Label>
                            <RadioGroup
                              value={formState.opcionPago}
                              onValueChange={(value) =>
                                handleSelectChange("opcionPago", value)
                              }
                              className="space-y-3"
                            >
                              <div className="flex items-start space-x-2">
                                <RadioGroupItem
                                  value="completo"
                                  id="pago-completo-autonomo"
                                  className="mt-1"
                                />
                                <div className="space-y-1">
                                  <Label
                                    htmlFor="pago-completo-autonomo"
                                    className="cursor-pointer font-medium"
                                  >
                                    {t("payment.full_advance")}
                                  </Label>
                                  <p className="text-sm text-gray-600">
                                    {t("payment.full_advance_description")}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start space-x-2">
                                <RadioGroupItem
                                  value="6meses"
                                  id="pago-6meses-autonomo"
                                  className="mt-1"
                                />
                                <div className="space-y-1">
                                  <Label
                                    htmlFor="pago-6meses-autonomo"
                                    className="cursor-pointer font-medium"
                                  >
                                    {t("payment.six_months_plus_sixth")}
                                  </Label>
                                  <p className="text-sm text-gray-600">
                                    {t(
                                      "payment.six_months_plus_sixth_description"
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start space-x-2">
                                <RadioGroupItem
                                  value="3meses"
                                  id="pago-3meses-autonomo"
                                  className="mt-1"
                                />
                                <div className="space-y-1">
                                  <Label
                                    htmlFor="pago-3meses-autonomo"
                                    className="cursor-pointer font-medium"
                                  >
                                    {t("payment.three_month_installments")}
                                  </Label>
                                  <p className="text-sm text-gray-600">
                                    {t(
                                      "payment.three_month_installments_description"
                                    )}
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
                          <h4 className="text-lg font-medium text-gray-900">
                            {t("documents_section.documents_to_attach")}
                          </h4>

                          {/* Alert for 2 people document sharing */}
                          {formState.numberOfPeople === "2" && (
                            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                              <InfoIcon className="h-4 w-4" />
                              <AlertTitle>
                                {t(
                                  "documents_section.documents_for_two_people"
                                )}
                              </AlertTitle>
                              <AlertDescription>
                                <div className="space-y-2">
                                  <p>
                                    •{" "}
                                    <strong>
                                      {t(
                                        "documents_section.two_people_document_info"
                                      )}
                                    </strong>
                                  </p>
                                  <p>
                                    •{" "}
                                    <strong>
                                      {t("employment.income_requirements")}
                                    </strong>{" "}
                                    {t("employment.joint_income_evaluation")}
                                  </p>
                                  <p className="text-sm">
                                    {t("employment.income_example")}
                                  </p>
                                </div>
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* File upload general info - shown only once */}
                          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                            <h5 className="text-sm font-medium text-gray-900 mb-2">
                              {t("documents_section.file_info_title")}
                            </h5>
                            <div className="text-xs text-gray-600 space-y-1">
                              <p>
                                • {t("documents_section.file_formats_allowed")}{" "}
                                PDF, JPG, PNG, DOC, DOCX, TXT
                              </p>
                              <p>
                                • {t("documents_section.max_file_size_label")}{" "}
                                {(
                                  FILE_UPLOAD_CONFIG.maxFileSize /
                                  1024 /
                                  1024
                                ).toFixed(1)}
                                MB
                              </p>
                              <p>
                                •{" "}
                                {t(
                                  "documents_section.max_files_per_field_label"
                                )}{" "}
                                {FILE_UPLOAD_CONFIG.maxFilesPerField}{" "}
                                {t("documents_section.files_per_field")}
                              </p>
                              <p>
                                • {t("documents_section.max_total_size_label")}{" "}
                                {(
                                  FILE_UPLOAD_CONFIG.maxTotalSize /
                                  1024 /
                                  1024
                                ).toFixed(1)}
                                MB
                              </p>
                            </div>
                          </div>

                          {documentosRequeridos.map((docKey) => {
                            const docConfig = documentosBaseConfig[docKey];
                            return (
                              <FileUploadField
                                key={docKey}
                                id={docKey}
                                label={docConfig.label}
                                description={docConfig.description}
                                onFileChange={handleFileChange}
                                files={
                                  formState[docKey]
                                    ? (formState[docKey] as File[])
                                    : []
                                }
                                t={t}
                              />
                            );
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
                      <AlertTitle>
                        {t("documents_section.short_stay_payment")}
                      </AlertTitle>
                      <AlertDescription>
                        <p>{t("documents_section.short_stay_message")}</p>
                      </AlertDescription>
                    </Alert>

                    {/* File Upload Fields for short stays */}
                    {documentosRequeridos.length > 0 && (
                      <div className="space-y-6 mt-6">
                        <h4 className="text-lg font-medium text-gray-900">
                          {t("documents_section.documents_to_attach")}
                        </h4>

                        {/* Alert for 2 people document sharing */}
                        {formState.numberOfPeople === "2" && (
                          <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                            <InfoIcon className="h-4 w-4" />
                            <AlertTitle>
                              {t("documents_section.documents_for_two_people")}
                            </AlertTitle>
                            <AlertDescription>
                              <p>
                                •{" "}
                                <strong>
                                  {t(
                                    "documents_section.two_people_document_info"
                                  )}
                                </strong>
                              </p>
                              <p className="text-sm mt-1">
                                {t(
                                  "documents_section.two_people_clarification"
                                )}
                              </p>
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* File upload general info - shown only once */}
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">
                            {t("documents_section.file_info_title")}
                          </h5>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p>
                              • {t("documents_section.file_formats_allowed")}{" "}
                              PDF, JPG, PNG, DOC, DOCX, TXT
                            </p>
                            <p>
                              • {t("documents_section.max_file_size_label")}{" "}
                              {(
                                FILE_UPLOAD_CONFIG.maxFileSize /
                                1024 /
                                1024
                              ).toFixed(1)}
                              MB
                            </p>
                            <p>
                              •{" "}
                              {t("documents_section.max_files_per_field_label")}{" "}
                              {FILE_UPLOAD_CONFIG.maxFilesPerField}{" "}
                              {t("documents_section.files_per_field")}
                            </p>
                            <p>
                              • {t("documents_section.max_total_size_label")}{" "}
                              {(
                                FILE_UPLOAD_CONFIG.maxTotalSize /
                                1024 /
                                1024
                              ).toFixed(1)}
                              MB
                            </p>
                          </div>
                        </div>

                        {documentosRequeridos.map((docKey) => {
                          const docConfig = documentosBaseConfig[docKey];
                          return (
                            <FileUploadField
                              key={docKey}
                              id={docKey}
                              label={docConfig.label}
                              description={docConfig.description}
                              onFileChange={handleFileChange}
                              files={
                                formState[docKey]
                                  ? (formState[docKey] as File[])
                                  : []
                              }
                              t={t}
                            />
                          );
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
          formState.checkOutDate &&
          // Only show this section if duration is valid for Studio Estándar con Media Pensión
          !(
            formState.unitType === "Studio Estándar con Media Pensión" &&
            formState.checkInDate &&
            formState.checkOutDate &&
            (() => {
              const from = new Date(formState.checkInDate);
              const to = new Date(formState.checkOutDate);
              if (isValid(from) && isValid(to) && to > from) {
                const months = differenceInCalendarMonths(to, from) + 1;
                return months < 9;
              }
              return false;
            })()
          ) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-sm mr-2">
                    3
                  </span>
                  {t("final_section.title")}
                </CardTitle>
                <CardDescription>{t("final_section.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>{t("final_section.review_message")}</p>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
                      <TooltipTrigger asChild>
                        <div className="inline-block">
                          <Button
                            type="submit"
                            disabled={
                              submissionStatus === "submitting" ||
                              formspreeState.submitting ||
                              !isFormValid
                            }
                            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white"
                            onMouseEnter={() => {
                              if (!isFormValid) setShowTooltip(true);
                            }}
                            onMouseLeave={() => setShowTooltip(false)}
                            onClick={(e) => {
                              if (!isFormValid) {
                                e.preventDefault();
                                setShowTooltip(true);
                                // Hide tooltip after 3 seconds when clicked
                                setTimeout(() => setShowTooltip(false), 3000);
                              }
                            }}
                          >
                            {submissionStatus === "submitting" ||
                            formspreeState.submitting
                              ? t("messages.submitting")
                              : t("final_section.submit_button")}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {!isFormValid && getValidationErrors.length > 0 && (
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              {t("submission.requirements_title")}
                            </p>
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
                  {(submissionStatus === "success" ||
                    formspreeState.succeeded) && (
                    <Alert className="bg-green-50 border-green-200 text-green-800">
                      <AlertTitle>{t("submission.success_title")}</AlertTitle>
                      <AlertDescription>
                        <p>{t("submission.success_message")}</p>
                        <p className="mt-2 font-medium">
                          {t("submission.next_steps")}
                        </p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>{t("submission.step_review")}</li>
                          <li>{t("submission.step_confirm")}</li>
                          <li>{t("submission.step_contact")}</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  {(submissionStatus === "error" ||
                    formspreeState.errors?.length) && (
                    <Alert variant="destructive">
                      <AlertTitle>{t("common.error")}</AlertTitle>
                      <AlertDescription>
                        {formspreeState.errors?.length ? (
                          <div>
                            <p>{t("submission.error_title")}</p>
                            {formspreeState.errors.map((error, index) => (
                              <p key={index} className="text-sm">
                                {error.message}
                              </p>
                            ))}
                          </div>
                        ) : (
                          t("submission.error_message")
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Show Formspree validation errors */}
                  <ValidationError
                    prefix="Form"
                    field="general"
                    errors={formspreeState.errors}
                  />
                </div>
              </CardContent>
            </Card>
          )}
      </form>
    </div>
  );
}
