import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { CheckCircle, Building, Users, DollarSign, Package } from 'lucide-react'

function OnboardingForm() {
  const [formData, setFormData] = useState({
    // Información personal
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    cargo: '',
    
    // Información de la empresa
    empresa: '',
    industria: '',
    facturacionAnual: '',
    numeroEmpleados: '',
    
    // Información operacional
    tipoInventario: '',
    numeroSkus: '',
    sistemaActual: '',
    principalDesafio: '',
    
    // Segmento y necesidades
    segmento: '',
    objetivoPrincipal: '',
    comentarios: ''
  })

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Aquí integrarías con tu backend o servicio de forms
    console.log('Form submitted:', formData)
    setIsSubmitted(true)
  }

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              ¡Solicitud Recibida!
            </h1>
            <p className="text-xl text-slate-600">
              Gracias por tu interés en el programa Beta de Finkargo SCI.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-2">Próximos pasos:</h3>
              <ul className="text-left text-blue-800 space-y-2">
                <li>✅ Revisaremos tu solicitud en las próximas 24 horas</li>
                <li>✅ Te contactaremos para agendar una demo personalizada</li>
                <li>✅ Si calificas, recibirás acceso inmediato al programa beta</li>
              </ul>
            </div>
            <p className="text-sm text-slate-500">
              Revisa tu email (incluyendo spam) para confirmación y próximos pasos.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Solicitud de Acceso Beta
          </h1>
          <p className="text-xl text-slate-600">
            Programa "Control Total" - Solo 30 empresas seleccionadas
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {currentStep === 1 && <><Users className="mr-2" /> Información Personal</>}
                {currentStep === 2 && <><Building className="mr-2" /> Información de la Empresa</>}
                {currentStep === 3 && <><Package className="mr-2" /> Información Operacional</>}
                {currentStep === 4 && <><CheckCircle className="mr-2" /> Necesidades y Objetivos</>}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && "Cuéntanos sobre ti"}
                {currentStep === 2 && "Información sobre tu empresa"}
                {currentStep === 3 && "Detalles de tu operación actual"}
                {currentStep === 4 && "Tus objetivos con Finkargo SCI"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="apellido">Apellido *</Label>
                    <Input
                      id="apellido"
                      value={formData.apellido}
                      onChange={(e) => handleInputChange('apellido', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Corporativo *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="cargo">Cargo/Posición *</Label>
                    <Input
                      id="cargo"
                      value={formData.cargo}
                      onChange={(e) => handleInputChange('cargo', e.target.value)}
                      placeholder="ej. Gerente General, Director de Operaciones, etc."
                      required
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Company Information */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="empresa">Nombre de la Empresa *</Label>
                    <Input
                      id="empresa"
                      value={formData.empresa}
                      onChange={(e) => handleInputChange('empresa', e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="industria">Industria/Sector *</Label>
                      <Select onValueChange={(value) => handleInputChange('industria', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tu industria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="importacion">Importación/Distribución</SelectItem>
                          <SelectItem value="retail">Retail/Comercio</SelectItem>
                          <SelectItem value="manufactura">Manufactura</SelectItem>
                          <SelectItem value="alimentos">Alimentos y Bebidas</SelectItem>
                          <SelectItem value="textil">Textil/Moda</SelectItem>
                          <SelectItem value="tecnologia">Tecnología</SelectItem>
                          <SelectItem value="farmaceutica">Farmacéutica</SelectItem>
                          <SelectItem value="automotriz">Automotriz</SelectItem>
                          <SelectItem value="otros">Otros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="facturacionAnual">Facturación Anual (USD) *</Label>
                      <Select onValueChange={(value) => handleInputChange('facturacionAnual', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona rango" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="500k-1m">$500K - $1M</SelectItem>
                          <SelectItem value="1m-5m">$1M - $5M</SelectItem>
                          <SelectItem value="5m-10m">$5M - $10M</SelectItem>
                          <SelectItem value="10m-50m">$10M - $50M</SelectItem>
                          <SelectItem value="50m+">$50M+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="numeroEmpleados">Número de Empleados</Label>
                    <Select onValueChange={(value) => handleInputChange('numeroEmpleados', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona rango" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10</SelectItem>
                        <SelectItem value="11-50">11-50</SelectItem>
                        <SelectItem value="51-200">51-200</SelectItem>
                        <SelectItem value="201-500">201-500</SelectItem>
                        <SelectItem value="500+">500+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 3: Operational Information */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tipoInventario">Tipo de Inventario *</Label>
                      <Select onValueChange={(value) => handleInputChange('tipoInventario', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="productos-terminados">Productos Terminados</SelectItem>
                          <SelectItem value="materias-primas">Materias Primas</SelectItem>
                          <SelectItem value="componentes">Componentes/Partes</SelectItem>
                          <SelectItem value="mixto">Mixto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="numeroSkus">Número de SKUs Aproximado *</Label>
                      <Select onValueChange={(value) => handleInputChange('numeroSkus', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona rango" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-50">1-50</SelectItem>
                          <SelectItem value="51-200">51-200</SelectItem>
                          <SelectItem value="201-1000">201-1,000</SelectItem>
                          <SelectItem value="1000-5000">1,000-5,000</SelectItem>
                          <SelectItem value="5000+">5,000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="sistemaActual">Sistema Actual de Inventario *</Label>
                    <Select onValueChange={(value) => handleInputChange('sistemaActual', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="¿Cómo manejas tu inventario actualmente?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excel">Excel/Google Sheets</SelectItem>
                        <SelectItem value="erp-basico">ERP Básico</SelectItem>
                        <SelectItem value="erp-avanzado">ERP Avanzado (SAP, Oracle, etc.)</SelectItem>
                        <SelectItem value="software-especializado">Software Especializado de Inventario</SelectItem>
                        <SelectItem value="manual">Proceso Manual</SelectItem>
                        <SelectItem value="mixto">Combinación de varios</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="principalDesafio">Principal Desafío Actual *</Label>
                    <Textarea
                      id="principalDesafio"
                      value={formData.principalDesafio}
                      onChange={(e) => handleInputChange('principalDesafio', e.target.value)}
                      placeholder="Describe tu principal desafío con el manejo de inventario y cadena de suministro..."
                      rows={3}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Needs and Objectives */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="segmento">¿Cuál describe mejor tu situación? *</Label>
                    <Select onValueChange={(value) => handleInputChange('segmento', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="navigator">🧭 Líder/Gerente - Necesito control total</SelectItem>
                        <SelectItem value="streamliner">🏃 Operaciones - Necesito velocidad</SelectItem>
                        <SelectItem value="hub">🌐 Multi-empresa - Coordino varias entidades</SelectItem>
                        <SelectItem value="spring">🌱 En crecimiento - Necesito guía</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="objetivoPrincipal">Objetivo Principal con Finkargo SCI *</Label>
                    <Select onValueChange={(value) => handleInputChange('objetivoPrincipal', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="¿Qué esperas lograr?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reducir-sobrestock">Reducir Sobrestock</SelectItem>
                        <SelectItem value="evitar-stockouts">Evitar Stockouts</SelectItem>
                        <SelectItem value="mejorar-flujo-caja">Mejorar Flujo de Caja</SelectItem>
                        <SelectItem value="acelerar-decisiones">Acelerar Toma de Decisiones</SelectItem>
                        <SelectItem value="visibilidad-completa">Obtener Visibilidad Completa</SelectItem>
                        <SelectItem value="automatizar-procesos">Automatizar Procesos</SelectItem>
                        <SelectItem value="todos">Todos los anteriores</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="comentarios">Comentarios Adicionales</Label>
                    <Textarea
                      id="comentarios"
                      value={formData.comentarios}
                      onChange={(e) => handleInputChange('comentarios', e.target.value)}
                      placeholder="¿Hay algo más que quieras compartir sobre tu situación actual o expectativas?"
                      rows={3}
                    />
                  </div>
                  
                  {/* Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
                    <h3 className="font-bold text-blue-900 mb-4">Resumen de tu Solicitud:</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Empresa:</strong> {formData.empresa || 'No especificado'}
                      </div>
                      <div>
                        <strong>Industria:</strong> {formData.industria || 'No especificado'}
                      </div>
                      <div>
                        <strong>Facturación:</strong> {formData.facturacionAnual || 'No especificado'}
                      </div>
                      <div>
                        <strong>SKUs:</strong> {formData.numeroSkus || 'No especificado'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  Anterior
                </Button>
                
                {currentStep < 4 ? (
                  <Button type="button" onClick={nextStep}>
                    Siguiente
                  </Button>
                ) : (
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Enviar Solicitud
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}

export default OnboardingForm

