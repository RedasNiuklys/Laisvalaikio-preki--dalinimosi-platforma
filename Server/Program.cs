using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Server.Services;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;

var builder = WebApplication.CreateBuilder(args);

var dbPath = Path.Combine(Directory.GetCurrentDirectory(),"Data", "database.db");

// Use SQLite instead of SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));

// Identity + EF Core
builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtIssuer,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
})
.AddOpenIdConnect("Google", options =>
{
    options.Authority = "https://accounts.google.com";
    options.ClientId = builder.Configuration["Authentication:Google:ClientId"];
    options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
    options.ResponseType = "code";
        options.CallbackPath = "/api/login/google-callback";
    options.Scope.Add("openid");
    options.Scope.Add("profile");
    options.Scope.Add("email");
    options.TokenValidationParameters = new TokenValidationParameters
    {
        NameClaimType = "name",
        RoleClaimType = "role"
    };
    options.SaveTokens = true;
    options.Events = new OpenIdConnectEvents
    {
        OnRedirectToIdentityProvider = context =>
        {
                context.ProtocolMessage.RedirectUri = $"{builder.Configuration["Client:Url"]}/api/login/google-callback";
            return Task.CompletedTask;
        }
    };
})
.AddFacebook(options =>
{
    options.AppId = builder.Configuration["Authentication:Facebook:ClientId"];
    options.AppSecret = builder.Configuration["Authentication:Facebook:ClientSecret"];
    options.CallbackPath = "/signin-facebook";
    options.SaveTokens = true;
    options.Fields.Add("name");
    options.Fields.Add("email");
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
                builder.Configuration["Client:Url"],
                "https://ddde-193-219-171-2.ngrok-free.app"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

// Use CORS before authentication and authorization
app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Add this after app.Build()
using (var scope = app.Services.CreateScope())
{
    await SeedAdminUser.Initialize(scope.ServiceProvider);
}

app.Run();
