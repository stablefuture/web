// Plain-English names for the 26 SOC 2020 sub-major groups the jobs dropdown
// browses, in code order. ONS titles ("Business and public service associate
// professionals") are correct and unreadable; these say what the jobs are.
// Where a professional group has an associate-level twin (21/31, 22/32, 24/35)
// the twin ends in "associates" so the pair reads apart in the list.
// Keyed by the two-digit code in the sector id `soc2:NN`.
export const SECTOR_LABEL: Record<string, string> = {
  "soc2:11": "Company managers and directors",
  "soc2:12": "Small business owners and other managers",
  "soc2:21": "Science, engineering and tech",
  "soc2:22": "Doctors, nurses and health",
  "soc2:23": "Teaching and education",
  "soc2:24": "Business, law, finance and media",
  "soc2:31": "Science, engineering and tech associates",
  "soc2:32": "Health and social care associates",
  "soc2:33": "Police, fire and armed forces",
  "soc2:34": "Arts, media and sport",
  "soc2:35": "Business, sales and finance associates",
  "soc2:41": "Administration and clerical",
  "soc2:42": "Secretarial and PAs",
  "soc2:51": "Farming, gardening and animal care",
  "soc2:52": "Electrical, metal and engineering trades",
  "soc2:53": "Construction and building",
  "soc2:54": "Chefs, printing, textiles and other trades",
  "soc2:61": "Care and childcare",
  "soc2:62": "Leisure, travel, hair and beauty",
  "soc2:63": "Community and enforcement officers",
  "soc2:71": "Retail and sales",
  "soc2:72": "Customer service and call centres",
  "soc2:81": "Factory, plant and machine operators",
  "soc2:82": "Drivers",
  "soc2:91": "Labouring: warehouse, farm and building",
  "soc2:92": "Cleaning, hospitality and security",
};
