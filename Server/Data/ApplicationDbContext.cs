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
    public DbSet<Category> Categories { get; set; }
    public DbSet<Chat> Chats { get; set; }
    public DbSet<ChatParticipant> ChatParticipants { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<MessageRead> MessageReads { get; set; }
    public DbSet<EquipmentImage> EquipmentImages { get; set; }
    public DbSet<MaintenanceRecord> MaintenanceRecords { get; set; }
    public DbSet<Friendship> Friendships { get; set; }
    public DbSet<Booking> Bookings { get; set; }

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

        modelBuilder.Entity<Friendship>()
            .HasOne(f => f.Requester)
            .WithMany()
            .HasForeignKey(f => f.RequesterId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Friendship>()
            .HasOne(f => f.Addressee)
            .WithMany()
            .HasForeignKey(f => f.AddresseeId)
            .OnDelete(DeleteBehavior.Restrict);

        // // Seed Categories
        modelBuilder.Entity<Category>().HasData(
            // Parent Categories
            new Category
            {
                Id = 1,
                Name = "Winter",
                Slug = "winter",
                IconName = "snowflake",
                ParentCategoryId = null,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 2,
                Name = "Water",
                Slug = "water",
                IconName = "waves",
                ParentCategoryId = null,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 3,
                Name = "Summer",
                Slug = "summer",
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
                Slug = "winter-sports",
                IconName = "snowboard",
                ParentCategoryId = 1,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 5,
                Name = "Skiing",
                Slug = "skiing",
                IconName = "ski",
                ParentCategoryId = 1,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 6,
                Name = "Hockey",
                Slug = "hockey",
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
                Slug = "swimming",
                IconName = "swim",
                ParentCategoryId = 2,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 8,
                Name = "Surfing",
                Slug = "surfing",
                IconName = "surfing",
                ParentCategoryId = 2,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 9,
                Name = "Kayaking",
                Slug = "kayaking",
                IconName = "kayak",
                ParentCategoryId = 2,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 10,
                Name = "Fishing",
                Slug = "fishing",
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
                Slug = "cycling",
                IconName = "bicycle",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 12,
                Name = "Hiking",
                Slug = "hiking",
                IconName = "hiking",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 13,
                Name = "Camping",
                Slug = "camping",
                IconName = "camping",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 14,
                Name = "BBQ",
                Slug = "bbq",
                IconName = "grill",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 15,
                Name = "Tennis",
                Slug = "tennis",
                IconName = "tennis",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 16,
                Name = "Basketball",
                Slug = "basketball",
                IconName = "basketball",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 17,
                Name = "Soccer",
                Slug = "soccer",
                IconName = "soccer",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 18,
                Name = "Volleyball",
                Slug = "volleyball",
                IconName = "volleyball",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 19,
                Name = "Running",
                Slug = "running",
                IconName = "run",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 20,
                Name = "Yoga",
                Slug = "yoga",
                IconName = "yoga",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 21,
                Name = "Golf",
                Slug = "golf",
                IconName = "golf",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            },
            new Category
            {
                Id = 22,
                Name = "Rollerblading",
                Slug = "rollerblading",
                IconName = "roller-skate",
                ParentCategoryId = 3,
                CreatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 3, 19, 14, 30, 45, 123, DateTimeKind.Utc)
            }
        );
    }
}

