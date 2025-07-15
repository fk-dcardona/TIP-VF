import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { CheckCircle, Upload, BarChart3, DollarSign, Users, Clock, Shield, Star, ArrowRight, Play, TrendingUp, Package, AlertTriangle, X } from 'lucide-react'
import './App.css'

// Import generated images
import heroDashboard from './assets/hero-dashboard.png'
import csvUploadVisual from './assets/csv-upload-visual.png'
import controlTowerVisual from './assets/control-tower-visual.png'

function App() {
  const [spotsLeft, setSpotsLeft] = useState(17)
  const [selectedSegment, setSelectedSegment] = useState('navigator')
  const [showVideoModal, setShowVideoModal] = useState(false)

  // Simulate countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setSpotsLeft(prev => prev > 10 ? prev - 1 : prev)
    }, 30000) // Decrease every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const segments = {
    navigator: {
      title: "Obtén control total de tu operación",
      subtitle: "Para líderes que necesitan visibilidad completa y control sobre su cadena de suministro",
      testimonial: "\"¡Me encanta! Me encantó. Esto tiene mucha aplicación, no solamente la importación.\"",
      author: "Hulda, Gerente General - ATW",
      benefits: [
        "Control total sin cambiar tus procesos actuales",
        "Flexibilidad de pago hasta 6 meses",
        "Reportes ejecutivos listos para junta directiva",
        "Eliminación de sorpresas en flujo de caja"
      ]
    },
    streamliner: {
      title: "Gana más negocios con decisiones instantáneas",
      subtitle: "Para equipos que necesitan velocidad y eficiencia en cada decisión",
      testimonial: "\"Debido a la velocidad del sitio web puedo obtener cotizaciones más rápido... gano más negocios\"",
      author: "Cliente México (10/10 NPS)",
      benefits: [
        "Insights en 30 segundos garantizados",
        "Decisiones más rápidas que la competencia",
        "Automatización de procesos manuales",
        "Ventaja competitiva por velocidad"
      ]
    },
    hub: {
      title: "Coordina múltiples empresas desde un dashboard",
      subtitle: "Para empresarios que manejan múltiples entidades y necesitan coordinación perfecta",
      testimonial: "\"Manejo dos empresas que usan Finkargo... a través de mí, mi socio está trabajando\"",
      author: "Cliente Hub - Multi-entidad",
      benefits: [
        "Vista unificada de todas tus empresas",
        "Coordinación perfecta entre entidades",
        "Análisis comparativo de performance",
        "Escalabilidad para crecimiento"
      ]
    },
    spring: {
      title: "Te guiamos hacia la excelencia operacional",
      subtitle: "Para empresas en crecimiento que necesitan estructura y guía experta",
      testimonial: "\"Los consultores me han ayudado mucho\"",
      author: "Cliente Spring (10/10 NPS)",
      benefits: [
        "Acompañamiento personalizado 1-a-1",
        "Metodología probada paso a paso",
        "Transformación gradual y segura",
        "Soporte humano cuando lo necesites"
      ]
    }
  }

  const currentSegment = segments[selectedSegment]

  // Function to handle beta access request
  const handleBetaAccess = () => {
    // Replace with your actual form URL or route
    window.open('/onboarding-form', '_blank')
    // Alternative: window.location.href = '/onboarding-form'
  }

  // Video Modal Component
  const VideoModal = () => (
    <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Demo en Vivo - Finkargo SCI
          </DialogTitle>
        </DialogHeader>
        <div className="aspect-video w-full">
          {/* Replace this iframe with your actual video embed */}
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
            title="Demo Finkargo SCI"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-lg"
          ></iframe>
          {/* Alternative for Vimeo or other platforms:
          <iframe
            width="100%"
            height="100%"
            src="https://player.vimeo.com/video/YOUR_VIDEO_ID"
            title="Demo Finkargo SCI"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="rounded-lg"
          ></iframe>
          */}
        </div>
        <div className="flex justify-center mt-4">
          <Button 
            onClick={handleBetaAccess}
            className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3"
          >
            Solicitar Acceso Beta Ahora
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">Finkargo SCI</span>
          </div>
          <Badge variant="destructive" className="animate-pulse">
            Solo {spotsLeft} cupos disponibles
          </Badge>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                Programa Beta Exclusivo - Solo 30 Empresas
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 leading-tight">
                Deja de adivinar en tu cadena de suministro.
                <span className="text-blue-600 block">
                  Toma decisiones con data, no con instinto.
                </span>
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed">
                Transforma tu Excel de inventario y ventas en inteligencia de negocio en 30 segundos. 
                Accede a nuestro programa beta exclusivo y obtén 120 días completamente gratis.
              </p>
            </div>

            {/* Segment Selector */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-700">¿Cuál describe mejor tu situación?</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={selectedSegment === 'navigator' ? 'default' : 'outline'}
                  onClick={() => setSelectedSegment('navigator')}
                  className="text-left justify-start h-auto p-3"
                >
                  <div>
                    <div className="font-medium">🧭 Líder/Gerente</div>
                    <div className="text-xs opacity-70">Necesito control total</div>
                  </div>
                </Button>
                <Button
                  variant={selectedSegment === 'streamliner' ? 'default' : 'outline'}
                  onClick={() => setSelectedSegment('streamliner')}
                  className="text-left justify-start h-auto p-3"
                >
                  <div>
                    <div className="font-medium">🏃 Operaciones</div>
                    <div className="text-xs opacity-70">Necesito velocidad</div>
                  </div>
                </Button>
                <Button
                  variant={selectedSegment === 'hub' ? 'default' : 'outline'}
                  onClick={() => setSelectedSegment('hub')}
                  className="text-left justify-start h-auto p-3"
                >
                  <div>
                    <div className="font-medium">🌐 Multi-empresa</div>
                    <div className="text-xs opacity-70">Coordino varias entidades</div>
                  </div>
                </Button>
                <Button
                  variant={selectedSegment === 'spring' ? 'default' : 'outline'}
                  onClick={() => setSelectedSegment('spring')}
                  className="text-left justify-start h-auto p-3"
                >
                  <div>
                    <div className="font-medium">🌱 En crecimiento</div>
                    <div className="text-xs opacity-70">Necesito guía</div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Dynamic CTA based on segment */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">
                {currentSegment.title}
              </h2>
              <p className="text-slate-600">
                {currentSegment.subtitle}
              </p>
              
              {/* New CTAs */}
              <div className="space-y-3">
                <Button 
                  size="lg" 
                  onClick={() => setShowVideoModal(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                >
                  <Play className="mr-2 w-5 h-5" />
                  Ver Demo en Vivo
                </Button>
                <Button 
                  size="lg" 
                  onClick={handleBetaAccess}
                  className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                >
                  Solicitar Acceso Beta
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
              
              <p className="text-sm text-center text-slate-500">
                ⚡ Insights en 30 segundos garantizados o te pagamos $200 USD
              </p>
            </div>
          </div>

          <div className="relative">
            <img 
              src={heroDashboard} 
              alt="Dashboard de Inteligencia de Cadena de Suministro" 
              className="rounded-2xl shadow-2xl border border-slate-200"
            />
            <div className="absolute -bottom-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-lg font-medium shadow-lg">
              68.6% Salud de Cadena
            </div>
          </div>
        </div>
      </section>

      {/* Problem Agitation */}
      <section className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-5xl font-bold">
              ¿Tu operación depende de un laberinto de emails, WhatsApps y hojas de cálculo?
            </h2>
            <p className="text-xl text-slate-300 leading-relaxed">
              Sabemos que las decisiones más críticas de tu negocio se toman con información incompleta. 
              El equipo de ventas no sabe qué hay en stock, finanzas no tiene visibilidad del flujo de caja 
              y todo depende de fórmulas en Google Sheets que solo una persona entiende.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
                <h3 className="text-xl font-bold">Fórmulas frágiles</h3>
                <p className="text-slate-400">Un error en una celda y se cae el sistema</p>
              </div>
              <div className="text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
                <h3 className="text-xl font-bold">Comunicación rota</h3>
                <p className="text-slate-400">Decisiones críticas perdidas en chats</p>
              </div>
              <div className="text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
                <h3 className="text-xl font-bold">Datos en silos</h3>
                <p className="text-slate-400">Nadie tiene la foto completa del negocio</p>
              </div>
            </div>

            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-6 mt-8">
              <p className="text-lg font-medium text-red-200">
                <strong>El costo real:</strong> 89.4 millones de pesos atrapados en sobrestock, 
                2.1 millones perdidos mensualmente por falta de stock, y decisiones críticas 
                tomadas con información de hace una semana.
              </p>
            </div>

            {/* CTA in problem section */}
            <div className="pt-8">
              <Button 
                size="lg" 
                onClick={() => setShowVideoModal(true)}
                className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 py-4"
              >
                <Play className="mr-2 w-5 h-5" />
                Ver Cómo Lo Solucionamos
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Solution - The Secret */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              El Secreto Revelado
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900">
              La inteligencia de tu negocio ya está en tus datos. 
              <span className="text-blue-600">Te ayudamos a verla.</span>
            </h2>
            <p className="text-xl text-slate-600 leading-relaxed">
              Hemos creado una plataforma que responde las 3 preguntas que realmente importan, 
              sin necesidad de implementaciones complejas. Sube tu data y nosotros hacemos el resto.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <Card className="border-2 border-blue-100 hover:border-blue-300 transition-colors">
                <CardHeader className="text-center">
                  <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <CardTitle className="text-blue-900">¿Cómo se venden mis productos?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">Rendimiento, rentabilidad y oportunidades de optimización en tiempo real</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-100 hover:border-green-300 transition-colors">
                <CardHeader className="text-center">
                  <Package className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <CardTitle className="text-green-900">¿Qué inventario tengo?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">Stock actual, productos en tránsito y alertas predictivas de stockout</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-100 hover:border-purple-300 transition-colors">
                <CardHeader className="text-center">
                  <DollarSign className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <CardTitle className="text-purple-900">¿Cuánto dinero tengo?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">Flujo de caja en tiempo real y proyecciones de pagos y cobros</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-8 mb-12">
              <h2 className="text-3xl lg:text-5xl font-bold text-slate-900">
                De CSV a CEO en 3 simples pasos
              </h2>
              <p className="text-xl text-slate-600">
                Sin configuraciones manuales. Sin cambios de proceso. Solo resultados inmediatos.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <Badge className="absolute -top-2 -right-2 bg-blue-100 text-blue-800">1</Badge>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Sube tu data</h3>
                <p className="text-slate-600">
                  Conecta tu archivo de ventas vs. inventario. Sin configuraciones manuales.
                </p>
                <img 
                  src={csvUploadVisual} 
                  alt="Subida de CSV" 
                  className="rounded-lg shadow-lg mx-auto max-w-full h-32 object-cover"
                />
              </div>

              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <Badge className="absolute -top-2 -right-2 bg-green-100 text-green-800">2</Badge>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Recibe Insights</h3>
                <p className="text-slate-600">
                  En segundos, visualiza dashboards específicos para tu rol (Gerente, Ventas, Finanzas).
                </p>
                <div className="bg-green-100 rounded-lg p-4 mx-auto">
                  <div className="text-2xl font-bold text-green-800">30 segundos</div>
                  <div className="text-sm text-green-600">Tiempo garantizado</div>
                </div>
              </div>

              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <Badge className="absolute -top-2 -right-2 bg-purple-100 text-purple-800">3</Badge>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Toma Acción</h3>
                <p className="text-slate-600">
                  Identifica riesgos de stock, optimiza tu flujo de caja y acelera tus ventas.
                </p>
                <img 
                  src={controlTowerVisual} 
                  alt="Control Tower" 
                  className="rounded-lg shadow-lg mx-auto max-w-full h-32 object-cover"
                />
              </div>
            </div>

            {/* CTA after how it works */}
            <div className="text-center mt-12">
              <Button 
                size="lg" 
                onClick={() => setShowVideoModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4 mr-4"
              >
                <Play className="mr-2 w-5 h-5" />
                Ver Demo Completo
              </Button>
              <Button 
                size="lg" 
                onClick={handleBetaAccess}
                className="bg-green-600 hover:bg-green-700 text-lg px-8 py-4"
              >
                Solicitar Acceso Beta
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="flex justify-center space-x-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-8 h-8 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            
            <blockquote className="text-2xl lg:text-4xl font-bold leading-relaxed">
              "{currentSegment.testimonial}"
            </blockquote>
            
            <div className="space-y-2">
              <p className="text-xl font-medium text-blue-100">
                {currentSegment.author}
              </p>
              <Badge className="bg-yellow-500 text-yellow-900 hover:bg-yellow-500">
                Cliente Beta Real
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-12">
              {currentSegment.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3 text-left">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <span className="text-blue-100">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Irresistible Offer */}
      <section className="py-16 bg-gradient-to-br from-yellow-50 to-orange-50 border-t-4 border-yellow-400">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-8 mb-12">
              <Badge className="bg-yellow-500 text-yellow-900 hover:bg-yellow-500 text-lg px-4 py-2">
                Acceso Exclusivo Beta
              </Badge>
              <h2 className="text-3xl lg:text-5xl font-bold text-slate-900">
                Sé uno de los 30 pioneros
              </h2>
              <p className="text-xl text-slate-600">
                Una oportunidad única para transformar tu cadena de suministro con acceso prioritario 
                y condiciones que nunca volveremos a ofrecer.
              </p>
            </div>

            <Card className="border-4 border-yellow-400 shadow-2xl">
              <CardHeader className="bg-yellow-400 text-center">
                <CardTitle className="text-2xl text-yellow-900">
                  Programa Beta "Control Total"
                </CardTitle>
                <CardDescription className="text-yellow-800 text-lg">
                  Valor total: $12,600 USD - Tu precio: $0 USD
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center">
                      <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                      Lo que obtienes:
                    </h3>
                    <ul className="space-y-3 text-slate-700">
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>120 días gratis</strong> (vs 90 días estándar)</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Onboarding 1-a-1</strong> con especialista (30 min)</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Reporte estratégico</strong> ejecutivo personalizado</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Agente PDF</strong> para automatizar documentos</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Acceso prioritario</strong> a nuevas funcionalidades</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center">
                      <Shield className="w-6 h-6 text-blue-600 mr-2" />
                      Garantías:
                    </h3>
                    <ul className="space-y-3 text-slate-700">
                      <li className="flex items-start space-x-2">
                        <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Insights en 30 segundos</strong> o te pagamos $200 USD</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Oportunidad de $10K+</strong> identificada en 60 días o $500 USD</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Acceso extendido</strong> hasta que veas resultados</span>
                      </li>
                    </ul>
                    
                    <div className="bg-red-100 border border-red-300 rounded-lg p-4 mt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-800">
                          Solo quedan {spotsLeft} cupos
                        </div>
                        <div className="text-sm text-red-600">
                          El programa cierra cuando se completen los 30
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6 space-y-3">
                  <Button 
                    size="lg" 
                    onClick={() => setShowVideoModal(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-xl py-6"
                  >
                    <Play className="mr-2 w-6 h-6" />
                    Ver Demo Completo Primero
                  </Button>
                  <Button 
                    size="lg" 
                    onClick={handleBetaAccess}
                    className="w-full bg-green-600 hover:bg-green-700 text-xl py-8"
                  >
                    Solicitar Mi Acceso Beta Ahora
                    <ArrowRight className="ml-2 w-6 h-6" />
                  </Button>
                  <p className="text-center text-sm text-slate-500 mt-4">
                    ⚡ Configuración inmediata - Resultados en 15 minutos
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
              Preguntas Frecuentes
            </h2>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>¿Qué pasa después de los 120 días?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Tendrás flexibilidad total de pago, incluyendo opciones de hasta 6 meses. 
                    Como cliente beta, obtienes condiciones preferenciales de por vida.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>¿Mis datos están seguros?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Utilizamos encriptación de nivel bancario y nunca compartimos tu información. 
                    Tus datos permanecen en servidores seguros con auditorías regulares.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>¿Qué tipo de CSV necesito?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Cualquier archivo con datos de ventas e inventario. Nuestro sistema reconoce 
                    automáticamente los campos y se adapta a tu formato actual.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>¿Realmente no tiene costo?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Completamente gratis por 120 días. Solo pedimos feedback semanal y un testimonio 
                    si estás satisfecho. No hay letra pequeña ni cargos ocultos.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* CTA in FAQ */}
            <div className="text-center mt-12 space-y-4">
              <p className="text-lg text-slate-600">¿Tienes más preguntas?</p>
              <div className="space-x-4">
                <Button 
                  onClick={() => setShowVideoModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="mr-2 w-4 h-4" />
                  Ver Demo
                </Button>
                <Button 
                  onClick={handleBetaAccess}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Solicitar Acceso
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-5xl font-bold">
              Tu cadena de suministro te está esperando
            </h2>
            <p className="text-xl text-slate-300">
              Únete a los líderes que ya están transformando el caos en ventaja competitiva. 
              Solo quedan {spotsLeft} cupos disponibles.
            </p>
            
            <div className="space-y-4">
              <Button 
                size="lg" 
                onClick={() => setShowVideoModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-xl px-12 py-6 mr-4"
              >
                <Play className="mr-2 w-6 h-6" />
                Ver Demo Completo
              </Button>
              <Button 
                size="lg" 
                onClick={handleBetaAccess}
                className="bg-green-600 hover:bg-green-700 text-xl px-12 py-8"
              >
                Solicitar Mi Acceso Beta
                <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
            </div>
            
            <p className="text-sm text-slate-400">
              Powered by Finkargo • 7,274+ operaciones analizadas • Resultados garantizados
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">Finkargo SCI</span>
          </div>
          <p className="text-sm">
            © 2025 Finkargo. Transformando cadenas de suministro en ventajas competitivas.
          </p>
        </div>
      </footer>

      {/* Video Modal */}
      <VideoModal />
    </div>
  )
}

export default App

