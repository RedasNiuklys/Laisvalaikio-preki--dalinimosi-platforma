using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Server.Services;

namespace Server.Tests
{
    public abstract class TestBase : IDisposable
    {
        protected readonly ApplicationDbContext _context;
        protected readonly IServiceProvider _serviceProvider;

        protected TestBase()
        {
            // Create a new service provider
            var services = new ServiceCollection();

            // Add in-memory database
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()));

            // Add any other services needed for testing
            services.AddScoped<ITokenService, TokenService>();

            // Build the service provider
            _serviceProvider = services.BuildServiceProvider();

            // Get the database context
            _context = _serviceProvider.GetRequiredService<ApplicationDbContext>();

            // Ensure database is created
            _context.Database.EnsureCreated();
        }

        protected async Task SeedTestData()
        {
            // Add test data here
            await _context.SaveChangesAsync();
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}