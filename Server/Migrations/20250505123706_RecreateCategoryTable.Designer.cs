using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20250505123706_RecreateCategoryTable")]
    partial class RecreateCategoryTable
    {
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder.HasAnnotation("ProductVersion", "9.0.4");

            modelBuilder.Entity("Server.Models.Category", b =>
            {
                b.Property<int>("Id")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("INTEGER");

                b.Property<DateTime>("CreatedAt")
                    .HasColumnType("TEXT");

                b.Property<string>("IconName")
                    .IsRequired()
                    .HasMaxLength(50)
                    .HasColumnType("TEXT");

                b.Property<string>("Name")
                    .IsRequired()
                    .HasMaxLength(100)
                    .HasColumnType("TEXT");

                b.Property<int?>("ParentCategoryId")
                    .HasColumnType("INTEGER");

                b.Property<DateTime>("UpdatedAt")
                    .HasColumnType("TEXT");

                b.HasKey("Id");

                b.HasIndex("ParentCategoryId");

                b.ToTable("Categories");
            });

            modelBuilder.Entity("Server.Models.Category", b =>
            {
                b.HasOne("Server.Models.Category", "ParentCategory")
                    .WithMany("Categories")
                    .HasForeignKey("ParentCategoryId")
                    .OnDelete(DeleteBehavior.Restrict);

                b.Navigation("ParentCategory");
            });

            modelBuilder.Entity("Server.Models.Category", b =>
            {
                b.Navigation("Categories");
            });
#pragma warning restore 612, 618
        }
    }
}