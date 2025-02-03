using EDP_API.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearningAPI.Models
{
    public class ShoppingCart
    {
        [Key] // Primary Key
        public int ShoppingCartID { get; set; }

        // Foreign Key for User
        [Required] // UserID is required
        public int UserID { get; set; }
        [ForeignKey("UserID")]
        public virtual User? User { get; set; }


        [Required] // cartitem is required
        public int CartItemID { get; set; }
        [ForeignKey("CartItemID")]
        public virtual CartItem? CartItem { get; set; }

        [Required] // GrandTotal is required
        [Range(0, double.MaxValue, ErrorMessage = "GrandTotal must be a positive value.")]
        public decimal GrandTotal { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Discount must be a positive value.")]
        public decimal Discount { get; set; }

        [Required] // CreatedAt is required
        [Column(TypeName = "datetime")]
        public DateTime CreatedAt { get; set; }

        [Required] // UpdatedAt is required
        [Column(TypeName = "datetime")]
        public DateTime UpdatedAt { get; set; }

        // One-to-many relationship with CartItems
        public List<CartItem>? CartItems { get; set; }

    }
}