using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace LearningAPI.Models
{
    public class ProductCategory
    {
        public int ProductCategoryID{ get; set; }

        [MaxLength(50)]
        public string ProductCategoryName { get; set; } = string.Empty;

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; }

        // Navigation property to represent the one-to-many relationship
        [JsonIgnore]
        public List<Product>? Products { get; set; }
    }
}