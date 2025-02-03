using Microsoft.AspNetCore.Mvc;
using LearningAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using EDP_API;

namespace LearningAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ShoppingCartController : ControllerBase
    {
        private readonly MyDbContext _context;

        public ShoppingCartController(MyDbContext context)
        {
            _context = context;
        }

        // GET: /ShoppingCart
        [HttpGet]
        public IActionResult GetAll()
        {
            IQueryable<ShoppingCart> result = _context.ShoppingCarts;
            var list = result.OrderByDescending(x => x.CreatedAt).ToList();
            return Ok(list);
        }

        // GET: /ShoppingCart/{id}
        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var shoppingCart = _context.ShoppingCarts.FirstOrDefault(x => x.ShoppingCartID == id);
            if (shoppingCart == null)
            {
                return NotFound($"Shopping cart with ID {id} not found.");
            }
            return Ok(shoppingCart);
        }

        // POST: /ShoppingCart
        [HttpPost]
        public IActionResult AddShoppingCart([FromBody] ShoppingCart shoppingCart)
        {
            if (shoppingCart == null)
            {
                return BadRequest("ShoppingCart data is required.");
            }

            // Validate UserID and CartItemID
            if (shoppingCart.UserID == 0 || shoppingCart.CartItemID == 0)
            {
                return BadRequest("UserID and CartItemID are required.");
            }

            // Check if the CartItemID exists in the CartItems table
            var cartItemExists = _context.CartItems.Any(c => c.CartItemID == shoppingCart.CartItemID);
            if (!cartItemExists)
            {
                return BadRequest("The provided CartItemID does not exist.");
            }

            var now = DateTime.Now;

            var newShoppingCart = new ShoppingCart
            {
                UserID = shoppingCart.UserID,
                CartItemID = shoppingCart.CartItemID,
                GrandTotal = shoppingCart.GrandTotal,
                Discount = shoppingCart.Discount,
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.ShoppingCarts.Add(newShoppingCart);
            _context.SaveChanges();

            return CreatedAtAction(nameof(GetById), new { id = newShoppingCart.ShoppingCartID }, newShoppingCart);
        }

        // PUT: /ShoppingCart/{id}
        [HttpPut("{id}")]
        public IActionResult UpdateShoppingCart(int id, [FromBody] ShoppingCart shoppingCart)
        {
            if (shoppingCart == null || id != shoppingCart.ShoppingCartID)
            {
                return BadRequest("Invalid data or ID mismatch.");
            }

            var existingShoppingCart = _context.ShoppingCarts.FirstOrDefault(x => x.ShoppingCartID == id);
            if (existingShoppingCart == null)
            {
                return NotFound($"Shopping cart with ID {id} not found.");
            }

            existingShoppingCart.UserID = shoppingCart.UserID;
            existingShoppingCart.GrandTotal = shoppingCart.GrandTotal;
            existingShoppingCart.Discount = shoppingCart.Discount;
            existingShoppingCart.UpdatedAt = DateTime.Now;

            _context.SaveChanges();

            return NoContent(); // Return 204 No Content to indicate successful update
        }
        // DELETE: /ShoppingCart/{id}
        [HttpDelete("{id}")]
        public IActionResult DeleteShoppingCart(int id)
        {
            var shoppingCart = _context.ShoppingCarts.FirstOrDefault(x => x.ShoppingCartID == id);
            if (shoppingCart == null)
            {
                return NotFound($"Shopping cart with ID {id} not found.");
            }

            _context.ShoppingCarts.Remove(shoppingCart);
            _context.SaveChanges();

            return NoContent(); // Return 204 No Content to indicate successful deletion
        }
    }
}