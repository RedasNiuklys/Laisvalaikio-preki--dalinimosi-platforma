-- Performance indexes — run once against the existing database.
-- Safe to re-run: each statement checks for existence first.

-- 1. Composite index for "last message per chat" and unread-count queries
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_Messages_ChatId_SentAt' AND object_id = OBJECT_ID('Messages')
)
    CREATE INDEX IX_Messages_ChatId_SentAt ON Messages (ChatId, SentAt);

-- 2. Faster chat-list lookup per user
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_ChatParticipants_UserId' AND object_id = OBJECT_ID('ChatParticipants')
)
    CREATE INDEX IX_ChatParticipants_UserId ON ChatParticipants (UserId);

-- 3. Unique constraint on (ChatId, UserId) — prevents duplicate participant rows.
--    WARNING: skip this one if the database already has duplicate (ChatId, UserId) pairs.
--    Check first: SELECT ChatId, UserId, COUNT(*) FROM ChatParticipants GROUP BY ChatId, UserId HAVING COUNT(*) > 1
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_ChatParticipants_ChatId_UserId' AND object_id = OBJECT_ID('ChatParticipants')
)
    CREATE UNIQUE INDEX UX_ChatParticipants_ChatId_UserId ON ChatParticipants (ChatId, UserId);

-- 4. Equipment list filtered by owner
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_Equipment_OwnerId' AND object_id = OBJECT_ID('Equipment')
)
    CREATE INDEX IX_Equipment_OwnerId ON Equipment (OwnerId);

-- 5. Booking lookup per equipment (availability checks, calendar)
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_Bookings_EquipmentId' AND object_id = OBJECT_ID('Bookings')
)
    CREATE INDEX IX_Bookings_EquipmentId ON Bookings (EquipmentId);
