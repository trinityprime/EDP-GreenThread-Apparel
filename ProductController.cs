using EDP_API.Models;
using EDP_API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static EDP_API.Models.Product;

namespace EDP_API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly MyDbContext _context;

        public ProductController(MyDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            var products = _context.Products.ToList();  // Fetch all products
            return Ok(products);
        }


        // GET: /Product/{id}
        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var product = _context.Products.FirstOrDefault(x => x.ProductID == id);
            if (product == null)
            {
                return NotFound($"Product with ID {id} not found.");
            }
            return Ok(product);
        }

        // POST: /Product
        [HttpPost]
        public IActionResult AddProduct(Product product)
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(product.ProductName))
            {
                return BadRequest("Product name is required.");
            }

            if (product.Price <= 0)
            {
                return BadRequest("Price must be greater than 0.");
            }

            if (product.Stock < 0)
            {
                return BadRequest("Stock cannot be negative.");
            }

            if (!Enum.IsDefined(typeof(Product_Size), product.ProductSize))
            {
                return BadRequest("Invalid size. Valid options are S, M, or L.");
            }

            // Create a new Product
            var newProduct = new Product
            {
                ProductName = product.ProductName.Trim(),
                Price = product.Price,
                Stock = product.Stock,
                ProductSize = product.ProductSize,
            };

            // Save to database
            _context.Products.Add(newProduct);
            _context.SaveChanges();

            // Return the newly created product with CreatedAtAction for best practice
            return CreatedAtAction(nameof(GetById), new { id = newProduct.ProductID }, newProduct);
        }
    }
}
