-- Revisionen (runde 10): spar Browser Run-minutter. HTML'en hashes; en uændret side genbruger det seneste beståede
-- browsertjek (genbrugt_fra = datoen for det originale tjek, hvis screenshot også genbruges).
ALTER TABLE revision_sider ADD COLUMN html_hash TEXT;
ALTER TABLE revision_sider ADD COLUMN genbrugt_fra TEXT;
CREATE INDEX IF NOT EXISTS revision_sider_side ON revision_sider (side, date_key);
