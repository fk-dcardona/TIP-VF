/**
 * 🏢 Enhanced Company Setup Component
 * SuperClaude Optimized for Multi-Country Support
 * 
 * Features:
 * - Country selection (Colombia/Mexico)
 * - Dynamic tax ID validation
 * - Country-specific settings
 * - Localized demo data
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Text, TextInput, Select, SelectItem, Button, Badge } from '@tremor/react';
import { Building2, AlertCircle, CheckCircle, Globe } from 'lucide-react';
import { 
  getCountryConfig, 
  validateTaxId, 
  formatTaxId,
  COUNTRY_CONFIGS 
} from '@/lib/country-config';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { logger } from '@/lib/logger';

interface CompanyData {
  name: string;
  taxId: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  industry: string;
  importFrequency: string;
  primaryOrigins: string[];
  useDemoData: boolean;
}

export function EnhancedCompanySetup({ onComplete }: { onComplete: (data: CompanyData) => void }) {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [formData, setFormData] = useState<CompanyData>({
    name: '',
    taxId: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    industry: '',
    importFrequency: 'weekly',
    primaryOrigins: [],
    useDemoData: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [taxIdValid, setTaxIdValid] = useState<boolean | null>(null);
  
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Get country-specific configuration
  const countryConfig = selectedCountry ? getCountryConfig(selectedCountry) : null;

  // Industries (same for both countries)
  const industries = [
    { value: 'textiles', label: 'Textiles y Confección' },
    { value: 'electronics', label: 'Electrónicos y Tecnología' },
    { value: 'machinery', label: 'Maquinaria y Equipos' },
    { value: 'chemicals', label: 'Químicos y Farmacéuticos' },
    { value: 'food', label: 'Alimentos y Bebidas' },
    { value: 'automotive', label: 'Automotriz' },
    { value: 'construction', label: 'Construcción' },
    { value: 'retail', label: 'Retail' },
    { value: 'other', label: 'Otro' },
  ];

  // Origin countries
  const origins = [
    { value: 'CN', label: '🇨🇳 China' },
    { value: 'US', label: '🇺🇸 Estados Unidos' },
    { value: 'MX', label: '🇲🇽 México' },
    { value: 'CO', label: '🇨🇴 Colombia' },
    { value: 'DE', label: '🇩🇪 Alemania' },
    { value: 'JP', label: '🇯🇵 Japón' },
    { value: 'KR', label: '🇰🇷 Corea del Sur' },
    { value: 'IN', label: '🇮🇳 India' },
    { value: 'BR', label: '🇧🇷 Brasil' },
  ];

  // Update form when country changes
  useEffect(() => {
    if (selectedCountry) {
      setFormData(prev => ({
        ...prev,
        country: selectedCountry,
        city: '', // Reset city when country changes
      }));
    }
  }, [selectedCountry]);

  const handleTaxIdChange = (value: string) => {
    if (!countryConfig) return;
    
    const formatted = formatTaxId(value, selectedCountry);
    setFormData({ ...formData, taxId: formatted });
    
    // Validate based on country
    const minLength = selectedCountry === 'CO' ? 10 : 12;
    const cleanLength = value.replace(/[^A-Z0-9]/gi, '').length;
    
    if (cleanLength >= minLength) {
      const isValid = validateTaxId(value, selectedCountry);
      setTaxIdValid(isValid);
      
      if (!isValid) {
        setErrors({ ...errors, taxId: `${countryConfig.taxId.name} inválido` });
      } else {
        const { taxId, ...otherErrors } = errors;
        setErrors(otherErrors);
      }
    } else {
      setTaxIdValid(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedCountry) newErrors.country = 'Seleccione un país';
    if (!formData.name) newErrors.name = 'Nombre de empresa requerido';
    if (!formData.taxId) newErrors.taxId = `${countryConfig?.taxId.name || 'ID fiscal'} requerido`;
    if (countryConfig && !validateTaxId(formData.taxId, selectedCountry)) {
      newErrors.taxId = `${countryConfig.taxId.name} inválido`;
    }
    if (!formData.email) newErrors.email = 'Email requerido';
    if (!formData.email.includes('@')) newErrors.email = 'Email inválido';
    if (!formData.phone) newErrors.phone = 'Teléfono requerido';
    if (!formData.city) newErrors.city = 'Ciudad requerida';
    if (!formData.industry) newErrors.industry = 'Industria requerida';
    if (formData.primaryOrigins.length === 0) newErrors.origins = 'Seleccione al menos un país de origen';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Check if company already exists
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq(selectedCountry === 'CO' ? 'nit' : 'rfc', formData.taxId)
        .single();
      
      if (existingCompany) {
        setErrors({ taxId: `Ya existe una empresa con este ${countryConfig?.taxId.name}` });
        setLoading(false);
        return;
      }
      
      logger.info('Company setup completed', {
        company: formData.name,
        country: selectedCountry,
        industry: formData.industry,
        demo: formData.useDemoData,
      });
      
      onComplete(formData);
    } catch (error) {
      logger.error('Company setup failed', error);
      setErrors({ submit: 'Error al configurar la empresa' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <Building2 className="h-12 w-12 mx-auto text-indigo-600 mb-4" />
          <Text className="text-2xl font-bold">Configuración de Empresa</Text>
          <Text className="text-gray-600 mt-2">
            Complete la información de su empresa para personalizar TIP
          </Text>
        </div>

        <div className="space-y-4">
          {/* Country Selection */}
          <div className="border-2 border-indigo-200 rounded-lg p-4 bg-indigo-50">
            <label className="block text-sm font-medium mb-2">
              <Globe className="inline h-4 w-4 mr-1" />
              Seleccione su País *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(COUNTRY_CONFIGS).map(([code, config]) => (
                <button
                  key={code}
                  onClick={() => setSelectedCountry(code)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedCountry === code
                      ? 'border-indigo-600 bg-white shadow-md'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">{config.flag}</span>
                    <span className="font-medium">{config.name}</span>
                  </div>
                  <Text className="text-xs text-gray-500 mt-1">
                    {config.currency.code} • {config.taxId.name}
                  </Text>
                </button>
              ))}
            </div>
            {errors.country && (
              <Text className="text-sm text-red-600 mt-1">{errors.country}</Text>
            )}
          </div>

          {selectedCountry && countryConfig && (
            <>
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nombre de la Empresa *
                </label>
                <TextInput
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={`${selectedCountry === 'CO' ? 'Importadora ABC S.A.S.' : 'Importadora ABC S.A. de C.V.'}`}
                  error={!!errors.name}
                  errorMessage={errors.name}
                />
              </div>

              {/* Tax ID */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {countryConfig.taxId.name} *
                </label>
                <div className="relative">
                  <TextInput
                    value={formData.taxId}
                    onChange={(e) => handleTaxIdChange(e.target.value)}
                    placeholder={countryConfig.taxId.placeholder}
                    error={!!errors.taxId}
                    errorMessage={errors.taxId}
                  />
                  {taxIdValid !== null && (
                    <div className="absolute right-2 top-2">
                      {taxIdValid ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                <Text className="text-xs text-gray-500 mt-1">
                  Formato: {countryConfig.taxId.format}
                </Text>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email Corporativo *
                </label>
                <TextInput
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@empresa.com"
                  error={!!errors.email}
                  errorMessage={errors.email}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Teléfono *
                </label>
                <TextInput
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={countryConfig.business.phoneFormat}
                  error={!!errors.phone}
                  errorMessage={errors.phone}
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Ciudad *
                </label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => setFormData({ ...formData, city: value })}
                  placeholder="Seleccione su ciudad"
                >
                  {countryConfig.cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </Select>
                {errors.city && (
                  <Text className="text-sm text-red-600 mt-1">{errors.city}</Text>
                )}
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Industria *
                </label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => setFormData({ ...formData, industry: value })}
                  placeholder="Seleccione su industria"
                >
                  {industries.map((industry) => (
                    <SelectItem key={industry.value} value={industry.value}>
                      {industry.label}
                    </SelectItem>
                  ))}
                </Select>
                {errors.industry && (
                  <Text className="text-sm text-red-600 mt-1">{errors.industry}</Text>
                )}
              </div>

              {/* Import Frequency */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Frecuencia de Importación
                </label>
                <Select
                  value={formData.importFrequency}
                  onValueChange={(value) => setFormData({ ...formData, importFrequency: value })}
                >
                  <SelectItem value="daily">Diaria</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="biweekly">Quincenal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                </Select>
              </div>

              {/* Origin Countries */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Países de Origen Principales *
                </label>
                <Text className="text-xs text-gray-500 mb-2">
                  Puertos principales: {countryConfig.ports.join(', ')}
                </Text>
                <div className="grid grid-cols-2 gap-2">
                  {origins
                    .filter(origin => origin.value !== selectedCountry) // Don't show own country
                    .map((origin) => (
                      <label
                        key={origin.value}
                        className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.primaryOrigins.includes(origin.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                primaryOrigins: [...formData.primaryOrigins, origin.value],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                primaryOrigins: formData.primaryOrigins.filter(o => o !== origin.value),
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span>{origin.label}</span>
                      </label>
                    ))}
                </div>
                {errors.origins && (
                  <Text className="text-sm text-red-600 mt-1">{errors.origins}</Text>
                )}
              </div>

              {/* Demo Data Option */}
              <div className="p-4 bg-indigo-50 rounded-lg">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.useDemoData}
                    onChange={(e) => setFormData({ ...formData, useDemoData: e.target.checked })}
                    className="rounded"
                  />
                  <div>
                    <Text className="font-medium">Cargar datos de demostración</Text>
                    <Text className="text-sm text-gray-600">
                      Incluye 10 operaciones de importación de ejemplo adaptadas a {countryConfig.name}
                    </Text>
                  </div>
                </label>
              </div>

              {/* Country Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <Text className="font-medium mb-2">Información de {countryConfig.name}</Text>
                <div className="space-y-1 text-sm">
                  <Text>• IVA: {countryConfig.taxes.vat}%</Text>
                  <Text>• Arancel promedio: {countryConfig.taxes.importDuty}%</Text>
                  <Text>• Agencia aduanera: {countryConfig.customs.agency}</Text>
                  <Text>• Tiempo promedio en aduana: {countryConfig.customs.avgProcessingDays} días</Text>
                  <Text>• {countryConfig.business.businessHours}</Text>
                </div>
              </div>

              {/* Error message */}
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <Text className="text-red-600">{errors.submit}</Text>
                </div>
              )}

              {/* Submit button */}
              <Button
                size="lg"
                className="w-full"
                onClick={handleSubmit}
                loading={loading}
                disabled={loading}
              >
                Continuar con la Configuración
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}