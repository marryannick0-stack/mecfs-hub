-- ME/CFS Familien-Hub – Supabase Schema
-- Ausführen in: Supabase Dashboard → SQL Editor → New Query

-- Tagebuch-Einträge
CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  entry_date DATE NOT NULL,
  fatigue INTEGER CHECK (fatigue BETWEEN 1 AND 10),
  pain INTEGER CHECK (pain BETWEEN 1 AND 10),
  sleep INTEGER CHECK (sleep BETWEEN 1 AND 10),
  pem_crash BOOLEAN DEFAULT false,
  symptoms JSONB DEFAULT '[]',
  activity TEXT,
  triggers TEXT,
  medications TEXT,
  notes TEXT,
  entered_by TEXT CHECK (entered_by IN ('Leonie', 'Lilli', 'Paula', 'Michael', 'Andere'))
);

-- Medikamente
CREATE TABLE IF NOT EXISTS medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  dose TEXT,
  since DATE,
  indication TEXT,
  off_label BOOLEAN DEFAULT false,
  effect TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT true
);

-- Links & Dokumente
CREATE TABLE IF NOT EXISTS links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT DEFAULT 'Allgemein',
  summary TEXT,
  summary_updated_at TIMESTAMPTZ
);

-- News-Archiv
CREATE TABLE IF NOT EXISTS news_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scanned_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  source TEXT,
  url TEXT,
  summary TEXT,
  evidence_level TEXT CHECK (evidence_level IN ('Hoch', 'Mittel', 'Niedrig')),
  tags JSONB DEFAULT '[]'
);

-- Symptom-Liste (konfigurierbar)
CREATE TABLE IF NOT EXISTS symptom_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'Allgemein',
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true
);

-- Wissensbasis (einmalig laden, gecacht)
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  updated_at TIMESTAMPTZ DEFAULT now(),
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1
);

-- Geheimnis-Nachricht für Leonie (Basquiat)
CREATE TABLE IF NOT EXISTS secret_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  message TEXT NOT NULL,
  shown BOOLEAN DEFAULT false,
  shown_at TIMESTAMPTZ
);

-- WhatsApp-Analysen
CREATE TABLE IF NOT EXISTS whatsapp_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  analysis TEXT NOT NULL,
  message_count INTEGER
);

-- Standard-Symptome einfügen
INSERT INTO symptom_list (name, category, sort_order) VALUES
  ('Post-Exertional Malaise (PEM)', 'Kernsymptome', 1),
  ('Kognitive Erschöpfung (Brain Fog)', 'Kernsymptome', 2),
  ('Orthostase-Intoleranz', 'Kernsymptome', 3),
  ('Nicht-erholsamer Schlaf', 'Kernsymptome', 4),
  ('Kopfschmerzen', 'Schmerz', 5),
  ('Muskelschmerzen', 'Schmerz', 6),
  ('Gelenksschmerzen', 'Schmerz', 7),
  ('Licht-Überempfindlichkeit', 'Sensorik', 8),
  ('Lärm-Überempfindlichkeit', 'Sensorik', 9),
  ('Herzklopfen / POTS', 'Autonom', 10),
  ('Verdauungsprobleme', 'Sonstige', 11),
  ('Halsschmerzen', 'Sonstige', 12),
  ('Lymphknoten geschwollen', 'Sonstige', 13)
ON CONFLICT DO NOTHING;

-- Row Level Security (alle lesen/schreiben ohne Auth für Familien-URL)
-- Für Produktion: eigene Auth oder Service Key nutzen
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE secret_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_analyses ENABLE ROW LEVEL SECURITY;

-- Offene Policies (Familien-intern, kein öffentlicher Zugang nötig)
CREATE POLICY "allow_all_diary" ON diary_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_meds" ON medications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_links" ON links FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_news" ON news_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_symptoms" ON symptom_list FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_knowledge" ON knowledge_base FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_secret" ON secret_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_whatsapp" ON whatsapp_analyses FOR ALL USING (true) WITH CHECK (true);
