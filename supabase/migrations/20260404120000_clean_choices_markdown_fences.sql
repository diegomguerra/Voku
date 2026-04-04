-- Clean markdown fences from choices.content->text
-- Some records were saved with ```json ... ``` wrapper around the text field
UPDATE choices
SET content = jsonb_set(
  content,
  '{text}',
  to_jsonb(
    regexp_replace(
      regexp_replace(
        content->>'text',
        E'^```(?:json|JSON)?\\s*\\n?', '', 'i'
      ),
      E'\\n?```\\s*$', '', 'i'
    )
  )
)
WHERE content->>'text' LIKE '%```%';
