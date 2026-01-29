const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'luckydraw.db'), { verbose: console.log });

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'OFFLINE' | 'ONLINE'
    prizes TEXT NOT NULL, -- JSON string of prizes
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    code TEXT, -- Ticket code or unique ID
    status TEXT DEFAULT 'CHECKED_IN', -- 'CHECKED_IN', 'WON'
    won_prize TEXT, -- Name of the prize won
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
  );
`);

module.exports = db;
