using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearningAPI.Models
{
    public class ShoppingCartItem
    {
        [Key]
        public int ShoppingCartItemID { get; set; } // Unique identifier for the cart item

        [Required]
        [ForeignKey("ShoppingCart")]
        public int ShoppingCartID { get; set; } // Link to the ShoppingCart
        public virtual ShoppingCart ShoppingCart { get; set; } // Navigation property for ShoppingCart

        [Required]
        [ForeignKey("Product")]
        public int ProductID { get; set; } // Link to the Product
        public virtual Product Product { get; set; } // Navigation property for Product

        [Required]
        public int Quantity { get; set; } // Quantity of the product in the cart

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal GrandTotal { get; set; } // Total price for this item (Quantity * DiscountedPrice)

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // Date and time the item was added
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow; // Last updated time

        // Method to update quantity and recalculate total
        public void UpdateQuantity(int newQuantity, decimal productPrice, decimal discountPercentage)
        {
            if (newQuantity < 1)
                throw new ArgumentException("Quantity must be at least 1.");

            Quantity = newQuantity;

            // Recalculate GrandTotal using discounted price
            decimal discountedPrice = productPrice * (1 - (discountPercentage / 100));
            GrandTotal = newQuantity * discountedPrice;

            UpdatedAt = DateTime.UtcNow;
        }
    }
}
