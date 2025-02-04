using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearningAPI.Models
{
    public class ShoppingCart
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ShoppingCartID { get; set; }

        // Foreign Key for User
        [Required]
        public int UserID { get; set; }
        [ForeignKey("UserID")]
        public virtual User? User { get; set; }

        // Foreign Key for Product
        [Required]
        public int ProductID { get; set; }
        [ForeignKey("ProductID")]
        public virtual Product? Product { get; set; }

        // Quantity of product
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1.")]
        public int Quantity { get; set; }

        // Grand total calculation (optional, can be calculated dynamically)
        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "GrandTotal must be a positive value.")]
        public decimal GrandTotal { get; set; }

        // Created and Updated timestamps
        [Required]
        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; }

        [Required]
        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; }

        // Method to update quantity
        public void UpdateQuantity(int newQuantity, decimal Price)
        {
            if (newQuantity < 1)
                throw new ArgumentException("Quantity must be at least 1.");

            Quantity = newQuantity;
            GrandTotal = newQuantity * Price;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
