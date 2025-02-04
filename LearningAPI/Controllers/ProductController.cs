using AutoMapper;
using EDP_API.Models;
using LearningAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.IO;
using System.Security.Claims;

namespace LearningAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly MyDbContext context;
        private readonly IMapper mapper;
        private readonly ILogger<ProductController> logger;

        public ProductController(MyDbContext context, IMapper mapper, ILogger<ProductController> logger)
        {
            this.context = context;
            this.mapper = mapper;
            this.logger = logger;
        }

        // Method to handle file upload
        private string UploadImageFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return null;

            try
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "images");

                // Ensure folder exists
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Create a unique file name to avoid conflicts
                var fileName = Path.GetRandomFileName() + Path.GetExtension(file.FileName);
                var filePath = Path.Combine(uploadsFolder, fileName);

                // Save the file to the server
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    file.CopyTo(stream);
                }

                // Return the relative path to the file
                return Path.Combine("uploads", "images", fileName);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error uploading file");
                return null;
            }
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<ProductDTO>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll(string? search)
        {
            try
            {
                IQueryable<Product> result = context.Products;
                if (search != null)
                {
                    result = result.Where(x => x.ProductName.Contains(search));
                }
                var list = await result.OrderByDescending(x => x.CreatedAt).ToListAsync();
                IEnumerable<ProductDTO> data = list.Select(mapper.Map<ProductDTO>);
                return Ok(data);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error when getting all products");
                return StatusCode(500);
            }
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ProductDTO), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetProduct(int id)
        {
            try
            {
                var product = context.Products
                              .Include(p => p.ProductCategory)
                              .FirstOrDefault(p => p.Id == id);
                if (product == null)
                {
                    return NotFound();
                }
                ProductDTO data = mapper.Map<ProductDTO>(product);
                return Ok(data);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error when getting product by id");
                return StatusCode(500);
            }
        }

        [HttpPost]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AddProduct([FromForm] ProductDTO product, [FromForm] IFormFile imageFile)
        {
            if (imageFile == null || imageFile.Length == 0)
            {
                return BadRequest(new { message = "No file uploaded." });
            }

            // Validate file type (optional)
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var fileExtension = Path.GetExtension(imageFile.FileName).ToLower();
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest(new { message = "Invalid file type. Only image files are allowed." });
            }

            // Create directory for images if it doesn't exist
            var imageFolderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "images");
            if (!Directory.Exists(imageFolderPath))
            {
                Directory.CreateDirectory(imageFolderPath);
            }

            // Generate unique file name
            var fileName = Guid.NewGuid().ToString() + fileExtension;
            var filePath = Path.Combine(imageFolderPath, fileName);

            // Save the image file to the server
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await imageFile.CopyToAsync(stream);
            }

            // Save the product in the database
            var newProduct = new Product
            {
                ProductName = product.ProductName,
                ProductDescription = product.ProductDescription,
                Price = product.Price,
                Stock = product.Stock,
                Size = product.Size,
                ProductCategoryID = product.ProductCategoryID,
                ImageFile = $"/uploads/images/{fileName}" // Store the relative file path in the database
            };

            context.Products.Add(newProduct);
            await context.SaveChangesAsync();

            return Ok(new { message = "Product added successfully!" });
        }


        // UpdateProduct with file upload handling (optional)
        [HttpPut("{id}")]
        [Consumes("multipart/form-data")]  // Explicitly specify multipart form data
        public async Task<IActionResult> UpdateProduct(int id, [FromForm] UpdateProduct product, [FromForm] IFormFile imageFile)
        {
            try
            {
                var myProduct = await context.Products.FindAsync(id);
                if (myProduct == null)
                {
                    return NotFound();
                }

                if (product.ProductName != null)
                {
                    myProduct.ProductName = product.ProductName.Trim();
                }
                if (product.ProductDescription != null)
                {
                    myProduct.ProductDescription = product.ProductDescription.Trim();
                }
                if (product.Price > 0)
                {
                    myProduct.Price = product.Price;
                }
                if (product.Stock > 0)
                {
                    myProduct.Stock = product.Stock;
                }
                if (product.Size != null)
                {
                    myProduct.Size = product.Size;
                }
                if (imageFile != null)
                {
                    // If an image file is provided, update the image path
                    myProduct.ImageFile = UploadImageFile(imageFile);
                }
                if (product.ProductCategoryID != null)
                {
                    myProduct.ProductCategoryID = product.ProductCategoryID;
                }
                myProduct.UpdatedAt = DateTime.Now;

                await context.SaveChangesAsync();
                return NoContent(); // 204 No Content
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error when updating product");
                return StatusCode(500);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            try
            {
                var myProduct = await context.Products.FindAsync(id);
                if (myProduct == null)
                {
                    return NotFound();
                }

                context.Products.Remove(myProduct);
                await context.SaveChangesAsync();
                return NoContent(); // 204 No Content
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error when deleting product");
                return StatusCode(500);
            }
        }
    }
}
