'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [spotsLeft, setSpotsLeft] = useState(17);
  const [selectedSegment, setSelectedSegment] = useState('navigator');
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const timer = setInterval(() => {
      setSpotsLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 60000);

    return () => clearInterval(timer);
  }, [mounted]);

  const segments = {
    navigator: {
      title: "Líder/Gerente",
      subtitle: "Toma decisiones estratégicas con data",
      problems: [
        "No tienes visibilidad real de tu cadena de suministro",
        "Tomas decisiones basadas en instinto, no en datos",
        "Pierdes oportunidades por falta de información"
      ],
      benefits: [
        "Dashboard ejecutivo con KPIs críticos",
        "Alertas inteligentes de riesgos",
        "Reportes automáticos para stakeholders"
      ]
    },
    streamliner: {
      title: "Operaciones",
      subtitle: "Optimiza procesos y reduce costos",
      problems: [
        "Procesos manuales que consumen tiempo",
        "Errores humanos que cuestan dinero",
        "Falta de coordinación entre departamentos"
      ],
      benefits: [
        "Automatización de procesos críticos",
        "Flujos de trabajo optimizados",
        "Integración con sistemas existentes"
      ]
    },
    hub: {
      title: "Finanzas",
      subtitle: "Libera capital atrapado",
      problems: [
        "Capital atrapado en inventario",
        "Falta de visibilidad del cash flow",
        "Riesgos financieros ocultos"
      ],
      benefits: [
        "Análisis de ciclo de conversión de efectivo",
        "Optimización de términos de pago",
        "Gestión inteligente de capital de trabajo"
      ]
    },
    spring: {
      title: "Compras",
      subtitle: "Compra inteligente, no más",
      problems: [
        "Compras reactivas en lugar de proactivas",
        "Falta de análisis de proveedores",
        "Costos ocultos en la cadena"
      ],
      benefits: [
        "Recomendaciones de compra basadas en IA",
        "Análisis de salud de proveedores",
        "Optimización de lead times"
      ]
    }
  };

  const currentSegment = segments[selectedSegment as keyof typeof segments];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-gray-200/50 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 text-blue-600">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Finkargo SCI
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/sign-in">
                <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                  Iniciar Sesión
                </button>
              </Link>
              <Link href="/sign-up">
                <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white rounded-md transition-all">
                  Comenzar Gratis
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold mb-4 bg-blue-100 text-blue-800">
              🚀 Lanzamiento Especial - 120 días gratis
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
                Deja de adivinar
              </span>
              <br />
              <span className="text-gray-900">
                en tu cadena de suministro
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Toma decisiones con <span className="font-semibold text-blue-600">data</span>, no con instinto. 
              La primera plataforma de inteligencia de cadena de suministro que se paga sola.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/sign-up">
                <button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white text-lg px-8 py-4 rounded-md transition-all">
                  Comenzar 120 días gratis
                  <svg className="inline ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
                  </svg>
                </button>
              </Link>
              
              <button 
                className="border border-gray-300 bg-transparent hover:bg-gray-100 text-lg px-8 py-4 rounded-md transition-colors"
                onClick={() => setShowVideo(true)}
              >
                <svg className="inline mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Ver demo (2 min)
              </button>
            </div>

            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />
                </svg>
                Sin tarjeta de crédito
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />
                </svg>
                Configuración en 5 minutos
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />
                </svg>
                Cancelación en cualquier momento
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Segment Selector */}
      <section className="relative z-10 py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Cuál es tu rol en la cadena de suministro?
            </h2>
            <p className="text-lg text-gray-600">
              Selecciona tu perfil para ver cómo Finkargo SCI resuelve tus desafíos específicos
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {Object.entries(segments).map(([key, segment]) => (
              <button
                key={key}
                onClick={() => setSelectedSegment(key)}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  selectedSegment === key
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <h3 className="font-semibold text-lg mb-2">{segment.title}</h3>
                <p className="text-sm text-gray-600">{segment.subtitle}</p>
              </button>
            ))}
          </div>

          {/* Selected Segment Content */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold mb-4">{currentSegment.title}</h3>
                <p className="text-gray-600 mb-6">{currentSegment.subtitle}</p>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-red-600 flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Problemas que resuelves:
                  </h4>
                  <ul className="space-y-2">
                    {currentSegment.problems.map((problem, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-gray-700">{problem}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-green-600 flex items-center mb-4">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />
                  </svg>
                  Beneficios que obtienes:
                </h4>
                <ul className="space-y-3">
                  {currentSegment.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />
                      </svg>
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="relative z-10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Empresas que ya confían en nosotros
            </h2>
            <p className="text-lg text-gray-600">
              Más de 150 empresas en Latinoamérica ya optimizan su cadena de suministro
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg border shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 text-yellow-500 fill-current" viewBox="0 0 24 24">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Finkargo SCI nos ayudó a reducir nuestro inventario en 30% y mejorar nuestro cash flow significativamente."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">María González</p>
                  <p className="text-sm text-gray-500">Directora de Operaciones, TechCorp</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-lg border shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 text-yellow-500 fill-current" viewBox="0 0 24 24">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "La automatización de nuestros procesos de compra nos ahorra 15 horas semanales y reduce errores en 90%."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">Carlos Rodríguez</p>
                  <p className="text-sm text-gray-500">Gerente de Compras, LogiMax</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-lg border shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 text-yellow-500 fill-current" viewBox="0 0 24 24">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "NPS de 85 y ROI de 300% en el primer año. Finkargo SCI se paga sola con los ahorros que genera."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold">Ana Martínez</p>
                  <p className="text-sm text-gray-500">CFO, SupplyChain Pro</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-2xl font-bold text-blue-600">NPS: 85</p>
            <p className="text-gray-600">Promedio de satisfacción de nuestros clientes</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-16 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Listo para transformar tu cadena de suministro?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Únete a más de 150 empresas que ya optimizan sus operaciones
          </p>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8">
            <div className="grid md:grid-cols-3 gap-8 text-white">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">120</div>
                <p>Días gratis</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">$0</div>
                <p>Configuración</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{spotsLeft}</div>
                <p>Lugares disponibles</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/sign-up">
              <button className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 rounded-md transition-colors">
                Comenzar ahora - 120 días gratis
                <svg className="inline ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
                </svg>
              </button>
            </Link>
            
            <button 
              className="border border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4 rounded-md transition-colors"
              onClick={() => setShowVideo(true)}
            >
              <svg className="inline mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              Ver demo
            </button>
          </div>

          <p className="text-blue-100 mt-4 text-sm">
            Sin tarjeta de crédito • Cancelación en cualquier momento • Soporte 24/7
          </p>
        </div>
      </section>

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowVideo(false)}
          />
          <div className="relative bg-white rounded-2xl p-8 max-w-4xl w-full mx-4">
            <button
              onClick={() => setShowVideo(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-2xl font-bold mb-4">Demo de Finkargo SCI</h3>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <p className="text-gray-600">Video demo en desarrollo</p>
                <p className="text-sm text-gray-500">Próximamente disponible</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 text-blue-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="text-xl font-bold">Finkargo SCI</span>
              </div>
              <p className="text-gray-400">
                La plataforma de inteligencia de cadena de suministro que se paga sola.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Características</li>
                <li>Precios</li>
                <li>Integraciones</li>
                <li>API</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Recursos</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Documentación</li>
                <li>Blog</li>
                <li>Webinars</li>
                <li>Soporte</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Sobre nosotros</li>
                <li>Carreras</li>
                <li>Contacto</li>
                <li>Privacidad</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Finkargo SCI. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}