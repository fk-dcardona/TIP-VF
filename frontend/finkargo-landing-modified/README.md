# Finkargo SCI - Landing Page Beta

Landing page optimizada para conversión del programa beta de Finkargo SCI, con segmentación dinámica y dos call-to-actions principales.

## 🎯 Características Principales

### ✅ Funcionalidades Implementadas
- **Segmentación Dinámica**: 4 perfiles de usuario (Navigator, Streamliner, Hub, Spring)
- **Contenido Personalizado**: Mensajes y beneficios específicos por segmento
- **Modal de Video Demo**: Integración lista para embebber video
- **Formulario de Onboarding**: Proceso de 4 pasos para capturar leads
- **Diseño Responsive**: Optimizado para móvil y desktop
- **Animaciones y Microinteracciones**: Mejoran el engagement
- **Psicología de Conversión**: Urgencia, escasez, prueba social

### 🎨 Call-to-Actions Implementados
1. **"Ver Demo en Vivo"** - Abre modal con video embebido
2. **"Solicitar Acceso Beta"** - Redirige a formulario de onboarding

## 📁 Estructura de Archivos

```
finkargo-landing-modified/
├── App.jsx                    # Componente principal de la landing page
├── OnboardingForm.jsx         # Formulario de solicitud de acceso beta
├── App.css                    # Estilos personalizados
├── package.json               # Dependencias del proyecto
├── tailwind.config.js         # Configuración de Tailwind CSS
├── vite.config.js            # Configuración de Vite
├── components/
│   └── ui/                   # Componentes de UI (shadcn/ui)
│       ├── button.jsx
│       ├── card.jsx
│       ├── badge.jsx
│       ├── dialog.jsx        # Modal para video demo
│       ├── input.jsx
│       ├── label.jsx
│       ├── textarea.jsx
│       └── select.jsx
├── lib/
│   └── utils.js              # Utilidades (cn function)
└── assets/                   # Imágenes generadas
    ├── hero-dashboard.png
    ├── csv-upload-visual.png
    └── control-tower-visual.png
```

## 🚀 Integración en tu Aplicación Principal

### Opción 1: Integración Directa (Recomendada)

1. **Copia los archivos necesarios a tu proyecto:**
   ```bash
   # Copiar componentes principales
   cp App.jsx tu-proyecto/src/pages/Landing.jsx
   cp OnboardingForm.jsx tu-proyecto/src/pages/OnboardingForm.jsx
   
   # Copiar componentes UI
   cp -r components/ tu-proyecto/src/components/
   
   # Copiar assets
   cp -r assets/ tu-proyecto/src/assets/
   
   # Copiar estilos
   cp App.css tu-proyecto/src/styles/landing.css
   ```

2. **Instalar dependencias necesarias:**
   ```bash
   npm install @radix-ui/react-dialog lucide-react
   ```

3. **Configurar rutas en tu aplicación:**
   ```jsx
   // En tu router principal
   import Landing from './pages/Landing'
   import OnboardingForm from './pages/OnboardingForm'
   
   // Agregar rutas
   <Route path="/landing" component={Landing} />
   <Route path="/onboarding-form" component={OnboardingForm} />
   ```

### Opción 2: Como Subdominio/Micrositio

1. **Crear proyecto independiente:**
   ```bash
   # Usar los archivos como proyecto separado
   npm install
   npm run build
   # Desplegar en subdominio: beta.finkargo.com
   ```

## 🎬 Configuración del Video Demo

### Paso 1: Reemplazar URL del Video
En `App.jsx`, línea ~95, reemplaza la URL del iframe:

```jsx
// Para YouTube
<iframe
  width="100%"
  height="100%"
  src="https://www.youtube.com/embed/TU_VIDEO_ID"
  title="Demo Finkargo SCI"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
  className="rounded-lg"
></iframe>

// Para Vimeo
<iframe
  width="100%"
  height="100%"
  src="https://player.vimeo.com/video/TU_VIDEO_ID"
  title="Demo Finkargo SCI"
  frameBorder="0"
  allow="autoplay; fullscreen; picture-in-picture"
  allowFullScreen
  className="rounded-lg"
></iframe>

// Para Loom
<iframe
  width="100%"
  height="100%"
  src="https://www.loom.com/embed/TU_VIDEO_ID"
  title="Demo Finkargo SCI"
  frameBorder="0"
  allowFullScreen
  className="rounded-lg"
></iframe>
```

### Paso 2: Personalizar Configuración del Modal
```jsx
// Ajustar tamaño del modal si es necesario
<DialogContent className="max-w-4xl w-full"> // Cambiar max-w-4xl por el tamaño deseado
```

## 📝 Configuración del Formulario de Onboarding

### Paso 1: Integrar con tu Backend
En `OnboardingForm.jsx`, línea ~47, reemplaza la función `handleSubmit`:

```jsx
const handleSubmit = async (e) => {
  e.preventDefault()
  
  try {
    // Opción 1: API propia
    const response = await fetch('/api/beta-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    })
    
    // Opción 2: Integración con CRM (HubSpot, Salesforce, etc.)
    // await submitToHubSpot(formData)
    
    // Opción 3: Servicio de forms (Typeform, Google Forms, etc.)
    // await submitToTypeform(formData)
    
    if (response.ok) {
      setIsSubmitted(true)
      // Opcional: enviar evento a analytics
      // gtag('event', 'beta_request_submitted', { value: 1 })
    }
  } catch (error) {
    console.error('Error submitting form:', error)
    // Manejar error
  }
}
```

### Paso 2: Configurar Redirección del CTA
En `App.jsx`, línea ~78, personaliza la función `handleBetaAccess`:

```jsx
const handleBetaAccess = () => {
  // Opción 1: Redirigir a página interna
  window.location.href = '/onboarding-form'
  
  // Opción 2: Abrir en nueva pestaña
  // window.open('/onboarding-form', '_blank')
  
  // Opción 3: Redirigir a formulario externo
  // window.open('https://forms.typeform.com/tu-formulario', '_blank')
  
  // Opción 4: Usar router de React
  // navigate('/onboarding-form')
}
```

## 🎨 Personalización de Estilos

### Colores de Marca
En `tailwind.config.js`, personaliza los colores:

```js
theme: {
  extend: {
    colors: {
      // Agregar colores específicos de Finkargo
      'finkargo-blue': '#1E40AF',
      'finkargo-teal': '#0D9488',
      // ... otros colores
    }
  }
}
```

### Fuentes Personalizadas
En `App.css`, agregar fuentes:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
  font-family: 'Inter', sans-serif;
}
```

## 📊 Integración con Analytics

### Google Analytics 4
```jsx
// En cada CTA importante
const handleBetaAccess = () => {
  // Enviar evento a GA4
  gtag('event', 'beta_access_clicked', {
    event_category: 'conversion',
    event_label: selectedSegment,
    value: 1
  })
  
  // Tu lógica de redirección
  window.location.href = '/onboarding-form'
}

const handleVideoDemo = () => {
  gtag('event', 'video_demo_opened', {
    event_category: 'engagement',
    event_label: selectedSegment,
    value: 1
  })
  
  setShowVideoModal(true)
}
```

### Facebook Pixel / Meta Pixel
```jsx
// En eventos de conversión
const handleBetaAccess = () => {
  // Enviar evento a Meta
  fbq('track', 'Lead', {
    content_name: 'Beta Access Request',
    content_category: selectedSegment,
    value: 12600, // Valor de la oferta
    currency: 'USD'
  })
  
  window.location.href = '/onboarding-form'
}
```

## 🔧 Configuración de Desarrollo

### Dependencias Principales
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "lucide-react": "^0.263.1",
    "tailwindcss": "^3.3.0",
    "tailwindcss-animate": "^1.0.7"
  }
}
```

### Scripts de Desarrollo
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### Comandos Útiles
```bash
# Desarrollo local
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting (si tienes ESLint configurado)
npm run lint
```

## 📱 Optimización Mobile

La landing page está completamente optimizada para móvil con:
- **Diseño responsive** en todas las secciones
- **Botones touch-friendly** con tamaños apropiados
- **Texto legible** en pantallas pequeñas
- **Imágenes optimizadas** que se adaptan al viewport
- **Modal de video responsive** que funciona en móvil

## 🚀 Deployment

### Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify
```bash
# Build
npm run build

# Subir carpeta dist/ a Netlify
```

### AWS S3 + CloudFront
```bash
# Build
npm run build

# Sync con S3
aws s3 sync dist/ s3://tu-bucket --delete
```

## 🔍 SEO y Meta Tags

Agregar en el `<head>` de tu HTML:

```html
<!-- Meta tags básicos -->
<title>Finkargo SCI - Inteligencia de Cadena de Suministro Instantánea</title>
<meta name="description" content="Transforma tu Excel de inventario en inteligencia de negocio en 30 segundos. Programa Beta exclusivo - Solo 30 empresas.">

<!-- Open Graph (Facebook, LinkedIn) -->
<meta property="og:title" content="Finkargo SCI - Programa Beta Exclusivo">
<meta property="og:description" content="Obtén control total de tu cadena de suministro. 120 días gratis para 30 empresas pioneras.">
<meta property="og:image" content="/assets/hero-dashboard.png">
<meta property="og:url" content="https://tu-dominio.com/landing">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Finkargo SCI - Programa Beta Exclusivo">
<meta name="twitter:description" content="Transforma tu cadena de suministro en ventaja competitiva.">
<meta name="twitter:image" content="/assets/hero-dashboard.png">
```

## 📈 Métricas y Conversión

### KPIs a Monitorear
- **Tasa de conversión general**: Visitantes → Solicitudes beta
- **Conversión por segmento**: Cuál segmento convierte mejor
- **Engagement con video**: Cuántos abren el modal de demo
- **Abandono en formulario**: En qué paso abandonan más
- **Tiempo en página**: Engagement general
- **Scroll depth**: Qué tan abajo llegan los usuarios

### Herramientas Recomendadas
- **Google Analytics 4**: Tracking general y eventos
- **Hotjar/FullStory**: Heatmaps y grabaciones de sesión
- **Google Optimize**: A/B testing
- **Mixpanel**: Análisis de eventos específicos

## 🛠️ Troubleshooting

### Problemas Comunes

1. **Modal de video no abre**
   - Verificar que `@radix-ui/react-dialog` está instalado
   - Comprobar que el estado `showVideoModal` se actualiza

2. **Estilos no se aplican**
   - Verificar que Tailwind CSS está configurado correctamente
   - Comprobar que `App.css` se importa en el componente

3. **Formulario no envía**
   - Verificar la función `handleSubmit` en `OnboardingForm.jsx`
   - Comprobar la URL del endpoint de tu API

4. **Imágenes no cargan**
   - Verificar que las imágenes están en la carpeta `assets/`
   - Comprobar las rutas de importación

## 📞 Soporte

Para dudas sobre la implementación:
1. Revisar este README completo
2. Verificar la consola del navegador para errores
3. Comprobar que todas las dependencias están instaladas
4. Verificar la configuración de rutas en tu aplicación

## 🎉 ¡Listo para Lanzar!

Con esta configuración tienes todo lo necesario para:
- ✅ Capturar leads calificados con el formulario de onboarding
- ✅ Mostrar demos personalizados con el modal de video
- ✅ Segmentar usuarios automáticamente
- ✅ Optimizar conversiones con psicología aplicada
- ✅ Escalar el programa beta a 30 clientes

**¡Es hora de transformar 30 cadenas de suministro y construir el futuro de Finkargo SCI!**

