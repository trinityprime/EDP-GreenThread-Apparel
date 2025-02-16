using Microsoft.AspNetCore.Mvc;
using LearningAPI.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace LearningAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShoppingCartController : ControllerBase
    {
        private readonly MyDbContext _context;

        public ShoppingCartController(MyDbContext context)
        {
            _context = context;
        }

        // 📋 GET All Shopping Cart Items for a User
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetCartByUser(int userId)
        {
            try
            {
                var cart = await _context.ShoppingCarts
                    .Include(c => c.ShoppingCartItems)
                    .ThenInclude(i => i.Product)
                    .FirstOrDefaultAsync(c => c.UserID == userId);

                if (cart == null || !cart.ShoppingCartItems.Any())
                    return NotFound("Shopping cart is either empty or does not exist.");

                var result = cart.ShoppingCartItems.Select(item => new
                {
                    item.ShoppingCartItemID,
                    item.ProductID,
                    ProductName = item.Product.ProductName,
                    ProductPrice = item.Product.Price,
                    Discount = item.Product.DiscountPercentage,
                    item.Quantity,
                    GrandTotal = item.GrandTotal,
                    item.CreatedAt,
                    item.UpdatedAt
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // ➕ POST Add Product to Shopping Cart
        [HttpPost]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartRequest request)
        {
            int userID = request.UserID;
            int productID = request.ProductID;
            int quantity = request.Quantity;

            // Validate user existence
            var userExists = await _context.Users.AnyAsync(u => u.UserID == userID);
            if (!userExists) return BadRequest("Invalid UserID. User does not exist.");

            // Validate product existence
            var product = await _context.Products.FindAsync(productID);
            if (product == null) return BadRequest("Invalid ProductID. Product does not exist.");

            // Calculate discounted price
            decimal discountedPrice = product.Price * (1 - product.DiscountPercentage / 100);

            // Fetch or create shopping cart for the user
            var shoppingCart = await _context.ShoppingCarts
                .Include(c => c.ShoppingCartItems)
                .FirstOrDefaultAsync(c => c.UserID == userID);

            if (shoppingCart == null)
            {
                shoppingCart = new ShoppingCart
                {
                    UserID = userID,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    ShoppingCartItems = new List<ShoppingCartItem>()
                };
                _context.ShoppingCarts.Add(shoppingCart);
                await _context.SaveChangesAsync(); // Save to generate ShoppingCartID
            }

            // Check if the product is already in the cart
            var existingCartItem = shoppingCart.ShoppingCartItems
                .FirstOrDefault(c => c.ProductID == productID);

            if (existingCartItem != null)
            {
                existingCartItem.Quantity += quantity;
                existingCartItem.GrandTotal = existingCartItem.Quantity * discountedPrice;
                existingCartItem.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                var newCartItem = new ShoppingCartItem
                {
                    ShoppingCartID = shoppingCart.ShoppingCartID,
                    ProductID = productID,
                    Quantity = quantity,
                    GrandTotal = quantity * discountedPrice,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                shoppingCart.ShoppingCartItems.Add(newCartItem);
            }

            shoppingCart.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Product added or updated in the cart.",
                cartItems = shoppingCart.ShoppingCartItems.Select(i => new
                {
                    i.ProductID,
                    i.Quantity,
                    i.GrandTotal
                }).ToList()
            });
        }


        // 🔄 PUT Update Quantity in Shopping Cart Item
        [HttpPut("{userId}/item/{itemId}")]
        public async Task<IActionResult> UpdateQuantity(int itemId, [FromBody] ShoppingCartUpdateRequest request)
        {
            if (request.Quantity < 1)
                return BadRequest("Quantity must be at least 1.");

            var cartItem = await _context.ShoppingCartItems
                .Include(i => i.Product)
                .FirstOrDefaultAsync(i => i.ShoppingCartItemID == itemId);

            if (cartItem == null)
                return NotFound("Shopping cart item not found.");

            Console.WriteLine($"Updating item: {itemId}, New Quantity: {request.Quantity}");

            decimal discountedPrice = cartItem.Product.Price * (1 - (cartItem.Product.DiscountPercentage / 100));

            cartItem.Quantity = request.Quantity;
            cartItem.GrandTotal = cartItem.Quantity * discountedPrice;
            cartItem.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(cartItem);
        }


        // 🗑️ DELETE Remove Item from Shopping Cart
        [HttpDelete("{userId}/item/{itemId}")]
        public async Task<IActionResult> DeleteFromCart(int itemId)
        {
            var cartItem = await _context.ShoppingCartItems.FindAsync(itemId);
            if (cartItem == null)
            {
                Console.WriteLine($"No cart item found for itemId: {itemId}");
                return NotFound($"Shopping cart item with ID {itemId} not found.");
            }

            Console.WriteLine($"Deleting cart item: {itemId}");

            _context.ShoppingCartItems.Remove(cartItem);
            await _context.SaveChangesAsync();

            return NoContent();
        }


        // 🗑️ DELETE Clear Entire Cart
        [HttpDelete("clear-cart/{userId}")]
        public async Task<IActionResult> ClearCart(int userId)
        {
            var cart = await _context.ShoppingCarts
                .Include(c => c.ShoppingCartItems)
                .FirstOrDefaultAsync(c => c.UserID == userId);

            if (cart == null || !cart.ShoppingCartItems.Any())
                return NotFound("No items in the shopping cart to clear.");

            int removedItems = cart.ShoppingCartItems.Count;

            _context.ShoppingCartItems.RemoveRange(cart.ShoppingCartItems);
            _context.ShoppingCarts.Remove(cart);

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Shopping cart cleared successfully. {removedItems} item(s) removed." });
        }

        public class ShoppingCartUpdateRequest
        {
            public int Quantity { get; set; }
        }

        public class AddToCartRequest
        {
            public int UserID { get; set; }
            public int ProductID { get; set; }
            public int Quantity { get; set; }
        }
    }
}
