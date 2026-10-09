-- Dish options (variants), dietary tags and merchant-verified allergens
-- variants:  JSON array [{"id":"v1","name_en":"Large","name_ar":"كبير","price":8}], prices absolute
--            in the item's currency. NULL or [] = no options. The item's price is kept at the
--            cheapest option so sorting and "from" prices work.
-- dietary:   JSON array of codes (vegetarian, vegan, spicy, gluten_free), as claimed by the restaurant.
-- allergens: JSON array of allergen codes. NULL = not verified (unknown, guests are told to ask
--            staff). [] = the restaurant checked and the dish contains none of the listed allergens.
ALTER TABLE menu_items ADD COLUMN variants TEXT;
ALTER TABLE menu_items ADD COLUMN dietary TEXT;
ALTER TABLE menu_items ADD COLUMN allergens TEXT;
