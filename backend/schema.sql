-- =========================================
-- MEMOS-LIKE APP DATABASE SCHEMA
-- Cloudflare D1 (SQLite)
-- =========================================

PRAGMA foreign_keys = ON;

-- =========================================
-- USERS
-- =========================================
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_deleted INTEGER NOT NULL DEFAULT 0
    CHECK(is_deleted IN (0, 1)),

  role TEXT NOT NULL DEFAULT 'user'
    CHECK(role IN ('user', 'admin')),

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME
);

-- =========================================
-- PASSWORD RESET TOKENS
-- =========================================
CREATE TABLE password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- =========================================
-- MEMOS
-- =========================================
CREATE TABLE memos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  is_public INTEGER NOT NULL DEFAULT 0
    CHECK(is_public IN (0, 1)),
  is_deleted INTEGER NOT NULL DEFAULT 0
    CHECK(is_deleted IN (0, 1)),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TRIGGER trigger_memos_updated_at
AFTER UPDATE ON memos
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE memos
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;

-- =========================================
-- LABELS
-- =========================================
CREATE TABLE labels (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL COLLATE NOCASE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  UNIQUE(user_id, name)
);

-- =========================================
-- MEMO_LABELS (M:N RELATION)
-- =========================================
CREATE TABLE memo_labels (
  memo_id TEXT NOT NULL,
  label_id TEXT NOT NULL,

  PRIMARY KEY (memo_id, label_id),

  FOREIGN KEY (memo_id)
    REFERENCES memos(id)
    ON DELETE CASCADE,

  FOREIGN KEY (label_id)
    REFERENCES labels(id)
    ON DELETE CASCADE
);

-- =========================================
-- SESSIONS (LOGIN)
-- =========================================
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at DATETIME NOT NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- =========================================
-- INDEXES
-- =========================================
CREATE INDEX idx_memos_user_created ON memos(user_id, created_at DESC);
CREATE INDEX idx_memos_public ON memos(is_public);
CREATE INDEX idx_memo_labels_memo_id ON memo_labels(memo_id);
CREATE INDEX idx_memos_user_not_deleted_created ON memos(user_id, is_deleted, created_at DESC);
CREATE INDEX idx_memos_public_not_deleted_created ON memos(is_public, is_deleted, created_at DESC);
CREATE INDEX idx_labels_user_id ON labels(user_id);
CREATE INDEX idx_memo_labels_label_id ON memo_labels(label_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- =========================================
-- END
-- =========================================