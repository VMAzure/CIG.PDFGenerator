using System;
using System.Collections.Generic;

namespace CIG.Models
{
    public class HomeViewModel
    {
        // Claims dell'utente decodificati dal token JWT
        public Dictionary<string, string> Claims { get; set; } = new Dictionary<string, string>();

        // Configurazione dell'API IMAGIN.studio
        public Dictionary<string, string> Config { get; set; } = new Dictionary<string, string>();

        // Lista dei brand disponibili
        public List<string> Brands { get; set; } = new List<string>();

        // Liste per il filtraggio dei modelli di auto
        public List<string> Gammas { get; set; } = new List<string>(); // Modelli / Gamma
        public List<string> ModelYears { get; set; } = new List<string>(); // Anno modello
        public List<string> Versiones { get; set; } = new List<string>(); // Versione
        public List<string> Allestimentos { get; set; } = new List<string>(); // Allestimento
        public List<string> TipoAlimentaziones { get; set; } = new List<string>(); // Tipo alimentazione
    }
}