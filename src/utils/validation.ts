import { CropForm } from "@/pages/Crops";

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof CropForm, string>>;
}

export const validateCropForm = (formData: CropForm): ValidationResult => {
  const errors: Partial<Record<keyof CropForm, string>> = {};
  let valid = true;

  // Required fields
  if (!formData.crop_name?.trim()) {
    errors.crop_name = 'Crop name is required';
    valid = false;
  }

  if (!formData.farmer_id) {
    errors.farmer_id = 'Farmer is required';
    valid = false;
  }

  // Date validations
  if (formData.planting_date && formData.expected_harvest_date) {
    const plantingDate = new Date(formData.planting_date);
    const harvestDate = new Date(formData.expected_harvest_date);
    
    if (harvestDate <= plantingDate) {
      errors.expected_harvest_date = 'Harvest date must be after planting date';
      valid = false;
    }
  }

  // Numeric validations
  if (formData.farm_area && isNaN(Number(formData.farm_area)) || Number(formData.farm_area) <= 0) {
    errors.farm_area = 'Farm area must be a positive number';
    valid = false;
  }

  if (formData.quantity_planted && (isNaN(Number(formData.quantity_planted)) || Number(formData.quantity_planted) <= 0)) {
    errors.quantity_planted = 'Quantity must be a positive number';
    valid = false;
  }

  if (formData.quantity_harvested && (isNaN(Number(formData.quantity_harvested)) || Number(formData.quantity_harvested) < 0)) {
    errors.quantity_harvested = 'Quantity must be a non-negative number';
    valid = false;
  }

  return { valid, errors };
};

export const validateImageFile = (file: File): { valid: boolean; message?: string } => {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return { 
      valid: false, 
      message: 'Invalid file type. Please upload an image (JPEG, PNG, WebP, or GIF).' 
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { 
      valid: false, 
      message: `File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`
    };
  }

  return { valid: true };
};
