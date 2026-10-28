-- "Mr. & Mrs." is one title. Add it when the saved list does not already have it.
update public.app_settings
set hidden_salutations = hidden_salutations || ', Mr. & Mrs.'
where id = 1
  and hidden_salutations !~* 'mr\.?\s*&\s*mrs';
