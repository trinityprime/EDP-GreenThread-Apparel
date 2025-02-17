using System.ComponentModel.DataAnnotations;

namespace LearningAPI.Models
{
    public class Enable2FARequest
    {
        [Required]
        public string Password { get; set; }
        public string Code { get; set; } = string.Empty;
    }
}