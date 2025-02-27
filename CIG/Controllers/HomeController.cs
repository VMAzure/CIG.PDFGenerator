using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System;
using System.Collections.Generic;
using System.Linq;

namespace CIG.Controllers
{
    public class HomeController : Controller
    {
        private const string JwtKey = "88fd0837-0bb4-4e4f-9e62-0560ccc7e8fb"; // 🔴 Usa la chiave reale
        private const string JwtIssuer = "https://coreapi-production-ca29.up.railway.app";

        [HttpGet]
        public IActionResult Index()
        {
            return Content("L'app CIG è online! 🚀 Aggiungi un token nella query string per visualizzare i dettagli.");
        }

        [HttpGet("token-info")]
        public IActionResult TokenInfo([FromQuery] string token)
        {
            if (string.IsNullOrEmpty(token))
            {
                return Redirect("https://corewebapp-azcore.up.railway.app/");
            }

            try
            {
                var handler = new JwtSecurityTokenHandler();
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtKey)),
                    ValidateIssuer = true,
                    ValidIssuer = JwtIssuer,
                    ValidateAudience = false,
                    ValidateLifetime = true, // 🔹 Ora verifichiamo che non sia scaduto
                    ClockSkew = TimeSpan.Zero
                };

                handler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
                var jwtToken = (JwtSecurityToken)validatedToken;
                var claims = jwtToken.Claims.ToDictionary(c => c.Type, c => c.Value);

                return View(claims); // 🔹 Mostra la vista HTML con i dati del token
            }
            catch (SecurityTokenExpiredException)
            {
                return BadRequest(new { Message = "❌ Token scaduto. Effettua nuovamente il login." });
            }
            catch (SecurityTokenException)
            {
                return BadRequest(new { Message = "❌ Token non valido." });
            }
            catch
            {
                return Redirect("https://corewebapp-azcore.up.railway.app/");
            }
        }
    }
}
