const { z } = require('zod');

const BodyInfoZ = z.object({
  heightCm: z.number().min(120).max(230).optional(),
  weightKg: z.number().min(40).max(250).optional(),
  topSize: z.string().optional(),
  bottomSize: z.string().optional(),
  shoeSize: z.string().optional(),
  bodyType: z.enum(["Slim","Average","Athletic","Broad","Plus","Other"]).optional()
}).strict();

const StyleProfileZ = z.object({
  preferredStyles: z.array(z.string()).optional(),
  colorsLove: z.array(z.string()).optional(),
  colorsAvoid: z.array(z.string()).optional(),
  fitPreference: z.enum(["Slim","Tailored","Relaxed","Oversized","Mixed"]).optional(),
  vibeTags: z.array(z.string()).optional(),
  favoriteBrands: z.array(z.string()).optional(),
  noGoItems: z.array(z.string()).optional(),
  fabricSensitivities: z.array(z.string()).optional()
}).strict();

const LifestyleZ = z.object({
  primaryEnvironments: z.array(z.string()).optional(),
  topActivities: z.array(z.string()).optional(),
  city: z.string().optional(),
  climateNotes: z.string().optional(),
  datingMode: z.boolean().optional(),
  impressionWord: z.string().optional(),
  idealFirstDateLook: z.string().optional(),
  relationshipStatus: z.enum(["Single","Dating","In a Relationship","Married","Prefer not to say"]).optional(),
  monthlyClothingBudget: z.enum(['<$100', '$100–$250', '$250–$500', '$500+']).optional()
}).strict();

const WardrobeZ = z.object({
  mostWornItem: z.string().optional(),
  missingItems: z.array(z.string()).optional(),
  closetPhotos: z.array(z.object({
    url: z.string().url(),
    label: z.string().optional(),
    uploadedAt: z.string().datetime().optional()
  })).optional(),
  accessories: z.array(z.string()).optional(),
  hairBeardStyle: z.string().optional(),
  shoeTypes: z.array(z.string()).optional()
}).strict();

const InvestmentZ = z.object({
  level: z.enum(["Everyday Value","Core Quality","Premium Wardrobe","Luxury Statement"]).optional(),
  fewerBetterPieces: z.boolean().optional(),
  preferredRetailers: z.array(z.string()).optional()
}).strict();

const ProfileUpsertZ = z.object({
  name: z.string().optional(),
  aboutMe: z.string().max(600).optional(),
  bodyInfo: BodyInfoZ.optional(),
  styleProfile: StyleProfileZ.optional(),
  lifestyle: LifestyleZ.optional(),
  wardrobe: WardrobeZ.optional(),
  investment: InvestmentZ.optional()
}).strict();

module.exports = {
  BodyInfoZ,
  StyleProfileZ,
  LifestyleZ,
  WardrobeZ,
  InvestmentZ,
  ProfileUpsertZ
}; 