// Plain-English names for the 26 SOC 2020 sub-major groups the jobs dropdown
// browses, in code order. ONS titles ("Business and public service associate
// professionals") are correct and unreadable; these say what the jobs are.
// Where a professional group has an associate-level twin (21/31, 22/32, 24/35)
// the twin ends in "associates" so the pair reads apart in the list.
// Keyed by the two-digit code in the sector id `soc2:NN`.
export const SECTOR_LABEL: Record<string, string> = {
  "soc2:11": "Corporate leaders and public officials",
  "soc2:12": "Other managers and business owners",
  "soc2:21": "Science, engineering, technology and environment",
  "soc2:22": "Health professionals",
  "soc2:23": "Teaching and education professionals",
  "soc2:24": "Business, law, welfare, media and public service",
  "soc2:31": "Science, engineering and technology associates",
  "soc2:32": "Health and social care associates",
  "soc2:33": "Armed forces, police and prisons",
  "soc2:34": "Arts, design, media and sport",
  "soc2:35": "Business, finance, transport and public service associates",
  "soc2:41": "Administration and clerical",
  "soc2:42": "Secretarial and PAs",
  "soc2:51": "Farming, fishing and gardening trades",
  "soc2:52": "Electrical, metal and engineering trades",
  "soc2:53": "Construction and building",
  "soc2:54": "Chefs, printing, textiles and other trades",
  "soc2:61": "Care, childcare, animal care and support services",
  "soc2:62": "Leisure, travel, hair, beauty and caretaking",
  "soc2:63": "Community and enforcement officers",
  "soc2:71": "Retail and sales",
  "soc2:72": "Customer service, call centres and communications",
  "soc2:81": "Process, plant, machine and construction operatives",
  "soc2:82": "Drivers and transport operatives",
  "soc2:91": "Farm, construction and process labouring",
  "soc2:92": "Admin, warehouse, cleaning, hospitality and security",
};
