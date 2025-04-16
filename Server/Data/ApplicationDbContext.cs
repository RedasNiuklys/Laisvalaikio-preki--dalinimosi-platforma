using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Server.Models;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Location> Locations { get; set; }
    public DbSet<Equipment> Equipment { get; set; }
    public DbSet<UsedDates> UsedDates { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Chat> Chats { get; set; }
    public DbSet<ChatMember> ChatMembers { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<MessageRead> MessageReads { get; set; }

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
            .Property(e => e.Status)
            .HasConversion<string>();

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
            .WithMany(c => c.Subcategories)
            .HasForeignKey(c => c.ParentCategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Equipment>()
            .HasOne<Category>()
            .WithMany(c => c.Equipment)
            .HasForeignKey(e => e.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        // Chat configurations
        modelBuilder.Entity<Chat>()
            .HasMany(c => c.Members)
            .WithOne(m => m.Chat)
            .HasForeignKey(m => m.ChatId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Chat>()
            .HasMany(c => c.Messages)
            .WithOne(m => m.Chat)
            .HasForeignKey(m => m.ChatId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ChatMember>()
            .HasOne(cm => cm.User)
            .WithMany()
            .HasForeignKey(cm => cm.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Message>()
            .HasOne(m => m.Sender)
            .WithMany()
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MessageRead>()
            .HasOne(mr => mr.Message)
            .WithMany(m => m.ReadBy)
            .HasForeignKey(mr => mr.MessageId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MessageRead>()
            .HasOne(mr => mr.User)
            .WithMany()
            .HasForeignKey(mr => mr.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
