import { useState } from 'react'
import { Card, Button, Input } from './ui/BaseComponents'
import { useToast } from '../context/ToastContext'

function ReportForm({ onSubmit, loading }) {
  const { error: showError } = useToast()
  const [formData, setFormData] = useState({
    vehicle_no: '',
    rule_id: '',
    location_description: '',
    latitude: null,
    longitude: null,
    evidence_image: null
  })
  const [errors, setErrors] = useState({})

  const violationRules = [
    { id: 1, code: 'S177', fine: 500, description: 'General Driving Offences' },
    { id: 2, code: 'S178', fine: 500, description: 'Driving without License' },
    { id: 3, code: 'S179', fine: 1000, description: 'Disobedience of Traffic Signal' },
    { id: 4, code: 'S180', fine: 2000, description: 'Driving without Registration' },
    { id: 5, code: 'S181', fine: 5000, description: 'Driving without Insurance' },
    { id: 6, code: 'S182', fine: 1000, description: 'Dangerous Driving' },
    { id: 7, code: 'S183', fine: 500, description: 'Overspeeding' },
    { id: 8, code: 'S184', fine: 1000, description: 'Wrong Side Driving' },
    { id: 9, code: 'S185', fine: 500, description: 'Triple Riding' },
    { id: 10, code: 'S186', fine: 2000, description: 'Driving under Influence' },
  ]

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.vehicle_no.trim()) {
      newErrors.vehicle_no = 'Vehicle number is required'
    } else if (!/^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4}$/i.test(formData.vehicle_no.replace(/\s/g, ''))) {
      newErrors.vehicle_no = 'Invalid vehicle number format (e.g., MH12AB1234)'
    }
    
    if (!formData.rule_id) {
      newErrors.rule_id = 'Please select a violation type'
    }
    
    if (!formData.location_description.trim()) {
      newErrors.location_description = 'Location description is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('Image size must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        showError('Please upload an image file')
        return
      }
      setFormData({ ...formData, evidence_image: file })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    if (!formData.evidence_image) {
      showError('Please upload evidence photo')
      return
    }
    
    onSubmit(formData)
  }

  const getLocation = () => {
    if (!navigator.geolocation) {
      showError('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      (err) => {
        showError('Unable to retrieve location. Please enable location access.')
      }
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          Submit Violation Report
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Report traffic violations you witness. All reports are reviewed by police officers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Vehicle Number */}
        <Input
          label="Vehicle Number"
          name="vehicle_no"
          value={formData.vehicle_no}
          onChange={handleChange}
          placeholder="e.g., MH12AB1234"
          required
          error={errors.vehicle_no}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          }
        />

        {/* Violation Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Violation Type <span className="text-red-500">*</span>
          </label>
          <select
            name="rule_id"
            value={formData.rule_id}
            onChange={handleChange}
            className="gov-input"
          >
            <option value="">Select a violation...</option>
            {violationRules.map((rule) => (
              <option key={rule.id} value={rule.id}>
                {rule.code} - {rule.description} (₹{rule.fine})
              </option>
            ))}
          </select>
          {errors.rule_id && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.rule_id}</p>
          )}
        </div>

        {/* Location Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Location Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="location_description"
            value={formData.location_description}
            onChange={handleChange}
            placeholder="Describe the location (e.g., Near Central Park, 5th Avenue)"
            rows={3}
            className="gov-input resize-none"
          />
          {errors.location_description && (
            <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.location_description}</p>
          )}
        </div>

        {/* GPS Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            GPS Location (Optional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.latitude && formData.longitude ? `${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}` : ''}
              placeholder="Click button to get GPS coordinates"
              disabled
              className="gov-input flex-1"
            />
            <Button
              type="button"
              onClick={getLocation}
              variant="outline"
              size="md"
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              }
            >
              Get
            </Button>
          </div>
        </div>

        {/* Evidence Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Evidence Photo <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary-500 transition-colors cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="evidence-upload"
            />
            <label htmlFor="evidence-upload" className="cursor-pointer">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {formData.evidence_image ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    ✓ {formData.evidence_image.name}
                  </span>
                ) : (
                  <>
                    <span className="font-medium text-primary-600 dark:text-primary-400">Click to upload</span> or drag and drop
                  </>
                )}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                PNG, JPG, GIF up to 5MB
              </p>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          fullWidth
          disabled={loading}
          variant="primary"
          size="lg"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting Report...
            </span>
          ) : (
            'Submit Report'
          )}
        </Button>
      </form>
    </Card>
  )
}

export default ReportForm
