using LearningAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LearningAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductCategoryController : ControllerBase
    {
        private readonly MyDbContext _context;
        private readonly ILogger<ProductCategoryController> _logger;

        public ProductCategoryController(MyDbContext context, ILogger<ProductCategoryController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // 📋 GET All Categories
        [HttpGet]
        public async Task<IActionResult> GetAllCategories()
        {
            var categories = await _context.ProductCategory.ToListAsync();
            return Ok(categories);
        }

        // 📌 GET Category by ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCategory(int id)
        {
            var category = await _context.ProductCategory.FindAsync(id);
            if (category == null)
                return NotFound($"Category with ID {id} not found.");

            return Ok(category);
        }

        // ➕ POST Add New Category
        [HttpPost]
        public async Task<IActionResult> AddCategory([FromBody] ProductCategory category)
        {
            if (string.IsNullOrWhiteSpace(category.ProductCategoryName))
                return BadRequest(new { message = "Category name is required." });

            category.CreatedAt = DateTime.UtcNow;

            _context.ProductCategory.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategory), new { id = category.ProductCategoryID }, category);
        }

        // 📝 PUT Update Category
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] ProductCategory category)
        {
            var existingCategory = await _context.ProductCategory.FindAsync(id);
            if (existingCategory == null)
                return NotFound($"Category with ID {id} not found.");

            if (!string.IsNullOrWhiteSpace(category.ProductCategoryName))
                existingCategory.ProductCategoryName = category.ProductCategoryName.Trim();

            existingCategory.CreatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(existingCategory);
        }

        // 🗑️ DELETE Category
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.ProductCategory.FindAsync(id);
            if (category == null)
                return NotFound($"Category with ID {id} not found.");

            _context.ProductCategory.Remove(category);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
