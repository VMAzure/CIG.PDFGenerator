using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Collections.Generic;

namespace CIG.Controllers
{
    public class HomeController : Controller
    {
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
                var jwtToken = handler.ReadJwtToken(token);
                var claims = jwtToken.Claims.ToDictionary(c => c.Type, c => c.Value);

                return View(claims); // 🔹 Mostra la vista HTML, non JSON
            }
            catch
            {
                return Redirect("https://corewebapp-azcore.up.railway.app/");
            }
        }
    }
}

