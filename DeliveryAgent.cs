using EDP_API.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization; // Correct namespace for JsonIgnore

namespace LearningAPI.Models
{
    public class DeliveryAgent
    {
        [Key] // Primary Key
        public int DeliveryAgentID { get; set; }

        // Foreign Key for User (required)
        [Required, JsonIgnore]
        public int UserID { get; set; } // Foreign Key for User

        [JsonIgnore] // Prevent serializing the User property
        public virtual User? User { get; set; }

        // Foreign Key for Delivery (required)
        [Required, JsonIgnore]
        public int DeliveryID { get; set; } // Foreign Key for Delivery

        [JsonIgnore] // Prevent serializing the Delivery property
        public virtual Delivery? Delivery { get; set; }

        [Required]
        [MaxLength(100, ErrorMessage = "Agent Name cannot exceed 100 characters.")]
        public string AgentName { get; set; }

        [Required]
        [RegularExpression(@"^\+?\d{10,15}$", ErrorMessage = "Agent Number must be a valid phone number.")]
        public string AgentNumber { get; set; }

        [Required]
        [MaxLength(50, ErrorMessage = "Agent Username cannot exceed 50 characters.")]
        public string AgentUsername { get; set; }

        [Required]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters long.")]
        [MaxLength(20, ErrorMessage = "Password cannot exceed 20 characters.")]
        public string AgentPassword { get; set; }
    }
}