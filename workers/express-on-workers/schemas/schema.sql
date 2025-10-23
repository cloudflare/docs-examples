DROP TABLE IF EXISTS members;
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  joined_date TEXT NOT NULL
);

-- Insert sample data
INSERT INTO members (name, email, joined_date) VALUES
  ('Alice Johnson', 'alice@example.com', '2024-01-15'),
  ('Bob Smith', 'bob@example.com', '2024-02-20'),
  ('Carol Williams', 'carol@example.com', '2024-03-10');