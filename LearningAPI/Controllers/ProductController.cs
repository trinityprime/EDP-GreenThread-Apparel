using AutoMapper;
using LearningAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace LearningAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly MyDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<ProductController> _logger;

        public ProductController(MyDbContext context, IMapper mapper, ILogger<ProductController> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        // 🖼️ Handle Multiple Image Uploads (Now Nullable)
        private List<string>? UploadImageFiles(List<IFormFile>? files)
        {
            if (files == null || files.Count == 0) return null; // ✅ Return null instead of empty list

            var uploadedPaths = new List<string>();
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "images");

            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            foreach (var file in files)
            {
                if (file.Length > 0)
                {
                    var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        file.CopyTo(stream);
                    }

                    uploadedPaths.Add($"/uploads/images/{fileName}");
                }
            }
            return uploadedPaths.Count > 0 ? uploadedPaths : null;
        }

        // 📋 GET All Products with Optional Search
        [HttpGet]
        public async Task<IActionResult> GetAll(string? search)
        {
            try
            {
                IQueryable<Product> query = _context.Products;

                if (!string.IsNullOrEmpty(search))
                    query = query.Where(p => p.ProductName.Contains(search) || p.ProductDescription.Contains(search));

                var products = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
                return Ok(products);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching products");
                return StatusCode(500, "Internal Server Error");
            }
        }

        // 📌 GET Product by ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProduct(int id)
        {
            try
            {
                var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductID == id);

                if (product == null)
                    return NotFound("Product not found");

                _logger.LogInformation($"Product Category: {product.Category}");

                return Ok(product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching product");
                return StatusCode(500, "Internal Server Error");
            }
        }

        // 🛒 POST Add New Product
        [HttpPost]
        public async Task<IActionResult> AddProduct([FromForm] Product product, [FromForm] List<IFormFile>? imageFiles)
        {
            try
            {
                if (product == null)
                    return BadRequest(new { message = "Invalid request. Check JSON structure." });

                // Validate size
                if (!Enum.IsDefined(typeof(ProductSize), product.Size))
                    return BadRequest(new { message = $"Invalid size value. Allowed values: {string.Join(", ", Enum.GetNames(typeof(ProductSize)))}" });

                // Validate ProductCategory
                if (!Enum.IsDefined(typeof(ProductCategory), product.Category))
                    return BadRequest(new { message = $"Invalid category value. Allowed values: {string.Join(", ", Enum.GetNames(typeof(ProductCategory)))}" });

                // ✅ Set ImageFiles only if images are uploaded
                product.ImageFiles = UploadImageFiles(imageFiles);

                // Set timestamps
                product.CreatedAt = DateTime.UtcNow;
                product.UpdatedAt = DateTime.UtcNow;

                // Add to database
                _context.Products.Add(product);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetProduct), new { id = product.ProductID }, product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding product");
                return StatusCode(500, "Internal Server Error");
            }
        }

        // 📝 PUT Update Product (Supports Partial Updates)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(int id, [FromForm] Product product, [FromForm] List<IFormFile>? imageFiles)
        {
            try
            {
                var existingProduct = await _context.Products.FindAsync(id);
                if (existingProduct == null)
                    return NotFound("Product not found");

                if (!string.IsNullOrEmpty(product.ProductName))
                    existingProduct.ProductName = product.ProductName.Trim();
                if (!string.IsNullOrEmpty(product.ProductDescription))
                    existingProduct.ProductDescription = product.ProductDescription.Trim();
                if (product.Price > 0)
                    existingProduct.Price = product.Price;
                if (product.Stock >= 0)
                    existingProduct.Stock = product.Stock;
                if (product.Size != null)
                    existingProduct.Size = product.Size;
                if (product.Status != null)
                    existingProduct.Status = product.Status;
                if (product.DiscountPercentage >= 0)
                    existingProduct.DiscountPercentage = product.DiscountPercentage;
                if (Enum.IsDefined(typeof(ProductCategory), product.Category))
                    existingProduct.Category = product.Category;

                // ✅ Only update ImageFiles if new images are uploaded
                var newImages = UploadImageFiles(imageFiles);
                if (newImages != null)
                    existingProduct.ImageFiles = newImages;

                existingProduct.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product");
                return StatusCode(500, "Internal Server Error");
            }
        }

        // 🗑️ DELETE Product
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            try
            {
                var product = await _context.Products.FindAsync(id);
                if (product == null)
                    return NotFound("Product not found");

                _context.Products.Remove(product);
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product");
                return StatusCode(500, "Internal Server Error");
            }
        }
    }
}
