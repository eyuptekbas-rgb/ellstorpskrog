-- Digital category order update for Ellstorps Krog.
-- Keeps product names, pricing, and product order unchanged.

UPDATE "Category"
SET "sortOrder" = CASE "slug"
  WHEN 'vara-goda-pizzor' THEN 0
  WHEN 'a-la-carte' THEN 1
  WHEN 'kebab-kyckling-falafel-gyros' THEN 2
  WHEN 'hamburgare' THEN 3
  WHEN 'pastaratter' THEN 4
  WHEN 'plankstek' THEN 5
  WHEN 'smaratter' THEN 6
  WHEN 'efterratt' THEN 7
  WHEN 'drycker' THEN 8
  ELSE "sortOrder"
END
WHERE "slug" IN (
  'vara-goda-pizzor',
  'a-la-carte',
  'kebab-kyckling-falafel-gyros',
  'hamburgare',
  'pastaratter',
  'plankstek',
  'smaratter',
  'efterratt',
  'drycker'
);
