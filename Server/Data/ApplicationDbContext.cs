using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Server.Models;


public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Location> Locations { get; set; }
    public DbSet<Equipment> Equipment { get; set; }
    public DbSet<UsedDates> UsedDates { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Chat> Chats { get; set; }
    public DbSet<ChatParticipant> ChatParticipants { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<MessageRead> MessageReads { get; set; }
    public DbSet<EquipmentImage> EquipmentImages { get; set; }
    public DbSet<MaintenanceRecord> MaintenanceRecords { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Location>()
            .HasOne(l => l.User)
            .WithMany()
            .HasForeignKey(l => l.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Equipment>()
            .HasOne(e => e.Owner)
            .WithMany()
            .HasForeignKey(e => e.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Equipment>()
            .HasOne(e => e.Location)
            .WithMany()
            .HasForeignKey(e => e.LocationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Equipment>()
            .Property(e => e.Condition)
            .HasConversion<string>();

        modelBuilder.Entity<UsedDates>()
            .HasOne(u => u.Equipment)
            .WithMany(e => e.UsedDates)
            .HasForeignKey(u => u.EquipmentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UsedDates>()
            .HasOne(u => u.User)
            .WithMany()
            .HasForeignKey(u => u.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UsedDates>()
            .ToTable(tb => tb.HasCheckConstraint("CK_UsedDates_EndDate", "EndDate > StartDate"));

        modelBuilder.Entity<Category>()
            .HasOne(c => c.ParentCategory)
            .WithMany(p => p.Categories)
            .HasForeignKey(c => c.ParentCategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        // Configure identity seed for Category
        modelBuilder.Entity<Category>()
            .Property(c => c.Id)
            .UseIdentityColumn(seed: 1, increment: 1);

        modelBuilder.Entity<Chat>()
            .HasMany(c => c.Participants)
            .WithOne(p => p.Chat)
            .HasForeignKey(p => p.ChatId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Chat>()
            .HasMany(c => c.Messages)
            .WithOne(m => m.Chat)
            .HasForeignKey(m => m.ChatId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ChatParticipant>()
            .HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Message>()
            .HasOne(m => m.Sender)
            .WithMany()
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MessageRead>()
            .HasOne(r => r.Message)
            .WithMany(m => m.ReadReceipts)
            .HasForeignKey(r => r.MessageId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MessageRead>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<EquipmentImage>()
            .HasOne(i => i.Equipment)
            .WithMany(e => e.Images)
            .HasForeignKey(i => i.EquipmentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MaintenanceRecord>()
            .HasOne(m => m.Equipment)
            .WithMany(e => e.MaintenanceHistory)
            .HasForeignKey(m => m.EquipmentId)
            .OnDelete(DeleteBehavior.Cascade);

        // // Seed Categories
        modelBuilder.Entity<Category>().HasData(
            // Parent Categories
            new Category
            {
                Id = 1,
                Name = "Winter",
                IconName = "snowflake",
                ParentCategoryId = null,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 2,
                Name = "Water",
                IconName = "waves",
                ParentCategoryId = null,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 3,
                Name = "Summer",
                IconName = "weather-sunny",
                ParentCategoryId = null,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },

            // Winter Categories
            new Category
            {
                Id = 4,
                Name = "Winter Sports",
                IconName = "snowboard",
                ParentCategoryId = 1,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 5,
                Name = "Skiing",
                IconName = "ski",
                ParentCategoryId = 1,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 6,
                Name = "Hockey",
                IconName = "hockey-puck",
                ParentCategoryId = 1,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },

            // Water Categories
            new Category
            {
                Id = 7,
                Name = "Swimming",
                IconName = "swim",
                ParentCategoryId = 2,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 8,
                Name = "Surfing",
                IconName = "surfing",
                ParentCategoryId = 2,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 9,
                Name = "Kayaking",
                IconName = "kayak",
                ParentCategoryId = 2,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 10,
                Name = "Fishing",
                IconName = "fishing",
                ParentCategoryId = 2,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },

            // Summer Categories
            new Category
            {
                Id = 11,
                Name = "Cycling",
                IconName = "bicycle",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 12,
                Name = "Hiking",
                IconName = "hiking",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 13,
                Name = "Camping",
                IconName = "camping",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 14,
                Name = "BBQ",
                IconName = "grill",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 15,
                Name = "Tennis",
                IconName = "tennis",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 16,
                Name = "Basketball",
                IconName = "basketball",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 17,
                Name = "Soccer",
                IconName = "soccer",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 18,
                Name = "Volleyball",
                IconName = "volleyball",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 19,
                Name = "Running",
                IconName = "run",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 20,
                Name = "Yoga",
                IconName = "yoga",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 21,
                Name = "Golf",
                IconName = "golf",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 22,
                Name = "Rollerblading",
                IconName = "roller-skate",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            }
        );
    }
}

