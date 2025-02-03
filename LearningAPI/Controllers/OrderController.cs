using Microsoft.AspNetCore.Mvc;
using EDP_API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics.CodeAnalysis;

namespace EDP_API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class OrderController : ControllerBase
    {
        private readonly MyDbContext _context;

        public OrderController(MyDbContext context)
        {
            _context = context;
        }

        // Get all orders
        [HttpGet]
        public IActionResult GetAll()
        {
            var orders = _context.Orders
                .Include(o => o.User) // Include user details
                .Include(o => o.ShoppingCart)
                    .ThenInclude(c => c.CartItems) // Ensure CartItems are included
                        .ThenInclude(ci => ci.Product) // Include products for each cart item
                .Include(o => o.OrderSummaryItems) // Ensure OrderSummaryItems are included
                    .ThenInclude(osi => osi.Product) // Include product details in OrderSummaryItems
                .ToList(); // Fetch all orders as a list

            if (orders == null || !orders.Any())
                return NotFound("No orders found.");

            var data = orders.Select(o => new
            {
                o.OrderID,
                o.OrderDate,
                o.OrderStatus,
                o.CreatedAt,
                o.UpdatedAt,
                o.UserID,
                User = o.User == null ? null : new
                {
                    o.User.FirstName,
                    o.User.LastName
                },
                ShoppingCart = o.ShoppingCart == null ? null : new
                {
                    CartItems = o.ShoppingCart.CartItems?.Select(ci => new
                    {
                        ci.CartItemID,
                        ci.ProductID,
                        Product = ci.Product == null ? null : new
                        {
                            ci.Product.ProductID,
                            ci.Product.ProductName,
                            ci.Product.Price
                        },
                        ci.Quantity
                    })
                },
                OrderSummaryItems = o.OrderSummaryItems?.Select(osi => new
                {
                    osi.OrderSummaryItemID,
                    osi.Subtotal,
                    Product = osi.Product == null ? null : new
                    {
                        osi.Product.ProductID,
                        osi.Product.ProductName,
                        osi.Product.Price
                    }
                }),
                TotalAmount = o.OrderSummaryItems?.Sum(osi => osi.Subtotal) ?? 0
            });

            return Ok(data);
        }

        // Get individual order
        [HttpGet("{id}")]
        public IActionResult GetOrder(int id)
        {
            var order = _context.Orders
                .Include(o => o.User) // Include user details
                .Include(o => o.ShoppingCart)
                    .ThenInclude(c => c.CartItems) // Include CartItems for ShoppingCart
                        .ThenInclude(ci => ci.Product) // Include product details for CartItem
                .Include(o => o.OrderSummaryItems) // Include OrderSummaryItems
                    .ThenInclude(osi => osi.Product) // Include product for OrderSummaryItems
                .FirstOrDefault(o => o.OrderID == id); // Fetch order by ID

            if (order == null)
                return NotFound($"Order with ID {id} not found.");

            var data = new
            {
                order.OrderID,
                order.OrderDate,
                order.OrderStatus,
                order.CreatedAt,
                order.UpdatedAt,
                order.UserID,
                User = order.User == null ? null : new
                {
                    order.User.FirstName,
                    order.User.LastName
                },
                ShoppingCart = order.ShoppingCart == null ? null : new
                {
                    CartItems = order.ShoppingCart.CartItems?.Select(ci => new
                    {
                        ci.CartItemID,
                        ci.ProductID,
                        Product = ci.Product == null ? null : new
                        {
                            ci.Product.ProductID,
                            ci.Product.ProductName,
                            ci.Product.Price
                        },
                        ci.Quantity
                    })
                },
                OrderSummaryItems = order.OrderSummaryItems?.Select(osi => new
                {
                    osi.OrderSummaryItemID,
                    osi.Subtotal,
                    Product = osi.Product == null ? null : new
                    {
                        osi.Product.ProductID,
                        osi.Product.ProductName,
                        osi.Product.Price
                    }
                }),
                TotalAmount = order.OrderSummaryItems?.Sum(osi => osi.Subtotal) ?? 0
            };

            return Ok(data);
        }

        // Create a new order
        [HttpPost, Authorize]
        public IActionResult CreateOrder([FromBody] Order order)
        {
            try
            {
                int userId = GetUserId();
                var now = DateTime.Now;

                var shoppingCart = _context.ShoppingCarts.Find(order.ShoppingCartID);
                if (shoppingCart == null)
                {
                    return BadRequest("Shopping cart does not exist.");
                }

                var newOrder = new Order
                {
                    OrderDate = now,
                    OrderStatus = order.OrderStatus,
                    CreatedAt = now,
                    UpdatedAt = now,
                    UserID = userId,
                    ShoppingCartID = order.ShoppingCartID // Use the ShoppingCartID from the incoming order
                };

                _context.Orders.Add(newOrder);
                _context.SaveChanges();
                return CreatedAtAction(nameof(GetOrder), new { id = newOrder.OrderID }, newOrder);
            }
            catch (Exception)
            {
                return StatusCode(500, "An error occurred while creating the order.");
            }
        }

        // Update an order
        [HttpPut("{id}"), Authorize]
        public IActionResult UpdateOrder(int id, Order order)
        {
            var existingOrder = _context.Orders.Find(id);
            if (existingOrder == null) return NotFound();

            int userId = GetUserId();
            if (existingOrder.UserID != userId) return Forbid();

            existingOrder.OrderStatus = order.OrderStatus;
            existingOrder.UpdatedAt = DateTime.Now;

            _context.SaveChanges();
            return Ok();
        }

        // Delete an order
        [HttpDelete("{id}"), Authorize]
        public IActionResult DeleteOrder(int id)
        {
            var order = _context.Orders.Find(id);
            if (order == null) return NotFound();

            int userId = GetUserId();
            if (order.UserID != userId) return Forbid();

            _context.Orders.Remove(order);
            _context.SaveChanges();
            return Ok();
        }

        // Helper method to get the current user's ID from claims
        private int GetUserId()
        {
            return Convert.ToInt32(User.Claims
                .FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
        }
    }
}
