-- Drop triggers
DROP TRIGGER IF EXISTS on_note_delete ON public.notes;
DROP TRIGGER IF EXISTS on_note_update ON public.notes;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_note_change();

-- Drop tables in correct order to respect foreign key constraints
DROP TABLE IF EXISTS public.notes_history;
DROP TABLE IF EXISTS public.notes;
DROP TABLE IF EXISTS public.cards;
DROP TABLE IF EXISTS public.students;
DROP TABLE IF EXISTS public.classes;
DROP TABLE IF EXISTS public.users;

-- Reset database settings
ALTER DATABASE postgres RESET "app.jwt_secret";
ALTER DATABASE postgres RESET "app.jwt_exp";

-- Drop extensions if needed
-- DROP EXTENSION IF EXISTS "uuid-ossp"; 