using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace EDP_API.Models
{
    public class CartItem
    {
        [Key] // Primary Key
        public int CartItemID { get; set; }

        [Required]
        public int ProductID { get; set; }

        [JsonIgnore] // Prevent serializing the User property
        public virtual Product? Product { get; set; }

        [Required] // Quantity is required
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1.")]
        public int Quantity { get; set; }

        [Required] // CreatedAt is required
        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; }

        [Required] // UpdatedAt is required
        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; }

    }
}
