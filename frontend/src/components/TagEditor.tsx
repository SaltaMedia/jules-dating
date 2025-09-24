'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

interface TagEditorProps {
  item: any;
  onUpdate: (updatedItem: any) => void;
  onClose: () => void;
}

const CATEGORIES = ['top', 'outerwear', 'bottom', 'footwear', 'accessory', 'underlayer', 'other'];
const PATTERNS = ['solid', 'stripe', 'check', 'print', 'texture', 'other'];
const FORMALITY = ['casual', 'smart-casual', 'business-casual', 'formal', 'athleisure'];
const FIT = ['slim', 'tailored', 'relaxed', 'oversized', 'unknown'];
const CONDITION = ['new', 'good', 'worn', 'retire'];
const SEASONS = ['spring', 'summer', 'fall', 'winter', 'all-season'];

const COMMON_COLORS = [
  'black', 'white', 'navy', 'gray', 'brown', 'beige', 'olive', 'burgundy',
  'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'tan'
];

const COMMON_MATERIALS = [
  'cotton', 'wool', 'denim', 'leather', 'suede', 'linen', 'silk', 'polyester',
  'cashmere', 'tweed', 'flannel', 'chino', 'canvas', 'nylon', 'spandex'
];

export default function TagEditor({ item, onUpdate, onClose }: TagEditorProps) {
  const [tags, setTags] = useState(item.tags || {});
  const [isSaving, setIsSaving] = useState(false);
  const [newColor, setNewColor] = useState('');
  const [newMaterial, setNewMaterial] = useState('');
  const [newOccasion, setNewOccasion] = useState('');

  useEffect(() => {
    setTags(item.tags || {});
  }, [item]);

  const handleTagChange = async (field: string, value: any) => {
    const updatedTags = { ...tags, [field]: value };
    setTags(updatedTags);
    
    // Don't auto-save - let user save manually
  };

  const saveTags = async (updatedTags: any) => {
    setIsSaving(true);
    try {
      const response = await apiClient.wardrobe.updateTags(item._id || item.itemId, updatedTags);
      onUpdate(response.data);
    } catch (error) {
      console.error('Error saving tags:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addColor = () => {
    if (newColor.trim() && !tags.colors?.includes(newColor.trim())) {
      const updatedColors = [...(tags.colors || []), newColor.trim()];
      handleTagChange('colors', updatedColors);
      setNewColor('');
    }
  };

  const removeColor = (color: string) => {
    const updatedColors = tags.colors?.filter((c: string) => c !== color) || [];
    handleTagChange('colors', updatedColors);
  };

  const addMaterial = () => {
    if (newMaterial.trim() && !tags.material?.includes(newMaterial.trim())) {
      const updatedMaterials = [...(tags.material || []), newMaterial.trim()];
      handleTagChange('material', updatedMaterials);
      setNewMaterial('');
    }
  };

  const removeMaterial = (material: string) => {
    const updatedMaterials = tags.material?.filter((m: string) => m !== material) || [];
    handleTagChange('material', updatedMaterials);
  };

  const addOccasion = () => {
    if (newOccasion.trim() && !tags.occasions?.includes(newOccasion.trim())) {
      const updatedOccasions = [...(tags.occasions || []), newOccasion.trim()];
      handleTagChange('occasions', updatedOccasions);
      setNewOccasion('');
    }
  };

  const removeOccasion = (occasion: string) => {
    const updatedOccasions = tags.occasions?.filter((o: string) => o !== occasion) || [];
    handleTagChange('occasions', updatedOccasions);
  };

  const toggleSeason = (season: string) => {
    const currentSeasons = tags.seasonality || [];
    const updatedSeasons = currentSeasons.includes(season)
      ? currentSeasons.filter((s: string) => s !== season)
      : [...currentSeasons, season];
    handleTagChange('seasonality', updatedSeasons);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mobile-scroll-container">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Edit Item Tags</h2>
          <div className="flex items-center space-x-2">
            {isSaving && (
              <span className="text-sm text-gray-500">Saving...</span>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Item Image */}
        <div className="mb-6">
          <img
            src={item.image?.url || item.imageUrl}
            alt="Item"
            className="w-32 h-32 object-cover rounded-lg mx-auto"
          />
        </div>

        <div className="space-y-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={tags.category || ''}
              onChange={(e) => handleTagChange('category', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="">Select category</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategory
            </label>
            <input
              type="text"
              value={tags.subcategory || ''}
              onChange={(e) => handleTagChange('subcategory', e.target.value)}
              placeholder="e.g., t-shirt, oxford, chino"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>

          {/* Colors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Colors
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.colors?.map((color: string) => (
                <span
                  key={color}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600/30 backdrop-blur-sm text-black border border-blue-400/30"
                >
                  {color}
                  <button
                    onClick={() => removeColor(color)}
                    className="ml-1 text-black hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder="Add color"
                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                onKeyPress={(e) => e.key === 'Enter' && addColor()}
              />
              <button
                onClick={addColor}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {COMMON_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => {
                    if (!tags.colors?.includes(color)) {
                      const updatedColors = [...(tags.colors || []), color];
                      handleTagChange('colors', updatedColors);
                    }
                  }}
                  className="px-2 py-1 text-xs bg-gray-600/30 backdrop-blur-sm hover:bg-gray-500/40 rounded text-black border border-gray-400/30"
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Pattern */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pattern
            </label>
            <select
              value={tags.pattern || 'solid'}
              onChange={(e) => handleTagChange('pattern', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              {PATTERNS.map(pattern => (
                <option key={pattern} value={pattern}>
                  {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Materials */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Materials
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.material?.map((material: string) => (
                <span
                  key={material}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-600/30 backdrop-blur-sm text-black border border-green-400/30"
                >
                  {material}
                  <button
                    onClick={() => removeMaterial(material)}
                    className="ml-1 text-black hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMaterial}
                onChange={(e) => setNewMaterial(e.target.value)}
                placeholder="Add material"
                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                onKeyPress={(e) => e.key === 'Enter' && addMaterial()}
              />
              <button
                onClick={addMaterial}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {COMMON_MATERIALS.map(material => (
                <button
                  key={material}
                  onClick={() => {
                    if (!tags.material?.includes(material)) {
                      const updatedMaterials = [...(tags.material || []), material];
                      handleTagChange('material', updatedMaterials);
                    }
                  }}
                  className="px-2 py-1 text-xs bg-gray-600/30 backdrop-blur-sm hover:bg-gray-500/40 rounded text-black border border-gray-400/30"
                >
                  {material}
                </button>
              ))}
            </div>
          </div>

          {/* Seasonality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seasons
            </label>
            <div className="flex flex-wrap gap-2">
              {SEASONS.map(season => (
                <button
                  key={season}
                  onClick={() => toggleSeason(season)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    tags.seasonality?.includes(season)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {season.charAt(0).toUpperCase() + season.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Formality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formality
            </label>
            <select
              value={tags.formality || 'casual'}
              onChange={(e) => handleTagChange('formality', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              {FORMALITY.map(formality => (
                <option key={formality} value={formality}>
                  {formality.charAt(0).toUpperCase() + formality.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Fit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fit
            </label>
            <select
              value={tags.fit || 'unknown'}
              onChange={(e) => handleTagChange('fit', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              {FIT.map(fit => (
                <option key={fit} value={fit}>
                  {fit.charAt(0).toUpperCase() + fit.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition
            </label>
            <select
              value={tags.condition || 'good'}
              onChange={(e) => handleTagChange('condition', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              {CONDITION.map(condition => (
                <option key={condition} value={condition}>
                  {condition.charAt(0).toUpperCase() + condition.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Guess */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand (if known)
            </label>
            <input
              type="text"
              value={tags.brandGuess || ''}
              onChange={(e) => handleTagChange('brandGuess', e.target.value)}
              placeholder="e.g., Nike, Levi's, Uniqlo"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>

          {/* Occasions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Occasions
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.occasions?.map((occasion: string) => (
                <span
                  key={occasion}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                >
                  {occasion}
                  <button
                    onClick={() => removeOccasion(occasion)}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newOccasion}
                onChange={(e) => setNewOccasion(e.target.value)}
                placeholder="Add occasion"
                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                onKeyPress={(e) => e.key === 'Enter' && addOccasion()}
              />
              <button
                onClick={addOccasion}
                className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 sticky bottom-0 bg-white pt-4 border-t border-gray-200 pb-20 sm:pb-4">
          <button
            onClick={() => saveTags(tags)}
            disabled={isSaving}
            className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 mobile-button"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-3 sm:py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 mobile-button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 