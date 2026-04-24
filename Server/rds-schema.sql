CREATE TABLE [AspNetRoles] (
    [Id] nvarchar(450) NOT NULL,
    [Name] nvarchar(256) NULL,
    [NormalizedName] nvarchar(256) NULL,
    [ConcurrencyStamp] nvarchar(max) NULL,
    CONSTRAINT [PK_AspNetRoles] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [AspNetUsers] (
    [Id] nvarchar(450) NOT NULL,
    [FirstName] nvarchar(max) NULL,
    [LastName] nvarchar(max) NULL,
    [Theme] nvarchar(max) NOT NULL,
    [AvatarUrl] nvarchar(max) NOT NULL,
    [FirebaseUid] nvarchar(max) NULL,
    [UserName] nvarchar(256) NULL,
    [NormalizedUserName] nvarchar(256) NULL,
    [Email] nvarchar(256) NULL,
    [NormalizedEmail] nvarchar(256) NULL,
    [EmailConfirmed] bit NOT NULL,
    [PasswordHash] nvarchar(max) NULL,
    [SecurityStamp] nvarchar(max) NULL,
    [ConcurrencyStamp] nvarchar(max) NULL,
    [PhoneNumber] nvarchar(max) NULL,
    [PhoneNumberConfirmed] bit NOT NULL,
    [TwoFactorEnabled] bit NOT NULL,
    [LockoutEnd] datetimeoffset NULL,
    [LockoutEnabled] bit NOT NULL,
    [AccessFailedCount] int NOT NULL,
    CONSTRAINT [PK_AspNetUsers] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [Categories] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(100) NOT NULL,
    [IconName] nvarchar(50) NOT NULL,
    [ParentCategoryId] int NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Categories] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Categories_Categories_ParentCategoryId] FOREIGN KEY ([ParentCategoryId]) REFERENCES [Categories] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [Chats] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(100) NULL,
    [IsGroupChat] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Chats] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [AspNetRoleClaims] (
    [Id] int NOT NULL IDENTITY,
    [RoleId] nvarchar(450) NOT NULL,
    [ClaimType] nvarchar(max) NULL,
    [ClaimValue] nvarchar(max) NULL,
    CONSTRAINT [PK_AspNetRoleClaims] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_AspNetRoleClaims_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [AspNetUserClaims] (
    [Id] int NOT NULL IDENTITY,
    [UserId] nvarchar(450) NOT NULL,
    [ClaimType] nvarchar(max) NULL,
    [ClaimValue] nvarchar(max) NULL,
    CONSTRAINT [PK_AspNetUserClaims] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_AspNetUserClaims_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [AspNetUserLogins] (
    [LoginProvider] nvarchar(450) NOT NULL,
    [ProviderKey] nvarchar(450) NOT NULL,
    [ProviderDisplayName] nvarchar(max) NULL,
    [UserId] nvarchar(450) NOT NULL,
    CONSTRAINT [PK_AspNetUserLogins] PRIMARY KEY ([LoginProvider], [ProviderKey]),
    CONSTRAINT [FK_AspNetUserLogins_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [AspNetUserRoles] (
    [UserId] nvarchar(450) NOT NULL,
    [RoleId] nvarchar(450) NOT NULL,
    CONSTRAINT [PK_AspNetUserRoles] PRIMARY KEY ([UserId], [RoleId]),
    CONSTRAINT [FK_AspNetUserRoles_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_AspNetUserRoles_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [AspNetUserTokens] (
    [UserId] nvarchar(450) NOT NULL,
    [LoginProvider] nvarchar(450) NOT NULL,
    [Name] nvarchar(450) NOT NULL,
    [Value] nvarchar(max) NULL,
    CONSTRAINT [PK_AspNetUserTokens] PRIMARY KEY ([UserId], [LoginProvider], [Name]),
    CONSTRAINT [FK_AspNetUserTokens_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [Friendships] (
    [Id] int NOT NULL IDENTITY,
    [RequesterId] nvarchar(450) NOT NULL,
    [AddresseeId] nvarchar(450) NOT NULL,
    [Status] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Friendships] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Friendships_AspNetUsers_AddresseeId] FOREIGN KEY ([AddresseeId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Friendships_AspNetUsers_RequesterId] FOREIGN KEY ([RequesterId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION
);
GO


CREATE TABLE [Locations] (
    [Id] nvarchar(450) NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [Description] nvarchar(500) NOT NULL,
    [StreetAddress] nvarchar(100) NOT NULL,
    [City] nvarchar(100) NOT NULL,
    [State] nvarchar(50) NOT NULL,
    [PostalCode] nvarchar(20) NOT NULL,
    [Country] nvarchar(100) NOT NULL,
    [Latitude] float NULL,
    [Longitude] float NULL,
    [UserId] nvarchar(450) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Locations] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Locations_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [ChatParticipants] (
    [Id] int NOT NULL IDENTITY,
    [UserId] nvarchar(450) NOT NULL,
    [ChatId] int NOT NULL,
    [IsAdmin] bit NOT NULL,
    [JoinedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_ChatParticipants] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ChatParticipants_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_ChatParticipants_Chats_ChatId] FOREIGN KEY ([ChatId]) REFERENCES [Chats] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [Messages] (
    [Id] nvarchar(450) NOT NULL,
    [ChatId] int NOT NULL,
    [SenderId] nvarchar(450) NOT NULL,
    [Content] nvarchar(2000) NOT NULL,
    [SentAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Messages] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Messages_AspNetUsers_SenderId] FOREIGN KEY ([SenderId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Messages_Chats_ChatId] FOREIGN KEY ([ChatId]) REFERENCES [Chats] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [Equipment] (
    [Id] nvarchar(450) NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [Description] nvarchar(500) NOT NULL,
    [OwnerId] nvarchar(450) NOT NULL,
    [CategoryId] int NOT NULL,
    [Tags] nvarchar(max) NOT NULL,
    [Condition] nvarchar(max) NOT NULL,
    [IsAvailable] bit NOT NULL,
    [LocationId] nvarchar(450) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Equipment] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Equipment_AspNetUsers_OwnerId] FOREIGN KEY ([OwnerId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Equipment_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [Categories] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Equipment_Locations_LocationId] FOREIGN KEY ([LocationId]) REFERENCES [Locations] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [MessageReads] (
    [Id] nvarchar(450) NOT NULL,
    [MessageId] nvarchar(450) NOT NULL,
    [UserId] nvarchar(450) NOT NULL,
    [ReadAt] datetime2 NOT NULL,
    CONSTRAINT [PK_MessageReads] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_MessageReads_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_MessageReads_Messages_MessageId] FOREIGN KEY ([MessageId]) REFERENCES [Messages] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [Bookings] (
    [Id] nvarchar(450) NOT NULL,
    [EquipmentId] nvarchar(450) NOT NULL,
    [UserId] nvarchar(450) NOT NULL,
    [StartDateTime] datetime2 NOT NULL,
    [EndDateTime] datetime2 NOT NULL,
    [Status] int NOT NULL,
    [Notes] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Bookings] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Bookings_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Bookings_Equipment_EquipmentId] FOREIGN KEY ([EquipmentId]) REFERENCES [Equipment] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [EquipmentImages] (
    [Id] nvarchar(450) NOT NULL,
    [EquipmentId] nvarchar(450) NOT NULL,
    [ImageUrl] nvarchar(max) NOT NULL,
    [IsMainImage] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_EquipmentImages] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_EquipmentImages_Equipment_EquipmentId] FOREIGN KEY ([EquipmentId]) REFERENCES [Equipment] ([Id]) ON DELETE CASCADE
);
GO


CREATE TABLE [MaintenanceRecords] (
    [Id] int NOT NULL IDENTITY,
    [EquipmentId] nvarchar(450) NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [MaintenanceDate] datetime2 NOT NULL,
    [PerformedBy] nvarchar(max) NOT NULL,
    [Notes] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_MaintenanceRecords] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_MaintenanceRecords_Equipment_EquipmentId] FOREIGN KEY ([EquipmentId]) REFERENCES [Equipment] ([Id]) ON DELETE CASCADE
);
GO


IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedAt', N'IconName', N'Name', N'ParentCategoryId', N'UpdatedAt') AND [object_id] = OBJECT_ID(N'[Categories]'))
    SET IDENTITY_INSERT [Categories] ON;
INSERT INTO [Categories] ([Id], [CreatedAt], [IconName], [Name], [ParentCategoryId], [UpdatedAt])
VALUES (1, '2024-03-19T14:30:45.1230000Z', N'snowflake', N'Winter', NULL, '2024-03-19T14:30:45.1230000Z'),
(2, '2024-03-19T14:30:45.1230000Z', N'waves', N'Water', NULL, '2024-03-19T14:30:45.1230000Z'),
(3, '2024-03-19T14:30:45.1230000Z', N'weather-sunny', N'Summer', NULL, '2024-03-19T14:30:45.1230000Z'),
(4, '2024-03-19T14:30:45.1230000Z', N'snowboard', N'Winter Sports', 1, '2024-03-19T14:30:45.1230000Z'),
(5, '2024-03-19T14:30:45.1230000Z', N'ski', N'Skiing', 1, '2024-03-19T14:30:45.1230000Z'),
(6, '2024-03-19T14:30:45.1230000Z', N'hockey-puck', N'Hockey', 1, '2024-03-19T14:30:45.1230000Z'),
(7, '2024-03-19T14:30:45.1230000Z', N'swim', N'Swimming', 2, '2024-03-19T14:30:45.1230000Z'),
(8, '2024-03-19T14:30:45.1230000Z', N'surfing', N'Surfing', 2, '2024-03-19T14:30:45.1230000Z'),
(9, '2024-03-19T14:30:45.1230000Z', N'kayak', N'Kayaking', 2, '2024-03-19T14:30:45.1230000Z'),
(10, '2024-03-19T14:30:45.1230000Z', N'fishing', N'Fishing', 2, '2024-03-19T14:30:45.1230000Z'),
(11, '2024-03-19T14:30:45.1230000Z', N'bicycle', N'Cycling', 3, '2024-03-19T14:30:45.1230000Z'),
(12, '2024-03-19T14:30:45.1230000Z', N'hiking', N'Hiking', 3, '2024-03-19T14:30:45.1230000Z'),
(13, '2024-03-19T14:30:45.1230000Z', N'camping', N'Camping', 3, '2024-03-19T14:30:45.1230000Z'),
(14, '2024-03-19T14:30:45.1230000Z', N'grill', N'BBQ', 3, '2024-03-19T14:30:45.1230000Z'),
(15, '2024-03-19T14:30:45.1230000Z', N'tennis', N'Tennis', 3, '2024-03-19T14:30:45.1230000Z'),
(16, '2024-03-19T14:30:45.1230000Z', N'basketball', N'Basketball', 3, '2024-03-19T14:30:45.1230000Z'),
(17, '2024-03-19T14:30:45.1230000Z', N'soccer', N'Soccer', 3, '2024-03-19T14:30:45.1230000Z'),
(18, '2024-03-19T14:30:45.1230000Z', N'volleyball', N'Volleyball', 3, '2024-03-19T14:30:45.1230000Z'),
(19, '2024-03-19T14:30:45.1230000Z', N'run', N'Running', 3, '2024-03-19T14:30:45.1230000Z'),
(20, '2024-03-19T14:30:45.1230000Z', N'yoga', N'Yoga', 3, '2024-03-19T14:30:45.1230000Z'),
(21, '2024-03-19T14:30:45.1230000Z', N'golf', N'Golf', 3, '2024-03-19T14:30:45.1230000Z'),
(22, '2024-03-19T14:30:45.1230000Z', N'roller-skate', N'Rollerblading', 3, '2024-03-19T14:30:45.1230000Z');
IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedAt', N'IconName', N'Name', N'ParentCategoryId', N'UpdatedAt') AND [object_id] = OBJECT_ID(N'[Categories]'))
    SET IDENTITY_INSERT [Categories] OFF;
GO


CREATE INDEX [IX_AspNetRoleClaims_RoleId] ON [AspNetRoleClaims] ([RoleId]);
GO


CREATE UNIQUE INDEX [RoleNameIndex] ON [AspNetRoles] ([NormalizedName]) WHERE [NormalizedName] IS NOT NULL;
GO


CREATE INDEX [IX_AspNetUserClaims_UserId] ON [AspNetUserClaims] ([UserId]);
GO


CREATE INDEX [IX_AspNetUserLogins_UserId] ON [AspNetUserLogins] ([UserId]);
GO


CREATE INDEX [IX_AspNetUserRoles_RoleId] ON [AspNetUserRoles] ([RoleId]);
GO


CREATE INDEX [EmailIndex] ON [AspNetUsers] ([NormalizedEmail]);
GO


CREATE UNIQUE INDEX [UserNameIndex] ON [AspNetUsers] ([NormalizedUserName]) WHERE [NormalizedUserName] IS NOT NULL;
GO


CREATE INDEX [IX_Bookings_EquipmentId] ON [Bookings] ([EquipmentId]);
GO


CREATE INDEX [IX_Bookings_UserId] ON [Bookings] ([UserId]);
GO


CREATE INDEX [IX_Categories_ParentCategoryId] ON [Categories] ([ParentCategoryId]);
GO


CREATE INDEX [IX_ChatParticipants_ChatId] ON [ChatParticipants] ([ChatId]);
GO


CREATE INDEX [IX_ChatParticipants_UserId] ON [ChatParticipants] ([UserId]);
GO


CREATE INDEX [IX_Equipment_CategoryId] ON [Equipment] ([CategoryId]);
GO


CREATE INDEX [IX_Equipment_LocationId] ON [Equipment] ([LocationId]);
GO


CREATE INDEX [IX_Equipment_OwnerId] ON [Equipment] ([OwnerId]);
GO


CREATE INDEX [IX_EquipmentImages_EquipmentId] ON [EquipmentImages] ([EquipmentId]);
GO


CREATE INDEX [IX_Friendships_AddresseeId] ON [Friendships] ([AddresseeId]);
GO


CREATE INDEX [IX_Friendships_RequesterId] ON [Friendships] ([RequesterId]);
GO


CREATE INDEX [IX_Locations_UserId] ON [Locations] ([UserId]);
GO


CREATE INDEX [IX_MaintenanceRecords_EquipmentId] ON [MaintenanceRecords] ([EquipmentId]);
GO


CREATE INDEX [IX_MessageReads_MessageId] ON [MessageReads] ([MessageId]);
GO


CREATE INDEX [IX_MessageReads_UserId] ON [MessageReads] ([UserId]);
GO


CREATE INDEX [IX_Messages_ChatId] ON [Messages] ([ChatId]);
GO


CREATE INDEX [IX_Messages_SenderId] ON [Messages] ([SenderId]);
GO


