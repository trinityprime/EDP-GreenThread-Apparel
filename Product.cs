using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EDP_API.Models
{
    public class Product
    {
        [Key]
        public int ProductID { get; set; }

        [Required, MaxLength(100)]
        public string ProductName { get; set; } = string.Empty;

        [Required, Column(TypeName = "decimal(10,2)")]
        public decimal Price { get; set; }

        [Required]
        public int Stock { get; set; }

        [Required]
        [JsonConverter(typeof(JsonStringEnumConverter))] // Converts enum to string during serialization/deserialization
        public Product_Size ProductSize { get; set; }

        public enum Product_Size
        {
            S,  
            M,
            L
        }
    }
}
