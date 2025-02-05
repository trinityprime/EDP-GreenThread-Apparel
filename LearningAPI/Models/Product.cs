using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearningAPI.Models
{
    public class Product
    {
        [Key]
        public int ProductID { get; set; }

        [Required, MinLength(3), MaxLength(100)]
        public string ProductName { get; set; } = string.Empty;

        [Required, MinLength(3), MaxLength(500)]
        public string ProductDescription { get; set; } = string.Empty;

        [Required, Column(TypeName = "decimal(10,2)")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Price must be a positive value.")]
        public decimal Price { get; set; }

        [Required]
        [Range(0, int.MaxValue, ErrorMessage = "Stock cannot be negative.")]
        public int Stock { get; set; }

        [Required]
        public ProductSize Size { get; set; }

        [MaxLength(5000)]
        public List<string>? ImageFiles { get; set; } = new List<string>();

        [Column(TypeName = "decimal(5,2)")]
        [Range(0, 100, ErrorMessage = "Discount percentage must be between 0 and 100.")]
        public decimal DiscountPercentage { get; set; } = 0; // Discount in %

        [NotMapped]
        public decimal FinalPrice => Price - (Price * (DiscountPercentage / 100));

        [Required]
        public ProductStatus Status { get; set; } = ProductStatus.Active;

        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Foreign key property
        public int ProductCategoryID { get; set; }
        public ProductCategory? ProductCategory { get; set; }


       
    }

    public enum ProductSize
    {
        S,
        M,
        L,
        XL,
        XXL
    }

    public enum ProductStatus
    {
        Active,
        OutOfStock,
        Discontinued
    }
}
