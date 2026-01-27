-- Migration to add multilingual fields to catalogs table
ALTER TABLE catalogs ADD COLUMN name_ar TEXT;
ALTER TABLE catalogs ADD COLUMN name_en TEXT;
ALTER TABLE catalogs ADD COLUMN name_fr TEXT;
ALTER TABLE catalogs ADD COLUMN description_ar TEXT;
ALTER TABLE catalogs ADD COLUMN description_en TEXT;
ALTER TABLE catalogs ADD COLUMN description_fr TEXT;

-- Seed initial values from name/description
UPDATE catalogs SET name_en = name, name_ar = name, name_fr = name WHERE name_en IS NULL;
UPDATE catalogs SET description_en = description, description_ar = description, description_fr = description WHERE description_en IS NULL;
