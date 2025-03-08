using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using QuestPDF.Infrastructure; // <-- Assicurati che sia presente!

var builder = WebApplication.CreateBuilder(args); // 🔹 Sposta questa riga qui in alto
QuestPDF.Settings.License = LicenseType.Community;

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://*:{port}");

var jwtKey = "88fd0837-0bb4-4e4f-9e62-0560ccc7e8fb"; // 🔴 Sostituisci con la chiave reale
var jwtIssuer = "https://coreapi-production-ca29.up.railway.app"; // 🔴 URL del provider del token

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddControllersWithViews();
builder.Services.AddHttpClient(); // Aggiungi questa riga per registrare IHttpClientFactory

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseStatusCodePagesWithReExecute("/Home/Error404");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication(); // 🔹 Deve stare PRIMA di UseAuthorization()
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Offer}/{action=Index}/{id?}");

app.MapControllers();

app.Run();
