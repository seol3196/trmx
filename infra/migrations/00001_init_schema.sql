-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Schema for public tables
CREATE SCHEMA IF NOT EXISTS public;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';
ALTER DATABASE postgres SET "app.jwt_exp" TO 3600;

-- Create users table with RLS
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'teacher',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read own data" ON public.users
    FOR SELECT USING (auth.uid() = id);
    
CREATE POLICY "Allow users to update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Create classes table with RLS
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    school_year INT NOT NULL,
    grade INT,
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (name, school_year, teacher_id)
);

CREATE INDEX idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX idx_classes_school_year ON public.classes(school_year);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow teachers to CRUD own classes" ON public.classes
    FOR ALL USING (auth.uid() = teacher_id);

-- Create students table with RLS
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_number INT,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (class_id, student_number)
);

CREATE INDEX idx_students_class_id ON public.students(class_id);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow teachers to CRUD students in their classes" ON public.students
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.classes
            WHERE classes.id = students.class_id
            AND classes.teacher_id = auth.uid()
        )
    );

-- Create cards table with RLS
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    weight SMALLINT DEFAULT 0,
    color TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, title)
);

CREATE INDEX idx_cards_user_id ON public.cards(user_id);
CREATE INDEX idx_cards_category ON public.cards(category);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to CRUD their own cards" ON public.cards
    FOR ALL USING (auth.uid() = user_id);

-- Create notes table with RLS
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    card_id UUID REFERENCES public.cards(id),
    content TEXT,
    recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notes_student_id ON public.notes(student_id);
CREATE INDEX idx_notes_recorded_date ON public.notes(recorded_date);
CREATE INDEX idx_notes_card_id ON public.notes(card_id);
CREATE INDEX idx_notes_created_by ON public.notes(created_by);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow teachers to CRUD notes for their students" ON public.notes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.students
            JOIN public.classes ON students.class_id = classes.id
            WHERE students.id = notes.student_id
            AND classes.teacher_id = auth.uid()
        )
    );

-- Create notes_history table for version control
CREATE TABLE IF NOT EXISTS public.notes_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    previous_content TEXT,
    new_content TEXT,
    diff JSONB,
    changed_by UUID NOT NULL REFERENCES public.users(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notes_history_note_id ON public.notes_history(note_id);
CREATE INDEX idx_notes_history_changed_by ON public.notes_history(changed_by);
CREATE INDEX idx_notes_history_changed_at ON public.notes_history(changed_at);

ALTER TABLE public.notes_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow teachers to see history of their notes" ON public.notes_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.notes
            JOIN public.students ON notes.student_id = students.id
            JOIN public.classes ON students.class_id = classes.id
            WHERE notes.id = notes_history.note_id
            AND classes.teacher_id = auth.uid()
        )
    );

-- Create function to automatically add to notes_history on update or delete
CREATE OR REPLACE FUNCTION public.handle_note_change()
RETURNS TRIGGER AS $$
DECLARE
    diff_json JSONB;
BEGIN
    -- For updates
    IF TG_OP = 'UPDATE' THEN
        -- Calculate simple diff
        diff_json = jsonb_build_object(
            'previous', to_jsonb(OLD),
            'new', to_jsonb(NEW)
        );
        
        -- Only track content changes
        IF OLD.content != NEW.content THEN
            INSERT INTO public.notes_history (
                note_id, previous_content, new_content, diff, changed_by
            ) VALUES (
                OLD.id, OLD.content, NEW.content, diff_json, auth.uid()
            );
        END IF;
        
        RETURN NEW;
    
    -- For deletes
    ELSIF TG_OP = 'DELETE' THEN
        -- Record deletion in history
        diff_json = jsonb_build_object(
            'previous', to_jsonb(OLD),
            'new', NULL,
            'operation', 'DELETE'
        );
        
        INSERT INTO public.notes_history (
            note_id, previous_content, new_content, diff, changed_by
        ) VALUES (
            OLD.id, OLD.content, NULL, diff_json, auth.uid()
        );
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for note changes
CREATE TRIGGER on_note_update
    BEFORE UPDATE ON public.notes
    FOR EACH ROW EXECUTE FUNCTION public.handle_note_change();

CREATE TRIGGER on_note_delete
    BEFORE DELETE ON public.notes
    FOR EACH ROW EXECUTE FUNCTION public.handle_note_change(); 